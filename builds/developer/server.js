const express = require("express");
const app = express();
const server = require("http").Server(app);

server.listen(process.env.PORT || 2000);
console.log("Server started");

//headers
app.use(express.static(__dirname + "/client", {
  extensions: ['html', 'htm']
}));

app.use(express.json());

const io = require("socket.io")(server);

let PLAYER_LIST = {};

class Player {
  constructor(name, socket) {
    this.name = name;
    this.socket = socket;
    this.id = socket.id;
    this.x = Math.floor(Math.random() * 600) + 0;
    this.y = Math.floor(Math.random() * 600) + 0;
    this.w = 50;
    this.h = 50;
    this.spdX = 0;
    this.spdY = 0;
    this.maxSpd = 5;
    this.up = false;
    this.down = false;
    this.right = false;
    this.left = false;
    this.mass = 60;
    this.force = 6;
    this.acc = this.force / this.mass;
    this.movingY = false;
    this.movingX = false;
  }
  initPack() {
    let pkg = [];
    for(let i in PLAYER_LIST) {
      pkg.push({
        x: PLAYER_LIST[i].x,
        y: PLAYER_LIST[i].y,
        w: PLAYER_LIST[i].w,
        h: PLAYER_LIST[i].h,
        name: PLAYER_LIST[i].name,
        id: PLAYER_LIST[i].id
      });
    }
    return pkg;
  }
  keys() {
    if(this.up) {
      this.movingY = true;
      if(this.spdY < -this.maxSpd) {
        this.spdY = -this.maxSpd;
      } else {
        this.spdY += -this.acc;
      }
    } else if(this.down) {
      this.movingY = true;
      if(this.spdY > this.maxSpd) {
        this.spdY = this.maxSpd;
      } else {
        this.spdY += this.acc;
      }
    } else {
      if(this.movingY) {
        if(this.spdY > 0) {
          if(this.spdY - 0.1 <= 0) {
            this.spdY = 0;
            this.movingY = false;
          } else {
            this.spdY -= this.acc;
          }
        } else if(this.spdY < 0) {
          if(this.spdY + 0.1 >= 0) {
            this.spdY = 0;
            this.movingY = false;
          } else {
            this.spdY += this.acc;
          }
        }
      }
    }

    if(this.right) {
      this.movingX = true;
      if(this.spdX > this.maxSpd) {
        this.spdX = this.maxSpd;
      } else {
        this.spdX += this.acc;
      }
    } else if(this.left) {
      this.movingX = true;
      if(this.spdX < -this.maxSpd) {
        this.spdX = -this.maxSpd;
      } else {
        this.spdX += -this.acc;
      }
    } else {
      if(this.movingX) {
        if(this.spdX > 0) {
          if(this.spdX - 0.3 <= 0) {
            this.spdX = 0;
            this.movingX = false;
          } else {
            this.spdX -= this.acc;
          }
        }
        if(this.spdX < 0) {
          if(this.spdX + 0.3 >= 0) {
            this.spdX = 0;
            this.movingX = false;
          } else {
            this.spdX += this.acc;
          }
        }
      }
    }

  }
  update() {
    this.keys();
    this.x += this.spdX;
    this.y += this.spdY;
  }
}

io.on("connection", (socket) => {
  let selfId = Math.random();
  socket.id = selfId;

  console.log("[SERVER]: socket connected");
  socket.on("init", (data) => {
    PLAYER_LIST[selfId] = new Player(data.name, socket);
    socket.emit("initPack", PLAYER_LIST[selfId].initPack());
  });

  socket.on("keypress", (data) => {
    let p = PLAYER_LIST[selfId];
    p.up = data.up;
    p.down = data.down;
    p.right = data.right;
    p.left = data.left;
  });

  socket.emit("id", selfId);

  socket.on("disconnect", (data) => {
    console.log("[SOCKET]: disconnected");
    delete PLAYER_LIST[socket.id];
  })
});

function updatePack() {
  let pkg = [];
  for(let i in PLAYER_LIST) {
    PLAYER_LIST[i].update();
    pkg.push({
      x: PLAYER_LIST[i].x,
      y: PLAYER_LIST[i].y,
      id: PLAYER_LIST[i].id
    });
  }
  io.emit("updatePack", pkg);
}

setInterval(updatePack, 1E3 / 60);
