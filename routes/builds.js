"use strict";

const getBuildStatuses = require("../actions/get-build-statuses");
const getProjectNames = require("../helpers/get-project-names");
const getSuccessfulBuildsForProjects = require("../actions/get-successful-builds-for-projects");
const getUpcomingReleases = require("../actions/get-upcoming-releases");
const startBuild = require("../actions/start-build");

let cachedUpcomingReleases = null;

class Builds
{
    static getBuildStatuses(request, response)
    {
        let projectNames = getProjectNames();
        getBuildStatuses(projectNames)
            .then(status =>
            {
                response.send(status);
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

    static getUpcomingReleases(request, response)
    {
        if (cachedUpcomingReleases && !request.query.force)
        {
            response.send(cachedUpcomingReleases);
            return;
        }

        let projects = getProjectNames();

        getUpcomingReleases(projects)
            .then(data =>
            {
                cachedUpcomingReleases = data;
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

    static getSuccessfulBuildsForProjects(request, response)
    {
        let projects = getProjectNames();

        getSuccessfulBuildsForProjects(projects)
            .then(projectsBuilds =>
            {
                response.send(projectsBuilds);
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

    static startBuild(request, response)
    {
        let project = request.body.project;
        let version = request.body.version;

        startBuild(project, version)
            .then(() =>
            {
                response.status(201).send(null);
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
}

module.exports = Builds;