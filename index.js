var express = require('express');
var app = express();
var path = require("path");
var fs = require("fs");
var exec = require("child_process").exec;
var q = require("q");
var config = require("./config");

var workspace = process.env.WORKSPACE;

function requestJiraTicketInfo(id, ticketNumber)
{
    var deferred = q.defer();
    var getJiraStatus = "curl -s -u " + config.username + ":" + config.password + " -X GET -H \"Content-Type: application/json\" " + config.jiraUrl + "/rest/api/latest/issue/" + ticketNumber + "\?fields\=status";

    exec(getJiraStatus, function (error, stdout)
    {
        console.log(stdout)
        deferred.resolve({
            id: id,
            status: JSON.parse(stdout).fields.status.name
        });
    });

    return deferred.promise;
}

app.get('/tags', function (request, response)
{
    var serviceName = request.query.serviceName;

    var promises = [
        getTags(serviceName),
        getProdReleaseNumber(serviceName)
    ];

    q.all(promises).then(function (data)
    {
        response.send(JSON.stringify({
            tags: data[0],
            currentVersion: data[1]
        }));
    });
});

app.get("/stories", function (request, response)
{
    var serviceName = request.query.serviceName;
    var serviceCmdOptions = { cwd: path.join(workspace, serviceName) };

    var endTag = request.query.endTag;
    var startTag = request.query.startTag;
    var command = "git log --date-order --pretty=format:\"%s----__-----%h----__-----%aI----__-----%an\" " + startTag + "..." + endTag + " | grep -v \"Merge\" | sort";

    exec(command, serviceCmdOptions, function (error, stdout)
    {
        //console.log(stdout)
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

        var promises = parsedLogEntries.filter(function (entry)
        {
            return entry.ticketNumber !== null;
        }).map(function (entry)
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

            response.send(JSON.stringify(parsedLogEntries));
        });
    });
});

function getTags(serviceName)
{
    var deferred = q.defer();
    var serviceCmdOptions = { cwd: path.join(workspace, serviceName) };

    exec("git checkout master", serviceCmdOptions, function ()
    {
        exec("git pull", serviceCmdOptions, function ()
        {
            exec("git tag", serviceCmdOptions, function (error, stdout)
            {
                var tags = stdout.split("\n");
                var sorted = sortReleaseNumbers(tags);
                console.log(sorted);
                //tags.sort();
                //console.log(tags)
                deferred.resolve(tags);
            });
        });
    });

    return deferred.promise;
}

function sortReleaseNumbers(input) {
    var output,
        i,
        len;

    output = [];

    // Unglue decimal parts
    for (i = 0, len = input.length; i < len; i++) {
        console.log(input[i]);
        output.push(input[i].split('.'));
    }

    console.log(output);

    // Apply custom sort
    output.sort(function (a, b) {
        for (i = 0, len = a.length; i < len; i++) {
            // cast decimal part to int
            a[i] = parseInt(a[i], 100);
            b[i] = parseInt(b[i], 100);
            //c[i] = parseInt(c[i], 100);

            if (a[i] !== b[i]) {
                return a[i] - b[i];
            }
        }
    });

    // Rejoin decimal parts
    for (i = 0, len = input.length; i < len; i++) {

            output[i].push(output[i].join("."));
    }

    return output;
}

function getProdReleaseNumber(serviceName)
{
    var deferred = q.defer();
    var serviceCmdOptions = { cwd: path.join(workspace, serviceName) };

    var command = null;

    if(serviceName === "cato-frontend" || serviceName === "cato-submit" || serviceName === "attachments")
    {
        command = "curl -s \"" + config.prodLeftUrl + "\" | grep -E " + serviceName + " --after-context=2";
    }
    else if(serviceName === "cato-filing" || serviceName === "files")
    {
        command = "curl -s \"" + config.prodRightUrl + "\" | grep -E " + serviceName + " --after-context=2";
    }

    exec(command, serviceCmdOptions, function (error, stdout)
    {
        var versionNumber = getProdReleaseVer(stdout);

        if (versionNumber)
        {
            versionNumber = "release/" + versionNumber;
        }

        deferred.resolve(versionNumber);
    });

    return deferred.promise;
}

function getProdReleaseVer(outputFromServer)
{
    return (/(\d.\d*.\d)/.exec(outputFromServer)|| [])[0] || null;
}

app.use(express.static("public"));

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Tag app listening at http://%s:%s', host, port);
});