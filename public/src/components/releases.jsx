import BaseComponent from "./base-component";
import {buildsRepository} from "../repositories/builds-repository";
import EndReleaseSelector from "./end-release-selector.jsx";
import ErrorHandler from "../handlers/error-handler";
import InfiniteLoading from "./infinite-loading.jsx";
import StartReleaseSelector from "./start-release-selector.jsx";
import ExtendedTicketsList  from "./extended-tickets-list.jsx";

export default class Releases extends BaseComponent
{
    constructor(props)
    {
        super(props);
        
        this.state =
        {
            isLoading: true,
            upcomingReleases: null
        };
    }

    componentDidMount()
    {
        super.componentDidMount();
        this.loadReleases();
    }

    loadReleases()
    {
        buildsRepository.setRequestManager(this.requestManager);
        buildsRepository.getUpcomingReleases()
            .then(upcomingReleases =>
            {
                this.setState(
                {
                    upcomingReleases: upcomingReleases
                });
            })
            .catch(error =>
            {
                ErrorHandler.showErrorMessage(error);
            })
            .finally(() =>
            {
                this.setState(
                {
                    isLoading: false
                });
            });
    }
    
    render()
    {
        if (this.state.isLoading)
        {
            return (
                <div className="container-fluid">
                    <div className="row">

                        <div className="col-md-6 col-md-offset-3">
                            <h1>Loading releases.</h1>
                            <p>This might take up to a minute.</p>
                            <InfiniteLoading />
                        </div>
                    </div>
                </div>
            );
        }

        //<TicketsList upcomingReleases={this.state.upcomingReleases} />
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        <StartReleaseSelector upcomingReleases={this.state.upcomingReleases} />
                    </div>
                    <div className="col-md-6">
                        <EndReleaseSelector upcomingReleases={this.state.upcomingReleases} />
                    </div>
                </div>
                <ExtendedTicketsList upcomingReleases={this.state.upcomingReleases} />
            </div>
        );
    }
}