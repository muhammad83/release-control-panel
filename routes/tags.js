var q = require("q");
var tagsRepository = require("../repositories/tags-repository");

module.exports =
{
    getCurrentVersions: function (request, response)
    {
        var projects = (request.query.projects || "").split(",");
        var promises = projects.map(function (project)
        {
            return tagsRepository.getProdReleaseNumber(project);
        });

        q.all(promises)
            .then(function (versions)
            {
                var data = projects.map(function (project, index)
                {
                    return {
                        name: project,
                        version: versions[index].replace("release/", "")
                    };
                });

                response.send(JSON.stringify(data));
            })
            .catch(function (ex)
            {
                response.status(500).send(JSON.stringify(ex || "Unknown error."));
            });
    },
    getStableTags: function (request, response)
    {
        var serviceName = request.query.serviceName;
        tagsRepository.getStableTags(serviceName)
            .then(function (data)
            {
                response.send(JSON.stringify(data));
            })
            .catch(function (ex)
            {
                response.status(500).send(JSON.stringify(ex || "Unknown error."));
            });
    },
    getReleases: function (request, response)
    {
        var releaseVersions;

        tagsRepository.getAllStableVersions()
            .then(function (versions)
            {
                releaseVersions = versions;

                var promises = versions.map(function (version)
                {
                    return tagsRepository.getStableApplications(version);
                });
                return q.all(promises);
            })
            .then(function (applicationVersions)
            {
                var data = releaseVersions.map(function (version, index)
                {
                    return {
                        name: version,
                        applications: applicationVersions[index]
                    };
                });

                response.send(JSON.stringify(data));
            })
            .catch(function (ex)
            {
                response.status(500).send(JSON.stringify(ex || "Unknown error."));
            });
    },
    getTags: function (request, response)
    {
        var serviceName = request.query.serviceName;

        var promises = [
            tagsRepository.getTags(serviceName),
            tagsRepository.getProdReleaseNumber(serviceName)
        ];

        q.all(promises)
            .then(function (data)
            {
                response.send(JSON.stringify({
                    tags: data[0],
                    currentVersion: data[1]
                }));
            })
            .catch(function (error)
            {
                response.status(500).send(JSON.stringify(error || "Unknown error."));
            });
    }
};