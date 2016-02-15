"use strict";

const config = require("../config");
const startDeploymentToQa = require("../actions/start-deployment-to-qa");
const startDeploymentToStaging = require("../actions/start-deployment-to-staging");

class Deployment
{
    static deployToQA(request, response)
    {
        let projectName = request.body.projectName;
        let version = request.body.version;

        let project = config.projects.find(p => p.name == projectName);
        if (!project)
        {
            response.status(404).send(
            {
                message: "Could not find project with given name.",
                status: 404
            });
            return;
        }

        if (project.location !== "left" && project.location !== "right")
        {
            response.status(404).send(
            {
                message: "Invalid configuration. Project 'location' must take values 'left' or 'right'.",
                status: 500
            });
            return;
        }

        startDeploymentToQa(project.location, projectName, version)
            .then(data =>
            {
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

    static deployToStaging(request, response)
    {
        let projectName = request.body.projectName;
        let version = request.body.version;

        startDeploymentToStaging(projectName, version)
            .then(data =>
            {
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
}

module.exports = Deployment;