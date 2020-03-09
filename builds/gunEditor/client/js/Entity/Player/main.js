import { Console } from '../.././Console/main.js'
const con = new Console();

export class Player {
  constructor(x, y, r, name, id) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.hp = 100;
    this.angle = 0;
    this.id = id;
    this.r = r;
    this.state = "gun";
    this.acc = 0;
  }
  updatePos(obj) {
    this.x = obj.x;
    this.y = obj.y;
    this.angle = obj.angle;
    this.r = obj.r;
    this.state = obj.state;
    this.acc = obj.acc;
  }
  render(ctx, mp, forX, forY, ap) {
    ctx.globalAlpha = 1;
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;

    let w = ctx.measureText(this.name).width;

    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#edd380";
    if(this.r == 0) {
      con.socket("DEAD...");
    } else if (this.state == "gun"){
      ctx.save();
      ctx.translate((this.x - mp.x) + forX / 2, (this.y - mp.y) + forY / 2);
  		ctx.rotate((this.angle + Math.PI / 2));
  		ctx.translate(-((this.x - mp.x) + forX / 2), -((this.y - mp.y) + forY / 2));
      ctx.beginPath();
      ctx.arc((this.x - mp.x) + forX / 2 - (1 * ap), (this.y - mp.y) + forY / 2 + (-22 * ap), this.r/2.5 * ap, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc((this.x - mp.x) + forX / 2 + (8 * ap), (this.y - mp.y) + forY / 2 + (-42 * ap), this.r/2.5 * ap, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc((this.x - mp.x) + forX / 2, (this.y - mp.y) + forY / 2, this.r * ap, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.font = "15px Arial";
      ctx.fillStyle = "black";
      ctx.fillText(this.name, (this.x - mp.x) + forX / 2 - w / 2, (this.y - mp.y) + forY / 2 - 30);
      ctx.restore();
    } else if(this.state == "knife") {
      ctx.save();
      ctx.translate((this.x - mp.x) + forX / 2, (this.y - mp.y) + forY / 2);
  		ctx.rotate((this.angle + Math.PI / 2));
  		ctx.translate(-((this.x - mp.x) + forX / 2), -((this.y - mp.y) + forY / 2));
      ctx.beginPath();
      ctx.arc((this.x - mp.x) + forX / 2 - (-18 * ap), (this.y - mp.y) + forY / 2 + (-22 * ap), this.r/2.5 * ap, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc((this.x - mp.x) + forX / 2 + (-18 * ap), (this.y - mp.y) + forY / 2 + (-22 * ap), this.r/2.5 * ap, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc((this.x - mp.x) + forX / 2, (this.y - mp.y) + forY / 2, this.r * ap, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.font = "15px Arial";
      ctx.fillStyle = "black";
      ctx.fillText(this.name, (this.x - mp.x) + forX / 2 - w / 2, (this.y - mp.y) + forY / 2 - 30);
      ctx.restore();
    }
  }
}
