import $ from "jquery";
import q from "q";

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
}