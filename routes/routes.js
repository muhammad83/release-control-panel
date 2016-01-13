var storiesController = require("./stories");
var tagsController = require("./tags");

module.exports = function (app)
{
    app.get("/stories", storiesController.getStories);
    app.get("/tags", tagsController.getTags);
};