const gulp = require("gulp");
const webpack = require("webpack-stream");
const nodemon = require("nodemon");
const prompt = require("prompt");
const HtmlWebpackPlugin = require('html-webpack-plugin');


function randomString(length, chars) {
    let result = '';
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

const schema = {
    properties: {
      type: {
        pattern: /^[a-zA-Z\s\-]+$/,
        message: 'The type must be only letters, spaces, or dashes',
        required: true
      }
    }
  };

function watchHtml() {
  gulp.watch("./src/client/*.html", wp);
}

function wp() {
  webpack(require("./webpack.config.js"))
  .pipe(gulp.dest("./devBuild/client/js"))
}

function pip() {
  return gulp.src("./devBuild/client/*.html")
    .pipe(gulp.dest("./devBuild/client/"))
}
function watchJs() {
  gulp.watch("./src/client/js/**", wp);
}

function devCss() {
  return gulp.src("./src/client/css/*")
    .pipe(gulp.dest("./devBuild/client/css"))
}

function watchCss() {
  gulp.watch("./src/client/css/*.css", devCss);
}

function img() {
  return gulp.src("./src/client/img/**")
    .pipe(gulp.dest("./devBuild/client/img"))
}


//Server stuff
function server() {
  gulp.src("./src/*.json")
    .pipe(gulp.dest("./devBuild/"))
  return gulp.src("./src/*.js")
  .pipe(gulp.dest("./devBuild/"))
}
function imgb() {
  return gulp.src("./src/client/img/**")
    .pipe(gulp.dest("./builds/developer/client/img"))
}
function watchServer() {
  gulp.watch("./src/*.js", gulp.parallel(server, nm));
}

function nm() {
  nodemon({
    script: './devBuild/server.js'
    , ext: 'js html'
    , env: { 'NODE_ENV': 'development' }
  })
}


//build functions
function js() {
  let wp = {
    entry: "./src/client/js/main.js",
    output: {
      path: __dirname + "./builds/developer/client/js",
      filename: "bundle.js"
    },
    module: {
      rules: [
      {
        test: /\.(js)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
      ]
    },
      mode: "development",
      plugins: [
          new HtmlWebpackPlugin({
              title: "Developer version" ,
              template: __dirname + "/src/client/index.html",
              filename: __dirname + './builds/developer/client/index.html'
          })
     ]
  };
  webpack(wp)
  .pipe(gulp.dest("./builds/developer/client/js"))
}
function csss(param) {
  return gulp.src("./src/client/css/**")
    .pipe(gulp.dest("./builds/developer/client/css"))
}
function serverdev() {
  return gulp.src("./src/*.js")
    .pipe(gulp.dest("./builds/developer/"))
  gulp.src("./src/*.json")
    .pipe(gulp.dest("./builds/developer/"));
}
function getEd() {
  return gulp.src("./devBuild/editor/**")
    .pipe(gulp.dest("./builds/developer/client/editor/"))
}
function build() {
  prompt.start();

  prompt.get(schema, (err, result) => {
    console.log("Performing a " + result.type + " build...");
    if(result.type == "developer") {
      let rString = randomString(4, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
      let pm = {vers:rString};
      js();
      csss();
      serverdev();
      gunEditor("builds/developer");
      getEd();
      imgb();

    }
  });
}

//editor build
function watchHtml() {
  gulp.watch("./src/editor/*.html", wp);
}

function assets() {
  return gulp.src("./src/editor/assets/**")
    .pipe(gulp.dest("./devBuild/editor/assets"))
}

function wp2() {
  webpack({
    entry: "./src/editor/js/main.js",
    output: {
      path: __dirname + "./devBuild/editor/js",
      filename: "bundle.js"
    },
    module: {
      rules: [
      {
        test: /\.(js)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
      ]
    },
      mode: "development",
      plugins: [
          new HtmlWebpackPlugin({
              title: "Developer version" ,
              template: __dirname + "/src/editor/index.html",
              filename: __dirname + './devBuild/editor/index.html'
          })
     ]
  })
  .pipe(gulp.dest("./devBuild/editor/js"))
}

function pip() {
  return gulp.src("./devBuild/editor/*.html")
    .pipe(gulp.dest("./devBuild/editor/"))
}

function watchJss() {
  gulp.watch("./src/editor/js/**", wp2);
}

function edevCss() {
  return gulp.src("./src/editor/css/*")
    .pipe(gulp.dest("./devBuild/editor/css"))
}

function ewatchCss() {
  gulp.watch("./src/editor/css/*.css", devCss);
}

function editorBuild() {
  wp2()
  watchHtml()
  watchJss()
  edevCss()
  ewatchCss()
  pip()
  assets();
}


//gun editor/veiwer build

function watchHtmlg() {
  gulp.watch("./src/gunEditor/client/*.html", wpg);
}

function wpg(type) {
  webpack({
    entry: "./src/gunEditor/client/js/main.js",
    output: {
      path: __dirname + "./"+type+"/gunEditor/client/js",
      filename: "bundle.js"
    },
    module: {
      rules: [
      {
        test: /\.(js)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
      ]
    },
      mode: "development",
      plugins: [
          new HtmlWebpackPlugin({
              title: "Developer version" ,
              template: __dirname + "/src/gunEditor/client/index.html",
              filename: __dirname + './'+type+'/gunEditor/client/index.html'
          })
     ]
  })
  .pipe(gulp.dest("./"+type+"/gunEditor/client/js"))
}

function pipg(type) {
  return gulp.src("./"+type+"/gunEditor/client/*.html")
    .pipe(gulp.dest("./"+type+"/gunEditor/client/"))
}

function watchJsg() {
  gulp.watch("./src/gunEditor/client/js/**", wpg);
}

function devCssg(type) {
  return gulp.src("./src/gunEditor/client/css/*")
    .pipe(gulp.dest("./"+type+"/gunEditor/client/css"))
}

function watchCssg() {
  gulp.watch("./src/gunEditor/client/css/*.css", devCssg);
}
function serverg(type) {
  return gulp.src("./src/gunEditor/*.js")
  .pipe(gulp.dest("./"+type+"/gunEditor/"))
}
function watchServerg() {
  gulp.watch("./src/gunEditor/*.js", gulp.parallel(server, nm));
}

function nmg() {
  nodemon({
    script: './devBuild/gunEditor/server.js'
    , ext: 'js html'
    , env: { 'NODE_ENV': 'development' }
  })
}
function gunEditor(type) {
  if(type == "developer") {
    wpg("developer")
    pipg("developer")
    devCssg("developer")
    serverg("developer");
  } else {
    watchHtmlg()
    wpg("devBuild")
    pipg("devBuild")
    watchJsg()
    devCssg("devBuild")
    watchCssg()
    serverg("devBuild")
    watchServerg()
    nmg()
  }

}
exports.default = gulp.parallel(server, wp, watchHtml, watchJs, devCss, watchCss,watchServer, pip, nm, img);
exports.build = build;
exports.ed = editorBuild;
exports.gun = gunEditor;
