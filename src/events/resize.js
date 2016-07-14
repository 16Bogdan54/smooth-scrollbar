/**
 * @module
 * @prototype {Function} __resizeHandler
 */

import { SmoothScrollbar } from '../smooth_scrollbar';

export { SmoothScrollbar };

/**
 * @method
 * @internal
 * Resize event handler builder
 */
function __resizeHandler() {
    this.__addEvent(window, 'resize', this.__updateThrottle);
};

Object.defineProperty(SmoothScrollbar.prototype, '__resizeHandler', {
    value: __resizeHandler,
    writable: true,
    configurable: true
});
