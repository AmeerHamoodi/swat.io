const dat = require("dat.gui");

export function bulletDraw (x, y, ctx, mp, cam, ap, ang, loader, sx, sy, ga){
    ap = 1;
    let drawOb = cam.getDrawPos({x: x, y: y}, mp);
    let dx = Math.abs(Math.round(x - sx));
    let dy = Math.abs(Math.round(y - sy));
    let grad = ctx.createLinearGradient(Math.abs(x), Math.abs(y), dx, dy);
    grad.addColorStop(0, "rgba(179, 179, 179, 0.5)");
    grad.addColorStop(1, "rgba(179, 179, 179, 1)");
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(drawOb.x/2, drawOb.y/2);
    ctx.rotate(ang + Math.PI / 2);
    ctx.translate(-drawOb.x/2, -drawOb.y/2)
    ctx.beginPath();
    ctx.drawImage(loader["bullet"], drawOb.x, drawOb.y, 8 * ap, 8 *ap);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.strokeStyle = grad;
    ctx.globalAlpha = ga;
    ctx.lineWidth = 8;
    let dL = cam.getDrawPos({x: sx, y: sy}, mp);
    ctx.moveTo(dL.x + 4, dL.y + 8);
    ctx.lineTo(drawOb.x + 4, drawOb.y);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();

}
