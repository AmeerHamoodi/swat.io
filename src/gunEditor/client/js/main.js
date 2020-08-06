import { Console } from './Console/main.js'
import { Renderer } from './Renderer/main.js'
import { Player } from './Entity/main.js'
import { bulletDraw } from './Entity/main.js'

const con = new Console();
const socket = require("socket.io-client")();
const renderer = new Renderer();

const dat = require("dat.gui");

let gui = new dat.GUI();

renderer._init_();

const ctx = renderer.ctx;
const c = renderer.canvas;

let mouse = {x: 0, y:0};

let clientList = {},
bulletList = [],
selfId = 0,
worldBound = [0, 0],
followId = 0;

let aspectRatio = 1;

class GunEditor {
  constructor() {
    this.name = "New gun";
    this.mass = 0;
    this.spread1 = 0;
    this.spread2 = 0;
    this.fireRate = 0;
    this.price = 0;
    this.dmg = 0;
  }
  update() {
    socket.emit("updateGunParam", {name: this.name,
      mass: this.mass,
      accuracy: [this.spread1, this.spread2],
      fireRate: Math.round(this.fireRate),
      dmg: this.dmg,
      type: "gun"
    })
  }
  save() {
    let saveText = JSON.stringify({
      name: this.name,
      mass: this.mass,
      accuracy: [this.spread1, this.spread2],
      fireRate: Math.round(this.fireRate),
      dmg: this.dmg,
      type: "gun"
    });
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(saveText));
    element.setAttribute('download', this.name);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
}

let ge = new GunEditor();

window.onload = () => {
  gui.add(ge, "name");
  gui.add(ge, "mass", 0, 200);
  gui.add(ge, "spread1", 0, 5);
  gui.add(ge, "spread2", 0, 5);
  gui.add(ge, "fireRate", 0, 100);
  gui.add(ge, "dmg", 0, 200);
  gui.add(ge, "update");
  gui.add(ge, "save");
}

socket.on("initPack", (data) => {
  aspectRatio = 1;
  for(let i = 0; i < data.player.length; i++) {
    clientList[data.player[i].id] = new Player(data.player[i].x, data.player[i].y, data.player[i].r ,data.player[i].name, data.player[i].id);
    worldBound = [data.player[i].wBw, data.player[i].wBh];
  }
  game();
});

socket.on("id", (data) => {
  selfId = data;
});

let game = () => {
  let currentLength = Object.keys(clientList).length;

  socket.on("updatePack", (data) => {
    if(currentLength < data.player.length) {
      currentLength = data.player.length;
      for(let i = 0; i < data.player.length; i++) {
        if(!clientList.hasOwnProperty(data.player[i].id)) {
          con.socket("New player");
          clientList[data.player[i].id] = new Player(data.player[i].x, data.player[i].y, data.player[i].r, data.player[i].name, data.player[i].id);
        }
      }
    }

    for(let i = 0; i < data.player.length; i++) {
      let id = data.player[i].id;
      clientList[id].updatePos(data.player[i]);
    }

    bulletList = data.bullet;
  });

  function drawAll() {
    renderer.helper.clearAll();
    renderer.helper.drawGrid(clientList[selfId].x, clientList[selfId].y, worldBound[0], worldBound[1], aspectRatio);
    for(let i in clientList) {
      con.data(clientList[selfId]);
      clientList[i].render(ctx, clientList[selfId], window.innerWidth, window.innerHeight, aspectRatio);
    }
    for(let i = 0; i < bulletList.length; i++) {
      bulletDraw(bulletList[i].x, bulletList[i].y, ctx, clientList[selfId], window.innerWidth, window.innerHeight, aspectRatio);
    }
    window.requestAnimationFrame(drawAll);
  }

  window.requestAnimationFrame(drawAll);

  let lastPress = false;
  let sendObject = {up: false, down: false, right: false, left: false, mx: 0, my:0, mousePress: false, shift: false, switch: false};
  document.addEventListener("keydown", (event) => {
    if(event.keyCode == 87) {
      sendObject.up = true;
    }
    if(event.keyCode == 83) {
      sendObject.down = true;
    }
    if(event.keyCode == 68) {
      sendObject.right = true;
    }
    if(event.keyCode == 65) {
      sendObject.left = true;
    }
    if(event.keyCode == 16) {
      sendObject.shift = true;
    }
    if(event.keyCode == 81) {
      sendObject.switch = !lastPress ? true : false;
      lastPress = true;
    }
    socket.emit("keypress", sendObject);
  }), document.addEventListener("keyup", (event) => {
    if(event.keyCode == 87) {
      sendObject.up = false;
    }
    if(event.keyCode == 83) {
      sendObject.down = false;
    }
    if(event.keyCode == 68) {
      sendObject.right = false;
    }
    if(event.keyCode == 65) {
      sendObject.left = false;
    }
    if(event.keyCode == 16) {
      sendObject.shift = false;
    }
    socket.emit("keypress", sendObject);
  }), document.body.addEventListener("mousemove", (event) => {
    sendObject.mx = event.clientX - c.width / 2;
    sendObject.my = event.clientY - c.height / 2;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    socket.emit("keypress", sendObject);
  }), document.body.addEventListener("mousedown", (event) => {
    sendObject.mousePress = true;
    socket.emit("keypress", sendObject);
  }), document.body.addEventListener("mouseup", (event) => {
    sendObject.mousePress = false;
    socket.emit("keypress", sendObject);
  })

}
