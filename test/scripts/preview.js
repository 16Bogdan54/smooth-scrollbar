import Scrollbar from '../../src/';
import { DEFAULT_OPTIONS } from '../../src/shared/';

const DPR = window.devicePixelRatio;
const options = Object.assign({}, DEFAULT_OPTIONS);

const size = {
    width: 250,
    height: 150
};

const canvas = document.getElementById('preview');
const scrollbar = Scrollbar.get(document.getElementById('content'));
const ctx = canvas.getContext('2d');

canvas.width = size.width * DPR;
canvas.height = size.height * DPR;
ctx.scale(DPR, DPR);

ctx.strokeStyle = '#94a6b7';
ctx.fillStyle = '#abc';

let shouldUpdate = true;

function render() {
    if (!shouldUpdate) {
        return requestAnimationFrame(render);
    }

    let dots = calcDots();

    ctx.clearRect(0, 0, size.width, size.height);
    ctx.save();
    ctx.transform(1, 0, 0, -1, 0, size.height);
    ctx.beginPath();
    ctx.moveTo(0, 0);

    let scaleX = (size.width / dots.length) * (options.speed / 20 + 0.5);
    dots.forEach(([x, y]) => {
        ctx.lineTo(x * scaleX, y);
    });

    ctx.stroke();

    let [x, y] = dots[dots.length - 1];
    ctx.lineTo(x * scaleX, y);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    shouldUpdate = false;

    requestAnimationFrame(render);
};

render();

function calcDots() {
    let {
        speed,
        fricton
    } = options;

    let dots = [];

    let x = 0;
    let y = (speed / 20 + 0.5) * size.height;

    while(y > 0.1) {
        dots.push([x, y]);

        y *= (1 - fricton / 100);
        x++;
    }

    return dots;
};

[...document.querySelectorAll('.options')].forEach((el) => {
    const prop = el.name;
    const label = document.querySelector(`.option-${prop}`);

    el.addEventListener('input', () => {
        label.textContent = options[prop] = parseFloat(el.value);
        scrollbar.setOptions(options);
        shouldUpdate = true;
    });
});

render();