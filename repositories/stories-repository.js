"use strict";

const config = require("../config");
const exec = require("child_process").exec;
const path = require("path");
const q = require("q");
const request = require("request");
const workspace = process.env.WORKSPACE;

class StoriesRepository
{
    static checkIfIssueExists(key)
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
        let responseHandler = (error, response, data) =>
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

    static createReleaseFilter(releaseName, projectsAndTags)
    {
        let deferred = q.defer();
        let requestOptions = {
            method: "POST",
            url: `${config.jiraUrl}/rest/api/2/filter`,
            auth:
            {
                user: config.jiraUserName,
                pass: config.jiraPassword
            },
            body: JSON.stringify(
            {
                description: `List of tasks included in '${releaseName}' release.`,
                favourite: true,
                name: releaseName,
                jql: this.prepareJQLForTags(projectsAndTags, [])
            }),
            headers:
            {
                "Content-Type": "application/json"
            }
        };
        let responseHandler = (error, response, data) =>
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

            if (response.statusCode !== 200)
            {
                let message = "";

                switch (response.statusCode)
                {
                    case 400:
                        try
                        {
                            let parsedErrorData = JSON.parse(response.body);
                            for (let key in parsedErrorData.errors)
                            {
                                if (!parsedErrorData.errors.hasOwnProperty(key))
                                    continue;

                                let value = parsedErrorData.errors[key];
                                message += `${key}: ${value}\n`;
                            }
                        }
                        catch (ex)
                        {
                            message = `Unknown error: ${response.body}`;
                        }
                        break;
                    case 401:
                        message = "Incorrect JIRA username or password. Please change it in configuration to correct value.";
                        break;
                    case 403:
                        message = "JIRA rejected your login request. Please try logging in in the browser first - captcha might be blocking your login requests.";
                        break;
                }

                deferred.reject(
                {
                    data: response.body,
                    message: message,
                    status: response.statusCode
                });
                return;
            }

            let resultData;

            try
            {
                let parsedData = JSON.parse(data);
                resultData =
                {
                    id: parsedData.id,
                    name: parsedData.name,
                    url: parsedData.viewUrl
                };
            }
            catch (ex)
            {
                deferred.reject(
                {
                    data: data,
                    message: "Could not parse JSON data from JIRA.",
                    status: 500
                });
                return;
            }

            deferred.resolve(resultData);
        };

        request(requestOptions, responseHandler);

        return deferred.promise;
    }

    static findJiraKeysInProjectsGitLog(project)
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
    
    static getStories(projectsAndTags)
    {
        return this.getStoriesFromGitLog(projectsAndTags)
            .then(jiraNumbers =>
            {
                let containsTags = projectsAndTags.some(project => project.tags.length);
                if (!jiraNumbers.length && !containsTags)
                {
                    return [];
                }

                let jql = this.prepareJQLForTags(projectsAndTags, jiraNumbers);
                return this.getStoriesFromJira(jql);
            })
            .then(stories => this.linkEpicsToStories(stories));
    }

    static getStoriesFromGitLog(projectsAndTags)
    {
        let promises = projectsAndTags.map(project => this.findJiraKeysInProjectsGitLog(project));
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
                return q.all(keys.map(key => this.checkIfIssueExists(key)));
            })
            .then(results =>
            {
                return foundKeys.filter((key, index) => results[index]);
            });
    }

    static getStoriesFromJira(jql)
    {
        let deferred = q.defer();
        let requestOptions = {
            method: "GET",
            url: `${config.jiraUrl}/rest/api/2/search`,
            auth: {
                user: config.jiraUserName,
                pass: config.jiraPassword
            },
            qs: {
                jql: jql,
                maxResults: 99999
            },
            headers: {
                "Content-Type": "application/json"
            }
        };
        let responseHandler = (error, response, data) =>
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

            if (response.statusCode !== 200)
            {
                let message = null;

                switch (response.statusCode)
                {
                    case 401:
                        message = "Incorrect JIRA username or password. Please change it in configuration to correct value.";
                        break;
                    case 403:
                        message = "JIRA rejected your login request. Please try logging in in the browser first - captcha might be blocking your login requests."
                        break;
                }

                deferred.reject(
                {
                    data: response.body,
                    message: message,
                    status: response.statusCode
                });
                return;
            }

            let parsedData;

            try
            {
                parsedData = JSON.parse(data);
            }
            catch (ex)
            {
                deferred.reject(
                {
                    data: data,
                    message: "Could not parse JSON data from JIRA.",
                    status: 500
                });
                return;
            }

            if (!parsedData.issues)
            {
                deferred.reject(
                {
                    data: data,
                    message: "Parsed JIRA data does not contain issues.",
                    status: 500
                });
                return;
            }

            let jiraStories = parsedData.issues.map(issue =>
            {
                return {
                    ticketNumber: issue.key,
                    message: issue.fields.summary,
                    dateTime: issue.fields.updated,
                    author: issue.fields.creator.displayName,
                    status: issue.fields.status.name,
                    url: `${config.jiraUrl}/browse/${issue.key}`,
                    gitTags: issue.fields.customfield_10900,
                    epicKey: issue.fields.customfield_10008
                };
            });

            deferred.resolve(jiraStories);
        };

        request(requestOptions, responseHandler);

        return deferred.promise;
    }
    
    static linkEpicsToStories(storiesList)
    {
        let epicsList = storiesList.map(story => story.epicKey).filter(key => !!key);
        if (epicsList.length == 0)
        {
            return storiesList;
        }
        
        let jql = this.prepareJQLForEpics(epicsList);
        return this.getStoriesFromJira(jql)
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
    
    static prepareJQLForEpics(epicsKeys)
    {
        return `Key in (${epicsKeys.join(", ")})`;
    }

    static prepareJQLForTags(projectsAndTags, jiraNumbers)
    {
        const separator = ", ";

        let gitTags = projectsAndTags
            .filter(project => project.tags.length)
            .map(projectAndTags => projectAndTags.tags.map(tag => projectAndTags.name + "-" + tag).join(separator))
            .join(separator);
        
        if (jiraNumbers.length > 0)
        {
            let jiraNumbersString = jiraNumbers.join(separator);
            return `project = "Company Accounts Tax Online" AND ("Git Tag" in (${gitTags}) OR Key in (${jiraNumbersString})) ORDER BY status ASC, team ASC, key DESC`;
        }
        else
        {
            return `project = "Company Accounts Tax Online" AND "Git Tag" in (${gitTags}) ORDER BY status ASC, team ASC, key DESC`;
        }
    }
}

module.exports = StoriesRepository;