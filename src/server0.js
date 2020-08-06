const express = require("express");
const app = express();
const server = require("http").Server(app);
const gunList = require("./guns.config.js");
const redis = require("redis");
const client = redis.createClient();

module.exports = server;

const fs = require('fs');
const maps = [JSON.parse(fs.readFileSync(__dirname + '/maps/Small_Ville.json', 'utf-8'))]


//headers
app.use(express.static(__dirname + "/client", {
  extensions: ['html', 'htm']
}));

client.on("error", function(error) {
  console.error(error);
});

app.use(express.json());

const io = require("socket.io")(server);

let count = 0;

function createRoomName(region) {
  let dig = "";
  let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for(let i = 3; i > 0; i--) {
    dig += chars[Math.round(Math.random() * (chars.length - 1))];
  }
  return region + ":" + dig;
}

function RectCircleColliding(circle,rect){
    var distX = Math.abs(circle.x - rect.x-rect.w/2);
    var distY = Math.abs(circle.y - rect.y-rect.h/2);

    if (distX > (rect.w/2 + circle.r - 1)) { return false; }
    if (distY > (rect.h/2 + circle.r - 1)) { return false; }

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

//credit to Blindman
function inteceptCircleLineSeg(circle, line){
    let a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
    v1 = {};
    v2 = {};
    v1.x = line.p2.x - line.p1.x;
    v1.y = line.p2.y - line.p1.y;
    v2.x = line.p1.x - circle.x;
    v2.y = line.p1.y - circle.y;
    b = (v1.x * v2.x + v1.y * v2.y);
    c = 2 * (v1.x * v1.x + v1.y * v1.y);
    b *= -2;
    d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.r * circle.r));
    if(isNaN(d)){ // no intercept
        return [];
    }
    u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
    u2 = (b + d) / c;
    retP1 = {};   // return points
    retP2 = {}
    ret = []; // return array
    if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
        retP1.x = line.p1.x + v1.x * u1;
        retP1.y = line.p1.y + v1.y * u1;
        ret[0] = retP1;
    }
    if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
        retP2.x = line.p1.x + v1.x * u2;
        retP2.y = line.p1.y + v1.y * u2;
        ret[ret.length] = retP2;
    }
    return ret;
}


class World {
  constructor(w, h) {
    this.w = w;
    this.h = h;
  }
}

function genPos() {
  let i = Math.floor((Math.random() * 3) + 0);
  let keys = [{x: 400, y: 400}, {x: 1500, y: 350}, {x:400, y: 1220}, {x: 1500, y: 1220}];
  console.log(keys[i]);
  return [keys[i].x, keys[i].y]
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
    this.gameOverCalled = false;
    this.max = 4;
    this.gameOn = false;
  }
  addPlayer(player, socket) {
    this.playerJoin();
    this.playerList[player.socket.id] = player;
    socket.join(this.room);
    socket.room = this.room;
    this.gameOn = true;
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
    if(this.mode == "ffa" && this.state == 0 && this.gameOn) {
      this.state = 1;
      this.startTimer();
      console.log("FFA time, GAME ON");
    }
  }
  check() {
    if(this.state == 0 && this.mode == "ffa" && this.players >= 1) {
      this.start();
    }
    if(this.timer <= 0 && !this.gameOverCalled) {
      this.gameOver();
      this.gameOverCalled = true;
    }
  }
  playerJoin(p) {
    this.players ++;
    console.log("Player joined");
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
      console.log("Game restarted");
    }, 5000);
  }
  update() {
    if(this.state == 2) {
      this.lb = [];
      for(let i in this.playerList) {
        let p = this.playerList[i];
        if(p.joined) {
          this.lb.push({name: p.name, score: p.score});
        }
      }
      this.lb.sort(compareScore);
    }
  }
  reset() {
    this.state = 0;
    this.timer = 3E5;
    this.mapIndex = 0;
    this.players = 0;
    io.emit("reset");
    this.gameOverCalled = false;
    this.check();
    for(let i in this.playerList) {
      let p = this.playerList[i];
      p.score = 0;
      p.health = 100;
      p.r = 0;
      p.joined = false;
    }
    once = 0;
  }
}

