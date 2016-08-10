'use strict';

var _defineProperties = require('babel-runtime/core-js/object/define-properties');

var _defineProperties2 = _interopRequireDefault(_defineProperties);

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _defineProperty = require('babel-runtime/core-js/object/define-property');

var _defineProperty2 = _interopRequireDefault(_defineProperty);

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SmoothScrollbar = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; (0, _defineProperty2.default)(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              * @module
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              * @export {Class} SmoothScrollbar
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              */

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _shared = require('./shared/');

var _utils = require('./utils/');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @constructor
 * Create scrollbar instance
 *
 * @param {Element} container: target element
 * @param {Object} [options]: options
 */
var SmoothScrollbar = exports.SmoothScrollbar = function () {
    function SmoothScrollbar(container) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, SmoothScrollbar);

        // make container focusable
        container.setAttribute('tabindex', '1');

        // reset scroll position
        container.scrollTop = container.scrollLeft = 0;

        var canvas = (0, _utils.findChild)(container, 'overscroll-glow');
        var trackX = (0, _utils.findChild)(container, 'scrollbar-track-x');
        var trackY = (0, _utils.findChild)(container, 'scrollbar-track-y');

        (0, _utils.setStyle)(container, {
            overflow: 'hidden',
            outline: 'none'
        });

        (0, _utils.setStyle)(canvas, {
            display: 'none',
            'pointer-events': 'none'
        });

        // readonly properties
        this.__readonly('targets', (0, _freeze2.default)({
            container: container,
            content: (0, _utils.findChild)(container, 'scroll-content'),
            canvas: {
                elem: canvas,
                context: canvas.getContext('2d')
            },
            xAxis: (0, _freeze2.default)({
                track: trackX,
                thumb: (0, _utils.findChild)(trackX, 'scrollbar-thumb-x')
            }),
            yAxis: (0, _freeze2.default)({
                track: trackY,
                thumb: (0, _utils.findChild)(trackY, 'scrollbar-thumb-y')
            })
        })).__readonly('offset', {
            x: 0,
            y: 0
        }).__readonly('thumbOffset', {
            x: 0,
            y: 0
        }).__readonly('limit', {
            x: Infinity,
            y: Infinity
        }).__readonly('movement', {
            x: 0,
            y: 0
        }).__readonly('movementLocked', {
            x: false,
            y: false
        }).__readonly('overscrollRendered', {
            x: 0,
            y: 0
        }).__readonly('overscrollBack', false).__readonly('thumbSize', {
            x: 0,
            y: 0,
            realX: 0,
            realY: 0
        }).__readonly('bounding', {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }).__readonly('children', []).__readonly('parents', []).__readonly('size', this.getSize()).__readonly('isNestedScrollbar', false);

        // non-enmurable properties
        (0, _defineProperties2.default)(this, {
            __updateThrottle: {
                value: (0, _utils.debounce)(this.update.bind(this))
            },
            __hideTrackThrottle: {
                value: (0, _utils.debounce)(this.hideTrack.bind(this), 1000, false)
            },
            __listeners: {
                value: []
            },
            __handlers: {
                value: []
            },
            __children: {
                value: []
            },
            __timerID: {
                value: {}
            }
        });

        this.__initOptions(options);
        this.__initScrollbar();

        // storage
        _shared.sbList.set(container, this);
    }

    _createClass(SmoothScrollbar, [{
        key: 'MAX_OVERSCROLL',
        get: function get() {
            var options = this.options;
            var size = this.size;


            switch (options.overscrollEffect) {
                case 'bounce':
                    var average = (size.container.width + size.container.height) / 2;
                    var touchFactor = this.__isMovementLocked() ? 1 : 5;

                    return _shared.GLOBAL_ENV.TOUCH_SUPPORTED ? (0, _utils.pickInRange)(average / touchFactor, 100, 1000) : (0, _utils.pickInRange)(average / 10, 25, 50);

                case 'glow':
                    return 150;

                default:
                    return 0;
            }
        }
    }, {
        key: 'scrollTop',
        get: function get() {
            return this.offset.y;
        }
    }, {
        key: 'scrollLeft',
        get: function get() {
            return this.offset.x;
        }
    }]);

    return SmoothScrollbar;
}();