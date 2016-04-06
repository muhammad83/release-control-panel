"use strict";

const getTicketsFromGit = require("../helpers/get-tickets-from-git");
const q = require("q");

module.exports = function getTicketsForReleases(projectNames, releases)
{
    let firstRelease = releases[0];
    let projectStartTags = projectNames.map(projectName =>
    {
        let project = firstRelease.projects.find(project => project.name === projectName);
        return project.version;
    });

    // Make a copy of the array but remove first release - can't find tickets for it...
    releases = releases.slice(1);

    let getTicketsPromise = releases.map(release => {
        let projectsTicketsPromises = projectNames.map((projectName, projectIndex) =>
        {
            let releaseProject = release.projects.find(releaseProject => releaseProject.name == projectName);
            
            let startTag = projectStartTags[projectIndex];
            projectStartTags[projectIndex] = releaseProject.version;

            return getTicketsFromGit(projectName, startTag, releaseProject.version);
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