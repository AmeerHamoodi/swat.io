const express = require("express");
const app = express();
const server = require("http").Server(app);
const gunList = require("./guns.config.js");

server.listen(process.env.PORT || 2000);
console.log("Server started");

//headers
app.use(express.static(__dirname + "/client", {
  extensions: ['html', 'htm']
}));

app.use(express.json());

const io = require("socket.io")(server);

let PLAYER_LIST = {};
let BULLET_LIST = {};

class World {
  constructor(w, h) {
    this.w = w;
    this.h = h;
  }
}

const world = new World(1800, 1800);

class Player {
  constructor(name, socket, gun) {
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
    this.angle = Math.atan2(this.my, this.mx);
    this.mx = 0;
    this.my = 0;
    this.shooting = false;
    this.health = 100;
    this.nextshotin = 0;
    this.fireRate = gun.fireRate;
    this.gun = gun;
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
        id: PLAYER_LIST[i].id,
        wBw: world.w,
        wBh: world.h,
        angle: this.angle
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
    if(this.shooting && this.nextshotin === 0) {
      let id = Math.random();
      BULLET_LIST[id] = new Bullet(this, this.x, this.y, id);
      this.nextshotin = this.fireRate;
    } else if(this.nextshotin > 0) {
      this.nextshotin -= 1;
    }

  }
  updateHealth() {
    for(let i in BULLET_LIST) {
      let b = BULLET_LIST[i];
      if(b.parent.id !== this.id) {
        let dx = b.x - this.x;
  		  let dy = b.y - this.y;
        console.log(Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)));
  		  if(Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)) <= this.r + b.r) {
          delete BULLET_LIST[i];
        }
      }
    }
  }
  update() {
    this.updateHealth();
    if(this.health > 0) {
      this.keys();
      this.angle = Math.atan2(this.my, this.mx);
      this.x += this.spdX;
      this.y += this.spdY;
    }
  }
}

class Bullet {
  constructor(parent, x, y, id) {
    this.x = parent.x;
    this.y = parent.y;
    this.id = id;
    this.parent = parent;
    this.spdX = (Math.cos(parent.angle) * 50) + Math.floor(Math.random() *5) - 2;
    this.spdY = (Math.sin(parent.angle) * 50) + Math.floor(Math.random() *5) - 2;
    this.active = true;
    this.timer = 0;
    this.r = 5;
  }
  update() {
    this.x += this.spdX;
    this.y += this.spdY;
  }
  initPack() {
    bInit.push({x: this.x, y: this.y, id: this.id});
  }
  timerUpdate() {
    this.timer++;
    if(this.timer >= 300) {
      this.active = false;
    }
    if(!this.active) {
      delete BULLET_LIST[this.id];
    }
  }
  updatePack() {
    return {
      x: this.x,
      y: this.y,
      id: this.id,
    }
  }
}
let bInit = [];
io.on("connection", (socket) => {
  let selfId = Math.random();
  socket.id = selfId;

  console.log("[SERVER]: socket connected");
  socket.on("init", (data) => {
    PLAYER_LIST[selfId] = new Player(data.name, socket, gunList.P2000);
    socket.emit("initPack", {
      player: PLAYER_LIST[selfId].initPack(),
      bullet: bInit
    });
  });

  socket.on("keypress", (data) => {
    let p = PLAYER_LIST[selfId];
    p.up = data.up;
    p.down = data.down;
    p.right = data.right;
    p.left = data.left;
    p.mx = data.mx;
    p.my = data.my;
    p.shooting = data.mousePress;
  });

  socket.emit("id", selfId);

  socket.on("disconnect", (data) => {
    console.log("[SOCKET]: disconnected");
    delete PLAYER_LIST[socket.id];
  })
});

setInterval(() => {
  for(let i in BULLET_LIST) {
    BULLET_LIST[i].timerUpdate()
  }
}, 1E3 / 60);

function updatePack() {
  let pkg = {};
  let pkgp = [];
  let pkgb = [];
  for(let i in PLAYER_LIST) {
    PLAYER_LIST[i].update();
    pkgp.push({
      x: PLAYER_LIST[i].x,
      y: PLAYER_LIST[i].y,
      id: PLAYER_LIST[i].id,
      angle: PLAYER_LIST[i].angle
    });
  }
  pkg.player = pkgp
  for(let i in BULLET_LIST) {
    BULLET_LIST[i].update();
    pkgb.push({
      y: BULLET_LIST[i].y,
      x: BULLET_LIST[i].x,
      id: bInit
    })
  }
  pkg.bullet = pkgb;
  io.emit("updatePack", pkg);
}

setInterval(updatePack, 1E3 / 60);
