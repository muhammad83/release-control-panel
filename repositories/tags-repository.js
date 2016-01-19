"use strict";

const config = require("../config");
const exec = require("child_process").exec;
const path = require("path");
const q = require("q");
const parseXmlString = require("xml2js").parseString;
const request = require("request");

const workspace = process.env.WORKSPACE;

class TagsRepository
{
    static compareTags(tag1, tag2)
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

    static getAllStableVersions()
    {
        let deferred = q.defer();

        let address = "https://nexus-dev.tax.service.gov.uk/service/local/repositories/hmrc-snapshots/content/uk/gov/hmrc/cato/maven-metadata.xml";
        request(
            {
                method: "GET",
                uri: address
            },
            (error, response, body) =>
            {
                if (error)
                {
                    deferred.reject(error);
                    return;
                }

                parseXmlString(body, (error, result) =>
                {
                    if (error)
                    {
                        deferred.reject(error);
                        return;
                    }

                    deferred.resolve(result.metadata.versioning[0].versions[0].version);
                });
            });

        return deferred.promise;
    }
    static getProdReleaseNumber(serviceName)
    {
        let deferred = q.defer();
        let serviceCmdOptions = { cwd: path.join(workspace, serviceName) };

        let command = null;

        if(serviceName === "cato-frontend" || serviceName === "cato-submit" || serviceName === "attachments")
        {
            command = "curl -s \"" + config.prodLeftUrl + "\" | grep -E " + serviceName + " --after-context=2";
        }
        else if(serviceName === "cato-filing" || serviceName === "files")
        {
            command = "curl -s \"" + config.prodRightUrl + "\" | grep -E " + serviceName + " --after-context=2";
        }

        exec(command, serviceCmdOptions, (error, stdout) =>
        {
            if (error)
            {
                serviceName.toString();
                deferred.reject(error);
                return;
            }

            let versionNumber = this.getProdReleaseVer(stdout);

            if (versionNumber)
            {
                versionNumber = "release/" + versionNumber;
            }

            deferred.resolve(versionNumber);
        });

        return deferred.promise;
    }

    static getProdReleaseVer(outputFromServer)
    {
        return (/(\d.\d*.\d)/.exec(outputFromServer)|| [])[0] || null;
    }

    static getStableApplications(version)
    {
        let deferred = q.defer();

        let address = "https://nexus-dev.tax.service.gov.uk/service/local/repositories/hmrc-snapshots/content/uk/gov/hmrc/cato/" + version + "/cato-" + version + ".manifest";
        request(
            {
                method: "GET",
                uri: address
            },
            (error, response, data) =>
            {
                if (error)
                {
                    deferred.reject(error);
                    return;
                }

                deferred.resolve(JSON.parse(data).applications);
            }
        );

        return deferred.promise;
    }

    static getStableTags(serviceName)
    {
        return this.getAllStableVersions()
            .then(versions =>
            {
                let promises = versions.map(version => this.getStableApplications(version));
                return q.all(promises);
            })
            .then(data =>
            {
                return data.map(version =>
                    {
                        let foundApplication = version.find(app => app.application_name == serviceName);
                        return foundApplication ? "release/" + foundApplication.version : null;
                    })
                    .filter(version => version && version.indexOf(".") !== -1)
                    .sort(this.compareTags.bind(this));
            });
    }
    static getTags(serviceName)
    {
        let deferred = q.defer();
        let serviceCmdOptions = { cwd: path.join(workspace, serviceName) };

        exec("git checkout master", serviceCmdOptions, error =>
        {
            if (error)
            {
                deferred.reject(error);
                return;
            }

            exec("git pull", serviceCmdOptions, error =>
            {
                if (error)
                {
                    deferred.reject(error);
                    return;
                }

                exec("git tag --sort -version:refname", serviceCmdOptions, (error, stdout) =>
                {
                    if (error)
                    {
                        deferred.reject(error);
                        return;
                    }

                    let tags = stdout.split("\n").filter(tag => tag && tag.length > 0);
                    deferred.resolve(tags);
                });
            });
        });

        return deferred.promise;
    }
}

module.exports = TagsRepository;