export class Console {
  serverData(content) {
    console.log("%c" + "[SERVER]: ", "color:" + "DodgerBlue", content);
  }
  error(content) {
    console.log("%c" + "[ERROR]: ", "color:" + "Red", content);
  }
  socket(content) {
    console.log("%c" + "[SOCKET]: ", "color:" + "Orange", content);
  }
  data(content) {
    console.log("%c" + "[File]: ", "color:" + "Green", content);
  }
}
