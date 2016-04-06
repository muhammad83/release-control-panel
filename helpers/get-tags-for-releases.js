"use strict";

const getTagsFromGit = require("./get-tags-from-git");
const q = require("q");

module.exports = function getTagsForReleases(projectNames, releases)
{
    let firstRelease = releases[0];

    return getTagsFromGit(projectNames)
        .then(projectsTags =>
        {
            let projectsLastUsedTagIndex = projectNames.map(projectName =>
            {
                let projectTags = projectsTags.find(projectTags => projectTags.name === projectName).tags;
                let firstReleaseProject = firstRelease.projects.find(project => project.name === projectName);
                return projectTags.indexOf(firstReleaseProject.version);
            });

            return releases.map(release =>
            {
                return {
                    release: release.release,
                    tags: projectNames.map((projectName, projectIndex) =>
                    {
                        let projectTags = projectsTags[projectIndex].tags;
                        let releaseProject = release.projects.find(project => project.name === projectName);

                        let startVersionIndex = projectsLastUsedTagIndex[projectIndex];

                        let endVersion = releaseProject.version;
                        let endVersionIndex = projectTags.indexOf(endVersion) + 1;

                        projectsLastUsedTagIndex[projectIndex] = endVersionIndex;

                        return {
                            name: projectName,
                            tags: projectTags.slice(startVersionIndex, endVersionIndex)
                        };
                    })
                };
            });
        });
};