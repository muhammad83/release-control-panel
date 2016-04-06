"use strict";

const buildsController = require("./builds");
const deploymentController = require("./deployment");
const configController = require("./config");
const statisticsController = require("./statistics");
const storiesController = require("./stories");

module.exports = (app) =>
{
    app.get("/apps-release-history", statisticsController.getAppsReleaseHistory);
    app.get("/build-statuses", buildsController.getBuildStatuses);
    app.post("/create-release-filter", storiesController.createReleaseFilter);
    app.post("/deploy-to-qa", deploymentController.deployToQA);
    app.post("/deploy-to-staging", deploymentController.deployToStaging);
    app.get("/config", configController.getConfig);
    app.post("/start-build", buildsController.startBuild);
    app.get("/successful-builds-for-projects", buildsController.getSuccessfulBuildsForProjects);
    app.get("/upcoming-releases", buildsController.getUpcomingReleases);
};