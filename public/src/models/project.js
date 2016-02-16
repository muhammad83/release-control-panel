var nextProjectKey = 1;

export default class Project
{
    constructor(name)
    {
        this.buildNumbers = {};
        this.key = nextProjectKey++;
        this.name = name;
        this.pendingBuilds = [];
        this.runningBuildNumber = null;
        this.runningBuildVersion = null;
        this.successfulBuilds = [];
    }

    getBuildNumber(version)
    {
        if (this.isBuildRunning(version))
        {
            return this.runningBuildNumber;
        }

        return this.buildNumbers[version];
    }

    isBuildRunning(version)
    {
        return this.runningBuildVersion === version;
    }

    isBuildScheduled(version)
    {
        return this.pendingBuilds.indexOf(version) !== -1;
    }

    isBuilt(version)
    {
        return this.successfulBuilds.indexOf(version) !== -1;
    }

    onBuildScheduled(version)
    {
        if (this.pendingBuilds.indexOf(version) === -1)
        {
            this.pendingBuilds.push(version);
        }
    }

    updateBuildStatus(buildStatus, successfulBuilds)
    {
        if (successfulBuilds)
        {
            for (let successfulVersion in successfulBuilds)
            {
                if (!successfulBuilds.hasOwnProperty(successfulVersion))
                    continue;

                let indexOfPendingBuild = this.pendingBuilds.indexOf(successfulVersion);
                if (indexOfPendingBuild !== -1)
                {
                    this.pendingBuilds.splice(indexOfPendingBuild, 1);
                }

                if (this.successfulBuilds.indexOf(successfulVersion) === -1)
                {
                    this.successfulBuilds.push(successfulVersion);
                    this.buildNumbers[successfulVersion] = successfulBuilds[successfulVersion].buildNumber;
                }
            }
        }

        if (buildStatus && buildStatus.isBuilding)
        {
            this.runningBuildNumber = buildStatus.number;
            this.runningBuildVersion = buildStatus.version;
        }
        else
        {
            this.runningBuildNumber = null;
            this.runningBuildVersion = null;
        }
    }
}