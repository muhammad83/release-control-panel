import $ from "jquery";
import q from "q";
import BaseRepository from "./base-repository";
import ProductsRepository from "./products-repository";

let singleton = Symbol();
let singletonEnforcer = Symbol();

export default class StoriesRepository extends BaseRepository
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

    getStories(serviceName, startTag, endTag)
    {
        let deferred = q.defer();
        let encodedStartTag = encodeURIComponent(startTag);
        let encodedEndTag = encodeURIComponent(endTag);

        $.get(`/stories?serviceName=${serviceName}&startTag=${encodedStartTag}&endTag=${encodedEndTag}&timestamp=${+new Date()}`, data =>
        {
            deferred.resolve(JSON.parse(data));
        })
        .fail(response =>
        {
            deferred.reject(this.processRequestFailure(response));
        });

        return deferred.promise;
    }

    getStoriesForRelease(releaseName)
    {
        let deferred = q.defer();
        let products = ProductsRepository.instance.getProducts().map(function (p) { return p.name; }).join(",");

        $.get(`/stories-for-projects?version=${releaseName}&projects=${products}&timestamp=${+new Date()}`, data =>
        {
            deferred.resolve(JSON.parse(data));
        })
        .fail(response =>
        {
            deferred.reject(this.processRequestFailure(response));
        });

        return deferred.promise;
    }
}