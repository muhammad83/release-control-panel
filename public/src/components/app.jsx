import React from "react";
import Navigation from "./navigation.jsx";
import ProductDetails from "./product-details.jsx";
import ProductsList from "./products-list.jsx"
import Releases from "./releases.jsx";

export default class App extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            route: window.location.hash.substr(1)
        };
    }

    componentDidMount()
    {
        window.addEventListener('hashchange', () =>
        {
            this.setState({
                route: window.location.hash.substr(1)
            });
        });
    }

    render() {
        let Child;
        var childProps = {};

        if (/\/product\/(.*)/.test(this.state.route))
        {
            Child = ProductDetails;
            childProps = {
                productName: /\/product\/(.*)/.exec(this.state.route)[1]
            };
        }
        else if (this.state.route == "/releases")
        {
            Child = Releases;
        }
        else
        {
            Child = ProductsList;
        }

        return (
            <div>
                <Navigation />
                <Child {...childProps} />
            </div>
        );
    }
}