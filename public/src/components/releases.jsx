import React from "react";
import ErrorHandler from "../handlers/error-handler";
import ProductsRepository from "../repositories/products-repository";
import StoriesRepository from "../repositories/stories-repository";
import TagsRepository from "../repositories/tags-repository";
import CurrentVersionsList from "./current-versions-list.jsx";
import TicketsList from "./tickets-list.jsx";
import UpcomingVersionsList from "./upcoming-versions-list.jsx";

export default class Releases extends React.Component
{
    render()
    {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        <CurrentVersionsList />
                    </div>
                    <div className="col-md-6">
                        <UpcomingVersionsList />
                    </div>
                </div>
                <TicketsList />
            </div>
        );
    }
}