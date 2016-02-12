"use strict";

const config = require("../config");

module.exports = function getProjectNames()
{
    return config.projects.map(project => project.name);
};