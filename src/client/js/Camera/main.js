import { Animator } from "../Animator/main.js"
let anim = new Animator();


export class Camera {
  constructor(player) {
    this.x = player.x;
    this.y = player.y;
    this.constX = window.innerWidth / 2;
    this.constY = window.innerHeight / 2;
    this.peekThreshHold = 50;
  }
  update(obj) {
    this.x = obj.x;
    this.y = obj.y;
    this.constX = window.innerWidth / 2;
    this.constY = window.innerHeight / 2
  }
  changeConst(mouse) {
    let targX = (this.x - mouse.x);
    let targY = (this.y - mouse.y);
    let peekMag = Math.sqrt((this.x - mouse.x) *(this.x - mouse.x) + (this.y - mouse.y)*(this.y - mouse.y));
    if(peekMag >= 0) {
      let e = anim.easeTo({x: this.constX, y: this.constY}, {x: targX, y: targY});
      this.constX += e.x;
      this.constY += e.y;
    } else {
      let e = anim.easeTo({x: this.constX, y: this.constY}, {x: window.innerWidth / 2, y: window.innerWidth / 2});
      this.constX += e.x;
      this.constY += e.y;
    }
  }
  getDrawPos(obj, FOR) {
    let ob = {};
    ob.x = (obj.x - FOR.x) + this.constX;
    ob.y = (obj.y - FOR.y) + this.constY;

    return ob;
  }
  follow(player) {
    this.x = player.x;
    this.y = player.y;
  }
  shake(ctx) {
    let pi = Math.PI;
    let mathArr = [pi / 6, pi / 4, pi / 3, pi / 2, 5 * pi / 6, 3 * pi / 4, 2 * pi / 3, pi, 7 * pi / 6, 5 * pi / 4, 4 * pi / 3, 3 * pi / 2, 11 * pi / 6, 7 * pi / 4, 5 * pi / 3, 2 * pi];
    let dx = 10 * Math.sin(mathArr[Math.floor(((Math.random() * 15) + 0))]);
    let dy = 10 * Math.sin(mathArr[Math.floor(((Math.random() * 15) + 0))]);
    return [dx, dy];
  }
}
