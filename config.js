var config =
{
    ciBuildUserName: "",
    ciBuildApiToken: "",
    ciQaLeftUserName: "",
    ciQaLeftApiToken: "",
    ciQaRightUserName: "",
    ciQaRightApiToken: "",
    jiraUserName: "",
    jiraPassword: "",

    isValid: true,
    jiraUrl: "https://jira.tools.tax.service.gov.uk",
    prodLeftUrl: "https://releases.tax.service.gov.uk/env/production-skyscape-farnborough",
    prodRightUrl: "https://releases.tax.service.gov.uk/env/production-skyscape-farnborough",
    ciBuildUrl: "https://ci-build.tax.service.gov.uk",
    ciQaLeftUrl: "https://deploy-qa-left.tax.service.gov.uk",
    ciQaRightUrl: "https://deploy-qa-right.tax.service.gov.uk",
    nexus: "https://nexus-dev.tax.service.gov.uk/service/local/repositories/hmrc-snapshots/content/uk/gov/hmrc/cato/maven-metadata.xml",
    projects:
    [
        { name: "cato-filing", location: "right" },
        { name: "cato-frontend", location: "left" },
        { name: "cato-submit", location: "left" },
        { name: "files", location: "right" }
    ]
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