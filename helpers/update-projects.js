"use strict";

const q = require("q");
const updateGit = require("../helpers/update-git");

module.exports = function updateProjects(projectNames)
{
    let promises = projectNames.map(projectName => updateGit(projectName));
    return q.all(promises);
};