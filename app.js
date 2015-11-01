/// <reference path="../typings/tsd.d.ts" />

var express = require("express");
var http = require("http");
var app = express();

app.use(express.static("app"));

var server = http.createServer(app);
var server_config = { port: 4000 };

server.listen(server_config.port, function () {
    console.info("Express server listening", { port: server_config.port });
});
