"use strict";

const q = require("q");
const request = require("request");

module.exports = function getStableApplications(version)
{
    let deferred = q.defer();

    request(
        {
            method: "GET",
            uri: `https://nexus-dev.tax.service.gov.uk/service/local/repositories/hmrc-snapshots/content/uk/gov/hmrc/cato/${version}/cato-${version}.manifest`
        },
        (error, response, data) =>
        {
            if (error)
            {
                deferred.reject(error);
                return;
            }

            let applications = JSON.parse(data).applications.map(app =>
            {
                return {
                    name: app.application_name,
                    version: app.version
                };
            });


            deferred.resolve(applications);
        }
    );

    return deferred.promise;
};