"use strict";

const config = require("../config");
const q = require("q");
const request = require("request");

function getVersionsJson(address)
{
    let deferred = q.defer();

    request(
        {
            method: "GET",
            uri: address
        },
        (error, response, data) =>
        {
            if (error)
            {
                deferred.reject(error);
                return;
            }

            let applicationVersions = JSON.parse(data);
            let productionVersions = applicationVersions.map(application =>
            {
                return {
                    name: application.an,
                    version: application.ver
                };
            });

            deferred.resolve(productionVersions);
        }
    );

    return deferred.promise;
}

module.exports = function getProductionVersions(projectNames)
{
    let productionLeftVersionsPromise = getVersionsJson(config.prodLeftUrl);
    let productionRightVersionsPromise = getVersionsJson(config.prodRightUrl);

    return q.all([productionLeftVersionsPromise, productionRightVersionsPromise])
        .then(versions =>
        {
            let leftVersions = versions[0];
            let rightVersions = versions[1];

            return projectNames.map(projectName =>
            {
                let projectConfig = config.projects.find(project => project.name === projectName);
                if (projectConfig === undefined)
                {
                    throw "Boom! Project can't be found in the config!"
                }

                let projectVersion;
                if (projectConfig.location === "left")
                {
                    projectVersion = leftVersions.find(version => version.name === projectName);
                }
                else
                {
                    projectVersion = rightVersions.find(version => version.name === projectName);
                }

                return {
                    name: projectName,
                    version: projectVersion ? projectVersion.version : null
                };
            });
        });
};