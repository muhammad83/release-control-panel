import BaseComponent from "./base-component";
import { deploymentRepository } from "../repositories/deployment-repository";
import ErrorHandler from "../handlers/error-handler";
import { globalEventEmitter, Events } from "../utils/global-event-emitter";

export default class SmallSpinner extends BaseComponent
{
    handleDeployToQA(event)
    {
        event.preventDefault();

        deploymentRepository.deployToQA(this.props.projectName, this.props.version)
            .then(() =>
            {
                globalEventEmitter.emit(Events.SHOW_NOTIFICATION, "success", "Deployment to QA started.");
            })
            .catch(error =>
            {
                ErrorHandler.showErrorMessage(error);
            });
    }

    handleDeployToStaging(event)
    {
        event.preventDefault();

        deploymentRepository.deployToStaging(this.props.projectName, this.props.version)
            .then(() =>
            {
                globalEventEmitter.emit(Events.SHOW_NOTIFICATION, "success", "Deployment to staging started.");
            })
            .catch(error =>
            {
                ErrorHandler.showErrorMessage(error);
            });
    }

    render()
    {
        return (
            <div className="btn-group">
                <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Deploy <span className="caret"></span>
                </button>
                <ul className="dropdown-menu">
                    <li><a href="#" onClick={this.handleDeployToQA.bind(this)}>QA</a></li>
                    <li><a href="#" onClick={this.handleDeployToStaging.bind(this)}>Staging</a></li>
                </ul>
            </div>
        );
    }
}