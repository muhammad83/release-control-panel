import $ from "jquery";
import q from "q";
import BaseRepository from "./base-repository"
import {productsRepository} from "./products-repository";

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

    getSuccessfulBuildsForProjects()
    {
        let deferred = q.defer();
        let productNames = productsRepository.getProducts().map((product) => product.name).join(",");

        let request = $.get(`/successful-builds-for-projects?projects=${productNames}`, data =>
        {
            deferred.resolve(JSON.parse(data));
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

        let request = $.post(`/start-build`, requestData, data =>
        {
            deferred.resolve(JSON.parse(data));
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