import {EventEmitter} from "events";

let singleton = Symbol();
let singletonEnforcer = Symbol();

export const Events =
{
    PROJECTS_UPDATED: "projects-updated",
    SEARCH_TICKETS: "search-tickets",
    SEARCH_PROJECT_TICKETS: "search-project-tickets",
    SELECTED_RELEASE_CHANGED: "selected-release-changed",
    START_RELEASE_CHANGED: "start-release-changed",
    END_RELEASE_CHANGED: "end-release-changed",
    SHOW_NOTIFICATION: "show-notification"
};

/**
 * Docummentation can be found here: https://nodejs.org/api/events.html
 */
export class GlobalEventEmitter extends EventEmitter
{
    constructor(enforcer)
    {
        super();

        if (enforcer !== singletonEnforcer)
        {
            throw "Cannot construct singleton";
        }
    }

    static get instance()
    {
        if (!this[singleton])
        {
            this[singleton] = new GlobalEventEmitter(singletonEnforcer);
        }

        return this[singleton];
    }
}

export const globalEventEmitter = GlobalEventEmitter.instance;