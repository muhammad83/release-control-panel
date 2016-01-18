var config = require("../config");
var q = require("q");
var request = require("request");

function action(name)
{
    return config.jiraUrl + "/" + name;
}

function prepareJQLForTags(projectsAndTags)
{
    var query = "project = \"Company Accounts Tax Online\" AND \"Git Tag\" in (";
    query += projectsAndTags.map(function (projectAndTags)
    {
        return projectAndTags.tags.map(function (tag) { return projectAndTags.name + "-" + tag; }).join(", ");
    }).join(", ");
    query += ") ORDER BY status ASC, team ASC, key DESC";
    return query;
}

module.exports =
{
    getStoriesBetweenTagsForProjects: function(projectsAndTags)
    {
        var deferred = q.defer();

        request({
            method: "GET",
            url: action("rest/api/2/search"),
            auth: {
                user: config.username,
                pass: config.password
            },
            qs: {
                jql: prepareJQLForTags(projectsAndTags)
            },
            headers: {
                "Content-Type": "application/json"
            }
        }, function (error, response, data)
        {
            if (error)
            {
                deferred.reject(error);
                return;
            }

            var parsedData = JSON.parse(data);
            var jiraStories = parsedData.issues.map(function (issue)
            {
                return {
                    ticketNumber: issue.key,
                    message: issue.fields.summary,
                    dateTime: issue.fields.updated,
                    author: issue.fields.creator.displayName,
                    status: issue.fields.status.name,
                    url: config.jiraUrl + "/browse/" + issue.key
                };
            });

            deferred.resolve(jiraStories);
        });

        return deferred.promise;
    }
};