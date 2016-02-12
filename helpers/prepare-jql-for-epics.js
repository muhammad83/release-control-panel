"use strict";

module.exports = function prepareJQLForEpics(epicsKeys)
{
    return `Key in (${epicsKeys.join(", ")})`;
};