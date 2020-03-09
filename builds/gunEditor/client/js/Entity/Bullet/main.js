export function bulletDraw (x, y, ctx, mp, forX, forY, ap){
    ctx.globalAlpha = 1;
    ctx.fillStyle = "black";

    ctx.beginPath();
    ctx.arc((x - mp.x) + forX / 2, (y - mp.y) + forY / 2, 5 * ap, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
}
