"use strict";

const q = require("q");
const storiesRepository = require("../repositories/stories-repository");
const tagsRepository = require("../repositories/tags-repository");

class Stories
{
    static getStories(request, response)
    {
        let serviceName = request.query.serviceName;
        let endTag = request.query.endTag;
        let startTag = request.query.startTag;

        tagsRepository.getTags(serviceName)
            .then(tags =>
            {
                let startTagIndex = tags.indexOf(startTag);
                let endTagIndex = tags.indexOf(endTag);
                let tagsToLookUpInJira = tags.slice(endTagIndex, startTagIndex + 1);

                tagsToLookUpInJira = tagsToLookUpInJira.map(tag => tag.replace("release/", ""));

                return storiesRepository.getStoriesBetweenTagsForProjects([{ name: serviceName, tags: tagsToLookUpInJira }]);
            })
            .then(data =>
            {
                response.send(JSON.stringify(data));
            })
            .catch(error =>
            {
                response.status(500).send(JSON.stringify(error || "Unknown error."));
            });
    }

    static getStoriesForRelease(request, response)
    {
        let version = request.query.version;
        let projects = (request.query.projects || "").split(",");
        let versions;
        let projectProdReleaseNumbers;

        tagsRepository.getStableApplications(version)
            .then(projectsVersions =>
            {
                versions = projects.map(project =>
                {
                    return "release/" + projectsVersions.find(pv => pv.application_name == project).version;
                });

                let promises = projects.map(project => tagsRepository.getProdReleaseNumber(project));
                return q.all(promises);
            })
            .then(prodVersions =>
            {
                projectProdReleaseNumbers = prodVersions;

                let promises = projects.map(project => tagsRepository.getTags(project));
                return q.all(promises);
            })
            .then(allTags =>
            {
                let projectTags = allTags.map((tags, projectIndex) =>
                {
                    let tagsToFind = tags.slice(
                        tags.indexOf(versions[projectIndex]),
                        tags.indexOf(projectProdReleaseNumbers[projectIndex])
                    ).map(tag => tag.replace("release/", ""));

                    return {
                        name: projects[projectIndex],
                        tags: tagsToFind
                    };
                });
                return storiesRepository.getStoriesBetweenTagsForProjects(projectTags);
            })
            .then(data =>
            {
                response.send(JSON.stringify(data));
            })
            .catch(ex =>
            {
                response.status(500).send(JSON.stringify(ex || "Unknown error."));
            });
    }
}

module.exports = Stories;