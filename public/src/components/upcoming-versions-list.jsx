import BaseComponent from "./base-component";
import BuildNumber from "./build-number.jsx";
import { buildsRepository } from "../repositories/builds-repository";
import copyContent from "../utils/copy-content";
import Deployment from "./deployment.jsx";
import ErrorHandler from "../handlers/error-handler";
import { globalEventEmitter, Events } from "../utils/global-event-emitter";
import { projectsRepository } from "../repositories/projects-repository";
import ProjectVersionsList from "./project-versions-list.jsx";
import q from "q";
import RequestManager from "../utils/request-manager";


const BUILD_REFRESH_INTERVAL = 1000 * 60;

export default class UpcomingVersionsList extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.buildMonitorInterval = null;
        this.requestManager = new RequestManager();
        this.state =
        {
            commandLineScript: "",
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
            isLoadingReleases: false,
            releases: [],
            selectedRelease: null,
            selectedReleaseIndex: -1
        };
    }
    
    componentDidMount()
    {
        super.componentDidMount();

        this.loadAvailableReleases();
        this.startBuildsMonitor();
    }

    componentWillUnmount()
    {
        if (this.buildMonitorInterval)
        {
            clearInterval(this.buildMonitorInterval);
        }

        this.requestManager.abortPendingRequests();

        super.componentWillUnmount();
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

    getCommandLineScript(selectedRelease)
    {
        let applications = selectedRelease ? (selectedRelease.applications || []) : [];
        return applications
            .map(project =>
            {
                let smProjectName = project.name.toUpperCase().replace(/-/g, "_");
                return `sm --restart ${smProjectName} -r ${project.version}`;
            })
            .join(" & ");
    }
    
    getSelectedReleaseApplications()
    {
        if (!this.state.selectedRelease)
        {
            return [];
        }
        
        return this.state.selectedRelease.applications || [];
    }

    handleFormSubmit(event)
    {
        event.preventDefault();

        if (!this.state.selectedRelease)
        {
            return;
        }

        globalEventEmitter.emit(Events.SEARCH_TICKETS, this.state.selectedRelease);
    }

    handleRefreshClick()
    {
        this.setState(
        {
            releases: [],
            selectedRelease: null,
            selectedReleaseIndex: -1
        });

        globalEventEmitter.emit(Events.SELECTED_RELEASE_CHANGED, null);

        this.loadAvailableReleases();
    }
    
    handleReleaseChange(event)
    {
        var selectedIndex = parseInt(event.target.value);
        var selectedRelease = selectedIndex > -1 ? this.state.releases[selectedIndex] : null;

        this.setState(
        {
            commandLineScript: this.getCommandLineScript(selectedRelease),
            selectedRelease: selectedRelease,
            selectedReleaseIndex: selectedIndex
        });

        globalEventEmitter.emit(Events.SELECTED_RELEASE_CHANGED, selectedRelease);
    }

    loadAvailableReleases()
    {
        this.setState(
        {
            isLoadingReleases: true
        });

        projectsRepository.setRequestManager(this.requestManager);
        projectsRepository.getUpcomingReleases()
            .then(releases =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    releases: releases,
                    isLoadingReleases: false
                });
            })
            .catch(error =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    isLoadingReleases: false
                });

                ErrorHandler.showErrorMessage(error);
            });
    }

    refreshBuildStatuses()
    {
        let handleError = error =>
        {
            if (!this.m_isMounted)
                return;

            this.setState(
            {
                isLoadingBuilds: false
            });

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
                <form onSubmit={this.handleFormSubmit.bind(this)}>
                    <div className="form-group">
                        <label htmlFor="release">Release:</label>
                        <div className="row">
                            <div className="col-md-10">
                                <select id="release" className="form-control" onChange={this.handleReleaseChange.bind(this)} value={this.state.selectedReleaseIndex}>
                                    <option value="-1"> </option>
                                    {
                                        this.state.releases.map((release, index) =>
                                        {
                                            return (
                                                <option key={index} value={index}>{release.name}</option>
                                            );
                                        })
                                    }
                                </select>
                            </div>
                            <div className="col-md-2">
                                <button className="btn btn-default" onClick={this.handleRefreshClick.bind(this)}>
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        {
                            (() =>
                            {
                                if (!this.state.isLoadingReleases && this.state.selectedRelease)
                                {
                                    return (
                                        <div className="input-group">
                                            <span className="input-group-btn">
                                                <button className="btn btn-primary">Search</button>
                                                <button className="btn btn-default" onClick={this.copyCommandLineScript.bind(this)} type="button">Copy 'sm' start script</button>
                                            </span>
                                            <input id="commandLineScript" className="form-control" readOnly="true" value={this.state.commandLineScript} type="text" />
                                        </div>
                                    );
                                }
                                else
                                {
                                    return <button className="btn btn-primary">Search</button>;
                                }
                            })()
                        }
                    </div>
                </form>
                <h2>Upcoming versions</h2>
                <ProjectVersionsList isLoading={this.state.isLoadingReleases}
                                     projects={this.getSelectedReleaseApplications()}
                                     extraColumns={ this.state.extraColumns } />
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