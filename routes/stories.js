"use strict";

const createReleaseFilter = require("../actions/create-release-filter");
const getProjectNames = require("../helpers/get-project-names");
const getUpcomingReleases = require("../actions/get-upcoming-releases");
const q = require("q");
const semver = require("semver");

class Stories
{
    static createReleaseFilter(request, response)
    {
        let releaseName = request.query.releaseName;
        let projects = getProjectNames();

        getUpcomingReleases(projects, false)
            .then(result =>
            {
                let projectsTags = [];
                let tickets = [];

                let productionReleaseFound = false;
                let productionVersions = result.productionVersions;

                for (let release of result.upcomingReleases)
                {
                    if (!productionReleaseFound)
                    {
                        productionReleaseFound = productionVersions.every(pv => release.projects.some(rp => rp.name === pv.name && rp.version === pv.version));

                        if (!productionReleaseFound)
                            continue;
                    }

                    // Insert tickets
                    tickets = tickets.concat(release.tickets);

                    // Insert tags
                    for (let projectTags of release.tags)
                    {
                        let combinedProjectTags = projectsTags.find(project => project.name === projectTags.name);
                        if (!combinedProjectTags)
                        {
                            combinedProjectTags =
                            {
                                name: projectTags.name,
                                tags: []
                            };
                            projectsTags.push(combinedProjectTags);
                        }

                        combinedProjectTags.tags = combinedProjectTags.tags.concat(projectTags.tags);
                    }

                    if (release.release === releaseName)
                        break;
                }

                return {
                    projectsTags: projectsTags,
                    tickets: tickets
                };
            })
            .then(result =>
            {
                return createReleaseFilter(releaseName, result.projectsTags, result.tickets);
            })
            .then(result =>
            {
                response.send(result);
            })
            .catch(error =>
            {
                response.status(500).send(error || "Unknown error.");
            });
    }
}

module.exports = Stories;