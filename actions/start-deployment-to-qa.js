"use strict";

const config = require("../config");
const q = require("q");
const request = require("request");

module.exports = function startDeploymentToQa(location, projectName, version)
{
    let environment, userName, apiKey;

    if (location == "left")
    {
        environment = config.ciQaLeftUrl;
        userName = config.ciQaLeftUserName;
        apiKey = config.ciQaLeftApiToken;
    }
    else
    {
        environment = config.ciQaRightUrl;
        userName = config.ciQaRightUserName;
        apiKey = config.ciQaRightApiToken;
    }

    let deferred = q.defer();
    let requestOptions = {
        method: "POST",
        url: `${environment}/buildWithParameters`,
        auth:
        {
            user: userName,
            pass: apiKey
        },
        headers:
        {
            "Content-Type": "application/json"
        },
        qs:
        {
            APP: projectName,
            APP_BUILD_NUMBER: version,
            delay: "50sec"
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