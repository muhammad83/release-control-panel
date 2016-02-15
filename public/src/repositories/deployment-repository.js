import $ from "jquery";
import q from "q";
import BaseRepository from "./base-repository"

let singleton = Symbol();
let singletonEnforcer = Symbol();

export class DeploymentRepository extends BaseRepository
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
            this[singleton] = new DeploymentRepository(singletonEnforcer);
        }

        return this[singleton];
    }

    deployToQA(projectName, version)
    {
        let deferred = q.defer();
        let requestData =
        {
            projectName: projectName,
            version: version
        };

        let request = $.post("/deploy-to-qa", requestData)
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

    deployToStaging(projectName, version)
    {
        let deferred = q.defer();
        let requestData =
        {
            projectName: projectName,
            version: version
        };

        let request = $.post("/deploy-to-staging", requestData)
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

export const deploymentRepository = DeploymentRepository.instance;