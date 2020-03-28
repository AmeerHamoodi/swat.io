const express = require("express");
const app = express();
const server = require("http").Server(app);
const gunList = require("./guns.config.js");

const fs = require('fs');
const maps = [JSON.parse(fs.readFileSync(__dirname + '/Spawns.json', 'utf-8')), JSON.parse(fs.readFileSync(__dirname + '/Collision-test.json', 'utf-8'))]

server.listen(process.env.PORT || 2000);
console.log("Server started");

//headers
app.use(express.static(__dirname + "/client", {
  extensions: ['html', 'htm']
}));

app.use(express.json());

const io = require("socket.io")(server);

let count = 0;

let PLAYER_LIST = {};
let BULLET_LIST = [];


function RectCircleColliding(circle,rect){
    var distX = Math.abs(circle.x - rect.x-rect.w/2);
    var distY = Math.abs(circle.y - rect.y-rect.h/2);

    if (distX > (rect.w/2 + circle.r)) { return false; }
    if (distY > (rect.h/2 + circle.r)) { return false; }

    if (distX <= (rect.w/2)) { return true; }
    if (distY <= (rect.h/2)) { return true; }

    var dx=distX-rect.w/2;
    var dy=distY-rect.h/2;
    return (dx*dx+dy*dy<=(circle.r*circle.r));
}

function compareScore(a, b) {
  const bandA = a.score;
  const bandB = b.score;

  let comparison = 0;
  if (bandA > bandB) {
    comparison = -1;
  } else if (bandA < bandB) {
    comparison = 1;
  }
  return comparison;
}

class World {
  constructor(w, h) {
    this.w = w;
    this.h = h;
  }
}

const world = new World(1800, 1800);

class Game {
  constructor(mode) {
    this.mode = mode;
    this.players = [];
    this.lb = [];
    this.timer = 3E5;
    this.int = 0;
    this.state = 0;
    this.reqAmount = 4;
    this.mapIndex = 0;
  }
  addPlayer(player) {
    this.players.push(player);
  }
  startTimer() {
    this.state = 2;
    console.log("state 2");
    this.int = setInterval(() => {
      this.timer -= 1000;
    }, 1000);
  }
  start() {
    if(this.state == 0 && this.mode !== "ffa") {
      this.state = 1;
      setTimeout(() => {
        this.startTimer();
        this.mapIndex = 1;
        console.log("Map changed, GAME ON");
      }, 15000);
    }
    if(this.mode == "ffa" && this.state == 0) {
      this.state = 1;
      this.startTimer();
      console.log("FFA time, GAME ON");
    }
  }
  check() {
    if(this.state == 0 && this.players.length >= this.reqAmount || this.mode == "ffa" && this.players.length >= 1) {
      this.start();
    }
    if(this.timer == 0) {
      this.reset();
    }
  }
  update() {
    if(this.state == 2) {
      this.lb = [];
      for(let i = 0; i < this.players.length; i++) {
        let p = this.players[i];
        this.lb.push({name: p.name, score: p.score});
      }
      this.lb.sort(compareScore);
    }
  }
  reset() {
    this.state = 0;
    this.timer = 3E5;
    this.mapIndex = 0;
    this.players = [];
  }
}

