var config = require("../config");
var exec = require("child_process").exec;
var path = require("path");
var q = require("q");
var parseXmlString= require("xml2js").parseString;
var request = require("request");

var workspace = process.env.WORKSPACE;

function compareTags(tag1, tag2)
{
    var tag1Parts = tag1.split(".").map(function (part) { return parseInt(part.substring(part.indexOf("/") + 1)); });
    var tag2Parts = tag2.split(".").map(function (part) { return parseInt(part.substring(part.indexOf("/") + 1)); });

    var index = 0;
    var result = 0;
    for (; index < tag1Parts.length && index < tag2Parts.length; index++)
    {
        if (tag1Parts[index] === tag2Parts[index])
            continue;

        if (tag1Parts[index] < tag2Parts[index])
        {
            result = 1;
            break;
        }
        else
        {
            result = -1;
            break;
        }
    }

    if (result === 0 && tag1Parts.length !== tag2Parts.length)
    {
        if (index === tag1Parts.length)
        {
            result = 1;
        }
        else if (index === tag2Parts.length)
        {
            result = -1;
        }
    }

    return result;
}

module.exports =
{
    getAllStableVersions: function()
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
    },
    getProdReleaseNumber: function(serviceName)
    {
        function getProdReleaseVer(outputFromServer)
        {
            return (/(\d.\d*.\d)/.exec(outputFromServer)|| [])[0] || null;
        }

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
    },
    getStableApplications: function(version)
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
    },
    getStableTags: function (serviceName)
    {
        return this.getAllStableVersions()
            .then(function (versions)
            {
                var promises = versions.map(function (version) { return this.getStableApplications(version); }.bind(this));
                return q.all(promises);
            }.bind(this))
            .then(function (data)
            {
                return data.map(function (version)
                    {
                        var foundApplication = version.find(function (app) { return app.application_name == serviceName; });
                        return foundApplication ? "release/" + foundApplication.version : null;
                    })
                    .filter(function (version)
                    {
                        return version && version.indexOf(".") !== -1;
                    })
                    .sort(compareTags);
            });
    },
    getTags: function(serviceName)
    {
        var deferred = q.defer();
        var serviceCmdOptions = { cwd: path.join(workspace, serviceName) };

        exec("git checkout master", serviceCmdOptions, function ()
        {
            exec("git pull", serviceCmdOptions, function ()
            {
                exec("git tag", serviceCmdOptions, function (error, stdout)
                {
                    var tags = stdout.split("\n").filter(function (tag) { return tag && tag.length > 0; }).sort(compareTags);
                    deferred.resolve(tags);
                });
            });
        });

        return deferred.promise;
    }
};