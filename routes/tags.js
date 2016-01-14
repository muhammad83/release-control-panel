var config = require("../config");
var exec = require("child_process").exec;
var path = require("path");
var q = require("q");
var parseXmlString= require("xml2js").parseString;
var request = require("request");

var workspace = process.env.WORKSPACE;

function getTags(serviceName)
{
    var deferred = q.defer();
    var serviceCmdOptions = { cwd: path.join(workspace, serviceName) };

    exec("git checkout master", serviceCmdOptions, function ()
    {
        exec("git pull", serviceCmdOptions, function ()
        {
            exec("git tag", serviceCmdOptions, function (error, stdout)
            {
                var tags = stdout.split("\n").filter(function (tag) { return tag && tag.length > 0; });
                deferred.resolve(tags);
            });
        });
    });

    return deferred.promise;
}

function getProdReleaseVer(outputFromServer)
{
    return (/(\d.\d*.\d)/.exec(outputFromServer)|| [])[0] || null;
}

function getProdReleaseNumber(serviceName)
{
    var deferred = q.defer();
    var serviceCmdOptions = { cwd: path.join(workspace, serviceName) };

    var command = null;

    if(serviceName === "cato-frontend" || serviceName === "cato-submit" || serviceName === "attachments")
    {
        command = "curl -s \"" + config.prodLeftUrl + "\" | grep -E " + serviceName + " --after-context=2";
    }
    else if(serviceName === "cato-filing" || serviceName === "files")
    {
        command = "curl -s \"" + config.prodRightUrl + "\" | grep -E " + serviceName + " --after-context=2";
    }

    exec(command, serviceCmdOptions, function (error, stdout)
    {
        var versionNumber = getProdReleaseVer(stdout);

        if (versionNumber)
        {
            versionNumber = "release/" + versionNumber;
        }

        deferred.resolve(versionNumber);
    });

    return deferred.promise;
}

function getAllStableVersions()
{
    var deferred = q.defer();

    var address = "https://nexus-dev.tax.service.gov.uk/service/local/repositories/hmrc-snapshots/content/uk/gov/hmrc/cato/maven-metadata.xml";
    request(
        {
            method: "GET",
            uri: address
        },
        function (error, response, body)
        {
            if (error)
            {
                deferred.reject(error);
                return;
            }

            parseXmlString(body, function (error, result)
            {
                if (error)
                {
                    deferred.reject(error);
                    return;
                }

                deferred.resolve(result.metadata.versioning[0].versions[0].version);
            });
        });

    return deferred.promise;
}

function getStableApplications(version)
{
    var deferred = q.defer();

    var address = "https://nexus-dev.tax.service.gov.uk/service/local/repositories/hmrc-snapshots/content/uk/gov/hmrc/cato/" + version + "/cato-" + version + ".manifest";
    request(
        {
            method: "GET",
            uri: address
        },
        function (error, response, data)
        {
            if (error)
            {
                deferred.reject(error);
                return;
            }

            deferred.resolve(JSON.parse(data).applications);
        }
    );

    return deferred.promise;
}

module.exports =
{
    getStableTags: function (request, response)
    {
        var serviceName = request.query.serviceName;

        getAllStableVersions().then(function (versions)
        {
            var promises = versions.map(function (version) { return getStableApplications(version); });
            return q.all(promises);
        }).then(function (data)
        {
            var applicationVersions = data.map(function (version)
            {
                return (version.find(function (app) { return app.application_name == serviceName; }) || {}).version;
            });
            response.send(JSON.stringify(applicationVersions));
        }).catch(function(ex)
        {
            response.send(JSON.stringify(ex));
        });
    },
    getTags: function (request, response)
    {
        var serviceName = request.query.serviceName;

        var promises = [
            getTags(serviceName),
            getProdReleaseNumber(serviceName)
        ];

        q.all(promises).then(function (data)
        {
            response.send(JSON.stringify({
                tags: data[0],
                currentVersion: data[1]
            }));
        });
    }
};