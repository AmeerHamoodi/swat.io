import { Console } from '../.././Console/main.js'
const con = new Console();

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();

  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();

  }

}

export class Player {
  constructor(x, y, r, name, id, gun, team) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.hp = 100;
    this.angle = 0;
    this.id = id;
    this.r = r;
    this.state = "gun";
    this.acc = 0;
    this.gun = gun;
    this.hp = 100;
    this.team = team;
    this.hpWidth = 50;
    this.torender = true;
    this.reloading = false;
    this.shooting = false;
  }
  updatePos(obj) {
    this.x = obj.x;
    this.y = obj.y;
    this.angle = obj.angle;
    this.r = obj.r;
    this.state = obj.state;
    this.acc = obj.acc;
    this.gun = obj.gun;
    this.hp = obj.hp;
    this.score = obj.score;
    this.team = obj.team;
    con.socket("Team: " + obj.team);
    this.hpWidth = this.hp === 100 ? 50 : Math.round(this.hp / 2);
    this.reloading = obj.reloading;
    this.shooting = obj.shooting;
  }
  render(ctx, mp, weapons, cam, ap, sid) {
    ap = 1;
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'yellow';
    ctx.shadowBlur = 0;

    let w = ctx.measureText(this.name).width;
    let drawOb = cam.getDrawPos(this, mp);

    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#edd380";
    ctx.lineWidth = 3;
    if(this.r == 0) {
    } else if (this.state == "gun"){
      let arm = weapons["armors"][this.team];
      let pos = weapons["positions"];
      ctx.save();
      ctx.translate(drawOb.x, drawOb.y);
  		ctx.rotate((this.angle + Math.PI / 2));
  		ctx.translate(-drawOb.x, -drawOb.y);
      ctx.beginPath();
      ctx.fillStyle = "black";
      ctx.arc(drawOb.x + (this.gun.rx * ap), drawOb.y + (this.gun.ry * ap), this.r/2.5 * ap, 0, Math.PI * 2);
      ctx.fillStyle = "#edd380";
      ctx.arc(drawOb.x + (this.gun.rx * ap), drawOb.y + (this.gun.ry * ap), this.r/2.5 * ap, 0, Math.PI);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.save();
      ctx.translate(drawOb.x, drawOb.y);
      ctx.rotate(-Math.PI / 2);
      ctx.translate(-drawOb.x, -drawOb.y);
      ctx.drawImage(weapons[this.gun.name], (drawOb.x + this.gun.x), (drawOb.y + this.gun.y), this.gun.w * ap, this.gun.h * ap);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(drawOb.x - (this.gun.lx * ap), drawOb.y + (this.gun.ly * ap), this.r/2.5 * ap, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(drawOb.x, drawOb.y, this.r * ap, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.drawImage(arm, (drawOb.x - this.r * pos[this.team].x), (drawOb.y - this.r * pos[this.team].y), pos[this.team].w * ap, pos[this.team].h * ap);
      ctx.font = "15px Arial";
      ctx.fillStyle = "black";
      ctx.fillText(this.name, drawOb.x - w / 2, drawOb.y - 30);
      if(this.id == sid) {
        roundRect(ctx, drawOb.x - this.hpWidth / 2, drawOb.y + this.r + this.r / 2, this.hpWidth, 10, {tl: 4, tr: 4, br: 4, bl: 4}, '#5ad900', 'black')
      } else {
        roundRect(ctx, drawOb.x - this.hpWidth / 2, drawOb.y + this.r + this.r / 2, this.hpWidth, 10, {tl: 4, tr: 4, br: 4, bl: 4}, '#db5e56', 'black')
      }
      ctx.restore();
    }
  }
}
