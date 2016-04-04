"use strict";

const buildsController = require("./builds");
const deploymentController = require("./deployment");
const configController = require("./config");
const statisticsController = require("./statistics");
const storiesController = require("./stories");
const tagsController = require("./tags");

module.exports = (app) =>
{
    app.get("/apps-release-history", statisticsController.getAppsReleaseHistory);
    app.get("/build-statuses", buildsController.getBuildStatuses);
    app.post("/create-release-filter", storiesController.createReleaseFilter);
    app.get("/current-versions", tagsController.getCurrentVersions);
    app.post("/deploy-to-qa", deploymentController.deployToQA);
    app.post("/deploy-to-staging", deploymentController.deployToStaging);
    app.get("/config", configController.getConfig);
    app.get("/releases", tagsController.getReleases);
    app.get("/stable-tags", tagsController.getStableTags);
    app.post("/start-build", buildsController.startBuild);
    app.get("/stories", storiesController.getStories);
    app.get("/stories-for-projects", storiesController.getStoriesForRelease);
    app.get("/successful-builds-for-projects", buildsController.getSuccessfulBuildsForProjects);
    app.get("/tags", tagsController.getTags);
    app.get("/upcoming-releases", buildsController.getUpcomingReleases);
};