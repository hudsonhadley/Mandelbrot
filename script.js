const canvas = document.getElementById("fractalCanvas");
const ctx = canvas.getContext("2d");

const maxIter = 100;
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

function requestRender() {
    needsRender = true;
}

function mandelbrot(cx, cy) {
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

function render() {
    const width = canvas.width;
    const height = canvas.height;

    const image = ctx.createImageData(width, height);
    const data = image.data;

    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            const cx = view.xmin + (px / width) * (view.xmax - view.xmin);
            const cy = view.ymin + (py / height) * (view.ymax - view.ymin);

            const {iter, x, y } = mandelbrot(cx, cy);
            
            let smooth = 0;
            if (iter !== maxIter) {
                const mag = x*x + y*y;
                smooth = iter + 1 - Math.log(Math.log(mag)) / Math.log(2);
            }

            const t = smooth / maxIter;
            const brightness = Math.floor(255 * Math.sqrt(t));

            const i = (py * width + px) * 4;
            data[i] = brightness;
            data[i+1] = brightness;
            data[i+2] = brightness;
            data[i+3] = 255;
        }
    }

    ctx.putImageData(image, 0, 0);
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

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;

  lastX = e.clientX;
  lastY = e.clientY;

  const scaleX = (view.xmax - view.xmin) / canvas.width;
  const scaleY = (view.ymax - view.ymin) / canvas.height;

  view.xmin -= dx * scaleX;
  view.xmax -= dx * scaleX;

  view.ymin -= dy * scaleY;
  view.ymax -= dy * scaleY;

  requestRender();
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

function loop() {
  if (needsRender) {
    render();
    needsRender = false;
  }
  requestAnimationFrame(loop);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});

resizeCanvas();
requestRender();
loop();
