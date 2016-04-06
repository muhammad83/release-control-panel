import BaseComponent from "./base-component";
import { buildsRepository } from "../repositories/builds-repository";
import { globalEventEmitter, Events } from "../utils/global-event-emitter";
import { projectsRepository } from "../repositories/projects-repository";
import RequestManager from "../utils/request-manager";
import SmallSpinner from "./small-spinner.jsx";

export default class BuildNumber extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this._onProjectsUpdated = this.onProjectsUpdated.bind(this);
        this.project = projectsRepository.getProjects().find(p => p.name == props.projectName) || null;
        this.requestManager = new RequestManager();
    }

    componentDidMount()
    {
        super.componentDidMount();

        globalEventEmitter.addListener(Events.PROJECTS_UPDATED, this._onProjectsUpdated);
    }

    componentWillUnmount()
    {
        super.componentWillUnmount();

        globalEventEmitter.removeListener(Events.PROJECTS_UPDATED, this._onProjectsUpdated);
    }

    getBuildNumber()
    {
        let project = this.project;

        return project ? project.getBuildNumber(this.props.version) : "";
    }

    getCiBuildJobUrl()
    {
        return buildsRepository.getCiBuildJobUrl(this.props.projectName, this.getBuildNumber());
    }

    getCiBuildProjectUrl()
    {
        return buildsRepository.getCiBuildProjectUrl(this.props.projectName);
    }

    handleStartBuildClick()
    {
        buildsRepository.setRequestManager(this.requestManager);
        buildsRepository.startBuild(this.props.projectName, this.props.version);
    }

    isBuilding()
    {
        return this.project && this.project.isBuildRunning(this.props.version);
    }

    isBuilt()
    {
        return this.project && this.project.isBuilt(this.props.version);
    }

    isPending()
    {
        return this.project && this.project.isBuildScheduled(this.props.version);
    }

    onProjectsUpdated()
    {
        this.forceUpdate();
    }

    render()
    {
        if (this.isPending())
        {
            return <a href={this.getCiBuildProjectUrl()} target="_blank" rel="external">Build queued</a>
        }

        if (this.isBuilding())
        {
            return (
                <div>
                    <a href={this.getCiBuildJobUrl()} target="_blank" rel="external">Building <SmallSpinner /></a>
                </div>
            );
        }

        if (this.isBuilt())
        {
            return <span>{this.getBuildNumber()}</span>;
        }
        else
        {
            return <button className="btn btn-default" onClick={this.handleStartBuildClick.bind(this)}>Start build</button>;
        }
    }
}