"use strict";

var requireDir = require("require-dir");
global.runmode = "dev";

requireDir("./tasks", { recurse: true });