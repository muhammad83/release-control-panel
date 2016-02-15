import BaseComponent from "./base-component";
import {globalEventEmitter, Events} from "../utils/global-event-emitter";

const NOTIFICATION_TIMEOUT = 2000;

export default class SmallSpinner extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.notificationTimeout = null;
        this.state =
        {
            isShown: false,
            message: "",
            type: ""
        };

        this._onShowNotification = this.onShowNotification.bind(this);
    }

    componentDidMount()
    {
        super.componentDidMount();

        globalEventEmitter.addListener(Events.SHOW_NOTIFICATION, this._onShowNotification);
    }

    componentWillUnmount()
    {
        globalEventEmitter.removeListener(Events.SHOW_NOTIFICATION, this._onShowNotification);

        super.componentWillUnmount();
    }

    onShowNotification(type, message)
    {
        if (this.notificationTimeout)
        {
            clearTimeout(this.notificationTimeout);
        }

        this.setState(
        {
            isShown: true,
            message: message,
            type: type
        });

        this.notificationTimeout = setTimeout(() =>
        {
            this.setState(
            {
                isShown: false
            });
        }, NOTIFICATION_TIMEOUT);
    }

    render()
    {
        let containerClassNames = "alert-container";

        if (this.state.isShown)
        {
            containerClassNames += " is-shown";
        }

        return (
            <div className={containerClassNames}>
                <div className={ `alert alert-${this.state.type}` } role="alert">
                    <span>{this.state.message}</span>
                </div>
            </div>
        );
    }
}