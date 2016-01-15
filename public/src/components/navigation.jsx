import React from "react";
import ProductsRepository from "../repositories/products-repository";

export default class Navigation extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            products: ProductsRepository.getProducts()
        };
    }

    render()
    {
        return <nav className="navbar navbar-default">
            <div className="container-fluid">
                <div className="navbar-header">
                    <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
                        <span className="sr-only">Toggle navigation</span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                    </button>
                    <a className="navbar-brand" href="#/">Control Panel</a>
                </div>
                <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                    <ul className="nav navbar-nav">
                        <li><a href="#/">Home</a></li>
                        <li className="dropdown">
                            <a href="" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Products <span className="caret"></span></a>
                            <ul className="dropdown-menu">
                                {
                                    this.state.products.map(function (product, productIndex)
                                    {
                                        return <li key={productIndex}><a href={`#/product/${product.name}`}>{product.name}</a></li>
                                    })
                                }
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>;
    }
}