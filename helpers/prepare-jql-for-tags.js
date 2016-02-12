"use strict";

module.exports = function prepareJQLForTags(projectsAndTags, jiraNumbers)
{
    const separator = ", ";

    let gitTags = projectsAndTags
        .filter(project => project.tags.length)
        .map(projectAndTags => projectAndTags.tags.map(tag => projectAndTags.name + "-" + tag).join(separator))
        .join(separator);

    if (jiraNumbers.length > 0)
    {
        return `project = "Company Accounts Tax Online" AND ("Git Tag" in (${gitTags}) OR Key in (${jiraNumbers.join(separator)})) ORDER BY status ASC, team ASC, key DESC`;
    }
    else
    {
        return `project = "Company Accounts Tax Online" AND "Git Tag" in (${gitTags}) ORDER BY status ASC, team ASC, key DESC`;
    }
};