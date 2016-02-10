import BaseComponent from "./base-component";
import {buildsRepository} from "../repositories/builds-repository";
import copyContent from "../utils/copy-content";
import ErrorHandler from "../handlers/error-handler";
import {globalEventEmitter, Events} from "../utils/global-event-emitter";
import InfiniteLoading from "./infinite-loading.jsx";
import {productsRepository} from "../repositories/products-repository";
import ProjectVersionsList from "./project-versions-list.jsx";
import RequestManager from "../utils/request-manager";

export default class UpcomingVersionsList extends BaseComponent
{
    constructor(props)
    {
        super(props);

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
    }

    componentWillUnmount()
    {
        super.componentWillUnmount();

        this.requestManager.abortPendingRequests();
    }
    
    copyCommandLineScript()
    {
        copyContent("#commandLineScript");
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

    handleStartBuildClick(project)
    {
        project.isBuilding = true;

        this.setState(
        {
            selectedRelease: this.state.selectedRelease
        });

        buildsRepository.setRequestManager(this.requestManager);
        buildsRepository.startBuild(project.name, project.version);
    }

    loadAvailableReleases()
    {
        this.setState(
        {
            isLoadingReleases: true
        });

        productsRepository.setRequestManager(this.requestManager);
        productsRepository.getUpcomingReleases()
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
    
    render()
    {
        return (
            <div>
                <h4>Upcoming versions</h4>
                <form className="form-horizontal" onSubmit={this.handleFormSubmit.bind(this)}>
                    <div className="form-group">
                        <label htmlFor="release" className="col-sm-2 control-label">Release:</label>
                        <div className="col-sm-10">
                            <div className="input-group">
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
                                <span className="input-group-btn">
                                    <button className="btn btn-default" onClick={this.handleRefreshClick.bind(this)}>
                                        <i className="glyphicon glyphicon-refresh"></i>
                                    </button>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="col-sm-offset-2 col-sm-10">
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
                    </div>
                </form>
                <ProjectVersionsList isLoading={this.state.isLoadingReleases}
                                     projects={this.getSelectedReleaseApplications()}
                                     extraColumns={ this.state.extraColumns } />
            </div>
        );
    }

    renderBuildNumberCell(project)
    {
        if (project.isBuilding || this.state.isLoadingBuilds)
        {
            return <InfiniteLoading />;
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