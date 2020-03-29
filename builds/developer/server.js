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

function createRoomName(region) {
  let dig = "";
  let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for(let i = 3; i > 0; i--) {
    dig += chars[Math.round(Math.random() * chars.length)];
  }
  return region + ":" + dig;
}

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
let games = {};

class Game {
  constructor(mode, id) {
    this.mode = mode;
    this.lb = [];
    this.timer = 5E3;
    this.int = 0;
    this.state = 0;
    this.mapIndex = 0;
    this.playerList = {};
    this.bulletList = [];
    this.players = 0;
    this.id = id;
    this.room = createRoomName("NA").toString();
  }
  addPlayer(player) {
    this.playerJoin();
    this.playerList[player.socket.id] = player;
    player.socket.join(this.room);
    player.socket.room = this.room;
  }
  startTimer() {
    this.state = 2;
    console.log("state 2");
    this.int = setInterval(() => {
      this.timer -= 1000;
      console.log(this.timer);
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
    if(this.state == 0 && this.mode == "ffa" && this.players >= 1) {
      this.start();
    }
    if(this.timer <= 0) {
      this.gameOver();
    }
  }
  playerJoin() {
    this.players ++;
  }
  gameOver() {
    clearInterval(this.int);
    io.emit("gameOver", this.lb);
    for(let i in this.playerList) {
      let pp = this.playerList[i];
      pp.joined = false;
    }
    setTimeout(() => {
      this.reset();
    }, 5000);
  }
  update() {
    if(this.state == 2) {
      this.lb = [];
      for(let i in this.playerList) {
        let p = this.playerList[i];
        this.lb.push({name: p.name, score: p.score});
      }
      this.lb.sort(compareScore);
    }
  }
  reset() {
    this.state = 0;
    this.timer = 3E5;
    this.mapIndex = 0;
    this.players = 0;
    io.emit("rest");
  }
}

class Player {
  constructor(name, socket, guns, team, pos, gameId) {
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
    this.gameId = gameId;
    this.joined = true;
  }
  initPack() {
    let pkg = [];
    let PLAYER_LIST = games[this.gameId].playerList;
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
      let ind = games[this.gameId].bulletList.length - 1;
      games[this.gameId].bulletList.push(new Bullet(this, this.x, this.y, id, ind, this.gameId));
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
    let map = maps[games[this.gameId].mapIndex];
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
    let bs = games[this.gameId];
    for(let i = 0; i < bs.length; i++) {
      let b = bs[i];
      let shooter = b.parent;
      if(shooter.id !== this.id) {
        let dx = b.x - this.x;
  		  let dy = b.y - this.y;
  		  if(Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)) <= this.r + b.r && this.team !== shooter.team) {
          this.health -= shooter.gun.dmg;
          bs.splice(i, bs[i]);
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
  constructor(parent, x, y, id, index, gameId) {
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
    this.gameId = gameId;
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
      let bs = games[this.gameId].bulletList;
      bs.splice(this.index, bs[this.index]);
    }
  }
}

let bInit = [];
let id = Math.random();
games[id] = new Game("ffa", id);


io.on("connection", (socket) => {
  let selfId = Math.random();
  socket.id = selfId;

  socket.emit("gameId", games[id].room);

  console.log("[SERVER]: socket connected");
  socket.on("init", (data) => {
    if(games[id].playerList[socket.id] !== undefined) {
      games[id].playerList[socket.id].reset();
      if(!games[id].playerList[socket.id].joined) {
        games[id].playerJoin();
      }
    } else {
      if(games[id].players % 2 === 0 && games[id].mode == "siege") {
        games[id].addPlayer(new Player(data.name, socket, [gunList[data.wep.p], gunList[data.wep.s]], 0, [maps[0].spawns[0].x, maps[0].spawns[0].y], id));
      } else if(games[id].mode == "siege"){
        games[id].addPlayer(new Player(data.name, socket, [gunList[data.wep.p], gunList[data.wep.s]], 1, [maps[0].spawns[1].x, maps[0].spawns[1].y], id));
      } else if (games[id].mode == "ffa") {
        let t = Math.random();
        games[id].addPlayer(new Player(data.name, socket, [gunList[data.wep.p], gunList[data.wep.s]], t, "rand", id));
      }
    }

    let ip = games[id].playerList[selfId].initPack();
    socket.emit("initPack", {
      player: ip,
      bullet: bInit,
      map: maps[games[id].mapIndex]
    });

  });

  socket.on("keypress", (data) => {
    let p = games[id].playerList[selfId];
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
    delete games[id].playerList[socket.id];
  })
});


function updatePack() {
  if(games[id].timer >= 0) {
    let pkg = {};
    let pkgp = [];
    let pkgb = [];
    for(let i in games[id].playerList) {
      games[id].playerList[i].update();
      let p = games[id].playerList[i];
      pkgp.push({
        x: p.x,
        y: p.y,
        id: p.id,
        angle: p.angle,
        r: p.r,
        name: p.name,
        state: p.weapon.type,
        acc: p.accuracy,
        gun: p.weapon,
        hp: p.health,
        score: p.score
      });
    }
    pkg.player = pkgp
    for(let i = 0; i < games[id].bulletList.length; i++) {
      let b = games[id].bulletList[i];
      b.update();
      pkgb.push({
        y: b.y,
        x: b.x,
        aangle: b.parent.angle,
        startX: b.startX,
        startY: b.startY,
        ga: b.ga
      })
      b.timerUpdate()
    }
    games[id].update();
    pkg.bullet = pkgb;
    games[id].check();
    pkg.lb = games[id].lb;
    pkg.timer = games[id].timer;
    io.emit("updatePack", pkg);
  }
}
setInterval(updatePack, 1E3 / 60);
