"use strict";

const config = require("../config");
const q = require("q");
const request = require("request");

module.exports = function startBuild(projectName, version)
{
    let deferred = q.defer();
    let requestOptions = {
        method: "POST",
        url: `${config.ciBuildUrl}/job/${projectName}/buildWithParameters`,
        auth:
        {
            user: config.ciBuildUserName,
            pass: config.ciBuildApiToken
        },
        headers:
        {
            "Content-Type": "application/json"
        },
        qs:
        {
            delay: "50sec",
            TAG: version
        }
    };
    let responseHandler = (error, response) =>
    {
        if (error)
        {
            deferred.reject(
                {
                    data: error,
                    message: "Unknown error when starting project build.",
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
                    message = "Incorrect CI-BUILD username or password. Please change it in configuration to correct value.";
                    break;
                case 403:
                    message = "CI-BUILD rejected your login request. Please try logging in in the browser first - captcha might be blocking your login requests.";
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

        deferred.resolve();
    };

    request(requestOptions, responseHandler);

    return deferred.promise;
};