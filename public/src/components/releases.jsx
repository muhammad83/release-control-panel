import React from "react";
import CurrentVersionsList from "./current-versions-list.jsx";
import TicketsList from "./tickets-list.jsx";
import UpcomingVersionsList from "./upcoming-versions-list.jsx";

export default class Releases extends React.Component
{
    render()
    {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        <CurrentVersionsList />
                    </div>
                    <div className="col-md-6">
                        <UpcomingVersionsList />
                    </div>
                </div>
                <TicketsList />
            </div>
        );
    }
}