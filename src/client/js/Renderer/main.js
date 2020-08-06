import { Canvas } from './Canvas.js'
import { Helper } from './DrawingHelpers.js'
import { Console } from '../Console/main.js'

const con = new Console();

export class Renderer {
  constructor() {
    this.ctx = 0;
    this.canvas = 0;
    this.helper = 0;
  }
  _init_(dom) {
    let canvas = new Canvas(dom);
    canvas._init_();
    const ctx = canvas.ctx;
    let drawingHelper = new Helper(canvas.c);
    canvas.c.classList.add("game");
    drawingHelper.resizeSet();


    this.ctx = ctx;
    this.canvas = canvas;
    this.helper = drawingHelper;
    con.data("Set data in renderer");
  }
  backgroundHomeScreen() {
    let backgroundCanvas = new Canvas();
    backgroundCanvas._init_();
    let particleDrawer = new Helper(backgroundCanvas.c);
    particleDrawer.resizeSet();
    let particleArray = [],
    i = 0;

    //background particles
    for(i; i < 100; i++) {
      let x = Math.floor(Math.random() * window.innerWidth) + 0,
      y = Math.floor(Math.random() * window.innerWidth) + 0,
      r = Math.floor(Math.random() * 10) + 2,
      ga = Math.floor(Math.random() * 1) + 0.2;
      particleArray.push({
        x: x,
        y: y,
        r: r,
        ga: ga
      });
    }
    setInterval(() => {
      for(let x = 0; x < particleArray.length; x ++) {
        particleDrawer.clearAll();
        let ob = particleArray[x];
        particleDrawer.drawCircle(ob);
        ob.x += 0.5;
        ob.y += 0.5;
      }
    }, 60 / 1E3);

  }
}