class Player {
  constructor(name, socket, guns, team, pos) {
    this.name = name;
    this.socket = socket;
    this.id = socket.id;
    this.team = team;
    this.x = typeof pos == "array" ? pos[0] : Math.floor(Math.random() * 700);
    this.y = typeof pos == "array" ? pos[1] : Math.floor(Math.random() * 900);
    this.w = 50;
    this.h = 50;
    this.r = 20;
    this.spdX = 0;
    this.spdY = 0;
    this.maxSpd = 3;
    this.score = 0;
    this.up = false;
    this.down = false;
    this.right = false;
    this.left = false;
    this.mass = 60 + guns[0].mass;
    this.force = 6;
    this.acc = this.force / this.mass;
    this.movingY = false;
    this.movingX = false;
    this.angle = Math.atan2(this.my, this.mx);
    this.mx = 0;
    this.my = 0;
    this.canSwitch = true;
    this.shooting = false;
    this.health = 100;
    this.nextshotin = 0;
    this.fireRate = guns[0].fireRate;
    this.gun = guns[0];
    this.weapon = this.gun;
    this.crouching = false;
    this.knife = {type: "meele", dmg: 50, rate: 20};
    this.sec = guns[1];
    this.accuracy = (this.gun.accuracy[0] + this.gun.accuracy[1]) / 2 + (this.spdX / 2 + this.spdY / 2) / 2;
    this.active = true;
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
        angle: this.angle,
        r: PLAYER_LIST[i].r,
        acc: PLAYER_LIST[i].accuracy,
        gun: PLAYER_LIST[i].weapon,
        team: PLAYER_LIST[i].team % 1 == 0 ? PLAYER_LIST[i].team : 0,
        score: PLAYER_LIST[i].score,
        wBw: world.w,
        wBh: world.h
      });
    }
    return pkg;
  }
  reset() {
    if(!this.active) {
      this.health = 100;
      this.r = 20;
      this.x = Math.floor(Math.random() * 700);
      this.y = Math.floor(Math.random() * 900);
      this.active = true;
    }
  }
  switch() {
    if(this.canSwitch) {
      this.canSwitch = false;
      if(this.weapon == this.gun) {
        this.weapon = this.sec;
        this.fireRate = this.sec.fireRate;
        this.accuracy = (this.sec.accuracy[0] + this.sec.accuracy[1]) / 2 + (this.spdX / 2 + this.spdY / 2) / 2;
      } else if(this.weapon == this.sec) {
        this.weapon = this.gun;
        this.fireRate = this.gun.fireRate;
        this.accuracy = (this.gun.accuracy[0] + this.gun.accuracy[1]) / 2 + (this.spdX / 2 + this.spdY / 2) / 2;
      }
      setTimeout(() => {
        this.canSwitch = true;
      }, 300);
    }

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
    if(this.shooting && this.nextshotin === 0) {
      let id = Math.random();
      let ind = BULLET_LIST.length - 1;
      BULLET_LIST.push(new Bullet(this, this.x, this.y, id, ind));
      this.nextshotin = this.fireRate;
    } else if(typeof this.nextshotin !== "string" && this.nextshotin > 0) {
      this.nextshotin -= 1;
    }
    if(typeof this.fireRate == "string" && this.weapon.canShoot > 0) {
      this.weapon.canShoot -= 1;
    }

    if(!this.shooting && typeof this.fireRate == "string" && this.weapon.canShoot == 0) {
        this.nextshotin = 0;
        this.weapon.canShoot = this.weapon.canMax;
    }
  }
  updateMap(oldPos){
    let map = maps[game.mapIndex];
    for(let i = 0; i < map.objects.length; i++) {
      let b = map.objects[i];
      let coll = RectCircleColliding(this, b);
      if(coll) {
        this.x = oldPos[0];
        this.y = oldPos[1];
      }
    }
  }
  updateHealth() {
    let killer = 0;
    for(let i = 0; i < BULLET_LIST.length; i++) {
      let b = BULLET_LIST[i];
      let shooter = b.parent;
      if(shooter.id !== this.id) {
        let dx = b.x - this.x;
  		  let dy = b.y - this.y;
  		  if(Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)) <= this.r + b.r && this.team !== shooter.team) {
          this.health -= shooter.gun.dmg;
          BULLET_LIST.splice(i, BULLET_LIST[i]);
          console.log("Hit " + this.health);
          killer = {id: shooter.id, gun: shooter.gun, name: shooter.name};
        }
      }
      if(this.health <= 0 && this.active) {
        this.socket.emit("death", killer);
        this.r = 0;
        shooter.score += 100;
        this.active = false;
      }
    }
  }
  update() {
    if(this.health > 0) {
      let oldPos = [this.x, this.y];
      this.updateHealth();
      this.keys();
      this.angle = Math.atan2(this.my, this.mx);
      this.x += this.spdX;
      this.y += this.spdY;
      this.updateMap(oldPos);
    }
  }
}

