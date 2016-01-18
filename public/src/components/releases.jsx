import React from "react";
import ProductsRepository from "../repositories/products-repository";
import TagsRepository from "../repositories/tags-repository";

export default class Releases extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            currentVersions: [],
            isLoadingCurrentVersions: false,
            isLoadingReleases: false,
            releases: [],
            selectedRelease: null,
            selectedReleaseIndex: -1
        };
    }

    componentDidMount()
    {
        this.loadAvailableReleases();
        this.loadCurrentVersions();
    }

    handleFormSubmit(event)
    {
        event.preventDefault();

        if (!this.state.selectedRelease)
        {
            return;
        }

        // TODO: Searching...
    }

    handleReleaseChange(event)
    {
        var selectedIndex = parseInt(event.target.value);
        var selectedRelease = selectedIndex > -1 ? this.state.releases[selectedIndex] : null;

        this.setState(
        {
            selectedRelease: selectedRelease,
            selectedReleaseIndex: selectedIndex
        });
    }

    loadAvailableReleases()
    {
        this.setState(
        {
            isLoadingReleases: true
        });

        TagsRepository.getReleases()
            .then((releases) =>
            {
                this.setState(
                {
                    releases: releases,
                    isLoadingReleases: false
                });
            })
            .catch(() =>
            {
                this.setState(
                {
                    isLoadingReleases: false
                });

                alert("An error has occurred. Could not load releases.");
            });
    }

    loadCurrentVersions()
    {
        this.setState(
        {
            isLoadingCurrentVersions: true
        });

        ProductsRepository.getCurrentVersions()
            .then((versions) =>
            {
                this.setState(
                {
                    currentVersions: versions,
                    isLoadingCurrentVersions: false
                });
            })
            .catch(() =>
            {
                this.setState(
                {
                    isLoadingCurrentVersions: false
                });

                alert("An error has occurred. Could not load current versions.");
            });
    }

    render()
    {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        <h5>Current versions</h5>
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
                                    if (this.state.currentVersions.length == 0)
                                    {
                                        return (
                                            <tr>
                                                <td colSpan="2">Current versions not yet loaded.</td>
                                            </tr>
                                        );
                                    }

                                    return this.state.currentVersions.map((application, index) =>
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
                    </div>
                    <div className="col-md-6">
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
                                            if (!this.state.selectedRelease)
                                            {
                                                return (
                                                    <tr>
                                                        <td colSpan="2">No release selected.</td>
                                                    </tr>
                                                );
                                            }

                                            return this.state.selectedRelease.applications.map((application, index) =>
                                            {
                                                return (
                                                    <tr key={index}>
                                                        <td>{application.application_name}</td>
                                                        <td>{application.version}</td>
                                                    </tr>
                                                );
                                            });
                                        })()
                                    }
                                    </tbody>
                                </table>
                            </div>
                            <div className="form-group">
                                <div className="col-sm-offset-2 col-sm-10">
                                    <button className="btn btn-default">Search</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}