var config = {
    username: "",
    password: "",
    jiraUrl: "https://jira.tools.tax.service.gov.uk",
    prodLeftUrl: "https://releases.tax.service.gov.uk/env/prod-left-a",
    prodRightUrl: "https://releases.tax.service.gov.uk/env/prod-right"
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