import Product from "../models/product";

export default class ProductsRepository
{
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