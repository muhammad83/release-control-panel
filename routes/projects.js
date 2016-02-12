"use strict";

const getProjectNames = require("../helpers/get-project-names");

class Projects
{
    static getProjectNames(request, response)
    {
        response.send(JSON.stringify(getProjectNames()));
    }
}

module.exports = Projects;