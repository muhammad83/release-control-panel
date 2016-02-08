var config = {
    isValid: true,
    jiraUserName: "",
    jiraPassword: "",
    jiraUrl: "https://jira.tools.tax.service.gov.uk",
    prodLeftUrl: "https://releases.tax.service.gov.uk/env/production-skyscape-farnborough",
    prodRightUrl: "https://releases.tax.service.gov.uk/env/production-skyscape-farnborough",
    nexus: "https://nexus-dev.tax.service.gov.uk/service/local/repositories/hmrc-snapshots/content/uk/gov/hmrc/cato/maven-metadata.xml",
    ciBuildUserName: "",
    ciBuildApiToken: "",
    ciBuildUrl: "https://ci-build.tax.service.gov.uk"
};

verifyNonEmpty("jiraUserName", "JIRA username not set.");
verifyNonEmpty("jiraPassword", "JIRA password not set.");
verifyNonEmpty("ciBuildUserName", "CI-BUILD username not set.");
verifyNonEmpty("ciBuildApiToken", "CI-BUILD api token not set.");

module.exports = config;

function verifyNonEmpty(key, errorMessage)
{
    if (!config[key] || config[key].length === 0)
    {
        console.error(errorMessage);
        config.isValid = false;
    }
}