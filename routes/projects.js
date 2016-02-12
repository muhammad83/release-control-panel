"use strict";

const config = require("../config");

class Projects
{
    static getProjectNames(request, response)
    {
        response.send(JSON.stringify(config.projects.map(project => project.name)));
    }
}

module.exports = Projects;