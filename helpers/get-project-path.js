"use strict";

const path = require("path");
const workspace = process.env.WORKSPACE;

module.exports = function getProjectPath(name)
{
    return path.join(workspace, name);
};