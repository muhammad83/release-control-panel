
export default class BaseRepository
{
    constructor()
    {
        this.requestManager = null;
    }

    processRequestFailure(errorResponse)
    {
        let data = {};

        if (errorResponse.responseText)
        {
            try
            {
                data = JSON.parse(errorResponse.responseText);
            }
            catch (ex) { }
        }

        data.status = errorResponse.status;

        return data;
    }

    safeMonitorRequest(request)
    {
        if (this.requestManager)
        {
            this.requestManager.monitorRequest(request);
        }
    }

    setRequestManager(manager)
    {
        this.requestManager = manager;
    }
}