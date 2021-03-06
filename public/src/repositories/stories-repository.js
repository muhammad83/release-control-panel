import $ from "jquery";
import q from "q";
import BaseRepository from "./base-repository";

let singleton = Symbol();
let singletonEnforcer = Symbol();

export class StoriesRepository extends BaseRepository
{
    constructor(enforcer)
    {
        super();

        if (enforcer !== singletonEnforcer)
        {
            throw "Cannot construct singleton";
        }
    }

    static get instance()
    {
        if (!this[singleton])
        {
            this[singleton] = new StoriesRepository(singletonEnforcer);
        }

        return this[singleton];
    }

    createReleaseFilter(releaseName)
    {
        let deferred = q.defer();

        let request = $.post(`/create-release-filter?releaseName=${releaseName}&timestamp=${+new Date()}`)
            .done(data =>
            {
                deferred.resolve(data);
            })
            .fail(response =>
            {
                deferred.reject(this.processRequestFailure(response));
            });

        this.safeMonitorRequest(request);

        return deferred.promise;
    }
}

export const storiesRepository = StoriesRepository.instance;