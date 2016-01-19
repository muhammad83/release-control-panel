"use strict";

let express = require("express");
let morgan = require("morgan");

let app = express();

app.use(morgan("combined"));

require("./routes/routes")(app);

app.use("/libs/bootstrap/", express.static("node_modules/bootstrap/dist"));
app.use("/libs/jquery/", express.static("node_modules/jquery/dist"));
app.use("/libs/react/", express.static("node_modules/react/dist"));

app.use(express.static("public"));

let server = app.listen(3000, () =>
{
    let host = server.address().address;
    let port = server.address().port;

    console.log(`Server listening on http://${host}:${port}`);
});