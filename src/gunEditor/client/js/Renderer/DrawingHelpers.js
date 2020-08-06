import { Console } from '../Console/main.js'
const con = new Console();

export class Helper {
  constructor(c) {
    this.c = c;
    this.fill = "black";
    this.stroke = "black";
    this.renderingObjects = [];
  }
  clearAll() {
    let ctx = this.c.getContext("2d");

    ctx.clearRect(0, 0, this.c.width, this.c.height);
  }
  drawSquare(obj) {
    let ctx = this.c.getContext("2d");
    ctx.beginPath();
    ctx.rect(obj.x, obj.y, obj.w, obj.h);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    con.data('drawn');
  }
  drawCircle(obj) {
    let ctx = this.c.getContext("2d");
    ctx.beginPath();
    ctx.globalAlpha = obj.ga;
    ctx.arc(obj.x, obj.y, obj.r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

  }
  fill(color) {
    this.fill = typeof color == "string" ? color : "black";
  }
  stroke(color) {
    this.stroke = typeof color == "string" ? color: "black";
  }
  resizeSet() {
    window.onresize = () => {
      this.c.width = window.innerWidth;
      this.c.height = window.innerHeight;
      con.data("Resized!");
    }
  }
  drawGrid(ax, ay, w, h, ap) {
    let ctx = this.c.getContext("2d"),
    step = 40 * ap;
    ctx.beginPath();
    ctx.strokeStyle = '#787878';
    ctx.lineJoin = "miter";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.5;
    for (let x = 0 - ax; x <= w; x+=step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
    }

    for (let y = 0 - ay; y <= h; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
    }
    ctx.stroke();
  }
  object(obj) {
    this.renderingObjects.push(obj);
  }
  renderAll(cam, ap) {
    let ctx = this.c.getContext("2d");
    for(let i = 0; i < this.renderingObjects.length; i++) {
      let ob = this.renderingObjects[i];
      ctx.globalAlpha = 1;
      ctx.fillStyle = ob.fs;
      ctx.strokeStyle = ob.ss;
      ctx.beginPath();
      ctx.rect(ob.x - cam.x, ob.y - cam.y, ob.w * ap, ob.h * ap);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
    }
  }
  lookThroughAll(mouse, cam) {
    let mx = mouse.x - cam.x;
    let my = mouse.y - cam.y;
    let length = this.renderingObjects.length
    for(let i = 0; i < length; i++) {
      let b = this.renderingObjects[i];
      let bx = b.x - cam.x;
      let by = b.y - cam.y;
      let dx = mx - bx;
      let dy = my - by;
      let py = Math.sqrt(dx * dx + dy * dy);
      if(py - b.w <= b.w) {
        b.fs = "green";
        b.selected = true;
      } else {
        b.fs = "red";
        b.selected = false;
      }

      /*if(b.drag) {
        b.x = mouse.x;
        b.y = mouse.y;
      }
      if(b.edit) {
        b.ss = "orange";
      } else {
        b.ss = "black";
      }*/
    }
  }
}
