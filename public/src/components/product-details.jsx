import $ from "jquery";
import BaseComponent from "./base-component";
import ErrorHandler from "../handlers/error-handler";
import RequestManager from "../utils/request-manager";
import {storiesRepository} from "../repositories/stories-repository";
import {tagsRepository} from "../repositories/tags-repository";
import TicketsList from "./tickets-list.jsx";

export default class ProductDetails extends BaseComponent
{
    constructor(params)
    {
        super(params);

        this.requestManager = new RequestManager();
        this.state =
        {
            endingTags: [],
            endingTagIndex: -1,
            jiraTickets: [],
            searchingInProgress: false,
            showStableVersions: false,
            startingTagIndex: -1,
            tags: []
        };
    }

    componentDidMount()
    {
        super.componentDidMount();

        this.loadTagsList(this.props);
    }

    componentWillReceiveProps(props)
    {
        this.loadTagsList(props);
    }

    componentWillUnmount()
    {
        super.componentWillUnmount();

        this.requestManager.abortPendingRequests();
    }

    getEndingTagsForStartTag(startTag)
    {
        return this.state.tags.filter(function (tag, tagIndex)
        {
            return tagIndex <= startTag;
        });
    }

    handleEndingTagChange(event)
    {
        this.setState(
        {
            endingTagIndex: parseInt(event.target.value)
        });
    }

    handleStableVersionChange(event)
    {
        this.setState(
        {
            endingTags: [],
            endingTagIndex: -1,
            jiraTickets: [],
            showStableVersions: event.target.checked
        });

        this.loadEndingTags(event.target.checked);
    }

    handleStartingTagChange(event)
    {
        this.setState(
        {
            startingTagIndex: parseInt(event.target.value)
        });

        this.loadEndingTags(this.state.showStableVersions);
    }

    loadEndingTags(showStableVersions)
    {
        if (showStableVersions)
        {
            this.setState({ searchingInProgress: true });

            tagsRepository.setRequestManager(this.requestManager);
            tagsRepository.getStableTags(this.props.productName)
                .then(data =>
                {
                    if (!this.m_isMounted)
                        return;

                    this.setState(
                    {
                        endingTagIndex: -1,
                        endingTags: data,
                        searchingInProgress: false
                    });
                })
                .catch(error =>
                {
                    if (!this.m_isMounted)
                        return;

                    this.setState(
                    {
                        searchingInProgress: false
                    });

                    ErrorHandler.showErrorMessage(error);
                });
        }
        else
        {
            var endingTags = this.getEndingTagsForStartTag(this.state.startingTagIndex);

            this.setState(
            {
                endingTags: endingTags,
                endingTagIndex: -1
            });
        }
    }

    loadTagsList(props)
    {
        this.setState({ searchingInProgress: true });

        tagsRepository.setRequestManager(this.requestManager);
        tagsRepository.getTags(props.productName)
            .then(data =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    endingTagIndex: -1,
                    endingTags: [],
                    jiraTickets: [],
                    searchingInProgress: false,
                    startingTagIndex: data.startingTagIndex,
                    tags: data.tags
                });

                if (data.startingTagIndex !== -1)
                {
                    this.setState(
                    {
                        endingTags: this.getEndingTagsForStartTag(data.startingTagIndex)
                    });
                }
            })
            .catch(error =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    searchingInProgress: false
                });

                ErrorHandler.showErrorMessage(error);
            });
    }

    searchJiraTikets(event)
    {
        event.preventDefault();

        if (!(this.state.startingTagIndex >= 0) || !(this.state.endingTagIndex >= 0))
        {
            return;
        }

        this.setState(
        {
            searchingInProgress: true
        });

        let serviceName = this.props.productName;
        let startTag = this.state.tags[this.state.startingTagIndex].name;
        let endTag = this.state.endingTags[this.state.endingTagIndex].name;

        storiesRepository.setRequestManager(this.requestManager);
        storiesRepository.getStories(serviceName, startTag, endTag)
            .then(data =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    jiraTickets: data,
                    searchingInProgress: false
                });
            })
            .catch(error =>
            {
                if (!this.m_isMounted)
                    return;

                this.setState(
                {
                    searchingInProgress: false
                });

                ErrorHandler.showErrorMessage(error);
            });
    }

    render()
    {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-12">
                        <form className="form-horizontal" onSubmit={this.searchJiraTikets.bind(this)}>
                            <div className="form-group">
                                <label htmlFor="productName" className="col-sm-2 control-label">Product name:</label>
                                <div className="col-sm-10">
                                    <input className="form-control" id="productName" value={this.props.productName} disabled="disabled" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="startingTag" className="col-sm-2 control-label">Select starting tag:</label>
                                <div className="col-sm-10">
                                    <select id="startingTag" className="form-control" onChange={this.handleStartingTagChange.bind(this)} value={this.state.startingTagIndex}>
                                        <option value="-1"> </option>
                                        {
                                            this.state.tags.map(function (tag, tagIndex)
                                            {
                                                return <option key={tagIndex} value={tagIndex}>{tag.name}</option>
                                            })
                                        }
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="col-sm-offset-2 col-sm-10">
                                    <div className="checkbox">
                                        <label>
                                            <input type="checkbox" onChange={this.handleStableVersionChange.bind(this)} checked={this.state.showStableVersions} /> Show only stable versions
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="endingTag" className="col-sm-2 control-label">Select ending tag:</label>
                                <div className="col-sm-10">
                                    <select id="endingTag" className="form-control" onChange={this.handleEndingTagChange.bind(this)} value={this.state.endingTagIndex}>
                                        <option value="-1"> </option>
                                        {
                                            this.state.endingTags.map(function (tag, tagIndex)
                                            {
                                                return <option key={tagIndex} value={tagIndex}>{tag.name}</option>
                                            })
                                        }
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="col-sm-offset-2 col-sm-10">
                                    <button className="btn btn-default">Search</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                <TicketsList jiraTickets={this.state.jiraTickets} isSearching={this.state.searchingInProgress} />
            </div>
        );
    }
}