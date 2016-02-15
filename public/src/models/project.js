var nextProjectKey = 1;

export default class Project
{
    constructor(name)
    {
        this.buildNumber = null;
        this.buildVersion = null;
        this.isBuilding = false;
        this.key = nextProjectKey++;
        this.name = name;
        this.pendingVersions = [];
    }

    isVersionBeingBuilt(version)
    {
        return this.isBuilding && this.buildVersion === version;
    }

    isVersionPending(version)
    {
        return this.pendingVersions.indexOf(version) !== -1;
    }

    updateBuildStatus(buildStatus)
    {
        if (!buildStatus)
        {
            if (this.isBuilding)
            {
                this.isBuilding = false;
                this.buildNumber = null;
                this.buildVersion = null;
            }
        }
        else
        {
            this.buildNumber = buildStatus.number;
            this.buildVersion = buildStatus.version;
            this.isBuilding = true;

            let pendingIndex = this.pendingVersions.indexOf(this.buildVersion);
            if (pendingIndex !== -1)
            {
                this.pendingVersions.splice(pendingIndex, 1);
            }
        }
    }
}