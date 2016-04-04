"use strict";

const semver = require("semver");

module.exports = function getReleasesAfterProductionVersion(productionVersions, availableReleases)
{
    // This is used to store found index of the production release in 'availableReleases' array.
    let currentVersionIndex = 0;
    for (; currentVersionIndex < availableReleases.length; currentVersionIndex++)
    {
        let release = availableReleases[currentVersionIndex];
        let isMatch = productionVersions.every(projectVersion =>
        {
            return release.projects.some(projectReleaseVersion => projectReleaseVersion.name === projectVersion.name && semver.gte(projectReleaseVersion.version, projectVersion.version));
        });

        if (isMatch)
        {
            break;
        }
    }

    // is the index outside of the array?
    if (currentVersionIndex === availableReleases.length)
    {
        return [];
    }

    return availableReleases.slice(currentVersionIndex);
};