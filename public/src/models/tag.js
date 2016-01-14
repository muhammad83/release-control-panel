export default class Tag
{
    constructor(serverTag)
    {
        this.name = serverTag;
    }

    compare(otherTag)
    {
        return this.name.localeCompare(otherTag.name);
    }
}