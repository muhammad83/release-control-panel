import $ from "jquery";
import q from "q";
import Product from "../models/product";
import BaseRepository from "./base-repository";

export default class ProductsRepository extends BaseRepository
{
    static getCurrentVersions()
    {
        let deferred = q.defer();
        let productNames = this.getProducts().map((product) => product.name).join(",");

        $.get(`/current-versions?projects=${productNames}`, (data) =>
        {
            deferred.resolve(JSON.parse(data));
        }).fail(error =>
        {
            deferred.reject(this.processRequestFailure(error));
        });

        return deferred.promise;
    }

    static getProducts()
    {
        return [
            new Product("cato-filing"),
            new Product("cato-frontend"),
            new Product("cato-submit"),
            new Product("files")
        ];
    }

    static getUpcomingReleases()
    {
        let deferred = q.defer();
        let products = this.getProducts().map((p) => p.name);

        $.get(`/releases?timestamp=${+new Date()}`, (data) =>
        {
            let jsonData = JSON.parse(data);
            let filteredRelases = jsonData.map(r =>
            {
                r.applications = r.applications.filter(a => products.indexOf(a.name) !== -1);
                return r;
            });
            deferred.resolve(filteredRelases);
        }).fail(error =>
        {
            deferred.reject(this.processRequestFailure(error));
        });

        return deferred.promise;
    }
}