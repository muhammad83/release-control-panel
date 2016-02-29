"use strict";

const createReleaseFilter = require("../actions/create-release-filter");
const getCurrentlyDeployedVersion = require("../actions/get-currently-deployed-version");
const getStableApplications = require("../actions/get-stable-applications");
const getStories = require("../actions/get-stories");
const getTags = require("../actions/get-tags");
const q = require("q");

class Stories
{
    static createReleaseFilter(request, response)
    {
        let version = request.query.version;
        let projects = (request.query.projects || "").split(",");

        Stories.getTagsToFindForVersion(projects, version)
            .then(projectTags =>
            {
                return createReleaseFilter(version, projectTags);
            })
            .then(data =>
            {
                response.send(data);
            })
            .catch(error =>
            {
                response.status(500).send(error || "Unknown error.");
            });
    }

    static getStories(request, response)
    {
        let serviceName = request.query.serviceName;
        let endTag = request.query.endTag;
        let startTag = request.query.startTag;

        getTags(serviceName)
            .then(tags =>
            {
                let startTagIndex = tags.indexOf(startTag);
                let endTagIndex = tags.indexOf(endTag);
                let tagsToLookUpInJira = tags.slice(endTagIndex, startTagIndex + 1);

                tagsToLookUpInJira = tagsToLookUpInJira.map(tag => tag.replace("release/", ""));

                return getStories([{ name: serviceName, tags: tagsToLookUpInJira }]);
            })
            .then(data =>
            {
                response.send(data);
            })
            .catch(error =>
            {
                response.status(500).send(error || "Unknown error.");
            });
    }

    static getStoriesForRelease(request, response)
    {
        let version = request.query.version;
        let projects = (request.query.projects || "").split(",");

        Stories.getTagsToFindForVersion(projects, version)
            .then(projectTags =>
            {
                return getStories(projectTags);
            })
            .then(data =>
            {
                response.send(data);
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

                response.status(status).send(responseData);
            });
    }

    static getTagsToFindForVersion(projects, version)
    {
        let versions;
        let projectProdReleaseNumbers;

        return getStableApplications(version)
            .then(projectsVersions =>
            {
                versions = projects.map(project =>
                {
                    return "release/" + projectsVersions.find(pv => pv.name == project).version;
                });

                let promises = projects.map(project => getCurrentlyDeployedVersion(project));
                return q.all(promises);
            })
            .then(prodVersions =>
            {
                projectProdReleaseNumbers = prodVersions;

                let promises = projects.map(project => getTags(project));
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