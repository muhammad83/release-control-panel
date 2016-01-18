import $ from "jquery";
import q from "q";
import ProductsRepository from "./products-repository";

export default class StoriesRepository
{
    static getStories(serviceName, startTag, endTag)
    {
        let deferred = q.defer();
        let encodedStartTag = encodeURIComponent(startTag);
        let encodedEndTag = encodeURIComponent(endTag);

        $.get(`/stories?serviceName=${serviceName}&startTag=${encodedStartTag}&endTag=${encodedEndTag}&timestamp=${+new Date()}`, (data) =>
        {
            deferred.resolve(JSON.parse(data));
        })
        .fail(() =>
        {
            deferred.reject();
        });

        return deferred.promise;
    }

    static getStoriesForRelease(releaseName)
    {
        let deferred = q.defer();
        let products = ProductsRepository.getProducts().map(function (p) { return p.name; }).join(",");

        $.get(`/stories-for-projects?version=${releaseName}&projects=${products}&timestamp=${+new Date()}`, (data)=>
        {
            deferred.resolve(JSON.parse(data));
        })
        .fail(() =>
        {
            deferred.reject();
        });

        return deferred.promise;
    }
}