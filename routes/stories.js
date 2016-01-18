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
        var projects = (request.query.projects || "").split(",");
        var projectTagPromises = projects.map(function (project) { return tagsRepository.getProdReleaseNumber(project); });
        var projectProdReleaseNumbers;
        var projectStableTags;

        q.all(projectTagPromises)
            .then(function (versions)
            {
                projectProdReleaseNumbers = versions;

                var stableTagPromises = projects.map(function (project) { return tagsRepository.getStableTags(project); });
                return q.all(stableTagPromises);
            })
            .then(function (stableTags)
            {
                projectStableTags = stableTags.map(function (projectTags) { return projectTags[0]; });

                var projectTagsPromises = projects.map(function (project) { return tagsRepository.getTags(project); });
                return q.all(projectTagsPromises);
            })
            .then(function (allTags)
            {
                var projectTags = allTags.map(function (tags, projectIndex)
                {
                    var tagsToFind = tags.slice(
                        tags.indexOf(projectStableTags[projectIndex]),
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
                var resultData = {
                    projects: projects.map(function (project, index)
                    {
                        return {
                            name: project,
                            startTag: projectProdReleaseNumbers[index],
                            endingTag: projectStableTags[index]
                        };
                    }),
                    stories: data
                };
                response.send(JSON.stringify(resultData));
            })
            .catch(function (ex)
            {
                response.status(500).send(JSON.stringify(ex || "Unknown error."));
            });
    }
};