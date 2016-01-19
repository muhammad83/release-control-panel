"use strict";

let q = require("q");
let tagsRepository = require("../repositories/tags-repository");

class Tags
{
    static getCurrentVersions(request, response)
    {
        let projects = (request.query.projects || "").split(",");
        let promises = projects.map(project => tagsRepository.getProdReleaseNumber(project));

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
        tagsRepository.getStableTags(serviceName)
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

        tagsRepository.getAllStableVersions()
            .then(versions =>
            {
                releaseVersions = versions;

                let promises = versions.map(version => tagsRepository.getStableApplications(version));
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
            tagsRepository.getTags(serviceName),
            tagsRepository.getProdReleaseNumber(serviceName)
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