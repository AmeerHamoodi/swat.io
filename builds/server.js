const express = require("express");
const app = express();

const server = require("http").Server(app);

server.listen(process.env.PORT || 2000);

app.use(express.static(__dirname + "/developer/client", {
  extensions: ['html', 'htm']
}));

app.use(express.static(__dirname + "/gunEditor/client", {
  extensions: ['html', 'htm']
}));

module.exports = server;
