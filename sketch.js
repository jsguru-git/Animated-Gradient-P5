let seed;
let rns;
let colorinfo = [];

function random_hash() {
  let x = "0123456789abcdef", hash = '0x';
  for (let i = 64; i > 0; --i) {
    hash += x[Math.floor(Math.random() * x.length)];
  }

  return hash;
}

function genHash(userHash) {
  if (userHash == null) {
    tokenData = {
      hash: random_hash(),
    };
  } else {
    tokenData = {
      hash: userHash,
    };
  }

  let hash = tokenData.hash;

  seed = parseInt(tokenData.hash.slice(0, 16), 16);
  let p = [];
  for (let i = 0; i < 64; i += 2) {
    p.push(tokenData.hash.slice(i + 2, i + 4));
  }
  rns = p.map(x => { return parseInt(x, 16) % 10 });

  print("Hash: " + hash);
  // print("Seed: " + seed);
  prepareData();
}

var dim = Math.min(window.innerWidth, window.innerHeight - 250);

var spots;
var radius = [];
var m = [];
var x = [];
var y = [];
var c = [];
var mapL = 0;
var mapH = 9;
var S = 30;           // shader blur strength
var b = 1;

var vs = 'attribute vec3 aPosition; attribute vec2 aTexCoord; varying vec2 vTexCoord; void main() { vTexCoord = aTexCoord; vec4 positionVec4 = vec4(aPosition, 1.0); positionVec4.xy = positionVec4.xy * 2.0 - 1.0; gl_Position = positionVec4; }';

var fs = 'precision mediump float; varying vec2 vTexCoord; uniform vec2 Res; uniform sampler2D iP; uniform float size; const float Pi = 6.28318530718; const float dir = 16.0; const float q = 8.0; void main() { vec2 r = size/Res; vec4 tx = texture2D(iP, vTexCoord); for(float d = 0.0; d < Pi; d += Pi/dir) { for(float i=1.0/q; i<=1.0; i+=1.0/q) { tx += texture2D(iP, vTexCoord + vec2(cos(d),sin(d)) * r * i); } } tx /= q * dir + float(size/50.0); gl_FragColor = tx; }';

function prepareData() {
  noiseSeed(seed);
  mainColorH = map(rns[11], mapL, mapH, 0, 360);
  mainColorS = map(rns[12], mapL, mapH, 40, 90);
  mainColorB = map(rns[13], mapL, mapH, 90, 100);

  spots = 5;
  for (i = 0; i < spots; i++) {
    radius[i] = map(rnd_dec(), 0, 1, dim / 6, dim);
    m[i] = map(rnd_dec(), 0, 1, 0, 10);
    x[i] = map(rnd_dec(), 0, 1, -dim / 2, dim / 2);
    y[i] = map(rnd_dec(), 0, 1, -dim / 2, dim / 2);
  }
  centerRadius = map(rns[16], mapL, mapH, dim / 4, dim / 2);
}

function setup() {
  genHash();

  canvas = createCanvas(dim, dim, WEBGL);
  canvas.background(0)
  canvas.id('p5canvas');
  canvas.parent('sketch-holder');
  iC = createGraphics(dim, dim, WEBGL);
  iC.pixelDensity(0.2);
  sC = createGraphics(dim, dim, WEBGL); // shader Canvas
  sC.pixelDensity(0.2);
  sC2 = createGraphics(dim, dim, WEBGL); // shader Canvas pass2
  sC2.pixelDensity(0.2);

  blur = sC.createShader(vs, fs); // <-- add shader to p5.Graphics!!!
  sC.shader(blur);
  blur2 = sC2.createShader(vs, fs); // <-- add shader to p5.Graphics!!!
  sC2.shader(blur2);

  noStroke();
  iC.noStroke();
  colorMode(HSB);
  iC.colorMode(HSB);

  prepareData();
}

// Get colors from the color pickers
function getColors() {
  return [
    document.getElementById("color1").value,
    document.getElementById("color2").value,
    document.getElementById("color3").value,
    document.getElementById("color4").value,
    document.getElementById("color5").value,
    document.getElementById("color6").value,
  ]
}

function draw() {
  const colors = getColors();
  iC.background(colors[5]);
  for (i = 0; i < spots; i++) {
    // Set the color used to fill shapes
    iC.fill(colors[i])
    XYnoise = map(noise(m[i]), 0, 1, -dim / 10, dim / 10);
    iC.ellipse(x[i] + XYnoise, y[i] + XYnoise, radius[i], radius[i], 60);
    m[i] += map(rnd_dec(), 0, 1, 0.0, 0.01);
  }

  S = map(noise(b), 0, 1, dim / 9, dim / 3.6);    // blur strength
  // blur pass 1
  blur.setUniform('iP', iC);
  blur.setUniform('Res', [dim, dim]);
  blur.setUniform('size', S / 2);
  sC.rect(-dim / 2, -dim / 2, dim / 2, dim / 2);

  // blur pass 2 
  blur2.setUniform('iP', sC);
  blur2.setUniform('Res', [dim, dim]);
  blur2.setUniform('size', S);
  sC2.rect(-dim / 2, -dim / 2, dim / 2, dim / 2);

  image(sC2, -dim / 2, -dim / 2, dim, dim);

  b += 0.04;
}

function rnd_dec() {
  seed ^= seed << 13;
  seed ^= seed >> 17;
  seed ^= seed << 5;
  return ((seed < 0 ? ~seed + 1 : seed) % 1000) / 1000;
}