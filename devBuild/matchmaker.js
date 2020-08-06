const express = require("express");
const app = express();
const server = require("http").Server(app);
const s1 = require("./server.js");
const s2 = require("./server0.js");
const redis = require("redis");
const client = redis.createClient();

s1.listen(2000);
s2.listen(3000);
server.listen(4000);

app.use(express.static(__dirname + "/client", {
  extensions: ['html', 'htm']
}));


app.get("/game", (req, res) => {
  let randomIndex = Math.floor((Math.random() * 1) + 0)
  client.get(randomIndex.toString(), (err, reply) => {
    let re = JSON.parse(reply);

    if(re.numClients < 4) {
      res.send(reply);
      console.log(reply);
    } else if (re.numClients >= 4) {
      randomIndex = randomIndex == 1 ? 0 : 1;
      client.get(randomIndex.toString(), (err, reply) => {
        res.send(reply);
        console.log(reply);
      });
    }
  })
})
