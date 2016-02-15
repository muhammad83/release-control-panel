import App from "./components/app.jsx";
import React from "react";
import { render, findDOMNode } from "react-dom";
import {configRepository} from "./repositories/config-repository";

export default class Main extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            isLoadingConfig: true,
            loadingConfigFailed: false
        };
    }

    componentDidMount()
    {
        this.loadConfig();
    }

    loadConfig()
    {
        configRepository.loadConfig()
            .then(() =>
            {
                this.setState(
                {
                    isLoadingConfig: false
                });
            })
            .catch(() =>
            {
                this.setState(
                {
                    isLoadingConfig: false,
                    loadingConfigFailed: true
                });
            });
    }

    render()
    {
        if (this.state.isLoadingConfig)
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

        if (this.state.loadingConfigFailed)
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