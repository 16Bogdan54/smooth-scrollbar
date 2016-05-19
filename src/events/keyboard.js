/**
 * @module
 * @prototype {Function} __keyboardHandler
 */

import { SmoothScrollbar } from '../smooth_scrollbar';

export { SmoothScrollbar };

/**
 * @method
 * @internal
 * Keypress event handler builder
 *
 * @param {Object} option
 */
let __keyboardHandler = function() {
    const { targets } = this;

    let getKeyDelta = (keyCode) => {
        // key maps [deltaX, deltaY, useSetMethod]
        let { size, offset, limit, movement } = this; // need real time data

        switch (keyCode) {
            case 32: // space
                return [0, 200];
            case 33: // pageUp
                return [0, -size.container.height + 40];
            case 34: // pageDown
                return [0, size.container.height - 40];
            case 35: // end
                return [0, Math.abs(movement.y) + limit.y - offset.y];
            case 36: // home
                return [0, -Math.abs(movement.y) - offset.y];
            case 37: // left
                return [-40, 0];
            case 38: // up
                return [0, -40];
            case 39: // right
                return [40, 0];
            case 40: // down
                return [0, 40];
            default:
                return null;
        }
    };

    const { container } = targets;

    let isFocused = false;

    this.__addEvent(container, 'focus', () => {
        isFocused = true;
    });

    this.__addEvent(container, 'blur', () => {
        isFocused = false;
    });

    this.__addEvent(container, 'keydown', (evt) => {
        if (!isFocused) return;

        const { options, parents, movementLocked } = this;

        const delta = getKeyDelta(evt.keyCode || evt.which);

        if (!delta) return;

        const [x, y] = delta;

        if (this.__shouldPropagateMovement(x, y)) {
            container.blur();

            if (parents.length) {
                parents[0].focus();
            }

            return this.__updateThrottle();
        }

        evt.preventDefault();

        this.__unlockMovement(); // handle for multi keypress
        if (x && this.__isOntoEdge('x', x)) movementLocked.x = true;
        if (y && this.__isOntoEdge('y', y)) movementLocked.y = true;

        const { speed } = options;
        this.__addMovement(x * speed, y * speed);
    });

    this.__addEvent(container, 'keyup', () => {
        this.__unlockMovement();
    });
};

Object.defineProperty(SmoothScrollbar.prototype, '__keyboardHandler', {
    value: __keyboardHandler,
    writable: true,
    configurable: true
});
