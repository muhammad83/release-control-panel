"use strict";

const config = require("../config");
const prepareJQLForTickets = require("../helpers/prepare-jql-for-tickets");
const q = require("q");
const request = require("request");

module.exports = function createReleaseFilter(releaseName, projectsAndTags, tickets)
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
            jql: prepareJQLForTickets(projectsAndTags, tickets)
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
};