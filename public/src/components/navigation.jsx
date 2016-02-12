import BaseComponent from "./base-component";
import {projectsRepository} from "../repositories/projects-repository";

export default class Navigation extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.state = {
            projects: projectsRepository.getProjects()
        };
    }

    render()
    {
        return <nav className="navbar navbar-default">
            <div className="container-fluid">
                <div className="navbar-header">
                    <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
                        <span className="sr-only">Toggle navigation</span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                    </button>
                    <a className="navbar-brand" href="#/">Control Panel</a>
                </div>
                <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                    <ul className="nav navbar-nav">
                        <li><a href="#/">Home</a></li>
                        <li className="dropdown">
                            <a href="" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Projects <span className="caret"></span></a>
                            <ul className="dropdown-menu">
                                {
                                    this.state.projects.map(function (project, projectIndex)
                                    {
                                        return <li key={projectIndex}><a href={`#/project/${project.name}`}>{project.name}</a></li>
                                    })
                                }
                            </ul>
                        </li>
                        <li><a href="#/releases">Releases</a></li>
                    </ul>
                </div>
            </div>
        </nav>;
    }
}