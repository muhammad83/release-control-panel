import $ from "jquery";
import q from "q";
import BaseRepository from "./base-repository";
import ProductsRepository from "./products-repository";

export default class StoriesRepository extends BaseRepository
{
    static getStories(serviceName, startTag, endTag)
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

    static getStoriesForRelease(releaseName)
    {
        let deferred = q.defer();
        let products = ProductsRepository.getProducts().map(function (p) { return p.name; }).join(",");

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