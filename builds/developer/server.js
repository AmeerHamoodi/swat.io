const express = require("express");
const app = express();
const server = require("http").Server(app);
const gunList = require("./guns.config.js");

server.listen(process.env.PORT || 2000);

app.use(express.static(__dirname + "/client", {
  extensions: ['html', 'htm']
}));

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
    this.r = 20;
    this.spdX = 0;
    this.spdY = 0;
    this.maxSpd = 5;
    this.up = false;
    this.down = false;
    this.right = false;
    this.left = false;
    this.mass = 60 + gun.mass;
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
    this.weapon = this.gun;
    this.crouching = false;
    this.toSwitch = false;
    this.knife = {type: "meele", dmg: 50, rate: 20};
    this.accuracy = (this.gun.accuracy[0] + this.gun.accuracy[1]) / 2 + (this.spdX / 2 + this.spdY / 2) / 2
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
        angle: this.angle,
        r: PLAYER_LIST[i].r,
        acc: PLAYER_LIST[i].accuracy
      });
    }
    return pkg;
  }
  keys() {
    if(this.toSwitch) {
      this.weapon = this.knife;
    } else {
      this.weapon = this.gun;
    }
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

    if(this.crouching) {
      this.r = 15;
      this.gun.accuracy[0] = 0;
      this.gun.accuracy[1] = 0;
      this.force = 4;

      this.acc = this.force / this.mass;
    } else if (this.r !== 0){
      this.r = 20;
      this.gun.accuracy[0] = 5;
      this.gun.accuracy[1] = -2;
      this.force = 4;

      this.acc = this.force / this.mass;
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
    if(this.shooting && this.nextshotin === 0 && this.weapon == this.gun) {
      let id = Math.random();
      BULLET_LIST[id] = new Bullet(this, this.x, this.y, id);
      this.nextshotin = this.fireRate;
    } else if(this.nextshotin > 0) {
      this.nextshotin -= 1;
    }

  }
  updateHealth() {
    let killer = 0;
    for(let i in BULLET_LIST) {
      let b = BULLET_LIST[i];
      let shooter = b.parent;
      if(shooter.id !== this.id) {
        let dx = b.x - this.x;
  		  let dy = b.y - this.y;
  		  if(Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)) <= this.r + b.r) {
          this.health -= shooter.gun.dmg;
          delete BULLET_LIST[i];
          console.log("Hit " + this.health);
          killer = {id: shooter.id, gun: shooter.gun, name: shooter.name};
        }
      }
      if(this.health <= 0) {
        this.socket.emit("death", killer);
        this.r = 0;
      }
    }
  }
  update() {
    if(this.health > 0) {
      this.updateHealth();
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
    this.spdX = (Math.cos(parent.angle) * 10) + (Math.floor(Math.random() * parent.gun.accuracy[0]) + parent.gun.accuracy[1]) + parent.spdX / 4;
    this.spdY = (Math.sin(parent.angle) * 10) + (Math.floor(Math.random() * parent.gun.accuracy[0]) + parent.gun.accuracy[1]) + parent.spdY / 4;
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
    let ip = PLAYER_LIST[selfId].initPack();
    socket.emit("initPack", {
      player: ip,
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
    p.crouching = data.shift;
    p.toSwitch = data.swtich;
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
      angle: PLAYER_LIST[i].angle,
      r: PLAYER_LIST[i].r,
      active: PLAYER_LIST[i].active,
      name: PLAYER_LIST[i].name,
      state: PLAYER_LIST[i].weapon.type,
      acc: PLAYER_LIST[i].accuracy
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