class Player {
  constructor(name, socket, guns, team, pos, gameId) {
    this.name = name;
    this.socket = socket;
    this.id = socket.id;
    this.team = team;
    this.x = pos[0];
    this.y = pos[1];
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
    this.toSend = true;
    this.reloading = false;
    this.pd = 0;
    this.realShot = false;
  }
  initPack() {
    let pkg = [];
    let PLAYER_LIST = game.playerList;
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
  reset(guns) {
    let pos = genPos();
    this.health = 100;
    this.r = 20;
    this.x = pos[0];
    this.y = pos[1];
    this.active = true;
    this.fireRate = guns[0].fireRate;
    this.gun = guns[0];
    this.weapon = this.gun;
    this.crouching = false;
    this.knife = {type: "meele", dmg: 50, rate: 20};
    this.sec = guns[1];
    this.accuracy = (this.gun.accuracy[0] + this.gun.accuracy[1]) / 2 + (this.spdX / 2 + this.spdY / 2) / 2;
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
          if(this.spdY - 0.5 <= 0) {
            this.spdY = 0;
            this.movingY = false;
          } else {
            this.spdY -= this.acc;
          }
        } else if(this.spdY < 0) {
          if(this.spdY + 0.5 >= 0) {
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
          if(this.spdX - 0.5 <= 0) {
            this.spdX = 0;
            this.movingX = false;
          } else {
            this.spdX -= this.acc;
          }
        }
        if(this.spdX < 0) {
          if(this.spdX + 0.5 >= 0) {
            this.spdX = 0;
            this.movingX = false;
          } else {
            this.spdX += this.acc;
          }
        }
      }
    }

    if(this.nextshotin > 0) {
      this.realShot = false;
    }
    if(typeof this.fireRate == "string") {
      this.realShot = false;
    }

