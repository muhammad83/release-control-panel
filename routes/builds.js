"use strict";

const buildsRepository = require("../repositories/builds-repository");

class Builds
{
    static getSuccessfulBuildsForProjects(request, response)
    {
        let projects = (request.query.projects || "").split(",");

        buildsRepository.getSuccessfulBuildsForProjects(projects)
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

        buildsRepository.startBuild(project, version)
            .then(data =>
            {
                response.send(JSON.stringify(data));
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