class Bullet {
  constructor(parent, x, y, id, index) {
    this.calc = parent.weapon.w;
    this.x = parent.x + this.calc * Math.cos(parent.angle);
    this.y = parent.y + this.calc * Math.sin(parent.angle);
    this.id = id;
    this.parent = parent;
    this.spdX = (Math.cos(parent.angle) * 10) + (Math.floor(Math.random() * parent.gun.accuracy[0]) + parent.gun.accuracy[1]) + parent.spdX / 4;
    this.spdY = (Math.sin(parent.angle) * 10) + (Math.floor(Math.random() * parent.gun.accuracy[0]) + parent.gun.accuracy[1]) + parent.spdY / 4;
    this.active = true;
    this.timer = 0;
    this.r = 5;
    this.startX = parent.x + this.calc * Math.cos(parent.angle);
    this.startY = parent.y + this.calc * Math.sin(parent.angle);
    this.ga = 0.8;
    this.index = index;
  }
  update() {
    this.x += this.spdX;
    this.y += this.spdY;
    this.ga -= 0.01;
    this.startX += this.spdX / 2;
    this.startY += this.spdY / 2;
    if(this.ga < 0) {
      this.ga = 0;
    }
  }
  initPack() {
    bInit.push({x: this.x, y: this.y, startX: this.startX, startY: this.startY});
  }
  timerUpdate() {
    this.timer++;
    if(this.timer >= 200) {
      this.active = false;
    }
    if(!this.active) {
      BULLET_LIST.splice(this.index, BULLET_LIST[this.index]);
    }
  }
}

let bInit = [];
let game = new Game("ffa");
io.on("connection", (socket) => {
  let selfId = Math.random();
  socket.id = selfId;

  console.log("[SERVER]: socket connected");
  socket.on("init", (data) => {
    if(PLAYER_LIST[socket.id] !== undefined) {
      PLAYER_LIST[socket.id].reset();
    } else {
      if(count % 2 === 0 && game.mode == "siege") {
        console.log(data.wep.p);
        PLAYER_LIST[selfId] = new Player(data.name, socket, [gunList[data.wep.p], gunList[data.wep.s]], 0, [maps[0].spawns[0].x, maps[0].spawns[0].y]);
        game.addPlayer(PLAYER_LIST[selfId]);
      } else if(game.mode == "siege"){
        console.log(data.wep.p);
        PLAYER_LIST[selfId] = new Player(data.name, socket, [gunList[data.wep.p], gunList[data.wep.s]], 1, [maps[0].spawns[1].x, maps[0].spawns[1].y]);
        game.addPlayer(PLAYER_LIST[selfId]);
      } else if (game.mode == "ffa") {
        let t = Math.random();
        PLAYER_LIST[selfId] = new Player(data.name, socket, [gunList[data.wep.p], gunList[data.wep.s]], t, "rand");
        game.addPlayer(PLAYER_LIST[selfId]);
      }
      count++;
    }

    let ip = PLAYER_LIST[selfId].initPack();
    socket.emit("initPack", {
      player: ip,
      bullet: bInit,
      map: maps[game.mapIndex]
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
    if(data.switch) {
      p.switch();
    }
  });

  socket.emit("id", selfId);

  socket.on("disconnect", (data) => {
    console.log("[SOCKET]: disconnected");
    delete PLAYER_LIST[socket.id];
  })
});


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
      name: PLAYER_LIST[i].name,
      state: PLAYER_LIST[i].weapon.type,
      acc: PLAYER_LIST[i].accuracy,
      gun: PLAYER_LIST[i].weapon,
      hp: PLAYER_LIST[i].health,
      score: PLAYER_LIST[i].score
    });
  }
  pkg.player = pkgp
  for(let i = 0; i < BULLET_LIST.length; i++) {
    BULLET_LIST[i].update();
    pkgb.push({
      y: BULLET_LIST[i].y,
      x: BULLET_LIST[i].x,
      aangle: BULLET_LIST[i].parent.angle,
      startX: BULLET_LIST[i].startX,
      startY: BULLET_LIST[i].startY,
      ga: BULLET_LIST[i].ga
    })
    BULLET_LIST[i].timerUpdate()
  }
  game.update();
  pkg.bullet = pkgb;
  pkg.map = maps[game.mapIndex];
  game.check();
  pkg.lb = game.lb;
  io.emit("updatePack", pkg);

}

setInterval(updatePack, 1E3 / 60);
