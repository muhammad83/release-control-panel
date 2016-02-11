import BaseComponent from "./base-component";
import InfiniteLoading from "./infinite-loading.jsx";

export default class ProjectVersionsList extends BaseComponent
{
    render()
    {
        return (
            <table className="table" style={this.props.style}>
                <thead>
                <tr>
                    <th>Project name</th>
                    <th>Version</th>
                    {
                        (() =>
                        {
                            if (this.props.extraColumns)
                            {
                                return this.props.extraColumns.map((column, index) =>
                                {
                                    return <th key={index}>{column.heading}</th>;
                                });
                            }
                        })()
                    }
                </tr>
                </thead>
                <tbody>
                {
                    (() =>
                    {
                        if (this.props.isLoading)
                        {
                            return (
                                <tr>
                                    <td colSpan={ 2 + ((this.props.extraColumns && this.props.extraColumns.length) || 0) }>
                                        <InfiniteLoading />
                                    </td>
                                </tr>
                            );
                        }
                        else if (!this.props.projects.length)
                        {
                            return (
                                <tr>
                                    <td colSpan={ 2 + ((this.props.extraColumns && this.props.extraColumns.length) || 0) }>Nothing to show here.</td>
                                </tr>
                            );
                        }

                        return this.props.projects.map((project, index) =>
                        {
                            return (
                                <tr key={index}>
                                    <td>{project.name}</td>
                                    <td>{project.version}</td>
                                    {
                                        (() =>
                                        {
                                            if (this.props.extraColumns)
                                            {
                                                return this.props.extraColumns.map((column, index) =>
                                                {
                                                    let cellContent;

                                                    switch (column.type)
                                                    {
                                                        case "button":
                                                            cellContent = <button class="btn btn-default" onClick={column.action(project)}>{column.actionName}</button>;
                                                            break;
                                                        case "template":
                                                            cellContent = column.template(project);
                                                            break;
                                                        default:
                                                            cellContent = <span>{project[column.name]}</span>;
                                                            break;
                                                    }

                                                    return <td key={index}>{cellContent}</td>;
                                                });
                                            }
                                        })()
                                    }
                                </tr>
                            );
                        });
                    })()
                }
                </tbody>
            </table>
        );
    }
}