"use strict";

const exec = require("child_process").exec;
const q = require("q");

module.exports = function executeCommand(cwd, command)
{
    let deferred = q.defer();

    let commandCallback = (error, stdout, stderr) =>
    {
        if (error)
        {
            deferred.reject(error);
            return;
        }

        deferred.resolve(stdout);
    };

    let options =
    {
        cwd: cwd
    };

    exec(command, options, commandCallback);

    return deferred.promise;
};