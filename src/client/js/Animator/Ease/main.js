export class Easel {
  constructor() {
    this.const = 0.1;
  }
  easeTo(point, target) {
    let dx = target.x - point.x;
    let dy = target.y - point.y;
    let vx = dx * this.const;
    let vy = dy * this.const;
    return {x: vx, y: vy};
  }
}
