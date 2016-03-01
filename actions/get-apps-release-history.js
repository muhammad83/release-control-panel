"use strict";

const config = require("../config");
const environments = require("../helpers/environments");
const getProjectNames = require("../helpers/get-project-names");
const q = require("q");
const request = require("request");
const semver = require("semver");

function getEnvironmentTypeByName(name)
{
    for (let index = 0; index < config.environments.length; index++)
    {
        let environment = config.environments[index];
        if (environment.name.test(name))
        {
            return environment.type;
        }
    }

    return environments.Invalid;
}

module.exports = function getAppsReleaseHistory()
{
    let projectNames = getProjectNames();

    let deferred = q.defer();
    let requestOptions = {
        method: "GET",
        url: config.appsReleaseHistoryUrl
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

            deferred.reject(
            {
                data: response.body,
                message: message,
                status: response.statusCode
            });
            return;
        }

        let parsedData = JSON.parse(data);
        let projectsData = { };

        // Setting up the data
        for (let index = 0; index < projectNames.length; index++)
        {
            let projectData = {};
            projectData[environments.Production] = [];
            projectData[environments.QA] = [];
            projectData[environments.Staging] = [];

            projectsData[projectNames[index]] = projectData;
        }

        // Populating the projects data structure from JSON
        for (let index = 0; index < parsedData.length; index++)
        {
            let releaseData = parsedData[index];
            let projectName = releaseData.an;
            let targetEnvironment = getEnvironmentTypeByName(releaseData.env);
            let firstSeen = releaseData.fs;
            let lastSeen = releaseData.ls;
            let version = releaseData.ver;

            if (projectNames.indexOf(projectName) === -1)
                continue;

            if (targetEnvironment === environments.Invalid)
            {
                console.warn(`Project ${projectName} has unsupported environment type: ${releaseData.env}`);
                continue;
            }

            projectsData[projectName][targetEnvironment].push(
            {
                lengthOfLife: (lastSeen - firstSeen) * 1000, // This is in milliseconds!
                version: version
            });
        }

        for (let projectIndex = 0; projectIndex < projectNames.length; projectIndex++)
        {
            let environmentsToProcess =
            [
                environments.Production,
                environments.QA,
                environments.Staging
            ];
            let projectName = projectNames[projectIndex];

            for (let environmentIndex = 0; environmentIndex < environmentsToProcess.length; environmentIndex++)
            {
                projectsData[projectName][environmentsToProcess[environmentIndex]].sort((left, right) =>
                {
                    return semver.compare(left.version, right.version);
                });
            }
        }

        deferred.resolve(projectsData);
    };

    request(requestOptions, responseHandler);

    return deferred.promise;
};