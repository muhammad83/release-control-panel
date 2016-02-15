function clearSelection()
{
    if (window.getSelection)
    {
        if (window.getSelection().empty)
        {
            window.getSelection().empty();
        }
        else if (window.getSelection().removeAllRanges)
        {
            window.getSelection().removeAllRanges();
        }
    }
    else if (document.selection)
    {
        document.selection.empty();
    }
}

export default function copyContent(selector)
{
    let commandLineScript = document.querySelector(selector);
    let range = document.createRange();
    let selection = window.getSelection();
    let result = true;

    clearSelection();

    range.selectNode(commandLineScript);
    selection.addRange(range);

    try
    {
        document.execCommand("copy");
    }
    catch (ex)
    {
        console.error("Sorry bro, your browser does not support 'copy' command. Move on and get something which actually works!");
        result = false;
    }

    clearSelection();

    return result;
}