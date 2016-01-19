"use strict";

const storiesController = require("./stories");
const tagsController = require("./tags");

module.exports = (app) =>
{
    app.get("/current-versions", tagsController.getCurrentVersions);
    app.get("/releases", tagsController.getReleases);
    app.get("/stable-tags", tagsController.getStableTags);
    app.get("/stories", storiesController.getStories);
    app.get("/stories-for-projects", storiesController.getStoriesForRelease);
    app.get("/tags", tagsController.getTags);
};