    if(this.shooting && this.nextshotin === 0 && this.weapon.ammo > 0 && !this.reloading) {
      let id = Math.random();
      let ind = game.bulletList.length - 1;
      game.bulletList.push(new Bullet(this, this.x, this.y, id, ind, this.gameId, ));
      this.nextshotin = this.fireRate;
      this.weapon.ammo--;
      this.realShot = true;
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
  reload() {
    if(!this.reloading && this.weapon.ammo < this.weapon.maxAmmo) {
      this.reloading = true;
      setTimeout(() => {
        this.weapon.ammo = this.weapon.maxAmmo;
        this.reloading = false;
      }, 500);
    }

  }
  updateMap(oldPos){
    let map = maps[game.mapIndex];
    for(let i = 0; i < map.objects.length; i++) {
      let b = map.objects[i];
      let coll = RectCircleColliding(this, b);
      if(coll && b.collidable) {
        let ls_0 = {p1: {x: b.x, y: b.y}, p2: {x: b.x + b.w, y: b.y}};
        let ls_1 = {p1: {x: b.x, y: b.y + b.h}, p2: {x: b.x + b.w, y: b.y + b.h}};
        let ls_2 = {p1: {x: b.x, y: b.y}, p2: {x: b.x, y: b.y + b.h}};
        let ls_3 = {p1: {x: b.x + b.w, y: b.y}, p2: {x: b.x + b.w, y: b.y + b.h}};
        if(inteceptCircleLineSeg(this, ls_0).length > 0) {
          this.y = oldPos[1];
        }
        if(inteceptCircleLineSeg(this, ls_1).length > 0) {
          this.y = oldPos[1];
        }
        if(inteceptCircleLineSeg(this, ls_2).length > 0) {
          this.x = oldPos[0];
        }
        if(inteceptCircleLineSeg(this, ls_3).length > 0) {
          this.x = oldPos[0];
        }
      }
    }
  }
  updateHealth() {
    let killer = 0;
    let bs = game.bulletList;
    for(let i = 0; i < bs.length; i++) {
      let b = bs[i];
      let shooter = b.parent;
      if(shooter.id !== this.id) {
        let dx = b.x - this.x;
  		  let dy = b.y - this.y;
  		  if(Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)) <= this.r + b.r && game.timer > 0) {
          this.health -= shooter.gun.dmg;
          bs.splice(i, 1);
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
    this.length = index + 1;
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
      let bs = game.bulletList;
      if(bs.length > this.length) {
        this.index = (bs.length - this.length) - 1;
      }
      bs.splice(this.index, 1);
    }
  }
}

let bInit = [];
let id = Math.random();
let game = new Game("ffa", id);
let gameRedis = JSON.stringify({room: game.room, numClients: game.players, port: 3000});
client.set("1", gameRedis, redis.print);
io.on("connection", (socket) => {
  let selfId = Math.random();
  socket.id = selfId;


  if(game.players == game.max) {
    socket.emit("gameFull");
  }
  game.players++;
  gameRedis = JSON.stringify({room: game.room, numClients: game.players, port: 3000});
  client.set("1", gameRedis, redis.print);
  console.log("[SERVER]: socket connected");
  socket.on("init", (data) => {
    if(game.playerList[socket.id] !== undefined) {
      game.playerList[socket.id].reset([gunList[data.wep.p], gunList[data.wep.s]]);
      if(!game.playerList[socket.id].joined) {
        game.playerJoin();
        game.playerList[socket.id].joined = true;
      }
    } else {
      if(game.players % 2 === 0 && game.mode == "siege") {
        game.addPlayer(new Player(data.name, socket, [gunList[data.wep.p], gunList[data.wep.s]], 0, [maps[0].spawns[0].x, maps[0].spawns[0].y], id), socket);
      } else if(game.mode == "siege"){
        game.addPlayer(new Player(data.name, socket, [gunList[data.wep.p], gunList[data.wep.s]], 1, [maps[0].spawns[1].x, maps[0].spawns[1].y], id), socket);
      } else if (game.mode == "ffa") {
        let t = Math.random();
        let p = genPos();
        game.addPlayer(new Player(data.name, socket, [gunList[data.wep.p], gunList[data.wep.s]], t, p, id), socket);
      }
    }

    let ip = game.playerList[selfId].initPack();
    socket.emit("initPack", {
      player: ip,
      bullet: bInit,
      map: maps[game.mapIndex]
    });

  });

  socket.on("keypress", (data) => {
    let p = game.playerList[selfId];
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
    if(data.reload) {
      p.reload();
    }
  });

  socket.emit("id", selfId);

  socket.on("disconnect", (data) => {
    console.log("[SOCKET]: disconnected");
    delete game.playerList[socket.id];
    game.players--;
  })
});

let once = 0;
function updatePack() {
  if(game.timer >= 0 && once == 0) {
    if(game.timer == 0) {
      once ++;
    }
    let pkg = {};
    let pkgp = [];
    let pkgb = [];
    for(let i in game.playerList) {
      game.playerList[i].update();
      let p = game.playerList[i];
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
        score: p.score,
        team: p.team % 1 == 0 ? PLAYER_LIST[i].team : 0,
        reloading: p.reloading,
        shooting: p.realShot
      });
    }
    pkg.player = pkgp
    for(let i = 0; i < game.bulletList.length; i++) {
      let b = game.bulletList[i];
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
    game.update();
    pkg.bullet = pkgb;
    game.check();
    pkg.lb = game.lb;
    pkg.timer = game.timer;
    io.emit("updatePack", pkg);
  }
}
setInterval(updatePack, 1E3 / 60);
