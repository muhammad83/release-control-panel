var express = require("express");
var morgan = require("morgan");

var app = express();
app.use(morgan("combined"));

require("./routes/routes")(app);

app.use("/libs/angular/", express.static("node_modules/angular"));
app.use("/libs/angular-route/", express.static("node_modules/angular-route"));
app.use("/libs/bootstrap/", express.static("node_modules/bootstrap/dist"));
app.use("/libs/jquery/", express.static("node_modules/jquery/dist"));
app.use("/libs/react/", express.static("node_modules/react/dist"));

app.use(express.static("public"));

var server = app.listen(3000, function ()
{
    var host = server.address().address;
    var port = server.address().port;

    console.log("Server listening on http://%s:%s", host, port);
});