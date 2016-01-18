import React from "react";
import ProductsRepository from "../repositories/products-repository";

export default class ProductsList extends React.Component
{
    constructor(props) {
        super(props);

        this.state = {
            products: ProductsRepository.getProducts()
        };
    }

    render()
    {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-12">
                        <h1>Choose the project</h1>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                                {
                                    this.state.products.map(function (product)
                                    {
                                        return <tr key={product.key}>
                                            <td>1</td>
                                            <td>{product.name}</td>
                                            <td>
                                                <a href={`#/product/${product.name}`} className="btn btn-default">Select</a>
                                            </td>
                                        </tr>;
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}