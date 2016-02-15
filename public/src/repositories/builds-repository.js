import $ from "jquery";
import q from "q";
import BaseRepository from "./base-repository";
import { configRepository } from "./config-repository";
import { projectsRepository } from "./projects-repository";

let singleton = Symbol();
let singletonEnforcer = Symbol();

export class BuildsRepository extends BaseRepository
{
    constructor(enforcer)
    {
        super();

        if (enforcer !== singletonEnforcer)
        {
            throw "Cannot construct singleton!";
        }
    }

    static get instance()
    {
        if (!this[singleton])
        {
            this[singleton] = new BuildsRepository(singletonEnforcer);
        }

        return this[singleton];
    }

    getCiBuildJobUrl(projectName, jobNumber)
    {
        return `${this.getCiBuildProjectUrl(projectName)}${jobNumber}/`;
    }

    getCiBuildProjectUrl(projectName)
    {
        return `${configRepository.ciBuildUrl}/job/${projectName}/`;
    }

    getBuildStatuses()
    {
        let deferred = q.defer();

        let request = $.get("/build-statuses")
            .done(data =>
            {
                let projects = projectsRepository.getProjects();
                for (let project of projects)
                {
                    project.updateBuildStatus(data[projects.name]);
                }
            })
            .fail(error =>
            {
                deferred.reject(this.processRequestFailure(error));
            });

        this.safeMonitorRequest(request);

        return deferred.promise;
    }

    getSuccessfulBuildsForProjects()
    {
        let deferred = q.defer();

        let request = $.get(`/successful-builds-for-projects`)
            .done(data =>
            {
                deferred.resolve(data);
            })
            .fail(error =>
            {
                deferred.reject(this.processRequestFailure(error));
            });

        this.safeMonitorRequest(request);

        return deferred.promise;
    }

    startBuild(projectName, version)
    {
        let deferred = q.defer();
        let requestData =
        {
            project: projectName,
            version: version
        };

        let request = $.post(`/start-build`, requestData)
            .done(data =>
            {
                deferred.resolve(data);
            })
            .fail(error =>
            {
                deferred.reject(this.processRequestFailure(error));
            });

        this.safeMonitorRequest(request);

        return deferred.promise;
    }
}

export const buildsRepository = BuildsRepository.instance;