"use strict";

const EOL = require("os").EOL;
const executeCommand = require("./execute-command");
const findTicketsInText = require("./find-tickets-in-text");
const getProjectPath = require("./get-project-path");

module.exports = function getTicketsFromGit(projectName, startTag, endTag)
{
    let projectPath = getProjectPath(projectName);
    let command = `git log --date-order --pretty=format:"%s----__-----%h----__-----%aI----__-----%an" release/${startTag}...release/${endTag} | grep -v "Merge" | sort`;

    return executeCommand(projectPath, command)
        .then(output =>
        {
            return output.split(EOL)
                .map(line => findTicketsInText(line))
                .reduce((left, right) => left.concat(right), []);
        });

};
