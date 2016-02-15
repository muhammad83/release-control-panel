import $ from "jquery";
import q from "q";
import Project from "../models/project";
import BaseRepository from "./base-repository";

let singleton = Symbol();
let singletonEnforcer = Symbol();

export class ConfigRepository extends BaseRepository
{
    constructor(enforcer)
    {
        super();

        if (enforcer !== singletonEnforcer)
        {
            throw "Cannot construct singleton";
        }

        this.ciBuildUrl = "";
        this.projects = [];
    }

    static get instance()
    {
        if (!this[singleton])
        {
            this[singleton] = new ConfigRepository(singletonEnforcer);
        }

        return this[singleton];
    }

    getProjects()
    {
        return this.projects;
    }

    loadConfig()
    {
        let deferred = q.defer();

        let request = $.get("/config")
            .done(config =>
            {
                this.ciBuildUrl = config.ciBuildUrl;
                this.projects = config.projectNames.map(projectName => new Project(projectName));

                deferred.resolve(config);
            })
            .fail(error =>
            {
                deferred.reject(this.processRequestFailure(error));
            });

        this.safeMonitorRequest(request);

        return deferred.promise;
    }
}

export const configRepository = ConfigRepository.instance;