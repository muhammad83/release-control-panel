"use strict";

const config = require("../config");
const exec = require("child_process").exec;
const path = require("path");
const q = require("q");
const workspace = process.env.WORKSPACE;

function getProdReleaseVer(outputFromServer)
{
    return (/(\d.\d*.\d)/.exec(outputFromServer)|| [])[0] || null;
}

module.exports = function getProdReleaseNumber(serviceName)
{
    let deferred = q.defer();
    let serviceCmdOptions = { cwd: path.join(workspace, serviceName) };

    let command = null;

    if(serviceName === "cato-frontend" || serviceName === "cato-submit")
    {
        command = "curl -s \"" + config.prodLeftUrl + "\" | grep -E " + serviceName + " --after-context=2";
    }
    else if(serviceName === "cato-filing" || serviceName === "files")
    {
        command = "curl -s \"" + config.prodRightUrl + "\" | grep -E " + serviceName + " --after-context=2";
    }

    exec(command, serviceCmdOptions, (error, stdout) =>
    {
        if (error)
        {
            serviceName.toString();
            deferred.reject(error);
            return;
        }

        let versionNumber = getProdReleaseVer(stdout);

        if (versionNumber)
        {
            versionNumber = "release/" + versionNumber;
        }

        deferred.resolve(versionNumber);
    });

    return deferred.promise;
};