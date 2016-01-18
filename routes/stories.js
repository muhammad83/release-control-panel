var storiesRepository = require("../repositories/stories-repository");

module.exports =
{
    getStories: function (request, response)
    {
        var serviceName = request.query.serviceName;
        var endTag = request.query.endTag;
        var startTag = request.query.startTag;

        storiesRepository.getStoriesBetweenTags(serviceName, startTag, endTag)
            .then(function(data)
            {
                response.send(JSON.stringify(data));
            })
            .catch(function (error)
            {
                response.status(500).send(JSON.stringify(error || "Unknown error."));
            })
    },
    getStoriesForRelease: function(request, response)
    {
        var projects = request.query.projects.split(",");

    }
};