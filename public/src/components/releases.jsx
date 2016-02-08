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
    constructor(props)
    {
        super(props);

        this.state =
        {
            isLoadingStories: false,
            jiraTickets: []
        };
    }
    
    onSelectedReleaseChanged(selectedRelease)
    {
        this.setState(
        {
            jiraTickets: []
        });
    }

    onSearchStoriesClick(selectedRelease)
    {
        this.setState(
        {
            isLoadingStories: true
        });

        StoriesRepository.getStoriesForRelease(selectedRelease.name)
            .then((data) =>
            {
                this.setState(
                {
                    isLoadingStories: false,
                    jiraTickets: data
                });
            })
            .catch(error =>
            {
                this.setState(
                {
                    isLoadingStories: false
                });

                ErrorHandler.showErrorMessage(error);
            });
    }

    render()
    {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        <CurrentVersionsList />
                    </div>
                    <div className="col-md-6">
                        <UpcomingVersionsList onSearch={this.onSearchStoriesClick.bind(this)} onSelectedReleaseChanged={this.onSelectedReleaseChanged.bind(this)} />
                    </div>
                </div>
                <TicketsList jiraTickets={this.state.jiraTickets} isSearching={this.state.isLoadingStories} />
            </div>
        );
    }
}