import App from "./components/app.jsx";
import {projectsRepository} from "./repositories/projects-repository";
import React from "react";
import { render, findDOMNode } from "react-dom";

export default class Main extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            isLoadingProjects: true,
            loadingProjectsFailed: false
        };
    }

    componentDidMount()
    {
        this.loadProjects();
    }

    loadProjects()
    {
        projectsRepository.loadProjects()
            .then(() =>
            {
                this.setState(
                {
                    isLoadingProjects: false
                });
            })
            .catch(() =>
            {
                this.setState(
                {
                    isLoadingProjects: false,
                    loadingProjectsFailed: true
                });
            });
    }

    render()
    {
        if (this.state.isLoadingProjects)
        {
            return (
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12" style={{ textAlign: "center" }}>
                            <h2>Loading projects</h2>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-offset-4 col-md-4">
                            <div className="progress">
                                <div className="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style={{width: "100%"}}>
                                    <span className="sr-only">100% Complete</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (this.state.loadingProjectsFailed)
        {
            return (
                <div>

                </div>
            );
        }

        return <App />;
    }
}

render(<Main />, document.getElementById("app"));