import React from "react";
import $ from "jquery";

export default class TicketsList extends React.Component
{
    render()
    {
        return (
            <div className="row">
                <div className="col-md-12">
                    <h2>Jira tickets</h2>
                    <table className="table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Message</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Author</th>
                            <th>Hash</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            this.props.jiraTickets.map(function (ticket, ticketIndex)
                            {
                                return <tr key={ticketIndex}>
                                    <td>{ticketIndex + 1}</td>
                                    <td>{ticket.message}</td>
                                    <td>{ticket.dateTime}</td>
                                    <td>
                                        {
                                            (() =>
                                            {
                                                switch (ticket.status)
                                                {
                                                    case "Dev Ready":
                                                    case "Dev Complete":
                                                        return <span className="label label-danger">{ticket.status}</span>;
                                                    case "In QA":
                                                        return <span className="label label-warning">{ticket.status}</span>;
                                                    case "QA Complete":
                                                    case "Resolved":
                                                        return <span className="label label-success">{ticket.status}</span>;
                                                    default:
                                                        return <span className="label label-default">{ticket.status}</span>;
                                                }
                                            })()
                                        }
                                    </td>
                                    <td>{ticket.author}</td>
                                    <td>{ticket.hash}</td>
                                </tr>;
                            })
                        }
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}