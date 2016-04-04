import React from "react";
import RequestManager from "../utils/request-manager";

export default class BaseComponent extends React.Component
{
    constructor(props)
    {
        super(props);

        this.requestManager = new RequestManager();
        this.m_isMounted = false;
    }

    componentDidMount()
    {
        this.m_isMounted = true;
    }

    componentWillUnmount()
    {
        this.m_isMounted = false;
        this.requestManager.abortPendingRequests();
    }
}