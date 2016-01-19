"use strict";

const config = require("../config");
const q = require("q");
const request = require("request");

class StoriesRepository
{
    static getAction(name)
    {
        return `${config.jiraUrl}/${name}`;
    }

    static getStoriesBetweenTagsForProjects(projectsAndTags)
    {
        let deferred = q.defer();

        request({
            method: "GET",
            url: this.getAction("rest/api/2/search"),
            auth: {
                user: config.username,
                pass: config.password
            },
            qs: {
                jql: this.prepareJQLForTags(projectsAndTags),
                maxResults: 99999
            },
            headers: {
                "Content-Type": "application/json"
            }
        }, (error, response, data) =>
        {
            if (error)
            {
                deferred.reject(error);
                return;
            }

            let parsedData = JSON.parse(data);
            if (!parsedData.issues)
            {
                deferred.reject();
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
                    url: `${config.jiraUrl}/browse/${issue.key}`
                };
            });

            deferred.resolve(jiraStories);
        });

        return deferred.promise;
    }

    static prepareJQLForTags(projectsAndTags)
    {
        let query = "project = \"Company Accounts Tax Online\" AND \"Git Tag\" in (";
        query += projectsAndTags.map(projectAndTags =>
        {
            return projectAndTags.tags.map(tag => projectAndTags.name + "-" + tag).join(", ");
        }).join(", ");
        query += ") ORDER BY status ASC, team ASC, key DESC";
        return query;
    }
}

module.exports = StoriesRepository;