import $ from "jquery";
import q from "q";
import BaseRepository from "./base-repository"
import ProductsRepository from "./products-repository";

export default class BuildsRepository extends BaseRepository
{
    static getSuccessfulBuildsForProjects()
    {
        let deferred = q.defer();
        let productNames = ProductsRepository.getProducts().map((product) => product.name).join(",");

        $.get(`/successful-builds-for-projects?projects=${productNames}`, data =>
        {
            deferred.resolve(JSON.parse(data));
        })
        .fail(error =>
        {
            deferred.reject(this.processRequestFailure(error));
        });

        return deferred.promise;
    }

    static startBuild(projectName, version)
    {
        let deferred = q.defer();
        let requestData =
        {
            project: projectName,
            version: version
        };

        $.post(`/start-build`, requestData, data =>
        {
            deferred.resolve(JSON.parse(data));
        })
        .fail(error =>
        {
            deferred.reject(this.processRequestFailure(error));
        });

        return deferred.promise;
    }
}