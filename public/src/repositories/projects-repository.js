import BaseRepository from "./base-repository";
import {configRepository} from "./config-repository";

let singleton = Symbol();
let singletonEnforcer = Symbol();

export class ProjectsRepository extends BaseRepository
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
            this[singleton] = new ProjectsRepository(singletonEnforcer);
        }

        return this[singleton];
    }

    getProjects()
    {
        return configRepository.getProjects();
    }
}

export const projectsRepository = ProjectsRepository.instance;