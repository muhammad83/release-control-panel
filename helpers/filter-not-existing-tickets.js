"use strict";

const config = require("../config");
const findTicketsInText = require("./find-tickets-in-text");
const prepareJqlForTickets = require("./prepare-jql-for-tickets");
const q = require("q");
const request = require("request");

module.exports = function filterNotExistingTickets(tickets)
{
    let deferred = q.defer();
    let searchTicketsQuery = prepareJqlForTickets(null, tickets);

    let requestOptions =
    {
        method: "GET",
        url: `${config.jiraUrl}/rest/api/2/search`,
        auth:
        {
            user: config.jiraUserName,
            pass: config.jiraPassword
        },
        qs:
        {
            jql: searchTicketsQuery,
            maxResults: 1
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

        // Got incorrect tickets. Time to find them and remove from the array.
        if (response.statusCode === 400)
        {
            let missingTickets = findTicketsInText(data);
            let filteredTickets = tickets.filter(ticket => missingTickets.indexOf(ticket) === -1);
            deferred.resolve(filteredTickets);
        }
        else if (response.statusCode !== 200)
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

        deferred.resolve(tickets);
    };

    request(requestOptions, responseHandler);
    
    return deferred.promise;
};