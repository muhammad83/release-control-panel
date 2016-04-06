import $ from "jquery";
import q from "q";
import BaseRepository from "./base-repository";
import { configRepository } from "./config-repository";
import { globalEventEmitter, Events } from "../utils/global-event-emitter";
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

    getUpcomingReleases()
    {
        let deferred = q.defer();

        let request = $.get(`/upcoming-releases`)
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

    loadBuildStatuses()
    {
        let deferred = q.defer();

        let request = $.get("/build-statuses")
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

    loadSuccessfulBuildsForProjects()
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

        let project = projectsRepository.getProjects().find(p => p.name === projectName);
        if (project)
        {
            project.onBuildScheduled(version);
        }

        globalEventEmitter.emit(Events.PROJECTS_UPDATED);

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

    updateBuildNumbersAndProgress()
    {
        let promises = [ this.loadBuildStatuses(), this.loadSuccessfulBuildsForProjects() ];
        return q.all(promises).then(results =>
        {
            let buildStatuses = results[0];
            let successfulBuilds = results[1];
            let projects = projectsRepository.getProjects();

            for (let project of projects)
            {
                project.updateBuildStatus(buildStatuses[project.name], successfulBuilds[project.name]);
            }

            globalEventEmitter.emit(Events.PROJECTS_UPDATED);
        });
    }
}

export const buildsRepository = BuildsRepository.instance;