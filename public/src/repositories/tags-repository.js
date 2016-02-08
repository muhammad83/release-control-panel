import $ from "jquery";
import q from "q";
import Tag from "../models/tag.js";
import BaseRepository from "./base-repository";

export default class TagsRepository extends BaseRepository
{
    static getStableTags(productName)
    {
        let deferred = q.defer();

        $.get(`/stable-tags?serviceName=${productName}&timestamp=${+new Date()}`, (data) =>
        {
            let jsonData = JSON.parse(data);
            let tags = jsonData.map((tag) => new Tag(tag));

            deferred.resolve(tags);
        }).fail(error =>
        {
            deferred.reject(this.processRequestFailure(error));
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

            deferred.resolve(
            {
                tags: tags,
                startingTagIndex: startingTagIndex
            });
        }).fail(error =>
        {
            deferred.reject(this.processRequestFailure(error));
        });

        return deferred.promise;
    }
}