"use strict";

const getAllStableVersions = require("../actions/get-all-stable-versions");
const getProdReleaseNumber = require("../actions/get-prod-release-number");
const getStableApplications = require("../actions/get-stable-applications");
const getStableTags = require("../actions/get-stable-tags");
const getTags = require("../actions/get-tags");
const q = require("q");

class Tags
{
    static getCurrentVersions(request, response)
    {
        let projects = (request.query.projects || "").split(",");
        let promises = projects.map(project => getProdReleaseNumber(project));

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

                response.send(JSON.stringify(data));
            })
            .catch(ex =>
            {
                response.status(500).send(JSON.stringify(ex || "Unknown error."));
            });
    }

    static getStableTags(request, response)
    {
        let serviceName = request.query.serviceName;
        getStableTags(serviceName)
            .then(data =>
            {
                response.send(JSON.stringify(data));
            })
            .catch(ex =>
            {
                response.status(500).send(JSON.stringify(ex || "Unknown error."));
            });
    }

    static getReleases(request, response)
    {
        let releaseVersions;

        getAllStableVersions()
            .then(versions =>
            {
                releaseVersions = versions;

                let promises = versions.map(version => getStableApplications(version));
                return q.all(promises);
            })
            .then(applicationVersions =>
            {
                let data = releaseVersions.map((version, index) =>
                {
                    return {
                        name: version,
                        applications: applicationVersions[index]
                    };
                });

                response.send(JSON.stringify(data));
            })
            .catch(ex =>
            {
                response.status(500).send(JSON.stringify(ex || "Unknown error."));
            });
    }

    static getTags(request, response)
    {
        let serviceName = request.query.serviceName;

        let promises = [
            getTags(serviceName),
            getProdReleaseNumber(serviceName)
        ];

        q.all(promises)
            .then(data =>
            {
                response.send(JSON.stringify({
                    tags: data[0],
                    currentVersion: data[1]
                }));
            })
            .catch(error =>
            {
                response.status(500).send(JSON.stringify(error || "Unknown error."));
            });
    }
}

module.exports = Tags;