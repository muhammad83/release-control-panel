import $ from "jquery";
import q from "q";
import Tag from "../models/tag.js";

export default class TagsRepository
{
    static getStableTags(productName)
    {
        let deferred = q.defer();

        $.get(`stable-tags?serviceName=${productName}&timestamp=${+new Date()}`, (data) =>
        {
            let jsonData = JSON.parse(data);
            let tags = jsonData.tags.map((tag) => new Tag(tag)).sort((tag1, tag2) =>
            {
                return tag2.compare(tag1);
            });
        });

        return deferred.promise;
    }

    static getTags(productName)
    {
        let deferred = q.defer();

        $.get(`tags?serviceName=${productName}&timestamp=${+new Date()}`, (data) =>
        {
            let jsonData = JSON.parse(data);
            let tags = jsonData.tags.map((tag) => new Tag(tag)).sort((tag1, tag2) =>
            {
                return tag2.compare(tag1);
            });
            let startingTagIndex = jsonData.currentVersion ? tags.findIndex((tag) => { return tag.name == jsonData.currentVersion}) : -1;

            deferred.resolve({
                tags: tags,
                startingTagIndex: startingTagIndex
            });
        });

        return deferred.promise;
    }
}