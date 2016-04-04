"use strict";

const config = require("../config");
const parseXmlString = require("xml2js").parseString;
const q = require("q");
const request = require("request");
const semver = require("semver");

function getAvailableReleaseNames()
{
    let deferred = q.defer();

    let address = config.nexus;
    request(
        {
            method: "GET",
            uri: address
        },
        (error, response, body) =>
        {
            if (error)
            {
                deferred.reject(error);
                return;
            }

            parseXmlString(body, (error, result) =>
            {
                if (error)
                {
                    deferred.reject(error);
                    return;
                }

                deferred.resolve(result.metadata.versioning[0].versions[0].version);
            });
        });

    return deferred.promise;
}

function getVersionsForReleaseName(versionName)
{
    let deferred = q.defer();

    request(
        {
            method: "GET",
            uri: `https://nexus-dev.tax.service.gov.uk/service/local/repositories/hmrc-snapshots/content/uk/gov/hmrc/cato/${versionName}/cato-${versionName}.manifest`
        },
        (error, response, data) =>
        {
            if (error)
            {
                deferred.reject(error);
                return;
            }

            let applications = JSON.parse(data).applications.map(app =>
            {
                return {
                    name: app.application_name,
                    version: app.version
                };
            });


            deferred.resolve({
                release: versionName,
                projects: applications
            });
        }
    );

    return deferred.promise;
}

module.exports = function getAvailableReleases()
{
    return getAvailableReleaseNames()
        .then(versionNames =>
        {
            let versionPromises = versionNames.map(versionName => getVersionsForReleaseName(versionName));
            return q.all(versionPromises);
        })
        .then(releases => releases.filter(release =>
        {
            return release.projects.every(projectRelease => semver.valid(projectRelease.version));
        }));
};