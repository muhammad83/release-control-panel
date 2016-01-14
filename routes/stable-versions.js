var parseXmlString= require("xml2js").parseString;
var q = require("q");
var request = require("request");

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
    getStableVersions: function (request, response)
    {
        var serviceName = request.query.serviceName;

        getAllStableVersions().then(function (versions)
        {
            var promises = versions.map(function (version) { return getStableApplications(version); });
            return q.all(promises).then(function (data)
            {
                var applicationVersions = data.map(function (version)
                {
                    return (version.find(function (app) { return app.application_name == serviceName; }) || {}).version;
                });
                response.send(JSON.stringify(applicationVersions));
            });
        }).catch(function(ex)
        {
            response.send(JSON.stringify(ex));
        });
    }
};