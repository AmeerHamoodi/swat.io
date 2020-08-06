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
    console.log("1");
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
}
