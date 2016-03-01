"use strict";

const getAppsReleaseHistory = require("../actions/get-apps-release-history");

class Statistics
{
    static getAppsReleaseHistory(request, response)
    {
        getAppsReleaseHistory()
            .then(data =>
            {
                response.send(data);
            })
            .catch(error =>
            {
                response.status(500).send(error || "Unknown error.");
            });
    }
}

module.exports = Statistics;