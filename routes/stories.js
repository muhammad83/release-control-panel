var q = require("q");
var storiesRepository = require("../repositories/stories-repository");
var tagsRepository = require("../repositories/tags-repository");

module.exports =
{
    getStories: function (request, response)
    {
        var serviceName = request.query.serviceName;
        var endTag = request.query.endTag;
        var startTag = request.query.startTag;

        tagsRepository.getTags(serviceName)
            .then(function (tags)
            {
                var startTagIndex = tags.indexOf(startTag);
                var endTagIndex = tags.indexOf(endTag);
                var tagsToLookUpInJira = tags.slice(endTagIndex, startTagIndex + 1);
                tagsToLookUpInJira = tagsToLookUpInJira.map(function (tag)
                {
                    return tag.replace("release/", "");
                });
                return storiesRepository.getStoriesBetweenTagsForProjects([{ name: serviceName, tags: tagsToLookUpInJira }]);
            })
            .then(function (data)
            {
                response.send(JSON.stringify(data));
            })
            .catch(function (error)
            {
                response.status(500).send(JSON.stringify(error || "Unknown error."));
            });
    },
    getStoriesForRelease: function(request, response)
    {
        var version = request.query.version;
        var projects = (request.query.projects || "").split(",");
        var versions;
        var projectProdReleaseNumbers;

        tagsRepository.getStableApplications(version)
            .then(function (projectsVersions)
            {
                versions = projects.map(function (project)
                {
                    return "release/" + projectsVersions.find(function (pv) { return pv.application_name == project; }).version;
                });

                var promises = projects.map(function (project) { return tagsRepository.getProdReleaseNumber(project); });
                return q.all(promises);
            })
            .then(function (prodVersions)
            {
                projectProdReleaseNumbers = prodVersions;

                var promises = projects.map(function (project) { return tagsRepository.getTags(project); });
                return q.all(promises);
            })
            .then(function (allTags)
            {
                var projectTags = allTags.map(function (tags, projectIndex)
                {
                    var tagsToFind = tags.slice(
                        tags.indexOf(versions[projectIndex]),
                        tags.indexOf(projectProdReleaseNumbers[projectIndex])
                    ).map(function (tag) { return tag.replace("release/", ""); });

                    return {
                        name: projects[projectIndex],
                        tags: tagsToFind
                    };
                });
                return storiesRepository.getStoriesBetweenTagsForProjects(projectTags);
            })
            .then(function (data)
            {
                response.send(JSON.stringify(data));
            })
            .catch(function (ex)
            {
                response.status(500).send(JSON.stringify(ex || "Unknown error."));
            });
    }
};