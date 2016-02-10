import $ from "jquery";
import BaseComponent from "./base-component";
import ErrorHandler from "../handlers/error-handler";
import {globalEventEmitter, Events} from "../utils/global-event-emitter";
import InfiniteLoading from "./infinite-loading.jsx";
import RequestManager from "../utils/request-manager";
import {storiesRepository} from "../repositories/stories-repository";

export default class TicketsList extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.requestManager = new RequestManager();
        this.state =
        {
            createdFilterName: null,
            createdFilterUrl: null,
            isCreatingFilter: false,
            isLoadingStories: false,
            jiraTickets: [],
            selectedRelease: null
        };
    }

    componentDidMount()
    {
        super.componentDidMount();

        this._onSearchStories = this.onSearchStoriesClick.bind(this);
        this._onSelectedReleaseChanged = this.onSelectedReleaseChanged.bind(this);

        globalEventEmitter.addListener(Events.SEARCH_TICKETS, this._onSearchStories);
        globalEventEmitter.addListener(Events.SELECTED_RELEASE_CHANGED, this._onSelectedReleaseChanged);
    }

    componentWillUnmount()
    {
        super.componentWillUnmount();

        globalEventEmitter.removeListener(Events.SEARCH_TICKETS, this._onSearchStories);
        globalEventEmitter.removeListener(Events.SELECTED_RELEASE_CHANGED, this._onSelectedReleaseChanged);

        this.requestManager.abortPendingRequests();
    }

    handleCreateReleaseFilterClick()
    {
        if (!this.state.selectedRelease)
        {
            alert("Please select release first.");
            return;
        }

        this.setState(
        {
            isCreatingFilter: true
        });

        storiesRepository.setRequestManager(this.requestManager);
        storiesRepository.createReleaseFilter(this.state.selectedRelease.name)
            .then(data =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    createdFilterName: data.name,
                    createdFilterUrl: data.url
                });
            })
            .catch(error =>
            {
                if (!this.m_isMounted)
                    return;

                ErrorHandler.showErrorMessage(error);
            })
            .finally(() =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    isCreatingFilter: false
                });
            });
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

        storiesRepository.setRequestManager(this.requestManager);
        storiesRepository.getStoriesForRelease(selectedRelease.name)
            .then((data) =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    isLoadingStories: false,
                    jiraTickets: data
                });
            })
            .catch(error =>
            {
                if (!this.m_isMounted)
                    return;

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
                                if (this.state.createdFilterName)
                                {
                                    return <p>Created JIRA filter: <a href={this.state.createdFilterUrl} target="_blank" rel="external">{this.state.createdFilterName}</a></p>;
                                }
                                else
                                {
                                    return (
                                        <div className="row">
                                            <div className="col-md-1">
                                                <div className="btn-group" role="group">
                                                    <button className="btn btn-default" onClick={this.handleCreateReleaseFilterClick.bind(this)}>Create release filter</button>
                                                </div>
                                            </div>
                                            <div className="col-md-1">
                                                <InfiniteLoading isLoading={this.state.isCreatingFilter} />
                                            </div>
                                        </div>
                                    );
                                }
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
                                                <InfiniteLoading />
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