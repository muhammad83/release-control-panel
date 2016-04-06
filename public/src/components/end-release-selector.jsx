import BaseComponent from "./base-component";
import BuildNumber from "./build-number.jsx";
import { buildsRepository } from "../repositories/builds-repository";
import copyContent from "../utils/copy-content";
import Deployment from "./deployment.jsx";
import ErrorHandler from "../handlers/error-handler";
import { globalEventEmitter, Events } from "../utils/global-event-emitter";
import ProjectVersionsList from "./project-versions-list.jsx";
import SearchFlags from "../models/search-flags";

const BUILD_REFRESH_INTERVAL = 1000 * 60;

export default class EndReleaseSelector extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.buildMonitorInterval = null;
        this.state =
        {
            extraColumns:
            [
                {
                    heading: "Build number",
                    type: "template",
                    template: this.renderBuildNumberCell.bind(this)
                },
                {
                    heading: "Actions",
                    type: "template",
                    template: this.renderActionsCell.bind(this)
                }
            ],
            searchFlags: SearchFlags.ShowAll,
            versions: null
        };
    }

    componentDidMount()
    {
        super.componentDidMount();

        this.startBuildsMonitor();

        this._onSearchFlagsChanged = this.onSearchFlagsChanged.bind(this);
        globalEventEmitter.addListener(Events.SEARCH_FLAGS_CHANGED, this._onSearchFlagsChanged);
    }

    componentWillUnmount()
    {
        super.componentWillUnmount();

        if (this.buildMonitorInterval)
        {
            clearInterval(this.buildMonitorInterval);
        }

        globalEventEmitter.removeListener(Events.SEARCH_FLAGS_CHANGED, this._onSearchFlagsChanged);
    }

    copyCommandLineScript()
    {
        if (copyContent("#commandLineScript"))
        {
            globalEventEmitter.emit(Events.SHOW_NOTIFICATION, "success", "Copied.");
        }
        else
        {
            globalEventEmitter.emit(Events.SHOW_NOTIFICATION, "danger", "Could not copy the script. Check browser console for more info.");
        }
    }

    getCommandLineScript(versionsToShow)
    {
        return versionsToShow
            .map(project =>
            {
                let smProjectName = project.name.toUpperCase().replace(/-/g, "_");
                return `sm --restart ${smProjectName} -r ${project.version}`;
            })
            .join(" & ");
    }

    getFilteredReleases()
    {
        let upcomingReleases = this.props.upcomingReleases.upcomingReleases;
        let jira = this.props.upcomingReleases.jira;

        if (this.state.searchFlags & SearchFlags.HideCompletedReleases)
        {
            upcomingReleases = upcomingReleases.filter(release =>
            {
                let jiraReleaseInformation = jira.find(jr => jr.release === release.release);

                if (!jiraReleaseInformation)
                    return false;

                return jiraReleaseInformation.tickets.some(ticket => ["Closed", "Resolved"].indexOf(ticket.status) === -1);
            });
        }

        let releases =
        [
            {
                id: -1,
                name: ""
            }
        ];

        upcomingReleases.forEach(release =>
        {
            releases.push(
            {
                name: release.release
            });
        });

        return releases;
    }

    handleReleaseSelection(event)
    {
        let selectedValue = event.target.value;

        let upcomingReleases = this.props.upcomingReleases;
        let commandLineScript = "";
        let versionsToShow = null;
        let foundRelease = upcomingReleases.upcomingReleases.find(ur => ur.release === selectedValue);
        if (foundRelease)
        {
            versionsToShow = foundRelease.projects;
            commandLineScript = this.getCommandLineScript(versionsToShow);
        }

        this.setState(
        {
            commandLineScript: commandLineScript,
            versions: versionsToShow
        });

        globalEventEmitter.emit(Events.END_RELEASE_CHANGED, selectedValue);
    }

    onSearchFlagsChanged(flags)
    {
        this.setState(
        {
            searchFlags: flags
        });
    }

    refreshBuildStatuses()
    {
        let handleError = error =>
        {
            if (!this.m_isMounted)
                return;

            ErrorHandler.showErrorMessage(error);
        };

        buildsRepository.setRequestManager(this.requestManager);
        buildsRepository.updateBuildNumbersAndProgress().catch(handleError);
    }

    startBuildsMonitor()
    {
        this.refreshBuildStatuses();
        this.buildMonitorInterval = setInterval(this.refreshBuildStatuses.bind(this), BUILD_REFRESH_INTERVAL);
    }

    render()
    {
        return (
            <div>
                <div className="form-group">
                    <select className="form-control" onChange={this.handleReleaseSelection.bind(this)}>
                        {
                            this.getFilteredReleases().map((release, index) =>
                            {
                                if (release.disabled)
                                    return <option key={index} value={release.name} disabled="disabled">{release.name}</option>;
                                else
                                    return <option key={index} value={release.name}>{release.name}</option>;
                            })
                        }
                    </select>
                </div>
                {
                    (() =>
                    {
                        if (this.state.versions)
                        {
                            return (
                                <div className="form-group">
                                    <div className="input-group">
                                        <span className="input-group-btn">
                                            <button className="btn btn-default"
                                                    onClick={this.copyCommandLineScript.bind(this)} type="button">Copy 'sm' start script</button>
                                        </span>
                                        <input id="commandLineScript" className="form-control" readOnly="true"
                                               value={this.state.commandLineScript} type="text"/>
                                    </div>
                                </div>
                            );
                        }
                    })()
                }

                <h2 style={{ marginTop: !this.state.versions ? "2.55em" : "" }}>To versions</h2>
                <ProjectVersionsList projects={this.state.versions}
                                     extraColumns={this.state.extraColumns} />
            </div>
        );
    }

    renderActionsCell(project)
    {
        return <Deployment projectName={project.name} version={project.version}/>;
    }


    renderBuildNumberCell(project)
    {
        return <BuildNumber projectName={project.name} version={project.version} />;
    }
}