"use strict";

module.exports = function prepareJQLForTickets(projectsAndTags, ticketNumbers)
{
    const separator = ", ";

    let uniqueTicketNumbers = [];
    if (ticketNumbers)
    {
        ticketNumbers.forEach(number =>
        {
            if (uniqueTicketNumbers.indexOf(number) !== -1)
                return;

            uniqueTicketNumbers.push(number);
        });
    }

    let gitTags = "";
    if (projectsAndTags)
    {
        gitTags = projectsAndTags
            .filter(project => project.tags.length)
            .map(projectAndTags => projectAndTags.tags.map(tag => projectAndTags.name + "-" + tag).join(separator))
            .join(separator);
    }

    let tagsQuery = "";
    if (gitTags.trim().length > 0)
    {
        tagsQuery = `"Git Tag" in (${gitTags})`;
    }

    let keysQuery = "";
    if (uniqueTicketNumbers.length > 0)
    {
        keysQuery = `Key in (${uniqueTicketNumbers.join(separator)})`;
    }

    if (tagsQuery.length > 0 && keysQuery.length > 0)
    {
        return `project = "Company Accounts Tax Online" AND (${tagsQuery} OR ${keysQuery}) ORDER BY status ASC, team ASC, key DESC`;
    }
    else if (tagsQuery.length > 0)
    {
        return `project = "Company Accounts Tax Online" AND ${tagsQuery} ORDER BY status ASC, team ASC, key DESC`;
    }
    else if (keysQuery.length > 0)
    {
        return `project = "Company Accounts Tax Online" AND ${keysQuery} ORDER BY status ASC, team ASC, key DESC`;
    }
    return "";
};