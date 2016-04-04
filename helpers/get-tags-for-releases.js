"use strict";

const getTagsFromGit = require("./get-tags-from-git");
const q = require("q");

module.exports = function getTagsForReleases(productionVersions, releases)
{
    let projectNames = productionVersions.map(productionVersion => productionVersion.name);

    return getTagsFromGit(projectNames)
        .then(projectsTags =>
        {
            let projectsLastUsedTagIndex = productionVersions.map(productionVersion =>
            {
                let projectTags = projectsTags.find(projectTags => projectTags.name === productionVersion.name).tags;
                return projectTags.indexOf(productionVersion.version);
            });

            return releases.map(release =>
            {
                return {
                    release: release.release,
                    tags: productionVersions.map(productionVersion =>
                    {
                        let projectIndex = projectsTags.findIndex(projectTags => projectTags.name === productionVersion.name);
                        let projectTags = projectsTags[projectIndex].tags;
                        let releaseProject = release.projects.find(project => project.name === productionVersion.name);

                        let startVersionIndex = projectsLastUsedTagIndex[projectIndex];

                        let endVersion = releaseProject.version;
                        let endVersionIndex = projectTags.indexOf(endVersion) + 1;

                        projectsLastUsedTagIndex[projectIndex] = endVersionIndex;

                        return {
                            name: productionVersion.name,
                            tags: projectTags.slice(startVersionIndex, endVersionIndex)
                        };
                    })
                };
            });
        });
};