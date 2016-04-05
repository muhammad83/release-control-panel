"use strict";

let environments = require("./helpers/environments");

let config =
{
    ciBuildUserName: "",
    ciBuildApiToken: "",
    ciQaLeftUserName: "",
    ciQaLeftApiToken: "",
    ciQaRightUserName: "",
    ciQaRightApiToken: "",
    ciStagingUserName: "",
    ciStagingApiToken: "",
    jiraUserName: "",
    jiraPassword: "",

    maxSimultaneousProcesses: 20,
    isValid: true,
    jiraUrl: "https://jira.tools.tax.service.gov.uk",
    appsReleaseHistoryUrl: "https://releases.tax.service.gov.uk/apps",
    prodLeftUrl: "https://releases.tax.service.gov.uk/env/production-skyscape-farnborough",
    prodRightUrl: "https://releases.tax.service.gov.uk/env/production-skyscape-farnborough",
    ciBuildUrl: "https://ci-build.tax.service.gov.uk",
    ciQaLeftUrl: "https://deploy-qa-left.tax.service.gov.uk/job/deploy-microservice",
    ciQaRightUrl: "https://deploy-qa-right.tax.service.gov.uk/job/deploy-microservice",
    ciStagingUrl: "https://deploy-staging.tax.service.gov.uk/job/deploy-microservice-multiactive",
    nexus: "https://nexus-dev.tax.service.gov.uk/service/local/repositories/hmrc-snapshots/content/uk/gov/hmrc/cato/maven-metadata.xml",
    projects:
    [
        { name: "cato-filing", location: "right" },
        { name: "cato-frontend", location: "left" },
        { name: "cato-submit", location: "left" },
        { name: "files", location: "right" }
    ],
    environments:
    [
        { name: /^qa-.*$/i, type: environments.QA },
        { name: /^staging-.*$/i, type: environments.Staging },
        { name: /^prod-.*$/i, type: environments.Production },
        { name: /^production-.*$/i, type: environments.Production }
    ]
};

// Validating the configuration settings
// Stop the execution if anything goes wrong
[
    { field: "ciBuildUserName", error: "CI-BUILD user name not set." },
    { field: "ciBuildApiToken", error: "CI-BUILD api token not set." },
    { field: "ciQaLeftUserName", error: "CI-QA Left user name not set." },
    { field: "ciQaLeftApiToken", error: "CI-QA Left api token not set." },
    { field: "ciQaRightUserName", error: "CI-QA Right user name not set." },
    { field: "ciQaRightApiToken", error: "CI-QA Right api token not set." },
    { field: "ciStagingUserName", error: "CI-STAGING user name not set." },
    { field: "ciStagingApiToken", error: "CI-STAGING api token not set." },
    { field: "jiraUserName", error: "JIRA user name not set." },
    { field: "jiraPassword", error: "JIRA password not set." }
].forEach(item =>
{
    let fieldValue = config[item.field];
    if (!fieldValue || fieldValue.length === 0)
    {
        console.error(item.error);
        config.isValid = false;
    }
});

module.exports = config;