import BaseComponent from "./base-component";

export default class SmallSpinner extends BaseComponent
{
    render()
    {
        let isLoadingProp = this.props.isLoading;

        if (isLoadingProp == undefined || isLoadingProp == null || isLoadingProp)
        {
            return <i className="glyphicon glyphicon-refresh infinite-spin"></i>;
        }
        else
        {
            return null;
        }
    }
}