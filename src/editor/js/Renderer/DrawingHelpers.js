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
  srect(ob, cam) {
    let ctx = this.c.getContext("2d");
    ctx.strokeStyle = ob.ss;
    ctx.beginPath();
    ctx.rect(0 - cam.x, 0 - cam.y, ob.w, ob.h);
    ctx.stroke();
    ctx.closePath();
  }
  getObjects() {
    let arr = [];
    for(let i = 0; i < this.renderingObjects.length; i++) {
      let b = this.renderingObjects[i];
      if(b.type == 1) {
        arr.push({x: b.x, y: b.y, w: b.w, h: b.h, texture: b.texture, collidable: b.collidable});
      }
    }

    return arr;
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
  opp(val) {
    if(val == "green") {
      return "red";
    } else if(val == "red") {
      return "green";
    }
  }
  renderAll(cam, ap, imgs) {
    let ctx = this.c.getContext("2d");
    for(let i = 0; i < this.renderingObjects.length; i++) {
      let ob = this.renderingObjects[i];
      ctx.globalAlpha = 1;
      if(ob.texture == "none") {
        ctx.fillStyle = ob.fs;
        ctx.strokeStyle = ob.ss;
        ctx.beginPath();
        ctx.rect((ob.x - cam.x), (ob.y - cam.y) , ob.w * ap, ob.h * ap);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
      } else {
        ctx.drawImage(imgs[ob.texture], (ob.x - cam.x), (ob.y - cam.y) , ob.w * ap, ob.h * ap, )
      }
    }
  }
  lookThroughAll(mouse, cam) {
    let mx = mouse.x;
    let my = mouse.y;
    let length = this.renderingObjects.length
    for(let i = 0; i < length; i++) {
      let b = this.renderingObjects[i];
      let bx = (b.x - cam.x);
      let by = (b.y - cam.y);
      if(mx >= bx && mx <= bx + b.w && my >= by && my <= by + b.h) {
        b.selected = true;
      } else {
        b.selected = false;
      }
    }
  }
}
