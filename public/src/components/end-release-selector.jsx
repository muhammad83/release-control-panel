import BaseComponent from "./base-component";
import copyContent from "../utils/copy-content";
import { globalEventEmitter, Events } from "../utils/global-event-emitter";
import ProjectVersionsList from "./project-versions-list.jsx";

export default class EndReleaseSelector extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            versions: null,
            releases: this.getReleasesList(props)
        };
    }

    componentWillReceiveProps(newProps)
    {
        this.setState(
        {
            releases: this.getReleasesList(newProps)
        });
    }

    copyCommandLineScript()
    {
        if (copyContent("#commandLineScript"))
        {
            globalEventEmitter.emit(Events.SHOW_NOTIFICATION, "success", "Copied.");
        }
        else
        {
            globalEventEmitter.emit(Events.SHOW_NOTIFICATION, "danger", "Could not copy the script. Check browser console for more info.");
        }
    }

    getCommandLineScript(versionsToShow)
    {
        return versionsToShow
            .map(project =>
            {
                let smProjectName = project.name.toUpperCase().replace(/-/g, "_");
                return `sm --restart ${smProjectName} -r ${project.version}`;
            })
            .join(" & ");
    }
    
    getReleasesList(props)
    {
        let upcomingReleases = props.upcomingReleases.upcomingReleases;
        let releases = [
            {
                id: -1,
                name: ""
            }
        ];

        upcomingReleases.forEach(release =>
        {
            releases.push(
            {
                name: release.release
            });
        });

        return releases;
    }

    handleReleaseSelection(event)
    {
        let selectedValue = event.target.value;

        let upcomingReleases = this.props.upcomingReleases;
        let commandLineScript = "";
        let versionsToShow = null;
        let foundRelease = upcomingReleases.upcomingReleases.find(ur => ur.release === selectedValue);
        if (foundRelease)
        {
            versionsToShow = foundRelease.projects;
            commandLineScript = this.getCommandLineScript(versionsToShow);
        }

        this.setState(
        {
            commandLineScript: commandLineScript,
            versions: versionsToShow
        });

        globalEventEmitter.emit(Events.END_RELEASE_CHANGED, selectedValue);
    }

    render()
    {
        return (
            <div>
                <div className="form-group">
                    <select className="form-control" onChange={this.handleReleaseSelection.bind(this)}>
                        {
                            this.state.releases.map((release, index) =>
                            {
                                if (release.disabled)
                                    return <option key={index} value={release.name} disabled="disabled">{release.name}</option>;
                                else
                                    return <option key={index} value={release.name}>{release.name}</option>;
                            })
                        }
                    </select>
                </div>
                {
                    (() =>
                    {
                        if (this.state.versions)
                        {
                            return (
                                <div className="form-group">
                                    <div className="input-group">
                                        <span className="input-group-btn">
                                            <button className="btn btn-default"
                                                    onClick={this.copyCommandLineScript.bind(this)} type="button">Copy 'sm' start script</button>
                                        </span>
                                        <input id="commandLineScript" className="form-control" readOnly="true"
                                               value={this.state.commandLineScript} type="text"/>
                                    </div>
                                </div>
                            );
                        }
                    })()
                }

                <h2 style={{ marginTop: !this.state.versions ? "2.55em" : "" }}>To versions</h2>
                <ProjectVersionsList projects={this.state.versions} />
            </div>
        );
    }
}