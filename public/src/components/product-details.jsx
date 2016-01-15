import React from "react";
import $ from "jquery";
import StoriesRepository from "../repositories/stories-repository";
import TagsRepository from "../repositories/tags-repository";
import TicketsList from "./tickets-list.jsx";

export default class ProductDetails extends React.Component
{
    constructor(params)
    {
        super(params);

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
        this.loadTagsList(this.props);
    }

    componentWillReceiveProps(props)
    {
        this.loadTagsList(props);
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
        this.updateState(
        {
            endingTagIndex: parseInt(event.target.value)
        });
    }

    handleStableVersionChange(event)
    {
        this.updateState(
        {
            endingTags: [],
            endingTagIndex: -1,
            jiraTickets: [],
            showStableVersions: event.target.checked
        });

        this.loadEndingTags();
    }

    handleStartingTagChange(event)
    {
        this.updateState(
        {
            startingTagIndex: parseInt(event.target.value)
        });

        this.loadEndingTags();
    }

    loadEndingTags()
    {
        if (this.state.showStableVersions)
        {
            this.updateState({ searchingInProgress: true });

            TagsRepository.getStableTags(this.props.productName).then((data) =>
            {
                this.updateState(
                {
                    endingTagIndex: -1,
                    endingTags: data,
                    searchingInProgress: false
                });
            });
        }
        else
        {
            var endingTags = this.getEndingTagsForStartTag(this.state.startingTagIndex);

            this.updateState(
            {
                endingTags: endingTags,
                endingTagIndex: -1
            });
        }
    }

    loadTagsList(props)
    {
        this.updateState({ searchingInProgress: true });

        TagsRepository.getTags(props.productName).then((data) =>
        {
            this.updateState(
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
                this.updateState(
                {
                    endingTags: this.getEndingTagsForStartTag(data.startingTagIndex)
                });
            }
        });
    }

    searchJiraTikets()
    {
        if (!(this.state.startingTagIndex >= 0) && !(this.state.endingTagIndex >= 0))
        {
            return;
        }

        this.updateState(
        {
            searchingInProgress: true
        });

        let serviceName = this.props.productName;
        let startTag = this.state.tags[this.state.startingTagIndex].name;
        let endTag = this.state.endingTags[this.state.endingTagIndex].name;

        StoriesRepository.getStories(serviceName, startTag, endTag).then((data) =>
        {
            this.updateState(
            {
                jiraTickets: data,
                searchingInProgress: false
            });
        });
    }

    updateState(properties)
    {
        this.setState($.extend(this.state, properties));
    }

    render()
    {
        return <div className="container-fluid">
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
            {
                (() =>
                {
                    if (this.state.searchingInProgress)
                    {
                        return <div className="row">
                            <div className="col-md-2">
                            </div>
                            <div className="col-md-5">
                                <div className="progress">
                                    <div className="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style={{width: "100%"}}>
                                        <span className="sr-only">100% Complete</span>
                                    </div>
                                </div>
                            </div>
                        </div>;
                    }
                })()
            }
            {
                (() =>
                {
                    if (this.state.jiraTickets.length > 0)
                    {
                        return <TicketsList jiraTickets={this.state.jiraTickets} />;
                    }
                })()
            }
        </div>;
    }
}