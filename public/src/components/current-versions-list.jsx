import React from "react";
import ErrorHandler from "../handlers/error-handler";
import ProductsRepository from "../repositories/products-repository";
import ProjectVersionsList from "./project-versions-list.jsx";

export default class CurrentVersionsList extends React.Component
{
    constructor(props)
    {
        super(props);
        
        this.state =
        {
            currentVersions: [],
            isLoadingCurrentVersions: false
        };
    }
    
    componentDidMount()
    {
        this.loadCurrentVersions();
    }
    
    loadCurrentVersions()
    {
        this.setState(
        {
            isLoadingCurrentVersions: true
        });

        ProductsRepository.instance.getCurrentVersions()
            .then(versions =>
            {
                this.setState(
                {
                    currentVersions: versions,
                    isLoadingCurrentVersions: false
                });
            })
            .catch(error =>
            {
                this.setState(
                {
                    isLoadingCurrentVersions: false
                });

                ErrorHandler.showErrorMessage(error);
            });
    }
    
    render()
    {
        return (
            <div>
                <h4>Current versions</h4>
                <ProjectVersionsList isLoading={this.state.isLoadingCurrentVersions} projects={this.state.currentVersions} />
            </div>
        );
    }
}