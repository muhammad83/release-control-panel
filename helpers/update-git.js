"use strict";

const executeCommand = require("./execute-command");
const getProjectPath = require("./get-project-path");

module.exports = function updateGit(projectName)
{
    let projectPath = getProjectPath(projectName);

    return executeCommand(projectPath, "git fetch")
        .then(() => executeCommand(projectPath, "git checkout master"))
        .then(() => executeCommand(projectPath, "git pull"));
        // .catch(ex =>
        // {
        //     // TODO: Return something hrere...
        // });
};