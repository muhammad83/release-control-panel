import React from "react";
import $ from "jquery";
import ErrorHandler from "../handlers/error-handler";
import StoriesRepository from "../repositories/stories-repository";
import {GlobalEventEmitter, Events} from "../utils/global-event-emitter";

export default class TicketsList extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            isLoadingStories: false,
            jiraTickets: [],
            selectedRelease: null
        };
    }

    componentDidMount()
    {
        this._onSearchStories = this.onSearchStoriesClick.bind(this);
        this._onSelectedReleaseChanged = this.onSelectedReleaseChanged.bind(this);

        GlobalEventEmitter.instance.addListener(Events.SEARCH_TICKETS, this._onSearchStories);
        GlobalEventEmitter.instance.addListener(Events.SELECTED_RELEASE_CHANGED, this._onSelectedReleaseChanged)
    }

    componentWillUnmount()
    {
        GlobalEventEmitter.instance.removeListener(Events.SEARCH_TICKETS, this._onSearchStories);
        GlobalEventEmitter.instance.removeListener(Events.SELECTED_RELEASE_CHANGED, this._onSelectedReleaseChanged)
    }

    onSearchStoriesClick(selectedRelease)
    {
        this.setState(
        {
            isLoadingStories: true,
            jiraTickets: [],
            selectedRelease: selectedRelease
        });

        if (!selectedRelease)
            return;

        StoriesRepository.instance.getStoriesForRelease(selectedRelease.name)
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

    onSelectedReleaseChanged(selectedRelease)
    {
        this.setState(
        {
            jiraTickets: [],
            selectedRelease: selectedRelease
        });
    }

    render()
    {
        return (
            <div className="row">
                <div className="col-md-12">
                    <h2>Jira tickets</h2>
                    {
                        (() =>
                        {
                            if (this.state.selectedRelease)
                            {
                                return (
                                    <div className="btn-group" role="group">
                                        <button className="btn btn-default">Create release filter</button>
                                    </div>
                                );
                            }
                        })()
                    }
                    <table className="table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Summary</th>
                            <th>Epic</th>
                            <th>Git tags</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Author</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            (() =>
                            {
                                if (this.state.isLoadingStories)
                                {
                                    return (
                                        <tr>
                                            <td colSpan="7">
                                                <div className="progress">
                                                    <div className="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style={{width: "100%"}}>
                                                        <span className="sr-only">100% Complete</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                if (!this.state.jiraTickets || !this.state.jiraTickets.length)
                                {
                                    return (
                                        <tr>
                                            <td colSpan="7">
                                                <p>No JIRA tickets found. Please change search criteria and hit "Search" button.</p>
                                            </td>
                                        </tr>
                                    );
                                }

                                return this.state.jiraTickets.map(function (ticket, ticketIndex)
                                {
                                    return (
                                        <tr key={ticketIndex}>
                                            <td>{ticketIndex + 1}</td>
                                            <td><a href={ticket.url} target="_blank" rel="external">{ticket.ticketNumber}: {ticket.message}</a></td>
                                            <td>
                                                {
                                                    (() =>
                                                    { 
                                                        if (ticket.epic)
                                                        {
                                                            return <a href={ticket.epic.url} target="_blank" rel="external">{ticket.epic.ticketNumber}: {ticket.epic.message}</a>
                                                        }
                                                    })()
                                                }
                                            </td>
                                            <td>
                                                <ul className="list-unstyled">
                                                    {
                                                        (ticket.gitTags||[]).map((tag, tagIndex) =>
                                                        {
                                                            return (
                                                                <li key={tagIndex}>{tag}</li>
                                                            );
                                                        })
                                                    }
                                                </ul>
                                            </td>
                                            <td>{ticket.dateTime}</td>
                                            <td>
                                                {
                                                    (() =>
                                                    {
                                                        switch (ticket.status)
                                                        {
                                                            case "Dev Ready":
                                                            case "Dev Complete":
                                                                return <span className="label label-danger">{ticket.status}</span>;
                                                            case "In QA":
                                                                return <span className="label label-warning">{ticket.status}</span>;
                                                            case "QA Complete":
                                                            case "Resolved":
                                                                return <span className="label label-success">{ticket.status}</span>;
                                                            default:
                                                                return <span className="label label-default">{ticket.status}</span>;
                                                        }
                                                    })()
                                                }
                                            </td>
                                            <td>{ticket.author}</td>
                                        </tr>
                                    );
                                });
                            })()
                        }
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}