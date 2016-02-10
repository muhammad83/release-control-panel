import React from "react";

export default class BaseComponent extends React.Component
{
    constructor(props)
    {
        super(props);

        this.m_isMounted = false;
    }

    componentDidMount()
    {
        this.m_isMounted = true;
    }

    componentWillUnmount()
    {
        this.m_isMounted = false;
    }
}