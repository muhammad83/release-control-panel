import BaseComponent from "./base-component";

export default class InfiniteLoading extends BaseComponent
{
    render()
    {
        let isLoadingProp = this.props.isLoading;

        if (isLoadingProp == undefined || isLoadingProp == null || isLoadingProp)
        {
            return (
                <div className="progress">
                    <div className="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style={{width: "100%"}}>
                        <span className="sr-only">100% Complete</span>
                    </div>
                </div>
            );
        }
        else
        {
            return null;
        }
    }
}