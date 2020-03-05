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


//Server stuff
function server() {
  return gulp.src("./src/*.js")
  .pipe(gulp.dest("./devBuild/"))
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
              template: __dirname + "/src/client/index0.html",
              filename: __dirname + './builds/developer/client/index.html'
          })
     ]
  };
  webpack(wp)
  .pipe(gulp.dest("./builds/developer/client/js"))
}
function css(param) {
  return gulp.src("./src/client/css/**")
    .pipe(gulp.dest("./builds/developer/client/css"))
}
function serverdev() {
  return gulp.src("./src/*.js")
    .pipe(gulp.dest("./builds/developer/"))
}
function build() {
  prompt.start();

  prompt.get(schema, (err, result) => {
    console.log("Performing a " + result.type + " build...");
    if(result.type == "developer") {
      let rString = randomString(4, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
      let pm = {vers:rString};
      js();
      css();
      serverdev();
    }
  });
}


exports.default = gulp.parallel(server, wp, watchHtml, watchJs, devCss, watchCss,watchServer, pip, nm);
exports.build = build;
