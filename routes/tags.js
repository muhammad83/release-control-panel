var config = require("../config");
var exec = require("child_process").exec;
var path = require("path");
var q = require("q");

var workspace = process.env.WORKSPACE;

function sortReleaseNumbers(input)
{
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

function getProdReleaseVer(outputFromServer)
{
    return (/(\d.\d*.\d)/.exec(outputFromServer)|| [])[0] || null;
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

module.exports =
{
    getTags: function (request, response)
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
    }
};