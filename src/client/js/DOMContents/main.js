let times = 0;
let timess = 0;
let keys = {
  p: [
    {
      name: "ak47",
      id: "p0",
      dmg: 22,
      fireRate: 8,
      accuracy: [2, -1],
      mass: 4
    },
    {
      name: "sigm400",
      id: "p1",
      dmg: 22,
      fireRate: 8,
      accuracy: [2, -1],
      mass: 4,
      type: "gun",
    },
    {
      name: "scar",
      id: "p2",
      dmg: 33,
      fireRate: 10,
      accuracy: [2, -1],
      mass: 6,
      type: "gun",
    },
    {
      name: "m4a1",
      id: "p3",
      dmg: 18,
      fireRate: 4,
      accuracy: [2, -1],
      mass: 4,
      type: "gun",
    },
    {
      name: "m16",
      id: "p4",
      dmg: 28,
      fireRate: 20,
      accuracy: [1, -1],
      mass: 6,
      type: "gun"
    }
  ],
s: [
  {
    name: "p2000",
    id: "s0",
    dmg: 15,
    fireRate: "once",
    accuracy: [0, -1],
    mass: 2,
    type: "gun",
    canShoot: 10,
    canMax: 10
  },
  {
    name: "mac11",
    id: "s1",
    dmg: 10,
    fireRate: 4,
    accuracy: [3, -3],
    mass: 1,
    type: "gun",
    canShoot: 4,
    canMax: 4,
  },
  {
    name: "magnum",
    id: "s2",
    dmg: 45,
    fireRate: "once",
    accuracy: [2, -1],
    mass: 8,
    type: "gun",
    canShoot: 60,
    canMax: 60
  },
  {
    name: "sawedOff",
    id: "s3",
    fireRate: "once",
    accuracy: [10, -5],
    mass: 12,
    type: "gun",
    canShoot: 40,
    canMax: 40
  },
]
}

