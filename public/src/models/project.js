var nextProjectKey = 1;

export default class Project
{
    constructor(name)
    {
        this.key = nextProjectKey++;
        this.name = name;
    }
}