import BaseComponent from "./base-component";
import ErrorHandler from "../handlers/error-handler";
import {globalEventEmitter, Events} from "../utils/global-event-emitter";
import InfiniteLoading from "./infinite-loading.jsx";
import SearchFlags from "../models/search-flags"
import {storiesRepository} from "../repositories/stories-repository";

export default class ExtendedTicketList extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            createdFilterName: null,
            createdFilterUrl: null,
            endReleaseName: null,
            isCreatingFilter: false,
            releases: [],
            searchFlags: SearchFlags.ShowAll,
            selectedProductionRelease: false,
            startReleaseName: null
        };
    }

    canCreateReleaseFilter()
    {
        return !!(this.state.selectedProductionRelease && this.state.endReleaseName)
    }

    componentDidMount()
    {
        super.componentDidMount();

        this._onEndReleaseChanged = this.onEndReleaseChanged.bind(this);
        this._onSearchFlagsChanged = this.onSearchFlagsChanged.bind(this);
        this._onStartReleaseChanged = this.onStartReleaseChanged.bind(this);

        globalEventEmitter.addListener(Events.END_RELEASE_CHANGED, this._onEndReleaseChanged);
        globalEventEmitter.addListener(Events.SEARCH_FLAGS_CHANGED, this._onSearchFlagsChanged);
        globalEventEmitter.addListener(Events.START_RELEASE_CHANGED, this._onStartReleaseChanged);
    }

    componentWillUnmount()
    {
        super.componentWillUnmount();

        globalEventEmitter.removeListener(Events.END_RELEASE_CHANGED, this._onEndReleaseChanged);
        globalEventEmitter.removeListener(Events.SEARCH_FLAGS_CHANGED, this._onSearchFlagsChanged);
        globalEventEmitter.removeListener(Events.START_RELEASE_CHANGED, this._onStartReleaseChanged);
    }

    filterTickets(tickets)
    {
        if (this.state.searchFlags & SearchFlags.HideResolvedTasks)
        {
            tickets = tickets.filter(ticket => ["Closed", "Resolved"].indexOf(ticket.status) === -1);
        }

        return tickets;
    }

    findEpicByKey(epicKey)
    {
        return this.props.upcomingReleases.epics.find(epic => epic.ticketNumber === epicKey);
    }

    getCombinedTicketList()
    {
        let filteredReleases = this.getFilteredReleases();
        let filteredTicketsArray = filteredReleases.map(release => this.filterTickets(release.tickets)).reduce((previous, current) => previous.concat(current), []);
        let uniqueTicketsArray = [];
        filteredTicketsArray.forEach(ticket =>
        {
            if (uniqueTicketsArray.findIndex(ut => ut.ticketNumber === ticket.ticketNumber) !== -1)
                return;

            uniqueTicketsArray.push(ticket);
        });

        return uniqueTicketsArray;
    }

    getFilteredReleases()
    {
        let releases = this.state.releases;

        if (this.state.searchFlags & SearchFlags.HideCompletedReleases)
        {
            releases = releases.filter(release =>
            {
                return release.tickets.some(ticket => ["Closed", "Resolved"].indexOf(ticket.status) === -1);
            });
        }

        return releases;
    }

    handleCreateReleaseFilterClick()
    {
        if (!this.canCreateReleaseFilter())
        {
            alert("Please select release first.");
            return;
        }

        this.setState(
        {
            isCreatingFilter: true
        });

        storiesRepository.setRequestManager(this.requestManager);
        storiesRepository.createReleaseFilter(this.state.endReleaseName)
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

    onEndReleaseChanged(name)
    {
        this.setState(
        {
            endReleaseName: name
        });

        this.updateReleasesAndTicketsList(this.state.startReleaseName, name);
    }
    
    onSearchFlagsChanged(flags)
    {
        this.setState(
        {
            searchFlags: flags
        });
    }

    onStartReleaseChanged(release)
    {
        let releaseName = release;
        if (release === true) // this means it is a production release
        {
            releaseName = null;

            let productionVersions = this.props.upcomingReleases.productionVersions;
            let upcomingReleases = this.props.upcomingReleases.upcomingReleases;

            // Finding the release name based on the versions
            for (var releaseIndex = upcomingReleases.length - 1; releaseIndex >= 0; releaseIndex--)
            {
                let currentRelease = upcomingReleases[releaseIndex];
                let isMatch = productionVersions.every(pv =>
                {
                    return currentRelease.projects.some(crpv => crpv.name == pv.name && crpv.version == pv.version);
                });

                if (isMatch)
                {
                    releaseName = currentRelease.release;
                }
            }
        }

        this.setState(
        {
            selectedProductionRelease: release === true,
            startReleaseName: releaseName
        });

        this.updateReleasesAndTicketsList(releaseName, this.state.endReleaseName);
    }

    showCombinedList()
    {
        return !!(this.state.searchFlags & SearchFlags.CombineTasks);
    }

    updateReleasesAndTicketsList(startReleaseName, endReleaseName)
    {
        if (!endReleaseName || !startReleaseName)
        {
            this.setState(
            {
                releases: []
            });
            return;
        }

        let releases = [];
        let foundStart = false;
        let foundEnd = false;

        this.props.upcomingReleases.jira.forEach(release =>
        {
            if (foundEnd)
                return;

            if (!foundStart)
            {
                if (startReleaseName === release.release)
                    foundStart = true;
                else
                    return;
            }

            releases.push(release);

            if (endReleaseName === release.release)
            {
                foundEnd = true;
            }
        });

        this.setState(
        {
            releases: releases
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
                            if (this.canCreateReleaseFilter())
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
                    {
                        (() =>
                        {
                            if (this.state.releases.length === 0)
                            {
                                return <p>Select "FROM" and "TO" releases in order to see tickets.</p>;
                            }
                        })()
                    }
                    {
                        (() =>
                        {
                            if (this.showCombinedList())
                            {
                                return (
                                    <table className="table tickets-list">
                                        <thead>
                                        <tr>
                                            <th className="ticket-number">#</th>
                                            <th className="ticket-summary">Summary</th>
                                            <th className="ticket-epic">Epic</th>
                                            <th className="ticket-tags">Git tags</th>
                                            <th className="ticket-date">Date</th>
                                            <th className="ticket-status">Status</th>
                                            <th className="ticket-author">Author</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                this.renderTicketsList(this.getCombinedTicketList())
                                            }
                                        </tbody>
                                    </table>
                                );
                            }
                            else
                            {
                                return this.getFilteredReleases().map((release, index) =>
                                {
                                    return (
                                        <div key={index}>
                                            <h2>{release.release}</h2>
                                            <table className="table tickets-list">
                                                <thead>
                                                <tr>
                                                    <th className="ticket-number">#</th>
                                                    <th className="ticket-summary">Summary</th>
                                                    <th className="ticket-epic">Epic</th>
                                                    <th className="ticket-tags">Git tags</th>
                                                    <th className="ticket-date">Date</th>
                                                    <th className="ticket-status">Status</th>
                                                    <th className="ticket-author">Author</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                    {this.renderTicketsList(release.tickets)}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                });
                            }
                        })()
                    }
                </div>
            </div>
        );
    }

    renderTicketsList(tickets)
    {
        let filteredTickets = this.filterTickets(tickets);

        if (!this.showCombinedList() && !filteredTickets.length)
        {
            return (
                <tr>
                    <td colSpan="7">
                        <p>No JIRA tickets found for this release.</p>
                    </td>
                </tr>
            );
        }

        return filteredTickets.map((ticket, ticketIndex) =>
        {
            return (
                <tr key={ticketIndex}>
                    <td>{ticketIndex + 1}</td>
                    <td><a href={ticket.url} target="_blank" rel="external">{ticket.ticketNumber}: {ticket.message}</a></td>
                    <td>
                        {
                            (() =>
                            {
                                if (ticket.epicKey)
                                {
                                    let epic = this.findEpicByKey(ticket.epicKey);
                                    return <a href={epic.url} target="_blank" rel="external">{epic.ticketNumber}: {epic.message}</a>
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
                    <td>{ticket.dateTime.toLocaleString("en-GB")}</td>
                    <td>
                        {
                            (() =>
                            {
                                switch (ticket.status)
                                {
                                    case "In Progress":
                                    case "In PO Review":
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
    }
}