"use strict";

const config = require("../config");
const getProjectNames = require("../helpers/get-project-names");

class Config
{
    static getConfig(request, response)
    {
        response.send(
        {
            ciBuildUrl: config.ciBuildUrl,
            projectNames: getProjectNames()
        });
    }
}

module.exports = Config;