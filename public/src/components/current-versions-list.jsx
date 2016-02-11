import BaseComponent from "./base-component";
import ErrorHandler from "../handlers/error-handler";
import {productsRepository} from "../repositories/products-repository";
import ProjectVersionsList from "./project-versions-list.jsx";
import RequestManager from "../utils/request-manager";

export default class CurrentVersionsList extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.requestManager = new RequestManager();
        this.state =
        {
            currentVersions: [],
            isLoadingCurrentVersions: false
        };
    }
    
    componentDidMount()
    {
        super.componentDidMount();
        this.loadCurrentVersions();
    }

    componentWillUnmount()
    {
        super.componentWillUnmount();
        this.requestManager.abortPendingRequests();
    }
    
    loadCurrentVersions()
    {
        this.setState(
        {
            isLoadingCurrentVersions: true
        });

        productsRepository.setRequestManager(this.requestManager);
        productsRepository.getCurrentVersions()
            .then(versions =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    currentVersions: versions,
                    isLoadingCurrentVersions: false
                });
            })
            .catch(error =>
            {
                if (!this.m_isMounted)
                    return;

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
                <h2 style={{ marginTop: "4.6em" }}>Current versions</h2>
                <ProjectVersionsList isLoading={this.state.isLoadingCurrentVersions} projects={this.state.currentVersions} />
            </div>
        );
    }
}