"use strict";

const maxProcesses = require("../config").maxSimultaneousProcesses;
const exec = require("child_process").exec;
const q = require("q");

let runningProcesses = 0;
let processesQueue = [];



module.exports = function executeCommand(cwd, command)
{
    let deferred = q.defer();

    let promise = deferred.promise
        .then(() => // Doing the work ...
        {
            let deferred = q.defer();
            let commandCallback = (error, stdout, stderr) =>
            {
                if (error)
                {
                    deferred.reject(error);
                    return;
                }

                deferred.resolve(stdout);
            };

            let options = {cwd: cwd};

            exec(command, options, commandCallback);

            return deferred.promise;
        })
        .finally(() =>
        {
            // Are there any next processes?
            if (processesQueue.length)
            {
                // Start next process - don't decrement the number...
                let nextDeferredProcess = processesQueue.shift();
                nextDeferredProcess.resolve();
            }
            else
            {
                // Queue is empty. Start freeing the pool
                runningProcesses--;
            }
        });

    // Is there space on the pool?
    if (runningProcesses < maxProcesses)
    {
        // Allocate number in the pool
        runningProcesses++;

        // Start the task
        deferred.resolve();
    }
    else
    {
        processesQueue.push(deferred);
    }

    return promise;
};