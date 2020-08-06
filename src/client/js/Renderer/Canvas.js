export class Canvas {
  constructor(dom) {
    this.dom = typeof dom == "undefined" ? 1 : dom;
    this.c = document.createElement("canvas");
    this.ctx = this.c.getContext("2d");
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }
  _init_() {
    if(this.dom == 1) {
      document.body.insertBefore(this.c, document.body.firstChild);
    } else {
      this.dom.insertBefore(this.c, this.dom.firstChild);
    }
    this.c.width = this.width;
    this.c.height = this.height;
  }
}
