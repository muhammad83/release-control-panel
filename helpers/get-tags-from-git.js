"use strict";

const EOL = require("os").EOL;
const executeCommand = require("./execute-command");
const getProjectPath = require("./get-project-path");
const q = require("q");

module.exports = function getTagsFromGit(projectNames)
{
    let projectsPromises = projectNames.map(projectName =>
    {
        let projectPath = getProjectPath(projectName);
        let command = "git tag --sort=v:refname";

        return executeCommand(projectPath, command)
            .then(output =>
            {
                let tags = output.split(EOL)
                    .filter(line => line.trim().length > 0)
                    .map(line => line.substring(line.indexOf("/") + 1));
                return {
                    name: projectName,
                    tags: tags
                };
            });
    });

    return q.all(projectsPromises);
};
