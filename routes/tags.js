"use strict";

const getAllStableVersions = require("../actions/get-all-stable-versions");
const getCurrentlyDeployedVersion = require("../actions/get-currently-deployed-version");
const getProjectNames = require("../helpers/get-project-names");
const getStableApplications = require("../actions/get-stable-applications");
const getStableTags = require("../actions/get-stable-tags");
const getTags = require("../actions/get-tags");
const q = require("q");
const semver = require("semver");

class Tags
{
    static getCurrentVersions(request, response)
    {
        let projects = getProjectNames();
        let promises = projects.map(project => getCurrentlyDeployedVersion(project));

        q.all(promises)
            .then(versions =>
            {
                let data = projects.map((project, index) =>
                {
                    return {
                        name: project,
                        version: versions[index].replace("release/", "")
                    };
                });

                response.send(data);
            })
            .catch(ex =>
            {
                response.status(500).send(ex || "Unknown error.");
            });
    }

    static getStableTags(request, response)
    {
        let serviceName = request.query.serviceName;
        getStableTags(serviceName)
            .then(data =>
            {
                response.send(data);
            })
            .catch(ex =>
            {
                response.status(500).send(ex || "Unknown error.");
            });
    }

    static getReleases(request, response)
    {
        let releaseVersions;

        let availableReleasesPromise =
            getAllStableVersions()
            .then(versions =>
            {
                releaseVersions = versions;

                let promises = versions.map(version => getStableApplications(version));
                return q.all(promises);
            })
            .then(applicationVersions =>
            {
                return releaseVersions.map((version, index) =>
                {
                    return {
                        name: version,
                        applications: applicationVersions[index]
                    };
                });
            });

        let projectNames = getProjectNames();
        let currentVersionsPromise = q.all(projectNames.map(projectName => getCurrentlyDeployedVersion(projectName)));

        q.all([currentVersionsPromise, availableReleasesPromise])
            .then(data =>
            {
                let availableReleases = data[1];
                let currentVersions = data[0].map(release => release.replace("release/", ""));

                return availableReleases.filter(release =>
                {
                    return release.applications.every(application =>
                    {
                        let projectNameIndex = projectNames.indexOf(application.name);

                        if (projectNameIndex == -1)
                            return true;

                        let currentlyReleasedVersion = currentVersions[projectNameIndex];
                        return semver.valid(application.version) && semver.gte(application.version, currentlyReleasedVersion);
                    })
                });
            })
            .then(data =>
            {
                response.send(data);
            })
            .catch(ex =>
            {
                response.status(500).send(ex || "Unknown error.");
            });
    }

    static getTags(request, response)
    {
        let serviceName = request.query.serviceName;

        let promises = [
            getTags(serviceName),
            getCurrentlyDeployedVersion(serviceName)
        ];

        q.all(promises)
            .then(data =>
            {
                response.send(
                {
                    tags: data[0],
                    currentVersion: data[1]
                });
            })
            .catch(error =>
            {
                response.status(500).send(error || "Unknown error.");
            });
    }
}

module.exports = Tags;