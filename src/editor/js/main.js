import { Console } from './Console/main.js'
import { Renderer } from './Renderer/main.js'
import { Camera } from './Camera/main.js'

const dat = require("dat.gui");

let gui = new dat.GUI();


const con = new Console();
const renderer = new Renderer();
let camera = new Camera();
renderer._init_();
const ctx = renderer.ctx;
const c = renderer.canvas;
let objects = [];
let mouse = {x: 0, y: 0};

let imageList = ["none", "barrel", "bush", "container", "crate", "house_0", "house_1", "oil_barrel", "rocks", "tree", "road", "road_1"];

let imgs = {
  barrel: new Image(),
  bush: new Image(),
  container: new Image(),
  crate: new Image(),
  house_0: new Image(),
  house_1: new Image(),
  oil_barrel: new Image(),
  rocks: new Image(),
  tree: new Image(),
  road: new Image(),
  road_1: new Image()
}
imgs.barrel.src = "./assets/barrel.png"
imgs.bush.src = "./assets/bush.png"
imgs.container.src = "./assets/container.png"
imgs.crate.src = "./assets/crate.png"
imgs.house_0.src = "./assets/house_0.png"
imgs.house_1.src = "./assets/house_1.png"
imgs.oil_barrel.src = "./assets/oil_barrel.png"
imgs.rocks.src = "./assets/rocks.png"
imgs.tree.src = "./assets/tree.png"
imgs.road.src = "./assets/road.png";
imgs.road_1.src = "./assets/road_1.png";


class Editor {
  constructor() {
    this.name = "New Unknwon name map";
    this.dimensions = {w: 5000, h: 5000, ss: "green"};
    this.zoom = 1;
    this.sindex = null;
    this.textures = "none";
    this.fs = "#808080";
    this.spawns = [];
    this.background = "dirt";
  }
  newShape() {
    renderer.helper.object({
      x: 50,
      y: 50,
      w: 20,
      h: 20,
      fs: this.fs,
      ss: 'rgba(128, 128, 128, 0)',
      texture: "none",
      selected: false,
      drag: false,
      edit: false,
      type: 1,
      collidable: true
    });
  }
  newSpawn() {
    let ob = {
      x: 50,
      y: 50,
      h:20,
      w: 20,
      fs: "blue",
      ss: "black",
      texture: "none",
      selected: false,
      drag: false,
      edit: false,
      type: 2,
      for: 0
    }
    renderer.helper.object(ob);
    this.spawns.push(ob);
  }
  getSpawns() {
    let arr = [];
    for(let i = 0; i < this.spawns.length; i++) {
      con.data("Spawn at: " + this.spawns[i].x);
      arr.push({x: this.spawns[i].x, y: this.spawns[i].y, for: this.spawns[i].for});
    }
    return arr;
  }
  export() {
    let exportObject = {mapName: this.name, objects: renderer.helper.getObjects(), spawns: this.getSpawns()};
    let text = JSON.stringify(exportObject);
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', "New map");

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
  import() {
    let obJSON = prompt("Paste map content");
    let obj = JSON.parse(obJSON);
    let mapObj = obj.objects;
    this.name = obj.mapName;
    con.data(mapObj);
    for(let i = 0; i < mapObj.length; i++) {
      mapObj[i].fs = this.fs;
      mapObj[i].ss = "black";
      mapObj[i].selected = false;
      mapObj[i].drag = false;
      mapObj[i].edit = false
      mapObj[i].type = 1;

      renderer.helper.object(mapObj[i]);
    }
  }
}
const editor = new Editor();
//dat.GUI logic
let cont = 0;
window.onload = () => {
  gui.add(editor, "name");
  gui.add(editor, "newShape");
  gui.add(editor, "newSpawn");
  gui.add(editor, "zoom", 0.1, 5);
  gui.add(editor, "export");
  gui.add(editor, "import");
}
document.body.style.background = 'url("./assets/grass.png")';




//editor logic
camera.move();
function update() {
  camera.update();
  renderer.helper.lookThroughAll(mouse, camera);

  if(editor.sindex !== null) {
    renderer.helper.renderingObjects[editor.sindex].texture = editor.textures;
  }
}
setInterval(update, 1E3 / 60);

function drawAll() {
  renderer.helper.clearAll();
  renderer.helper.srect(editor.dimensions, camera)
  renderer.helper.drawGrid(camera.x, camera.y, editor.dimensions.w, editor.dimensions.h, editor.zoom);
  renderer.helper.renderAll(camera, editor.zoom, imgs);
  window.requestAnimationFrame(drawAll);
}
window.requestAnimationFrame(drawAll);
let items = [];
document.addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
}), document.addEventListener("click", (event) => {
  let len = renderer.helper.renderingObjects.length;
  let list = renderer.helper.renderingObjects;
  for(let i = 0; i < len; i++) {
    if(list[i].selected) {
      if(items.length == 0) {
        items.push(gui.add(list[i], "x", -500, 4000));
        items.push(gui.add(list[i], "y", -500, 4000));
        items.push(gui.add(list[i], "w", 1, 1000));
        items.push(gui.add(list[i], "h", 1, 1000));
        items.push(gui.add(list[i], "collidable"));
        if(list[i].type == 2) {
          items.push(gui.add(list[i], "for"));
        }
        items.push(gui.add(editor, "textures", imageList));
        document.getElementById('goback').style.display = "block";
        editor.sindex = i;

      }
    }
  }
}), document.getElementById('goback').addEventListener("click", (event) => {
    for(let i = 0; i < items.length; i++) {
      gui.remove(items[i]);
    }
    items = [];
    editor.sindex = null;
    editor.textures = 'none';
    document.getElementById('goback').style.display = "none";
})
