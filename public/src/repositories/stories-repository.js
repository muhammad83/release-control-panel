import $ from "jquery";
import q from "q";
import BaseRepository from "./base-repository";
import {projectsRepository} from "./projects-repository";

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
        let projects = projectsRepository.getProjects().map(function (p) { return p.name; }).join(",");

        let request = $.post(`/create-release-filter?version=${releaseName}&projects=${projects}&timestamp=${+new Date()}`)
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

    getStories(serviceName, startTag, endTag)
    {
        let deferred = q.defer();
        let encodedStartTag = encodeURIComponent(startTag);
        let encodedEndTag = encodeURIComponent(endTag);

        let request = $.get(`/stories?serviceName=${serviceName}&startTag=${encodedStartTag}&endTag=${encodedEndTag}&timestamp=${+new Date()}`)
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

    getStoriesForRelease(releaseName)
    {
        let deferred = q.defer();
        let projects = projectsRepository.getProjects().map(function (p) { return p.name; }).join(",");

        let request = $.get(`/stories-for-projects?version=${releaseName}&projects=${projects}&timestamp=${+new Date()}`)
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