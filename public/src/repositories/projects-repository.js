import $ from "jquery";
import q from "q";
import Project from "../models/project";
import BaseRepository from "./base-repository";

let singleton = Symbol();
let singletonEnforcer = Symbol();

export class ProjectsRepository extends BaseRepository
{
    constructor(enforcer)
    {
        super();

        if (enforcer !== singletonEnforcer)
        {
            throw "Cannot construct singleton";
        }

        this.projects = [];
    }

    static get instance()
    {
        if (!this[singleton])
        {
            this[singleton] = new ProjectsRepository(singletonEnforcer);
        }

        return this[singleton];
    }

    getCurrentVersions()
    {
        let deferred = q.defer();

        let request = $.get(`/current-versions`, (data) =>
        {
            deferred.resolve(JSON.parse(data));
        }).fail(error =>
        {
            deferred.reject(this.processRequestFailure(error));
        });

        this.safeMonitorRequest(request);

        return deferred.promise;
    }

    getProjects()
    {
        return this.projects;
    }

    getUpcomingReleases()
    {
        let deferred = q.defer();
        let projects = this.getProjects().map((p) => p.name);

        let request = $.get(`/releases?timestamp=${+new Date()}`, (data) =>
        {
            let jsonData = JSON.parse(data);
            let filteredRelases = jsonData.map(r =>
            {
                r.applications = r.applications.filter(a => projects.indexOf(a.name) !== -1);
                return r;
            });
            deferred.resolve(filteredRelases);
        }).fail(error =>
        {
            deferred.reject(this.processRequestFailure(error));
        });

        this.safeMonitorRequest(request);

        return deferred.promise;
    }

    loadProjects()
    {
        let deferred = q.defer();

        let request = $.get("/projectNames", data =>
        {
            let projectNames = JSON.parse(data);

            this.projects = projectNames.map(projectName => new Project(projectName));

            deferred.resolve(this.projects);
        })
        .fail(error =>
        {
            deferred.reject(this.processRequestFailure(error));
        });

        this.safeMonitorRequest(request);

        return deferred.promise;
    }
}

export const projectsRepository = ProjectsRepository.instance;