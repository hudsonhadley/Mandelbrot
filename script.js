const canvas = document.getElementById("fractalCanvas");
const ctx = canvas.getContext("2d");

const renderCanvas = document.createElement("canvas");
const renderCtx = renderCanvas.getContext("2d");

const RENDER_SCALE = 3; // render 3x screen size

const INITIAL_VIEW_WIDTH = 3.5;

let needsRender = false;
let isDragging = false;
let lastX = 0;
let lastY = 0;

const view = {
    xmin: -2.5,
    xmax: 1,
    ymin: -1.2,
    ymax: 1.2
}

let camX = 0;
let camY = 0;

function requestRender() {
    needsRender = true;
}

function mandelbrot(cx, cy, maxIter) {
    let x = 0;
    let y = 0;
    let iter = 0;

    while (x*x + y*y <= 4 && iter < maxIter) {
        let xtemp = x*x - y*y + cx;
        y = 2*x*y + cy;
        x = xtemp;

        iter++;
    }

    return { iter, x, y };

}

function getMaxIterations() {
    const viewWidth = view.xmax - view.xmin;

    // how much we've zoomed in
    const zoom = INITIAL_VIEW_WIDTH / viewWidth;

    // tweak these numbers to taste
    const base = 50;
    const scale = 40;

    return Math.floor(base + scale * Math.log10(zoom));
}

function render() {
     const width = renderCanvas.width;
    const height = renderCanvas.height;

    // current visible fractal size
    const viewWidth  = view.xmax - view.xmin;
    const viewHeight = view.ymax - view.ymin;

    // BIG fractal region (matches big render buffer)
    const renderWidth  = viewWidth  * RENDER_SCALE;
    const renderHeight = viewHeight * RENDER_SCALE;

    const centerX = (view.xmin + view.xmax) / 2;
    const centerY = (view.ymin + view.ymax) / 2;

    const renderXmin = centerX - renderWidth / 2;
    const renderYmin = centerY - renderHeight / 2;

    const image = renderCtx.createImageData(width, height);
    const data = image.data;

    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {

            const cx = renderXmin + (px / width) * renderWidth;
            const cy = renderYmin + (py / height) * renderHeight;

            const maxIter = getMaxIterations();
            const {iter} = mandelbrot(cx, cy, maxIter);
            const brightness = iter === maxIter ? 0 : Math.floor(255 * iter / maxIter);

            const i = (py * width + px) * 4;
            data[i] = brightness;
            data[i+1] = brightness;
            data[i+2] = brightness;
            data[i+3] = 255;
        }
    }

    renderCtx.putImageData(image, 0, 0);
}

document.addEventListener("wheel", (e) => {
  e.preventDefault();

  const scale = Math.exp(-e.deltaY * 0.001);

  const mx = view.xmin + (e.offsetX / canvas.width) * (view.xmax - view.xmin);
  const my = view.ymin + (e.offsetY / canvas.height) * (view.ymax - view.ymin);

  const width = (view.xmax - view.xmin) * scale;
  const height = (view.ymax - view.ymin) * scale;

  view.xmin = mx - (mx - view.xmin) * scale;
  view.xmax = view.xmin + width;

  view.ymin = my - (my - view.ymin) * scale;
  view.ymax = view.ymin + height;

  requestRender();
});

document.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  camX -= e.movementX;
  camY -= e.movementY;
});

document.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;

  // where the camera SHOULD be when centered
  const centerCamX = (renderCanvas.width  - canvas.width)  / 2;
  const centerCamY = (renderCanvas.height - canvas.height) / 2;

  // how far user dragged inside the big render
  const offsetX = camX - centerCamX;
  const offsetY = camY - centerCamY;

  // convert pixels → fractal units
  const fractalWidth  = (view.xmax - view.xmin) * RENDER_SCALE;
  const fractalHeight = (view.ymax - view.ymin) * RENDER_SCALE;

  const scaleX = fractalWidth  / renderCanvas.width;
  const scaleY = fractalHeight / renderCanvas.height;

  // shift fractal to match what user already sees
  view.xmin += offsetX * scaleX;
  view.xmax += offsetX * scaleX;
  view.ymin += offsetY * scaleY;
  view.ymax += offsetY * scaleY;

  // recenter camera
  camX = centerCamX;
  camY = centerCamY;

  requestRender();
});

function loop() {
  if (needsRender) {
    render();          // heavy (only on zoom)
    needsRender = false;
  }

  drawView();          // cheap (every frame)
  requestAnimationFrame(loop);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // resize hidden render buffer bigger than screen
  renderCanvas.width  = canvas.width  * RENDER_SCALE;
  renderCanvas.height = canvas.height * RENDER_SCALE;

  // center camera inside the big render
  camX = (renderCanvas.width  - canvas.width)  / 2;
  camY = (renderCanvas.height - canvas.height) / 2;

  const canvasAspect = canvas.width / canvas.height;
  const viewWidth = view.xmax - view.xmin;
  const newHeight = viewWidth / canvasAspect;
  const centerY = (view.ymin + view.ymax) / 2;

  view.ymin = centerY - newHeight / 2;
  view.ymax = centerY + newHeight / 2;

  requestRender();
}

function drawView() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.drawImage(
    renderCanvas,
    camX, camY,                 // crop position
    canvas.width, canvas.height,// crop size
    0, 0,
    canvas.width, canvas.height
  );
}

window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});

resizeCanvas();
requestRender();
loop();
