var config = {
    username: "",
    password: "",
    jiraUrl: "https://jira.tools.tax.service.gov.uk",
    prodLeftUrl: "https://releases.tax.service.gov.uk/env/production-skyscape-farnborough",
    prodRightUrl: "https://releases.tax.service.gov.uk/env/production-skyscape-farnborough",
    nexus: "https://nexus-dev.tax.service.gov.uk/service/local/repositories/hmrc-snapshots/content/uk/gov/hmrc/cato/maven-metadata.xml"
};

if (!config.username || config.username.length == 0)
{
    console.error("Username not set.");
    throw new Error("Username not set.");
}

if (!config.password || config.password.length == 0)
{
    console.error("Password not set.");
    throw new Error("Password not set.");
}

module.exports = config;