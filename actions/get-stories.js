"use strict";

const config = require("../config");
const exec = require("child_process").exec;
const getStoriesFromJira = require("./../helpers/get-stories-from-jira");
const path = require("path");
const prepareJQLForEpics = require("../helpers/prepare-jql-for-epics");
const prepareJQLForTickets = require("../helpers/prepare-jql-for-tickets");
const q = require("q");
const request = require("request");
const workspace = process.env.WORKSPACE;

function checkIfIssueExists(key)
{
    let deferred = q.defer();
    let requestOptions = {
        method: "GET",
        url: `${config.jiraUrl}/rest/api/2/issue/${key}/watchers`,
        auth:
        {
            user: config.jiraUserName,
            pass: config.jiraPassword
        },
        headers:
        {
            "Content-Type": "application/json"
        }
    };
    let responseHandler = (error, response) =>
    {
        if (error)
        {
            deferred.reject(
                {
                    data: error,
                    message: "Unknown error when searching JIRA tickets.",
                    status: 500
                });
            return;
        }

        deferred.resolve(response.statusCode === 200);
    };

    request(requestOptions, responseHandler);

    return deferred.promise;
}

function findJiraKeysInProjectsGitLog(project)
{
    let deferred = q.defer();
    let serviceCmdOptions = {cwd: path.join(workspace, project.name)};
    let startTag = project.tags[project.tags.length - 1];
    let endTag = project.tags[0];
    let command = `git log --date-order --pretty=format:"%s----__-----%h----__-----%aI----__-----%an" release/${startTag}...release/${endTag} | grep -v "Merge" | sort`;

    exec(command, serviceCmdOptions, function (error, stdout)
    {
        if (error)
        {
            deferred.reject(
                {
                    data: error,
                    message: "Unknown error when looking for JIRA tickets in GIT log. Check if your $WORKSPACE path contains GIT repositories of the projects.",
                    status: 500
                });
            return;
        }

        let jiraNumbers = stdout.split("\n")
            .map(line =>
            {
                let numbers = [];
                let regex = /[A-Z]+[-_]\d+/gi;
                if (regex.test(line))
                {
                    regex.lastIndex = 0;
                    var result;
                    while (result = regex.exec(line))
                    {
                        numbers.push(result[0]);
                    }
                }
                return numbers;
            })
            .reduce((left, right) => left.concat(right), []);

        deferred.resolve(jiraNumbers);
    });

    return deferred.promise;
}

function getStoriesFromGitLog(projectsAndTags)
{
    let promises = projectsAndTags.map(project => findJiraKeysInProjectsGitLog(project));
    let foundKeys;
    return q.all(promises)
        .then(results =>
        {
            let flattenedResults = results.reduce((left, right) => left.concat(right), []);
            let uniqueResults = [];
            for (let key of flattenedResults)
            {
                if (uniqueResults.indexOf(key) !== -1)
                    continue;

                uniqueResults.push(key);
            }
            return uniqueResults;
        })
        .then(keys =>
        {
            foundKeys = keys;
            return q.all(keys.map(key => checkIfIssueExists(key)));
        })
        .then(results =>
        {
            return foundKeys.filter((key, index) => results[index]);
        });
}

function linkEpicsToStories(storiesList)
{
    let epicsList = storiesList.map(story => story.epicKey).filter(key => !!key);
    if (epicsList.length == 0)
    {
        return storiesList;
    }

    let jql = prepareJQLForEpics(epicsList);
    return getStoriesFromJira(jql)
        .then(epics =>
        {
            storiesList.forEach(story =>
            {
                if (!story.epicKey)
                    return;

                story.epic = epics.find(epic => epic.ticketNumber == story.epicKey);
            });
            return storiesList;
        });
}

module.exports = function getStories(projectsAndTags)
{
    return getStoriesFromGitLog(projectsAndTags)
        .then(jiraNumbers =>
        {
            let containsTags = projectsAndTags.some(project => project.tags.length);
            if (!jiraNumbers.length && !containsTags)
            {
                return [];
            }

            let jql = prepareJQLForTickets(projectsAndTags, jiraNumbers);
            return getStoriesFromJira(jql);
        })
        .then(stories => linkEpicsToStories(stories));
};