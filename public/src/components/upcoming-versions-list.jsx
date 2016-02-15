import BaseComponent from "./base-component";
import {buildsRepository} from "../repositories/builds-repository";
import copyContent from "../utils/copy-content";
import {deploymentRepository} from "../repositories/deployment-repository";
import ErrorHandler from "../handlers/error-handler";
import {globalEventEmitter, Events} from "../utils/global-event-emitter";
import InfiniteLoading from "./infinite-loading.jsx";
import {projectsRepository} from "../repositories/projects-repository";
import ProjectVersionsList from "./project-versions-list.jsx";
import RequestManager from "../utils/request-manager";
import SmallSpinner from "./small-spinner.jsx";

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
            isLoadingBuilds: false,
            isLoadingReleases: false,
            releases: [],
            selectedRelease: null,
            selectedReleaseIndex: -1,
            successfulBuilds :[]
        };
    }
    
    componentDidMount()
    {
        super.componentDidMount();

        this.loadAvailableReleases();
        this.loadSuccessfulBuilds();
        this.startBuildsMonitor();
    }

    componentWillUnmount()
    {
        if (this.buildMonitorInterval)
        {
            clearInterval(this.buildMonitorInterval);
            this.buildMonitorInterval = null;
        }

        super.componentWillUnmount();

        this.requestManager.abortPendingRequests();
    }

    getCiBuildJobUrl(project)
    {
        let projectModel = projectsRepository.getProjects().find(p => p.name == project.name);
        return buildsRepository.getCiBuildJobUrl(projectModel.name, projectModel.buildNumber);
    }

    getCiBuildProjectUrl(project)
    {
        return buildsRepository.getCiBuildProjectUrl(project.name);
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

    handleDeployToQA(project, event)
    {
        event.preventDefault();

        deploymentRepository.deployToQA(project.name, project.version)
            .then(() =>
            {
                globalEventEmitter.emit(Events.SHOW_NOTIFICATION, "success", "Deployment to QA started.");
            })
            .catch(error =>
            {
                ErrorHandler.showErrorMessage(error);
            });
    }

    handleDeployToStaging(project, event)
    {
        event.preventDefault();

        deploymentRepository.deployToStaging(project.name, project.version)
            .then(() =>
            {
                globalEventEmitter.emit(Events.SHOW_NOTIFICATION, "success", "Deployment to staging started.");
            })
            .catch(error =>
            {
                ErrorHandler.showErrorMessage(error);
            });
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

    handleStartBuildClick(project)
    {
        let projects = projectsRepository.getProjects();
        let projectModel = projects.find(p => p.name === project.name);

        projectModel.pendingVersions.push(project.version);

        this.setState(
        {
            selectedRelease: this.state.selectedRelease
        });

        buildsRepository.setRequestManager(this.requestManager);
        buildsRepository.startBuild(project.name, project.version);
    }

    isProjectBuilding(project)
    {
        let projectModel = projectsRepository.getProjects().find(p => p.name == project.name);
        return projectModel.isVersionBeingBuilt(project.version);
    }

    isProjectBuildPending(project)
    {
        let projectModel = projectsRepository.getProjects().find(p => p.name == project.name);
        return projectModel.isVersionPending(project.version);
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

    loadBuildStatuses()
    {
        buildsRepository.getBuildStatuses()
            .then(() =>
            {
                this.setState(
                {
                    projects: projectsRepository.getProjects()
                });
            });
    }

    loadSuccessfulBuilds()
    {
        this.setState(
        {
            isLoadingBuilds: true
        });

        buildsRepository.setRequestManager(this.requestManager);
        buildsRepository.getSuccessfulBuildsForProjects()
            .then(builds =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    isLoadingBuilds: false,
                    successfulBuilds: builds
                });
            })
            .catch(error =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    isLoadingBuilds: false
                });

                ErrorHandler.showErrorMessage(error);
            });
    }

    startBuildsMonitor()
    {
        this.loadBuildStatuses();
        this.buildMonitorInterval = setInterval(this.loadBuildStatuses.bind(this), BUILD_REFRESH_INTERVAL);
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
        return (
            <div className="btn-group">
                <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Deploy <span className="caret"></span>
                </button>
                <ul className="dropdown-menu">
                    <li><a href="#" onClick={this.handleDeployToQA.bind(this, project)}>QA</a></li>
                    <li><a href="#" onClick={this.handleDeployToStaging.bind(this, project)}>Staging</a></li>
                </ul>
            </div>
        );
    }

    renderBuildNumberCell(project)
    {
        if (this.state.isLoadingBuilds)
        {
            return <InfiniteLoading />
        }

        if (this.isProjectBuildPending(project))
        {
            return <a href={this.getCiBuildProjectUrl(project)} target="_blank" rel="external">Build queued</a>
        }

        if (this.isProjectBuilding(project))
        {
            return (
                <div>
                    <a href={this.getCiBuildJobUrl(project)} target="_blank" rel="external">Building <SmallSpinner /></a>
                </div>
            );
        }

        let projectBuilds = this.state.successfulBuilds[project.name];

        if (!projectBuilds)
        {
            return <span className="label label-danger">Project not found</span>;
        }
        else if (projectBuilds.hasOwnProperty(project.version))
        {
            return <span>{projectBuilds[project.version].buildNumber}</span>;
        }
        else
        {
            return <button className="btn btn-default" onClick={this.handleStartBuildClick.bind(this, project)}>Start build</button>;
        }
    }
}