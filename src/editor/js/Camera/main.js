export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.up = false;
    this.down = false;
    this.right = false;
    this.left = false;
    this.spdX = 0;
    this.spdY = 0;
  }
  move() {
    document.addEventListener("keydown", (event) => {
      if(event.keyCode == 87) {
        this.up = true;
      }
      if(event.keyCode == 83) {
        this.down = true;
      }
      if(event.keyCode == 68) {
        this.right = true;
      }
      if(event.keyCode == 65) {
        this.left = true;
      }
    }), document.addEventListener("keyup", (event) => {
      if(event.keyCode == 87) {
        this.up = false;
      }
      if(event.keyCode == 83) {
        this.down = false;
      }
      if(event.keyCode == 68) {
        this.right = false;
      }
      if(event.keyCode == 65) {
        this.left = false;
      }
    })
  }
  keys() {
    if(this.up) {
      this.spdY = -5
    } else if(this.down) {
      this.spdY = 5;
    } else {
      this.spdY = 0;
    }

    if(this.left) {
      this.spdX = -5
    } else if(this.right) {
      this.spdX = 5;
    } else {
      this.spdX = 0;
    }
  }
  update() {
    this.keys();
    this.x += this.spdX;
    this.y += this.spdY;
  }
}
