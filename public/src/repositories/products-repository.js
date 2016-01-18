import $ from "jquery";
import q from "q";
import Product from "../models/product";

export default class ProductsRepository
{
    static getCurrentVersions()
    {
        let deferred = q.defer();
        let productNames = this.getProducts().map((product) => product.name).join(",");

        $.get(`/current-versions?projects=${productNames}`, (data) =>
        {
            deferred.resolve(JSON.parse(data));
        }).fail(() =>
        {
            deferred.reject();
        });

        return deferred.promise;
    }

    static getProducts()
    {
        return [
            new Product("cato-frontend"),
            new Product("cato-filing"),
            new Product("cato-submit"),
            new Product("files"),
            new Product("attachments")
        ];
    }
}