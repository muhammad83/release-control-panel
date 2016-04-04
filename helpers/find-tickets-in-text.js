"use strict";

module.exports = function findTicketsInText(text)
{
    let numbers = [];
    let regex = /[A-Z]+[-_]\d+/gi;
    if (regex.test(text))
    {
        regex.lastIndex = 0;
        var result;
        while (result = regex.exec(text))
        {
            numbers.push(result[0]);
        }
    }
    return numbers;
};