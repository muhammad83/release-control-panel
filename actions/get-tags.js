"use strict";

const exec = require("child_process").exec;
const path = require("path");
const q = require("q");
const workspace = process.env.WORKSPACE;

module.exports = function getTags(serviceName)
{
    let deferred = q.defer();
    let serviceCmdOptions = { cwd: path.join(workspace, serviceName) };

    exec("git checkout master", serviceCmdOptions, error =>
    {
        if (error)
        {
            deferred.reject(error);
            return;
        }

        exec("git pull", serviceCmdOptions, error =>
        {
            if (error)
            {
                deferred.reject(error);
                return;
            }

            exec("git tag --sort -version:refname", serviceCmdOptions, (error, stdout) =>
            {
                if (error)
                {
                    deferred.reject(error);
                    return;
                }

                let tags = stdout.split("\n").filter(tag => tag && tag.length > 0);
                deferred.resolve(tags);
            });
        });
    });

    return deferred.promise;
};