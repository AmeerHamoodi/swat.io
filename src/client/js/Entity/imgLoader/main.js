import { Console } from '../../Console/main.js'


const con = new Console();


export class ImgLoader {
  constructor() {
    this.ak47 = new Image();
    this.p2000 = new Image();
    this.sigm400 = new Image();
    this.scar = new Image();
    this.mac11 = new Image();
    this.m4a1 = new Image();
    this.magnum = new Image();
    this.sawedOff = new Image();
    this.m16 = new Image();
    this.bullet = new Image();
    this.groundTexture = new Image();
    this.armors =[new Image(), new Image()];
    this.positions = [{x: 5/4, y: 5/4, w: 50, h:50}, {x: 15/16, y: 1, w: 40, h: 25}];
    this.mapObjects = {
      barrel: new Image(),
      bush: new Image(),
      container: new Image(),
      crate: new Image(),
      house_0: new Image(),
      house_1: new Image(),
      oil_barrel: new Image(),
      rocks: new Image(),
      tree: new Image()
    }
    this.canRun = 0;
  }
  load(mapp, ui) {
    con.data("Loading images...");
    this.ak47.src = "./img/assets/weapons/ak47.png";
    this.p2000.src = "./img/assets/weapons/p2000.png";
    this.sigm400.src = "./img/assets/weapons/sigm-400.png";
    this.scar.src = "./img/assets/weapons/scar.png"
    this.mac11.src = "./img/assets/weapons/mac11.png"
    this.m4a1.src = "./img/assets/weapons/m4a1.png"
    this.magnum.src = "./img/assets/weapons/magnum.png"
    this.sawedOff.src = "./img/assets/weapons/sawedOff.png"
    this.m16.src = "./img/assets/weapons/m16.png";
    this.bullet.src = "./img/assets/effects/bullet.png";
    this.armors[0].src = "./img/assets/armors/swatHelm.png";
    this.armors[1].src = "./img/assets/armors/crim-helm.png";
    this.mapObjects.barrel.src = "./img/assets/mapObjects/barrel.png";
    this.mapObjects.bush.src = "./img/assets/mapObjects/bush.png";
    this.mapObjects.container.src = "./img/assets/mapObjects/container.png";
    this.mapObjects.crate.src = "./img/assets/mapObjects/crate.png";
    this.mapObjects.house_0.src = "./img/assets/mapObjects/house_0.png";
    this.mapObjects.house_1.src = "./img/assets/mapObjects/house_1.png";
    this.mapObjects.oil_barrel.src = "./img/assets/mapObjects/oil_barrel.png";
    this.mapObjects.rocks.src = "./img/assets/mapObjects/rocks.png";
    this.mapObjects.tree.src = "./img/assets/mapObjects/tree.png";

    let inc = 0;
    let self = this;
    for(let i in self.mapObjects) {
      self.mapObjects[i].onload = () => {
        con.data("loaded " + i);
        inc++;
        console.log(inc + " " + Object.keys(this.mapObjects).length)
        if(inc == Object.keys(this.mapObjects).length) {
          ui.renderBackground(mapp.objects, this, ui);
        }
      }
    }
  }
}
