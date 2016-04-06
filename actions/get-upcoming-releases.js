"use strict";

const filterNotExistingJiraTickets = require("../helpers/filter-not-existing-tickets");
const getAvailableReleases = require("../helpers/get-available-releases");
const getProductionVersions = require("../helpers/get-production-versions");
const getStoriesFromJira = require("../helpers/get-stories-from-jira");
const getTagsForReleases = require("../helpers/get-tags-for-releases");
const getTicketsForReleases = require("../helpers/get-tickets-for-releases");
const prepareJqlForEpics = require("../helpers/prepare-jql-for-epics");
const prepareJqlForTickets = require("../helpers/prepare-jql-for-tickets");
const q = require("q");
const semver = require("semver");
const updateProjects = require("../helpers/update-projects");

let cachedUpcomingReleases = null;

module.exports = function getUpcomingReleases(projectNames, refresh)
{
    if (cachedUpcomingReleases && !refresh)
    {
        let deferred = q.defer();
        deferred.resolve(cachedUpcomingReleases);
        return deferred.promise;
    }

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
                upcomingReleases: availableReleases
            };
        })
        .then(results => // Get tickets and tags from git log for each release
        {
            let productionVersions = results.productionVersions;
            let upcomingReleases = results.upcomingReleases;

            let ticketsForReleasesPromise = getTicketsForReleases(projectNames, upcomingReleases);
            let tagsForReleasesPromise = getTagsForReleases(projectNames, upcomingReleases);

            return q.all([ticketsForReleasesPromise, tagsForReleasesPromise])
                .then(results =>
                {
                    let ticketsForReleases = results[0];
                    let tagsForReleases = results[1];

                    upcomingReleases.forEach(upcomingRelease =>
                    {
                        let ticketsForRelease = ticketsForReleases.find(ticketsForRelease => ticketsForRelease.release === upcomingRelease.release);
                        let tagsForRelease = tagsForReleases.find(tagsForRelease => tagsForRelease.release === upcomingRelease.release);

                        upcomingRelease.tickets = (ticketsForRelease && ticketsForRelease.tickets) || [];
                        upcomingRelease.tags = (tagsForRelease && tagsForRelease.tags) || [];
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
            let tickets = [];
            let tags = [];

            projectNames.forEach(projectName =>
            {
                let projectTags =
                {
                    name: projectName,
                    tags: []
                };

                tags.push(projectTags);

                results.upcomingReleases.forEach(release =>
                {
                    release.tags.find(project => project.name === projectName).tags.forEach(tag =>
                    {
                        if (projectTags.tags.indexOf(tag) !== -1)
                            return;

                        projectTags.tags.push(tag);
                    });

                    release.tickets.forEach(ticket =>
                    {
                        if (tickets.indexOf(ticket) !== -1)
                            return;

                        tickets.push(ticket);
                    });
                });
            });



            results.jira = [];
            results.jiraJQL = prepareJqlForTickets(tags, tickets);

            return results;
        })
        .then(results => // Search for tickets in JIRA
        {
            return getStoriesFromJira(results.jiraJQL)
                .then(searchResult => // Make a "ticket -> tag -> project" map
                {
                    let ticketsTagsProjectsMap = {};

                    searchResult.forEach(ticket =>
                    {
                        if (!ticket.gitTags)
                            return;

                        // Get the array of projects and tags
                        let projectsTags = ticket.gitTags.map(tag =>
                        {
                            let index = tag.lastIndexOf("-");
                            if (index == -1)
                                return null;

                            return {
                                project: tag.slice(0, index),
                                tag: tag.slice(index + 1)
                            };
                        });

                        projectsTags
                            .filter(pt => // Discard the incorrect tags
                            {
                                return pt && projectNames.indexOf(pt.project) !== 1 && semver.valid(pt.tag);
                            })
                            .forEach(pt => // Add the projects and tags to the 'ticketsTagsProjectsMap' map
                            {
                                let projectTagsTickets = ticketsTagsProjectsMap[pt.project];
                                if (!projectTagsTickets) // Check if project exist
                                {
                                    projectTagsTickets = {};
                                    ticketsTagsProjectsMap[pt.project] = projectTagsTickets;
                                }

                                let tagTickets = projectTagsTickets[pt.tag];
                                if (!tagTickets)
                                {
                                    tagTickets = [];
                                    projectTagsTickets[pt.tag] = tagTickets;
                                }

                                tagTickets.push(ticket);
                            });
                    });

                    return {
                        searchResults: searchResult,
                        ticketsTagsProjectsMap: ticketsTagsProjectsMap
                    };
                })
                .then(improvedSearchResults => // Add the search results to the releases
                {
                    results.jira = results.upcomingReleases.map(upcomingRelease =>
                    {
                        let tickets = [];

                        upcomingRelease.tickets.forEach(ticketNumber => // Add tickets by their numbers
                        {
                            let ticket = improvedSearchResults.searchResults.find(ticket => ticket.ticketNumber === ticketNumber);
                            if (ticket && tickets.indexOf(ticket) === -1)
                            {
                                tickets.push(ticket);
                            }
                        });

                        upcomingRelease.tags.forEach(project => // Add tickets by their tags.
                        {
                            let projectTagsTickets = improvedSearchResults.ticketsTagsProjectsMap[project.name];
                            if (!projectTagsTickets)
                                return;

                            project.tags.forEach(tag =>
                            {
                                let tagTickets = projectTagsTickets[tag];
                                if (!tagTickets)
                                    return;

                                tagTickets.forEach(ticket =>
                                {
                                    if (tickets.indexOf(ticket) !== -1)
                                        return;

                                    tickets.push(ticket);
                                });
                            });
                        });

                        return {
                            release: upcomingRelease.release,
                            tickets: tickets
                        };
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
        })
        .then(results =>
        {
            cachedUpcomingReleases = results;
            return results;
        })
};