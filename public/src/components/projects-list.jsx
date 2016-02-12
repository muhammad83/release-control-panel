import BaseComponent from "./base-component";
import {projectsRepository} from "../repositories/projects-repository";

export default class ProjectsList extends BaseComponent
{
    constructor(props) {
        super(props);

        this.state = {
            projects: projectsRepository.getProjects()
        };
    }

    render()
    {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-12">
                        <h1>Choose the project</h1>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                                {
                                    this.state.projects.map(function (project)
                                    {
                                        return <tr key={project.key}>
                                            <td>1</td>
                                            <td>{project.name}</td>
                                            <td>
                                                <a href={`#/project/${project.name}`} className="btn btn-default">Select</a>
                                            </td>
                                        </tr>;
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}