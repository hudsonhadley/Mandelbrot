const canvas = document.getElementById("fractalCanvas");
const ctx = canvas.getContext("2d");

const maxIter = 100;
let needsRender = false;

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

    return iter;

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

            const iter = mandelbrot(cx, cy);

            const color = iter === maxIter ? 0 : iter * 10;

            const i = (py * width + px) * 4;

            data[i] = color;
            data[i+1] = color;
            data[i+2] = color;
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

document.addEventListener("keydown", (e) => {
    console.log(e.key);
    const step = 0.05 * (view.xmax - view.xmin);

    switch (e.key) {
        case "ArrowLeft":
        view.xmin -= step;
        view.xmax -= step;
        break;

        case "ArrowRight":
        view.xmin += step;
        view.xmax += step;
        break;

        case "ArrowUp":
        view.ymin -= step;
        view.ymax -= step;
        break;

        case "ArrowDown":
        view.ymin += step;
        view.ymax += step;
        break;
    }

    requestRender();
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

document.addEventListener("resize", () => {
  resizeCanvas();
  render();
});

resizeCanvas();
requestRender();
loop();
