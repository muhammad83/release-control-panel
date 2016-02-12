"use strict";

const config = require("../config");
const parseXmlString = require("xml2js").parseString;
const q = require("q");
const request = require("request");

module.exports = function getAllStableVersions()
{
    let deferred = q.defer();

    let address = config.nexus;
    request(
        {
            method: "GET",
            uri: address
        },
        (error, response, body) =>
        {
            if (error)
            {
                deferred.reject(error);
                return;
            }

            parseXmlString(body, (error, result) =>
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
};