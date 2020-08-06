import { Easel } from "./Ease/main.js"

export class Animator {
  constructor() {
    this.easeHelper = new Easel();
  }
  easeTo(point, target) {
    return this.easeHelper.easeTo(point, target);
  }
}
