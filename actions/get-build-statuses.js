"use strict";

const config = require("../config");
const q = require("q");
const request = require("request");

function getBuildStatus(projectName)
{
    let deferred = q.defer();
    let requestOptions = {
        method: "GET",
        url: `${config.ciBuildUrl}/job/${projectName}/lastBuild/api/json`,
        auth:
        {
            user: config.ciBuildUserName,
            pass: config.ciBuildApiToken
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

        let buildStatus = JSON.parse(data);
        let buildsByBranchName = buildStatus.actions.find(action => action.buildsByBranchName).buildsByBranchName;

        let currentBuildNumber = buildStatus.number;
        let currentBuildVersion = null;

        for (let buildBranch in buildsByBranchName)
        {
            if (!buildsByBranchName.hasOwnProperty(buildBranch))
                continue;

            let build = buildsByBranchName[buildBranch];
            if (build.buildNumber !== currentBuildNumber)
                continue;

            currentBuildVersion = buildBranch.substring(buildBranch.lastIndexOf("/") + 1);
        }

        deferred.resolve(
        {
            number: buildStatus.number,
            version: currentBuildVersion,
            isBuilding: !!buildStatus.building
        });
    };

    request(requestOptions, responseHandler);

    return deferred.promise;
}

module.exports = function getBuildStatuses(projectNames)
{
    let promises = projectNames.map(projectName => getBuildStatus(projectName));

    return q.all(promises).then(statuses =>
    {
        let result = {};
        projectNames.forEach((projectName, index) =>
        {
            result[projectName] = statuses[index];
        });
        return result;
    });
};