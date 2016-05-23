import Scrollbar from '../../src/';

const options = {
    speed: 1,
    friction: 10,
    thumbMinSize: 20,
    renderByPixels: true,
    alwaysShowTracks: false,
    continuousScrolling: 'auto',
    overscrollEffect: navigator.userAgent.match(/Android/) ? 'glow' : 'bounce',
    overscrollEffectColor: '#87ceeb'
};

const optionLimit = {
    friction: {
        type: 'range',
        value: [0, 100]
    },
    speed: {
        type: 'range',
        value: [0, 10]
    },
    thumbMinSize: {
        type: 'range',
        value: [0, 100]
    },
    continuousScrolling: {
        type: 'select',
        value: ['auto', true, false]
    },
    overscrollEffect: {
        type: 'select',
        value: [false, 'bounce', 'glow']
    }
};

const boolMap = {
    true: true,
    false: false
};

const scrollbars = Scrollbar.initAll(options);
const controller = new dat.GUI();
controller.addFolder('Scrollbar Options');
document.getElementById('controller').appendChild(controller.domElement);

let updateScrollbar = () => scrollbars.forEach((s) => s.setOptions(options));

if (window.innerWidth < 600) controller.close();

Object.keys(options).forEach((prop) => {
    let ctrl;

    if (optionLimit.hasOwnProperty(prop)) {
        const limit = optionLimit[prop];

        if (limit.type === 'range') {
            ctrl = controller.add(options, prop, ...limit.value);
        }

        if (limit.type === 'select') {
            ctrl = controller.add(options, prop, limit.value);
        }
    } else {
        if (prop === 'overscrollEffectColor') {
            ctrl = controller.addColor(options, prop);
        } else {
            ctrl = controller.add(options, prop);
        }
    }

    ctrl.onChange((val) => {
        if (boolMap.hasOwnProperty(val)) {
            options[prop] = boolMap[val];
        }

        updateScrollbar();
    });
});

export { controller };