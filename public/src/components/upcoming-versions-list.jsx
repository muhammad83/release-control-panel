import React from "react";
import ErrorHandler from "../handlers/error-handler";
import BuildsRepository from "../repositories/builds-repository";
import ProductsRepository from "../repositories/products-repository";
import ProjectVersionsList from "./project-versions-list.jsx";
import copyContent from "../utils/copy-content";

export default class UpcomingVersionsList extends React.Component
{
    constructor(props)
    {
        super(props);
        
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
    
    componentDidMount()
    {
        this.loadAvailableReleases();
        this.loadSuccessfulBuilds();
    }
    
    copyCommandLineScript()
    {
        copyContent("#commandLineScript");
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
        
        if (!this.props.onSearch)
        {
            return;
        }
        
        this.props.onSearch(this.state.selectedRelease);
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
        
        if (!this.props.onSelectedReleaseChanged)
        {
            return;
        }
        
        this.props.onSelectedReleaseChanged(this.state.selectedRelease);
    }

    handleStartBuildClick(project)
    {
        project.isBuilding = true;

        this.setState(
        {
            selectedRelease: this.state.selectedRelease
        });

        BuildsRepository.startBuild(project.name, project.version);
    }

    loadAvailableReleases()
    {
        this.setState(
        {
            isLoadingReleases: true
        });

        ProductsRepository.getUpcomingReleases()
            .then(releases =>
            {
                this.setState(
                {
                    releases: releases,
                    isLoadingReleases: false
                });
            })
            .catch(error =>
            {
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

        BuildsRepository.getSuccessfulBuildsForProjects()
            .then(builds =>
            {
                this.setState(
                {
                    isLoadingBuilds: false,
                    successfulBuilds: builds
                });
            })
            .catch(error =>
            {
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
            return (
                <div className="progress">
                    <div className="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style={{width: "100%"}}>
                        <span className="sr-only">100% Complete</span>
                    </div>
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