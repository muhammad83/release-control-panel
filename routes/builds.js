"use strict";

const getSuccessfulBuildsForProjects = require("../actions/get-successful-builds-for-projects");
const startBuild = require("../actions/start-build");

class Builds
{
    static getSuccessfulBuildsForProjects(request, response)
    {
        let projects = (request.query.projects || "").split(",");

        getSuccessfulBuildsForProjects(projects)
            .then(projectsBuilds =>
            {
                response.send(JSON.stringify(projectsBuilds));
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