"use strict";

const config = require("../config");
const q = require("q");
const request = require("request");

class BuildsRepository
{
    static getSuccessfulBuilds(projectName)
    {
        let deferred = q.defer();
        let requestOptions = {
            method: "GET",
            url: `${config.ciBuildUrl}/job/${projectName}/lastSuccessfulBuild/api/json`,
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
                    message: "Unknown error when getting project releases.",
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
                    message: "Could not parse JSON data from CI-BUILD.",
                    status: 500
                });
                return;
            }

            let buildsByBranchNameAction = parsedData.actions.find(action => action.buildsByBranchName);
            let builds = {};

            if (buildsByBranchNameAction)
            {
                let buildsByBranchName = buildsByBranchNameAction.buildsByBranchName;
                for (let property in buildsByBranchName)
                {
                    if (!buildsByBranchName.hasOwnProperty(property))
                        continue;

                    let build = buildsByBranchName[property];
                    let version = property.substring(property.lastIndexOf("/") + 1);
                    builds[version] =
                    {
                        buildNumber: build.buildNumber
                    };
                }
            }

            deferred.resolve(builds);
        };

        request(requestOptions, responseHandler);

        return deferred.promise;
    }

    static getSuccessfulBuildsForProjects(projectNames)
    {
        let promises = projectNames.map(projectName => this.getSuccessfulBuilds(projectName));
        return q.all(promises).then(buildsForProjects =>
        {
            let result = {};
            for (let index = 0; index < projectNames.length; index++)
            {
                result[projectNames[index]] = buildsForProjects[index];
            }
            return result;
        });
    }

    static startBuild(projectName, version)
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
        let responseHandler = (error, response, data) =>
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

            deferred.resolve(data);
        };

        request(requestOptions, responseHandler);

        return deferred.promise;
    }
}

module.exports = BuildsRepository;