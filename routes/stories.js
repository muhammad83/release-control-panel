var config = require("../config");
var exec = require("child_process").exec;
var path = require("path");
var q = require("q");

var workspace = process.env.WORKSPACE;

function requestJiraTicketInfo(id, ticketNumber)
{
    var deferred = q.defer();
    var getJiraStatus = "curl -s -u \"" + config.username + "\":\"" + config.password + "\" -X GET -H \"Content-Type: application/json\" " + config.jiraUrl + "/rest/api/latest/issue/" + ticketNumber + "\?fields\=status";

    exec(getJiraStatus, function (error, stdout)
    {
        deferred.resolve({
            id: id,
            status: JSON.parse(stdout).fields.status.name
        });
    });

    return deferred.promise;
}

function getStoriesBetweenTags(serviceName, startTag, endTag)
{
    var deferred = q.defer();
    var serviceCmdOptions = {cwd: path.join(workspace, serviceName)};
    var command = "git log --date-order --pretty=format:\"%s----__-----%h----__-----%aI----__-----%an\" " + startTag + "..." + endTag + " | grep -v \"Merge\" | sort";

    exec(command, serviceCmdOptions, function (error, stdout)
    {
        var logEntries = stdout.split("\n");
        logEntries.splice(logEntries.length - 1);

        var id = 1;
        var parsedLogEntries = logEntries.map(function (log)
        {
            log = log.split("----__-----");
            var message = log[0];
            return {
                id: id++,
                ticketNumber: (/([A-Z]+[- _]\d+)/.exec(message) || [])[1] || null,
                message: message,
                hash: log[1],
                dateTime: log[2],
                author: log[3]
            };
        });

        var promises = parsedLogEntries
            .filter(function (entry)
            {
                return entry.ticketNumber !== null;
            })
            .map(function (entry)
            {
                return requestJiraTicketInfo(entry.id, entry.ticketNumber);
            });

        q.all(promises).then(function (statuses)
        {
            for (var statusIndex = 0; statusIndex < (statuses || []).length; statusIndex++)
            {
                var status = statuses[statusIndex];

                for (var entryIndex = 0; entryIndex < parsedLogEntries.length; entryIndex++)
                {
                    var logEntry = parsedLogEntries[entryIndex];
                    if (logEntry.id == status.id)
                    {
                        logEntry.status = status.status;
                        break;
                    }
                }
            }

            deferred.resolve(parsedLogEntries);
        });
    });

    return deferred.promise;
}

module.exports =
{
    getStories: function (request, response)
    {
        var serviceName = request.query.serviceName;
        var endTag = request.query.endTag;
        var startTag = request.query.startTag;

        getStoriesBetweenTags(serviceName, startTag, endTag).then(function(stories)
        {
            response.send(JSON.stringify(stories));
        });
    },
    getStoriesForRelease: function(request, response)
    {
        var projects = request.query.projects.split(",");

    }
};