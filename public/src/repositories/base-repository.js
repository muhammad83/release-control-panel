
export default class BaseRepository
{
    processRequestFailure(errorResponse)
    {
        let data;

        if (errorResponse.responseText)
        {
            try
            {
                data = JSON.parse(errorResponse.responseText);
            }
            catch (ex)
            {
                data = { };
            }
        }

        data.status = errorResponse.status;

        return data;
    }
}