import React from "react";

export default class ProjectVersionsList extends React.Component
{
    constructor(props)
    {
        super(props);
    }
    
    render()
    {
        return (
            <table className="table">
                <thead>
                <tr>
                    <th>Project name</th>
                    <th>Version</th>
                </tr>
                </thead>
                <tbody>
                {
                    (() =>
                    {
                        if (this.props.isLoading)
                        {
                            return (
                                <tr>
                                    <td colSpan="2">
                                        <div className="progress">
                                            <div className="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style={{width: "100%"}}>
                                                <span className="sr-only">100% Complete</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }
                        else if (!this.props.projects.length)
                        {
                            return (
                                <tr>
                                    <td colSpan="2">Nothing to show here.</td>
                                </tr>
                            );
                        }

                        return this.props.projects.map((application, index) =>
                        {
                            return (
                                <tr key={index}>
                                    <td>{application.name}</td>
                                    <td>{application.version}</td>
                                </tr>
                            );
                        });
                    })()
                }
                </tbody>
            </table>
        );
    }
}