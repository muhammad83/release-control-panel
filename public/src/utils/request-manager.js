export default class RequestManager
{
    constructor()
    {
        this.isAborting = false;
        this.requests = [];
    }

    abortPendingRequests()
    {
        this.isAborting = true;

        for (let request of this.requests)
        {
            request.abort();
        }

        this.requests = [];
    }

    onRequestFinished(request)
    {
        if (this.isAborting)
            return;

        let index = this.requests.indexOf(request);
        if (index === -1)
            return;

        this.requests.splice(index, 1);
    }

    monitorRequest(request)
    {
        request.always(this.onRequestFinished.bind(this, request));
        this.requests.push(request);
    }
}