import $ from "jquery";
import q from "q";
import Tag from "../models/tag.js";

export default class TagsRepository
{
    static getReleases()
    {
        let deferred = q.defer();

        $.get(`/releases?timestamp=${+new Date()}`, (data) =>
        {
            let jsonData = JSON.parse(data);
            deferred.resolve(jsonData);
        }).fail(() =>
        {
            deferred.reject();
        });

        return deferred.promise;
    }

    static getStableTags(productName)
    {
        let deferred = q.defer();

        $.get(`/stable-tags?serviceName=${productName}&timestamp=${+new Date()}`, (data) =>
        {
            let jsonData = JSON.parse(data);
            let tags = jsonData.map((tag) => new Tag(tag));

            deferred.resolve(tags);
        }).fail(() =>
        {
            deferred.reject();
        });

        return deferred.promise;
    }

    static getTags(productName)
    {
        let deferred = q.defer();

        $.get(`/tags?serviceName=${productName}&timestamp=${+new Date()}`, (data) =>
        {
            let jsonData = JSON.parse(data);
            let tags = jsonData.tags.map((tag) => new Tag(tag));
            let startingTagIndex = jsonData.currentVersion ? tags.findIndex((tag) => { return tag.name == jsonData.currentVersion}) : -1;

            deferred.resolve({
                tags: tags,
                startingTagIndex: startingTagIndex
            });
        }).fail(() =>
        {
            deferred.reject();
        });

        return deferred.promise;
    }
}