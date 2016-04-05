"use strict";

const config = require("../config");
const q = require("q");
const request = require("request");

module.exports = function getStoriesFromJira(jql, maxResults)
{
    if (!maxResults)
    {
        maxResults = 99999;
    }

    let deferred = q.defer();
    // Make sure NOT to search for empty query...
    if (!jql || jql.trim().length === 0)
    {
        deferred.resolve([]);
        return deferred.promise;
    }

    let requestOptions =
    {
        method: "POST",
        url: `${config.jiraUrl}/rest/api/2/search`,
        auth:
        {
            user: config.jiraUserName,
            pass: config.jiraPassword
        },
        json:
        {
            jql: jql,
            maxResults: maxResults
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
            if (typeof(data) === "string")
                parsedData = JSON.parse(data);
            else
                parsedData = data;
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
};