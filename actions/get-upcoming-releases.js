"use strict";

const filterNotExistingJiraTickets = require("../helpers/filter-not-existing-tickets");
const getAvailableReleases = require("../helpers/get-available-releases");
const getProductionVersions = require("../helpers/get-production-versions");
const getReleasesAfterProductionVersion = require("../helpers/get-releases-after-production-version");
const getStoriesFromJira = require("../helpers/get-stories-from-jira");
const getTagsForReleases = require("../helpers/get-tags-for-releases");
const getTicketsForReleases = require("../helpers/get-tickets-for-releases");
const prepareJqlForEpics = require("../helpers/prepare-jql-for-epics");
const prepareJqlForTickets = require("../helpers/prepare-jql-for-tickets");
const q = require("q");
const updateProjects = require("../helpers/update-projects");

module.exports = function getUpcomingReleases(projectNames)
{
    let productionVersionsPromise = getProductionVersions(projectNames);
    let availableReleasesPromise = getAvailableReleases();
    let updateProjectsPromise = updateProjects(projectNames);

    return q.all([productionVersionsPromise, availableReleasesPromise, updateProjectsPromise])
        .then(results => // Get available releases after production version
        {
            let productionVersions = results[0];
            let availableReleases = results[1];

            return {
                productionVersions: productionVersions,
                upcomingReleases: getReleasesAfterProductionVersion(productionVersions, availableReleases)
            };
        })
        .then(results => // Get tickets and tags from git log for each release
        {
            let productionVersions = results.productionVersions;
            let upcomingReleases = results.upcomingReleases;

            let ticketsForReleasesPromise = getTicketsForReleases(productionVersions, upcomingReleases);
            let tagsForReleasesPromise = getTagsForReleases(productionVersions, upcomingReleases);

            return q.all([ticketsForReleasesPromise, tagsForReleasesPromise])
                .then(results =>
                {
                    let ticketsForReleases = results[0];
                    let tagsForReleases = results[1];

                    upcomingReleases.forEach(upcomingRelease =>
                    {
                        let ticketsForRelease = ticketsForReleases.find(ticketsForRelease => ticketsForRelease.release === upcomingRelease.release).tickets;
                        let tagsForRelease = tagsForReleases.find(tagsForRelease => tagsForRelease.release === upcomingRelease.release).tags;

                        upcomingRelease.tickets = ticketsForRelease;
                        upcomingRelease.tags = tagsForRelease;
                    });

                    return {
                        productionVersions: productionVersions,
                        upcomingReleases: upcomingReleases
                    };
                });
        })
        .then(results => // Filter out the JIRA tickets which are invalid
        {
            let uniqueTickets = [];

            results.upcomingReleases.forEach(upcomingRelease =>
            {
                upcomingRelease.tickets.forEach(ticket =>
                {
                    if (uniqueTickets.indexOf(ticket) !== -1)
                        return;

                    uniqueTickets.push(ticket);
                });
            });

            return filterNotExistingJiraTickets(uniqueTickets)
                .then(filteredTickets =>
                {
                    results.upcomingReleases.forEach(upcomingRelease =>
                    {
                        upcomingRelease.tickets = upcomingRelease.tickets.filter(ticket => filteredTickets.indexOf(ticket) !== -1);
                    });

                    return results;
                });
        })
        .then(results => // Prepare JIRA search queries
        {
            results.jira = results.upcomingReleases.map(upcomingRelease =>
            {
                return {
                    release: upcomingRelease.release,
                    jql: prepareJqlForTickets(upcomingRelease.tags, upcomingRelease.tickets, true)
                };
            });

            return results;
        })
        .then(results => // Search for tickets in JIRA
        {
            let searchPromises = results.jira.map(jira =>
            {
                return getStoriesFromJira(jira.jql);
            });

            return q.all(searchPromises)
                .then(searchResults =>
                {
                    searchResults.forEach((result, index) =>
                    {
                        results.jira[index].tickets = result;
                    });

                    return results;
                });
        })
        .then(results => // Search for epics
        {
            let epicsNumbers = [];
            results.jira.forEach(release =>
            {
                release.tickets.forEach(ticket =>
                {
                    if (ticket.epicKey)
                    {
                        epicsNumbers.push(ticket.epicKey);
                    }
                });
            });

            let epicsJQL = prepareJqlForEpics(epicsNumbers);

            return getStoriesFromJira(epicsJQL)
                .then(epics =>
                {
                    results.epics = epics;
                    return results;
                });
        });
};