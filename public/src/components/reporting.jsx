import BaseComponent from "./base-component"
import environments from "../../../helpers/environments";
import InfiniteLoading from "./infinite-loading.jsx";
import {projectsRepository} from "../repositories/projects-repository";

export default class Reporting extends BaseComponent
{
    constructor(props)
    {
        super(props);

        this.projectsCharts = {};

        this.state =
        {
            isLoadingData: true,
            projects: projectsRepository.getProjects()
        };
    }

    componentDidMount()
    {
        d3.json("/apps-release-history", (error, data) =>
        {
            let averageTimeChartData = {};

            this.state.projects.forEach(project =>
            {
                let versions = data[project.name][environments.Production];
                let reportData = versions.map(item => [item.version, (item.lengthOfLife / 1000 / 60 / 60 / 24).toFixed(2)]);

                let projectChart = c3.generate({
                    bindto: `#chart-${project.name}`,
                    data: {
                        columns: reportData,
                        type : 'bar',
                        labels: {
                            format: function (v, id) {
                                if (v === null) {
                                    return 'Not Applicable';
                                }
                                return d3.format('')(v);
                            }
                        },
                        selection:
                        {
                            enabled: true
                        }
                    },
                    bar: {
                        title: `Days release took for ${project.name}`,
                        width: {
                            ratio: 1.0 // this makes bar width 50% of length between ticks
                        }
                    },
                    legend: {
                        position: 'bottom',
                        show: true
                    },
                    tooltip: {
                        show: false
                    },
                    axis: {
                        x: {
                            label: {
                                //text: `Project -  ${project.name}`,
                                position: 'outer-center'
                            }
                        },

                        y: {
                            label: {
                                text: 'Days',
                                position: 'middle'
                            }
                        }
                    }
                });

                this.projectsCharts[project.name] =
                {
                    chart: projectChart,
                    data: versions
                };

                let reportDataDays = versions.map(item => item.lengthOfLife / 1000 / 60 / 60 / 24);
                var total = reportDataDays.reduce((previous, current) => previous + current, 0);
                averageTimeChartData[project.name] = (total / reportDataDays.length).toFixed(2);
            });

            c3.generate({
                bindto: '#average-chart',
                data: {
                    type : 'pie',
                    json: averageTimeChartData
                },
                pie: {
                    label: {
                        format: function (value) { return value; }
                    },
                    title: 'Average day(s) taken for each project.',
                    width: {
                        ratio: 1.0 // this makes bar width 50% of length between ticks
                    }
                },
                tooltip: {
                    show: false
                },
                axis: {
                    x: {
                        label: {
                            text: 'Average day(s) taken for each project.',
                            position: 'outer-center'
                        }
                    }
                },
                legend: {
                    position: 'right'
                }
            });

            this.setState(
            {
                isLoadingData: false
            });
        });
    }

    handleSearchVersionChange(project, event)
    {
        let searchQuery = event.target.value;
        let projectChart = this.projectsCharts[project.name];

        let versions = [];

        if (searchQuery && searchQuery.trim().length !== 0)
        {
            for (let index = 0; index < projectChart.data.length; index++)
            {
                let item = projectChart.data[index];
                if (item.version.startsWith(searchQuery))
                {
                    versions.push(item.version);
                }
            }
        }

        if (versions.length !== 0)
        {
            projectChart.chart.focus(versions);
        }
        else
        {
            projectChart.chart.focus();
        }
    }

    render() {
        return(
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-8">
                        <h2>Average life of a version per project</h2>
                        {
                            this.state.projects.map((project, index) =>
                            {
                                return (
                                    <div key={index}>
                                        <h3>{project.name}</h3>
                                        <div className="form-horizontal">
                                            <div className="form-group">
                                                <label htmlFor={`chart-search-${project.name}`} className="col-sm-2 control-label">Search</label>
                                                <div className="col-sm-10">
                                                    <input className="form-control" type="text" id={`chart-search-${project.name}`} onChange={this.handleSearchVersionChange.bind(this, project)} />
                                                </div>
                                            </div>
                                        </div>

                                        <InfiniteLoading isLoading={this.state.isLoadingData} />
                                        <div id={`chart-${project.name}`}></div>
                                    </div>
                                );
                            })
                        }
                    </div>
                    <div className="col-md-4">
                        <h2>Average life of a version</h2>

                        <InfiniteLoading isLoading={this.state.isLoadingData} />
                        <div id="average-chart"></div>
                    </div>
                </div>
            </div>
        );
    }
}