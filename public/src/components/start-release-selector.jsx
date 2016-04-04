import BaseComponent from "./base-component";
import {globalEventEmitter, Events} from "../utils/global-event-emitter";
import ProjectVersionsList from "./project-versions-list.jsx";

export default class StartReleaseSelector extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            versions: null,
            releases: this.getReleasesList(props)
        };
    }

    componentWillReceiveProps(newProps)
    {
        this.setState(
        {
            releases: this.getReleasesList(newProps)
        });
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
            return release.tickets.some(ticket => ["Closed", "Released", "In QA"].indexOf(ticket.status) === -1);
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
                var releaseData = upcomingReleases.upcomingReleases.find(ur => ur.release === rwpt.release);
                releases.push(
                {
                    name: releaseData.release,
                    versions: releaseData.projects
                });
            });
        }

        return releases;
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
                <h2 style={{ marginTop: "2.55em" }}>From versions</h2>
                <ProjectVersionsList projects={this.state.versions} />
            </div>
        );
    }
}