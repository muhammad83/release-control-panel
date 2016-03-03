import BaseComponent from "./base-component"
import Navigation from "./navigation.jsx";
import Notifications from "./notifications.jsx";
import ProjectDetails from "./project-details.jsx";
import ProjectsList from "./projects-list.jsx"
import Releases from "./releases.jsx";
import Reporting from "./reporting.jsx";

export default class App extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.state = {
            route: window.location.hash.substr(1)
        };
    }

    componentDidMount()
    {
        super.componentDidMount();

        window.addEventListener('hashchange', () =>
        {
            this.setState({
                route: window.location.hash.substr(1)
            });
        });
    }

    render() {
        let Child;
        var childProps = {};

        if (/\/project\/(.*)/.test(this.state.route))
        {
            Child = ProjectDetails;
            childProps = {
                projectName: /\/project\/(.*)/.exec(this.state.route)[1]
            };
        }
        else if (this.state.route == "/releases")
        {
            Child = Releases;
        }
        else if (this.state.route == "/reporting")
        {
            Child = Reporting;
        }
        else
        {
            Child = ProjectsList;
        }

        return (
            <div>
                <Notifications />
                <Navigation />
                <Child {...childProps} />
            </div>
        );
    }
}