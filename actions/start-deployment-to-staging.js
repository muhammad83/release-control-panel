"use strict";

const config = require("../config");
const q = require("q");
const request = require("request");

module.exports = function startDeploymentToStaging(projectName, version)
{
    let deferred = q.defer();
    let requestOptions = {
        method: "POST",
        url: `${config.ciStagingUrl}/buildWithParameters`,
        auth:
        {
            user: config.ciStagingUserName,
            pass: config.ciStagingApiToken
        },
        headers:
        {
            "Content-Type": "application/json"
        },
        qs:
        {
            APP: projectName,
            delay: "50sec",
            VERSION: version
        }
    };
    let responseHandler = (error, response, data) =>
    {
        if (error)
        {
            deferred.reject(
            {
                data: error,
                message: "Unknown error when starting project deployment.",
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
                    message = "Incorrect username or password. Please change it in configuration to correct value.";
                    break;
                case 403:
                    message = "Jenkins rejected your login request. Please try logging in in the browser first - captcha might be blocking your login requests.";
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