"use strict";

const getAllStableVersions = require("./get-all-stable-versions");
const getStableApplications = require("./get-stable-applications");
const q = require("q");

function compareTags(tag1, tag2)
{
    let tag1Parts = tag1.split(".").map(part => parseInt(part.substring(part.indexOf("/") + 1)));
    let tag2Parts = tag2.split(".").map(part => parseInt(part.substring(part.indexOf("/") + 1)));

    let index = 0;
    let result = 0;
    for (; index < tag1Parts.length && index < tag2Parts.length; index++)
    {
        if (tag1Parts[index] === tag2Parts[index])
            continue;

        if (tag1Parts[index] < tag2Parts[index])
        {
            result = 1;
            break;
        }
        else
        {
            result = -1;
            break;
        }
    }

    if (result === 0 && tag1Parts.length !== tag2Parts.length)
    {
        if (index === tag1Parts.length)
        {
            result = 1;
        }
        else if (index === tag2Parts.length)
        {
            result = -1;
        }
    }

    return result;
}

module.exports = function getStableTags(serviceName)
{
    return getAllStableVersions()
        .then(versions =>
        {
            let promises = versions.map(version => getStableApplications(version));
            return q.all(promises);
        })
        .then(data =>
        {
            return data.map(version =>
                {
                    let foundApplication = version.find(app => app.name == serviceName);
                    return foundApplication ? "release/" + foundApplication.version : null;
                })
                .filter(version => version && version.indexOf(".") !== -1)
                .sort(compareTags);
        });
};