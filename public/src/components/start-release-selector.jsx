import BaseComponent from "./base-component";
import {globalEventEmitter, Events} from "../utils/global-event-emitter";
import ProjectVersionsList from "./project-versions-list.jsx";
import SearchFlags from "../models/search-flags";

export default class StartReleaseSelector extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            releases: this.getReleasesList(props),
            searchFlags: SearchFlags.ShowAll,
            versions: null
        };
    }

    componentWillReceiveProps(newProps)
    {
        this.setState(
        {
            releases: this.getReleasesList(newProps)
        });
    }

    getFilterActiveClass(flags)
    {
        let active = false;
        let searchFlags = this.state.searchFlags;

        if (flags === SearchFlags.ShowAll)
        {
            active = !(searchFlags & (SearchFlags.HideCompletedReleases | SearchFlags.HideResolvedTasks));
        }
        else
        {
            active = !!(searchFlags & flags);
        }

        return active ? "active" : "";
    }

    getReleasesList(props)
    {
        let upcomingReleases = props.upcomingReleases;
        let releases = [
            {
                name: ""
            },
            {
                name: "-- Current production manifest --",
                versions: upcomingReleases.productionVersions
            }
        ];

        let releasesWithPendingTickets = upcomingReleases.jira.filter(release =>
        {
            return release.tickets.some(ticket => ["Closed", "Released"].indexOf(ticket.status) === -1);
        });

        if (releasesWithPendingTickets.length > 0)
        {
            releases.push(
            {
                name: "-- Untested manifests --",
                disabled: true
            });

            releasesWithPendingTickets.forEach(rwpt =>
            {
                let releaseData = upcomingReleases.upcomingReleases.find(ur => ur.release === rwpt.release);
                releases.push(
                {
                    name: releaseData.release,
                    versions: releaseData.projects
                });
            });
        }

        return releases;
    }

    handleFilterChange(filter)
    {
        let valueToSet = this.state.searchFlags;

        if (filter === SearchFlags.ShowAll)
        {
            valueToSet &= (~SearchFlags.HideCompletedReleases) & (~SearchFlags.HideResolvedTasks);
        }
        else
        {
            valueToSet ^= filter;
        }

        this.setState(
        {
            searchFlags: valueToSet
        });

        globalEventEmitter.emit(Events.SEARCH_FLAGS_CHANGED, valueToSet);
    }

    handleReleaseSelection(event)
    {
        let selectedValue = event.target.value;

        let selectedProduction = false;
        let upcomingReleases = this.props.upcomingReleases;
        let versionsToShow = null;
        if (selectedValue && selectedValue.length > 0)
        {
            if (selectedValue.startsWith("--"))
            {
                selectedProduction = true;
                versionsToShow = upcomingReleases.productionVersions;
            }
            else
            {
                let foundRelease = upcomingReleases.upcomingReleases.find(ur => ur.release === selectedValue);
                if (foundRelease)
                {
                    versionsToShow = foundRelease.projects;
                }
            }
        }

        this.setState(
        {
            versions: versionsToShow
        });

        globalEventEmitter.emit(Events.START_RELEASE_CHANGED, selectedProduction ? true : selectedValue);
    }

    render()
    {
        return (
            <div>
                <div className="form-group">
                    <select className="form-control" onChange={this.handleReleaseSelection.bind(this)}>
                        {
                            this.state.releases.map((release, index) =>
                            {
                                if (release.disabled) {
                                    return (
                                        <option key={index} value={release.name} disabled="disabled">{release.name}</option>
                                    );
                                } else {
                                    return (
                                        <option key={index} value={release.name}>{release.name}</option>
                                    );
                                }
                            })
                        }
                    </select>
                </div>
                <div className="form-group">
                    <div className="input-group">
                        <span className="input-group-btn">
                            <button className={`btn btn-primary ${this.getFilterActiveClass(SearchFlags.ShowAll)}`} onClick={this.handleFilterChange.bind(this, SearchFlags.ShowAll)}>Show all</button>
                            <button className={`btn btn-primary ${this.getFilterActiveClass(SearchFlags.HideCompletedReleases)}`} onClick={this.handleFilterChange.bind(this, SearchFlags.HideCompletedReleases)}>Hide completed releases</button>
                            <button className={`btn btn-primary ${this.getFilterActiveClass(SearchFlags.HideResolvedTasks)}`} onClick={this.handleFilterChange.bind(this, SearchFlags.HideResolvedTasks)}>Hide resolved tasks</button>
                            <button className={`btn btn-primary ${this.getFilterActiveClass(SearchFlags.CombineTasks)}`} onClick={this.handleFilterChange.bind(this, SearchFlags.CombineTasks)}>Combine tasks</button>
                        </span>
                    </div>
                </div>
                <h2 style={{ marginTop: "2.55em" }}>From versions</h2>
                <ProjectVersionsList projects={this.state.versions} />
            </div>
        );
    }
}