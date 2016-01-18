var q = require("q");
var tagsRepository = require("../repositories/tags-repository");

module.exports =
{
    getStableTags: function (request, response)
    {
        var serviceName = request.query.serviceName;
        tagsRepository.getStableTags(serviceName)
            .then(function (data)
            {
                response.send(JSON.stringify(data));
            })
            .catch(function (ex)
            {
                response.status(500).send(JSON.stringify(ex) || "Unknown error.");
            });
    },
    getTags: function (request, response)
    {
        var serviceName = request.query.serviceName;

        var promises = [
            tagsRepository.getTags(serviceName),
            tagsRepository.getProdReleaseNumber(serviceName)
        ];

        q.all(promises)
            .then(function (data)
            {
                response.send(JSON.stringify({
                    tags: data[0],
                    currentVersion: data[1]
                }));
            })
            .catch(function (error)
            {
                response.status(500).send(JSON.stringify(error || "Unknown error."));
            });
    }
};