import BaseComponent from "./base-component";
import {globalEventEmitter, Events} from "../utils/global-event-emitter";

export default class TicketsList extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            endReleaseName: null,
            releases: [],
            startReleaseName: null
        };
    }

    componentDidMount()
    {
        super.componentDidMount();

        this._onEndReleaseChanged = this.onEndReleaseChanged.bind(this);
        this._onStartReleaseChanged = this.onStartReleaseChanged.bind(this);

        globalEventEmitter.addListener(Events.END_RELEASE_CHANGED, this._onEndReleaseChanged);
        globalEventEmitter.addListener(Events.START_RELEASE_CHANGED, this._onStartReleaseChanged);
    }

    componentWillUnmount()
    {
        super.componentWillUnmount();

        globalEventEmitter.removeListener(Events.END_RELEASE_CHANGED, this._onEndReleaseChanged);
        globalEventEmitter.removeListener(Events.START_RELEASE_CHANGED, this._onStartReleaseChanged);
    }

    findEpicByKey(epicKey)
    {
        return this.props.upcomingReleases.epics.find(epic => epic.ticketNumber === epicKey);
    }

    onEndReleaseChanged(name)
    {
        this.setState(
        {
            endReleaseName: name
        });

        this.updateReleasesAndTicketsList(this.state.startReleaseName, name);
    }

    onStartReleaseChanged(release)
    {
        let releaseName = release;
        if (release === true) // this means it is a production release
        {
            let upcomingReleases = this.props.upcomingReleases.upcomingReleases;
            if (upcomingReleases.length > 0)
            {
                releaseName = upcomingReleases[0].release;
            }
        }

        this.setState(
        {
            startReleaseName: releaseName
        });

        this.updateReleasesAndTicketsList(releaseName, this.state.endReleaseName);
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
                    {/*
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
                    */}
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
                        this.state.releases.map((release, index) =>
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
                                        {
                                            (() =>
                                            {
                                                if (!release.tickets || !release.tickets.length)
                                                {
                                                    return (
                                                        <tr>
                                                            <td colSpan="7">
                                                                <p>No JIRA tickets found for this release.</p>
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return release.tickets.map((ticket, ticketIndex) =>
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
                            )
                        })
                    }
                </div>
            </div>
        );
    }
}