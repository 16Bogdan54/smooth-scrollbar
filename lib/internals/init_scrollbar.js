'use strict';

var _smooth_scrollbar = require('../smooth_scrollbar');

/**
 * @method
 * @internal
 * initialize scrollbar
 *
 * This method will attach several listeners to elements
 * and create a destroy method to remove listeners
 *
 * @param {Object} option: as is explained in constructor
 */
function __initScrollbar() {
  this.update(); // initialize thumb position

  this.__keyboardHandler();
  this.__resizeHandler();
  this.__selectHandler();
  this.__mouseHandler();
  this.__touchHandler();
  this.__wheelHandler();
  this.__dragHandler();

  this.__render();
} /**
   * @module
   * @prototype {Function} __initScrollbar
   */

;

Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__initScrollbar', {
  value: __initScrollbar,
  writable: true,
  configurable: true
});