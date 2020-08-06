import { Console } from './Console/main.js'
import { Renderer } from './Renderer/main.js'
import { DomContents } from './DOMContents/main.js'
import { Player } from './Entity/main.js'
import { bulletDraw } from './Entity/main.js'
import { ImgLoader } from './Entity/main.js'
import { Camera } from './Camera/main.js'
import { mapp } from './Entity/main.js'


const con = new Console();
let socket = null;
const renderer = new Renderer();
const ui = new DomContents();
let gameIdSet = false;
const io = require("socket.io-client");

(function initGame() {
  fetch("/game")
    .then(results => results.json())
    .then(results => {
      socket = io(window.location.hostname + ":" + results.port);
      window.location.hash = "game=" + results.room;
      gameIdSet = true;
      fullGame();
    })
}());

function fullGame() {
  if(gameIdSet) {


    socket.on("gameMode", (data) => {
      ui.mode(data.toUpperCase());
    })

    renderer._init_(ui.gameScreen);

    const ctx = renderer.ctx;
    const c = renderer.canvas;

    let mouse = {x: 0, y:0};
    let camera = 0;

    let clientList = {},
    bulletList = [],
    selfId = 0,
    worldBound = [0, 0],
    followId = 0;

    let aspectRatio = 1;
    let map = [];
    let wep = {};
    let lastPoints = 0;
    let timer = document.getElementsByClassName('timer')[0];

    const loader = new ImgLoader();

    loader.load(mapp, ui)

    ui.addListenersToGuns(wep);


    ui.joinButton.addEventListener("click", (event) => {
      ui.joinButton.innerHTML = "<i class='fas fa-spinner fa-pulse'></i>";
      let nom = ui.nameField.value;
      document.body.classList.remove("welcome");
      ui.pstats.style.display = "none";
      ui.sstats.style.display = "none";
      socket.emit("init", {name: nom, wep: wep});
      document.body.style.opacity = 1;
      ui.name = nom;
    });


    socket.on("initPack", (data) => {
      ui.welcomeScreen.style.display = "none";
      ui.gameScreen.style.display = "block";
      ui.loadout.style.display = "none";
      document.body.style.opacity = 1;
      aspectRatio = 1;
      map = data.map;
      document.body.style.background = "#b6db66";
      document.getElementById('killBar').style.display = "none";
      for(let i = 0; i < data.player.length; i++) {
        clientList[data.player[i].id] = new Player(data.player[i].x, data.player[i].y, data.player[i].r ,data.player[i].name, data.player[i].id, data.player[i].gun, data.player[i].team);
        worldBound = [data.player[i].wBw, data.player[i].wBh];
      }
      ui.gameMode.style.display = "none";
      ui.bgCan.style.display = "none";
      game();
    });

    socket.on("id", (data) => {
      selfId = data;
    });

    let game = () => {
      camera = new Camera(clientList[selfId]);
      let currentLength = Object.keys(clientList).length;
      let dc = 0;

      socket.on("updatePack", (data) => {
        if(typeof data.game == "string") {
          timer.innerText = data.game;
        }
        if(currentLength < data.player.length) {
          currentLength = data.player.length;
          for(let i = 0; i < data.player.length; i++) {
            if(!clientList.hasOwnProperty(data.player[i].id)) {
              clientList[data.player[i].id] = new Player(data.player[i].x, data.player[i].y, data.player[i].r, data.player[i].name, data.player[i].id);
            }
          }
        }

        for(let i = 0; i < data.player.length; i++) {
          let id = data.player[i].id;
          clientList[id].updatePos(data.player[i]);
          if(id == selfId) {

          }
        }
        camera.update(clientList[selfId]);
        bulletList = data.bullet;
        ui.updateLeaderBoard(data.lb, clientList[selfId].team);
        if(clientList[selfId].score - lastPoints !== 0 && clientList[selfId].score !== undefined) {
          ui.pointAnimation(clientList[selfId].score - lastPoints);
          lastPoints = clientList[selfId].score;
        }

        ui.updateTimer(data.timer);
        let wep1, wep2 = null;
        if(wep.p == clientList[selfId].gun.name) {
          wep1 = clientList[selfId].gun;
          wep2 = wep.s;
        } else {
          wep1 = clientList[selfId].gun;
          wep2 = wep.p;
        }
        ui.weaponGUIUpdater(wep1, wep2);

        ui.reloading = clientList[selfId].reloading;
        camera.changeConst(mouse);
      });

      socket.on("reset", () => {
        ui.welcomeScreen.style.display = "block";
        ui.gameScreen.style.display = "none";
        ui.loadout.style.display = "block";
        ui.pstats.style.display = "block";
        ui.sstats.style.display = "block";
        aspectRatio = 1;
        document.body.style.background = "#525556";
        ui.joinButton.innerHTML = 'Join Game  <i class="fas fa-chevron-right" id="arrow"></i>';
        document.getElementById('killBar').style.display = "none";
        document.getElementsByClassName('gameOver')[0].style.display = 'none';
        document.body.style.opacity = 1;
        ui.gameMode.style.display = "block";
        ui.bgCan.style.display = "block";
      })


      socket.on("death", (data) => {
        dc++;
        let kb = document.getElementById('killBar');
        kb.style.display = "grid";
        document.getElementById('killName').innerText = "You were killed by: " + data.name;
        document.getElementById('stats').innerText = data.gun.name + " " + data.gun.dmg + " / SHOT";

        let g = setInterval(() => {
          if(aspectRatio >= 2) {
            clearInterval(g);
            restore();
          }
          if(aspectRatio == 1) {
            aspectRatio += 0.1;
          } else {
            aspectRatio += (1/50) / aspectRatio;
          }

        }, 50);
      })

      function restore() {
        if(clientList[selfId].hp <= 0) {
          ui.welcomeScreen.style.display = "block";
          ui.gameScreen.style.display = "none";
          ui.loadout.style.display = "block";
          ui.pstats.style.display = "block";
          ui.sstats.style.display = "block";
          aspectRatio = 1;
          document.body.style.background = "#525556";
          ui.joinButton.innerHTML = 'Join Game  <i class="fas fa-chevron-right" id="arrow"></i>';
          document.getElementById('killBar').style.display = "none";
          ui.gameMode.style.display = "block";
          ui.bgCan.style.display = "block";
        }

      }


      function drawAll() {
        renderer.helper.clearAll();
        if(clientList[selfId].shooting) {
          let ss = camera.shake();
          ctx.save();
          ctx.translate(ss[0], ss[1]);
        }
        renderer.helper.drawGrid(camera, worldBound[0], worldBound[1], aspectRatio);
        renderer.helper.drawMap(map, clientList[selfId], camera, loader, aspectRatio);
        for(let i = 0; i < bulletList.length; i++) {
          bulletDraw(bulletList[i].x, bulletList[i].y, ctx, clientList[selfId], camera, aspectRatio, bulletList[i].angle, loader, bulletList[i].startX, bulletList[i].startY, bulletList[i].ga);
        }
        for(let i in clientList) {
          clientList[i].render(ctx, clientList[selfId], loader, camera, aspectRatio, selfId);
        }
        ctx.restore();
        window.requestAnimationFrame(drawAll);
      }

      window.requestAnimationFrame(drawAll);

      let lastPress = false;
      let sendObject = {up: false, down: false, right: false, left: false, mx: 0, my:0, mousePress: false, shift: false, switch: false, reload: false};
      document.addEventListener("keydown", (event) => {
        if(event.keyCode == 87) {
          sendObject.up = true;
          clientList[selfId].y -= 1.5;
        }
        if(event.keyCode == 83) {
          sendObject.down = true;
          clientList[selfId].y += 1.5;
        }
        if(event.keyCode == 68) {
          sendObject.right = true;
          clientList[selfId].x += 1.5;
        }
        if(event.keyCode == 65) {
          sendObject.left = true;
          clientList[selfId].x -= 1.5;
        }
        if(event.keyCode == 16) {
          sendObject.shift = true;
        }
        if(event.keyCode == 81) {
          sendObject.switch = true;
        }
        if(event.keyCode == 82) {
          sendObject.reload = true;
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
        if(event.keyCode == 81) {
          sendObject.switch = false;
        }
        if(event.keyCode == 82) {
          sendObject.reload = false;
        }
        socket.emit("keypress", sendObject);
      }), document.getElementById('game').addEventListener("mousemove", (event) => {
        sendObject.mx = event.clientX - c.width / 2;
        sendObject.my = event.clientY - c.height / 2;
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        socket.emit("keypress", sendObject);
      }), document.getElementsByClassName('game')[0].addEventListener("mousedown", (event) => {
        sendObject.mousePress = true;
        socket.emit("keypress", sendObject);

      }), document.getElementById('game').addEventListener("mouseup", (event) => {
        sendObject.mousePress = false;
        socket.emit("keypress", sendObject);
      })

    }
  }
}
