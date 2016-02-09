"use strict";

const q = require("q");
const storiesRepository = require("../repositories/stories-repository");
const tagsRepository = require("../repositories/tags-repository");

class Stories
{
    static createReleaseFilter(request, response)
    {
        let version = request.query.version;
        let projects = (request.query.projects || "").split(",");

        Stories.getTagsToFindForVersion(projects, version)
            .then(projectTags =>
            {
                return storiesRepository.createReleaseFilter(version, projectTags);
            })
            .then(data =>
            {
                response.send(data);
            })
            .catch(error =>
            {
                response.status(500).send(JSON.stringify(error || "Unknown error."));
            });
    }

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

                return storiesRepository.getStories([{ name: serviceName, tags: tagsToLookUpInJira }]);
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

        Stories.getTagsToFindForVersion(projects, version)
            .then(projectTags =>
            {
                return storiesRepository.getStories(projectTags);
            })
            .then(data =>
            {
                response.send(JSON.stringify(data));
            })
            .catch(ex =>
            {
                let data = (ex && ex.data) || null;
                let message = (ex && ex.message) || "Something went wrong.";
                let status = (ex && ex.status) || 500;
                let responseData =
                {
                    message: message,
                    data: data
                };

                response.status(status).send(JSON.stringify(responseData));
            });
    }

    static getTagsToFindForVersion(projects, version)
    {
        let versions;
        let projectProdReleaseNumbers;

        return tagsRepository.getStableApplications(version)
            .then(projectsVersions =>
            {
                versions = projects.map(project =>
                {
                    return "release/" + projectsVersions.find(pv => pv.name == project).version;
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
                return allTags.map((tags, projectIndex) =>
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
            });
    }
}

module.exports = Stories;