function createBarElem(index, prop, cont, c) {
  let par = document.getElementsByClassName('bars')[index];
  let pre = 0;
  switch (c) {
    case "dmg":
      pre = "DMG: "
      break;
    case "gunFR":
      pre = "FIRE RATE: "
      break;
    case "gunAcc":
      pre = "ACCURACY: "
      break;
    case "gunMass":
      pre = "MASS: "
      break;
    default:

  }
  //damage text stuff
  let elem = document.createElement("span");
  elem.className += "space";
  elem.innerText = pre + prop;



  //looping to create bars
  for(let i = 0; i < Math.round(prop / cont); i++) {
    let eslem = document.createElement("div");
    eslem.classList.add("bar");
    par.append(eslem);
  }
  //appending text
  par.append(elem);
}
function reset(index) {
  let par = document.getElementsByClassName('bars')[index];
  while (par.firstChild) {
    par.removeChild(par.lastChild);
  }
}
export class DomContents {
  constructor() {
    this.joinButton = document.getElementById('join');
    this.welcomeScreen = document.getElementsByClassName('welcomeScreen')[0];
    this.gameScreen = document.getElementById('game');
    this.nameField = document.getElementById('name');
    this.loadout = document.getElementsByClassName('chooseLoadout')[0];
    this.health = document.getElementById('health');
    this.pstats = document.getElementsByClassName('pstats')[0];
    this.pgunName = document.getElementById('pgunName');
    this.pgunDmg = document.getElementById('dmg');
    this.pgunFR = document.getElementById('pgunFR');
    this.pgunAcc = document.getElementById('pgunAcc');
    this.pgunMass = document.getElementById('pgunMass');
    this.sstats = document.getElementsByClassName('sstats')[0];
    this.sgunName = document.getElementById('sgunName');
    this.lb = document.getElementById('lbItems');
    this.initTime = 3E5;
    this.timer = document.getElementsByClassName('timer')[0];
    this.go = document.getElementsByClassName('itemsEnd')[0];
    this.goDiv = document.getElementsByClassName('gameOver')[0];
    this.lbArr = [];
    this.called = 0;
    this.name = null;
    this.currWep = document.getElementById('weaponName');
    this.currAmmo = document.getElementById('ammo');
    this.switchWep = document.getElementsByClassName('switchWeapon')[0];
    this.reloading = false;
    this.gameMode = document.getElementById('gameMode');
    this.bgCan = document.getElementById('backgroundCanvas');
    this.drawn = false;
  }
  renderBackground(map, loader, e) {
    e.bgCan.width = window.innerWidth;
    e.bgCan.height = window.innerHeight;
    let ctx = e.bgCan.getContext("2d");
    //grid
    let step = 40;
    ctx.beginPath();
    ctx.strokeStyle = '#787878';
    ctx.lineJoin = "miter";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.5;
    let w = window.innerWidth, h = window.innerHeight;
    for (let x = 0; x <= w; x+=step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
    }

    for (let y = 0; y <= h; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
    }
    ctx.stroke();
    //mapObjects
    for(let i = 0; i < map.length; i++) {
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      let mapOb = map[i];
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      if(mapOb.texture == "none") {
        ctx.beginPath();
        ctx.rect(mapOb.x, mapOb.y, mapOb.w, mapOb.h);
        ctx.fillStyle = "#808080";
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
      } else {
        ctx.drawImage(loader.mapObjects[mapOb.texture], mapOb.x, mapOb.y, mapOb.w, mapOb.h);
      }
    }
    this.drawn = true;
  }
  addListenersToGuns(wep) {
    let prim = keys.p;
    let sec = keys.s;
    let lastSelectedp = null;
    let lastSelecteds = null;
    for(let i = 0; i < prim.length; i++) {
      let id = prim[i].id;
      document.getElementById(id).addEventListener("click", (event) => {
        for(let i = 0; i < 4; i++) {
          reset(i);
        }
        wep.p = prim[i].name;
        let gOb = prim[i];
        document.getElementById(id).classList.add("selected");
        if(lastSelectedp === null) {
          lastSelectedp = id;
        } else {
          document.getElementById(lastSelectedp).classList.remove("selected");
          lastSelectedp = id;
        }
        this.pgunName.innerText = gOb.name.toUpperCase();
        let acc = Math.abs(gOb.accuracy[0]) + Math.abs(gOb.accuracy[1]);
        createBarElem(0, gOb.dmg, 10, 'dmg');
        createBarElem(1, gOb.fireRate, 2, 'gunFR');
        createBarElem(2, acc, 3, 'gunAcc');
        createBarElem(3, gOb.mass, 2, 'gunMass');
        times++;
      })
    }
    for(let i = 0; i < sec.length; i++) {
      let id = sec[i].id;
      document.getElementById(id).addEventListener("click", (event) => {
        wep.s = sec[i].name;
        let gOb = sec[i];
        if(timess == 0) {
          for(let i = 4; i < 8; i++) {
            reset(i);
          }
        }
        document.getElementById(id).classList.add("selected");
        if(lastSelecteds === null) {
          lastSelecteds = id;
        } else {
          document.getElementById(lastSelecteds).classList.remove("selected");
          lastSelecteds = id;
        }
        this.sgunName.innerText = gOb.name;
        let acc = Math.abs(gOb.accuracy[0]) + Math.abs(gOb.accuracy[1]);
        createBarElem(4, gOb.dmg, 10, 'dmg');
        let fr = gOb.fireRate == "once" ? gOb.canShoot : gOb.fireRate;
        createBarElem(5, fr, 2, 'gunFR');
        createBarElem(6, acc, 3, 'gunAcc');
        createBarElem(7, gOb.mass, 2, 'gunMass');
      })
    }
  }
  mode(gameMode) {
    this.gameMode.innerText = gameMode;
  }
  updateLeaderBoard(array, team) {
    this.lbArr = array;
    let count = this.lb.getElementsByTagName('tr').length;
    while (this.lb.firstChild && count > 1) {
      this.lb.removeChild(this.lb.lastChild);
      count--;

    }
    for(let i = 0; i < array.length; i++) {
      let sec = document.createElement("tr");
      let place = document.createElement("td");
      let name = document.createElement("td");
      let score = document.createElement("td");

      place.innerText = i + 1+".";
      place.style.color = "#fff";
      name.innerText = array[i].name;
      if(gameMode.innerText == "TDM") {
        name.style.color = array[i].team == team ? "#fff" : "#bf0013";
      } else {
        name.style.color = array[i].name == this.name ? "#fff" : "#bf0013";
      }
      score.innerText = array[i].score;
      sec.appendChild(place);
      sec.appendChild(name);
      sec.appendChild(score);
      this.lb.appendChild(sec);
    }
  }
  pointAnimation(points) {
    let el = document.createElement("div");
    el.classList.add("killItem");
    el.innerText = "KILL! + " + points;
    this.gameScreen.appendChild(el);
    setTimeout(() => {
      this.gameScreen.removeChild(el);
    }, 1000)
  }
  updateTimer(time) {
    let sec = time / 1000;
    let min = Math.floor(sec / 60);
    let leftOver = Math.abs(Math.floor(sec - (min * 60)));
    if(leftOver < 10) {
      leftOver = "0" + leftOver.toString();
    }
    this.timer.innerText =  min + ": "+ leftOver;
    if(Math.floor(leftOver + min) == 0) {
      this.gameOver(this.lbArr);
    }
  }
  gameOver(content) {
    if(this.called == 0) {
      this.called ++;
      document.getElementsByClassName('gameOver')[0].style.display = 'block';
      for(let i = 0; i < content.length; i++) {
        let sec = document.createElement("tr");
        let place = document.createElement("td");
        let name = document.createElement("td");
        let score = document.createElement("td");
        place.innerText = i + 1 +".";
        place.style.color = "#fff";
        name.innerText = content[i].name;
        name.style.color = content[i].name == this.name ? "#fff" : "#bf0013";
        score.innerText = content[i].score;
        sec.appendChild(place);
        sec.appendChild(name);
        sec.appendChild(score);
        this.go.appendChild(sec);
      }
      let count = this.lb.getElementsByTagName('tr').length;
    }
  }
  weaponGUIUpdater(weapon1, weapon2) {
    this.currWep.innerText = weapon1.name.toUpperCase();
    this.currAmmo.innerText = weapon1.ammo +"/" + weapon1.maxAmmo;
    this.switchWep.innerText = weapon2.toUpperCase() + " [Q] to switch";

    if(this.reloading) {
      this.currAmmo.innerText = "RELOADING...";
    }
  }
}
