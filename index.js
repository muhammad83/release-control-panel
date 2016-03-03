"use strict";

const bodyParser = require('body-parser');
const express = require("express");
const morgan = require("morgan");
const config = require("./config");

if (!config.isValid)
{
    console.error("One or many configuration errors found. Please correct them and restart the app.");
    return;
}

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("combined"));

require("./routes/routes")(app);

app.use("/libs/bootstrap/", express.static("bootstrap/"));
app.use("/libs/jquery/", express.static("node_modules/jquery/dist"));
app.use("/libs/react/", express.static("node_modules/react/dist"));
app.use("/libs/d3/", express.static("node_modules/d3"));
app.use("/libs/c3/", express.static("node_modules/c3"));

app.use(express.static("public"));

let server = app.listen(3000, () =>
{
    let host = server.address().address;
    let port = server.address().port;

    console.log(`Server listening on http://${host}:${port}`);
});