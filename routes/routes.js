"use strict";

const buildsController = require("./builds");
const projectsController = require("./projects");
const storiesController = require("./stories");
const tagsController = require("./tags");

module.exports = (app) =>
{
    app.post("/create-release-filter", storiesController.createReleaseFilter);
    app.get("/current-versions", tagsController.getCurrentVersions);
    app.get("/projectNames", projectsController.getProjectNames);
    app.get("/releases", tagsController.getReleases);
    app.get("/stable-tags", tagsController.getStableTags);
    app.post("/start-build", buildsController.startBuild);
    app.get("/stories", storiesController.getStories);
    app.get("/stories-for-projects", storiesController.getStoriesForRelease);
    app.get("/successful-builds-for-projects", buildsController.getSuccessfulBuildsForProjects);
    app.get("/tags", tagsController.getTags);
};