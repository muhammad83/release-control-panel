"use strict";

const getTicketsFromGit = require("../helpers/get-tickets-from-git");
const q = require("q");

module.exports = function getTicketsForReleases(productionVersions, releases)
{
    let projectStartTags = productionVersions.map(productionVersion => productionVersion.version);

    let getTicketsPromise = releases.map(release => {
        let projectsTicketsPromises = productionVersions.map(productionProject =>
        {
            let projectIndex = productionVersions.findIndex(productionVesion => productionVesion.name === productionProject.name);
            let releaseProject = release.projects.find(releaseProject => releaseProject.name == productionProject.name);
            
            let startTag = projectStartTags[projectIndex];
            projectStartTags[projectIndex] = releaseProject.version;

            return getTicketsFromGit(productionProject.name, startTag, releaseProject.version);
        });

        return q.all(projectsTicketsPromises)
            .then(projectsTickets =>
            {
                let uniqueTickets = [];

                projectsTickets.forEach(tickets =>
                {
                    tickets.forEach(ticket =>
                    {
                        if (uniqueTickets.indexOf(ticket) !== -1)
                            return;

                        uniqueTickets.push(ticket);
                    });
                });

                return {
                    release: release.release,
                    tickets: uniqueTickets
                };
            });
    });

    return q.all(getTicketsPromise);
};