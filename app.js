/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(1);
	
	__webpack_require__(139);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _Object$keys = __webpack_require__(2)['default'];
	
	var _interopRequireDefault = __webpack_require__(14)['default'];
	
	var _src = __webpack_require__(15);
	
	var _src2 = _interopRequireDefault(_src);
	
	var DPR = window.devicePixelRatio;
	var TIME_RANGE_MAX = 20 * 1e3;
	
	var content = document.getElementById('content');
	var thumb = document.getElementById('thumb');
	var track = document.getElementById('track');
	var canvas = document.getElementById('chart');
	var ctx = canvas.getContext('2d');
	
	var div = document.createElement('div');
	div.innerHTML = Array(101).join('<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Expedita eaque debitis, dolorem doloribus, voluptatibus minima illo est, atque aliquid ipsum necessitatibus cumque veritatis beatae, ratione repudiandae quos! Omnis hic, animi.</p>');
	
	content.appendChild(div);
	
	_src2['default'].initAll();
	
	var scrollbar = _src2['default'].get(content);
	
	var chartType = 'offset';
	
	var thumbWidth = 0;
	var endOffset = 0;
	
	var timeRange = 5 * 1e3;
	
	var records = [];
	var size = {
	    width: 300,
	    height: 200
	};
	
	var shouldUpdate = true;
	
	var tangentPoint = null;
	var tangentPointPre = null;
	
	var hoverLocked = false;
	var hoverPointerX = undefined;
	var pointerDownOnTrack = undefined;
	var hoverPrecision = 'ontouchstart' in document ? 5 : 1;
	
	canvas.width = size.width * DPR;
	canvas.height = size.height * DPR;
	ctx.scale(DPR, DPR);
	
	function addEvent(elems, evts, handler) {
	    evts.split(/\s+/).forEach(function (name) {
	        [].concat(elems).forEach(function (el) {
	            el.addEventListener(name, function () {
	                handler.apply(this, [].slice.call(arguments));
	                shouldUpdate = true;
	            });
	        });
	    });
	};
	
	function sliceRecord() {
	    var endIdx = Math.floor(records.length * (1 - endOffset));
	    var last = records[records.length - 1];
	    var dropIdx = 0;
	
	    var result = records.filter(function (pt, idx) {
	        if (last.time - pt.time > TIME_RANGE_MAX) {
	            dropIdx++;
	            endIdx--;
	            return;
	        }
	
	        var end = records[endIdx - 1];
	
	        return end.time - pt.time <= timeRange && idx <= endIdx;
	    });
	
	    records.splice(0, dropIdx);
	    thumbWidth = result.length ? result.length / records.length : 1;
	
	    thumb.style.width = thumbWidth * 100 + '%';
	    thumb.style.right = endOffset * 100 + '%';
	
	    return result;
	};
	
	function getLimit(points) {
	    return points.reduce(function (pre, cur) {
	        var val = cur[chartType];
	        return {
	            max: Math.max(pre.max, val),
	            min: Math.min(pre.min, val)
	        };
	    }, { max: -Infinity, min: Infinity });
	};
	
	function assignProps(props) {
	    if (!props) return;
	
	    _Object$keys(props).forEach(function (name) {
	        ctx[name] = props[name];
	    });
	};
	
	function drawLine(p0, p1, options) {
	    var x0 = p0[0],
	        y0 = p0[1],
	        x1 = p1[0],
	        y1 = p1[1];
	
	    assignProps(options.props);
	
	    ctx.save();
	    ctx.transform(1, 0, 0, -1, 0, size.height);
	    ctx.beginPath();
	    ctx.setLineDash(options.dashed ? options.dashed : []);
	    ctx.moveTo(x0, y0);
	    ctx.lineTo(x1, y1);
	    ctx.stroke();
	    ctx.closePath();
	    ctx.restore();
	};
	
	function adjustText(content, p, options) {
	    var x = p[0],
	        y = p[1];
	
	    var width = ctx.measureText(content).width;
	
	    if (x + width > size.width) {
	        ctx.textAlign = 'right';
	    } else if (x - width < 0) {
	        ctx.textAlign = 'left';
	    } else {
	        ctx.textAlign = options.textAlign;
	    }
	
	    ctx.fillText(content, x, -y);
	};
	
	function fillText(content, p, options) {
	    assignProps(options.props);
	
	    ctx.save();
	    ctx.transform(1, 0, 0, 1, 0, size.height);
	    adjustText(content, p, options);
	    ctx.restore();
	};
	
	function drawMain() {
	    var points = sliceRecord();
	    if (!points.length) return;
	
	    var limit = getLimit(points);
	
	    var start = points[0];
	    var end = points[points.length - 1];
	
	    var totalX = thumbWidth === 1 ? timeRange : end.time - start.time;
	    var totalY = limit.max - limit.min || 1;
	
	    var grd = ctx.createLinearGradient(0, size.height, 0, 0);
	    grd.addColorStop(0, 'rgb(170, 215, 255)');
	    grd.addColorStop(1, 'rgba(170, 215, 255, 0.2)');
	
	    ctx.save();
	    ctx.transform(1, 0, 0, -1, 0, size.height);
	
	    ctx.lineWidth = 1;
	    ctx.fillStyle = grd;
	    ctx.strokeStyle = 'rgb(64, 165, 255)';
	    ctx.beginPath();
	    ctx.moveTo(0, 0);
	
	    var lastPoint = points.reduce(function (pre, cur, idx) {
	        var time = cur.time,
	            value = cur[chartType];
	        var x = (time - start.time) / totalX * size.width,
	            y = (value - limit.min) / totalY * (size.height - 20);
	
	        ctx.lineTo(x, y);
	
	        if (hoverPointerX && Math.abs(hoverPointerX - x) < hoverPrecision) {
	            tangentPoint = {
	                coord: [x, y],
	                point: cur
	            };
	
	            tangentPointPre = {
	                coord: pre,
	                point: points[idx - 1]
	            };
	        }
	
	        return [x, y];
	    }, []);
	
	    ctx.stroke();
	    ctx.lineTo(lastPoint[0], 0);
	    ctx.fill();
	    ctx.closePath();
	    ctx.restore();
	
	    drawLine([0, lastPoint[1]], lastPoint, {
	        props: {
	            strokeStyle: '#f60'
	        }
	    });
	
	    fillText('↙' + limit.min.toFixed(2), [0, 0], {
	        props: {
	            fillStyle: '#000',
	            textAlign: 'left',
	            textBaseline: 'bottom',
	            font: '12px sans-serif'
	        }
	    });
	    fillText(end[chartType].toFixed(2), lastPoint, {
	        props: {
	            fillStyle: '#f60',
	            textAlign: 'right',
	            textBaseline: 'bottom',
	            font: '16px sans-serif'
	        }
	    });
	};
	
	function drawTangentLine() {
	    var coord = tangentPoint.coord,
	        coordPre = tangentPointPre.coord;
	
	    var k = (coord[1] - coordPre[1]) / (coord[0] - coordPre[0]) || 0;
	    var b = coord[1] - k * coord[0];
	
	    drawLine([0, b], [size.width, k * size.width + b], {
	        props: {
	            lineWidth: 1,
	            strokeStyle: '#f00'
	        }
	    });
	
	    fillText('k: ' + k.toFixed(2), [size.width / 2, 0], {
	        props: {
	            fillStyle: '#f00',
	            textAlign: 'center',
	            textBaseline: 'bottom',
	            font: 'bold 12px sans-serif'
	        }
	    });
	};
	
	function drawHover() {
	    if (!tangentPoint) return;
	
	    drawTangentLine();
	
	    var coord = tangentPoint.coord,
	        point = tangentPoint.point;
	
	    var coordStyle = {
	        dashed: [8, 4],
	        props: {
	            lineWidth: 1,
	            strokeStyle: 'rgb(64, 165, 255)'
	        }
	    };
	
	    drawLine([0, coord[1]], [size.width, coord[1]], coordStyle);
	    drawLine([coord[0], 0], [coord[0], size.height], coordStyle);
	
	    var date = new Date(point.time + point.reduce);
	
	    var pointInfo = ['(', date.getMinutes(), ':', date.getSeconds(), '.', date.getMilliseconds(), ', ', point[chartType].toFixed(2), ')'].join('');
	
	    fillText(pointInfo, coord, {
	        props: {
	            fillStyle: '#000',
	            textAlign: 'left',
	            textBaseline: 'bottom',
	            font: 'bold 12px sans-serif'
	        }
	    });
	};
	
	function render() {
	    if (!shouldUpdate) return requestAnimationFrame(render);
	
	    ctx.save();
	    ctx.clearRect(0, 0, size.width, size.height);
	
	    fillText(chartType.toUpperCase(), [0, size.height], {
	        props: {
	            fillStyle: '#f00',
	            textAlign: 'left',
	            textBaseline: 'top',
	            font: 'bold 14px sans-serif'
	        }
	    });
	
	    drawMain();
	    drawHover();
	
	    if (hoverLocked) {
	        fillText('LOCKED', [size.width, size.height], {
	            props: {
	                fillStyle: '#f00',
	                textAlign: 'right',
	                textBaseline: 'top',
	                font: 'bold 14px sans-serif'
	            }
	        });
	    }
	
	    ctx.restore();
	
	    shouldUpdate = false;
	
	    requestAnimationFrame(render);
	};
	
	requestAnimationFrame(render);
	
	var lastTime = Date.now(),
	    lastOffset = 0,
	    reduceAmount = 0;
	
	scrollbar.addListener(function () {
	    var current = Date.now(),
	        offset = scrollbar.offset.y,
	        duration = current - lastTime,
	        velocity = (offset - lastOffset) / duration;
	
	    if (!duration || offset === lastOffset) return;
	
	    if (duration > 50) {
	        reduceAmount += duration - 1;
	    }
	
	    lastTime = current;
	    lastOffset = offset;
	
	    records.push({
	        time: current - reduceAmount,
	        reduce: reduceAmount,
	        offset: offset,
	        speed: Math.abs(velocity)
	    });
	
	    shouldUpdate = true;
	});
	
	function getPointer(e) {
	    return e.touches ? e.touches[e.touches.length - 1] : e;
	};
	
	// range
	var input = document.getElementById('duration');
	var label = document.getElementById('duration-value');
	input.max = TIME_RANGE_MAX / 1e3;
	input.min = 1;
	input.value = timeRange / 1e3;
	label.textContent = input.value + 's';
	
	addEvent(input, 'input', function (e) {
	    var start = records[0];
	    var end = records[records.length - 1];
	    var val = parseFloat(e.target.value);
	    label.textContent = val + 's';
	    timeRange = val * 1e3;
	    endOffset = Math.min(endOffset, Math.max(0, 1 - timeRange / (end.time - start.time)));
	});
	
	addEvent(document.getElementById('reset'), 'click', function () {
	    records.length = endOffset = reduceAmount = 0;
	    hoverLocked = false;
	    hoverPointerX = undefined;
	    tangentPoint = null;
	    tangentPointPre = null;
	    sliceRecord();
	});
	
	// hover
	addEvent(canvas, 'mousemove touchmove', function (e) {
	    if (hoverLocked || pointerDownOnTrack) return;
	
	    var pointer = getPointer(e);
	
	    hoverPointerX = pointer.clientX - canvas.getBoundingClientRect().left;
	});
	
	function resetHover() {
	    hoverPointerX = 0;
	    tangentPoint = null;
	    tangentPointPre = null;
	};
	
	addEvent([canvas, window], 'mouseleave touchend', function () {
	    if (hoverLocked) return;
	    resetHover();
	});
	
	addEvent(canvas, 'click', function () {
	    hoverLocked = !hoverLocked;
	
	    if (!hoverLocked) resetHover();
	});
	
	// track
	addEvent(thumb, 'mousedown touchstart', function (e) {
	    var pointer = getPointer(e);
	    pointerDownOnTrack = pointer.clientX;
	});
	
	addEvent(window, 'mousemove touchmove', function (e) {
	    if (!pointerDownOnTrack) return;
	
	    var pointer = getPointer(e);
	    var moved = (pointer.clientX - pointerDownOnTrack) / size.width;
	
	    pointerDownOnTrack = pointer.clientX;
	    endOffset = Math.min(1 - thumbWidth, Math.max(0, endOffset - moved));
	});
	
	addEvent(window, 'mouseup touchend blur', function (e) {
	    pointerDownOnTrack = undefined;
	});
	
	addEvent(thumb, 'click touchstart', function (e) {
	    e.stopPropagation();
	});
	
	addEvent(track, 'click touchstart', function (e) {
	    var pointer = getPointer(e);
	    var rect = track.getBoundingClientRect();
	    var offset = (pointer.clientX - rect.left) / rect.width;
	    endOffset = Math.min(1 - thumbWidth, Math.max(0, 1 - (offset + thumbWidth / 2)));
	});
	
	// switch chart
	addEvent([].slice.call(document.querySelectorAll('.chart-type')), 'change', function () {
	    if (this.checked) {
	        chartType = this.value;
	    }
	});

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(3), __esModule: true };

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(4);
	module.exports = __webpack_require__(10).Object.keys;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 Object.keys(O)
	var toObject = __webpack_require__(5);
	
	__webpack_require__(7)('keys', function($keys){
	  return function keys(it){
	    return $keys(toObject(it));
	  };
	});

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(6);
	module.exports = function(it){
	  return Object(defined(it));
	};

/***/ },
/* 6 */
/***/ function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	// most Object methods by ES6 should accept primitives
	var $export = __webpack_require__(8)
	  , core    = __webpack_require__(10)
	  , fails   = __webpack_require__(13);
	module.exports = function(KEY, exec){
	  var fn  = (core.Object || {})[KEY] || Object[KEY]
	    , exp = {};
	  exp[KEY] = exec(fn);
	  $export($export.S + $export.F * fails(function(){ fn(1); }), 'Object', exp);
	};

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(9)
	  , core      = __webpack_require__(10)
	  , ctx       = __webpack_require__(11)
	  , PROTOTYPE = 'prototype';
	
	var $export = function(type, name, source){
	  var IS_FORCED = type & $export.F
	    , IS_GLOBAL = type & $export.G
	    , IS_STATIC = type & $export.S
	    , IS_PROTO  = type & $export.P
	    , IS_BIND   = type & $export.B
	    , IS_WRAP   = type & $export.W
	    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
	    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
	    , key, own, out;
	  if(IS_GLOBAL)source = name;
	  for(key in source){
	    // contains in native
	    own = !IS_FORCED && target && key in target;
	    if(own && key in exports)continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
	    // bind timers to global for call from export context
	    : IS_BIND && own ? ctx(out, global)
	    // wrap global constructors for prevent change them in library
	    : IS_WRAP && target[key] == out ? (function(C){
	      var F = function(param){
	        return this instanceof C ? new C(param) : C(param);
	      };
	      F[PROTOTYPE] = C[PROTOTYPE];
	      return F;
	    // make static versions for prototype methods
	    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
	    if(IS_PROTO)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
	  }
	};
	// type bitmap
	$export.F = 1;  // forced
	$export.G = 2;  // global
	$export.S = 4;  // static
	$export.P = 8;  // proto
	$export.B = 16; // bind
	$export.W = 32; // wrap
	module.exports = $export;

/***/ },
/* 9 */
/***/ function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
	if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ },
/* 10 */
/***/ function(module, exports) {

	var core = module.exports = {version: '1.2.6'};
	if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(12);
	module.exports = function(fn, that, length){
	  aFunction(fn);
	  if(that === undefined)return fn;
	  switch(length){
	    case 1: return function(a){
	      return fn.call(that, a);
	    };
	    case 2: return function(a, b){
	      return fn.call(that, a, b);
	    };
	    case 3: return function(a, b, c){
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function(/* ...args */){
	    return fn.apply(that, arguments);
	  };
	};

/***/ },
/* 12 */
/***/ function(module, exports) {

	module.exports = function(it){
	  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 13 */
/***/ function(module, exports) {

	module.exports = function(exec){
	  try {
	    return !!exec();
	  } catch(e){
	    return true;
	  }
	};

/***/ },
/* 14 */
/***/ function(module, exports) {

	"use strict";
	
	exports["default"] = function (obj) {
	  return obj && obj.__esModule ? obj : {
	    "default": obj
	  };
	};
	
	exports.__esModule = true;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _toConsumableArray = __webpack_require__(16)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	var _shared = __webpack_require__(102);
	
	__webpack_require__(104);
	
	__webpack_require__(116);
	
	__webpack_require__(128);
	
	exports['default'] = _smooth_scrollbar.SmoothScrollbar;
	
	_smooth_scrollbar.SmoothScrollbar.version = '4.0.1';
	
	/**
	 * init scrollbar on given element
	 *
	 * @param {Element} elem: target element
	 * @param {Object} options: scrollbar options
	 *
	 * @return {Scrollbar} scrollbar instance
	 */
	_smooth_scrollbar.SmoothScrollbar.init = function (elem, options) {
	    if (!elem || elem.nodeType !== 1) {
	        throw new TypeError('expect element to be DOM Element, but got ' + typeof elem);
	    }
	
	    if (_shared.sbList.has(elem)) return _shared.sbList.get(elem);
	
	    elem.setAttribute('data-scrollbar', '');
	
	    var children = [].concat(_toConsumableArray(elem.children));
	
	    var div = document.createElement('div');
	
	    div.innerHTML = '\n        <article class="scroll-content"></article>\n        <aside class="scrollbar-track scrollbar-track-x">\n            <div class="scrollbar-thumb scrollbar-thumb-x"></div>\n        </aside>\n        <aside class="scrollbar-track scrollbar-track-y">\n            <div class="scrollbar-thumb scrollbar-thumb-y"></div>\n        </aside>\n    ';
	
	    var scrollContent = div.querySelector('.scroll-content');
	
	    [].concat(_toConsumableArray(div.children)).forEach(function (el) {
	        return elem.appendChild(el);
	    });
	
	    children.forEach(function (el) {
	        return scrollContent.appendChild(el);
	    });
	
	    return new _smooth_scrollbar.SmoothScrollbar(elem, options);
	};
	
	/**
	 * init scrollbars on pre-defined selectors
	 *
	 * @param {Object} options: scrollbar options
	 *
	 * @return {Array} a collection of scrollbar instances
	 */
	_smooth_scrollbar.SmoothScrollbar.initAll = function (options) {
	    return [].concat(_toConsumableArray(document.querySelectorAll(_shared.selectors))).map(function (el) {
	        return _smooth_scrollbar.SmoothScrollbar.init(el, options);
	    });
	};
	
	/**
	 * check if scrollbar exists on given element
	 *
	 * @return {Boolean}
	 */
	_smooth_scrollbar.SmoothScrollbar.has = function (elem) {
	    return _shared.sbList.has(elem);
	};
	
	/**
	 * get scrollbar instance through given element
	 *
	 * @param {Element} elem: target scrollbar container
	 *
	 * @return {Scrollbar}
	 */
	_smooth_scrollbar.SmoothScrollbar.get = function (elem) {
	    return _shared.sbList.get(elem);
	};
	
	/**
	 * get all scrollbar instances
	 *
	 * @return {Array} a collection of scrollbars
	 */
	_smooth_scrollbar.SmoothScrollbar.getAll = function () {
	    return [].concat(_toConsumableArray(_shared.sbList.values()));
	};
	
	/**
	 * destroy scrollbar on given element
	 *
	 * @param {Element} elem: target scrollbar container
	 */
	_smooth_scrollbar.SmoothScrollbar.destroy = function (elem) {
	    return _smooth_scrollbar.SmoothScrollbar.has(elem) && _smooth_scrollbar.SmoothScrollbar.get(elem).destroy();
	};
	
	/**
	 * destroy all scrollbars in scrollbar instances
	 */
	_smooth_scrollbar.SmoothScrollbar.destroyAll = function () {
	    _shared.sbList.forEach(function (sb) {
	        sb.destroy();
	    });
	};
	module.exports = exports['default'];

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _Array$from = __webpack_require__(17)["default"];
	
	exports["default"] = function (arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];
	
	    return arr2;
	  } else {
	    return _Array$from(arr);
	  }
	};
	
	exports.__esModule = true;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(18), __esModule: true };

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(19);
	__webpack_require__(36);
	module.exports = __webpack_require__(10).Array.from;

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $at  = __webpack_require__(20)(true);
	
	// 21.1.3.27 String.prototype[@@iterator]()
	__webpack_require__(22)(String, 'String', function(iterated){
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , index = this._i
	    , point;
	  if(index >= O.length)return {value: undefined, done: true};
	  point = $at(O, index);
	  this._i += point.length;
	  return {value: point, done: false};
	});

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(21)
	  , defined   = __webpack_require__(6);
	// true  -> String#at
	// false -> String#codePointAt
	module.exports = function(TO_STRING){
	  return function(that, pos){
	    var s = String(defined(that))
	      , i = toInteger(pos)
	      , l = s.length
	      , a, b;
	    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	      ? TO_STRING ? s.charAt(i) : a
	      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

/***/ },
/* 21 */
/***/ function(module, exports) {

	// 7.1.4 ToInteger
	var ceil  = Math.ceil
	  , floor = Math.floor;
	module.exports = function(it){
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY        = __webpack_require__(23)
	  , $export        = __webpack_require__(8)
	  , redefine       = __webpack_require__(24)
	  , hide           = __webpack_require__(25)
	  , has            = __webpack_require__(29)
	  , Iterators      = __webpack_require__(30)
	  , $iterCreate    = __webpack_require__(31)
	  , setToStringTag = __webpack_require__(32)
	  , getProto       = __webpack_require__(26).getProto
	  , ITERATOR       = __webpack_require__(33)('iterator')
	  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
	  , FF_ITERATOR    = '@@iterator'
	  , KEYS           = 'keys'
	  , VALUES         = 'values';
	
	var returnThis = function(){ return this; };
	
	module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
	  $iterCreate(Constructor, NAME, next);
	  var getMethod = function(kind){
	    if(!BUGGY && kind in proto)return proto[kind];
	    switch(kind){
	      case KEYS: return function keys(){ return new Constructor(this, kind); };
	      case VALUES: return function values(){ return new Constructor(this, kind); };
	    } return function entries(){ return new Constructor(this, kind); };
	  };
	  var TAG        = NAME + ' Iterator'
	    , DEF_VALUES = DEFAULT == VALUES
	    , VALUES_BUG = false
	    , proto      = Base.prototype
	    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
	    , $default   = $native || getMethod(DEFAULT)
	    , methods, key;
	  // Fix native
	  if($native){
	    var IteratorPrototype = getProto($default.call(new Base));
	    // Set @@toStringTag to native iterators
	    setToStringTag(IteratorPrototype, TAG, true);
	    // FF fix
	    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
	    // fix Array#{values, @@iterator}.name in V8 / FF
	    if(DEF_VALUES && $native.name !== VALUES){
	      VALUES_BUG = true;
	      $default = function values(){ return $native.call(this); };
	    }
	  }
	  // Define iterator
	  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
	    hide(proto, ITERATOR, $default);
	  }
	  // Plug for library
	  Iterators[NAME] = $default;
	  Iterators[TAG]  = returnThis;
	  if(DEFAULT){
	    methods = {
	      values:  DEF_VALUES  ? $default : getMethod(VALUES),
	      keys:    IS_SET      ? $default : getMethod(KEYS),
	      entries: !DEF_VALUES ? $default : getMethod('entries')
	    };
	    if(FORCED)for(key in methods){
	      if(!(key in proto))redefine(proto, key, methods[key]);
	    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
	  }
	  return methods;
	};

/***/ },
/* 23 */
/***/ function(module, exports) {

	module.exports = true;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(25);

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var $          = __webpack_require__(26)
	  , createDesc = __webpack_require__(27);
	module.exports = __webpack_require__(28) ? function(object, key, value){
	  return $.setDesc(object, key, createDesc(1, value));
	} : function(object, key, value){
	  object[key] = value;
	  return object;
	};

/***/ },
/* 26 */
/***/ function(module, exports) {

	var $Object = Object;
	module.exports = {
	  create:     $Object.create,
	  getProto:   $Object.getPrototypeOf,
	  isEnum:     {}.propertyIsEnumerable,
	  getDesc:    $Object.getOwnPropertyDescriptor,
	  setDesc:    $Object.defineProperty,
	  setDescs:   $Object.defineProperties,
	  getKeys:    $Object.keys,
	  getNames:   $Object.getOwnPropertyNames,
	  getSymbols: $Object.getOwnPropertySymbols,
	  each:       [].forEach
	};

/***/ },
/* 27 */
/***/ function(module, exports) {

	module.exports = function(bitmap, value){
	  return {
	    enumerable  : !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable    : !(bitmap & 4),
	    value       : value
	  };
	};

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(13)(function(){
	  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 29 */
/***/ function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function(it, key){
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 30 */
/***/ function(module, exports) {

	module.exports = {};

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $              = __webpack_require__(26)
	  , descriptor     = __webpack_require__(27)
	  , setToStringTag = __webpack_require__(32)
	  , IteratorPrototype = {};
	
	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	__webpack_require__(25)(IteratorPrototype, __webpack_require__(33)('iterator'), function(){ return this; });
	
	module.exports = function(Constructor, NAME, next){
	  Constructor.prototype = $.create(IteratorPrototype, {next: descriptor(1, next)});
	  setToStringTag(Constructor, NAME + ' Iterator');
	};

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var def = __webpack_require__(26).setDesc
	  , has = __webpack_require__(29)
	  , TAG = __webpack_require__(33)('toStringTag');
	
	module.exports = function(it, tag, stat){
	  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
	};

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var store  = __webpack_require__(34)('wks')
	  , uid    = __webpack_require__(35)
	  , Symbol = __webpack_require__(9).Symbol;
	module.exports = function(name){
	  return store[name] || (store[name] =
	    Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
	};

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(9)
	  , SHARED = '__core-js_shared__'
	  , store  = global[SHARED] || (global[SHARED] = {});
	module.exports = function(key){
	  return store[key] || (store[key] = {});
	};

/***/ },
/* 35 */
/***/ function(module, exports) {

	var id = 0
	  , px = Math.random();
	module.exports = function(key){
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx         = __webpack_require__(11)
	  , $export     = __webpack_require__(8)
	  , toObject    = __webpack_require__(5)
	  , call        = __webpack_require__(37)
	  , isArrayIter = __webpack_require__(40)
	  , toLength    = __webpack_require__(41)
	  , getIterFn   = __webpack_require__(42);
	$export($export.S + $export.F * !__webpack_require__(45)(function(iter){ Array.from(iter); }), 'Array', {
	  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
	  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
	    var O       = toObject(arrayLike)
	      , C       = typeof this == 'function' ? this : Array
	      , $$      = arguments
	      , $$len   = $$.length
	      , mapfn   = $$len > 1 ? $$[1] : undefined
	      , mapping = mapfn !== undefined
	      , index   = 0
	      , iterFn  = getIterFn(O)
	      , length, result, step, iterator;
	    if(mapping)mapfn = ctx(mapfn, $$len > 2 ? $$[2] : undefined, 2);
	    // if object isn't iterable or it's array with default iterator - use simple case
	    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
	      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
	        result[index] = mapping ? call(iterator, mapfn, [step.value, index], true) : step.value;
	      }
	    } else {
	      length = toLength(O.length);
	      for(result = new C(length); length > index; index++){
	        result[index] = mapping ? mapfn(O[index], index) : O[index];
	      }
	    }
	    result.length = index;
	    return result;
	  }
	});


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	// call something on iterator step with safe closing on error
	var anObject = __webpack_require__(38);
	module.exports = function(iterator, fn, value, entries){
	  try {
	    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
	  // 7.4.6 IteratorClose(iterator, completion)
	  } catch(e){
	    var ret = iterator['return'];
	    if(ret !== undefined)anObject(ret.call(iterator));
	    throw e;
	  }
	};

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(39);
	module.exports = function(it){
	  if(!isObject(it))throw TypeError(it + ' is not an object!');
	  return it;
	};

/***/ },
/* 39 */
/***/ function(module, exports) {

	module.exports = function(it){
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	// check on default Array iterator
	var Iterators  = __webpack_require__(30)
	  , ITERATOR   = __webpack_require__(33)('iterator')
	  , ArrayProto = Array.prototype;
	
	module.exports = function(it){
	  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
	};

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(21)
	  , min       = Math.min;
	module.exports = function(it){
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(43)
	  , ITERATOR  = __webpack_require__(33)('iterator')
	  , Iterators = __webpack_require__(30);
	module.exports = __webpack_require__(10).getIteratorMethod = function(it){
	  if(it != undefined)return it[ITERATOR]
	    || it['@@iterator']
	    || Iterators[classof(it)];
	};

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	// getting tag from 19.1.3.6 Object.prototype.toString()
	var cof = __webpack_require__(44)
	  , TAG = __webpack_require__(33)('toStringTag')
	  // ES3 wrong here
	  , ARG = cof(function(){ return arguments; }()) == 'Arguments';
	
	module.exports = function(it){
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
	    // builtinTag case
	    : ARG ? cof(O)
	    // ES3 arguments fallback
	    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

/***/ },
/* 44 */
/***/ function(module, exports) {

	var toString = {}.toString;
	
	module.exports = function(it){
	  return toString.call(it).slice(8, -1);
	};

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var ITERATOR     = __webpack_require__(33)('iterator')
	  , SAFE_CLOSING = false;
	
	try {
	  var riter = [7][ITERATOR]();
	  riter['return'] = function(){ SAFE_CLOSING = true; };
	  Array.from(riter, function(){ throw 2; });
	} catch(e){ /* empty */ }
	
	module.exports = function(exec, skipClosing){
	  if(!skipClosing && !SAFE_CLOSING)return false;
	  var safe = false;
	  try {
	    var arr  = [7]
	      , iter = arr[ITERATOR]();
	    iter.next = function(){ safe = true; };
	    arr[ITERATOR] = function(){ return iter; };
	    exec(arr);
	  } catch(e){ /* empty */ }
	  return safe;
	};

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @export {Class} SmoothScrollbar
	 */
	
	'use strict';
	
	var _classCallCheck = __webpack_require__(47)['default'];
	
	var _Object$freeze = __webpack_require__(48)['default'];
	
	var _Object$assign = __webpack_require__(51)['default'];
	
	var _Object$defineProperties = __webpack_require__(56)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _options = __webpack_require__(58);
	
	var _sharedSb_list = __webpack_require__(59);
	
	var _utilsIndex = __webpack_require__(77);
	
	/**
	 * @constructor
	 * Create scrollbar instance
	 *
	 * @param {Element} container: target element
	 * @param {Object} [options]: options
	 */
	
	var SmoothScrollbar = function SmoothScrollbar(container) {
	    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	
	    _classCallCheck(this, SmoothScrollbar);
	
	    _sharedSb_list.sbList.set(container, this);
	
	    // make container focusable
	    container.setAttribute('tabindex', '1');
	
	    // reset scroll position
	    container.scrollTop = container.scrollLeft = 0;
	
	    (0, _utilsIndex.setStyle)(container, {
	        overflow: 'hidden',
	        outline: 'none'
	    });
	
	    var trackX = (0, _utilsIndex.findChild)(container, 'scrollbar-track-x');
	    var trackY = (0, _utilsIndex.findChild)(container, 'scrollbar-track-y');
	
	    // readonly properties
	    this.__readonly('targets', _Object$freeze({
	        container: container,
	        content: (0, _utilsIndex.findChild)(container, 'scroll-content'),
	        xAxis: _Object$freeze({
	            track: trackX,
	            thumb: (0, _utilsIndex.findChild)(trackX, 'scrollbar-thumb-x')
	        }),
	        yAxis: _Object$freeze({
	            track: trackY,
	            thumb: (0, _utilsIndex.findChild)(trackY, 'scrollbar-thumb-y')
	        })
	    })).__readonly('offset', {
	        x: 0,
	        y: 0
	    }).__readonly('limit', {
	        x: Infinity,
	        y: Infinity
	    }).__readonly('movement', {
	        x: 0,
	        y: 0
	    }).__readonly('size', this.getSize()).__readonly('options', _Object$assign({}, _options.DEFAULT_OPTIONS));
	
	    // non-enmurable properties
	    _Object$defineProperties(this, {
	        __updateThrottle: {
	            value: (0, _utilsIndex.debounce)(this.update.bind(this))
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
	
	    this.setOptions(options);
	    this.__initScrollbar();
	};
	
	exports.SmoothScrollbar = SmoothScrollbar;

/***/ },
/* 47 */
/***/ function(module, exports) {

	"use strict";
	
	exports["default"] = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};
	
	exports.__esModule = true;

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(49), __esModule: true };

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(50);
	module.exports = __webpack_require__(10).Object.freeze;

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.5 Object.freeze(O)
	var isObject = __webpack_require__(39);
	
	__webpack_require__(7)('freeze', function($freeze){
	  return function freeze(it){
	    return $freeze && isObject(it) ? $freeze(it) : it;
	  };
	});

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(52), __esModule: true };

/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(53);
	module.exports = __webpack_require__(10).Object.assign;

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.3.1 Object.assign(target, source)
	var $export = __webpack_require__(8);
	
	$export($export.S + $export.F, 'Object', {assign: __webpack_require__(54)});

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.1 Object.assign(target, source, ...)
	var $        = __webpack_require__(26)
	  , toObject = __webpack_require__(5)
	  , IObject  = __webpack_require__(55);
	
	// should work with symbols and should have deterministic property order (V8 bug)
	module.exports = __webpack_require__(13)(function(){
	  var a = Object.assign
	    , A = {}
	    , B = {}
	    , S = Symbol()
	    , K = 'abcdefghijklmnopqrst';
	  A[S] = 7;
	  K.split('').forEach(function(k){ B[k] = k; });
	  return a({}, A)[S] != 7 || Object.keys(a({}, B)).join('') != K;
	}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
	  var T     = toObject(target)
	    , $$    = arguments
	    , $$len = $$.length
	    , index = 1
	    , getKeys    = $.getKeys
	    , getSymbols = $.getSymbols
	    , isEnum     = $.isEnum;
	  while($$len > index){
	    var S      = IObject($$[index++])
	      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
	      , length = keys.length
	      , j      = 0
	      , key;
	    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
	  }
	  return T;
	} : Object.assign;

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var cof = __webpack_require__(44);
	module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(57), __esModule: true };

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(26);
	module.exports = function defineProperties(T, D){
	  return $.setDescs(T, D);
	};

/***/ },
/* 58 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var DEFAULT_OPTIONS = {
	    speed: 1, // scroll speed scale
	    fricton: 10 // fricton factor, percent
	};
	
	exports.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
	var OPTION_LIMIT = {
	    fricton: [1, 99],
	    speed: [0, Infinity]
	};
	exports.OPTION_LIMIT = OPTION_LIMIT;

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @export {Map} sbList
	 */
	
	"use strict";
	
	var _Map = __webpack_require__(60)["default"];
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var sbList = new _Map();
	
	var originSet = sbList.set.bind(sbList);
	
	sbList.update = function () {
	    sbList.forEach(function (sb) {
	        requestAnimationFrame(function () {
	            sb.__updateChildren();
	        });
	    });
	};
	
	// patch #set with #update method
	sbList.set = function () {
	    var res = originSet.apply(undefined, arguments);
	    sbList.update();
	
	    return res;
	};
	
	exports.sbList = sbList;

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(61), __esModule: true };

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(62);
	__webpack_require__(19);
	__webpack_require__(63);
	__webpack_require__(68);
	__webpack_require__(75);
	module.exports = __webpack_require__(10).Map;

/***/ },
/* 62 */
/***/ function(module, exports) {



/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(64);
	var Iterators = __webpack_require__(30);
	Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var addToUnscopables = __webpack_require__(65)
	  , step             = __webpack_require__(66)
	  , Iterators        = __webpack_require__(30)
	  , toIObject        = __webpack_require__(67);
	
	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	module.exports = __webpack_require__(22)(Array, 'Array', function(iterated, kind){
	  this._t = toIObject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , kind  = this._k
	    , index = this._i++;
	  if(!O || index >= O.length){
	    this._t = undefined;
	    return step(1);
	  }
	  if(kind == 'keys'  )return step(0, index);
	  if(kind == 'values')return step(0, O[index]);
	  return step(0, [index, O[index]]);
	}, 'values');
	
	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	Iterators.Arguments = Iterators.Array;
	
	addToUnscopables('keys');
	addToUnscopables('values');
	addToUnscopables('entries');

/***/ },
/* 65 */
/***/ function(module, exports) {

	module.exports = function(){ /* empty */ };

/***/ },
/* 66 */
/***/ function(module, exports) {

	module.exports = function(done, value){
	  return {value: value, done: !!done};
	};

/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(55)
	  , defined = __webpack_require__(6);
	module.exports = function(it){
	  return IObject(defined(it));
	};

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var strong = __webpack_require__(69);
	
	// 23.1 Map Objects
	__webpack_require__(74)('Map', function(get){
	  return function Map(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
	}, {
	  // 23.1.3.6 Map.prototype.get(key)
	  get: function get(key){
	    var entry = strong.getEntry(this, key);
	    return entry && entry.v;
	  },
	  // 23.1.3.9 Map.prototype.set(key, value)
	  set: function set(key, value){
	    return strong.def(this, key === 0 ? 0 : key, value);
	  }
	}, strong, true);

/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $            = __webpack_require__(26)
	  , hide         = __webpack_require__(25)
	  , redefineAll  = __webpack_require__(70)
	  , ctx          = __webpack_require__(11)
	  , strictNew    = __webpack_require__(71)
	  , defined      = __webpack_require__(6)
	  , forOf        = __webpack_require__(72)
	  , $iterDefine  = __webpack_require__(22)
	  , step         = __webpack_require__(66)
	  , ID           = __webpack_require__(35)('id')
	  , $has         = __webpack_require__(29)
	  , isObject     = __webpack_require__(39)
	  , setSpecies   = __webpack_require__(73)
	  , DESCRIPTORS  = __webpack_require__(28)
	  , isExtensible = Object.isExtensible || isObject
	  , SIZE         = DESCRIPTORS ? '_s' : 'size'
	  , id           = 0;
	
	var fastKey = function(it, create){
	  // return primitive with prefix
	  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
	  if(!$has(it, ID)){
	    // can't set id to frozen object
	    if(!isExtensible(it))return 'F';
	    // not necessary to add id
	    if(!create)return 'E';
	    // add missing object id
	    hide(it, ID, ++id);
	  // return object id with prefix
	  } return 'O' + it[ID];
	};
	
	var getEntry = function(that, key){
	  // fast case
	  var index = fastKey(key), entry;
	  if(index !== 'F')return that._i[index];
	  // frozen object case
	  for(entry = that._f; entry; entry = entry.n){
	    if(entry.k == key)return entry;
	  }
	};
	
	module.exports = {
	  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
	    var C = wrapper(function(that, iterable){
	      strictNew(that, C, NAME);
	      that._i = $.create(null); // index
	      that._f = undefined;      // first entry
	      that._l = undefined;      // last entry
	      that[SIZE] = 0;           // size
	      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
	    });
	    redefineAll(C.prototype, {
	      // 23.1.3.1 Map.prototype.clear()
	      // 23.2.3.2 Set.prototype.clear()
	      clear: function clear(){
	        for(var that = this, data = that._i, entry = that._f; entry; entry = entry.n){
	          entry.r = true;
	          if(entry.p)entry.p = entry.p.n = undefined;
	          delete data[entry.i];
	        }
	        that._f = that._l = undefined;
	        that[SIZE] = 0;
	      },
	      // 23.1.3.3 Map.prototype.delete(key)
	      // 23.2.3.4 Set.prototype.delete(value)
	      'delete': function(key){
	        var that  = this
	          , entry = getEntry(that, key);
	        if(entry){
	          var next = entry.n
	            , prev = entry.p;
	          delete that._i[entry.i];
	          entry.r = true;
	          if(prev)prev.n = next;
	          if(next)next.p = prev;
	          if(that._f == entry)that._f = next;
	          if(that._l == entry)that._l = prev;
	          that[SIZE]--;
	        } return !!entry;
	      },
	      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
	      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
	      forEach: function forEach(callbackfn /*, that = undefined */){
	        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3)
	          , entry;
	        while(entry = entry ? entry.n : this._f){
	          f(entry.v, entry.k, this);
	          // revert to the last existing entry
	          while(entry && entry.r)entry = entry.p;
	        }
	      },
	      // 23.1.3.7 Map.prototype.has(key)
	      // 23.2.3.7 Set.prototype.has(value)
	      has: function has(key){
	        return !!getEntry(this, key);
	      }
	    });
	    if(DESCRIPTORS)$.setDesc(C.prototype, 'size', {
	      get: function(){
	        return defined(this[SIZE]);
	      }
	    });
	    return C;
	  },
	  def: function(that, key, value){
	    var entry = getEntry(that, key)
	      , prev, index;
	    // change existing entry
	    if(entry){
	      entry.v = value;
	    // create new entry
	    } else {
	      that._l = entry = {
	        i: index = fastKey(key, true), // <- index
	        k: key,                        // <- key
	        v: value,                      // <- value
	        p: prev = that._l,             // <- previous entry
	        n: undefined,                  // <- next entry
	        r: false                       // <- removed
	      };
	      if(!that._f)that._f = entry;
	      if(prev)prev.n = entry;
	      that[SIZE]++;
	      // add to index
	      if(index !== 'F')that._i[index] = entry;
	    } return that;
	  },
	  getEntry: getEntry,
	  setStrong: function(C, NAME, IS_MAP){
	    // add .keys, .values, .entries, [@@iterator]
	    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
	    $iterDefine(C, NAME, function(iterated, kind){
	      this._t = iterated;  // target
	      this._k = kind;      // kind
	      this._l = undefined; // previous
	    }, function(){
	      var that  = this
	        , kind  = that._k
	        , entry = that._l;
	      // revert to the last existing entry
	      while(entry && entry.r)entry = entry.p;
	      // get next entry
	      if(!that._t || !(that._l = entry = entry ? entry.n : that._t._f)){
	        // or finish the iteration
	        that._t = undefined;
	        return step(1);
	      }
	      // return step by kind
	      if(kind == 'keys'  )return step(0, entry.k);
	      if(kind == 'values')return step(0, entry.v);
	      return step(0, [entry.k, entry.v]);
	    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);
	
	    // add [@@species], 23.1.2.2, 23.2.2.2
	    setSpecies(NAME);
	  }
	};

/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	var redefine = __webpack_require__(24);
	module.exports = function(target, src){
	  for(var key in src)redefine(target, key, src[key]);
	  return target;
	};

/***/ },
/* 71 */
/***/ function(module, exports) {

	module.exports = function(it, Constructor, name){
	  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
	  return it;
	};

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	var ctx         = __webpack_require__(11)
	  , call        = __webpack_require__(37)
	  , isArrayIter = __webpack_require__(40)
	  , anObject    = __webpack_require__(38)
	  , toLength    = __webpack_require__(41)
	  , getIterFn   = __webpack_require__(42);
	module.exports = function(iterable, entries, fn, that){
	  var iterFn = getIterFn(iterable)
	    , f      = ctx(fn, that, entries ? 2 : 1)
	    , index  = 0
	    , length, step, iterator;
	  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
	  // fast case for arrays with default iterator
	  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
	    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
	  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
	    call(iterator, f, step.value, entries);
	  }
	};

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var core        = __webpack_require__(10)
	  , $           = __webpack_require__(26)
	  , DESCRIPTORS = __webpack_require__(28)
	  , SPECIES     = __webpack_require__(33)('species');
	
	module.exports = function(KEY){
	  var C = core[KEY];
	  if(DESCRIPTORS && C && !C[SPECIES])$.setDesc(C, SPECIES, {
	    configurable: true,
	    get: function(){ return this; }
	  });
	};

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $              = __webpack_require__(26)
	  , global         = __webpack_require__(9)
	  , $export        = __webpack_require__(8)
	  , fails          = __webpack_require__(13)
	  , hide           = __webpack_require__(25)
	  , redefineAll    = __webpack_require__(70)
	  , forOf          = __webpack_require__(72)
	  , strictNew      = __webpack_require__(71)
	  , isObject       = __webpack_require__(39)
	  , setToStringTag = __webpack_require__(32)
	  , DESCRIPTORS    = __webpack_require__(28);
	
	module.exports = function(NAME, wrapper, methods, common, IS_MAP, IS_WEAK){
	  var Base  = global[NAME]
	    , C     = Base
	    , ADDER = IS_MAP ? 'set' : 'add'
	    , proto = C && C.prototype
	    , O     = {};
	  if(!DESCRIPTORS || typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function(){
	    new C().entries().next();
	  }))){
	    // create collection constructor
	    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
	    redefineAll(C.prototype, methods);
	  } else {
	    C = wrapper(function(target, iterable){
	      strictNew(target, C, NAME);
	      target._c = new Base;
	      if(iterable != undefined)forOf(iterable, IS_MAP, target[ADDER], target);
	    });
	    $.each.call('add,clear,delete,forEach,get,has,set,keys,values,entries'.split(','),function(KEY){
	      var IS_ADDER = KEY == 'add' || KEY == 'set';
	      if(KEY in proto && !(IS_WEAK && KEY == 'clear'))hide(C.prototype, KEY, function(a, b){
	        if(!IS_ADDER && IS_WEAK && !isObject(a))return KEY == 'get' ? undefined : false;
	        var result = this._c[KEY](a === 0 ? 0 : a, b);
	        return IS_ADDER ? this : result;
	      });
	    });
	    if('size' in proto)$.setDesc(C.prototype, 'size', {
	      get: function(){
	        return this._c.size;
	      }
	    });
	  }
	
	  setToStringTag(C, NAME);
	
	  O[NAME] = C;
	  $export($export.G + $export.W + $export.F, O);
	
	  if(!IS_WEAK)common.setStrong(C, NAME, IS_MAP);
	
	  return C;
	};

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	// https://github.com/DavidBruant/Map-Set.prototype.toJSON
	var $export  = __webpack_require__(8);
	
	$export($export.P, 'Map', {toJSON: __webpack_require__(76)('Map')});

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	// https://github.com/DavidBruant/Map-Set.prototype.toJSON
	var forOf   = __webpack_require__(72)
	  , classof = __webpack_require__(43);
	module.exports = function(NAME){
	  return function toJSON(){
	    if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");
	    var arr = [];
	    forOf(this, false, arr.push, arr);
	    return arr;
	  };
	};

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _defaults = __webpack_require__(78)['default'];
	
	var _interopExportWildcard = __webpack_require__(88)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _debounce = __webpack_require__(89);
	
	_defaults(exports, _interopExportWildcard(_debounce, _defaults));
	
	var _set_style = __webpack_require__(90);
	
	_defaults(exports, _interopExportWildcard(_set_style, _defaults));
	
	var _get_delta = __webpack_require__(91);
	
	_defaults(exports, _interopExportWildcard(_get_delta, _defaults));
	
	var _find_child = __webpack_require__(93);
	
	_defaults(exports, _interopExportWildcard(_find_child, _defaults));
	
	var _build_curve = __webpack_require__(97);
	
	_defaults(exports, _interopExportWildcard(_build_curve, _defaults));
	
	var _get_touch_id = __webpack_require__(98);
	
	_defaults(exports, _interopExportWildcard(_get_touch_id, _defaults));
	
	var _get_position = __webpack_require__(100);
	
	_defaults(exports, _interopExportWildcard(_get_position, _defaults));
	
	var _pick_in_range = __webpack_require__(101);
	
	_defaults(exports, _interopExportWildcard(_pick_in_range, _defaults));
	
	var _get_pointer_data = __webpack_require__(99);
	
	_defaults(exports, _interopExportWildcard(_get_pointer_data, _defaults));
	
	var _get_original_event = __webpack_require__(92);
	
	_defaults(exports, _interopExportWildcard(_get_original_event, _defaults));

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _Object$getOwnPropertyNames = __webpack_require__(79)["default"];
	
	var _Object$getOwnPropertyDescriptor = __webpack_require__(83)["default"];
	
	var _Object$defineProperty = __webpack_require__(86)["default"];
	
	exports["default"] = function (obj, defaults) {
	  var keys = _Object$getOwnPropertyNames(defaults);
	
	  for (var i = 0; i < keys.length; i++) {
	    var key = keys[i];
	
	    var value = _Object$getOwnPropertyDescriptor(defaults, key);
	
	    if (value && value.configurable && obj[key] === undefined) {
	      _Object$defineProperty(obj, key, value);
	    }
	  }
	
	  return obj;
	};
	
	exports.__esModule = true;

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(80), __esModule: true };

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(26);
	__webpack_require__(81);
	module.exports = function getOwnPropertyNames(it){
	  return $.getNames(it);
	};

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.7 Object.getOwnPropertyNames(O)
	__webpack_require__(7)('getOwnPropertyNames', function(){
	  return __webpack_require__(82).get;
	});

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
	var toIObject = __webpack_require__(67)
	  , getNames  = __webpack_require__(26).getNames
	  , toString  = {}.toString;
	
	var windowNames = typeof window == 'object' && Object.getOwnPropertyNames
	  ? Object.getOwnPropertyNames(window) : [];
	
	var getWindowNames = function(it){
	  try {
	    return getNames(it);
	  } catch(e){
	    return windowNames.slice();
	  }
	};
	
	module.exports.get = function getOwnPropertyNames(it){
	  if(windowNames && toString.call(it) == '[object Window]')return getWindowNames(it);
	  return getNames(toIObject(it));
	};

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(84), __esModule: true };

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(26);
	__webpack_require__(85);
	module.exports = function getOwnPropertyDescriptor(it, key){
	  return $.getDesc(it, key);
	};

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
	var toIObject = __webpack_require__(67);
	
	__webpack_require__(7)('getOwnPropertyDescriptor', function($getOwnPropertyDescriptor){
	  return function getOwnPropertyDescriptor(it, key){
	    return $getOwnPropertyDescriptor(toIObject(it), key);
	  };
	});

/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(87), __esModule: true };

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(26);
	module.exports = function defineProperty(it, key, desc){
	  return $.setDesc(it, key, desc);
	};

/***/ },
/* 88 */
/***/ function(module, exports) {

	"use strict";
	
	exports["default"] = function (obj, defaults) {
	  var newObj = defaults({}, obj);
	  delete newObj["default"];
	  return newObj;
	};
	
	exports.__esModule = true;

/***/ },
/* 89 */
/***/ function(module, exports) {

	/**
	 * @module
	 * @export {Function} debounce
	 */
	
	// debounce timers reset wait
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	var RESET_WAIT = 100;
	
	/**
	 * Call fn if it isn't be called in a period
	 *
	 * @param {Function} fn
	 * @param {Number} [wait]: debounce wait, default is REST_WAIT
	 * @param {Boolean} [immediate]: whether to run task at leading, default is true
	 *
	 * @return {Function}
	 */
	var debounce = function debounce(fn) {
	    var wait = arguments.length <= 1 || arguments[1] === undefined ? RESET_WAIT : arguments[1];
	    var immediate = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
	
	    if (typeof fn !== 'function') return;
	
	    var timer = undefined;
	
	    return function () {
	        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	            args[_key] = arguments[_key];
	        }
	
	        if (!timer && immediate) {
	            setTimeout(function () {
	                return fn.apply(undefined, args);
	            });
	        }
	
	        clearTimeout(timer);
	
	        timer = setTimeout(function () {
	            timer = undefined;
	            fn.apply(undefined, args);
	        }, wait);
	    };
	};
	exports.debounce = debounce;

/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @export {Function} setStyle
	 */
	
	/**
	 * set css style for target element
	 *
	 * @param {Element} elem: target element
	 * @param {Object} styles: css styles to apply
	 */
	'use strict';
	
	var _Object$keys = __webpack_require__(2)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	var setStyle = function setStyle(elem, styles) {
	  _Object$keys(styles).forEach(function (prop) {
	    var cssProp = prop.replace(/^-/, '').replace(/-([a-z])/g, function (m, $1) {
	      return $1.toUpperCase();
	    });
	    elem.style[cssProp] = styles[prop];
	  });
	};
	exports.setStyle = setStyle;

/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @export {Function} getDelta
	 * @dependencies [ getOriginalEvent ]
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _get_original_event = __webpack_require__(92);
	
	var DELTA_SCALE = {
	    STANDARD: 1,
	    OTHERS: -3
	};
	
	var DELTA_MODE = [1.0, 28.0, 500.0];
	
	var getDeltaMode = function getDeltaMode(mode) {
	    return DELTA_MODE[mode] || DELTA_MODE[0];
	};
	
	/**
	 * Normalizing wheel delta
	 *
	 * @param {Object} evt: event object
	 */
	var getDelta = function getDelta(evt) {
	    // get original DOM event
	    evt = (0, _get_original_event.getOriginalEvent)(evt);
	
	    if ('deltaX' in evt) {
	        var mode = getDeltaMode(evt.deltaMode);
	
	        return {
	            x: evt.deltaX / DELTA_SCALE.STANDARD * mode,
	            y: evt.deltaY / DELTA_SCALE.STANDARD * mode
	        };
	    }
	
	    if ('wheelDeltaX' in evt) {
	        return {
	            x: evt.wheelDeltaX / DELTA_SCALE.OTHERS,
	            y: evt.wheelDeltaY / DELTA_SCALE.OTHERS
	        };
	    }
	
	    // ie with touchpad
	    return {
	        x: 0,
	        y: evt.wheelDelta / DELTA_SCALE.OTHERS
	    };
	};
	exports.getDelta = getDelta;

/***/ },
/* 92 */
/***/ function(module, exports) {

	/**
	 * @module
	 * @export {Function} getOriginalEvent
	 */
	
	/**
	 * Get original DOM event
	 *
	 * @param {Object} evt: event object
	 *
	 * @return {EventObject}
	 */
	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var getOriginalEvent = function getOriginalEvent(evt) {
	  return evt.originalEvent || evt;
	};
	exports.getOriginalEvent = getOriginalEvent;

/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @export {Function} findChild
	 */
	
	/**
	 * Find element with specific class name within children
	 *
	 * @param {Element} parentElem
	 * @param {String} className
	 *
	 * @return {Element}: first matched child
	 */
	"use strict";
	
	var _getIterator = __webpack_require__(94)["default"];
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var findChild = function findChild(parentElem, className) {
	  var children = parentElem.children;
	
	  if (!children) return null;
	
	  var _iteratorNormalCompletion = true;
	  var _didIteratorError = false;
	  var _iteratorError = undefined;
	
	  try {
	    for (var _iterator = _getIterator(children), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	      var elem = _step.value;
	
	      if (elem.className.match(className)) return elem;
	    }
	  } catch (err) {
	    _didIteratorError = true;
	    _iteratorError = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion && _iterator["return"]) {
	        _iterator["return"]();
	      }
	    } finally {
	      if (_didIteratorError) {
	        throw _iteratorError;
	      }
	    }
	  }
	
	  return null;
	};
	exports.findChild = findChild;

/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(95), __esModule: true };

/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(63);
	__webpack_require__(19);
	module.exports = __webpack_require__(96);

/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	var anObject = __webpack_require__(38)
	  , get      = __webpack_require__(42);
	module.exports = __webpack_require__(10).getIterator = function(it){
	  var iterFn = get(it);
	  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
	  return anObject(iterFn.call(it));
	};

/***/ },
/* 97 */
/***/ function(module, exports) {

	/**
	 * @module
	 * @export {Function} buildCurve
	 */
	
	/**
	 * Build quadratic easing curve
	 *
	 * @param {Number} begin
	 * @param {Number} duration
	 *
	 * @return {Array}: points
	 */
	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var buildCurve = function buildCurve(distance, duration) {
	  var res = [];
	
	  var t = Math.floor(duration / 1000 * 60);
	  var a = -distance / Math.pow(t, 2);
	  var b = -2 * a * t;
	
	  for (var i = 0; i <= t; i++) {
	    res.push(distance ? a * Math.pow(i, 2) + b * i : 0);
	  }
	
	  return res;
	};
	exports.buildCurve = buildCurve;

/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @export {Function} getTouchID
	 * @dependencies [ getOriginalEvent, getPointerData ]
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _get_original_event = __webpack_require__(92);
	
	var _get_pointer_data = __webpack_require__(99);
	
	/**
	 * Get touch identifier
	 *
	 * @param {Object} evt: event object
	 *
	 * @return {Number}: touch id
	 */
	var getTouchID = function getTouchID(evt) {
	  evt = (0, _get_original_event.getOriginalEvent)(evt);
	
	  var data = (0, _get_pointer_data.getPointerData)(evt);
	
	  return data.identifier;
	};
	exports.getTouchID = getTouchID;

/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @export {Function} getPointerData
	 * @dependencies [ getOriginalEvent ]
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _get_original_event = __webpack_require__(92);
	
	/**
	 * Get pointer/touch data
	 * @param {Object} evt: event object
	 */
	var getPointerData = function getPointerData(evt) {
	  // if is touch event, return last item in touchList
	  // else return original event
	  evt = (0, _get_original_event.getOriginalEvent)(evt);
	
	  return evt.touches ? evt.touches[evt.touches.length - 1] : evt;
	};
	exports.getPointerData = getPointerData;

/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @export {Function} getPosition
	 * @dependencies [ getOriginalEvent, getPointerData ]
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _get_original_event = __webpack_require__(92);
	
	var _get_pointer_data = __webpack_require__(99);
	
	/**
	 * Get pointer/finger position
	 * @param {Object} evt: event object
	 *
	 * @return {Object}: position{x, y}
	 */
	var getPosition = function getPosition(evt) {
	  evt = (0, _get_original_event.getOriginalEvent)(evt);
	
	  var data = (0, _get_pointer_data.getPointerData)(evt);
	
	  return {
	    x: data.clientX,
	    y: data.clientY
	  };
	};
	exports.getPosition = getPosition;

/***/ },
/* 101 */
/***/ function(module, exports) {

	/**
	 * @module
	 * @export {Function} pickInRange
	 */
	
	/**
	 * Pick value in range [min, max]
	 * @param {Number} value
	 * @param {Number} [min]
	 * @param {Number} [max]
	 *
	 * @return {Number}
	 */
	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var pickInRange = function pickInRange(value) {
	  var min = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
	  var max = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
	  return Math.max(min, Math.min(value, max));
	};
	exports.pickInRange = pickInRange;

/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _defaults = __webpack_require__(78)['default'];
	
	var _interopExportWildcard = __webpack_require__(88)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _sb_list = __webpack_require__(59);
	
	_defaults(exports, _interopExportWildcard(_sb_list, _defaults));
	
	var _selectors = __webpack_require__(103);
	
	_defaults(exports, _interopExportWildcard(_selectors, _defaults));

/***/ },
/* 103 */
/***/ function(module, exports) {

	/**
	 * @module
	 * @export {String} selectors
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	var selectors = 'scrollbar, [scrollbar], [data-scrollbar]';
	exports.selectors = selectors;

/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _defaults = __webpack_require__(78)['default'];
	
	var _interopExportWildcard = __webpack_require__(88)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _update = __webpack_require__(105);
	
	_defaults(exports, _interopExportWildcard(_update, _defaults));
	
	var _destroy = __webpack_require__(106);
	
	_defaults(exports, _interopExportWildcard(_destroy, _defaults));
	
	var _get_size = __webpack_require__(107);
	
	_defaults(exports, _interopExportWildcard(_get_size, _defaults));
	
	var _listener = __webpack_require__(108);
	
	_defaults(exports, _interopExportWildcard(_listener, _defaults));
	
	var _scroll_to = __webpack_require__(109);
	
	_defaults(exports, _interopExportWildcard(_scroll_to, _defaults));
	
	var _set_options = __webpack_require__(110);
	
	_defaults(exports, _interopExportWildcard(_set_options, _defaults));
	
	var _set_position = __webpack_require__(111);
	
	_defaults(exports, _interopExportWildcard(_set_position, _defaults));
	
	var _toggle_track = __webpack_require__(113);
	
	_defaults(exports, _interopExportWildcard(_toggle_track, _defaults));
	
	var _infinite_scroll = __webpack_require__(114);
	
	_defaults(exports, _interopExportWildcard(_infinite_scroll, _defaults));
	
	var _get_content_elem = __webpack_require__(115);
	
	_defaults(exports, _interopExportWildcard(_get_content_elem, _defaults));

/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} update
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _utilsIndex = __webpack_require__(77);
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @api
	 * Update scrollbars appearance
	 *
	 * @param {Boolean} async: update asynchronous
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.update = function () {
	    var _this = this;
	
	    var async = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
	
	    var update = function update() {
	        _this.__updateBounding();
	
	        var size = _this.getSize();
	
	        _this.__readonly('size', size);
	
	        var newLimit = {
	            x: size.content.width - size.container.width,
	            y: size.content.height - size.container.height
	        };
	
	        if (_this.limit && newLimit.x === _this.limit.x && newLimit.y === _this.limit.y) return;
	
	        _this.__readonly('limit', newLimit);
	
	        var _targets = _this.targets;
	        var xAxis = _targets.xAxis;
	        var yAxis = _targets.yAxis;
	
	        // hide scrollbar if content size less than container
	        (0, _utilsIndex.setStyle)(xAxis.track, {
	            'display': size.content.width <= size.container.width ? 'none' : 'block'
	        });
	        (0, _utilsIndex.setStyle)(yAxis.track, {
	            'display': size.content.height <= size.container.height ? 'none' : 'block'
	        });
	
	        // use percentage value for thumb
	        (0, _utilsIndex.setStyle)(xAxis.thumb, {
	            'width': (0, _utilsIndex.pickInRange)(size.container.width / size.content.width, 0, 1) * 100 + '%'
	        });
	        (0, _utilsIndex.setStyle)(yAxis.thumb, {
	            'height': (0, _utilsIndex.pickInRange)(size.container.height / size.content.height, 0, 1) * 100 + '%'
	        });
	
	        _this.__setThumbPosition();
	    };
	
	    if (async) {
	        requestAnimationFrame(update);
	    } else {
	        update();
	    }
	};

/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} destroy
	 */
	
	'use strict';
	
	var _toConsumableArray = __webpack_require__(16)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	var _utils = __webpack_require__(77);
	
	var _shared = __webpack_require__(102);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @api
	 * Remove all scrollbar listeners and event handlers
	 * Reset
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.destroy = function () {
	    var _this = this;
	
	    var __listeners = this.__listeners;
	    var __handlers = this.__handlers;
	    var targets = this.targets;
	    var container = targets.container;
	    var content = targets.content;
	
	    __handlers.forEach(function (_ref) {
	        var evt = _ref.evt;
	        var elem = _ref.elem;
	        var handler = _ref.handler;
	
	        elem.removeEventListener(evt, handler);
	    });
	
	    this.scrollTo(0, 0, 300, function () {
	        cancelAnimationFrame(_this.__timerID.scrollAnimation);
	        __handlers.length = __listeners.length = 0;
	
	        // reset scroll position
	        (0, _utils.setStyle)(container, {
	            overflow: ''
	        });
	
	        container.scrollTop = container.scrollLeft = 0;
	
	        // reset content
	        var children = [].concat(_toConsumableArray(content.children));
	
	        container.innerHTML = '';
	
	        children.forEach(function (el) {
	            return container.appendChild(el);
	        });
	
	        // remove form sbList
	        _shared.sbList['delete'](container);
	    });
	};

/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} getSize
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @api
	 * Get container and content size
	 *
	 * @return {Object}: an object contains container and content's width and height
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.getSize = function () {
	    var container = this.targets.container;
	    var content = this.targets.content;
	
	    return {
	        container: {
	            // requires `overflow: hidden`
	            width: container.clientWidth,
	            height: container.clientHeight
	        },
	        content: {
	            // border width should be included
	            width: content.offsetWidth,
	            height: content.offsetHeight
	        }
	    };
	};

/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} addListener
	 *            {Function} removeListener
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @api
	 * Add scrolling listener
	 *
	 * @param {Function} cb: listener
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.addListener = function (cb) {
	  if (typeof cb !== 'function') return;
	
	  this.__listeners.push(cb);
	};
	
	/**
	 * @method
	 * @api
	 * Remove specific listener from all listeners
	 * @param {type} param: description
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.removeListener = function (cb) {
	  if (typeof cb !== 'function') return;
	
	  this.__listeners.some(function (fn, idx, all) {
	    return fn === cb && all.splice(idx, 1);
	  });
	};

/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} scrollTo
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _utilsIndex = __webpack_require__(77);
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @api
	 * Scrolling scrollbar to position with transition
	 *
	 * @param {Number} [x]: scrollbar position in x axis
	 * @param {Number} [y]: scrollbar position in y axis
	 * @param {Number} [duration]: transition duration
	 * @param {Function} [cb]: callback
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.scrollTo = function () {
	    var x = arguments.length <= 0 || arguments[0] === undefined ? this.offset.x : arguments[0];
	    var y = arguments.length <= 1 || arguments[1] === undefined ? this.offset.y : arguments[1];
	
	    var _this = this;
	
	    var duration = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
	    var cb = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];
	    var options = this.options;
	    var offset = this.offset;
	    var limit = this.limit;
	    var velocity = this.velocity;
	    var __timerID = this.__timerID;
	
	    cancelAnimationFrame(__timerID.scrollTo);
	    cb = typeof cb === 'function' ? cb : function () {};
	
	    var startX = offset.x;
	    var startY = offset.y;
	
	    var disX = (0, _utilsIndex.pickInRange)(x, 0, limit.x) - startX;
	    var disY = (0, _utilsIndex.pickInRange)(y, 0, limit.y) - startY;
	
	    var curveX = (0, _utilsIndex.buildCurve)(disX, duration);
	    var curveY = (0, _utilsIndex.buildCurve)(disY, duration);
	
	    var frame = 0,
	        totalFrame = curveX.length;
	
	    var scroll = function scroll() {
	        if (frame === totalFrame) {
	            _this.setPosition(x, y);
	
	            return requestAnimationFrame(function () {
	                cb(_this);
	            });
	        }
	
	        _this.setPosition(startX + curveX[frame], startY + curveY[frame]);
	
	        frame++;
	
	        __timerID.scrollTo = requestAnimationFrame(scroll);
	    };
	
	    scroll();
	};

/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} setOptions
	 */
	
	'use strict';
	
	var _toConsumableArray = __webpack_require__(16)['default'];
	
	var _Object$keys = __webpack_require__(2)['default'];
	
	var _Object$assign = __webpack_require__(51)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _utils = __webpack_require__(77);
	
	var _options = __webpack_require__(58);
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @api
	 * Set scrollbar options
	 *
	 * @param {Object} options
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.setOptions = function () {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	
	    _Object$keys(options).forEach(function (prop) {
	        if (isNaN(parseFloat(options[prop]))) {
	            delete options[prop];
	            return;
	        }
	
	        if (!_options.OPTION_LIMIT.hasOwnProperty(prop)) return;
	
	        options[prop] = _utils.pickInRange.apply(undefined, [options[prop]].concat(_toConsumableArray(_options.OPTION_LIMIT[prop])));
	    });
	
	    _Object$assign(this.options, options);
	};

/***/ },
/* 111 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} setPosition
	 */
	
	'use strict';
	
	var _extends = __webpack_require__(112)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _utilsIndex = __webpack_require__(77);
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @api
	 * Set scrollbar position without transition
	 *
	 * @param {Number} [x]: scrollbar position in x axis
	 * @param {Number} [y]: scrollbar position in y axis
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.setPosition = function () {
	    var x = arguments.length <= 0 || arguments[0] === undefined ? this.offset.x : arguments[0];
	    var y = arguments.length <= 1 || arguments[1] === undefined ? this.offset.y : arguments[1];
	
	    this.__updateThrottle();
	
	    var status = {};
	    var offset = this.offset;
	    var limit = this.limit;
	    var targets = this.targets;
	    var __listeners = this.__listeners;
	
	    if (Math.abs(x - offset.x) > 1) this.showTrack('x');
	    if (Math.abs(y - offset.y) > 1) this.showTrack('y');
	
	    x = (0, _utilsIndex.pickInRange)(x, 0, limit.x);
	    y = (0, _utilsIndex.pickInRange)(y, 0, limit.y);
	
	    this.hideTrack();
	
	    if (x === offset.x && y === offset.y) return;
	
	    status.direction = {
	        x: x === offset.x ? 'none' : x > offset.x ? 'right' : 'left',
	        y: y === offset.y ? 'none' : y > offset.y ? 'down' : 'up'
	    };
	
	    status.limit = _extends({}, limit);
	
	    offset.x = x;
	    offset.y = y;
	    status.offset = _extends({}, offset);
	
	    // reset thumb position after offset update
	    this.__setThumbPosition();
	
	    var style = 'translate3d(' + -x + 'px, ' + -y + 'px, 0)';
	
	    (0, _utilsIndex.setStyle)(targets.content, {
	        '-webkit-transform': style,
	        'transform': style
	    });
	
	    // invoke all listeners
	    __listeners.forEach(function (fn) {
	        requestAnimationFrame(function () {
	            fn(status);
	        });
	    });
	};

/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _Object$assign = __webpack_require__(51)["default"];
	
	exports["default"] = _Object$assign || function (target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i];
	
	    for (var key in source) {
	      if (Object.prototype.hasOwnProperty.call(source, key)) {
	        target[key] = source[key];
	      }
	    }
	  }
	
	  return target;
	};
	
	exports.__esModule = true;

/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} showTrack
	 * @prototype {Function} hideTrack
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @api
	 * show scrollbar track on given direction
	 *
	 * @param {String} direction: which direction of tracks to show, default is 'both'
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.showTrack = function () {
	    var direction = arguments.length <= 0 || arguments[0] === undefined ? 'both' : arguments[0];
	    var _targets = this.targets;
	    var container = _targets.container;
	    var xAxis = _targets.xAxis;
	    var yAxis = _targets.yAxis;
	
	    direction = direction.toLowerCase();
	    container.classList.add('scrolling');
	
	    if (direction === 'both') {
	        xAxis.track.classList.add('show');
	        yAxis.track.classList.add('show');
	    }
	
	    if (direction === 'x') {
	        xAxis.track.classList.add('show');
	    }
	
	    if (direction === 'y') {
	        yAxis.track.classList.add('show');
	    }
	};
	
	/**
	 * @method
	 * @api
	 * hide track with 300ms debounce
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.hideTrack = function () {
	    var targets = this.targets;
	    var __timerID = this.__timerID;
	    var container = targets.container;
	    var xAxis = targets.xAxis;
	    var yAxis = targets.yAxis;
	
	    clearTimeout(__timerID.track);
	
	    __timerID.track = setTimeout(function () {
	        container.classList.remove('scrolling');
	        xAxis.track.classList.remove('show');
	        yAxis.track.classList.remove('show');
	    }, 300);
	};

/***/ },
/* 114 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} infiniteScroll
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @api
	 * Create infinite scroll listener
	 *
	 * @param {Function} cb: infinite scroll action
	 * @param {Number} [threshold]: infinite scroll threshold(to bottom), default is 50(px)
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.infiniteScroll = function (cb) {
	    var threshold = arguments.length <= 1 || arguments[1] === undefined ? 50 : arguments[1];
	
	    if (typeof cb !== 'function') return;
	
	    var lastOffset = {
	        x: 0,
	        y: 0
	    };
	
	    var entered = false;
	
	    this.addListener(function (status) {
	        var offset = status.offset;
	        var limit = status.limit;
	
	        if (limit.y - offset.y <= threshold && offset.y > lastOffset.y && !entered) {
	            entered = true;
	            setTimeout(function () {
	                return cb(status);
	            });
	        }
	
	        if (limit.y - offset.y > threshold) {
	            entered = false;
	        }
	
	        lastOffset = offset;
	    });
	};

/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} getContentElem
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @api
	 * Get scroll content element
	 */
	_smooth_scrollbar.SmoothScrollbar.prototype.getContentElem = function () {
	  return this.targets.content;
	};

/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _defaults = __webpack_require__(78)['default'];
	
	var _interopExportWildcard = __webpack_require__(88)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _drag = __webpack_require__(117);
	
	_defaults(exports, _interopExportWildcard(_drag, _defaults));
	
	var _touch = __webpack_require__(118);
	
	_defaults(exports, _interopExportWildcard(_touch, _defaults));
	
	var _mouse = __webpack_require__(119);
	
	_defaults(exports, _interopExportWildcard(_mouse, _defaults));
	
	var _wheel = __webpack_require__(120);
	
	_defaults(exports, _interopExportWildcard(_wheel, _defaults));
	
	var _resize = __webpack_require__(121);
	
	_defaults(exports, _interopExportWildcard(_resize, _defaults));
	
	var _select = __webpack_require__(122);
	
	_defaults(exports, _interopExportWildcard(_select, _defaults));
	
	var _keyboard = __webpack_require__(123);
	
	_defaults(exports, _interopExportWildcard(_keyboard, _defaults));

/***/ },
/* 117 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __dragHandler
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	var _utilsIndex = __webpack_require__(77);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	var __dragHandler = function __dragHandler() {
	    var _this = this;
	
	    var _targets = this.targets;
	    var container = _targets.container;
	    var content = _targets.content;
	
	    var isDrag = false;
	    var animation = undefined;
	    var targetHeight = undefined;
	
	    Object.defineProperty(this, '__isDrag', {
	        get: function get() {
	            return isDrag;
	        },
	        enumerable: false
	    });
	
	    var scroll = function scroll(_ref) {
	        var x = _ref.x;
	        var y = _ref.y;
	
	        if (!x && !y) return;
	
	        _this.__addMovement(x, y);
	
	        animation = setTimeout(function () {
	            scroll({ x: x, y: y });
	        }, 100);
	    };
	
	    this.__addEvent(document, 'dragover mousemove touchmove', function (evt) {
	        if (!isDrag || _this.__ignoreEvent(evt)) return;
	        clearTimeout(animation);
	        evt.preventDefault();
	
	        var dir = _this.__getOverflowDir(evt, targetHeight);
	
	        scroll(dir);
	    });
	
	    this.__addEvent(container, 'dragstart', function (evt) {
	        if (_this.__ignoreEvent(evt)) return;
	
	        (0, _utilsIndex.setStyle)(content, {
	            'pointer-events': 'auto'
	        });
	
	        targetHeight = evt.target.clientHeight;
	        clearTimeout(animation);
	        _this.__updateBounding();
	        isDrag = true;
	    });
	    this.__addEvent(document, 'dragend mouseup touchend blur', function (evt) {
	        if (_this.__ignoreEvent(evt)) return;
	        clearTimeout(animation);
	        isDrag = false;
	    });
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__dragHandler', {
	    value: __dragHandler,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 118 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __touchHandler
	 */
	
	'use strict';
	
	var _Object$keys = __webpack_require__(2)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	var _utilsIndex = __webpack_require__(77);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	var EASING_DURATION = navigator.userAgent.match(/android/i) ? 1500 : 750;
	
	/**
	 * @method
	 * @internal
	 * Touch event handlers builder
	 */
	var __touchHandler = function __touchHandler() {
	    var _this = this;
	
	    var container = this.targets.container;
	
	    var lastTouchTime = undefined,
	        lastTouchID = undefined;
	    var moveVelocity = {},
	        lastTouchPos = {},
	        touchRecords = {};
	
	    var updateRecords = function updateRecords(evt) {
	        var touchList = (0, _utilsIndex.getOriginalEvent)(evt).touches;
	
	        _Object$keys(touchList).forEach(function (key) {
	            // record all touches that will be restored
	            if (key === 'length') return;
	
	            var touch = touchList[key];
	
	            touchRecords[touch.identifier] = (0, _utilsIndex.getPosition)(touch);
	        });
	    };
	
	    this.__addEvent(container, 'touchstart', function (evt) {
	        if (_this.__isDrag) return;
	
	        var movement = _this.movement;
	
	        updateRecords(evt);
	
	        lastTouchTime = Date.now();
	        lastTouchID = (0, _utilsIndex.getTouchID)(evt);
	        lastTouchPos = (0, _utilsIndex.getPosition)(evt);
	
	        // stop scrolling
	        movement.x = movement.y = 0;
	        moveVelocity.x = moveVelocity.y = 0;
	    });
	
	    this.__addEvent(container, 'touchmove', function (evt) {
	        if (_this.__ignoreEvent(evt) || _this.__isDrag) return;
	
	        updateRecords(evt);
	
	        var touchID = (0, _utilsIndex.getTouchID)(evt);
	        var offset = _this.offset;
	        var limit = _this.limit;
	
	        if (lastTouchID === undefined) {
	            // reset last touch info from records
	            lastTouchID = touchID;
	
	            // don't need error handler
	            lastTouchTime = Date.now();
	            lastTouchPos = touchRecords[touchID];
	        } else if (touchID !== lastTouchID) {
	            // prevent multi-touch bouncing
	            return;
	        }
	
	        if (!lastTouchPos) return;
	
	        var duration = Date.now() - lastTouchTime;
	        var _lastTouchPos = lastTouchPos;
	        var lastX = _lastTouchPos.x;
	        var lastY = _lastTouchPos.y;
	
	        var _lastTouchPos2 = lastTouchPos = (0, _utilsIndex.getPosition)(evt);
	
	        var curX = _lastTouchPos2.x;
	        var curY = _lastTouchPos2.y;
	
	        duration = duration || 1; // fix Infinity error
	
	        moveVelocity.x = (lastX - curX) / duration;
	        moveVelocity.y = (lastY - curY) / duration;
	
	        var destX = (0, _utilsIndex.pickInRange)(lastX - curX + offset.x, 0, limit.x);
	        var destY = (0, _utilsIndex.pickInRange)(lastY - curY + offset.y, 0, limit.y);
	
	        if (Math.abs(destX - offset.x) < 1 && Math.abs(destY - offset.y) < 1) {
	            return _this.__updateThrottle();
	        }
	
	        evt.preventDefault();
	
	        _this.setPosition(destX, destY);
	    });
	
	    this.__addEvent(container, 'touchend', function (evt) {
	        if (_this.__ignoreEvent(evt) || _this.__isDrag) return;
	
	        // release current touch
	        delete touchRecords[lastTouchID];
	        lastTouchID = undefined;
	
	        var x = moveVelocity.x;
	        var y = moveVelocity.y;
	
	        _this.__addMovement(x * EASING_DURATION, y * EASING_DURATION);
	
	        moveVelocity.x = moveVelocity.y = 0;
	    });
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__touchHandler', {
	    value: __touchHandler,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 119 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __mouseHandler
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	var _utilsIndex = __webpack_require__(77);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	var TRACK_DIRECTION = {
	    x: [0, 1],
	    y: [1, 0]
	};
	
	var getTrackDir = function getTrackDir(className) {
	    var matches = className.match(/scrollbar\-(?:track|thumb)\-([xy])/);
	
	    return matches && matches[1];
	};
	
	/**
	 * @method
	 * @internal
	 * Mouse event handlers builder
	 *
	 * @param {Object} option
	 */
	var __mouseHandler = function __mouseHandler() {
	    var _this = this;
	
	    var isMouseDown = undefined,
	        isMouseMove = undefined,
	        startOffsetToThumb = undefined,
	        startTrackDirection = undefined,
	        containerRect = undefined;
	    var container = this.targets.container;
	
	    this.__addEvent(container, 'click', function (evt) {
	        if (isMouseMove || !/track/.test(evt.target.className) || _this.__ignoreEvent(evt)) return;
	
	        var track = evt.target;
	        var direction = getTrackDir(track.className);
	        var rect = track.getBoundingClientRect();
	        var clickPos = (0, _utilsIndex.getPosition)(evt);
	
	        var size = _this.size;
	        var offset = _this.offset;
	
	        if (direction === 'x') {
	            // use percentage value
	            var _thumbSize = (0, _utilsIndex.pickInRange)(size.container.width / size.content.width, 0, 1);
	            var _clickOffset = (clickPos.x - rect.left) / size.container.width;
	
	            return _this.scrollTo((_clickOffset - _thumbSize / 2) * size.content.width, offset.y, 1e3);
	        }
	
	        var thumbSize = (0, _utilsIndex.pickInRange)(size.container.height / size.content.height, 0, 1);
	        var clickOffset = (clickPos.y - rect.top) / size.container.height;
	
	        _this.scrollTo(offset.x, (clickOffset - thumbSize / 2) * size.content.height, 1e3);
	    });
	
	    this.__addEvent(container, 'mousedown', function (evt) {
	        if (!/thumb/.test(evt.target.className) || _this.__ignoreEvent(evt)) return;
	        isMouseDown = true;
	
	        var cursorPos = (0, _utilsIndex.getPosition)(evt);
	        var thumbRect = evt.target.getBoundingClientRect();
	
	        startTrackDirection = getTrackDir(evt.target.className);
	
	        // pointer offset to thumb
	        startOffsetToThumb = {
	            x: cursorPos.x - thumbRect.left,
	            y: cursorPos.y - thumbRect.top
	        };
	
	        // container bounding rectangle
	        containerRect = _this.targets.container.getBoundingClientRect();
	    });
	
	    this.__addEvent(window, 'mousemove', function (evt) {
	        if (!isMouseDown) return;
	
	        isMouseMove = true;
	        evt.preventDefault();
	
	        var size = _this.size;
	        var offset = _this.offset;
	
	        var cursorPos = (0, _utilsIndex.getPosition)(evt);
	
	        if (startTrackDirection === 'x') {
	            // get percentage of pointer position in track
	            // then tranform to px
	            _this.setPosition((cursorPos.x - startOffsetToThumb.x - containerRect.left) / (containerRect.right - containerRect.left) * size.content.width, offset.y);
	
	            return;
	        }
	
	        // don't need easing
	        _this.setPosition(offset.x, (cursorPos.y - startOffsetToThumb.y - containerRect.top) / (containerRect.bottom - containerRect.top) * size.content.height);
	    });
	
	    // release mousemove spy on window lost focus
	    this.__addEvent(window, 'mouseup blur', function () {
	        isMouseDown = isMouseMove = false;
	    });
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__mouseHandler', {
	    value: __mouseHandler,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 120 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __wheelHandler
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	var _utilsIndex = __webpack_require__(77);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	// is standard `wheel` event supported check
	var WHEEL_EVENT = 'onwheel' in window ? 'wheel' : 'mousewheel';
	
	/**
	 * @method
	 * @internal
	 * Wheel event handler builder
	 *
	 * @param {Object} option
	 *
	 * @return {Function}: event handler
	 */
	var __wheelHandler = function __wheelHandler() {
	    var _this = this;
	
	    var container = this.targets.container;
	
	    this.__addEvent(container, WHEEL_EVENT, function (evt) {
	        if (evt.defaultPrevented) return;
	
	        var offset = _this.offset;
	        var limit = _this.limit;
	
	        var delta = (0, _utilsIndex.getDelta)(evt);
	
	        var destX = (0, _utilsIndex.pickInRange)(delta.x + offset.x, 0, limit.x);
	        var destY = (0, _utilsIndex.pickInRange)(delta.y + offset.y, 0, limit.y);
	
	        if (destX === offset.x && destY === offset.y) {
	            return _this.__updateThrottle();
	        }
	
	        evt.preventDefault();
	        evt.stopPropagation();
	
	        _this.__addMovement(delta.x, delta.y);
	    });
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__wheelHandler', {
	    value: __wheelHandler,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 121 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __resizeHandler
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @internal
	 * Wheel event handler builder
	 *
	 * @param {Object} option
	 *
	 * @return {Function}: event handler
	 */
	var __resizeHandler = function __resizeHandler() {
	  this.__addEvent(window, 'resize', this.__updateThrottle);
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__resizeHandler', {
	  value: __resizeHandler,
	  writable: true,
	  configurable: true
	});

/***/ },
/* 122 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __selectHandler
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	var _utilsIndex = __webpack_require__(77);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	// todo: select handler for touch screen
	var __selectHandler = function __selectHandler() {
	    var _this = this;
	
	    var isSelected = false;
	    var animation = undefined;
	
	    var _targets = this.targets;
	    var container = _targets.container;
	    var content = _targets.content;
	
	    var scroll = function scroll(_ref) {
	        var x = _ref.x;
	        var y = _ref.y;
	
	        if (!x && !y) return;
	
	        _this.__addMovement(x, y);
	
	        animation = setTimeout(function () {
	            scroll({ x: x, y: y });
	        }, 100);
	    };
	
	    var setSelect = function setSelect() {
	        var value = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
	
	        (0, _utilsIndex.setStyle)(container, {
	            '-webkit-user-select': value,
	            '-moz-user-select': value,
	            '-ms-user-select': value,
	            'user-select': value
	        });
	    };
	
	    this.__addEvent(window, 'mousemove', function (evt) {
	        if (!isSelected) return;
	
	        clearTimeout(animation);
	
	        var dir = _this.__getOverflowDir(evt);
	
	        scroll(dir);
	    });
	
	    this.__addEvent(content, 'selectstart', function (evt) {
	        if (_this.__ignoreEvent(evt)) {
	            return setSelect('none');
	        }
	
	        clearTimeout(animation);
	        setSelect('auto');
	
	        _this.__updateBounding();
	        isSelected = true;
	    });
	
	    this.__addEvent(window, 'mouseup blur', function () {
	        clearTimeout(animation);
	        setSelect();
	
	        isSelected = false;
	    });
	
	    // temp patch for touch devices
	    this.__addEvent(container, 'scroll', function (evt) {
	        evt.preventDefault();
	        container.scrollTop = container.scrollLeft = 0;
	    });
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__selectHandler', {
	    value: __selectHandler,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 123 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __keyboardHandler
	 */
	
	'use strict';
	
	var _slicedToArray = __webpack_require__(124)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _utilsIndex = __webpack_require__(77);
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	// key maps [deltaX, deltaY]
	var KEYMAPS = {
	    37: [-1, 0], // left
	    38: [0, -1], // up
	    39: [1, 0], // right
	    40: [0, 1] // down
	};
	
	/**
	 * @method
	 * @internal
	 * Keypress event handler builder
	 *
	 * @param {Object} option
	 */
	var __keyboardHandler = function __keyboardHandler() {
	    var _this = this;
	
	    var container = this.targets.container;
	
	    var isFocused = false;
	
	    this.__addEvent(container, 'focus', function () {
	        isFocused = true;
	    });
	
	    this.__addEvent(container, 'blur', function () {
	        isFocused = false;
	    });
	
	    this.__addEvent(container, 'keydown', function (evt) {
	        if (!isFocused) return;
	
	        evt = (0, _utilsIndex.getOriginalEvent)(evt);
	
	        var keyCode = evt.keyCode || evt.which;
	
	        if (!KEYMAPS.hasOwnProperty(keyCode)) return;
	
	        evt.preventDefault();
	
	        var speed = _this.options.speed;
	
	        var _KEYMAPS$keyCode = _slicedToArray(KEYMAPS[keyCode], 2);
	
	        var x = _KEYMAPS$keyCode[0];
	        var y = _KEYMAPS$keyCode[1];
	
	        _this.__addMovement(x * 40, y * 40);
	    });
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__keyboardHandler', {
	    value: __keyboardHandler,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 124 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _getIterator = __webpack_require__(94)["default"];
	
	var _isIterable = __webpack_require__(125)["default"];
	
	exports["default"] = (function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;
	
	    try {
	      for (var _i = _getIterator(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);
	
	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }
	
	    return _arr;
	  }
	
	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if (_isIterable(Object(arr))) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	})();
	
	exports.__esModule = true;

/***/ },
/* 125 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(126), __esModule: true };

/***/ },
/* 126 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(63);
	__webpack_require__(19);
	module.exports = __webpack_require__(127);

/***/ },
/* 127 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(43)
	  , ITERATOR  = __webpack_require__(33)('iterator')
	  , Iterators = __webpack_require__(30);
	module.exports = __webpack_require__(10).isIterable = function(it){
	  var O = Object(it);
	  return O[ITERATOR] !== undefined
	    || '@@iterator' in O
	    || Iterators.hasOwnProperty(classof(O));
	};

/***/ },
/* 128 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _defaults = __webpack_require__(78)['default'];
	
	var _interopExportWildcard = __webpack_require__(88)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _render = __webpack_require__(129);
	
	_defaults(exports, _interopExportWildcard(_render, _defaults));
	
	var _readonly = __webpack_require__(130);
	
	_defaults(exports, _interopExportWildcard(_readonly, _defaults));
	
	var _add_event = __webpack_require__(131);
	
	_defaults(exports, _interopExportWildcard(_add_event, _defaults));
	
	var _ignore_event = __webpack_require__(132);
	
	_defaults(exports, _interopExportWildcard(_ignore_event, _defaults));
	
	var _add_movement = __webpack_require__(133);
	
	_defaults(exports, _interopExportWildcard(_add_movement, _defaults));
	
	var _init_scrollbar = __webpack_require__(134);
	
	_defaults(exports, _interopExportWildcard(_init_scrollbar, _defaults));
	
	var _update_children = __webpack_require__(135);
	
	_defaults(exports, _interopExportWildcard(_update_children, _defaults));
	
	var _update_bounding = __webpack_require__(136);
	
	_defaults(exports, _interopExportWildcard(_update_bounding, _defaults));
	
	var _get_overflow_dir = __webpack_require__(137);
	
	_defaults(exports, _interopExportWildcard(_get_overflow_dir, _defaults));
	
	var _set_thumb_position = __webpack_require__(138);
	
	_defaults(exports, _interopExportWildcard(_set_thumb_position, _defaults));

/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __render
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	function nextTick(options, current, movement) {
	    var fricton = options.fricton;
	
	    var q = 1 - fricton / 100;
	    var next = current + movement * (1 - q);
	    var remain = movement * q;
	
	    if (Math.abs(remain) < 1) {
	        remain = 0;
	        next = current > next ? Math.ceil(next) : Math.floor(next); // stop at integer position
	    }
	
	    return {
	        position: next,
	        movement: remain
	    };
	};
	
	function __render() {
	    var options = this.options;
	    var offset = this.offset;
	    var movement = this.movement;
	    var __timerID = this.__timerID;
	
	    if (movement.x || movement.y) {
	        var nextX = nextTick(options, offset.x, movement.x);
	        var nextY = nextTick(options, offset.y, movement.y);
	
	        movement.x = nextX.movement;
	        movement.y = nextY.movement;
	
	        this.setPosition(nextX.position, nextY.position);
	    }
	
	    __timerID.scrollAnimation = requestAnimationFrame(__render.bind(this));
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__render', {
	    value: __render,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __readonly
	 * @dependencies [ SmoothScrollbar ]
	 */
	
	'use strict';
	
	var _Object$defineProperty = __webpack_require__(86)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @internal
	 * create readonly property
	 *
	 * @param {String} prop
	 * @param {Any} value
	 */
	function __readonly(prop, value) {
	    return _Object$defineProperty(this, prop, {
	        enumerable: true,
	        configurable: true,
	        get: function get() {
	            return value;
	        }
	    });
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__readonly', {
	    value: __readonly,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 131 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __addEvent
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	function __addEvent(elem, events, fn) {
	    var _this = this;
	
	    if (!elem || typeof elem.addEventListener !== 'function') {
	        throw new TypeError('expect elem to be a DOM element, but got ' + elem);
	    }
	
	    events.split(/\s+/g).forEach(function (evt) {
	        _this.__handlers.push({ evt: evt, elem: elem, fn: fn });
	
	        elem.addEventListener(evt, fn);
	    });
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__addEvent', {
	    value: __addEvent,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __ignoreEvent
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	var _utilsIndex = __webpack_require__(77);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	function __ignoreEvent() {
	    var evt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	
	    var _getOriginalEvent = (0, _utilsIndex.getOriginalEvent)(evt);
	
	    var target = _getOriginalEvent.target;
	
	    if (!target || target === window || !this.children) return false;
	
	    return !evt.type.match(/drag/) && evt.defaultPrevented || this.children.some(function (sb) {
	        return sb.contains(target);
	    });
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__ignoreEvent', {
	    value: __ignoreEvent,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 133 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __addMovement
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	function __addMovement() {
	    var deltaX = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
	    var deltaY = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
	    var movement = this.movement;
	    var options = this.options;
	
	    movement.x += deltaX * options.speed;
	    movement.y += deltaY * options.speed;
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__addMovement', {
	    value: __addMovement,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __initScrollbar
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
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
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__initScrollbar', {
	  value: __initScrollbar,
	  writable: true,
	  configurable: true
	});

/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __updateChildren
	 */
	
	'use strict';
	
	var _toConsumableArray = __webpack_require__(16)['default'];
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	var _sharedSelectors = __webpack_require__(103);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	function __updateChildren() {
	    this.__readonly('children', [].concat(_toConsumableArray(this.targets.content.querySelectorAll(_sharedSelectors.selectors))));
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__updateChildren', {
	    value: __updateChildren,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __updateBounding
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	var _sharedSelectors = __webpack_require__(103);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	function __updateBounding() {
	    var container = this.targets.container;
	
	    var _container$getBoundingClientRect = container.getBoundingClientRect();
	
	    var top = _container$getBoundingClientRect.top;
	    var right = _container$getBoundingClientRect.right;
	    var bottom = _container$getBoundingClientRect.bottom;
	    var left = _container$getBoundingClientRect.left;
	    var innerHeight = window.innerHeight;
	    var innerWidth = window.innerWidth;
	
	    this.__readonly('bounding', {
	        top: Math.max(top, 0),
	        right: Math.min(right, innerWidth),
	        bottom: Math.min(bottom, innerHeight),
	        left: Math.max(left, 0)
	    });
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__updateBounding', {
	    value: __updateBounding,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 137 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __getOverflowDir
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	var _utilsIndex = __webpack_require__(77);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	function __getOverflowDir(evt) {
	    var edge = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
	    var _bounding = this.bounding;
	    var top = _bounding.top;
	    var right = _bounding.right;
	    var bottom = _bounding.bottom;
	    var left = _bounding.left;
	
	    var _getPosition = (0, _utilsIndex.getPosition)(evt);
	
	    var x = _getPosition.x;
	    var y = _getPosition.y;
	
	    var res = {
	        x: 0,
	        y: 0
	    };
	
	    if (x === 0 && y === 0) return res;
	
	    if (x > right - edge) {
	        res.x = x - right + edge;
	    } else if (x < left + edge) {
	        res.x = x - left - edge;
	    }
	
	    if (y > bottom - edge) {
	        res.y = y - bottom + edge;
	    } else if (y < top + edge) {
	        res.y = y - top - edge;
	    }
	
	    return res;
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__getOverflowDir', {
	    value: __getOverflowDir,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 138 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module
	 * @prototype {Function} __setThumbPosition
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _utilsIndex = __webpack_require__(77);
	
	var _smooth_scrollbar = __webpack_require__(46);
	
	exports.SmoothScrollbar = _smooth_scrollbar.SmoothScrollbar;
	
	/**
	 * @method
	 * @internal
	 * Set thumb position in track
	 */
	function __setThumbPosition() {
	    var _offset = this.offset;
	    var x = _offset.x;
	    var y = _offset.y;
	    var _targets = this.targets;
	    var xAxis = _targets.xAxis;
	    var yAxis = _targets.yAxis;
	
	    var styleX = 'translate3d(' + x / this.size.content.width * this.size.container.width + 'px, 0, 0)';
	    var styleY = 'translate3d(0, ' + y / this.size.content.height * this.size.container.height + 'px, 0)';
	
	    (0, _utilsIndex.setStyle)(xAxis.thumb, {
	        '-webkit-transform': styleX,
	        'transform': styleX
	    });
	
	    (0, _utilsIndex.setStyle)(yAxis.thumb, {
	        '-webkit-transform': styleY,
	        'transform': styleY
	    });
	};
	
	Object.defineProperty(_smooth_scrollbar.SmoothScrollbar.prototype, '__setThumbPosition', {
	    value: __setThumbPosition,
	    writable: true,
	    configurable: true
	});

/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _slicedToArray = __webpack_require__(124)['default'];
	
	var _toConsumableArray = __webpack_require__(16)['default'];
	
	var _Object$assign = __webpack_require__(51)['default'];
	
	var _interopRequireDefault = __webpack_require__(14)['default'];
	
	var _src = __webpack_require__(15);
	
	var _src2 = _interopRequireDefault(_src);
	
	var _srcOptions = __webpack_require__(58);
	
	var DPR = window.devicePixelRatio;
	var options = _Object$assign({}, _srcOptions.DEFAULT_OPTIONS);
	
	var size = {
	    width: 250,
	    height: 150
	};
	
	var canvas = document.getElementById('preview');
	var scrollbar = _src2['default'].get(document.getElementById('content'));
	var ctx = canvas.getContext('2d');
	
	canvas.width = size.width * DPR;
	canvas.height = size.height * DPR;
	ctx.scale(DPR, DPR);
	
	ctx.strokeStyle = '#94a6b7';
	ctx.fillStyle = '#abc';
	
	var shouldUpdate = true;
	
	function render() {
	    if (!shouldUpdate) {
	        return requestAnimationFrame(render);
	    }
	
	    var dots = calcDots();
	
	    ctx.clearRect(0, 0, size.width, size.height);
	    ctx.save();
	    ctx.transform(1, 0, 0, -1, 0, size.height);
	    ctx.beginPath();
	    ctx.moveTo(0, 0);
	
	    var scaleX = size.width / dots.length * (options.speed / 20 + 0.5);
	    dots.forEach(function (_ref) {
	        var _ref2 = _slicedToArray(_ref, 2);
	
	        var x = _ref2[0];
	        var y = _ref2[1];
	
	        ctx.lineTo(x * scaleX, y);
	    });
	
	    ctx.stroke();
	
	    var _dots = _slicedToArray(dots[dots.length - 1], 2);
	
	    var x = _dots[0];
	    var y = _dots[1];
	
	    ctx.lineTo(x * scaleX, y);
	    ctx.fill();
	    ctx.closePath();
	    ctx.restore();
	
	    shouldUpdate = false;
	
	    requestAnimationFrame(render);
	};
	
	render();
	
	function calcDots() {
	    var speed = options.speed;
	    var fricton = options.fricton;
	
	    var dots = [];
	
	    var x = 0;
	    var y = (speed / 20 + 0.5) * size.height;
	
	    while (y > 0.1) {
	        dots.push([x, y]);
	
	        y *= 1 - fricton / 100;
	        x++;
	    }
	
	    return dots;
	};
	
	[].concat(_toConsumableArray(document.querySelectorAll('.options'))).forEach(function (el) {
	    var prop = el.name;
	    var label = document.querySelector('.option-' + prop);
	
	    el.addEventListener('input', function () {
	        label.textContent = options[prop] = parseFloat(el.value);
	        scrollbar.setOptions(options);
	        shouldUpdate = true;
	    });
	});
	
	render();

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYjMyN2Q4NzcxZmE3NmYzY2VlN2QiLCJ3ZWJwYWNrOi8vLy4vdGVzdC9zY3JpcHRzL2luZGV4LmpzIiwid2VicGFjazovLy8uL3Rlc3Qvc2NyaXB0cy9tb25pdG9yLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9rZXlzLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9mbi9vYmplY3Qva2V5cy5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYub2JqZWN0LmtleXMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC50by1vYmplY3QuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5kZWZpbmVkLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQub2JqZWN0LXNhcC5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmV4cG9ydC5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmdsb2JhbC5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmNvcmUuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jdHguanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5hLWZ1bmN0aW9uLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZmFpbHMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9oZWxwZXJzL3RvLWNvbnN1bWFibGUtYXJyYXkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL2NvcmUtanMvYXJyYXkvZnJvbS5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvZm4vYXJyYXkvZnJvbS5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuc3RyaW5nLWF0LmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudG8taW50ZWdlci5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLml0ZXItZGVmaW5lLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQubGlicmFyeS5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnJlZGVmaW5lLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaGlkZS5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQucHJvcGVydHktZGVzYy5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmRlc2NyaXB0b3JzLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaGFzLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlcmF0b3JzLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlci1jcmVhdGUuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5zZXQtdG8tc3RyaW5nLXRhZy5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLndrcy5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnNoYXJlZC5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnVpZC5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuYXJyYXkuZnJvbS5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLml0ZXItY2FsbC5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmFuLW9iamVjdC5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmlzLW9iamVjdC5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmlzLWFycmF5LWl0ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC50by1sZW5ndGguanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvY29yZS5nZXQtaXRlcmF0b3ItbWV0aG9kLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuY2xhc3NvZi5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmNvZi5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLml0ZXItZGV0ZWN0LmpzIiwid2VicGFjazovLy8uL3NyYy9zbW9vdGhfc2Nyb2xsYmFyLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2suanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2ZyZWV6ZS5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2ZyZWV6ZS5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYub2JqZWN0LmZyZWV6ZS5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3QvYXNzaWduLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvYXNzaWduLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3QuYXNzaWduLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQub2JqZWN0LWFzc2lnbi5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmlvYmplY3QuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2RlZmluZS1wcm9wZXJ0aWVzLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvZGVmaW5lLXByb3BlcnRpZXMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL29wdGlvbnMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NoYXJlZC9zYl9saXN0LmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9jb3JlLWpzL21hcC5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvZm4vbWFwLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL3dlYi5kb20uaXRlcmFibGUuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2LmFycmF5Lml0ZXJhdG9yLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuYWRkLXRvLXVuc2NvcGFibGVzLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlci1zdGVwLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudG8taW9iamVjdC5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYubWFwLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuY29sbGVjdGlvbi1zdHJvbmcuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5yZWRlZmluZS1hbGwuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5zdHJpY3QtbmV3LmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZm9yLW9mLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuc2V0LXNwZWNpZXMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jb2xsZWN0aW9uLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNy5tYXAudG8tanNvbi5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmNvbGxlY3Rpb24tdG8tanNvbi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL2hlbHBlcnMvZGVmYXVsdHMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2dldC1vd24tcHJvcGVydHktbmFtZXMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9nZXQtb3duLXByb3BlcnR5LW5hbWVzLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3QuZ2V0LW93bi1wcm9wZXJ0eS1uYW1lcy5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmdldC1uYW1lcy5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3QvZ2V0LW93bi1wcm9wZXJ0eS1kZXNjcmlwdG9yLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvZ2V0LW93bi1wcm9wZXJ0eS1kZXNjcmlwdG9yLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3QuZ2V0LW93bi1wcm9wZXJ0eS1kZXNjcmlwdG9yLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9kZWZpbmUtcHJvcGVydHkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9kZWZpbmUtcHJvcGVydHkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1leHBvcnQtd2lsZGNhcmQuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3V0aWxzL2RlYm91bmNlLmpzIiwid2VicGFjazovLy8uL3NyYy91dGlscy9zZXRfc3R5bGUuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3V0aWxzL2dldF9kZWx0YS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMvZ2V0X29yaWdpbmFsX2V2ZW50LmpzIiwid2VicGFjazovLy8uL3NyYy91dGlscy9maW5kX2NoaWxkLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9jb3JlLWpzL2dldC1pdGVyYXRvci5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvZm4vZ2V0LWl0ZXJhdG9yLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2NvcmUuZ2V0LWl0ZXJhdG9yLmpzIiwid2VicGFjazovLy8uL3NyYy91dGlscy9idWlsZF9jdXJ2ZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMvZ2V0X3RvdWNoX2lkLmpzIiwid2VicGFjazovLy8uL3NyYy91dGlscy9nZXRfcG9pbnRlcl9kYXRhLmpzIiwid2VicGFjazovLy8uL3NyYy91dGlscy9nZXRfcG9zaXRpb24uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3V0aWxzL3BpY2tfaW5fcmFuZ2UuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NoYXJlZC9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc2hhcmVkL3NlbGVjdG9ycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXBpcy9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXBpcy91cGRhdGUuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwaXMvZGVzdHJveS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXBpcy9nZXRfc2l6ZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXBpcy9saXN0ZW5lci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXBpcy9zY3JvbGxfdG8uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwaXMvc2V0X29wdGlvbnMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwaXMvc2V0X3Bvc2l0aW9uLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwaXMvdG9nZ2xlX3RyYWNrLmpzIiwid2VicGFjazovLy8uL3NyYy9hcGlzL2luZmluaXRlX3Njcm9sbC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXBpcy9nZXRfY29udGVudF9lbGVtLmpzIiwid2VicGFjazovLy8uL3NyYy9ldmVudHMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2V2ZW50cy9kcmFnLmpzIiwid2VicGFjazovLy8uL3NyYy9ldmVudHMvdG91Y2guanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2V2ZW50cy9tb3VzZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvZXZlbnRzL3doZWVsLmpzIiwid2VicGFjazovLy8uL3NyYy9ldmVudHMvcmVzaXplLmpzIiwid2VicGFjazovLy8uL3NyYy9ldmVudHMvc2VsZWN0LmpzIiwid2VicGFjazovLy8uL3NyYy9ldmVudHMva2V5Ym9hcmQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9iYWJlbC1ydW50aW1lL2hlbHBlcnMvc2xpY2VkLXRvLWFycmF5LmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9jb3JlLWpzL2lzLWl0ZXJhYmxlLmpzIiwid2VicGFjazovLy8uL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9mbi9pcy1pdGVyYWJsZS5qcyIsIndlYnBhY2s6Ly8vLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9jb3JlLmlzLWl0ZXJhYmxlLmpzIiwid2VicGFjazovLy8uL3NyYy9pbnRlcm5hbHMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2ludGVybmFscy9yZW5kZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2ludGVybmFscy9yZWFkb25seS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW50ZXJuYWxzL2FkZF9ldmVudC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW50ZXJuYWxzL2lnbm9yZV9ldmVudC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW50ZXJuYWxzL2FkZF9tb3ZlbWVudC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW50ZXJuYWxzL2luaXRfc2Nyb2xsYmFyLmpzIiwid2VicGFjazovLy8uL3NyYy9pbnRlcm5hbHMvdXBkYXRlX2NoaWxkcmVuLmpzIiwid2VicGFjazovLy8uL3NyYy9pbnRlcm5hbHMvdXBkYXRlX2JvdW5kaW5nLmpzIiwid2VicGFjazovLy8uL3NyYy9pbnRlcm5hbHMvZ2V0X292ZXJmbG93X2Rpci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW50ZXJuYWxzL3NldF90aHVtYl9wb3NpdGlvbi5qcyIsIndlYnBhY2s6Ly8vLi90ZXN0L3NjcmlwdHMvcHJldmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7O3FCQ3RDTyxDQUFXOztxQkFDWCxHQUFXLEU7Ozs7Ozs7Ozs7OztnQ0NESSxFQUFZOzs7O0FBRWxDLEtBQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztBQUNwQyxLQUFNLGNBQWMsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDOztBQUVoQyxLQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25ELEtBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0MsS0FBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQyxLQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2hELEtBQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRXBDLEtBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDeEMsSUFBRyxDQUFD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LENBQUMsS0FBSyxHQUFHLEVBQUUsR0FBRyxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQzs7QUFFekMsWUFBTSxDQUFDLEdBQUcsR0FBRyxFQUFFO0FBQ1gsYUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUVsQixVQUFDLElBQUssQ0FBQyxHQUFHLE9BQU8sR0FBRyxHQUFJLENBQUM7QUFDekIsVUFBQyxFQUFFLENBQUM7TUFDUDs7QUFFRCxZQUFPLElBQUksQ0FBQztFQUNmLENBQUM7O0FBRUYsOEJBQUksUUFBUSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxHQUFFLE9BQU8sQ0FBQyxVQUFDLEVBQUUsRUFBSztBQUN2RCxTQUFNLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQ3JCLFNBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLGNBQVksSUFBSSxDQUFHLENBQUM7O0FBRXhELE9BQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsWUFBTTtBQUMvQixjQUFLLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pELGtCQUFTLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLHFCQUFZLEdBQUcsSUFBSSxDQUFDO01BQ3ZCLENBQUMsQ0FBQztFQUNOLENBQUMsQ0FBQzs7QUFFSCxPQUFNLEVBQUUsQyIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIGIzMjdkODc3MWZhNzZmM2NlZTdkXG4gKiovIiwiaW1wb3J0ICcuL21vbml0b3InO1xuaW1wb3J0ICcuL3ByZXZpZXcnO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vdGVzdC9zY3JpcHRzL2luZGV4LmpzXG4gKiovIiwiaW1wb3J0IFNjcm9sbGJhciBmcm9tICcuLi8uLi9zcmMvJztcblxuY29uc3QgRFBSID0gd2luZG93LmRldmljZVBpeGVsUmF0aW87XG5jb25zdCBUSU1FX1JBTkdFX01BWCA9IDIwICogMWUzO1xuXG5jb25zdCBjb250ZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRlbnQnKTtcbmNvbnN0IHRodW1iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RodW1iJyk7XG5jb25zdCB0cmFjayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmFjaycpO1xuY29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoYXJ0Jyk7XG5jb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxubGV0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuZGl2LmlubmVySFRNTCA9IEFycmF5KDEwMSkuam9pbignPHA+TG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2ljaW5nIGVsaXQuIEV4cGVkaXRhIGVhcXVlIGRlYml0aXMsIGRvbG9yZW0gZG9sb3JpYnVzLCB2b2x1cHRhdGlidXMgbWluaW1hIGlsbG8gZXN0LCBhdHF1ZSBhbGlxdWlkIGlwc3VtIG5lY2Vzc2l0YXRpYnVzIGN1bXF1ZSB2ZXJpdGF0aXMgYmVhdGFlLCByYXRpb25lIHJlcHVkaWFuZGFlIHF1b3MhIE9tbmlzIGhpYywgYW5pbWkuPC9wPicpO1xuXG5jb250ZW50LmFwcGVuZENoaWxkKGRpdik7XG5cblNjcm9sbGJhci5pbml0QWxsKCk7XG5cbmNvbnN0IHNjcm9sbGJhciA9IFNjcm9sbGJhci5nZXQoY29udGVudCk7XG5cbmxldCBjaGFydFR5cGUgPSAnb2Zmc2V0JztcblxubGV0IHRodW1iV2lkdGggPSAwXG5sZXQgZW5kT2Zmc2V0ID0gMDtcblxubGV0IHRpbWVSYW5nZSA9IDUgKiAxZTM7XG5cbmxldCByZWNvcmRzID0gW107XG5sZXQgc2l6ZSA9IHtcbiAgICB3aWR0aDogMzAwLFxuICAgIGhlaWdodDogMjAwXG59O1xuXG5sZXQgc2hvdWxkVXBkYXRlID0gdHJ1ZTtcblxubGV0IHRhbmdlbnRQb2ludCA9IG51bGw7XG5sZXQgdGFuZ2VudFBvaW50UHJlID0gbnVsbDtcblxubGV0IGhvdmVyTG9ja2VkID0gZmFsc2U7XG5sZXQgaG92ZXJQb2ludGVyWCA9IHVuZGVmaW5lZDtcbmxldCBwb2ludGVyRG93bk9uVHJhY2sgPSB1bmRlZmluZWQ7XG5sZXQgaG92ZXJQcmVjaXNpb24gPSAnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudCA/IDUgOiAxO1xuXG5jYW52YXMud2lkdGggPSBzaXplLndpZHRoICogRFBSO1xuY2FudmFzLmhlaWdodCA9IHNpemUuaGVpZ2h0ICogRFBSO1xuY3R4LnNjYWxlKERQUiwgRFBSKTtcblxuZnVuY3Rpb24gYWRkRXZlbnQoZWxlbXMsIGV2dHMsIGhhbmRsZXIpIHtcbiAgICBldnRzLnNwbGl0KC9cXHMrLykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIFtdLmNvbmNhdChlbGVtcykuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XG4gICAgICAgICAgICAgICAgc2hvdWxkVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmZ1bmN0aW9uIHNsaWNlUmVjb3JkKCkge1xuICAgIGxldCBlbmRJZHggPSBNYXRoLmZsb29yKHJlY29yZHMubGVuZ3RoICogKDEgLSBlbmRPZmZzZXQpKTtcbiAgICBsZXQgbGFzdCA9IHJlY29yZHNbcmVjb3Jkcy5sZW5ndGggLSAxXTtcbiAgICBsZXQgZHJvcElkeCA9IDA7XG5cbiAgICBsZXQgcmVzdWx0ID0gcmVjb3Jkcy5maWx0ZXIoZnVuY3Rpb24ocHQsIGlkeCkge1xuICAgICAgICBpZiAobGFzdC50aW1lIC0gcHQudGltZSA+IFRJTUVfUkFOR0VfTUFYKSB7XG4gICAgICAgICAgICBkcm9wSWR4Kys7XG4gICAgICAgICAgICBlbmRJZHgtLTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBlbmQgPSByZWNvcmRzW2VuZElkeCAtIDFdO1xuXG4gICAgICAgIHJldHVybiBlbmQudGltZSAtIHB0LnRpbWUgPD0gdGltZVJhbmdlICYmIGlkeCA8PSBlbmRJZHg7XG4gICAgfSk7XG5cbiAgICByZWNvcmRzLnNwbGljZSgwLCBkcm9wSWR4KTtcbiAgICB0aHVtYldpZHRoID0gcmVzdWx0Lmxlbmd0aCA/IHJlc3VsdC5sZW5ndGggLyByZWNvcmRzLmxlbmd0aCA6IDE7XG5cbiAgICB0aHVtYi5zdHlsZS53aWR0aCA9IHRodW1iV2lkdGggKiAxMDAgKyAnJSc7XG4gICAgdGh1bWIuc3R5bGUucmlnaHQgPSBlbmRPZmZzZXQgKiAxMDAgKyAnJSc7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuZnVuY3Rpb24gZ2V0TGltaXQocG9pbnRzKSB7XG4gICAgcmV0dXJuIHBvaW50cy5yZWR1Y2UoZnVuY3Rpb24ocHJlLCBjdXIpIHtcbiAgICAgICAgbGV0IHZhbCA9IGN1cltjaGFydFR5cGVdO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWF4OiBNYXRoLm1heChwcmUubWF4LCB2YWwpLFxuICAgICAgICAgICAgbWluOiBNYXRoLm1pbihwcmUubWluLCB2YWwpXG4gICAgICAgIH07XG4gICAgfSwgeyBtYXg6IC1JbmZpbml0eSwgbWluOiBJbmZpbml0eSB9KTtcbn07XG5cbmZ1bmN0aW9uIGFzc2lnblByb3BzKHByb3BzKSB7XG4gICAgaWYgKCFwcm9wcykgcmV0dXJuO1xuXG4gICAgT2JqZWN0LmtleXMocHJvcHMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBjdHhbbmFtZV0gPSBwcm9wc1tuYW1lXTtcbiAgICB9KTtcbn07XG5cbmZ1bmN0aW9uIGRyYXdMaW5lKHAwLCBwMSwgb3B0aW9ucykge1xuICAgIGxldCB4MCA9IHAwWzBdLFxuICAgICAgICB5MCA9IHAwWzFdLFxuICAgICAgICB4MSA9IHAxWzBdLFxuICAgICAgICB5MSA9IHAxWzFdO1xuXG4gICAgYXNzaWduUHJvcHMob3B0aW9ucy5wcm9wcyk7XG5cbiAgICBjdHguc2F2ZSgpO1xuICAgIGN0eC50cmFuc2Zvcm0oMSwgMCwgMCwgLTEsIDAsIHNpemUuaGVpZ2h0KTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LnNldExpbmVEYXNoKG9wdGlvbnMuZGFzaGVkID8gb3B0aW9ucy5kYXNoZWQgOiBbXSk7XG4gICAgY3R4Lm1vdmVUbyh4MCwgeTApO1xuICAgIGN0eC5saW5lVG8oeDEsIHkxKTtcbiAgICBjdHguc3Ryb2tlKCk7XG4gICAgY3R4LmNsb3NlUGF0aCgpO1xuICAgIGN0eC5yZXN0b3JlKClcbn07XG5cbmZ1bmN0aW9uIGFkanVzdFRleHQoY29udGVudCwgcCwgb3B0aW9ucykge1xuICAgIGxldCB4ID0gcFswXSxcbiAgICAgICAgeSA9IHBbMV07XG5cbiAgICBsZXQgd2lkdGggPSBjdHgubWVhc3VyZVRleHQoY29udGVudCkud2lkdGg7XG5cbiAgICBpZiAoeCArIHdpZHRoID4gc2l6ZS53aWR0aCkge1xuICAgICAgICBjdHgudGV4dEFsaWduID0gJ3JpZ2h0JztcbiAgICB9IGVsc2UgaWYgKHggLSB3aWR0aCA8IDApIHtcbiAgICAgICAgY3R4LnRleHRBbGlnbiA9ICdsZWZ0JztcbiAgICB9IGVsc2Uge1xuICAgICAgICBjdHgudGV4dEFsaWduID0gb3B0aW9ucy50ZXh0QWxpZ247XG4gICAgfVxuXG4gICAgY3R4LmZpbGxUZXh0KGNvbnRlbnQsIHgsIC15KTtcbn07XG5cbmZ1bmN0aW9uIGZpbGxUZXh0KGNvbnRlbnQsIHAsIG9wdGlvbnMpIHtcbiAgICBhc3NpZ25Qcm9wcyhvcHRpb25zLnByb3BzKTtcblxuICAgIGN0eC5zYXZlKCk7XG4gICAgY3R4LnRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCBzaXplLmhlaWdodCk7XG4gICAgYWRqdXN0VGV4dChjb250ZW50LCBwLCBvcHRpb25zKTtcbiAgICBjdHgucmVzdG9yZSgpO1xufTtcblxuZnVuY3Rpb24gZHJhd01haW4oKSB7XG4gICAgbGV0IHBvaW50cyA9IHNsaWNlUmVjb3JkKCk7XG4gICAgaWYgKCFwb2ludHMubGVuZ3RoKSByZXR1cm47XG5cbiAgICBsZXQgbGltaXQgPSBnZXRMaW1pdChwb2ludHMpO1xuXG4gICAgbGV0IHN0YXJ0ID0gcG9pbnRzWzBdO1xuICAgIGxldCBlbmQgPSBwb2ludHNbcG9pbnRzLmxlbmd0aCAtIDFdO1xuXG4gICAgbGV0IHRvdGFsWCA9IHRodW1iV2lkdGggPT09IDEgPyB0aW1lUmFuZ2UgOiBlbmQudGltZSAtIHN0YXJ0LnRpbWU7XG4gICAgbGV0IHRvdGFsWSA9IChsaW1pdC5tYXggLSBsaW1pdC5taW4pIHx8IDE7XG5cbiAgICBsZXQgZ3JkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIHNpemUuaGVpZ2h0LCAwLCAwKTtcbiAgICBncmQuYWRkQ29sb3JTdG9wKDAsICdyZ2IoMTcwLCAyMTUsIDI1NSknKTtcbiAgICBncmQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDE3MCwgMjE1LCAyNTUsIDAuMiknKTtcblxuICAgIGN0eC5zYXZlKCk7XG4gICAgY3R4LnRyYW5zZm9ybSgxLCAwLCAwLCAtMSwgMCwgc2l6ZS5oZWlnaHQpO1xuXG4gICAgY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgY3R4LmZpbGxTdHlsZSA9IGdyZDtcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSAncmdiKDY0LCAxNjUsIDI1NSknO1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKDAsIDApO1xuXG4gICAgbGV0IGxhc3RQb2ludCA9IHBvaW50cy5yZWR1Y2UoZnVuY3Rpb24ocHJlLCBjdXIsIGlkeCkge1xuICAgICAgICBsZXQgdGltZSA9IGN1ci50aW1lLFxuICAgICAgICAgICAgdmFsdWUgPSBjdXJbY2hhcnRUeXBlXTtcbiAgICAgICAgbGV0IHggPSAodGltZSAtIHN0YXJ0LnRpbWUpIC8gdG90YWxYICogc2l6ZS53aWR0aCxcbiAgICAgICAgICAgIHkgPSAodmFsdWUgLSBsaW1pdC5taW4pIC8gdG90YWxZICogKHNpemUuaGVpZ2h0IC0gMjApO1xuXG4gICAgICAgIGN0eC5saW5lVG8oeCwgeSk7XG5cbiAgICAgICAgaWYgKGhvdmVyUG9pbnRlclggJiYgTWF0aC5hYnMoaG92ZXJQb2ludGVyWCAtIHgpIDwgaG92ZXJQcmVjaXNpb24pIHtcbiAgICAgICAgICAgIHRhbmdlbnRQb2ludCA9IHtcbiAgICAgICAgICAgICAgICBjb29yZDogW3gsIHldLFxuICAgICAgICAgICAgICAgIHBvaW50OiBjdXJcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRhbmdlbnRQb2ludFByZSA9IHtcbiAgICAgICAgICAgICAgICBjb29yZDogcHJlLFxuICAgICAgICAgICAgICAgIHBvaW50OiBwb2ludHNbaWR4IC0gMV1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW3gsIHldO1xuICAgIH0sIFtdKTtcblxuICAgIGN0eC5zdHJva2UoKTtcbiAgICBjdHgubGluZVRvKGxhc3RQb2ludFswXSwgMCk7XG4gICAgY3R4LmZpbGwoKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgY3R4LnJlc3RvcmUoKTtcblxuICAgIGRyYXdMaW5lKFswLCBsYXN0UG9pbnRbMV1dLCBsYXN0UG9pbnQsIHtcbiAgICAgICAgcHJvcHM6IHtcbiAgICAgICAgICAgIHN0cm9rZVN0eWxlOiAnI2Y2MCdcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZmlsbFRleHQoJ+KGmScgKyBsaW1pdC5taW4udG9GaXhlZCgyKSwgWzAsIDBdLCB7XG4gICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICBmaWxsU3R5bGU6ICcjMDAwJyxcbiAgICAgICAgICAgIHRleHRBbGlnbjogJ2xlZnQnLFxuICAgICAgICAgICAgdGV4dEJhc2VsaW5lOiAnYm90dG9tJyxcbiAgICAgICAgICAgIGZvbnQ6ICcxMnB4IHNhbnMtc2VyaWYnXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBmaWxsVGV4dChlbmRbY2hhcnRUeXBlXS50b0ZpeGVkKDIpLCBsYXN0UG9pbnQsIHtcbiAgICAgICAgcHJvcHM6IHtcbiAgICAgICAgICAgIGZpbGxTdHlsZTogJyNmNjAnLFxuICAgICAgICAgICAgdGV4dEFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgdGV4dEJhc2VsaW5lOiAnYm90dG9tJyxcbiAgICAgICAgICAgIGZvbnQ6ICcxNnB4IHNhbnMtc2VyaWYnXG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbmZ1bmN0aW9uIGRyYXdUYW5nZW50TGluZSgpIHtcbiAgICBsZXQgY29vcmQgPSB0YW5nZW50UG9pbnQuY29vcmQsXG4gICAgICAgIGNvb3JkUHJlID0gdGFuZ2VudFBvaW50UHJlLmNvb3JkO1xuXG4gICAgbGV0IGsgPSAoY29vcmRbMV0gLSBjb29yZFByZVsxXSkgLyAoY29vcmRbMF0gLSBjb29yZFByZVswXSkgfHwgMDtcbiAgICBsZXQgYiA9IGNvb3JkWzFdIC0gayAqIGNvb3JkWzBdO1xuXG4gICAgZHJhd0xpbmUoWzAsIGJdLCBbc2l6ZS53aWR0aCwgayAqIHNpemUud2lkdGggKyBiXSwge1xuICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgbGluZVdpZHRoOiAxLFxuICAgICAgICAgICAgc3Ryb2tlU3R5bGU6ICcjZjAwJ1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBmaWxsVGV4dCgnazogJyArIGsudG9GaXhlZCgyKSwgW3NpemUud2lkdGggLyAyLCAwXSwge1xuICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgZmlsbFN0eWxlOiAnI2YwMCcsXG4gICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgICAgICAgICAgdGV4dEJhc2VsaW5lOiAnYm90dG9tJyxcbiAgICAgICAgICAgIGZvbnQ6ICdib2xkIDEycHggc2Fucy1zZXJpZidcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuZnVuY3Rpb24gZHJhd0hvdmVyKCkge1xuICAgIGlmICghdGFuZ2VudFBvaW50KSByZXR1cm47XG5cbiAgICBkcmF3VGFuZ2VudExpbmUoKTtcblxuICAgIGxldCBjb29yZCA9IHRhbmdlbnRQb2ludC5jb29yZCxcbiAgICAgICAgcG9pbnQgPSB0YW5nZW50UG9pbnQucG9pbnQ7XG5cbiAgICBsZXQgY29vcmRTdHlsZSA9IHtcbiAgICAgICAgZGFzaGVkOiBbOCwgNF0sXG4gICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICBsaW5lV2lkdGg6IDEsXG4gICAgICAgICAgICBzdHJva2VTdHlsZTogJ3JnYig2NCwgMTY1LCAyNTUpJ1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGRyYXdMaW5lKFswLCBjb29yZFsxXV0sIFtzaXplLndpZHRoLCBjb29yZFsxXV0sIGNvb3JkU3R5bGUpO1xuICAgIGRyYXdMaW5lKFtjb29yZFswXSwgMF0sIFtjb29yZFswXSwgc2l6ZS5oZWlnaHRdLCBjb29yZFN0eWxlKTtcblxuICAgIGxldCBkYXRlID0gbmV3IERhdGUocG9pbnQudGltZSArIHBvaW50LnJlZHVjZSk7XG5cbiAgICBsZXQgcG9pbnRJbmZvID0gW1xuICAgICAgICAnKCcsXG4gICAgICAgIGRhdGUuZ2V0TWludXRlcygpLFxuICAgICAgICAnOicsXG4gICAgICAgIGRhdGUuZ2V0U2Vjb25kcygpLFxuICAgICAgICAnLicsXG4gICAgICAgIGRhdGUuZ2V0TWlsbGlzZWNvbmRzKCksXG4gICAgICAgICcsICcsXG4gICAgICAgIHBvaW50W2NoYXJ0VHlwZV0udG9GaXhlZCgyKSxcbiAgICAgICAgJyknXG4gICAgXS5qb2luKCcnKTtcblxuICAgIGZpbGxUZXh0KHBvaW50SW5mbywgY29vcmQsIHtcbiAgICAgICAgcHJvcHM6IHtcbiAgICAgICAgICAgIGZpbGxTdHlsZTogJyMwMDAnLFxuICAgICAgICAgICAgdGV4dEFsaWduOiAnbGVmdCcsXG4gICAgICAgICAgICB0ZXh0QmFzZWxpbmU6ICdib3R0b20nLFxuICAgICAgICAgICAgZm9udDogJ2JvbGQgMTJweCBzYW5zLXNlcmlmJ1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG5mdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgaWYgKCFzaG91bGRVcGRhdGUpIHJldHVybiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcblxuICAgIGN0eC5zYXZlKCk7XG4gICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBzaXplLndpZHRoLCBzaXplLmhlaWdodCk7XG5cbiAgICBmaWxsVGV4dChjaGFydFR5cGUudG9VcHBlckNhc2UoKSwgWzAsIHNpemUuaGVpZ2h0XSwge1xuICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgZmlsbFN0eWxlOiAnI2YwMCcsXG4gICAgICAgICAgICB0ZXh0QWxpZ246ICdsZWZ0JyxcbiAgICAgICAgICAgIHRleHRCYXNlbGluZTogJ3RvcCcsXG4gICAgICAgICAgICBmb250OiAnYm9sZCAxNHB4IHNhbnMtc2VyaWYnXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGRyYXdNYWluKCk7XG4gICAgZHJhd0hvdmVyKCk7XG5cbiAgICBpZiAoaG92ZXJMb2NrZWQpIHtcbiAgICAgICAgZmlsbFRleHQoJ0xPQ0tFRCcsIFtzaXplLndpZHRoLCBzaXplLmhlaWdodF0sIHtcbiAgICAgICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICAgICAgZmlsbFN0eWxlOiAnI2YwMCcsXG4gICAgICAgICAgICAgICAgdGV4dEFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgICAgIHRleHRCYXNlbGluZTogJ3RvcCcsXG4gICAgICAgICAgICAgICAgZm9udDogJ2JvbGQgMTRweCBzYW5zLXNlcmlmJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjdHgucmVzdG9yZSgpO1xuXG4gICAgc2hvdWxkVXBkYXRlID0gZmFsc2U7XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbn07XG5cbnJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuXG5sZXQgbGFzdFRpbWUgPSBEYXRlLm5vdygpLFxuICAgIGxhc3RPZmZzZXQgPSAwLFxuICAgIHJlZHVjZUFtb3VudCA9IDA7XG5cbnNjcm9sbGJhci5hZGRMaXN0ZW5lcihmdW5jdGlvbigpIHtcbiAgICBsZXQgY3VycmVudCA9IERhdGUubm93KCksXG4gICAgICAgIG9mZnNldCA9IHNjcm9sbGJhci5vZmZzZXQueSxcbiAgICAgICAgZHVyYXRpb24gPSBjdXJyZW50IC0gbGFzdFRpbWUsXG4gICAgICAgIHZlbG9jaXR5ID0gKG9mZnNldCAtIGxhc3RPZmZzZXQpIC8gZHVyYXRpb247XG5cbiAgICBpZiAoIWR1cmF0aW9uIHx8IG9mZnNldCA9PT0gbGFzdE9mZnNldCkgcmV0dXJuO1xuXG4gICAgaWYgKGR1cmF0aW9uID4gNTApIHtcbiAgICAgICAgcmVkdWNlQW1vdW50ICs9IChkdXJhdGlvbiAtIDEpO1xuICAgIH1cblxuICAgIGxhc3RUaW1lID0gY3VycmVudDtcbiAgICBsYXN0T2Zmc2V0ID0gb2Zmc2V0O1xuXG4gICAgcmVjb3Jkcy5wdXNoKHtcbiAgICAgICAgdGltZTogY3VycmVudCAtIHJlZHVjZUFtb3VudCxcbiAgICAgICAgcmVkdWNlOiByZWR1Y2VBbW91bnQsXG4gICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICBzcGVlZDogTWF0aC5hYnModmVsb2NpdHkpXG4gICAgfSk7XG5cbiAgICBzaG91bGRVcGRhdGUgPSB0cnVlO1xufSk7XG5cbmZ1bmN0aW9uIGdldFBvaW50ZXIoZSkge1xuICAgIHJldHVybiBlLnRvdWNoZXMgPyBlLnRvdWNoZXNbZS50b3VjaGVzLmxlbmd0aCAtIDFdIDogZTtcbn07XG5cbi8vIHJhbmdlXG5sZXQgaW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZHVyYXRpb24nKTtcbmxldCBsYWJlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkdXJhdGlvbi12YWx1ZScpO1xuaW5wdXQubWF4ID0gVElNRV9SQU5HRV9NQVggLyAxZTM7XG5pbnB1dC5taW4gPSAxO1xuaW5wdXQudmFsdWUgPSB0aW1lUmFuZ2UgLyAxZTM7XG5sYWJlbC50ZXh0Q29udGVudCA9IGlucHV0LnZhbHVlICsgJ3MnO1xuXG5hZGRFdmVudChpbnB1dCwgJ2lucHV0JywgZnVuY3Rpb24oZSkge1xuICAgIGxldCBzdGFydCA9IHJlY29yZHNbMF07XG4gICAgbGV0IGVuZCA9IHJlY29yZHNbcmVjb3Jkcy5sZW5ndGggLSAxXTtcbiAgICBsZXQgdmFsID0gcGFyc2VGbG9hdChlLnRhcmdldC52YWx1ZSk7XG4gICAgbGFiZWwudGV4dENvbnRlbnQgPSB2YWwgKyAncyc7XG4gICAgdGltZVJhbmdlID0gdmFsICogMWUzO1xuICAgIGVuZE9mZnNldCA9IE1hdGgubWluKGVuZE9mZnNldCwgTWF0aC5tYXgoMCwgMSAtIHRpbWVSYW5nZSAvIChlbmQudGltZSAtIHN0YXJ0LnRpbWUpKSk7XG59KTtcblxuYWRkRXZlbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc2V0JyksICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHJlY29yZHMubGVuZ3RoID0gZW5kT2Zmc2V0ID0gcmVkdWNlQW1vdW50ID0gMDtcbiAgICBob3ZlckxvY2tlZCA9IGZhbHNlO1xuICAgIGhvdmVyUG9pbnRlclggPSB1bmRlZmluZWQ7XG4gICAgdGFuZ2VudFBvaW50ID0gbnVsbDtcbiAgICB0YW5nZW50UG9pbnRQcmUgPSBudWxsO1xuICAgIHNsaWNlUmVjb3JkKCk7XG59KTtcblxuLy8gaG92ZXJcbmFkZEV2ZW50KGNhbnZhcywgJ21vdXNlbW92ZSB0b3VjaG1vdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGhvdmVyTG9ja2VkIHx8IHBvaW50ZXJEb3duT25UcmFjaykgcmV0dXJuO1xuXG4gICAgbGV0IHBvaW50ZXIgPSBnZXRQb2ludGVyKGUpO1xuXG4gICAgaG92ZXJQb2ludGVyWCA9IHBvaW50ZXIuY2xpZW50WCAtIGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0O1xufSk7XG5cbmZ1bmN0aW9uIHJlc2V0SG92ZXIoKSB7XG4gICAgaG92ZXJQb2ludGVyWCA9IDA7XG4gICAgdGFuZ2VudFBvaW50ID0gbnVsbDtcbiAgICB0YW5nZW50UG9pbnRQcmUgPSBudWxsO1xufTtcblxuYWRkRXZlbnQoW2NhbnZhcywgd2luZG93XSwgJ21vdXNlbGVhdmUgdG91Y2hlbmQnLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoaG92ZXJMb2NrZWQpIHJldHVybjtcbiAgICByZXNldEhvdmVyKCk7XG59KTtcblxuYWRkRXZlbnQoY2FudmFzLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICBob3ZlckxvY2tlZCA9ICFob3ZlckxvY2tlZDtcblxuICAgIGlmICghaG92ZXJMb2NrZWQpIHJlc2V0SG92ZXIoKTtcbn0pO1xuXG4vLyB0cmFja1xuYWRkRXZlbnQodGh1bWIsICdtb3VzZWRvd24gdG91Y2hzdGFydCcsIGZ1bmN0aW9uKGUpIHtcbiAgICBsZXQgcG9pbnRlciA9IGdldFBvaW50ZXIoZSk7XG4gICAgcG9pbnRlckRvd25PblRyYWNrID0gcG9pbnRlci5jbGllbnRYO1xufSk7XG5cbmFkZEV2ZW50KHdpbmRvdywgJ21vdXNlbW92ZSB0b3VjaG1vdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgaWYgKCFwb2ludGVyRG93bk9uVHJhY2spIHJldHVybjtcblxuICAgIGxldCBwb2ludGVyID0gZ2V0UG9pbnRlcihlKTtcbiAgICBsZXQgbW92ZWQgPSAocG9pbnRlci5jbGllbnRYIC0gcG9pbnRlckRvd25PblRyYWNrKSAvIHNpemUud2lkdGg7XG5cbiAgICBwb2ludGVyRG93bk9uVHJhY2sgPSBwb2ludGVyLmNsaWVudFg7XG4gICAgZW5kT2Zmc2V0ID0gTWF0aC5taW4oMSAtIHRodW1iV2lkdGgsIE1hdGgubWF4KDAsIGVuZE9mZnNldCAtIG1vdmVkKSk7XG59KTtcblxuYWRkRXZlbnQod2luZG93LCAnbW91c2V1cCB0b3VjaGVuZCBibHVyJywgZnVuY3Rpb24oZSkge1xuICAgIHBvaW50ZXJEb3duT25UcmFjayA9IHVuZGVmaW5lZDtcbn0pO1xuXG5hZGRFdmVudCh0aHVtYiwgJ2NsaWNrIHRvdWNoc3RhcnQnLCBmdW5jdGlvbihlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbn0pO1xuXG5hZGRFdmVudCh0cmFjaywgJ2NsaWNrIHRvdWNoc3RhcnQnLCBmdW5jdGlvbihlKSB7XG4gICAgbGV0IHBvaW50ZXIgPSBnZXRQb2ludGVyKGUpO1xuICAgIGxldCByZWN0ID0gdHJhY2suZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgbGV0IG9mZnNldCA9IChwb2ludGVyLmNsaWVudFggLSByZWN0LmxlZnQpIC8gcmVjdC53aWR0aDtcbiAgICBlbmRPZmZzZXQgPSBNYXRoLm1pbigxIC0gdGh1bWJXaWR0aCwgTWF0aC5tYXgoMCwgMSAtIChvZmZzZXQgKyB0aHVtYldpZHRoIC8gMikpKTtcbn0pO1xuXG4vLyBzd2l0Y2ggY2hhcnRcbmFkZEV2ZW50KFxuICAgIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmNoYXJ0LXR5cGUnKSksXG4gICAgJ2NoYW5nZScsXG4gICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmNoZWNrZWQpIHtcbiAgICAgICAgICAgIGNoYXJ0VHlwZSA9IHRoaXMudmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi90ZXN0L3NjcmlwdHMvbW9uaXRvci5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3Qva2V5c1wiKSwgX19lc01vZHVsZTogdHJ1ZSB9O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3Qva2V5cy5qc1xuICoqIG1vZHVsZSBpZCA9IDJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2Lm9iamVjdC5rZXlzJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvJC5jb3JlJykuT2JqZWN0LmtleXM7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9mbi9vYmplY3Qva2V5cy5qc1xuICoqIG1vZHVsZSBpZCA9IDNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIDE5LjEuMi4xNCBPYmplY3Qua2V5cyhPKVxudmFyIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi8kLnRvLW9iamVjdCcpO1xuXG5yZXF1aXJlKCcuLyQub2JqZWN0LXNhcCcpKCdrZXlzJywgZnVuY3Rpb24oJGtleXMpe1xuICByZXR1cm4gZnVuY3Rpb24ga2V5cyhpdCl7XG4gICAgcmV0dXJuICRrZXlzKHRvT2JqZWN0KGl0KSk7XG4gIH07XG59KTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm9iamVjdC5rZXlzLmpzXG4gKiogbW9kdWxlIGlkID0gNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gNy4xLjEzIFRvT2JqZWN0KGFyZ3VtZW50KVxudmFyIGRlZmluZWQgPSByZXF1aXJlKCcuLyQuZGVmaW5lZCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBPYmplY3QoZGVmaW5lZChpdCkpO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC50by1vYmplY3QuanNcbiAqKiBtb2R1bGUgaWQgPSA1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyA3LjIuMSBSZXF1aXJlT2JqZWN0Q29lcmNpYmxlKGFyZ3VtZW50KVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIGlmKGl0ID09IHVuZGVmaW5lZCl0aHJvdyBUeXBlRXJyb3IoXCJDYW4ndCBjYWxsIG1ldGhvZCBvbiAgXCIgKyBpdCk7XG4gIHJldHVybiBpdDtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZGVmaW5lZC5qc1xuICoqIG1vZHVsZSBpZCA9IDZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIG1vc3QgT2JqZWN0IG1ldGhvZHMgYnkgRVM2IHNob3VsZCBhY2NlcHQgcHJpbWl0aXZlc1xudmFyICRleHBvcnQgPSByZXF1aXJlKCcuLyQuZXhwb3J0JylcbiAgLCBjb3JlICAgID0gcmVxdWlyZSgnLi8kLmNvcmUnKVxuICAsIGZhaWxzICAgPSByZXF1aXJlKCcuLyQuZmFpbHMnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oS0VZLCBleGVjKXtcbiAgdmFyIGZuICA9IChjb3JlLk9iamVjdCB8fCB7fSlbS0VZXSB8fCBPYmplY3RbS0VZXVxuICAgICwgZXhwID0ge307XG4gIGV4cFtLRVldID0gZXhlYyhmbik7XG4gICRleHBvcnQoJGV4cG9ydC5TICsgJGV4cG9ydC5GICogZmFpbHMoZnVuY3Rpb24oKXsgZm4oMSk7IH0pLCAnT2JqZWN0JywgZXhwKTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQub2JqZWN0LXNhcC5qc1xuICoqIG1vZHVsZSBpZCA9IDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBnbG9iYWwgICAgPSByZXF1aXJlKCcuLyQuZ2xvYmFsJylcbiAgLCBjb3JlICAgICAgPSByZXF1aXJlKCcuLyQuY29yZScpXG4gICwgY3R4ICAgICAgID0gcmVxdWlyZSgnLi8kLmN0eCcpXG4gICwgUFJPVE9UWVBFID0gJ3Byb3RvdHlwZSc7XG5cbnZhciAkZXhwb3J0ID0gZnVuY3Rpb24odHlwZSwgbmFtZSwgc291cmNlKXtcbiAgdmFyIElTX0ZPUkNFRCA9IHR5cGUgJiAkZXhwb3J0LkZcbiAgICAsIElTX0dMT0JBTCA9IHR5cGUgJiAkZXhwb3J0LkdcbiAgICAsIElTX1NUQVRJQyA9IHR5cGUgJiAkZXhwb3J0LlNcbiAgICAsIElTX1BST1RPICA9IHR5cGUgJiAkZXhwb3J0LlBcbiAgICAsIElTX0JJTkQgICA9IHR5cGUgJiAkZXhwb3J0LkJcbiAgICAsIElTX1dSQVAgICA9IHR5cGUgJiAkZXhwb3J0LldcbiAgICAsIGV4cG9ydHMgICA9IElTX0dMT0JBTCA/IGNvcmUgOiBjb3JlW25hbWVdIHx8IChjb3JlW25hbWVdID0ge30pXG4gICAgLCB0YXJnZXQgICAgPSBJU19HTE9CQUwgPyBnbG9iYWwgOiBJU19TVEFUSUMgPyBnbG9iYWxbbmFtZV0gOiAoZ2xvYmFsW25hbWVdIHx8IHt9KVtQUk9UT1RZUEVdXG4gICAgLCBrZXksIG93biwgb3V0O1xuICBpZihJU19HTE9CQUwpc291cmNlID0gbmFtZTtcbiAgZm9yKGtleSBpbiBzb3VyY2Upe1xuICAgIC8vIGNvbnRhaW5zIGluIG5hdGl2ZVxuICAgIG93biA9ICFJU19GT1JDRUQgJiYgdGFyZ2V0ICYmIGtleSBpbiB0YXJnZXQ7XG4gICAgaWYob3duICYmIGtleSBpbiBleHBvcnRzKWNvbnRpbnVlO1xuICAgIC8vIGV4cG9ydCBuYXRpdmUgb3IgcGFzc2VkXG4gICAgb3V0ID0gb3duID8gdGFyZ2V0W2tleV0gOiBzb3VyY2Vba2V5XTtcbiAgICAvLyBwcmV2ZW50IGdsb2JhbCBwb2xsdXRpb24gZm9yIG5hbWVzcGFjZXNcbiAgICBleHBvcnRzW2tleV0gPSBJU19HTE9CQUwgJiYgdHlwZW9mIHRhcmdldFtrZXldICE9ICdmdW5jdGlvbicgPyBzb3VyY2Vba2V5XVxuICAgIC8vIGJpbmQgdGltZXJzIHRvIGdsb2JhbCBmb3IgY2FsbCBmcm9tIGV4cG9ydCBjb250ZXh0XG4gICAgOiBJU19CSU5EICYmIG93biA/IGN0eChvdXQsIGdsb2JhbClcbiAgICAvLyB3cmFwIGdsb2JhbCBjb25zdHJ1Y3RvcnMgZm9yIHByZXZlbnQgY2hhbmdlIHRoZW0gaW4gbGlicmFyeVxuICAgIDogSVNfV1JBUCAmJiB0YXJnZXRba2V5XSA9PSBvdXQgPyAoZnVuY3Rpb24oQyl7XG4gICAgICB2YXIgRiA9IGZ1bmN0aW9uKHBhcmFtKXtcbiAgICAgICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBDID8gbmV3IEMocGFyYW0pIDogQyhwYXJhbSk7XG4gICAgICB9O1xuICAgICAgRltQUk9UT1RZUEVdID0gQ1tQUk9UT1RZUEVdO1xuICAgICAgcmV0dXJuIEY7XG4gICAgLy8gbWFrZSBzdGF0aWMgdmVyc2lvbnMgZm9yIHByb3RvdHlwZSBtZXRob2RzXG4gICAgfSkob3V0KSA6IElTX1BST1RPICYmIHR5cGVvZiBvdXQgPT0gJ2Z1bmN0aW9uJyA/IGN0eChGdW5jdGlvbi5jYWxsLCBvdXQpIDogb3V0O1xuICAgIGlmKElTX1BST1RPKShleHBvcnRzW1BST1RPVFlQRV0gfHwgKGV4cG9ydHNbUFJPVE9UWVBFXSA9IHt9KSlba2V5XSA9IG91dDtcbiAgfVxufTtcbi8vIHR5cGUgYml0bWFwXG4kZXhwb3J0LkYgPSAxOyAgLy8gZm9yY2VkXG4kZXhwb3J0LkcgPSAyOyAgLy8gZ2xvYmFsXG4kZXhwb3J0LlMgPSA0OyAgLy8gc3RhdGljXG4kZXhwb3J0LlAgPSA4OyAgLy8gcHJvdG9cbiRleHBvcnQuQiA9IDE2OyAvLyBiaW5kXG4kZXhwb3J0LlcgPSAzMjsgLy8gd3JhcFxubW9kdWxlLmV4cG9ydHMgPSAkZXhwb3J0O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmV4cG9ydC5qc1xuICoqIG1vZHVsZSBpZCA9IDhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS96bG9pcm9jay9jb3JlLWpzL2lzc3Vlcy84NiNpc3N1ZWNvbW1lbnQtMTE1NzU5MDI4XG52YXIgZ2xvYmFsID0gbW9kdWxlLmV4cG9ydHMgPSB0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnICYmIHdpbmRvdy5NYXRoID09IE1hdGhcbiAgPyB3aW5kb3cgOiB0eXBlb2Ygc2VsZiAhPSAndW5kZWZpbmVkJyAmJiBzZWxmLk1hdGggPT0gTWF0aCA/IHNlbGYgOiBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuaWYodHlwZW9mIF9fZyA9PSAnbnVtYmVyJylfX2cgPSBnbG9iYWw7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5nbG9iYWwuanNcbiAqKiBtb2R1bGUgaWQgPSA5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgY29yZSA9IG1vZHVsZS5leHBvcnRzID0ge3ZlcnNpb246ICcxLjIuNid9O1xuaWYodHlwZW9mIF9fZSA9PSAnbnVtYmVyJylfX2UgPSBjb3JlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuY29yZS5qc1xuICoqIG1vZHVsZSBpZCA9IDEwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBvcHRpb25hbCAvIHNpbXBsZSBjb250ZXh0IGJpbmRpbmdcbnZhciBhRnVuY3Rpb24gPSByZXF1aXJlKCcuLyQuYS1mdW5jdGlvbicpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihmbiwgdGhhdCwgbGVuZ3RoKXtcbiAgYUZ1bmN0aW9uKGZuKTtcbiAgaWYodGhhdCA9PT0gdW5kZWZpbmVkKXJldHVybiBmbjtcbiAgc3dpdGNoKGxlbmd0aCl7XG4gICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24oYSl7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGF0LCBhKTtcbiAgICB9O1xuICAgIGNhc2UgMjogcmV0dXJuIGZ1bmN0aW9uKGEsIGIpe1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhhdCwgYSwgYik7XG4gICAgfTtcbiAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbihhLCBiLCBjKXtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoYXQsIGEsIGIsIGMpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uKC8qIC4uLmFyZ3MgKi8pe1xuICAgIHJldHVybiBmbi5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xuICB9O1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jdHguanNcbiAqKiBtb2R1bGUgaWQgPSAxMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIGlmKHR5cGVvZiBpdCAhPSAnZnVuY3Rpb24nKXRocm93IFR5cGVFcnJvcihpdCArICcgaXMgbm90IGEgZnVuY3Rpb24hJyk7XG4gIHJldHVybiBpdDtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuYS1mdW5jdGlvbi5qc1xuICoqIG1vZHVsZSBpZCA9IDEyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGV4ZWMpe1xuICB0cnkge1xuICAgIHJldHVybiAhIWV4ZWMoKTtcbiAgfSBjYXRjaChlKXtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5mYWlscy5qc1xuICoqIG1vZHVsZSBpZCA9IDEzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7XG4gICAgXCJkZWZhdWx0XCI6IG9ialxuICB9O1xufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQuanNcbiAqKiBtb2R1bGUgaWQgPSAxNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiaW1wb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH0gZnJvbSAnLi9zbW9vdGhfc2Nyb2xsYmFyJztcbmltcG9ydCB7IHNlbGVjdG9ycywgc2JMaXN0IH0gZnJvbSAnLi9zaGFyZWQnO1xuXG5pbXBvcnQgJy4vYXBpcy9pbmRleCc7XG5pbXBvcnQgJy4vZXZlbnRzL2luZGV4JztcbmltcG9ydCAnLi9pbnRlcm5hbHMvaW5kZXgnO1xuXG5leHBvcnQgZGVmYXVsdCBTbW9vdGhTY3JvbGxiYXI7XG5cblNtb290aFNjcm9sbGJhci52ZXJzaW9uID0gJzwlPSB2ZXJzaW9uICU+JztcblxuLyoqXG4gKiBpbml0IHNjcm9sbGJhciBvbiBnaXZlbiBlbGVtZW50XG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtOiB0YXJnZXQgZWxlbWVudFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnM6IHNjcm9sbGJhciBvcHRpb25zXG4gKlxuICogQHJldHVybiB7U2Nyb2xsYmFyfSBzY3JvbGxiYXIgaW5zdGFuY2VcbiAqL1xuU21vb3RoU2Nyb2xsYmFyLmluaXQgPSAoZWxlbSwgb3B0aW9ucykgPT4ge1xuICAgIGlmICghZWxlbSB8fCBlbGVtLm5vZGVUeXBlICE9PSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYGV4cGVjdCBlbGVtZW50IHRvIGJlIERPTSBFbGVtZW50LCBidXQgZ290ICR7dHlwZW9mIGVsZW19YCk7XG4gICAgfVxuXG4gICAgaWYgKHNiTGlzdC5oYXMoZWxlbSkpIHJldHVybiBzYkxpc3QuZ2V0KGVsZW0pO1xuXG4gICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2Nyb2xsYmFyJywgJycpO1xuXG4gICAgY29uc3QgY2hpbGRyZW4gPSBbLi4uZWxlbS5jaGlsZHJlbl07XG5cbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIGRpdi5pbm5lckhUTUwgPSBgXG4gICAgICAgIDxhcnRpY2xlIGNsYXNzPVwic2Nyb2xsLWNvbnRlbnRcIj48L2FydGljbGU+XG4gICAgICAgIDxhc2lkZSBjbGFzcz1cInNjcm9sbGJhci10cmFjayBzY3JvbGxiYXItdHJhY2steFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbGJhci10aHVtYiBzY3JvbGxiYXItdGh1bWIteFwiPjwvZGl2PlxuICAgICAgICA8L2FzaWRlPlxuICAgICAgICA8YXNpZGUgY2xhc3M9XCJzY3JvbGxiYXItdHJhY2sgc2Nyb2xsYmFyLXRyYWNrLXlcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzY3JvbGxiYXItdGh1bWIgc2Nyb2xsYmFyLXRodW1iLXlcIj48L2Rpdj5cbiAgICAgICAgPC9hc2lkZT5cbiAgICBgO1xuXG4gICAgY29uc3Qgc2Nyb2xsQ29udGVudCA9IGRpdi5xdWVyeVNlbGVjdG9yKCcuc2Nyb2xsLWNvbnRlbnQnKTtcblxuICAgIFsuLi5kaXYuY2hpbGRyZW5dLmZvckVhY2goKGVsKSA9PiBlbGVtLmFwcGVuZENoaWxkKGVsKSk7XG5cbiAgICBjaGlsZHJlbi5mb3JFYWNoKChlbCkgPT4gc2Nyb2xsQ29udGVudC5hcHBlbmRDaGlsZChlbCkpO1xuXG4gICAgcmV0dXJuIG5ldyBTbW9vdGhTY3JvbGxiYXIoZWxlbSwgb3B0aW9ucyk7XG59O1xuXG4vKipcbiAqIGluaXQgc2Nyb2xsYmFycyBvbiBwcmUtZGVmaW5lZCBzZWxlY3RvcnNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uczogc2Nyb2xsYmFyIG9wdGlvbnNcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYSBjb2xsZWN0aW9uIG9mIHNjcm9sbGJhciBpbnN0YW5jZXNcbiAqL1xuU21vb3RoU2Nyb2xsYmFyLmluaXRBbGwgPSAob3B0aW9ucykgPT4ge1xuICAgIHJldHVybiBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcnMpXS5tYXAoKGVsKSA9PiB7XG4gICAgICAgIHJldHVybiBTbW9vdGhTY3JvbGxiYXIuaW5pdChlbCwgb3B0aW9ucyk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIGNoZWNrIGlmIHNjcm9sbGJhciBleGlzdHMgb24gZ2l2ZW4gZWxlbWVudFxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblNtb290aFNjcm9sbGJhci5oYXMgPSAoZWxlbSkgPT4ge1xuICAgIHJldHVybiBzYkxpc3QuaGFzKGVsZW0pO1xufTtcblxuLyoqXG4gKiBnZXQgc2Nyb2xsYmFyIGluc3RhbmNlIHRocm91Z2ggZ2l2ZW4gZWxlbWVudFxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbTogdGFyZ2V0IHNjcm9sbGJhciBjb250YWluZXJcbiAqXG4gKiBAcmV0dXJuIHtTY3JvbGxiYXJ9XG4gKi9cblNtb290aFNjcm9sbGJhci5nZXQgPSAoZWxlbSkgPT4ge1xuICAgIHJldHVybiBzYkxpc3QuZ2V0KGVsZW0pO1xufTtcblxuLyoqXG4gKiBnZXQgYWxsIHNjcm9sbGJhciBpbnN0YW5jZXNcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYSBjb2xsZWN0aW9uIG9mIHNjcm9sbGJhcnNcbiAqL1xuU21vb3RoU2Nyb2xsYmFyLmdldEFsbCA9ICgpID0+IHtcbiAgICByZXR1cm4gWy4uLnNiTGlzdC52YWx1ZXMoKV07XG59O1xuXG4vKipcbiAqIGRlc3Ryb3kgc2Nyb2xsYmFyIG9uIGdpdmVuIGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW06IHRhcmdldCBzY3JvbGxiYXIgY29udGFpbmVyXG4gKi9cblNtb290aFNjcm9sbGJhci5kZXN0cm95ID0gKGVsZW0pID0+IHtcbiAgICByZXR1cm4gU21vb3RoU2Nyb2xsYmFyLmhhcyhlbGVtKSAmJiBTbW9vdGhTY3JvbGxiYXIuZ2V0KGVsZW0pLmRlc3Ryb3koKTtcbn07XG5cbi8qKlxuICogZGVzdHJveSBhbGwgc2Nyb2xsYmFycyBpbiBzY3JvbGxiYXIgaW5zdGFuY2VzXG4gKi9cblNtb290aFNjcm9sbGJhci5kZXN0cm95QWxsID0gKCkgPT4ge1xuICAgIHNiTGlzdC5mb3JFYWNoKChzYikgPT4ge1xuICAgICAgICBzYi5kZXN0cm95KCk7XG4gICAgfSk7XG59O1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiovIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfQXJyYXkkZnJvbSA9IHJlcXVpcmUoXCJiYWJlbC1ydW50aW1lL2NvcmUtanMvYXJyYXkvZnJvbVwiKVtcImRlZmF1bHRcIl07XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZnVuY3Rpb24gKGFycikge1xuICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGFycjIgPSBBcnJheShhcnIubGVuZ3RoKTsgaSA8IGFyci5sZW5ndGg7IGkrKykgYXJyMltpXSA9IGFycltpXTtcblxuICAgIHJldHVybiBhcnIyO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBfQXJyYXkkZnJvbShhcnIpO1xuICB9XG59O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvaGVscGVycy90by1jb25zdW1hYmxlLWFycmF5LmpzXG4gKiogbW9kdWxlIGlkID0gMTZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9hcnJheS9mcm9tXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9jb3JlLWpzL2FycmF5L2Zyb20uanNcbiAqKiBtb2R1bGUgaWQgPSAxN1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yJyk7XG5yZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5hcnJheS5mcm9tJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvJC5jb3JlJykuQXJyYXkuZnJvbTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L2ZuL2FycmF5L2Zyb20uanNcbiAqKiBtb2R1bGUgaWQgPSAxOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xudmFyICRhdCAgPSByZXF1aXJlKCcuLyQuc3RyaW5nLWF0JykodHJ1ZSk7XG5cbi8vIDIxLjEuMy4yNyBTdHJpbmcucHJvdG90eXBlW0BAaXRlcmF0b3JdKClcbnJlcXVpcmUoJy4vJC5pdGVyLWRlZmluZScpKFN0cmluZywgJ1N0cmluZycsIGZ1bmN0aW9uKGl0ZXJhdGVkKXtcbiAgdGhpcy5fdCA9IFN0cmluZyhpdGVyYXRlZCk7IC8vIHRhcmdldFxuICB0aGlzLl9pID0gMDsgICAgICAgICAgICAgICAgLy8gbmV4dCBpbmRleFxuLy8gMjEuMS41LjIuMSAlU3RyaW5nSXRlcmF0b3JQcm90b3R5cGUlLm5leHQoKVxufSwgZnVuY3Rpb24oKXtcbiAgdmFyIE8gICAgID0gdGhpcy5fdFxuICAgICwgaW5kZXggPSB0aGlzLl9pXG4gICAgLCBwb2ludDtcbiAgaWYoaW5kZXggPj0gTy5sZW5ndGgpcmV0dXJuIHt2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlfTtcbiAgcG9pbnQgPSAkYXQoTywgaW5kZXgpO1xuICB0aGlzLl9pICs9IHBvaW50Lmxlbmd0aDtcbiAgcmV0dXJuIHt2YWx1ZTogcG9pbnQsIGRvbmU6IGZhbHNlfTtcbn0pO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yLmpzXG4gKiogbW9kdWxlIGlkID0gMTlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciB0b0ludGVnZXIgPSByZXF1aXJlKCcuLyQudG8taW50ZWdlcicpXG4gICwgZGVmaW5lZCAgID0gcmVxdWlyZSgnLi8kLmRlZmluZWQnKTtcbi8vIHRydWUgIC0+IFN0cmluZyNhdFxuLy8gZmFsc2UgLT4gU3RyaW5nI2NvZGVQb2ludEF0XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFRPX1NUUklORyl7XG4gIHJldHVybiBmdW5jdGlvbih0aGF0LCBwb3Mpe1xuICAgIHZhciBzID0gU3RyaW5nKGRlZmluZWQodGhhdCkpXG4gICAgICAsIGkgPSB0b0ludGVnZXIocG9zKVxuICAgICAgLCBsID0gcy5sZW5ndGhcbiAgICAgICwgYSwgYjtcbiAgICBpZihpIDwgMCB8fCBpID49IGwpcmV0dXJuIFRPX1NUUklORyA/ICcnIDogdW5kZWZpbmVkO1xuICAgIGEgPSBzLmNoYXJDb2RlQXQoaSk7XG4gICAgcmV0dXJuIGEgPCAweGQ4MDAgfHwgYSA+IDB4ZGJmZiB8fCBpICsgMSA9PT0gbCB8fCAoYiA9IHMuY2hhckNvZGVBdChpICsgMSkpIDwgMHhkYzAwIHx8IGIgPiAweGRmZmZcbiAgICAgID8gVE9fU1RSSU5HID8gcy5jaGFyQXQoaSkgOiBhXG4gICAgICA6IFRPX1NUUklORyA/IHMuc2xpY2UoaSwgaSArIDIpIDogKGEgLSAweGQ4MDAgPDwgMTApICsgKGIgLSAweGRjMDApICsgMHgxMDAwMDtcbiAgfTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuc3RyaW5nLWF0LmpzXG4gKiogbW9kdWxlIGlkID0gMjBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIDcuMS40IFRvSW50ZWdlclxudmFyIGNlaWwgID0gTWF0aC5jZWlsXG4gICwgZmxvb3IgPSBNYXRoLmZsb29yO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBpc05hTihpdCA9ICtpdCkgPyAwIDogKGl0ID4gMCA/IGZsb29yIDogY2VpbCkoaXQpO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC50by1pbnRlZ2VyLmpzXG4gKiogbW9kdWxlIGlkID0gMjFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcbnZhciBMSUJSQVJZICAgICAgICA9IHJlcXVpcmUoJy4vJC5saWJyYXJ5JylcbiAgLCAkZXhwb3J0ICAgICAgICA9IHJlcXVpcmUoJy4vJC5leHBvcnQnKVxuICAsIHJlZGVmaW5lICAgICAgID0gcmVxdWlyZSgnLi8kLnJlZGVmaW5lJylcbiAgLCBoaWRlICAgICAgICAgICA9IHJlcXVpcmUoJy4vJC5oaWRlJylcbiAgLCBoYXMgICAgICAgICAgICA9IHJlcXVpcmUoJy4vJC5oYXMnKVxuICAsIEl0ZXJhdG9ycyAgICAgID0gcmVxdWlyZSgnLi8kLml0ZXJhdG9ycycpXG4gICwgJGl0ZXJDcmVhdGUgICAgPSByZXF1aXJlKCcuLyQuaXRlci1jcmVhdGUnKVxuICAsIHNldFRvU3RyaW5nVGFnID0gcmVxdWlyZSgnLi8kLnNldC10by1zdHJpbmctdGFnJylcbiAgLCBnZXRQcm90byAgICAgICA9IHJlcXVpcmUoJy4vJCcpLmdldFByb3RvXG4gICwgSVRFUkFUT1IgICAgICAgPSByZXF1aXJlKCcuLyQud2tzJykoJ2l0ZXJhdG9yJylcbiAgLCBCVUdHWSAgICAgICAgICA9ICEoW10ua2V5cyAmJiAnbmV4dCcgaW4gW10ua2V5cygpKSAvLyBTYWZhcmkgaGFzIGJ1Z2d5IGl0ZXJhdG9ycyB3L28gYG5leHRgXG4gICwgRkZfSVRFUkFUT1IgICAgPSAnQEBpdGVyYXRvcidcbiAgLCBLRVlTICAgICAgICAgICA9ICdrZXlzJ1xuICAsIFZBTFVFUyAgICAgICAgID0gJ3ZhbHVlcyc7XG5cbnZhciByZXR1cm5UaGlzID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXM7IH07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oQmFzZSwgTkFNRSwgQ29uc3RydWN0b3IsIG5leHQsIERFRkFVTFQsIElTX1NFVCwgRk9SQ0VEKXtcbiAgJGl0ZXJDcmVhdGUoQ29uc3RydWN0b3IsIE5BTUUsIG5leHQpO1xuICB2YXIgZ2V0TWV0aG9kID0gZnVuY3Rpb24oa2luZCl7XG4gICAgaWYoIUJVR0dZICYmIGtpbmQgaW4gcHJvdG8pcmV0dXJuIHByb3RvW2tpbmRdO1xuICAgIHN3aXRjaChraW5kKXtcbiAgICAgIGNhc2UgS0VZUzogcmV0dXJuIGZ1bmN0aW9uIGtleXMoKXsgcmV0dXJuIG5ldyBDb25zdHJ1Y3Rvcih0aGlzLCBraW5kKTsgfTtcbiAgICAgIGNhc2UgVkFMVUVTOiByZXR1cm4gZnVuY3Rpb24gdmFsdWVzKCl7IHJldHVybiBuZXcgQ29uc3RydWN0b3IodGhpcywga2luZCk7IH07XG4gICAgfSByZXR1cm4gZnVuY3Rpb24gZW50cmllcygpeyByZXR1cm4gbmV3IENvbnN0cnVjdG9yKHRoaXMsIGtpbmQpOyB9O1xuICB9O1xuICB2YXIgVEFHICAgICAgICA9IE5BTUUgKyAnIEl0ZXJhdG9yJ1xuICAgICwgREVGX1ZBTFVFUyA9IERFRkFVTFQgPT0gVkFMVUVTXG4gICAgLCBWQUxVRVNfQlVHID0gZmFsc2VcbiAgICAsIHByb3RvICAgICAgPSBCYXNlLnByb3RvdHlwZVxuICAgICwgJG5hdGl2ZSAgICA9IHByb3RvW0lURVJBVE9SXSB8fCBwcm90b1tGRl9JVEVSQVRPUl0gfHwgREVGQVVMVCAmJiBwcm90b1tERUZBVUxUXVxuICAgICwgJGRlZmF1bHQgICA9ICRuYXRpdmUgfHwgZ2V0TWV0aG9kKERFRkFVTFQpXG4gICAgLCBtZXRob2RzLCBrZXk7XG4gIC8vIEZpeCBuYXRpdmVcbiAgaWYoJG5hdGl2ZSl7XG4gICAgdmFyIEl0ZXJhdG9yUHJvdG90eXBlID0gZ2V0UHJvdG8oJGRlZmF1bHQuY2FsbChuZXcgQmFzZSkpO1xuICAgIC8vIFNldCBAQHRvU3RyaW5nVGFnIHRvIG5hdGl2ZSBpdGVyYXRvcnNcbiAgICBzZXRUb1N0cmluZ1RhZyhJdGVyYXRvclByb3RvdHlwZSwgVEFHLCB0cnVlKTtcbiAgICAvLyBGRiBmaXhcbiAgICBpZighTElCUkFSWSAmJiBoYXMocHJvdG8sIEZGX0lURVJBVE9SKSloaWRlKEl0ZXJhdG9yUHJvdG90eXBlLCBJVEVSQVRPUiwgcmV0dXJuVGhpcyk7XG4gICAgLy8gZml4IEFycmF5I3t2YWx1ZXMsIEBAaXRlcmF0b3J9Lm5hbWUgaW4gVjggLyBGRlxuICAgIGlmKERFRl9WQUxVRVMgJiYgJG5hdGl2ZS5uYW1lICE9PSBWQUxVRVMpe1xuICAgICAgVkFMVUVTX0JVRyA9IHRydWU7XG4gICAgICAkZGVmYXVsdCA9IGZ1bmN0aW9uIHZhbHVlcygpeyByZXR1cm4gJG5hdGl2ZS5jYWxsKHRoaXMpOyB9O1xuICAgIH1cbiAgfVxuICAvLyBEZWZpbmUgaXRlcmF0b3JcbiAgaWYoKCFMSUJSQVJZIHx8IEZPUkNFRCkgJiYgKEJVR0dZIHx8IFZBTFVFU19CVUcgfHwgIXByb3RvW0lURVJBVE9SXSkpe1xuICAgIGhpZGUocHJvdG8sIElURVJBVE9SLCAkZGVmYXVsdCk7XG4gIH1cbiAgLy8gUGx1ZyBmb3IgbGlicmFyeVxuICBJdGVyYXRvcnNbTkFNRV0gPSAkZGVmYXVsdDtcbiAgSXRlcmF0b3JzW1RBR10gID0gcmV0dXJuVGhpcztcbiAgaWYoREVGQVVMVCl7XG4gICAgbWV0aG9kcyA9IHtcbiAgICAgIHZhbHVlczogIERFRl9WQUxVRVMgID8gJGRlZmF1bHQgOiBnZXRNZXRob2QoVkFMVUVTKSxcbiAgICAgIGtleXM6ICAgIElTX1NFVCAgICAgID8gJGRlZmF1bHQgOiBnZXRNZXRob2QoS0VZUyksXG4gICAgICBlbnRyaWVzOiAhREVGX1ZBTFVFUyA/ICRkZWZhdWx0IDogZ2V0TWV0aG9kKCdlbnRyaWVzJylcbiAgICB9O1xuICAgIGlmKEZPUkNFRClmb3Ioa2V5IGluIG1ldGhvZHMpe1xuICAgICAgaWYoIShrZXkgaW4gcHJvdG8pKXJlZGVmaW5lKHByb3RvLCBrZXksIG1ldGhvZHNba2V5XSk7XG4gICAgfSBlbHNlICRleHBvcnQoJGV4cG9ydC5QICsgJGV4cG9ydC5GICogKEJVR0dZIHx8IFZBTFVFU19CVUcpLCBOQU1FLCBtZXRob2RzKTtcbiAgfVxuICByZXR1cm4gbWV0aG9kcztcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlci1kZWZpbmUuanNcbiAqKiBtb2R1bGUgaWQgPSAyMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSB0cnVlO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmxpYnJhcnkuanNcbiAqKiBtb2R1bGUgaWQgPSAyM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLyQuaGlkZScpO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnJlZGVmaW5lLmpzXG4gKiogbW9kdWxlIGlkID0gMjRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciAkICAgICAgICAgID0gcmVxdWlyZSgnLi8kJylcbiAgLCBjcmVhdGVEZXNjID0gcmVxdWlyZSgnLi8kLnByb3BlcnR5LWRlc2MnKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi8kLmRlc2NyaXB0b3JzJykgPyBmdW5jdGlvbihvYmplY3QsIGtleSwgdmFsdWUpe1xuICByZXR1cm4gJC5zZXREZXNjKG9iamVjdCwga2V5LCBjcmVhdGVEZXNjKDEsIHZhbHVlKSk7XG59IDogZnVuY3Rpb24ob2JqZWN0LCBrZXksIHZhbHVlKXtcbiAgb2JqZWN0W2tleV0gPSB2YWx1ZTtcbiAgcmV0dXJuIG9iamVjdDtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaGlkZS5qc1xuICoqIG1vZHVsZSBpZCA9IDI1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgJE9iamVjdCA9IE9iamVjdDtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGU6ICAgICAkT2JqZWN0LmNyZWF0ZSxcbiAgZ2V0UHJvdG86ICAgJE9iamVjdC5nZXRQcm90b3R5cGVPZixcbiAgaXNFbnVtOiAgICAge30ucHJvcGVydHlJc0VudW1lcmFibGUsXG4gIGdldERlc2M6ICAgICRPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICBzZXREZXNjOiAgICAkT2JqZWN0LmRlZmluZVByb3BlcnR5LFxuICBzZXREZXNjczogICAkT2JqZWN0LmRlZmluZVByb3BlcnRpZXMsXG4gIGdldEtleXM6ICAgICRPYmplY3Qua2V5cyxcbiAgZ2V0TmFtZXM6ICAgJE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzLFxuICBnZXRTeW1ib2xzOiAkT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyxcbiAgZWFjaDogICAgICAgW10uZm9yRWFjaFxufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5qc1xuICoqIG1vZHVsZSBpZCA9IDI2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGJpdG1hcCwgdmFsdWUpe1xuICByZXR1cm4ge1xuICAgIGVudW1lcmFibGUgIDogIShiaXRtYXAgJiAxKSxcbiAgICBjb25maWd1cmFibGU6ICEoYml0bWFwICYgMiksXG4gICAgd3JpdGFibGUgICAgOiAhKGJpdG1hcCAmIDQpLFxuICAgIHZhbHVlICAgICAgIDogdmFsdWVcbiAgfTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQucHJvcGVydHktZGVzYy5qc1xuICoqIG1vZHVsZSBpZCA9IDI3XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBUaGFuaydzIElFOCBmb3IgaGlzIGZ1bm55IGRlZmluZVByb3BlcnR5XG5tb2R1bGUuZXhwb3J0cyA9ICFyZXF1aXJlKCcuLyQuZmFpbHMnKShmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KHt9LCAnYScsIHtnZXQ6IGZ1bmN0aW9uKCl7IHJldHVybiA3OyB9fSkuYSAhPSA3O1xufSk7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZGVzY3JpcHRvcnMuanNcbiAqKiBtb2R1bGUgaWQgPSAyOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGhhc093blByb3BlcnR5ID0ge30uaGFzT3duUHJvcGVydHk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0LCBrZXkpe1xuICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChpdCwga2V5KTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaGFzLmpzXG4gKiogbW9kdWxlIGlkID0gMjlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0ge307XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlcmF0b3JzLmpzXG4gKiogbW9kdWxlIGlkID0gMzBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcbnZhciAkICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vJCcpXG4gICwgZGVzY3JpcHRvciAgICAgPSByZXF1aXJlKCcuLyQucHJvcGVydHktZGVzYycpXG4gICwgc2V0VG9TdHJpbmdUYWcgPSByZXF1aXJlKCcuLyQuc2V0LXRvLXN0cmluZy10YWcnKVxuICAsIEl0ZXJhdG9yUHJvdG90eXBlID0ge307XG5cbi8vIDI1LjEuMi4xLjEgJUl0ZXJhdG9yUHJvdG90eXBlJVtAQGl0ZXJhdG9yXSgpXG5yZXF1aXJlKCcuLyQuaGlkZScpKEl0ZXJhdG9yUHJvdG90eXBlLCByZXF1aXJlKCcuLyQud2tzJykoJ2l0ZXJhdG9yJyksIGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzOyB9KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihDb25zdHJ1Y3RvciwgTkFNRSwgbmV4dCl7XG4gIENvbnN0cnVjdG9yLnByb3RvdHlwZSA9ICQuY3JlYXRlKEl0ZXJhdG9yUHJvdG90eXBlLCB7bmV4dDogZGVzY3JpcHRvcigxLCBuZXh0KX0pO1xuICBzZXRUb1N0cmluZ1RhZyhDb25zdHJ1Y3RvciwgTkFNRSArICcgSXRlcmF0b3InKTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlci1jcmVhdGUuanNcbiAqKiBtb2R1bGUgaWQgPSAzMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGRlZiA9IHJlcXVpcmUoJy4vJCcpLnNldERlc2NcbiAgLCBoYXMgPSByZXF1aXJlKCcuLyQuaGFzJylcbiAgLCBUQUcgPSByZXF1aXJlKCcuLyQud2tzJykoJ3RvU3RyaW5nVGFnJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQsIHRhZywgc3RhdCl7XG4gIGlmKGl0ICYmICFoYXMoaXQgPSBzdGF0ID8gaXQgOiBpdC5wcm90b3R5cGUsIFRBRykpZGVmKGl0LCBUQUcsIHtjb25maWd1cmFibGU6IHRydWUsIHZhbHVlOiB0YWd9KTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuc2V0LXRvLXN0cmluZy10YWcuanNcbiAqKiBtb2R1bGUgaWQgPSAzMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIHN0b3JlICA9IHJlcXVpcmUoJy4vJC5zaGFyZWQnKSgnd2tzJylcbiAgLCB1aWQgICAgPSByZXF1aXJlKCcuLyQudWlkJylcbiAgLCBTeW1ib2wgPSByZXF1aXJlKCcuLyQuZ2xvYmFsJykuU3ltYm9sO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihuYW1lKXtcbiAgcmV0dXJuIHN0b3JlW25hbWVdIHx8IChzdG9yZVtuYW1lXSA9XG4gICAgU3ltYm9sICYmIFN5bWJvbFtuYW1lXSB8fCAoU3ltYm9sIHx8IHVpZCkoJ1N5bWJvbC4nICsgbmFtZSkpO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC53a3MuanNcbiAqKiBtb2R1bGUgaWQgPSAzM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGdsb2JhbCA9IHJlcXVpcmUoJy4vJC5nbG9iYWwnKVxuICAsIFNIQVJFRCA9ICdfX2NvcmUtanNfc2hhcmVkX18nXG4gICwgc3RvcmUgID0gZ2xvYmFsW1NIQVJFRF0gfHwgKGdsb2JhbFtTSEFSRURdID0ge30pO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihrZXkpe1xuICByZXR1cm4gc3RvcmVba2V5XSB8fCAoc3RvcmVba2V5XSA9IHt9KTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuc2hhcmVkLmpzXG4gKiogbW9kdWxlIGlkID0gMzRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBpZCA9IDBcbiAgLCBweCA9IE1hdGgucmFuZG9tKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGtleSl7XG4gIHJldHVybiAnU3ltYm9sKCcuY29uY2F0KGtleSA9PT0gdW5kZWZpbmVkID8gJycgOiBrZXksICcpXycsICgrK2lkICsgcHgpLnRvU3RyaW5nKDM2KSk7XG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnVpZC5qc1xuICoqIG1vZHVsZSBpZCA9IDM1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCc7XG52YXIgY3R4ICAgICAgICAgPSByZXF1aXJlKCcuLyQuY3R4JylcbiAgLCAkZXhwb3J0ICAgICA9IHJlcXVpcmUoJy4vJC5leHBvcnQnKVxuICAsIHRvT2JqZWN0ICAgID0gcmVxdWlyZSgnLi8kLnRvLW9iamVjdCcpXG4gICwgY2FsbCAgICAgICAgPSByZXF1aXJlKCcuLyQuaXRlci1jYWxsJylcbiAgLCBpc0FycmF5SXRlciA9IHJlcXVpcmUoJy4vJC5pcy1hcnJheS1pdGVyJylcbiAgLCB0b0xlbmd0aCAgICA9IHJlcXVpcmUoJy4vJC50by1sZW5ndGgnKVxuICAsIGdldEl0ZXJGbiAgID0gcmVxdWlyZSgnLi9jb3JlLmdldC1pdGVyYXRvci1tZXRob2QnKTtcbiRleHBvcnQoJGV4cG9ydC5TICsgJGV4cG9ydC5GICogIXJlcXVpcmUoJy4vJC5pdGVyLWRldGVjdCcpKGZ1bmN0aW9uKGl0ZXIpeyBBcnJheS5mcm9tKGl0ZXIpOyB9KSwgJ0FycmF5Jywge1xuICAvLyAyMi4xLjIuMSBBcnJheS5mcm9tKGFycmF5TGlrZSwgbWFwZm4gPSB1bmRlZmluZWQsIHRoaXNBcmcgPSB1bmRlZmluZWQpXG4gIGZyb206IGZ1bmN0aW9uIGZyb20oYXJyYXlMaWtlLyosIG1hcGZuID0gdW5kZWZpbmVkLCB0aGlzQXJnID0gdW5kZWZpbmVkKi8pe1xuICAgIHZhciBPICAgICAgID0gdG9PYmplY3QoYXJyYXlMaWtlKVxuICAgICAgLCBDICAgICAgID0gdHlwZW9mIHRoaXMgPT0gJ2Z1bmN0aW9uJyA/IHRoaXMgOiBBcnJheVxuICAgICAgLCAkJCAgICAgID0gYXJndW1lbnRzXG4gICAgICAsICQkbGVuICAgPSAkJC5sZW5ndGhcbiAgICAgICwgbWFwZm4gICA9ICQkbGVuID4gMSA/ICQkWzFdIDogdW5kZWZpbmVkXG4gICAgICAsIG1hcHBpbmcgPSBtYXBmbiAhPT0gdW5kZWZpbmVkXG4gICAgICAsIGluZGV4ICAgPSAwXG4gICAgICAsIGl0ZXJGbiAgPSBnZXRJdGVyRm4oTylcbiAgICAgICwgbGVuZ3RoLCByZXN1bHQsIHN0ZXAsIGl0ZXJhdG9yO1xuICAgIGlmKG1hcHBpbmcpbWFwZm4gPSBjdHgobWFwZm4sICQkbGVuID4gMiA/ICQkWzJdIDogdW5kZWZpbmVkLCAyKTtcbiAgICAvLyBpZiBvYmplY3QgaXNuJ3QgaXRlcmFibGUgb3IgaXQncyBhcnJheSB3aXRoIGRlZmF1bHQgaXRlcmF0b3IgLSB1c2Ugc2ltcGxlIGNhc2VcbiAgICBpZihpdGVyRm4gIT0gdW5kZWZpbmVkICYmICEoQyA9PSBBcnJheSAmJiBpc0FycmF5SXRlcihpdGVyRm4pKSl7XG4gICAgICBmb3IoaXRlcmF0b3IgPSBpdGVyRm4uY2FsbChPKSwgcmVzdWx0ID0gbmV3IEM7ICEoc3RlcCA9IGl0ZXJhdG9yLm5leHQoKSkuZG9uZTsgaW5kZXgrKyl7XG4gICAgICAgIHJlc3VsdFtpbmRleF0gPSBtYXBwaW5nID8gY2FsbChpdGVyYXRvciwgbWFwZm4sIFtzdGVwLnZhbHVlLCBpbmRleF0sIHRydWUpIDogc3RlcC52YWx1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGVuZ3RoID0gdG9MZW5ndGgoTy5sZW5ndGgpO1xuICAgICAgZm9yKHJlc3VsdCA9IG5ldyBDKGxlbmd0aCk7IGxlbmd0aCA+IGluZGV4OyBpbmRleCsrKXtcbiAgICAgICAgcmVzdWx0W2luZGV4XSA9IG1hcHBpbmcgPyBtYXBmbihPW2luZGV4XSwgaW5kZXgpIDogT1tpbmRleF07XG4gICAgICB9XG4gICAgfVxuICAgIHJlc3VsdC5sZW5ndGggPSBpbmRleDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59KTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuYXJyYXkuZnJvbS5qc1xuICoqIG1vZHVsZSBpZCA9IDM2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBjYWxsIHNvbWV0aGluZyBvbiBpdGVyYXRvciBzdGVwIHdpdGggc2FmZSBjbG9zaW5nIG9uIGVycm9yXG52YXIgYW5PYmplY3QgPSByZXF1aXJlKCcuLyQuYW4tb2JqZWN0Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0ZXJhdG9yLCBmbiwgdmFsdWUsIGVudHJpZXMpe1xuICB0cnkge1xuICAgIHJldHVybiBlbnRyaWVzID8gZm4oYW5PYmplY3QodmFsdWUpWzBdLCB2YWx1ZVsxXSkgOiBmbih2YWx1ZSk7XG4gIC8vIDcuNC42IEl0ZXJhdG9yQ2xvc2UoaXRlcmF0b3IsIGNvbXBsZXRpb24pXG4gIH0gY2F0Y2goZSl7XG4gICAgdmFyIHJldCA9IGl0ZXJhdG9yWydyZXR1cm4nXTtcbiAgICBpZihyZXQgIT09IHVuZGVmaW5lZClhbk9iamVjdChyZXQuY2FsbChpdGVyYXRvcikpO1xuICAgIHRocm93IGU7XG4gIH1cbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlci1jYWxsLmpzXG4gKiogbW9kdWxlIGlkID0gMzdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vJC5pcy1vYmplY3QnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICBpZighaXNPYmplY3QoaXQpKXRocm93IFR5cGVFcnJvcihpdCArICcgaXMgbm90IGFuIG9iamVjdCEnKTtcbiAgcmV0dXJuIGl0O1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5hbi1vYmplY3QuanNcbiAqKiBtb2R1bGUgaWQgPSAzOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiB0eXBlb2YgaXQgPT09ICdvYmplY3QnID8gaXQgIT09IG51bGwgOiB0eXBlb2YgaXQgPT09ICdmdW5jdGlvbic7XG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmlzLW9iamVjdC5qc1xuICoqIG1vZHVsZSBpZCA9IDM5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBjaGVjayBvbiBkZWZhdWx0IEFycmF5IGl0ZXJhdG9yXG52YXIgSXRlcmF0b3JzICA9IHJlcXVpcmUoJy4vJC5pdGVyYXRvcnMnKVxuICAsIElURVJBVE9SICAgPSByZXF1aXJlKCcuLyQud2tzJykoJ2l0ZXJhdG9yJylcbiAgLCBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIGl0ICE9PSB1bmRlZmluZWQgJiYgKEl0ZXJhdG9ycy5BcnJheSA9PT0gaXQgfHwgQXJyYXlQcm90b1tJVEVSQVRPUl0gPT09IGl0KTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXMtYXJyYXktaXRlci5qc1xuICoqIG1vZHVsZSBpZCA9IDQwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyA3LjEuMTUgVG9MZW5ndGhcbnZhciB0b0ludGVnZXIgPSByZXF1aXJlKCcuLyQudG8taW50ZWdlcicpXG4gICwgbWluICAgICAgID0gTWF0aC5taW47XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIGl0ID4gMCA/IG1pbih0b0ludGVnZXIoaXQpLCAweDFmZmZmZmZmZmZmZmZmKSA6IDA7IC8vIHBvdygyLCA1MykgLSAxID09IDkwMDcxOTkyNTQ3NDA5OTFcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudG8tbGVuZ3RoLmpzXG4gKiogbW9kdWxlIGlkID0gNDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBjbGFzc29mICAgPSByZXF1aXJlKCcuLyQuY2xhc3NvZicpXG4gICwgSVRFUkFUT1IgID0gcmVxdWlyZSgnLi8kLndrcycpKCdpdGVyYXRvcicpXG4gICwgSXRlcmF0b3JzID0gcmVxdWlyZSgnLi8kLml0ZXJhdG9ycycpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLyQuY29yZScpLmdldEl0ZXJhdG9yTWV0aG9kID0gZnVuY3Rpb24oaXQpe1xuICBpZihpdCAhPSB1bmRlZmluZWQpcmV0dXJuIGl0W0lURVJBVE9SXVxuICAgIHx8IGl0WydAQGl0ZXJhdG9yJ11cbiAgICB8fCBJdGVyYXRvcnNbY2xhc3NvZihpdCldO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvY29yZS5nZXQtaXRlcmF0b3ItbWV0aG9kLmpzXG4gKiogbW9kdWxlIGlkID0gNDJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIGdldHRpbmcgdGFnIGZyb20gMTkuMS4zLjYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZygpXG52YXIgY29mID0gcmVxdWlyZSgnLi8kLmNvZicpXG4gICwgVEFHID0gcmVxdWlyZSgnLi8kLndrcycpKCd0b1N0cmluZ1RhZycpXG4gIC8vIEVTMyB3cm9uZyBoZXJlXG4gICwgQVJHID0gY29mKGZ1bmN0aW9uKCl7IHJldHVybiBhcmd1bWVudHM7IH0oKSkgPT0gJ0FyZ3VtZW50cyc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICB2YXIgTywgVCwgQjtcbiAgcmV0dXJuIGl0ID09PSB1bmRlZmluZWQgPyAnVW5kZWZpbmVkJyA6IGl0ID09PSBudWxsID8gJ051bGwnXG4gICAgLy8gQEB0b1N0cmluZ1RhZyBjYXNlXG4gICAgOiB0eXBlb2YgKFQgPSAoTyA9IE9iamVjdChpdCkpW1RBR10pID09ICdzdHJpbmcnID8gVFxuICAgIC8vIGJ1aWx0aW5UYWcgY2FzZVxuICAgIDogQVJHID8gY29mKE8pXG4gICAgLy8gRVMzIGFyZ3VtZW50cyBmYWxsYmFja1xuICAgIDogKEIgPSBjb2YoTykpID09ICdPYmplY3QnICYmIHR5cGVvZiBPLmNhbGxlZSA9PSAnZnVuY3Rpb24nID8gJ0FyZ3VtZW50cycgOiBCO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jbGFzc29mLmpzXG4gKiogbW9kdWxlIGlkID0gNDNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoaXQpLnNsaWNlKDgsIC0xKTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuY29mLmpzXG4gKiogbW9kdWxlIGlkID0gNDRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBJVEVSQVRPUiAgICAgPSByZXF1aXJlKCcuLyQud2tzJykoJ2l0ZXJhdG9yJylcbiAgLCBTQUZFX0NMT1NJTkcgPSBmYWxzZTtcblxudHJ5IHtcbiAgdmFyIHJpdGVyID0gWzddW0lURVJBVE9SXSgpO1xuICByaXRlclsncmV0dXJuJ10gPSBmdW5jdGlvbigpeyBTQUZFX0NMT1NJTkcgPSB0cnVlOyB9O1xuICBBcnJheS5mcm9tKHJpdGVyLCBmdW5jdGlvbigpeyB0aHJvdyAyOyB9KTtcbn0gY2F0Y2goZSl7IC8qIGVtcHR5ICovIH1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihleGVjLCBza2lwQ2xvc2luZyl7XG4gIGlmKCFza2lwQ2xvc2luZyAmJiAhU0FGRV9DTE9TSU5HKXJldHVybiBmYWxzZTtcbiAgdmFyIHNhZmUgPSBmYWxzZTtcbiAgdHJ5IHtcbiAgICB2YXIgYXJyICA9IFs3XVxuICAgICAgLCBpdGVyID0gYXJyW0lURVJBVE9SXSgpO1xuICAgIGl0ZXIubmV4dCA9IGZ1bmN0aW9uKCl7IHNhZmUgPSB0cnVlOyB9O1xuICAgIGFycltJVEVSQVRPUl0gPSBmdW5jdGlvbigpeyByZXR1cm4gaXRlcjsgfTtcbiAgICBleGVjKGFycik7XG4gIH0gY2F0Y2goZSl7IC8qIGVtcHR5ICovIH1cbiAgcmV0dXJuIHNhZmU7XG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLml0ZXItZGV0ZWN0LmpzXG4gKiogbW9kdWxlIGlkID0gNDVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQGV4cG9ydCB7Q2xhc3N9IFNtb290aFNjcm9sbGJhclxuICovXG5cbmltcG9ydCB7IERFRkFVTFRfT1BUSU9OUyB9IGZyb20gJy4vb3B0aW9ucyc7XG5pbXBvcnQgeyBzYkxpc3QgfSBmcm9tICcuL3NoYXJlZC9zYl9saXN0JztcbmltcG9ydCB7XG4gICAgZGVib3VuY2UsXG4gICAgZmluZENoaWxkLFxuICAgIHNldFN0eWxlXG59IGZyb20gJy4vdXRpbHMvaW5kZXgnO1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQ3JlYXRlIHNjcm9sbGJhciBpbnN0YW5jZVxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gY29udGFpbmVyOiB0YXJnZXQgZWxlbWVudFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXTogb3B0aW9uc1xuICovXG5leHBvcnQgY2xhc3MgU21vb3RoU2Nyb2xsYmFyIHtcbiAgICBjb25zdHJ1Y3Rvcihjb250YWluZXIsIG9wdGlvbnMgPSB7fSkge1xuICAgICAgICBzYkxpc3Quc2V0KGNvbnRhaW5lciwgdGhpcyk7XG5cbiAgICAgICAgLy8gbWFrZSBjb250YWluZXIgZm9jdXNhYmxlXG4gICAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJzEnKTtcblxuICAgICAgICAvLyByZXNldCBzY3JvbGwgcG9zaXRpb25cbiAgICAgICAgY29udGFpbmVyLnNjcm9sbFRvcCA9IGNvbnRhaW5lci5zY3JvbGxMZWZ0ID0gMDtcblxuICAgICAgICBzZXRTdHlsZShjb250YWluZXIsIHtcbiAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgICAgICAgIG91dGxpbmU6ICdub25lJ1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCB0cmFja1ggPSBmaW5kQ2hpbGQoY29udGFpbmVyLCAnc2Nyb2xsYmFyLXRyYWNrLXgnKTtcbiAgICAgICAgY29uc3QgdHJhY2tZID0gZmluZENoaWxkKGNvbnRhaW5lciwgJ3Njcm9sbGJhci10cmFjay15Jyk7XG5cbiAgICAgICAgLy8gcmVhZG9ubHkgcHJvcGVydGllc1xuICAgICAgICB0aGlzLl9fcmVhZG9ubHkoJ3RhcmdldHMnLCBPYmplY3QuZnJlZXplKHtcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIGNvbnRlbnQ6IGZpbmRDaGlsZChjb250YWluZXIsICdzY3JvbGwtY29udGVudCcpLFxuICAgICAgICAgICAgeEF4aXM6IE9iamVjdC5mcmVlemUoe1xuICAgICAgICAgICAgICAgIHRyYWNrOiB0cmFja1gsXG4gICAgICAgICAgICAgICAgdGh1bWI6IGZpbmRDaGlsZCh0cmFja1gsICdzY3JvbGxiYXItdGh1bWIteCcpXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHlBeGlzOiBPYmplY3QuZnJlZXplKHtcbiAgICAgICAgICAgICAgICB0cmFjazogdHJhY2tZLFxuICAgICAgICAgICAgICAgIHRodW1iOiBmaW5kQ2hpbGQodHJhY2tZLCAnc2Nyb2xsYmFyLXRodW1iLXknKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSkpXG4gICAgICAgIC5fX3JlYWRvbmx5KCdvZmZzZXQnLCB7XG4gICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgeTogMFxuICAgICAgICB9KVxuICAgICAgICAuX19yZWFkb25seSgnbGltaXQnLCB7XG4gICAgICAgICAgICB4OiBJbmZpbml0eSxcbiAgICAgICAgICAgIHk6IEluZmluaXR5XG4gICAgICAgIH0pXG4gICAgICAgIC5fX3JlYWRvbmx5KCdtb3ZlbWVudCcsIHtcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICB5OiAwXG4gICAgICAgIH0pXG4gICAgICAgIC5fX3JlYWRvbmx5KCdzaXplJywgdGhpcy5nZXRTaXplKCkpXG4gICAgICAgIC5fX3JlYWRvbmx5KCdvcHRpb25zJywgT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9PUFRJT05TKSk7XG5cbiAgICAgICAgLy8gbm9uLWVubXVyYWJsZSBwcm9wZXJ0aWVzXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICAgICAgIF9fdXBkYXRlVGhyb3R0bGU6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogZGVib3VuY2UoOjp0aGlzLnVwZGF0ZSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfX2xpc3RlbmVyczoge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBbXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9faGFuZGxlcnM6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogW11cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfX2NoaWxkcmVuOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IFtdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX190aW1lcklEOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fX2luaXRTY3JvbGxiYXIoKTtcbiAgICB9XG59XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc21vb3RoX3Njcm9sbGJhci5qc1xuICoqLyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xuICB9XG59O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrLmpzXG4gKiogbW9kdWxlIGlkID0gNDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvZnJlZXplXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9mcmVlemUuanNcbiAqKiBtb2R1bGUgaWQgPSA0OFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYub2JqZWN0LmZyZWV6ZScpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzLyQuY29yZScpLk9iamVjdC5mcmVlemU7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvZnJlZXplLmpzXG4gKiogbW9kdWxlIGlkID0gNDlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIDE5LjEuMi41IE9iamVjdC5mcmVlemUoTylcbnZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vJC5pcy1vYmplY3QnKTtcblxucmVxdWlyZSgnLi8kLm9iamVjdC1zYXAnKSgnZnJlZXplJywgZnVuY3Rpb24oJGZyZWV6ZSl7XG4gIHJldHVybiBmdW5jdGlvbiBmcmVlemUoaXQpe1xuICAgIHJldHVybiAkZnJlZXplICYmIGlzT2JqZWN0KGl0KSA/ICRmcmVlemUoaXQpIDogaXQ7XG4gIH07XG59KTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm9iamVjdC5mcmVlemUuanNcbiAqKiBtb2R1bGUgaWQgPSA1MFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9hc3NpZ25cIiksIF9fZXNNb2R1bGU6IHRydWUgfTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2Fzc2lnbi5qc1xuICoqIG1vZHVsZSBpZCA9IDUxXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJyZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5vYmplY3QuYXNzaWduJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvJC5jb3JlJykuT2JqZWN0LmFzc2lnbjtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9hc3NpZ24uanNcbiAqKiBtb2R1bGUgaWQgPSA1MlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gMTkuMS4zLjEgT2JqZWN0LmFzc2lnbih0YXJnZXQsIHNvdXJjZSlcbnZhciAkZXhwb3J0ID0gcmVxdWlyZSgnLi8kLmV4cG9ydCcpO1xuXG4kZXhwb3J0KCRleHBvcnQuUyArICRleHBvcnQuRiwgJ09iamVjdCcsIHthc3NpZ246IHJlcXVpcmUoJy4vJC5vYmplY3QtYXNzaWduJyl9KTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm9iamVjdC5hc3NpZ24uanNcbiAqKiBtb2R1bGUgaWQgPSA1M1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gMTkuMS4yLjEgT2JqZWN0LmFzc2lnbih0YXJnZXQsIHNvdXJjZSwgLi4uKVxudmFyICQgICAgICAgID0gcmVxdWlyZSgnLi8kJylcbiAgLCB0b09iamVjdCA9IHJlcXVpcmUoJy4vJC50by1vYmplY3QnKVxuICAsIElPYmplY3QgID0gcmVxdWlyZSgnLi8kLmlvYmplY3QnKTtcblxuLy8gc2hvdWxkIHdvcmsgd2l0aCBzeW1ib2xzIGFuZCBzaG91bGQgaGF2ZSBkZXRlcm1pbmlzdGljIHByb3BlcnR5IG9yZGVyIChWOCBidWcpXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vJC5mYWlscycpKGZ1bmN0aW9uKCl7XG4gIHZhciBhID0gT2JqZWN0LmFzc2lnblxuICAgICwgQSA9IHt9XG4gICAgLCBCID0ge31cbiAgICAsIFMgPSBTeW1ib2woKVxuICAgICwgSyA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdCc7XG4gIEFbU10gPSA3O1xuICBLLnNwbGl0KCcnKS5mb3JFYWNoKGZ1bmN0aW9uKGspeyBCW2tdID0gazsgfSk7XG4gIHJldHVybiBhKHt9LCBBKVtTXSAhPSA3IHx8IE9iamVjdC5rZXlzKGEoe30sIEIpKS5qb2luKCcnKSAhPSBLO1xufSkgPyBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0LCBzb3VyY2UpeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIHZhciBUICAgICA9IHRvT2JqZWN0KHRhcmdldClcbiAgICAsICQkICAgID0gYXJndW1lbnRzXG4gICAgLCAkJGxlbiA9ICQkLmxlbmd0aFxuICAgICwgaW5kZXggPSAxXG4gICAgLCBnZXRLZXlzICAgID0gJC5nZXRLZXlzXG4gICAgLCBnZXRTeW1ib2xzID0gJC5nZXRTeW1ib2xzXG4gICAgLCBpc0VudW0gICAgID0gJC5pc0VudW07XG4gIHdoaWxlKCQkbGVuID4gaW5kZXgpe1xuICAgIHZhciBTICAgICAgPSBJT2JqZWN0KCQkW2luZGV4KytdKVxuICAgICAgLCBrZXlzICAgPSBnZXRTeW1ib2xzID8gZ2V0S2V5cyhTKS5jb25jYXQoZ2V0U3ltYm9scyhTKSkgOiBnZXRLZXlzKFMpXG4gICAgICAsIGxlbmd0aCA9IGtleXMubGVuZ3RoXG4gICAgICAsIGogICAgICA9IDBcbiAgICAgICwga2V5O1xuICAgIHdoaWxlKGxlbmd0aCA+IGopaWYoaXNFbnVtLmNhbGwoUywga2V5ID0ga2V5c1tqKytdKSlUW2tleV0gPSBTW2tleV07XG4gIH1cbiAgcmV0dXJuIFQ7XG59IDogT2JqZWN0LmFzc2lnbjtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5vYmplY3QtYXNzaWduLmpzXG4gKiogbW9kdWxlIGlkID0gNTRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIGZhbGxiYWNrIGZvciBub24tYXJyYXktbGlrZSBFUzMgYW5kIG5vbi1lbnVtZXJhYmxlIG9sZCBWOCBzdHJpbmdzXG52YXIgY29mID0gcmVxdWlyZSgnLi8kLmNvZicpO1xubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QoJ3onKS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgwKSA/IE9iamVjdCA6IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIGNvZihpdCkgPT0gJ1N0cmluZycgPyBpdC5zcGxpdCgnJykgOiBPYmplY3QoaXQpO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5pb2JqZWN0LmpzXG4gKiogbW9kdWxlIGlkID0gNTVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvZGVmaW5lLXByb3BlcnRpZXNcIiksIF9fZXNNb2R1bGU6IHRydWUgfTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2RlZmluZS1wcm9wZXJ0aWVzLmpzXG4gKiogbW9kdWxlIGlkID0gNTZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciAkID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXMoVCwgRCl7XG4gIHJldHVybiAkLnNldERlc2NzKFQsIEQpO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9kZWZpbmUtcHJvcGVydGllcy5qc1xuICoqIG1vZHVsZSBpZCA9IDU3XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJleHBvcnQgY29uc3QgREVGQVVMVF9PUFRJT05TID0ge1xuICAgIHNwZWVkOiAxLCAvLyBzY3JvbGwgc3BlZWQgc2NhbGVcbiAgICBmcmljdG9uOiAxMCAvLyBmcmljdG9uIGZhY3RvciwgcGVyY2VudFxufTtcblxuZXhwb3J0IGNvbnN0IE9QVElPTl9MSU1JVCA9IHtcbiAgICBmcmljdG9uOiBbMSwgOTldLFxuICAgIHNwZWVkOiBbMCwgSW5maW5pdHldXG59O1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL29wdGlvbnMuanNcbiAqKi8iLCIvKipcbiAqIEBtb2R1bGVcbiAqIEBleHBvcnQge01hcH0gc2JMaXN0XG4gKi9cblxuY29uc3Qgc2JMaXN0ID0gbmV3IE1hcCgpO1xuXG5jb25zdCBvcmlnaW5TZXQgPSA6OnNiTGlzdC5zZXQ7XG5cbnNiTGlzdC51cGRhdGUgPSAoKSA9PiB7XG4gICAgc2JMaXN0LmZvckVhY2goKHNiKSA9PiB7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICBzYi5fX3VwZGF0ZUNoaWxkcmVuKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLy8gcGF0Y2ggI3NldCB3aXRoICN1cGRhdGUgbWV0aG9kXG5zYkxpc3Quc2V0ID0gKC4uLmFyZ3MpID0+IHtcbiAgICBjb25zdCByZXMgPSBvcmlnaW5TZXQoLi4uYXJncyk7XG4gICAgc2JMaXN0LnVwZGF0ZSgpO1xuXG4gICAgcmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCB7IHNiTGlzdCB9O1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3NoYXJlZC9zYl9saXN0LmpzXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL21hcFwiKSwgX19lc01vZHVsZTogdHJ1ZSB9O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9tYXAuanNcbiAqKiBtb2R1bGUgaWQgPSA2MFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwicmVxdWlyZSgnLi4vbW9kdWxlcy9lczYub2JqZWN0LnRvLXN0cmluZycpO1xucmVxdWlyZSgnLi4vbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yJyk7XG5yZXF1aXJlKCcuLi9tb2R1bGVzL3dlYi5kb20uaXRlcmFibGUnKTtcbnJlcXVpcmUoJy4uL21vZHVsZXMvZXM2Lm1hcCcpO1xucmVxdWlyZSgnLi4vbW9kdWxlcy9lczcubWFwLnRvLWpzb24nKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy8kLmNvcmUnKS5NYXA7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9mbi9tYXAuanNcbiAqKiBtb2R1bGUgaWQgPSA2MVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwicmVxdWlyZSgnLi9lczYuYXJyYXkuaXRlcmF0b3InKTtcbnZhciBJdGVyYXRvcnMgPSByZXF1aXJlKCcuLyQuaXRlcmF0b3JzJyk7XG5JdGVyYXRvcnMuTm9kZUxpc3QgPSBJdGVyYXRvcnMuSFRNTENvbGxlY3Rpb24gPSBJdGVyYXRvcnMuQXJyYXk7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL3dlYi5kb20uaXRlcmFibGUuanNcbiAqKiBtb2R1bGUgaWQgPSA2M1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGFkZFRvVW5zY29wYWJsZXMgPSByZXF1aXJlKCcuLyQuYWRkLXRvLXVuc2NvcGFibGVzJylcbiAgLCBzdGVwICAgICAgICAgICAgID0gcmVxdWlyZSgnLi8kLml0ZXItc3RlcCcpXG4gICwgSXRlcmF0b3JzICAgICAgICA9IHJlcXVpcmUoJy4vJC5pdGVyYXRvcnMnKVxuICAsIHRvSU9iamVjdCAgICAgICAgPSByZXF1aXJlKCcuLyQudG8taW9iamVjdCcpO1xuXG4vLyAyMi4xLjMuNCBBcnJheS5wcm90b3R5cGUuZW50cmllcygpXG4vLyAyMi4xLjMuMTMgQXJyYXkucHJvdG90eXBlLmtleXMoKVxuLy8gMjIuMS4zLjI5IEFycmF5LnByb3RvdHlwZS52YWx1ZXMoKVxuLy8gMjIuMS4zLjMwIEFycmF5LnByb3RvdHlwZVtAQGl0ZXJhdG9yXSgpXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vJC5pdGVyLWRlZmluZScpKEFycmF5LCAnQXJyYXknLCBmdW5jdGlvbihpdGVyYXRlZCwga2luZCl7XG4gIHRoaXMuX3QgPSB0b0lPYmplY3QoaXRlcmF0ZWQpOyAvLyB0YXJnZXRcbiAgdGhpcy5faSA9IDA7ICAgICAgICAgICAgICAgICAgIC8vIG5leHQgaW5kZXhcbiAgdGhpcy5fayA9IGtpbmQ7ICAgICAgICAgICAgICAgIC8vIGtpbmRcbi8vIDIyLjEuNS4yLjEgJUFycmF5SXRlcmF0b3JQcm90b3R5cGUlLm5leHQoKVxufSwgZnVuY3Rpb24oKXtcbiAgdmFyIE8gICAgID0gdGhpcy5fdFxuICAgICwga2luZCAgPSB0aGlzLl9rXG4gICAgLCBpbmRleCA9IHRoaXMuX2krKztcbiAgaWYoIU8gfHwgaW5kZXggPj0gTy5sZW5ndGgpe1xuICAgIHRoaXMuX3QgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHN0ZXAoMSk7XG4gIH1cbiAgaWYoa2luZCA9PSAna2V5cycgIClyZXR1cm4gc3RlcCgwLCBpbmRleCk7XG4gIGlmKGtpbmQgPT0gJ3ZhbHVlcycpcmV0dXJuIHN0ZXAoMCwgT1tpbmRleF0pO1xuICByZXR1cm4gc3RlcCgwLCBbaW5kZXgsIE9baW5kZXhdXSk7XG59LCAndmFsdWVzJyk7XG5cbi8vIGFyZ3VtZW50c0xpc3RbQEBpdGVyYXRvcl0gaXMgJUFycmF5UHJvdG9fdmFsdWVzJSAoOS40LjQuNiwgOS40LjQuNylcbkl0ZXJhdG9ycy5Bcmd1bWVudHMgPSBJdGVyYXRvcnMuQXJyYXk7XG5cbmFkZFRvVW5zY29wYWJsZXMoJ2tleXMnKTtcbmFkZFRvVW5zY29wYWJsZXMoJ3ZhbHVlcycpO1xuYWRkVG9VbnNjb3BhYmxlcygnZW50cmllcycpO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuYXJyYXkuaXRlcmF0b3IuanNcbiAqKiBtb2R1bGUgaWQgPSA2NFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpeyAvKiBlbXB0eSAqLyB9O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmFkZC10by11bnNjb3BhYmxlcy5qc1xuICoqIG1vZHVsZSBpZCA9IDY1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRvbmUsIHZhbHVlKXtcbiAgcmV0dXJuIHt2YWx1ZTogdmFsdWUsIGRvbmU6ICEhZG9uZX07XG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLml0ZXItc3RlcC5qc1xuICoqIG1vZHVsZSBpZCA9IDY2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyB0byBpbmRleGVkIG9iamVjdCwgdG9PYmplY3Qgd2l0aCBmYWxsYmFjayBmb3Igbm9uLWFycmF5LWxpa2UgRVMzIHN0cmluZ3NcbnZhciBJT2JqZWN0ID0gcmVxdWlyZSgnLi8kLmlvYmplY3QnKVxuICAsIGRlZmluZWQgPSByZXF1aXJlKCcuLyQuZGVmaW5lZCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBJT2JqZWN0KGRlZmluZWQoaXQpKTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudG8taW9iamVjdC5qc1xuICoqIG1vZHVsZSBpZCA9IDY3XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCc7XG52YXIgc3Ryb25nID0gcmVxdWlyZSgnLi8kLmNvbGxlY3Rpb24tc3Ryb25nJyk7XG5cbi8vIDIzLjEgTWFwIE9iamVjdHNcbnJlcXVpcmUoJy4vJC5jb2xsZWN0aW9uJykoJ01hcCcsIGZ1bmN0aW9uKGdldCl7XG4gIHJldHVybiBmdW5jdGlvbiBNYXAoKXsgcmV0dXJuIGdldCh0aGlzLCBhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IHVuZGVmaW5lZCk7IH07XG59LCB7XG4gIC8vIDIzLjEuMy42IE1hcC5wcm90b3R5cGUuZ2V0KGtleSlcbiAgZ2V0OiBmdW5jdGlvbiBnZXQoa2V5KXtcbiAgICB2YXIgZW50cnkgPSBzdHJvbmcuZ2V0RW50cnkodGhpcywga2V5KTtcbiAgICByZXR1cm4gZW50cnkgJiYgZW50cnkudjtcbiAgfSxcbiAgLy8gMjMuMS4zLjkgTWFwLnByb3RvdHlwZS5zZXQoa2V5LCB2YWx1ZSlcbiAgc2V0OiBmdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSl7XG4gICAgcmV0dXJuIHN0cm9uZy5kZWYodGhpcywga2V5ID09PSAwID8gMCA6IGtleSwgdmFsdWUpO1xuICB9XG59LCBzdHJvbmcsIHRydWUpO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYubWFwLmpzXG4gKiogbW9kdWxlIGlkID0gNjhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcbnZhciAkICAgICAgICAgICAgPSByZXF1aXJlKCcuLyQnKVxuICAsIGhpZGUgICAgICAgICA9IHJlcXVpcmUoJy4vJC5oaWRlJylcbiAgLCByZWRlZmluZUFsbCAgPSByZXF1aXJlKCcuLyQucmVkZWZpbmUtYWxsJylcbiAgLCBjdHggICAgICAgICAgPSByZXF1aXJlKCcuLyQuY3R4JylcbiAgLCBzdHJpY3ROZXcgICAgPSByZXF1aXJlKCcuLyQuc3RyaWN0LW5ldycpXG4gICwgZGVmaW5lZCAgICAgID0gcmVxdWlyZSgnLi8kLmRlZmluZWQnKVxuICAsIGZvck9mICAgICAgICA9IHJlcXVpcmUoJy4vJC5mb3Itb2YnKVxuICAsICRpdGVyRGVmaW5lICA9IHJlcXVpcmUoJy4vJC5pdGVyLWRlZmluZScpXG4gICwgc3RlcCAgICAgICAgID0gcmVxdWlyZSgnLi8kLml0ZXItc3RlcCcpXG4gICwgSUQgICAgICAgICAgID0gcmVxdWlyZSgnLi8kLnVpZCcpKCdpZCcpXG4gICwgJGhhcyAgICAgICAgID0gcmVxdWlyZSgnLi8kLmhhcycpXG4gICwgaXNPYmplY3QgICAgID0gcmVxdWlyZSgnLi8kLmlzLW9iamVjdCcpXG4gICwgc2V0U3BlY2llcyAgID0gcmVxdWlyZSgnLi8kLnNldC1zcGVjaWVzJylcbiAgLCBERVNDUklQVE9SUyAgPSByZXF1aXJlKCcuLyQuZGVzY3JpcHRvcnMnKVxuICAsIGlzRXh0ZW5zaWJsZSA9IE9iamVjdC5pc0V4dGVuc2libGUgfHwgaXNPYmplY3RcbiAgLCBTSVpFICAgICAgICAgPSBERVNDUklQVE9SUyA/ICdfcycgOiAnc2l6ZSdcbiAgLCBpZCAgICAgICAgICAgPSAwO1xuXG52YXIgZmFzdEtleSA9IGZ1bmN0aW9uKGl0LCBjcmVhdGUpe1xuICAvLyByZXR1cm4gcHJpbWl0aXZlIHdpdGggcHJlZml4XG4gIGlmKCFpc09iamVjdChpdCkpcmV0dXJuIHR5cGVvZiBpdCA9PSAnc3ltYm9sJyA/IGl0IDogKHR5cGVvZiBpdCA9PSAnc3RyaW5nJyA/ICdTJyA6ICdQJykgKyBpdDtcbiAgaWYoISRoYXMoaXQsIElEKSl7XG4gICAgLy8gY2FuJ3Qgc2V0IGlkIHRvIGZyb3plbiBvYmplY3RcbiAgICBpZighaXNFeHRlbnNpYmxlKGl0KSlyZXR1cm4gJ0YnO1xuICAgIC8vIG5vdCBuZWNlc3NhcnkgdG8gYWRkIGlkXG4gICAgaWYoIWNyZWF0ZSlyZXR1cm4gJ0UnO1xuICAgIC8vIGFkZCBtaXNzaW5nIG9iamVjdCBpZFxuICAgIGhpZGUoaXQsIElELCArK2lkKTtcbiAgLy8gcmV0dXJuIG9iamVjdCBpZCB3aXRoIHByZWZpeFxuICB9IHJldHVybiAnTycgKyBpdFtJRF07XG59O1xuXG52YXIgZ2V0RW50cnkgPSBmdW5jdGlvbih0aGF0LCBrZXkpe1xuICAvLyBmYXN0IGNhc2VcbiAgdmFyIGluZGV4ID0gZmFzdEtleShrZXkpLCBlbnRyeTtcbiAgaWYoaW5kZXggIT09ICdGJylyZXR1cm4gdGhhdC5faVtpbmRleF07XG4gIC8vIGZyb3plbiBvYmplY3QgY2FzZVxuICBmb3IoZW50cnkgPSB0aGF0Ll9mOyBlbnRyeTsgZW50cnkgPSBlbnRyeS5uKXtcbiAgICBpZihlbnRyeS5rID09IGtleSlyZXR1cm4gZW50cnk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRDb25zdHJ1Y3RvcjogZnVuY3Rpb24od3JhcHBlciwgTkFNRSwgSVNfTUFQLCBBRERFUil7XG4gICAgdmFyIEMgPSB3cmFwcGVyKGZ1bmN0aW9uKHRoYXQsIGl0ZXJhYmxlKXtcbiAgICAgIHN0cmljdE5ldyh0aGF0LCBDLCBOQU1FKTtcbiAgICAgIHRoYXQuX2kgPSAkLmNyZWF0ZShudWxsKTsgLy8gaW5kZXhcbiAgICAgIHRoYXQuX2YgPSB1bmRlZmluZWQ7ICAgICAgLy8gZmlyc3QgZW50cnlcbiAgICAgIHRoYXQuX2wgPSB1bmRlZmluZWQ7ICAgICAgLy8gbGFzdCBlbnRyeVxuICAgICAgdGhhdFtTSVpFXSA9IDA7ICAgICAgICAgICAvLyBzaXplXG4gICAgICBpZihpdGVyYWJsZSAhPSB1bmRlZmluZWQpZm9yT2YoaXRlcmFibGUsIElTX01BUCwgdGhhdFtBRERFUl0sIHRoYXQpO1xuICAgIH0pO1xuICAgIHJlZGVmaW5lQWxsKEMucHJvdG90eXBlLCB7XG4gICAgICAvLyAyMy4xLjMuMSBNYXAucHJvdG90eXBlLmNsZWFyKClcbiAgICAgIC8vIDIzLjIuMy4yIFNldC5wcm90b3R5cGUuY2xlYXIoKVxuICAgICAgY2xlYXI6IGZ1bmN0aW9uIGNsZWFyKCl7XG4gICAgICAgIGZvcih2YXIgdGhhdCA9IHRoaXMsIGRhdGEgPSB0aGF0Ll9pLCBlbnRyeSA9IHRoYXQuX2Y7IGVudHJ5OyBlbnRyeSA9IGVudHJ5Lm4pe1xuICAgICAgICAgIGVudHJ5LnIgPSB0cnVlO1xuICAgICAgICAgIGlmKGVudHJ5LnApZW50cnkucCA9IGVudHJ5LnAubiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBkZWxldGUgZGF0YVtlbnRyeS5pXTtcbiAgICAgICAgfVxuICAgICAgICB0aGF0Ll9mID0gdGhhdC5fbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhhdFtTSVpFXSA9IDA7XG4gICAgICB9LFxuICAgICAgLy8gMjMuMS4zLjMgTWFwLnByb3RvdHlwZS5kZWxldGUoa2V5KVxuICAgICAgLy8gMjMuMi4zLjQgU2V0LnByb3RvdHlwZS5kZWxldGUodmFsdWUpXG4gICAgICAnZGVsZXRlJzogZnVuY3Rpb24oa2V5KXtcbiAgICAgICAgdmFyIHRoYXQgID0gdGhpc1xuICAgICAgICAgICwgZW50cnkgPSBnZXRFbnRyeSh0aGF0LCBrZXkpO1xuICAgICAgICBpZihlbnRyeSl7XG4gICAgICAgICAgdmFyIG5leHQgPSBlbnRyeS5uXG4gICAgICAgICAgICAsIHByZXYgPSBlbnRyeS5wO1xuICAgICAgICAgIGRlbGV0ZSB0aGF0Ll9pW2VudHJ5LmldO1xuICAgICAgICAgIGVudHJ5LnIgPSB0cnVlO1xuICAgICAgICAgIGlmKHByZXYpcHJldi5uID0gbmV4dDtcbiAgICAgICAgICBpZihuZXh0KW5leHQucCA9IHByZXY7XG4gICAgICAgICAgaWYodGhhdC5fZiA9PSBlbnRyeSl0aGF0Ll9mID0gbmV4dDtcbiAgICAgICAgICBpZih0aGF0Ll9sID09IGVudHJ5KXRoYXQuX2wgPSBwcmV2O1xuICAgICAgICAgIHRoYXRbU0laRV0tLTtcbiAgICAgICAgfSByZXR1cm4gISFlbnRyeTtcbiAgICAgIH0sXG4gICAgICAvLyAyMy4yLjMuNiBTZXQucHJvdG90eXBlLmZvckVhY2goY2FsbGJhY2tmbiwgdGhpc0FyZyA9IHVuZGVmaW5lZClcbiAgICAgIC8vIDIzLjEuMy41IE1hcC5wcm90b3R5cGUuZm9yRWFjaChjYWxsYmFja2ZuLCB0aGlzQXJnID0gdW5kZWZpbmVkKVxuICAgICAgZm9yRWFjaDogZnVuY3Rpb24gZm9yRWFjaChjYWxsYmFja2ZuIC8qLCB0aGF0ID0gdW5kZWZpbmVkICovKXtcbiAgICAgICAgdmFyIGYgPSBjdHgoY2FsbGJhY2tmbiwgYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQsIDMpXG4gICAgICAgICAgLCBlbnRyeTtcbiAgICAgICAgd2hpbGUoZW50cnkgPSBlbnRyeSA/IGVudHJ5Lm4gOiB0aGlzLl9mKXtcbiAgICAgICAgICBmKGVudHJ5LnYsIGVudHJ5LmssIHRoaXMpO1xuICAgICAgICAgIC8vIHJldmVydCB0byB0aGUgbGFzdCBleGlzdGluZyBlbnRyeVxuICAgICAgICAgIHdoaWxlKGVudHJ5ICYmIGVudHJ5LnIpZW50cnkgPSBlbnRyeS5wO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgLy8gMjMuMS4zLjcgTWFwLnByb3RvdHlwZS5oYXMoa2V5KVxuICAgICAgLy8gMjMuMi4zLjcgU2V0LnByb3RvdHlwZS5oYXModmFsdWUpXG4gICAgICBoYXM6IGZ1bmN0aW9uIGhhcyhrZXkpe1xuICAgICAgICByZXR1cm4gISFnZXRFbnRyeSh0aGlzLCBrZXkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmKERFU0NSSVBUT1JTKSQuc2V0RGVzYyhDLnByb3RvdHlwZSwgJ3NpemUnLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiBkZWZpbmVkKHRoaXNbU0laRV0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBDO1xuICB9LFxuICBkZWY6IGZ1bmN0aW9uKHRoYXQsIGtleSwgdmFsdWUpe1xuICAgIHZhciBlbnRyeSA9IGdldEVudHJ5KHRoYXQsIGtleSlcbiAgICAgICwgcHJldiwgaW5kZXg7XG4gICAgLy8gY2hhbmdlIGV4aXN0aW5nIGVudHJ5XG4gICAgaWYoZW50cnkpe1xuICAgICAgZW50cnkudiA9IHZhbHVlO1xuICAgIC8vIGNyZWF0ZSBuZXcgZW50cnlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhhdC5fbCA9IGVudHJ5ID0ge1xuICAgICAgICBpOiBpbmRleCA9IGZhc3RLZXkoa2V5LCB0cnVlKSwgLy8gPC0gaW5kZXhcbiAgICAgICAgazoga2V5LCAgICAgICAgICAgICAgICAgICAgICAgIC8vIDwtIGtleVxuICAgICAgICB2OiB2YWx1ZSwgICAgICAgICAgICAgICAgICAgICAgLy8gPC0gdmFsdWVcbiAgICAgICAgcDogcHJldiA9IHRoYXQuX2wsICAgICAgICAgICAgIC8vIDwtIHByZXZpb3VzIGVudHJ5XG4gICAgICAgIG46IHVuZGVmaW5lZCwgICAgICAgICAgICAgICAgICAvLyA8LSBuZXh0IGVudHJ5XG4gICAgICAgIHI6IGZhbHNlICAgICAgICAgICAgICAgICAgICAgICAvLyA8LSByZW1vdmVkXG4gICAgICB9O1xuICAgICAgaWYoIXRoYXQuX2YpdGhhdC5fZiA9IGVudHJ5O1xuICAgICAgaWYocHJldilwcmV2Lm4gPSBlbnRyeTtcbiAgICAgIHRoYXRbU0laRV0rKztcbiAgICAgIC8vIGFkZCB0byBpbmRleFxuICAgICAgaWYoaW5kZXggIT09ICdGJyl0aGF0Ll9pW2luZGV4XSA9IGVudHJ5O1xuICAgIH0gcmV0dXJuIHRoYXQ7XG4gIH0sXG4gIGdldEVudHJ5OiBnZXRFbnRyeSxcbiAgc2V0U3Ryb25nOiBmdW5jdGlvbihDLCBOQU1FLCBJU19NQVApe1xuICAgIC8vIGFkZCAua2V5cywgLnZhbHVlcywgLmVudHJpZXMsIFtAQGl0ZXJhdG9yXVxuICAgIC8vIDIzLjEuMy40LCAyMy4xLjMuOCwgMjMuMS4zLjExLCAyMy4xLjMuMTIsIDIzLjIuMy41LCAyMy4yLjMuOCwgMjMuMi4zLjEwLCAyMy4yLjMuMTFcbiAgICAkaXRlckRlZmluZShDLCBOQU1FLCBmdW5jdGlvbihpdGVyYXRlZCwga2luZCl7XG4gICAgICB0aGlzLl90ID0gaXRlcmF0ZWQ7ICAvLyB0YXJnZXRcbiAgICAgIHRoaXMuX2sgPSBraW5kOyAgICAgIC8vIGtpbmRcbiAgICAgIHRoaXMuX2wgPSB1bmRlZmluZWQ7IC8vIHByZXZpb3VzXG4gICAgfSwgZnVuY3Rpb24oKXtcbiAgICAgIHZhciB0aGF0ICA9IHRoaXNcbiAgICAgICAgLCBraW5kICA9IHRoYXQuX2tcbiAgICAgICAgLCBlbnRyeSA9IHRoYXQuX2w7XG4gICAgICAvLyByZXZlcnQgdG8gdGhlIGxhc3QgZXhpc3RpbmcgZW50cnlcbiAgICAgIHdoaWxlKGVudHJ5ICYmIGVudHJ5LnIpZW50cnkgPSBlbnRyeS5wO1xuICAgICAgLy8gZ2V0IG5leHQgZW50cnlcbiAgICAgIGlmKCF0aGF0Ll90IHx8ICEodGhhdC5fbCA9IGVudHJ5ID0gZW50cnkgPyBlbnRyeS5uIDogdGhhdC5fdC5fZikpe1xuICAgICAgICAvLyBvciBmaW5pc2ggdGhlIGl0ZXJhdGlvblxuICAgICAgICB0aGF0Ll90ID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gc3RlcCgxKTtcbiAgICAgIH1cbiAgICAgIC8vIHJldHVybiBzdGVwIGJ5IGtpbmRcbiAgICAgIGlmKGtpbmQgPT0gJ2tleXMnICApcmV0dXJuIHN0ZXAoMCwgZW50cnkuayk7XG4gICAgICBpZihraW5kID09ICd2YWx1ZXMnKXJldHVybiBzdGVwKDAsIGVudHJ5LnYpO1xuICAgICAgcmV0dXJuIHN0ZXAoMCwgW2VudHJ5LmssIGVudHJ5LnZdKTtcbiAgICB9LCBJU19NQVAgPyAnZW50cmllcycgOiAndmFsdWVzJyAsICFJU19NQVAsIHRydWUpO1xuXG4gICAgLy8gYWRkIFtAQHNwZWNpZXNdLCAyMy4xLjIuMiwgMjMuMi4yLjJcbiAgICBzZXRTcGVjaWVzKE5BTUUpO1xuICB9XG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmNvbGxlY3Rpb24tc3Ryb25nLmpzXG4gKiogbW9kdWxlIGlkID0gNjlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciByZWRlZmluZSA9IHJlcXVpcmUoJy4vJC5yZWRlZmluZScpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0YXJnZXQsIHNyYyl7XG4gIGZvcih2YXIga2V5IGluIHNyYylyZWRlZmluZSh0YXJnZXQsIGtleSwgc3JjW2tleV0pO1xuICByZXR1cm4gdGFyZ2V0O1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5yZWRlZmluZS1hbGwuanNcbiAqKiBtb2R1bGUgaWQgPSA3MFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCwgQ29uc3RydWN0b3IsIG5hbWUpe1xuICBpZighKGl0IGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKXRocm93IFR5cGVFcnJvcihuYW1lICsgXCI6IHVzZSB0aGUgJ25ldycgb3BlcmF0b3IhXCIpO1xuICByZXR1cm4gaXQ7XG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnN0cmljdC1uZXcuanNcbiAqKiBtb2R1bGUgaWQgPSA3MVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGN0eCAgICAgICAgID0gcmVxdWlyZSgnLi8kLmN0eCcpXG4gICwgY2FsbCAgICAgICAgPSByZXF1aXJlKCcuLyQuaXRlci1jYWxsJylcbiAgLCBpc0FycmF5SXRlciA9IHJlcXVpcmUoJy4vJC5pcy1hcnJheS1pdGVyJylcbiAgLCBhbk9iamVjdCAgICA9IHJlcXVpcmUoJy4vJC5hbi1vYmplY3QnKVxuICAsIHRvTGVuZ3RoICAgID0gcmVxdWlyZSgnLi8kLnRvLWxlbmd0aCcpXG4gICwgZ2V0SXRlckZuICAgPSByZXF1aXJlKCcuL2NvcmUuZ2V0LWl0ZXJhdG9yLW1ldGhvZCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdGVyYWJsZSwgZW50cmllcywgZm4sIHRoYXQpe1xuICB2YXIgaXRlckZuID0gZ2V0SXRlckZuKGl0ZXJhYmxlKVxuICAgICwgZiAgICAgID0gY3R4KGZuLCB0aGF0LCBlbnRyaWVzID8gMiA6IDEpXG4gICAgLCBpbmRleCAgPSAwXG4gICAgLCBsZW5ndGgsIHN0ZXAsIGl0ZXJhdG9yO1xuICBpZih0eXBlb2YgaXRlckZuICE9ICdmdW5jdGlvbicpdGhyb3cgVHlwZUVycm9yKGl0ZXJhYmxlICsgJyBpcyBub3QgaXRlcmFibGUhJyk7XG4gIC8vIGZhc3QgY2FzZSBmb3IgYXJyYXlzIHdpdGggZGVmYXVsdCBpdGVyYXRvclxuICBpZihpc0FycmF5SXRlcihpdGVyRm4pKWZvcihsZW5ndGggPSB0b0xlbmd0aChpdGVyYWJsZS5sZW5ndGgpOyBsZW5ndGggPiBpbmRleDsgaW5kZXgrKyl7XG4gICAgZW50cmllcyA/IGYoYW5PYmplY3Qoc3RlcCA9IGl0ZXJhYmxlW2luZGV4XSlbMF0sIHN0ZXBbMV0pIDogZihpdGVyYWJsZVtpbmRleF0pO1xuICB9IGVsc2UgZm9yKGl0ZXJhdG9yID0gaXRlckZuLmNhbGwoaXRlcmFibGUpOyAhKHN0ZXAgPSBpdGVyYXRvci5uZXh0KCkpLmRvbmU7ICl7XG4gICAgY2FsbChpdGVyYXRvciwgZiwgc3RlcC52YWx1ZSwgZW50cmllcyk7XG4gIH1cbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZm9yLW9mLmpzXG4gKiogbW9kdWxlIGlkID0gNzJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcbnZhciBjb3JlICAgICAgICA9IHJlcXVpcmUoJy4vJC5jb3JlJylcbiAgLCAkICAgICAgICAgICA9IHJlcXVpcmUoJy4vJCcpXG4gICwgREVTQ1JJUFRPUlMgPSByZXF1aXJlKCcuLyQuZGVzY3JpcHRvcnMnKVxuICAsIFNQRUNJRVMgICAgID0gcmVxdWlyZSgnLi8kLndrcycpKCdzcGVjaWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oS0VZKXtcbiAgdmFyIEMgPSBjb3JlW0tFWV07XG4gIGlmKERFU0NSSVBUT1JTICYmIEMgJiYgIUNbU1BFQ0lFU10pJC5zZXREZXNjKEMsIFNQRUNJRVMsIHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbigpeyByZXR1cm4gdGhpczsgfVxuICB9KTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuc2V0LXNwZWNpZXMuanNcbiAqKiBtb2R1bGUgaWQgPSA3M1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xudmFyICQgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi8kJylcbiAgLCBnbG9iYWwgICAgICAgICA9IHJlcXVpcmUoJy4vJC5nbG9iYWwnKVxuICAsICRleHBvcnQgICAgICAgID0gcmVxdWlyZSgnLi8kLmV4cG9ydCcpXG4gICwgZmFpbHMgICAgICAgICAgPSByZXF1aXJlKCcuLyQuZmFpbHMnKVxuICAsIGhpZGUgICAgICAgICAgID0gcmVxdWlyZSgnLi8kLmhpZGUnKVxuICAsIHJlZGVmaW5lQWxsICAgID0gcmVxdWlyZSgnLi8kLnJlZGVmaW5lLWFsbCcpXG4gICwgZm9yT2YgICAgICAgICAgPSByZXF1aXJlKCcuLyQuZm9yLW9mJylcbiAgLCBzdHJpY3ROZXcgICAgICA9IHJlcXVpcmUoJy4vJC5zdHJpY3QtbmV3JylcbiAgLCBpc09iamVjdCAgICAgICA9IHJlcXVpcmUoJy4vJC5pcy1vYmplY3QnKVxuICAsIHNldFRvU3RyaW5nVGFnID0gcmVxdWlyZSgnLi8kLnNldC10by1zdHJpbmctdGFnJylcbiAgLCBERVNDUklQVE9SUyAgICA9IHJlcXVpcmUoJy4vJC5kZXNjcmlwdG9ycycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKE5BTUUsIHdyYXBwZXIsIG1ldGhvZHMsIGNvbW1vbiwgSVNfTUFQLCBJU19XRUFLKXtcbiAgdmFyIEJhc2UgID0gZ2xvYmFsW05BTUVdXG4gICAgLCBDICAgICA9IEJhc2VcbiAgICAsIEFEREVSID0gSVNfTUFQID8gJ3NldCcgOiAnYWRkJ1xuICAgICwgcHJvdG8gPSBDICYmIEMucHJvdG90eXBlXG4gICAgLCBPICAgICA9IHt9O1xuICBpZighREVTQ1JJUFRPUlMgfHwgdHlwZW9mIEMgIT0gJ2Z1bmN0aW9uJyB8fCAhKElTX1dFQUsgfHwgcHJvdG8uZm9yRWFjaCAmJiAhZmFpbHMoZnVuY3Rpb24oKXtcbiAgICBuZXcgQygpLmVudHJpZXMoKS5uZXh0KCk7XG4gIH0pKSl7XG4gICAgLy8gY3JlYXRlIGNvbGxlY3Rpb24gY29uc3RydWN0b3JcbiAgICBDID0gY29tbW9uLmdldENvbnN0cnVjdG9yKHdyYXBwZXIsIE5BTUUsIElTX01BUCwgQURERVIpO1xuICAgIHJlZGVmaW5lQWxsKEMucHJvdG90eXBlLCBtZXRob2RzKTtcbiAgfSBlbHNlIHtcbiAgICBDID0gd3JhcHBlcihmdW5jdGlvbih0YXJnZXQsIGl0ZXJhYmxlKXtcbiAgICAgIHN0cmljdE5ldyh0YXJnZXQsIEMsIE5BTUUpO1xuICAgICAgdGFyZ2V0Ll9jID0gbmV3IEJhc2U7XG4gICAgICBpZihpdGVyYWJsZSAhPSB1bmRlZmluZWQpZm9yT2YoaXRlcmFibGUsIElTX01BUCwgdGFyZ2V0W0FEREVSXSwgdGFyZ2V0KTtcbiAgICB9KTtcbiAgICAkLmVhY2guY2FsbCgnYWRkLGNsZWFyLGRlbGV0ZSxmb3JFYWNoLGdldCxoYXMsc2V0LGtleXMsdmFsdWVzLGVudHJpZXMnLnNwbGl0KCcsJyksZnVuY3Rpb24oS0VZKXtcbiAgICAgIHZhciBJU19BRERFUiA9IEtFWSA9PSAnYWRkJyB8fCBLRVkgPT0gJ3NldCc7XG4gICAgICBpZihLRVkgaW4gcHJvdG8gJiYgIShJU19XRUFLICYmIEtFWSA9PSAnY2xlYXInKSloaWRlKEMucHJvdG90eXBlLCBLRVksIGZ1bmN0aW9uKGEsIGIpe1xuICAgICAgICBpZighSVNfQURERVIgJiYgSVNfV0VBSyAmJiAhaXNPYmplY3QoYSkpcmV0dXJuIEtFWSA9PSAnZ2V0JyA/IHVuZGVmaW5lZCA6IGZhbHNlO1xuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5fY1tLRVldKGEgPT09IDAgPyAwIDogYSwgYik7XG4gICAgICAgIHJldHVybiBJU19BRERFUiA/IHRoaXMgOiByZXN1bHQ7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBpZignc2l6ZScgaW4gcHJvdG8pJC5zZXREZXNjKEMucHJvdG90eXBlLCAnc2l6ZScsIHtcbiAgICAgIGdldDogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Muc2l6ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNldFRvU3RyaW5nVGFnKEMsIE5BTUUpO1xuXG4gIE9bTkFNRV0gPSBDO1xuICAkZXhwb3J0KCRleHBvcnQuRyArICRleHBvcnQuVyArICRleHBvcnQuRiwgTyk7XG5cbiAgaWYoIUlTX1dFQUspY29tbW9uLnNldFN0cm9uZyhDLCBOQU1FLCBJU19NQVApO1xuXG4gIHJldHVybiBDO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jb2xsZWN0aW9uLmpzXG4gKiogbW9kdWxlIGlkID0gNzRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9EYXZpZEJydWFudC9NYXAtU2V0LnByb3RvdHlwZS50b0pTT05cbnZhciAkZXhwb3J0ICA9IHJlcXVpcmUoJy4vJC5leHBvcnQnKTtcblxuJGV4cG9ydCgkZXhwb3J0LlAsICdNYXAnLCB7dG9KU09OOiByZXF1aXJlKCcuLyQuY29sbGVjdGlvbi10by1qc29uJykoJ01hcCcpfSk7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNy5tYXAudG8tanNvbi5qc1xuICoqIG1vZHVsZSBpZCA9IDc1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBodHRwczovL2dpdGh1Yi5jb20vRGF2aWRCcnVhbnQvTWFwLVNldC5wcm90b3R5cGUudG9KU09OXG52YXIgZm9yT2YgICA9IHJlcXVpcmUoJy4vJC5mb3Itb2YnKVxuICAsIGNsYXNzb2YgPSByZXF1aXJlKCcuLyQuY2xhc3NvZicpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihOQU1FKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIHRvSlNPTigpe1xuICAgIGlmKGNsYXNzb2YodGhpcykgIT0gTkFNRSl0aHJvdyBUeXBlRXJyb3IoTkFNRSArIFwiI3RvSlNPTiBpc24ndCBnZW5lcmljXCIpO1xuICAgIHZhciBhcnIgPSBbXTtcbiAgICBmb3JPZih0aGlzLCBmYWxzZSwgYXJyLnB1c2gsIGFycik7XG4gICAgcmV0dXJuIGFycjtcbiAgfTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuY29sbGVjdGlvbi10by1qc29uLmpzXG4gKiogbW9kdWxlIGlkID0gNzZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImV4cG9ydCAqIGZyb20gJy4vZGVib3VuY2UnO1xuZXhwb3J0ICogZnJvbSAnLi9zZXRfc3R5bGUnO1xuZXhwb3J0ICogZnJvbSAnLi9nZXRfZGVsdGEnO1xuZXhwb3J0ICogZnJvbSAnLi9maW5kX2NoaWxkJztcbmV4cG9ydCAqIGZyb20gJy4vYnVpbGRfY3VydmUnO1xuZXhwb3J0ICogZnJvbSAnLi9nZXRfdG91Y2hfaWQnO1xuZXhwb3J0ICogZnJvbSAnLi9nZXRfcG9zaXRpb24nO1xuZXhwb3J0ICogZnJvbSAnLi9waWNrX2luX3JhbmdlJztcbmV4cG9ydCAqIGZyb20gJy4vZ2V0X3BvaW50ZXJfZGF0YSc7XG5leHBvcnQgKiBmcm9tICcuL2dldF9vcmlnaW5hbF9ldmVudCc7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvdXRpbHMvaW5kZXguanNcbiAqKi8iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9PYmplY3QkZ2V0T3duUHJvcGVydHlOYW1lcyA9IHJlcXVpcmUoXCJiYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2dldC1vd24tcHJvcGVydHktbmFtZXNcIilbXCJkZWZhdWx0XCJdO1xuXG52YXIgX09iamVjdCRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSByZXF1aXJlKFwiYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9nZXQtb3duLXByb3BlcnR5LWRlc2NyaXB0b3JcIilbXCJkZWZhdWx0XCJdO1xuXG52YXIgX09iamVjdCRkZWZpbmVQcm9wZXJ0eSA9IHJlcXVpcmUoXCJiYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2RlZmluZS1wcm9wZXJ0eVwiKVtcImRlZmF1bHRcIl07XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZnVuY3Rpb24gKG9iaiwgZGVmYXVsdHMpIHtcbiAgdmFyIGtleXMgPSBfT2JqZWN0JGdldE93blByb3BlcnR5TmFtZXMoZGVmYXVsdHMpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuXG4gICAgdmFyIHZhbHVlID0gX09iamVjdCRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZGVmYXVsdHMsIGtleSk7XG5cbiAgICBpZiAodmFsdWUgJiYgdmFsdWUuY29uZmlndXJhYmxlICYmIG9ialtrZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgIF9PYmplY3QkZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL2hlbHBlcnMvZGVmYXVsdHMuanNcbiAqKiBtb2R1bGUgaWQgPSA3OFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9nZXQtb3duLXByb3BlcnR5LW5hbWVzXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9nZXQtb3duLXByb3BlcnR5LW5hbWVzLmpzXG4gKiogbW9kdWxlIGlkID0gNzlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciAkID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kJyk7XG5yZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5vYmplY3QuZ2V0LW93bi1wcm9wZXJ0eS1uYW1lcycpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eU5hbWVzKGl0KXtcbiAgcmV0dXJuICQuZ2V0TmFtZXMoaXQpO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9nZXQtb3duLXByb3BlcnR5LW5hbWVzLmpzXG4gKiogbW9kdWxlIGlkID0gODBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIDE5LjEuMi43IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKE8pXG5yZXF1aXJlKCcuLyQub2JqZWN0LXNhcCcpKCdnZXRPd25Qcm9wZXJ0eU5hbWVzJywgZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHJlcXVpcmUoJy4vJC5nZXQtbmFtZXMnKS5nZXQ7XG59KTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm9iamVjdC5nZXQtb3duLXByb3BlcnR5LW5hbWVzLmpzXG4gKiogbW9kdWxlIGlkID0gODFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIGZhbGxiYWNrIGZvciBJRTExIGJ1Z2d5IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIHdpdGggaWZyYW1lIGFuZCB3aW5kb3dcbnZhciB0b0lPYmplY3QgPSByZXF1aXJlKCcuLyQudG8taW9iamVjdCcpXG4gICwgZ2V0TmFtZXMgID0gcmVxdWlyZSgnLi8kJykuZ2V0TmFtZXNcbiAgLCB0b1N0cmluZyAgPSB7fS50b1N0cmluZztcblxudmFyIHdpbmRvd05hbWVzID0gdHlwZW9mIHdpbmRvdyA9PSAnb2JqZWN0JyAmJiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lc1xuICA/IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHdpbmRvdykgOiBbXTtcblxudmFyIGdldFdpbmRvd05hbWVzID0gZnVuY3Rpb24oaXQpe1xuICB0cnkge1xuICAgIHJldHVybiBnZXROYW1lcyhpdCk7XG4gIH0gY2F0Y2goZSl7XG4gICAgcmV0dXJuIHdpbmRvd05hbWVzLnNsaWNlKCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzLmdldCA9IGZ1bmN0aW9uIGdldE93blByb3BlcnR5TmFtZXMoaXQpe1xuICBpZih3aW5kb3dOYW1lcyAmJiB0b1N0cmluZy5jYWxsKGl0KSA9PSAnW29iamVjdCBXaW5kb3ddJylyZXR1cm4gZ2V0V2luZG93TmFtZXMoaXQpO1xuICByZXR1cm4gZ2V0TmFtZXModG9JT2JqZWN0KGl0KSk7XG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmdldC1uYW1lcy5qc1xuICoqIG1vZHVsZSBpZCA9IDgyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2dldC1vd24tcHJvcGVydHktZGVzY3JpcHRvclwiKSwgX19lc01vZHVsZTogdHJ1ZSB9O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3QvZ2V0LW93bi1wcm9wZXJ0eS1kZXNjcmlwdG9yLmpzXG4gKiogbW9kdWxlIGlkID0gODNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciAkID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kJyk7XG5yZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5vYmplY3QuZ2V0LW93bi1wcm9wZXJ0eS1kZXNjcmlwdG9yJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldE93blByb3BlcnR5RGVzY3JpcHRvcihpdCwga2V5KXtcbiAgcmV0dXJuICQuZ2V0RGVzYyhpdCwga2V5KTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvZ2V0LW93bi1wcm9wZXJ0eS1kZXNjcmlwdG9yLmpzXG4gKiogbW9kdWxlIGlkID0gODRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIDE5LjEuMi42IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoTywgUClcbnZhciB0b0lPYmplY3QgPSByZXF1aXJlKCcuLyQudG8taW9iamVjdCcpO1xuXG5yZXF1aXJlKCcuLyQub2JqZWN0LXNhcCcpKCdnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3InLCBmdW5jdGlvbigkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIGdldE93blByb3BlcnR5RGVzY3JpcHRvcihpdCwga2V5KXtcbiAgICByZXR1cm4gJGdldE93blByb3BlcnR5RGVzY3JpcHRvcih0b0lPYmplY3QoaXQpLCBrZXkpO1xuICB9O1xufSk7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9+L2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3QuZ2V0LW93bi1wcm9wZXJ0eS1kZXNjcmlwdG9yLmpzXG4gKiogbW9kdWxlIGlkID0gODVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvZGVmaW5lLXByb3BlcnR5XCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9kZWZpbmUtcHJvcGVydHkuanNcbiAqKiBtb2R1bGUgaWQgPSA4NlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyICQgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzLyQnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVmaW5lUHJvcGVydHkoaXQsIGtleSwgZGVzYyl7XG4gIHJldHVybiAkLnNldERlc2MoaXQsIGtleSwgZGVzYyk7XG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2RlZmluZS1wcm9wZXJ0eS5qc1xuICoqIG1vZHVsZSBpZCA9IDg3XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiAob2JqLCBkZWZhdWx0cykge1xuICB2YXIgbmV3T2JqID0gZGVmYXVsdHMoe30sIG9iaik7XG4gIGRlbGV0ZSBuZXdPYmpbXCJkZWZhdWx0XCJdO1xuICByZXR1cm4gbmV3T2JqO1xufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1leHBvcnQtd2lsZGNhcmQuanNcbiAqKiBtb2R1bGUgaWQgPSA4OFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAZXhwb3J0IHtGdW5jdGlvbn0gZGVib3VuY2VcbiAqL1xuXG4vLyBkZWJvdW5jZSB0aW1lcnMgcmVzZXQgd2FpdFxuY29uc3QgUkVTRVRfV0FJVCA9IDEwMDtcblxuLyoqXG4gKiBDYWxsIGZuIGlmIGl0IGlzbid0IGJlIGNhbGxlZCBpbiBhIHBlcmlvZFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge051bWJlcn0gW3dhaXRdOiBkZWJvdW5jZSB3YWl0LCBkZWZhdWx0IGlzIFJFU1RfV0FJVFxuICogQHBhcmFtIHtCb29sZWFufSBbaW1tZWRpYXRlXTogd2hldGhlciB0byBydW4gdGFzayBhdCBsZWFkaW5nLCBkZWZhdWx0IGlzIHRydWVcbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuZXhwb3J0IGxldCBkZWJvdW5jZSA9IChmbiwgd2FpdCA9IFJFU0VUX1dBSVQsIGltbWVkaWF0ZSA9IHRydWUpID0+IHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSByZXR1cm47XG5cbiAgICBsZXQgdGltZXI7XG5cbiAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgaWYgKCF0aW1lciAmJiBpbW1lZGlhdGUpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gZm4oLi4uYXJncykpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcblxuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGltZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBmbiguLi5hcmdzKTtcbiAgICAgICAgfSwgd2FpdCk7XG4gICAgfTtcbn07XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvdXRpbHMvZGVib3VuY2UuanNcbiAqKi8iLCIvKipcbiAqIEBtb2R1bGVcbiAqIEBleHBvcnQge0Z1bmN0aW9ufSBzZXRTdHlsZVxuICovXG5cbi8qKlxuICogc2V0IGNzcyBzdHlsZSBmb3IgdGFyZ2V0IGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW06IHRhcmdldCBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gc3R5bGVzOiBjc3Mgc3R5bGVzIHRvIGFwcGx5XG4gKi9cbmV4cG9ydCBsZXQgc2V0U3R5bGUgPSAoZWxlbSwgc3R5bGVzKSA9PiB7XG4gICAgT2JqZWN0LmtleXMoc3R5bGVzKS5mb3JFYWNoKChwcm9wKSA9PiB7XG4gICAgICAgIGxldCBjc3NQcm9wID0gcHJvcC5yZXBsYWNlKC9eLS8sICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvLShbYS16XSkvZywgKG0sICQxKSA9PiAkMS50b1VwcGVyQ2FzZSgpKTtcbiAgICAgICAgZWxlbS5zdHlsZVtjc3NQcm9wXSA9IHN0eWxlc1twcm9wXTtcbiAgICB9KTtcbn07XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvdXRpbHMvc2V0X3N0eWxlLmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAZXhwb3J0IHtGdW5jdGlvbn0gZ2V0RGVsdGFcbiAqIEBkZXBlbmRlbmNpZXMgWyBnZXRPcmlnaW5hbEV2ZW50IF1cbiAqL1xuXG5pbXBvcnQgeyBnZXRPcmlnaW5hbEV2ZW50IH0gZnJvbSAnLi9nZXRfb3JpZ2luYWxfZXZlbnQnO1xuXG5jb25zdCBERUxUQV9TQ0FMRSA9IHtcbiAgICBTVEFOREFSRDogMSxcbiAgICBPVEhFUlM6IC0zXG59O1xuXG5jb25zdCBERUxUQV9NT0RFID0gWzEuMCwgMjguMCwgNTAwLjBdO1xuXG5sZXQgZ2V0RGVsdGFNb2RlID0gKG1vZGUpID0+IERFTFRBX01PREVbbW9kZV0gfHwgREVMVEFfTU9ERVswXTtcblxuLyoqXG4gKiBOb3JtYWxpemluZyB3aGVlbCBkZWx0YVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBldnQ6IGV2ZW50IG9iamVjdFxuICovXG5leHBvcnQgbGV0IGdldERlbHRhID0gKGV2dCkgPT4ge1xuICAgIC8vIGdldCBvcmlnaW5hbCBET00gZXZlbnRcbiAgICBldnQgPSBnZXRPcmlnaW5hbEV2ZW50KGV2dCk7XG5cbiAgICBpZiAoJ2RlbHRhWCcgaW4gZXZ0KSB7XG4gICAgICAgIGNvbnN0IG1vZGUgPSBnZXREZWx0YU1vZGUoZXZ0LmRlbHRhTW9kZSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2dC5kZWx0YVggLyBERUxUQV9TQ0FMRS5TVEFOREFSRCAqIG1vZGUsXG4gICAgICAgICAgICB5OiBldnQuZGVsdGFZIC8gREVMVEFfU0NBTEUuU1RBTkRBUkQgKiBtb2RlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKCd3aGVlbERlbHRhWCcgaW4gZXZ0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldnQud2hlZWxEZWx0YVggLyBERUxUQV9TQ0FMRS5PVEhFUlMsXG4gICAgICAgICAgICB5OiBldnQud2hlZWxEZWx0YVkgLyBERUxUQV9TQ0FMRS5PVEhFUlNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBpZSB3aXRoIHRvdWNocGFkXG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogZXZ0LndoZWVsRGVsdGEgLyBERUxUQV9TQ0FMRS5PVEhFUlNcbiAgICB9O1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3V0aWxzL2dldF9kZWx0YS5qc1xuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQGV4cG9ydCB7RnVuY3Rpb259IGdldE9yaWdpbmFsRXZlbnRcbiAqL1xuXG4vKipcbiAqIEdldCBvcmlnaW5hbCBET00gZXZlbnRcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZXZ0OiBldmVudCBvYmplY3RcbiAqXG4gKiBAcmV0dXJuIHtFdmVudE9iamVjdH1cbiAqL1xuZXhwb3J0IGxldCBnZXRPcmlnaW5hbEV2ZW50ID0gKGV2dCkgPT4ge1xuICAgIHJldHVybiBldnQub3JpZ2luYWxFdmVudCB8fCBldnQ7XG59O1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3V0aWxzL2dldF9vcmlnaW5hbF9ldmVudC5qc1xuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQGV4cG9ydCB7RnVuY3Rpb259IGZpbmRDaGlsZFxuICovXG5cbi8qKlxuICogRmluZCBlbGVtZW50IHdpdGggc3BlY2lmaWMgY2xhc3MgbmFtZSB3aXRoaW4gY2hpbGRyZW5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudEVsZW1cbiAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc05hbWVcbiAqXG4gKiBAcmV0dXJuIHtFbGVtZW50fTogZmlyc3QgbWF0Y2hlZCBjaGlsZFxuICovXG5leHBvcnQgbGV0IGZpbmRDaGlsZCA9IChwYXJlbnRFbGVtLCBjbGFzc05hbWUpID0+IHtcbiAgICBsZXQgY2hpbGRyZW4gPSBwYXJlbnRFbGVtLmNoaWxkcmVuO1xuXG4gICAgaWYgKCFjaGlsZHJlbikgcmV0dXJuIG51bGw7XG5cbiAgICBmb3IgKGxldCBlbGVtIG9mIGNoaWxkcmVuKSB7XG4gICAgICAgIGlmIChlbGVtLmNsYXNzTmFtZS5tYXRjaChjbGFzc05hbWUpKSByZXR1cm4gZWxlbTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn07XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvdXRpbHMvZmluZF9jaGlsZC5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9nZXQtaXRlcmF0b3JcIiksIF9fZXNNb2R1bGU6IHRydWUgfTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL2NvcmUtanMvZ2V0LWl0ZXJhdG9yLmpzXG4gKiogbW9kdWxlIGlkID0gOTRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInJlcXVpcmUoJy4uL21vZHVsZXMvd2ViLmRvbS5pdGVyYWJsZScpO1xucmVxdWlyZSgnLi4vbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvY29yZS5nZXQtaXRlcmF0b3InKTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L2ZuL2dldC1pdGVyYXRvci5qc1xuICoqIG1vZHVsZSBpZCA9IDk1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgYW5PYmplY3QgPSByZXF1aXJlKCcuLyQuYW4tb2JqZWN0JylcbiAgLCBnZXQgICAgICA9IHJlcXVpcmUoJy4vY29yZS5nZXQtaXRlcmF0b3ItbWV0aG9kJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vJC5jb3JlJykuZ2V0SXRlcmF0b3IgPSBmdW5jdGlvbihpdCl7XG4gIHZhciBpdGVyRm4gPSBnZXQoaXQpO1xuICBpZih0eXBlb2YgaXRlckZuICE9ICdmdW5jdGlvbicpdGhyb3cgVHlwZUVycm9yKGl0ICsgJyBpcyBub3QgaXRlcmFibGUhJyk7XG4gIHJldHVybiBhbk9iamVjdChpdGVyRm4uY2FsbChpdCkpO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvY29yZS5nZXQtaXRlcmF0b3IuanNcbiAqKiBtb2R1bGUgaWQgPSA5NlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAZXhwb3J0IHtGdW5jdGlvbn0gYnVpbGRDdXJ2ZVxuICovXG5cbi8qKlxuICogQnVpbGQgcXVhZHJhdGljIGVhc2luZyBjdXJ2ZVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBiZWdpblxuICogQHBhcmFtIHtOdW1iZXJ9IGR1cmF0aW9uXG4gKlxuICogQHJldHVybiB7QXJyYXl9OiBwb2ludHNcbiAqL1xuZXhwb3J0IGxldCBidWlsZEN1cnZlID0gKGRpc3RhbmNlLCBkdXJhdGlvbikgPT4ge1xuICAgIGxldCByZXMgPSBbXTtcblxuICAgIGNvbnN0IHQgPSBNYXRoLmZsb29yKGR1cmF0aW9uIC8gMTAwMCAqIDYwKTtcbiAgICBjb25zdCBhID0gLWRpc3RhbmNlIC8gdCoqMjtcbiAgICBjb25zdCBiID0gLTIgKiBhICogdDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IHQ7IGkrKykge1xuICAgICAgICByZXMucHVzaChkaXN0YW5jZSA/IChhICogaSoqMiArIGIgKiBpKSA6IDApO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG59O1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3V0aWxzL2J1aWxkX2N1cnZlLmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAZXhwb3J0IHtGdW5jdGlvbn0gZ2V0VG91Y2hJRFxuICogQGRlcGVuZGVuY2llcyBbIGdldE9yaWdpbmFsRXZlbnQsIGdldFBvaW50ZXJEYXRhIF1cbiAqL1xuXG5pbXBvcnQgeyBnZXRPcmlnaW5hbEV2ZW50IH0gZnJvbSAnLi9nZXRfb3JpZ2luYWxfZXZlbnQnO1xuaW1wb3J0IHsgZ2V0UG9pbnRlckRhdGEgfSBmcm9tICcuL2dldF9wb2ludGVyX2RhdGEnO1xuXG4vKipcbiAqIEdldCB0b3VjaCBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGV2dDogZXZlbnQgb2JqZWN0XG4gKlxuICogQHJldHVybiB7TnVtYmVyfTogdG91Y2ggaWRcbiAqL1xuZXhwb3J0IGxldCBnZXRUb3VjaElEID0gKGV2dCkgPT4ge1xuICAgIGV2dCA9IGdldE9yaWdpbmFsRXZlbnQoZXZ0KTtcblxuICAgIGxldCBkYXRhID0gZ2V0UG9pbnRlckRhdGEoZXZ0KTtcblxuICAgIHJldHVybiBkYXRhLmlkZW50aWZpZXI7XG59O1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3V0aWxzL2dldF90b3VjaF9pZC5qc1xuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQGV4cG9ydCB7RnVuY3Rpb259IGdldFBvaW50ZXJEYXRhXG4gKiBAZGVwZW5kZW5jaWVzIFsgZ2V0T3JpZ2luYWxFdmVudCBdXG4gKi9cblxuaW1wb3J0IHsgZ2V0T3JpZ2luYWxFdmVudCB9IGZyb20gJy4vZ2V0X29yaWdpbmFsX2V2ZW50JztcblxuLyoqXG4gKiBHZXQgcG9pbnRlci90b3VjaCBkYXRhXG4gKiBAcGFyYW0ge09iamVjdH0gZXZ0OiBldmVudCBvYmplY3RcbiAqL1xuZXhwb3J0IGxldCBnZXRQb2ludGVyRGF0YSA9IChldnQpID0+IHtcbiAgICAvLyBpZiBpcyB0b3VjaCBldmVudCwgcmV0dXJuIGxhc3QgaXRlbSBpbiB0b3VjaExpc3RcbiAgICAvLyBlbHNlIHJldHVybiBvcmlnaW5hbCBldmVudFxuICAgIGV2dCA9IGdldE9yaWdpbmFsRXZlbnQoZXZ0KTtcblxuICAgIHJldHVybiBldnQudG91Y2hlcyA/IGV2dC50b3VjaGVzW2V2dC50b3VjaGVzLmxlbmd0aCAtIDFdIDogZXZ0O1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3V0aWxzL2dldF9wb2ludGVyX2RhdGEuanNcbiAqKi8iLCIvKipcbiAqIEBtb2R1bGVcbiAqIEBleHBvcnQge0Z1bmN0aW9ufSBnZXRQb3NpdGlvblxuICogQGRlcGVuZGVuY2llcyBbIGdldE9yaWdpbmFsRXZlbnQsIGdldFBvaW50ZXJEYXRhIF1cbiAqL1xuXG5pbXBvcnQgeyBnZXRPcmlnaW5hbEV2ZW50IH0gZnJvbSAnLi9nZXRfb3JpZ2luYWxfZXZlbnQnO1xuaW1wb3J0IHsgZ2V0UG9pbnRlckRhdGEgfSBmcm9tICcuL2dldF9wb2ludGVyX2RhdGEnO1xuXG4vKipcbiAqIEdldCBwb2ludGVyL2ZpbmdlciBwb3NpdGlvblxuICogQHBhcmFtIHtPYmplY3R9IGV2dDogZXZlbnQgb2JqZWN0XG4gKlxuICogQHJldHVybiB7T2JqZWN0fTogcG9zaXRpb257eCwgeX1cbiAqL1xuZXhwb3J0IGxldCBnZXRQb3NpdGlvbiA9IChldnQpID0+IHtcbiAgICBldnQgPSBnZXRPcmlnaW5hbEV2ZW50KGV2dCk7XG5cbiAgICBsZXQgZGF0YSA9IGdldFBvaW50ZXJEYXRhKGV2dCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB4OiBkYXRhLmNsaWVudFgsXG4gICAgICAgIHk6IGRhdGEuY2xpZW50WVxuICAgIH07XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvdXRpbHMvZ2V0X3Bvc2l0aW9uLmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAZXhwb3J0IHtGdW5jdGlvbn0gcGlja0luUmFuZ2VcbiAqL1xuXG4vKipcbiAqIFBpY2sgdmFsdWUgaW4gcmFuZ2UgW21pbiwgbWF4XVxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlXG4gKiBAcGFyYW0ge051bWJlcn0gW21pbl1cbiAqIEBwYXJhbSB7TnVtYmVyfSBbbWF4XVxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqL1xuZXhwb3J0IGxldCBwaWNrSW5SYW5nZSA9ICh2YWx1ZSwgbWluID0gMCwgbWF4ID0gMCkgPT4gTWF0aC5tYXgobWluLCBNYXRoLm1pbih2YWx1ZSwgbWF4KSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy91dGlscy9waWNrX2luX3JhbmdlLmpzXG4gKiovIiwiZXhwb3J0ICogZnJvbSAnLi9zYl9saXN0JztcbmV4cG9ydCAqIGZyb20gJy4vc2VsZWN0b3JzJztcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3NoYXJlZC9pbmRleC5qc1xuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQGV4cG9ydCB7U3RyaW5nfSBzZWxlY3RvcnNcbiAqL1xuXG5leHBvcnQgY29uc3Qgc2VsZWN0b3JzID0gJ3Njcm9sbGJhciwgW3Njcm9sbGJhcl0sIFtkYXRhLXNjcm9sbGJhcl0nO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3NoYXJlZC9zZWxlY3RvcnMuanNcbiAqKi8iLCJleHBvcnQgKiBmcm9tICcuL3VwZGF0ZSc7XG5leHBvcnQgKiBmcm9tICcuL2Rlc3Ryb3knO1xuZXhwb3J0ICogZnJvbSAnLi9nZXRfc2l6ZSc7XG5leHBvcnQgKiBmcm9tICcuL2xpc3RlbmVyJztcbmV4cG9ydCAqIGZyb20gJy4vc2Nyb2xsX3RvJztcbmV4cG9ydCAqIGZyb20gJy4vc2V0X29wdGlvbnMnO1xuZXhwb3J0ICogZnJvbSAnLi9zZXRfcG9zaXRpb24nO1xuZXhwb3J0ICogZnJvbSAnLi90b2dnbGVfdHJhY2snO1xuZXhwb3J0ICogZnJvbSAnLi9pbmZpbml0ZV9zY3JvbGwnO1xuZXhwb3J0ICogZnJvbSAnLi9nZXRfY29udGVudF9lbGVtJztcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9hcGlzL2luZGV4LmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gdXBkYXRlXG4gKi9cblxuaW1wb3J0IHsgcGlja0luUmFuZ2UsIHNldFN0eWxlIH0gZnJvbSAnLi4vdXRpbHMvaW5kZXgnO1xuaW1wb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH0gZnJvbSAnLi4vc21vb3RoX3Njcm9sbGJhcic7XG5cbmV4cG9ydCB7IFNtb290aFNjcm9sbGJhciB9O1xuXG4vKipcbiAqIEBtZXRob2RcbiAqIEBhcGlcbiAqIFVwZGF0ZSBzY3JvbGxiYXJzIGFwcGVhcmFuY2VcbiAqXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGFzeW5jOiB1cGRhdGUgYXN5bmNocm9ub3VzXG4gKi9cblNtb290aFNjcm9sbGJhci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oYXN5bmMgPSB0cnVlKSB7XG4gICAgbGV0IHVwZGF0ZSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5fX3VwZGF0ZUJvdW5kaW5nKCk7XG5cbiAgICAgICAgbGV0IHNpemUgPSB0aGlzLmdldFNpemUoKTtcblxuICAgICAgICB0aGlzLl9fcmVhZG9ubHkoJ3NpemUnLCBzaXplKTtcblxuICAgICAgICBsZXQgbmV3TGltaXQgPSB7XG4gICAgICAgICAgICB4OiBzaXplLmNvbnRlbnQud2lkdGggLSBzaXplLmNvbnRhaW5lci53aWR0aCxcbiAgICAgICAgICAgIHk6IHNpemUuY29udGVudC5oZWlnaHQgLSBzaXplLmNvbnRhaW5lci5oZWlnaHRcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodGhpcy5saW1pdCAmJlxuICAgICAgICAgICAgbmV3TGltaXQueCA9PT0gdGhpcy5saW1pdC54ICYmXG4gICAgICAgICAgICBuZXdMaW1pdC55ID09PSB0aGlzLmxpbWl0LnkpIHJldHVybjtcblxuICAgICAgICB0aGlzLl9fcmVhZG9ubHkoJ2xpbWl0JywgbmV3TGltaXQpO1xuXG4gICAgICAgIGxldCB7IHhBeGlzLCB5QXhpcyB9ID0gdGhpcy50YXJnZXRzO1xuXG4gICAgICAgIC8vIGhpZGUgc2Nyb2xsYmFyIGlmIGNvbnRlbnQgc2l6ZSBsZXNzIHRoYW4gY29udGFpbmVyXG4gICAgICAgIHNldFN0eWxlKHhBeGlzLnRyYWNrLCB7XG4gICAgICAgICAgICAnZGlzcGxheSc6IHNpemUuY29udGVudC53aWR0aCA8PSBzaXplLmNvbnRhaW5lci53aWR0aCA/ICdub25lJyA6ICdibG9jaydcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFN0eWxlKHlBeGlzLnRyYWNrLCB7XG4gICAgICAgICAgICAnZGlzcGxheSc6IHNpemUuY29udGVudC5oZWlnaHQgPD0gc2l6ZS5jb250YWluZXIuaGVpZ2h0ID8gJ25vbmUnIDogJ2Jsb2NrJ1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyB1c2UgcGVyY2VudGFnZSB2YWx1ZSBmb3IgdGh1bWJcbiAgICAgICAgc2V0U3R5bGUoeEF4aXMudGh1bWIsIHtcbiAgICAgICAgICAgICd3aWR0aCc6IGAke3BpY2tJblJhbmdlKHNpemUuY29udGFpbmVyLndpZHRoIC8gc2l6ZS5jb250ZW50LndpZHRoLCAwLCAxKSAqIDEwMH0lYFxuICAgICAgICB9KTtcbiAgICAgICAgc2V0U3R5bGUoeUF4aXMudGh1bWIsIHtcbiAgICAgICAgICAgICdoZWlnaHQnOiBgJHtwaWNrSW5SYW5nZShzaXplLmNvbnRhaW5lci5oZWlnaHQgLyBzaXplLmNvbnRlbnQuaGVpZ2h0LCAwLCAxKSAqIDEwMH0lYFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9fc2V0VGh1bWJQb3NpdGlvbigpO1xuICAgIH07XG5cbiAgICBpZiAoYXN5bmMpIHtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHVwZGF0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXBkYXRlKCk7XG4gICAgfVxufTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9hcGlzL3VwZGF0ZS5qc1xuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQHByb3RvdHlwZSB7RnVuY3Rpb259IGRlc3Ryb3lcbiAqL1xuXG5pbXBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfSBmcm9tICcuLi9zbW9vdGhfc2Nyb2xsYmFyJztcbmltcG9ydCB7IHNldFN0eWxlIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgc2JMaXN0IH0gZnJvbSAnLi4vc2hhcmVkJztcblxuZXhwb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH07XG5cbi8qKlxuICogQG1ldGhvZFxuICogQGFwaVxuICogUmVtb3ZlIGFsbCBzY3JvbGxiYXIgbGlzdGVuZXJzIGFuZCBldmVudCBoYW5kbGVyc1xuICogUmVzZXRcbiAqL1xuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgeyBfX2xpc3RlbmVycywgX19oYW5kbGVycywgdGFyZ2V0cyB9ID0gdGhpcztcbiAgICBjb25zdCB7IGNvbnRhaW5lciwgY29udGVudCB9ID0gdGFyZ2V0cztcblxuICAgIF9faGFuZGxlcnMuZm9yRWFjaCgoeyBldnQsIGVsZW0sIGhhbmRsZXIgfSkgPT4ge1xuICAgICAgICBlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZ0LCBoYW5kbGVyKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc2Nyb2xsVG8oMCwgMCwgMzAwLCAoKSA9PiB7XG4gICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuX190aW1lcklELnNjcm9sbEFuaW1hdGlvbik7XG4gICAgICAgIF9faGFuZGxlcnMubGVuZ3RoID0gX19saXN0ZW5lcnMubGVuZ3RoID0gMDtcblxuICAgICAgICAvLyByZXNldCBzY3JvbGwgcG9zaXRpb25cbiAgICAgICAgc2V0U3R5bGUoY29udGFpbmVyLCB7XG4gICAgICAgICAgICBvdmVyZmxvdzogJydcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29udGFpbmVyLnNjcm9sbFRvcCA9IGNvbnRhaW5lci5zY3JvbGxMZWZ0ID0gMDtcblxuICAgICAgICAvLyByZXNldCBjb250ZW50XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gWy4uLmNvbnRlbnQuY2hpbGRyZW5dO1xuXG4gICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcblxuICAgICAgICBjaGlsZHJlbi5mb3JFYWNoKChlbCkgPT4gY29udGFpbmVyLmFwcGVuZENoaWxkKGVsKSk7XG5cbiAgICAgICAgLy8gcmVtb3ZlIGZvcm0gc2JMaXN0XG4gICAgICAgIHNiTGlzdC5kZWxldGUoY29udGFpbmVyKTtcbiAgICB9KTtcbn07XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvYXBpcy9kZXN0cm95LmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gZ2V0U2l6ZVxuICovXG5cbmltcG9ydCB7IFNtb290aFNjcm9sbGJhciB9IGZyb20gJy4uL3Ntb290aF9zY3JvbGxiYXInO1xuXG5leHBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfTtcblxuLyoqXG4gKiBAbWV0aG9kXG4gKiBAYXBpXG4gKiBHZXQgY29udGFpbmVyIGFuZCBjb250ZW50IHNpemVcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9OiBhbiBvYmplY3QgY29udGFpbnMgY29udGFpbmVyIGFuZCBjb250ZW50J3Mgd2lkdGggYW5kIGhlaWdodFxuICovXG5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLmdldFNpemUgPSBmdW5jdGlvbigpIHtcbiAgICBsZXQgY29udGFpbmVyID0gdGhpcy50YXJnZXRzLmNvbnRhaW5lcjtcbiAgICBsZXQgY29udGVudCA9IHRoaXMudGFyZ2V0cy5jb250ZW50O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29udGFpbmVyOiB7XG4gICAgICAgICAgICAvLyByZXF1aXJlcyBgb3ZlcmZsb3c6IGhpZGRlbmBcbiAgICAgICAgICAgIHdpZHRoOiBjb250YWluZXIuY2xpZW50V2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGNvbnRhaW5lci5jbGllbnRIZWlnaHRcbiAgICAgICAgfSxcbiAgICAgICAgY29udGVudDoge1xuICAgICAgICAgICAgLy8gYm9yZGVyIHdpZHRoIHNob3VsZCBiZSBpbmNsdWRlZFxuICAgICAgICAgICAgd2lkdGg6IGNvbnRlbnQub2Zmc2V0V2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGNvbnRlbnQub2Zmc2V0SGVpZ2h0XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9hcGlzL2dldF9zaXplLmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gYWRkTGlzdGVuZXJcbiAqICAgICAgICAgICAge0Z1bmN0aW9ufSByZW1vdmVMaXN0ZW5lclxuICovXG5cbmltcG9ydCB7IFNtb290aFNjcm9sbGJhciB9IGZyb20gJy4uL3Ntb290aF9zY3JvbGxiYXInO1xuXG5leHBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfTtcblxuLyoqXG4gKiBAbWV0aG9kXG4gKiBAYXBpXG4gKiBBZGQgc2Nyb2xsaW5nIGxpc3RlbmVyXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2I6IGxpc3RlbmVyXG4gKi9cblNtb290aFNjcm9sbGJhci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbihjYikge1xuICAgIGlmICh0eXBlb2YgY2IgIT09ICdmdW5jdGlvbicpIHJldHVybjtcblxuICAgIHRoaXMuX19saXN0ZW5lcnMucHVzaChjYik7XG59O1xuXG4vKipcbiAqIEBtZXRob2RcbiAqIEBhcGlcbiAqIFJlbW92ZSBzcGVjaWZpYyBsaXN0ZW5lciBmcm9tIGFsbCBsaXN0ZW5lcnNcbiAqIEBwYXJhbSB7dHlwZX0gcGFyYW06IGRlc2NyaXB0aW9uXG4gKi9cblNtb290aFNjcm9sbGJhci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbihjYikge1xuICAgIGlmICh0eXBlb2YgY2IgIT09ICdmdW5jdGlvbicpIHJldHVybjtcblxuICAgIHRoaXMuX19saXN0ZW5lcnMuc29tZSgoZm4sIGlkeCwgYWxsKSA9PiB7XG4gICAgICAgIHJldHVybiBmbiA9PT0gY2IgJiYgYWxsLnNwbGljZShpZHgsIDEpO1xuICAgIH0pO1xufTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9hcGlzL2xpc3RlbmVyLmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gc2Nyb2xsVG9cbiAqL1xuXG5pbXBvcnQgeyBwaWNrSW5SYW5nZSwgYnVpbGRDdXJ2ZSB9IGZyb20gJy4uL3V0aWxzL2luZGV4JztcbmltcG9ydCB7IFNtb290aFNjcm9sbGJhciB9IGZyb20gJy4uL3Ntb290aF9zY3JvbGxiYXInO1xuXG5leHBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfTtcblxuLyoqXG4gKiBAbWV0aG9kXG4gKiBAYXBpXG4gKiBTY3JvbGxpbmcgc2Nyb2xsYmFyIHRvIHBvc2l0aW9uIHdpdGggdHJhbnNpdGlvblxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBbeF06IHNjcm9sbGJhciBwb3NpdGlvbiBpbiB4IGF4aXNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbeV06IHNjcm9sbGJhciBwb3NpdGlvbiBpbiB5IGF4aXNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbZHVyYXRpb25dOiB0cmFuc2l0aW9uIGR1cmF0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdOiBjYWxsYmFja1xuICovXG5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLnNjcm9sbFRvID0gZnVuY3Rpb24oeCA9IHRoaXMub2Zmc2V0LngsIHkgPSB0aGlzLm9mZnNldC55LCBkdXJhdGlvbiA9IDAsIGNiID0gbnVsbCkge1xuICAgIGNvbnN0IHtcbiAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgb2Zmc2V0LFxuICAgICAgICBsaW1pdCxcbiAgICAgICAgdmVsb2NpdHksXG4gICAgICAgIF9fdGltZXJJRFxuICAgIH0gPSB0aGlzO1xuXG4gICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUoX190aW1lcklELnNjcm9sbFRvKTtcbiAgICBjYiA9IHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJyA/IGNiIDogKCkgPT4ge307XG5cbiAgICBjb25zdCBzdGFydFggPSBvZmZzZXQueDtcbiAgICBjb25zdCBzdGFydFkgPSBvZmZzZXQueTtcblxuICAgIGNvbnN0IGRpc1ggPSBwaWNrSW5SYW5nZSh4LCAwLCBsaW1pdC54KSAtIHN0YXJ0WDtcbiAgICBjb25zdCBkaXNZID0gcGlja0luUmFuZ2UoeSwgMCwgbGltaXQueSkgLSBzdGFydFk7XG5cbiAgICBjb25zdCBjdXJ2ZVggPSBidWlsZEN1cnZlKGRpc1gsIGR1cmF0aW9uKTtcbiAgICBjb25zdCBjdXJ2ZVkgPSBidWlsZEN1cnZlKGRpc1ksIGR1cmF0aW9uKTtcblxuICAgIGxldCBmcmFtZSA9IDAsIHRvdGFsRnJhbWUgPSBjdXJ2ZVgubGVuZ3RoO1xuXG4gICAgbGV0IHNjcm9sbCA9ICgpID0+IHtcbiAgICAgICAgaWYgKGZyYW1lID09PSB0b3RhbEZyYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnNldFBvc2l0aW9uKHgsIHkpO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjYih0aGlzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRQb3NpdGlvbihzdGFydFggKyBjdXJ2ZVhbZnJhbWVdLCBzdGFydFkgKyBjdXJ2ZVlbZnJhbWVdKTtcblxuICAgICAgICBmcmFtZSsrO1xuXG4gICAgICAgIF9fdGltZXJJRC5zY3JvbGxUbyA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShzY3JvbGwpO1xuICAgIH07XG5cbiAgICBzY3JvbGwoKTtcbn07XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvYXBpcy9zY3JvbGxfdG8uanNcbiAqKi8iLCIvKipcbiAqIEBtb2R1bGVcbiAqIEBwcm90b3R5cGUge0Z1bmN0aW9ufSBzZXRPcHRpb25zXG4gKi9cblxuaW1wb3J0IHsgcGlja0luUmFuZ2UgfSBmcm9tICcuLi91dGlscy8nO1xuaW1wb3J0IHsgT1BUSU9OX0xJTUlUIH0gZnJvbSAnLi4vb3B0aW9ucyc7XG5pbXBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfSBmcm9tICcuLi9zbW9vdGhfc2Nyb2xsYmFyJztcblxuZXhwb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH07XG5cbi8qKlxuICogQG1ldGhvZFxuICogQGFwaVxuICogU2V0IHNjcm9sbGJhciBvcHRpb25zXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24ob3B0aW9ucyA9IHt9KSB7XG4gICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaCgocHJvcCkgPT4ge1xuICAgICAgICBpZiAoaXNOYU4ocGFyc2VGbG9hdChvcHRpb25zW3Byb3BdKSkpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBvcHRpb25zW3Byb3BdO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFPUFRJT05fTElNSVQuaGFzT3duUHJvcGVydHkocHJvcCkpIHJldHVybjtcblxuICAgICAgICBvcHRpb25zW3Byb3BdID0gcGlja0luUmFuZ2Uob3B0aW9uc1twcm9wXSwgLi4uT1BUSU9OX0xJTUlUW3Byb3BdKTtcbiAgICB9KTtcblxuICAgIE9iamVjdC5hc3NpZ24odGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbn07XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvYXBpcy9zZXRfb3B0aW9ucy5qc1xuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQHByb3RvdHlwZSB7RnVuY3Rpb259IHNldFBvc2l0aW9uXG4gKi9cblxuaW1wb3J0IHsgcGlja0luUmFuZ2UsIHNldFN0eWxlIH0gZnJvbSAnLi4vdXRpbHMvaW5kZXgnO1xuaW1wb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH0gZnJvbSAnLi4vc21vb3RoX3Njcm9sbGJhcic7XG5cbmV4cG9ydCB7IFNtb290aFNjcm9sbGJhciB9O1xuXG4vKipcbiAqIEBtZXRob2RcbiAqIEBhcGlcbiAqIFNldCBzY3JvbGxiYXIgcG9zaXRpb24gd2l0aG91dCB0cmFuc2l0aW9uXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IFt4XTogc2Nyb2xsYmFyIHBvc2l0aW9uIGluIHggYXhpc1xuICogQHBhcmFtIHtOdW1iZXJ9IFt5XTogc2Nyb2xsYmFyIHBvc2l0aW9uIGluIHkgYXhpc1xuICovXG5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCA9IHRoaXMub2Zmc2V0LngsIHkgPSB0aGlzLm9mZnNldC55KSB7XG4gICAgdGhpcy5fX3VwZGF0ZVRocm90dGxlKCk7XG5cbiAgICBjb25zdCBzdGF0dXMgPSB7fTtcbiAgICBjb25zdCB7IG9mZnNldCwgbGltaXQsIHRhcmdldHMsIF9fbGlzdGVuZXJzIH0gPSB0aGlzO1xuXG4gICAgaWYgKE1hdGguYWJzKHggLSBvZmZzZXQueCkgPiAxKSB0aGlzLnNob3dUcmFjaygneCcpO1xuICAgIGlmIChNYXRoLmFicyh5IC0gb2Zmc2V0LnkpID4gMSkgdGhpcy5zaG93VHJhY2soJ3knKTtcblxuICAgIHggPSBwaWNrSW5SYW5nZSh4LCAwLCBsaW1pdC54KTtcbiAgICB5ID0gcGlja0luUmFuZ2UoeSwgMCwgbGltaXQueSk7XG5cbiAgICB0aGlzLmhpZGVUcmFjaygpO1xuXG4gICAgaWYgKHggPT09IG9mZnNldC54ICYmIHkgPT09IG9mZnNldC55KSByZXR1cm47XG5cbiAgICBzdGF0dXMuZGlyZWN0aW9uID0ge1xuICAgICAgICB4OiB4ID09PSBvZmZzZXQueCA/ICdub25lJyA6ICh4ID4gb2Zmc2V0LnggPyAncmlnaHQnIDogJ2xlZnQnKSxcbiAgICAgICAgeTogeSA9PT0gb2Zmc2V0LnkgPyAnbm9uZScgOiAoeSA+IG9mZnNldC55ID8gJ2Rvd24nIDogJ3VwJylcbiAgICB9O1xuXG4gICAgc3RhdHVzLmxpbWl0ID0geyAuLi5saW1pdCB9O1xuXG4gICAgb2Zmc2V0LnggPSB4O1xuICAgIG9mZnNldC55ID0geTtcbiAgICBzdGF0dXMub2Zmc2V0ID0geyAuLi5vZmZzZXQgfTtcblxuICAgIC8vIHJlc2V0IHRodW1iIHBvc2l0aW9uIGFmdGVyIG9mZnNldCB1cGRhdGVcbiAgICB0aGlzLl9fc2V0VGh1bWJQb3NpdGlvbigpO1xuXG4gICAgY29uc3Qgc3R5bGUgPSBgdHJhbnNsYXRlM2QoJHsteH1weCwgJHsteX1weCwgMClgO1xuXG4gICAgc2V0U3R5bGUodGFyZ2V0cy5jb250ZW50LCB7XG4gICAgICAgICctd2Via2l0LXRyYW5zZm9ybSc6IHN0eWxlLFxuICAgICAgICAndHJhbnNmb3JtJzogc3R5bGVcbiAgICB9KTtcblxuICAgIC8vIGludm9rZSBhbGwgbGlzdGVuZXJzXG4gICAgX19saXN0ZW5lcnMuZm9yRWFjaCgoZm4pID0+IHtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIGZuKHN0YXR1cyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9hcGlzL3NldF9wb3NpdGlvbi5qc1xuICoqLyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX09iamVjdCRhc3NpZ24gPSByZXF1aXJlKFwiYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9hc3NpZ25cIilbXCJkZWZhdWx0XCJdO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IF9PYmplY3QkYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldO1xuXG4gICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHtcbiAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcy5qc1xuICoqIG1vZHVsZSBpZCA9IDExMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gc2hvd1RyYWNrXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gaGlkZVRyYWNrXG4gKi9cblxuaW1wb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH0gZnJvbSAnLi4vc21vb3RoX3Njcm9sbGJhcic7XG5cbmV4cG9ydCB7IFNtb290aFNjcm9sbGJhciB9O1xuXG4vKipcbiAqIEBtZXRob2RcbiAqIEBhcGlcbiAqIHNob3cgc2Nyb2xsYmFyIHRyYWNrIG9uIGdpdmVuIGRpcmVjdGlvblxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBkaXJlY3Rpb246IHdoaWNoIGRpcmVjdGlvbiBvZiB0cmFja3MgdG8gc2hvdywgZGVmYXVsdCBpcyAnYm90aCdcbiAqL1xuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5zaG93VHJhY2sgPSBmdW5jdGlvbihkaXJlY3Rpb24gPSAnYm90aCcpIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lciwgeEF4aXMsIHlBeGlzIH0gPSB0aGlzLnRhcmdldHM7XG5cbiAgICBkaXJlY3Rpb24gPSBkaXJlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCgnc2Nyb2xsaW5nJyk7XG5cbiAgICBpZiAoZGlyZWN0aW9uID09PSAnYm90aCcpIHtcbiAgICAgICAgeEF4aXMudHJhY2suY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgICAgICB5QXhpcy50cmFjay5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG4gICAgfVxuXG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3gnKSB7XG4gICAgICAgIHhBeGlzLnRyYWNrLmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgICB9XG5cbiAgICBpZiAoZGlyZWN0aW9uID09PSAneScpIHtcbiAgICAgICAgeUF4aXMudHJhY2suY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgIH1cbn07XG5cbi8qKlxuICogQG1ldGhvZFxuICogQGFwaVxuICogaGlkZSB0cmFjayB3aXRoIDMwMG1zIGRlYm91bmNlXG4gKi9cblNtb290aFNjcm9sbGJhci5wcm90b3R5cGUuaGlkZVRyYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgeyB0YXJnZXRzLCBfX3RpbWVySUQgfSA9IHRoaXM7XG4gICAgY29uc3QgeyBjb250YWluZXIsIHhBeGlzLCB5QXhpcyB9ID0gdGFyZ2V0cztcblxuICAgIGNsZWFyVGltZW91dChfX3RpbWVySUQudHJhY2spO1xuXG4gICAgX190aW1lcklELnRyYWNrID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCdzY3JvbGxpbmcnKTtcbiAgICAgICAgeEF4aXMudHJhY2suY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgICAgICB5QXhpcy50cmFjay5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgfSwgMzAwKTtcbn07XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvYXBpcy90b2dnbGVfdHJhY2suanNcbiAqKi8iLCIvKipcbiAqIEBtb2R1bGVcbiAqIEBwcm90b3R5cGUge0Z1bmN0aW9ufSBpbmZpbml0ZVNjcm9sbFxuICovXG5cbmltcG9ydCB7IFNtb290aFNjcm9sbGJhciB9IGZyb20gJy4uL3Ntb290aF9zY3JvbGxiYXInO1xuXG5leHBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfTtcblxuLyoqXG4gKiBAbWV0aG9kXG4gKiBAYXBpXG4gKiBDcmVhdGUgaW5maW5pdGUgc2Nyb2xsIGxpc3RlbmVyXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2I6IGluZmluaXRlIHNjcm9sbCBhY3Rpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBbdGhyZXNob2xkXTogaW5maW5pdGUgc2Nyb2xsIHRocmVzaG9sZCh0byBib3R0b20pLCBkZWZhdWx0IGlzIDUwKHB4KVxuICovXG5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLmluZmluaXRlU2Nyb2xsID0gZnVuY3Rpb24oY2IsIHRocmVzaG9sZCA9IDUwKSB7XG4gICAgaWYgKHR5cGVvZiBjYiAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuO1xuXG4gICAgbGV0IGxhc3RPZmZzZXQgPSB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDBcbiAgICB9O1xuXG4gICAgbGV0IGVudGVyZWQgPSBmYWxzZTtcblxuICAgIHRoaXMuYWRkTGlzdGVuZXIoKHN0YXR1cykgPT4ge1xuICAgICAgICBsZXQgeyBvZmZzZXQsIGxpbWl0IH0gPSBzdGF0dXM7XG5cbiAgICAgICAgaWYgKGxpbWl0LnkgLSBvZmZzZXQueSA8PSB0aHJlc2hvbGQgJiYgb2Zmc2V0LnkgPiBsYXN0T2Zmc2V0LnkgJiYgIWVudGVyZWQpIHtcbiAgICAgICAgICAgIGVudGVyZWQgPSB0cnVlO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBjYihzdGF0dXMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsaW1pdC55IC0gb2Zmc2V0LnkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIGVudGVyZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxhc3RPZmZzZXQgPSBvZmZzZXQ7XG4gICAgfSk7XG59O1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2FwaXMvaW5maW5pdGVfc2Nyb2xsLmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gZ2V0Q29udGVudEVsZW1cbiAqL1xuXG5pbXBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfSBmcm9tICcuLi9zbW9vdGhfc2Nyb2xsYmFyJztcblxuZXhwb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH07XG5cbi8qKlxuICogQG1ldGhvZFxuICogQGFwaVxuICogR2V0IHNjcm9sbCBjb250ZW50IGVsZW1lbnRcbiAqL1xuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5nZXRDb250ZW50RWxlbSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnRhcmdldHMuY29udGVudDtcbn07XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvYXBpcy9nZXRfY29udGVudF9lbGVtLmpzXG4gKiovIiwiZXhwb3J0ICogZnJvbSAnLi9kcmFnJztcbmV4cG9ydCAqIGZyb20gJy4vdG91Y2gnO1xuZXhwb3J0ICogZnJvbSAnLi9tb3VzZSc7XG5leHBvcnQgKiBmcm9tICcuL3doZWVsJztcbmV4cG9ydCAqIGZyb20gJy4vcmVzaXplJztcbmV4cG9ydCAqIGZyb20gJy4vc2VsZWN0JztcbmV4cG9ydCAqIGZyb20gJy4va2V5Ym9hcmQnO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2V2ZW50cy9pbmRleC5qc1xuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQHByb3RvdHlwZSB7RnVuY3Rpb259IF9fZHJhZ0hhbmRsZXJcbiAqL1xuXG4gaW1wb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH0gZnJvbSAnLi4vc21vb3RoX3Njcm9sbGJhcic7XG4gaW1wb3J0IHtcbiAgICBnZXRPcmlnaW5hbEV2ZW50LFxuICAgIGdldFBvc2l0aW9uLFxuICAgIGdldFRvdWNoSUQsXG4gICAgcGlja0luUmFuZ2UsXG4gICAgc2V0U3R5bGVcbn0gZnJvbSAnLi4vdXRpbHMvaW5kZXgnO1xuXG4gZXhwb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH07XG5cbiBsZXQgX19kcmFnSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHsgY29udGFpbmVyLCBjb250ZW50IH0gPSB0aGlzLnRhcmdldHM7XG5cbiAgICBsZXQgaXNEcmFnID0gZmFsc2U7XG4gICAgbGV0IGFuaW1hdGlvbiA9IHVuZGVmaW5lZDtcbiAgICBsZXQgdGFyZ2V0SGVpZ2h0ID0gdW5kZWZpbmVkO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdfX2lzRHJhZycsIHtcbiAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIGlzRHJhZztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2VcbiAgICB9KTtcblxuICAgIGxldCBzY3JvbGwgPSAoeyB4LCB5IH0pID0+IHtcbiAgICAgICAgaWYgKCF4ICYmICF5KSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5fX2FkZE1vdmVtZW50KHgsIHkpO1xuXG4gICAgICAgIGFuaW1hdGlvbiA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2Nyb2xsKHsgeCwgeSB9KTtcbiAgICAgICAgfSwgMTAwKTtcbiAgICB9O1xuXG4gICAgdGhpcy5fX2FkZEV2ZW50KGRvY3VtZW50LCAnZHJhZ292ZXIgbW91c2Vtb3ZlIHRvdWNobW92ZScsIChldnQpID0+IHtcbiAgICAgICAgaWYgKCFpc0RyYWcgfHwgdGhpcy5fX2lnbm9yZUV2ZW50KGV2dCkpIHJldHVybjtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFuaW1hdGlvbik7XG4gICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNvbnN0IGRpciA9IHRoaXMuX19nZXRPdmVyZmxvd0RpcihldnQsIHRhcmdldEhlaWdodCk7XG5cbiAgICAgICAgc2Nyb2xsKGRpcik7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9fYWRkRXZlbnQoY29udGFpbmVyLCAnZHJhZ3N0YXJ0JywgKGV2dCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fX2lnbm9yZUV2ZW50KGV2dCkpIHJldHVybjtcblxuICAgICAgICBzZXRTdHlsZShjb250ZW50LCB7XG4gICAgICAgICAgICAncG9pbnRlci1ldmVudHMnOiAnYXV0bydcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGFyZ2V0SGVpZ2h0ID0gZXZ0LnRhcmdldC5jbGllbnRIZWlnaHQ7XG4gICAgICAgIGNsZWFyVGltZW91dChhbmltYXRpb24pO1xuICAgICAgICB0aGlzLl9fdXBkYXRlQm91bmRpbmcoKTtcbiAgICAgICAgaXNEcmFnID0gdHJ1ZTtcbiAgICB9KTtcbiAgICB0aGlzLl9fYWRkRXZlbnQoZG9jdW1lbnQsICdkcmFnZW5kIG1vdXNldXAgdG91Y2hlbmQgYmx1cicsIChldnQpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19pZ25vcmVFdmVudChldnQpKSByZXR1cm47XG4gICAgICAgIGNsZWFyVGltZW91dChhbmltYXRpb24pO1xuICAgICAgICBpc0RyYWcgPSBmYWxzZTtcbiAgICB9KTtcbiB9O1xuXG4gT2JqZWN0LmRlZmluZVByb3BlcnR5KFNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsICdfX2RyYWdIYW5kbGVyJywge1xuICAgICB2YWx1ZTogX19kcmFnSGFuZGxlcixcbiAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuIH0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvZXZlbnRzL2RyYWcuanNcbiAqKi8iLCIvKipcbiAqIEBtb2R1bGVcbiAqIEBwcm90b3R5cGUge0Z1bmN0aW9ufSBfX3RvdWNoSGFuZGxlclxuICovXG5cbmltcG9ydCB7IFNtb290aFNjcm9sbGJhciB9IGZyb20gJy4uL3Ntb290aF9zY3JvbGxiYXInO1xuaW1wb3J0IHtcbiAgICBnZXRPcmlnaW5hbEV2ZW50LFxuICAgIGdldFBvc2l0aW9uLFxuICAgIGdldFRvdWNoSUQsXG4gICAgcGlja0luUmFuZ2Vcbn0gZnJvbSAnLi4vdXRpbHMvaW5kZXgnO1xuXG5leHBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfTtcblxuY29uc3QgRUFTSU5HX0RVUkFUSU9OID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvYW5kcm9pZC9pKSA/IDE1MDAgOiA3NTA7XG5cbi8qKlxuICogQG1ldGhvZFxuICogQGludGVybmFsXG4gKiBUb3VjaCBldmVudCBoYW5kbGVycyBidWlsZGVyXG4gKi9cbmxldCBfX3RvdWNoSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHsgY29udGFpbmVyIH0gPSB0aGlzLnRhcmdldHM7XG5cbiAgICBsZXQgbGFzdFRvdWNoVGltZSwgbGFzdFRvdWNoSUQ7XG4gICAgbGV0IG1vdmVWZWxvY2l0eSA9IHt9LCBsYXN0VG91Y2hQb3MgPSB7fSwgdG91Y2hSZWNvcmRzID0ge307XG5cbiAgICBsZXQgdXBkYXRlUmVjb3JkcyA9IChldnQpID0+IHtcbiAgICAgICAgY29uc3QgdG91Y2hMaXN0ID0gZ2V0T3JpZ2luYWxFdmVudChldnQpLnRvdWNoZXM7XG5cbiAgICAgICAgT2JqZWN0LmtleXModG91Y2hMaXN0KS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgIC8vIHJlY29yZCBhbGwgdG91Y2hlcyB0aGF0IHdpbGwgYmUgcmVzdG9yZWRcbiAgICAgICAgICAgIGlmIChrZXkgPT09ICdsZW5ndGgnKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnN0IHRvdWNoID0gdG91Y2hMaXN0W2tleV07XG5cbiAgICAgICAgICAgIHRvdWNoUmVjb3Jkc1t0b3VjaC5pZGVudGlmaWVyXSA9IGdldFBvc2l0aW9uKHRvdWNoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMuX19hZGRFdmVudChjb250YWluZXIsICd0b3VjaHN0YXJ0JywgKGV2dCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fX2lzRHJhZykgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHsgbW92ZW1lbnQgfSA9IHRoaXM7XG5cbiAgICAgICAgdXBkYXRlUmVjb3JkcyhldnQpO1xuXG4gICAgICAgIGxhc3RUb3VjaFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICBsYXN0VG91Y2hJRCA9IGdldFRvdWNoSUQoZXZ0KTtcbiAgICAgICAgbGFzdFRvdWNoUG9zID0gZ2V0UG9zaXRpb24oZXZ0KTtcblxuICAgICAgICAvLyBzdG9wIHNjcm9sbGluZ1xuICAgICAgICBtb3ZlbWVudC54ID0gbW92ZW1lbnQueSA9IDA7XG4gICAgICAgIG1vdmVWZWxvY2l0eS54ID0gbW92ZVZlbG9jaXR5LnkgPSAwO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fX2FkZEV2ZW50KGNvbnRhaW5lciwgJ3RvdWNobW92ZScsIChldnQpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19pZ25vcmVFdmVudChldnQpIHx8IHRoaXMuX19pc0RyYWcpIHJldHVybjtcblxuICAgICAgICB1cGRhdGVSZWNvcmRzKGV2dCk7XG5cbiAgICAgICAgY29uc3QgdG91Y2hJRCA9IGdldFRvdWNoSUQoZXZ0KTtcbiAgICAgICAgY29uc3QgeyBvZmZzZXQsIGxpbWl0IH0gPSB0aGlzO1xuXG4gICAgICAgIGlmIChsYXN0VG91Y2hJRCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyByZXNldCBsYXN0IHRvdWNoIGluZm8gZnJvbSByZWNvcmRzXG4gICAgICAgICAgICBsYXN0VG91Y2hJRCA9IHRvdWNoSUQ7XG5cbiAgICAgICAgICAgIC8vIGRvbid0IG5lZWQgZXJyb3IgaGFuZGxlclxuICAgICAgICAgICAgbGFzdFRvdWNoVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBsYXN0VG91Y2hQb3MgPSB0b3VjaFJlY29yZHNbdG91Y2hJRF07XG4gICAgICAgIH0gZWxzZSBpZiAodG91Y2hJRCAhPT0gbGFzdFRvdWNoSUQpIHtcbiAgICAgICAgICAgIC8vIHByZXZlbnQgbXVsdGktdG91Y2ggYm91bmNpbmdcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbGFzdFRvdWNoUG9zKSByZXR1cm47XG5cbiAgICAgICAgbGV0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIGxhc3RUb3VjaFRpbWU7XG4gICAgICAgIGxldCB7IHg6IGxhc3RYLCB5OiBsYXN0WSB9ID0gbGFzdFRvdWNoUG9zO1xuICAgICAgICBsZXQgeyB4OiBjdXJYLCB5OiBjdXJZIH0gPSBsYXN0VG91Y2hQb3MgPSBnZXRQb3NpdGlvbihldnQpO1xuXG4gICAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgMTsgLy8gZml4IEluZmluaXR5IGVycm9yXG5cbiAgICAgICAgbW92ZVZlbG9jaXR5LnggPSAobGFzdFggLSBjdXJYKSAvIGR1cmF0aW9uO1xuICAgICAgICBtb3ZlVmVsb2NpdHkueSA9IChsYXN0WSAtIGN1clkpIC8gZHVyYXRpb247XG5cbiAgICAgICAgbGV0IGRlc3RYID0gcGlja0luUmFuZ2UobGFzdFggLSBjdXJYICsgb2Zmc2V0LngsIDAsIGxpbWl0LngpO1xuICAgICAgICBsZXQgZGVzdFkgPSBwaWNrSW5SYW5nZShsYXN0WSAtIGN1clkgKyBvZmZzZXQueSwgMCwgbGltaXQueSk7XG5cbiAgICAgICAgaWYgKE1hdGguYWJzKGRlc3RYIC0gb2Zmc2V0LngpIDwgMSAmJiBNYXRoLmFicyhkZXN0WSAtIG9mZnNldC55KSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9fdXBkYXRlVGhyb3R0bGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHRoaXMuc2V0UG9zaXRpb24oZGVzdFgsIGRlc3RZKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX19hZGRFdmVudChjb250YWluZXIsICd0b3VjaGVuZCcsIChldnQpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19pZ25vcmVFdmVudChldnQpIHx8IHRoaXMuX19pc0RyYWcpIHJldHVybjtcblxuICAgICAgICAvLyByZWxlYXNlIGN1cnJlbnQgdG91Y2hcbiAgICAgICAgZGVsZXRlIHRvdWNoUmVjb3Jkc1tsYXN0VG91Y2hJRF07XG4gICAgICAgIGxhc3RUb3VjaElEID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGxldCB7IHgsIHkgfSA9IG1vdmVWZWxvY2l0eTtcblxuICAgICAgICB0aGlzLl9fYWRkTW92ZW1lbnQoeCAqIEVBU0lOR19EVVJBVElPTiwgeSAqIEVBU0lOR19EVVJBVElPTik7XG5cbiAgICAgICAgbW92ZVZlbG9jaXR5LnggPSBtb3ZlVmVsb2NpdHkueSA9IDA7XG4gICAgfSk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSwgJ19fdG91Y2hIYW5kbGVyJywge1xuICAgIHZhbHVlOiBfX3RvdWNoSGFuZGxlcixcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvZXZlbnRzL3RvdWNoLmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gX19tb3VzZUhhbmRsZXJcbiAqL1xuXG5pbXBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfSBmcm9tICcuLi9zbW9vdGhfc2Nyb2xsYmFyJztcbmltcG9ydCB7IGdldFBvc2l0aW9uLCBnZXRUb3VjaElELCBwaWNrSW5SYW5nZSB9IGZyb20gJy4uL3V0aWxzL2luZGV4JztcblxuZXhwb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH07XG5cbmNvbnN0IFRSQUNLX0RJUkVDVElPTiA9IHtcbiAgICB4OiBbMCwgMV0sXG4gICAgeTogWzEsIDBdXG59O1xuXG5sZXQgZ2V0VHJhY2tEaXIgPSAoY2xhc3NOYW1lKSA9PiB7XG4gICAgbGV0IG1hdGNoZXMgPSBjbGFzc05hbWUubWF0Y2goL3Njcm9sbGJhclxcLSg/OnRyYWNrfHRodW1iKVxcLShbeHldKS8pO1xuXG4gICAgcmV0dXJuIG1hdGNoZXMgJiYgbWF0Y2hlc1sxXTtcbn07XG5cbi8qKlxuICogQG1ldGhvZFxuICogQGludGVybmFsXG4gKiBNb3VzZSBldmVudCBoYW5kbGVycyBidWlsZGVyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvblxuICovXG5sZXQgX19tb3VzZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBsZXQgaXNNb3VzZURvd24sIGlzTW91c2VNb3ZlLCBzdGFydE9mZnNldFRvVGh1bWIsIHN0YXJ0VHJhY2tEaXJlY3Rpb24sIGNvbnRhaW5lclJlY3Q7XG4gICAgbGV0IHsgY29udGFpbmVyIH0gPSB0aGlzLnRhcmdldHM7XG5cbiAgICB0aGlzLl9fYWRkRXZlbnQoY29udGFpbmVyLCAnY2xpY2snLCAoZXZ0KSA9PiB7XG4gICAgICAgIGlmIChpc01vdXNlTW92ZSB8fCAhL3RyYWNrLy50ZXN0KGV2dC50YXJnZXQuY2xhc3NOYW1lKSB8fCB0aGlzLl9faWdub3JlRXZlbnQoZXZ0KSkgcmV0dXJuO1xuXG4gICAgICAgIGxldCB0cmFjayA9IGV2dC50YXJnZXQ7XG4gICAgICAgIGxldCBkaXJlY3Rpb24gPSBnZXRUcmFja0Rpcih0cmFjay5jbGFzc05hbWUpO1xuICAgICAgICBsZXQgcmVjdCA9IHRyYWNrLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBsZXQgY2xpY2tQb3MgPSBnZXRQb3NpdGlvbihldnQpO1xuXG4gICAgICAgIGxldCB7IHNpemUsIG9mZnNldCB9ID0gdGhpcztcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAneCcpIHtcbiAgICAgICAgICAgIC8vIHVzZSBwZXJjZW50YWdlIHZhbHVlXG4gICAgICAgICAgICBsZXQgdGh1bWJTaXplID0gcGlja0luUmFuZ2Uoc2l6ZS5jb250YWluZXIud2lkdGggLyBzaXplLmNvbnRlbnQud2lkdGgsIDAsIDEpO1xuICAgICAgICAgICAgbGV0IGNsaWNrT2Zmc2V0ID0gKGNsaWNrUG9zLnggLSByZWN0LmxlZnQpIC8gc2l6ZS5jb250YWluZXIud2lkdGg7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNjcm9sbFRvKFxuICAgICAgICAgICAgICAgIChjbGlja09mZnNldCAtIHRodW1iU2l6ZSAvIDIpICogc2l6ZS5jb250ZW50LndpZHRoLFxuICAgICAgICAgICAgICAgIG9mZnNldC55LFxuICAgICAgICAgICAgICAgIDFlM1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0aHVtYlNpemUgPSBwaWNrSW5SYW5nZShzaXplLmNvbnRhaW5lci5oZWlnaHQgLyBzaXplLmNvbnRlbnQuaGVpZ2h0LCAwLCAxKTtcbiAgICAgICAgbGV0IGNsaWNrT2Zmc2V0ID0gKGNsaWNrUG9zLnkgLSByZWN0LnRvcCkgLyBzaXplLmNvbnRhaW5lci5oZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5zY3JvbGxUbyhcbiAgICAgICAgICAgIG9mZnNldC54LFxuICAgICAgICAgICAgKGNsaWNrT2Zmc2V0IC0gdGh1bWJTaXplIC8gMikgKiBzaXplLmNvbnRlbnQuaGVpZ2h0LFxuICAgICAgICAgICAgMWUzXG4gICAgICAgICk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9fYWRkRXZlbnQoY29udGFpbmVyLCAnbW91c2Vkb3duJywgKGV2dCkgPT4ge1xuICAgICAgICBpZiAoIS90aHVtYi8udGVzdChldnQudGFyZ2V0LmNsYXNzTmFtZSkgfHwgdGhpcy5fX2lnbm9yZUV2ZW50KGV2dCkpIHJldHVybjtcbiAgICAgICAgaXNNb3VzZURvd24gPSB0cnVlO1xuXG4gICAgICAgIGxldCBjdXJzb3JQb3MgPSBnZXRQb3NpdGlvbihldnQpO1xuICAgICAgICBsZXQgdGh1bWJSZWN0ID0gZXZ0LnRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICBzdGFydFRyYWNrRGlyZWN0aW9uID0gZ2V0VHJhY2tEaXIoZXZ0LnRhcmdldC5jbGFzc05hbWUpO1xuXG4gICAgICAgIC8vIHBvaW50ZXIgb2Zmc2V0IHRvIHRodW1iXG4gICAgICAgIHN0YXJ0T2Zmc2V0VG9UaHVtYiA9IHtcbiAgICAgICAgICAgIHg6IGN1cnNvclBvcy54IC0gdGh1bWJSZWN0LmxlZnQsXG4gICAgICAgICAgICB5OiBjdXJzb3JQb3MueSAtIHRodW1iUmVjdC50b3BcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjb250YWluZXIgYm91bmRpbmcgcmVjdGFuZ2xlXG4gICAgICAgIGNvbnRhaW5lclJlY3QgPSB0aGlzLnRhcmdldHMuY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fX2FkZEV2ZW50KHdpbmRvdywgJ21vdXNlbW92ZScsIChldnQpID0+IHtcbiAgICAgICAgaWYgKCFpc01vdXNlRG93bikgcmV0dXJuO1xuXG4gICAgICAgIGlzTW91c2VNb3ZlID0gdHJ1ZTtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgbGV0IHsgc2l6ZSwgb2Zmc2V0IH0gPSB0aGlzO1xuICAgICAgICBsZXQgY3Vyc29yUG9zID0gZ2V0UG9zaXRpb24oZXZ0KTtcblxuICAgICAgICBpZiAoc3RhcnRUcmFja0RpcmVjdGlvbiA9PT0gJ3gnKSB7XG4gICAgICAgICAgICAvLyBnZXQgcGVyY2VudGFnZSBvZiBwb2ludGVyIHBvc2l0aW9uIGluIHRyYWNrXG4gICAgICAgICAgICAvLyB0aGVuIHRyYW5mb3JtIHRvIHB4XG4gICAgICAgICAgICB0aGlzLnNldFBvc2l0aW9uKFxuICAgICAgICAgICAgICAgIChjdXJzb3JQb3MueCAtIHN0YXJ0T2Zmc2V0VG9UaHVtYi54IC0gY29udGFpbmVyUmVjdC5sZWZ0KSAvIChjb250YWluZXJSZWN0LnJpZ2h0IC0gY29udGFpbmVyUmVjdC5sZWZ0KSAqIHNpemUuY29udGVudC53aWR0aCxcbiAgICAgICAgICAgICAgICBvZmZzZXQueVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG9uJ3QgbmVlZCBlYXNpbmdcbiAgICAgICAgdGhpcy5zZXRQb3NpdGlvbihcbiAgICAgICAgICAgIG9mZnNldC54LFxuICAgICAgICAgICAgKGN1cnNvclBvcy55IC0gc3RhcnRPZmZzZXRUb1RodW1iLnkgLSBjb250YWluZXJSZWN0LnRvcCkgLyAoY29udGFpbmVyUmVjdC5ib3R0b20gLSBjb250YWluZXJSZWN0LnRvcCkgKiBzaXplLmNvbnRlbnQuaGVpZ2h0XG4gICAgICAgICk7XG4gICAgfSk7XG5cbiAgICAvLyByZWxlYXNlIG1vdXNlbW92ZSBzcHkgb24gd2luZG93IGxvc3QgZm9jdXNcbiAgICB0aGlzLl9fYWRkRXZlbnQod2luZG93LCAnbW91c2V1cCBibHVyJywgKCkgPT4ge1xuICAgICAgICBpc01vdXNlRG93biA9IGlzTW91c2VNb3ZlID0gZmFsc2U7XG4gICAgfSk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSwgJ19fbW91c2VIYW5kbGVyJywge1xuICAgIHZhbHVlOiBfX21vdXNlSGFuZGxlcixcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvZXZlbnRzL21vdXNlLmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gX193aGVlbEhhbmRsZXJcbiAqL1xuXG5pbXBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfSBmcm9tICcuLi9zbW9vdGhfc2Nyb2xsYmFyJztcbmltcG9ydCB7IGdldERlbHRhLCBwaWNrSW5SYW5nZSB9IGZyb20gJy4uL3V0aWxzL2luZGV4JztcblxuZXhwb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH07XG5cbi8vIGlzIHN0YW5kYXJkIGB3aGVlbGAgZXZlbnQgc3VwcG9ydGVkIGNoZWNrXG5jb25zdCBXSEVFTF9FVkVOVCA9ICdvbndoZWVsJyBpbiB3aW5kb3cgPyAnd2hlZWwnIDogJ21vdXNld2hlZWwnO1xuXG4vKipcbiAqIEBtZXRob2RcbiAqIEBpbnRlcm5hbFxuICogV2hlZWwgZXZlbnQgaGFuZGxlciBidWlsZGVyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvblxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufTogZXZlbnQgaGFuZGxlclxuICovXG5sZXQgX193aGVlbEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lciB9ID0gdGhpcy50YXJnZXRzO1xuXG4gICAgdGhpcy5fX2FkZEV2ZW50KGNvbnRhaW5lciwgV0hFRUxfRVZFTlQsIChldnQpID0+IHtcbiAgICAgICAgaWYgKGV2dC5kZWZhdWx0UHJldmVudGVkKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgeyBvZmZzZXQsIGxpbWl0IH0gPSB0aGlzO1xuICAgICAgICBjb25zdCBkZWx0YSA9IGdldERlbHRhKGV2dCk7XG5cbiAgICAgICAgbGV0IGRlc3RYID0gcGlja0luUmFuZ2UoZGVsdGEueCArIG9mZnNldC54LCAwLCBsaW1pdC54KTtcbiAgICAgICAgbGV0IGRlc3RZID0gcGlja0luUmFuZ2UoZGVsdGEueSArIG9mZnNldC55LCAwLCBsaW1pdC55KTtcblxuICAgICAgICBpZiAoZGVzdFggPT09IG9mZnNldC54ICYmIGRlc3RZID09PSBvZmZzZXQueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX191cGRhdGVUaHJvdHRsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICB0aGlzLl9fYWRkTW92ZW1lbnQoZGVsdGEueCwgZGVsdGEueSk7XG4gICAgfSk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSwgJ19fd2hlZWxIYW5kbGVyJywge1xuICAgIHZhbHVlOiBfX3doZWVsSGFuZGxlcixcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvZXZlbnRzL3doZWVsLmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gX19yZXNpemVIYW5kbGVyXG4gKi9cblxuaW1wb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH0gZnJvbSAnLi4vc21vb3RoX3Njcm9sbGJhcic7XG5cbmV4cG9ydCB7IFNtb290aFNjcm9sbGJhciB9O1xuXG4vKipcbiAqIEBtZXRob2RcbiAqIEBpbnRlcm5hbFxuICogV2hlZWwgZXZlbnQgaGFuZGxlciBidWlsZGVyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvblxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufTogZXZlbnQgaGFuZGxlclxuICovXG5sZXQgX19yZXNpemVIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fX2FkZEV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIHRoaXMuX191cGRhdGVUaHJvdHRsZSk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSwgJ19fcmVzaXplSGFuZGxlcicsIHtcbiAgICB2YWx1ZTogX19yZXNpemVIYW5kbGVyLFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxufSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9ldmVudHMvcmVzaXplLmpzXG4gKiovIiwiLyoqXHJcbiAqIEBtb2R1bGVcclxuICogQHByb3RvdHlwZSB7RnVuY3Rpb259IF9fc2VsZWN0SGFuZGxlclxyXG4gKi9cclxuXHJcbiBpbXBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfSBmcm9tICcuLi9zbW9vdGhfc2Nyb2xsYmFyJztcclxuIGltcG9ydCB7XHJcbiAgICBnZXRPcmlnaW5hbEV2ZW50LFxyXG4gICAgZ2V0UG9zaXRpb24sXHJcbiAgICBnZXRUb3VjaElELFxyXG4gICAgcGlja0luUmFuZ2UsXHJcbiAgICBzZXRTdHlsZVxyXG59IGZyb20gJy4uL3V0aWxzL2luZGV4JztcclxuXHJcbiBleHBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfTtcclxuXHJcbi8vIHRvZG86IHNlbGVjdCBoYW5kbGVyIGZvciB0b3VjaCBzY3JlZW5cclxuIGxldCBfX3NlbGVjdEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIGxldCBpc1NlbGVjdGVkID0gZmFsc2U7XHJcbiAgICBsZXQgYW5pbWF0aW9uID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGNvbnN0IHsgY29udGFpbmVyLCBjb250ZW50IH0gPSB0aGlzLnRhcmdldHM7XHJcblxyXG4gICAgbGV0IHNjcm9sbCA9ICh7IHgsIHkgfSkgPT4ge1xyXG4gICAgICAgIGlmICgheCAmJiAheSkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLl9fYWRkTW92ZW1lbnQoeCwgeSk7XHJcblxyXG4gICAgICAgIGFuaW1hdGlvbiA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBzY3JvbGwoeyB4LCB5IH0pO1xyXG4gICAgICAgIH0sIDEwMCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGxldCBzZXRTZWxlY3QgPSAodmFsdWUgPSAnJykgPT4ge1xyXG4gICAgICAgIHNldFN0eWxlKGNvbnRhaW5lciwge1xyXG4gICAgICAgICAgICAnLXdlYmtpdC11c2VyLXNlbGVjdCc6IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAnLW1vei11c2VyLXNlbGVjdCc6IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgJy1tcy11c2VyLXNlbGVjdCc6IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6IHZhbHVlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuX19hZGRFdmVudCh3aW5kb3csICdtb3VzZW1vdmUnLCAoZXZ0KSA9PiB7XHJcbiAgICAgICAgaWYgKCFpc1NlbGVjdGVkKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNsZWFyVGltZW91dChhbmltYXRpb24pO1xyXG5cclxuICAgICAgICBjb25zdCBkaXIgPSB0aGlzLl9fZ2V0T3ZlcmZsb3dEaXIoZXZ0KTtcclxuXHJcbiAgICAgICAgc2Nyb2xsKGRpcik7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLl9fYWRkRXZlbnQoY29udGVudCwgJ3NlbGVjdHN0YXJ0JywgKGV2dCkgPT4ge1xyXG4gICAgICAgIGlmICh0aGlzLl9faWdub3JlRXZlbnQoZXZ0KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2V0U2VsZWN0KCdub25lJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjbGVhclRpbWVvdXQoYW5pbWF0aW9uKTtcclxuICAgICAgICBzZXRTZWxlY3QoJ2F1dG8nKTtcclxuXHJcbiAgICAgICAgdGhpcy5fX3VwZGF0ZUJvdW5kaW5nKCk7XHJcbiAgICAgICAgaXNTZWxlY3RlZCA9IHRydWU7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLl9fYWRkRXZlbnQod2luZG93LCAnbW91c2V1cCBibHVyJywgKCkgPT4ge1xyXG4gICAgICAgIGNsZWFyVGltZW91dChhbmltYXRpb24pO1xyXG4gICAgICAgIHNldFNlbGVjdCgpO1xyXG5cclxuICAgICAgICBpc1NlbGVjdGVkID0gZmFsc2U7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyB0ZW1wIHBhdGNoIGZvciB0b3VjaCBkZXZpY2VzXHJcbiAgICB0aGlzLl9fYWRkRXZlbnQoY29udGFpbmVyLCAnc2Nyb2xsJywgKGV2dCkgPT4ge1xyXG4gICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnRhaW5lci5zY3JvbGxUb3AgPSBjb250YWluZXIuc2Nyb2xsTGVmdCA9IDA7XHJcbiAgICB9KTtcclxuIH07XHJcblxyXG4gT2JqZWN0LmRlZmluZVByb3BlcnR5KFNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsICdfX3NlbGVjdEhhbmRsZXInLCB7XHJcbiAgICAgdmFsdWU6IF9fc2VsZWN0SGFuZGxlcixcclxuICAgICB3cml0YWJsZTogdHJ1ZSxcclxuICAgICBjb25maWd1cmFibGU6IHRydWVcclxuIH0pO1xyXG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9ldmVudHMvc2VsZWN0LmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gX19rZXlib2FyZEhhbmRsZXJcbiAqL1xuXG5pbXBvcnQgeyBnZXRPcmlnaW5hbEV2ZW50LCBwaWNrSW5SYW5nZSB9IGZyb20gJy4uL3V0aWxzL2luZGV4JztcbmltcG9ydCB7IFNtb290aFNjcm9sbGJhciB9IGZyb20gJy4uL3Ntb290aF9zY3JvbGxiYXInO1xuXG5leHBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfTtcblxuLy8ga2V5IG1hcHMgW2RlbHRhWCwgZGVsdGFZXVxuY29uc3QgS0VZTUFQUyA9IHtcbiAgICAzNzogWy0xLCAwXSwgLy8gbGVmdFxuICAgIDM4OiBbMCwgLTFdLCAvLyB1cFxuICAgIDM5OiBbMSwgMF0sIC8vIHJpZ2h0XG4gICAgNDA6IFswLCAxXSAvLyBkb3duXG59O1xuXG4vKipcbiAqIEBtZXRob2RcbiAqIEBpbnRlcm5hbFxuICogS2V5cHJlc3MgZXZlbnQgaGFuZGxlciBidWlsZGVyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvblxuICovXG5sZXQgX19rZXlib2FyZEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lciB9ID0gdGhpcy50YXJnZXRzO1xuICAgIGxldCBpc0ZvY3VzZWQgPSBmYWxzZTtcblxuICAgIHRoaXMuX19hZGRFdmVudChjb250YWluZXIsICdmb2N1cycsICgpID0+IHtcbiAgICAgICAgaXNGb2N1c2VkID0gdHJ1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMuX19hZGRFdmVudChjb250YWluZXIsICdibHVyJywgKCkgPT4ge1xuICAgICAgICBpc0ZvY3VzZWQgPSBmYWxzZTtcbiAgICB9KTtcblxuICAgIHRoaXMuX19hZGRFdmVudChjb250YWluZXIsICdrZXlkb3duJywgKGV2dCkgPT4ge1xuICAgICAgICBpZiAoIWlzRm9jdXNlZCkgcmV0dXJuO1xuXG4gICAgICAgIGV2dCA9IGdldE9yaWdpbmFsRXZlbnQoZXZ0KTtcblxuICAgICAgICBjb25zdCBrZXlDb2RlID0gZXZ0LmtleUNvZGUgfHwgZXZ0LndoaWNoO1xuXG4gICAgICAgIGlmICghS0VZTUFQUy5oYXNPd25Qcm9wZXJ0eShrZXlDb2RlKSkgcmV0dXJuO1xuXG4gICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNvbnN0IHsgc3BlZWQgfSA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgY29uc3QgW3gsIHldID0gS0VZTUFQU1trZXlDb2RlXTtcblxuICAgICAgICB0aGlzLl9fYWRkTW92ZW1lbnQoeCAqIDQwLCB5ICogNDApO1xuICAgIH0pO1xufTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsICdfX2tleWJvYXJkSGFuZGxlcicsIHtcbiAgICB2YWx1ZTogX19rZXlib2FyZEhhbmRsZXIsXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2V2ZW50cy9rZXlib2FyZC5qc1xuICoqLyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2dldEl0ZXJhdG9yID0gcmVxdWlyZShcImJhYmVsLXJ1bnRpbWUvY29yZS1qcy9nZXQtaXRlcmF0b3JcIilbXCJkZWZhdWx0XCJdO1xuXG52YXIgX2lzSXRlcmFibGUgPSByZXF1aXJlKFwiYmFiZWwtcnVudGltZS9jb3JlLWpzL2lzLWl0ZXJhYmxlXCIpW1wiZGVmYXVsdFwiXTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkge1xuICAgIHZhciBfYXJyID0gW107XG4gICAgdmFyIF9uID0gdHJ1ZTtcbiAgICB2YXIgX2QgPSBmYWxzZTtcbiAgICB2YXIgX2UgPSB1bmRlZmluZWQ7XG5cbiAgICB0cnkge1xuICAgICAgZm9yICh2YXIgX2kgPSBfZ2V0SXRlcmF0b3IoYXJyKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHtcbiAgICAgICAgX2Fyci5wdXNoKF9zLnZhbHVlKTtcblxuICAgICAgICBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBfZCA9IHRydWU7XG4gICAgICBfZSA9IGVycjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCFfbiAmJiBfaVtcInJldHVyblwiXSkgX2lbXCJyZXR1cm5cIl0oKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChfZCkgdGhyb3cgX2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIF9hcnI7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFycikpIHtcbiAgICAgIHJldHVybiBhcnI7XG4gICAgfSBlbHNlIGlmIChfaXNJdGVyYWJsZShPYmplY3QoYXJyKSkpIHtcbiAgICAgIHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlXCIpO1xuICAgIH1cbiAgfTtcbn0pKCk7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9oZWxwZXJzL3NsaWNlZC10by1hcnJheS5qc1xuICoqIG1vZHVsZSBpZCA9IDEyNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL2lzLWl0ZXJhYmxlXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYmFiZWwtcnVudGltZS9jb3JlLWpzL2lzLWl0ZXJhYmxlLmpzXG4gKiogbW9kdWxlIGlkID0gMTI1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJyZXF1aXJlKCcuLi9tb2R1bGVzL3dlYi5kb20uaXRlcmFibGUnKTtcbnJlcXVpcmUoJy4uL21vZHVsZXMvZXM2LnN0cmluZy5pdGVyYXRvcicpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2NvcmUuaXMtaXRlcmFibGUnKTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9iYWJlbC1ydW50aW1lL34vY29yZS1qcy9saWJyYXJ5L2ZuL2lzLWl0ZXJhYmxlLmpzXG4gKiogbW9kdWxlIGlkID0gMTI2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgY2xhc3NvZiAgID0gcmVxdWlyZSgnLi8kLmNsYXNzb2YnKVxuICAsIElURVJBVE9SICA9IHJlcXVpcmUoJy4vJC53a3MnKSgnaXRlcmF0b3InKVxuICAsIEl0ZXJhdG9ycyA9IHJlcXVpcmUoJy4vJC5pdGVyYXRvcnMnKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi8kLmNvcmUnKS5pc0l0ZXJhYmxlID0gZnVuY3Rpb24oaXQpe1xuICB2YXIgTyA9IE9iamVjdChpdCk7XG4gIHJldHVybiBPW0lURVJBVE9SXSAhPT0gdW5kZWZpbmVkXG4gICAgfHwgJ0BAaXRlcmF0b3InIGluIE9cbiAgICB8fCBJdGVyYXRvcnMuaGFzT3duUHJvcGVydHkoY2xhc3NvZihPKSk7XG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2JhYmVsLXJ1bnRpbWUvfi9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9jb3JlLmlzLWl0ZXJhYmxlLmpzXG4gKiogbW9kdWxlIGlkID0gMTI3XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJleHBvcnQgKiBmcm9tICcuL3JlbmRlcic7XG5leHBvcnQgKiBmcm9tICcuL3JlYWRvbmx5JztcbmV4cG9ydCAqIGZyb20gJy4vYWRkX2V2ZW50JztcbmV4cG9ydCAqIGZyb20gJy4vaWdub3JlX2V2ZW50JztcbmV4cG9ydCAqIGZyb20gJy4vYWRkX21vdmVtZW50JztcbmV4cG9ydCAqIGZyb20gJy4vaW5pdF9zY3JvbGxiYXInO1xuZXhwb3J0ICogZnJvbSAnLi91cGRhdGVfY2hpbGRyZW4nO1xuZXhwb3J0ICogZnJvbSAnLi91cGRhdGVfYm91bmRpbmcnO1xuZXhwb3J0ICogZnJvbSAnLi9nZXRfb3ZlcmZsb3dfZGlyJztcbmV4cG9ydCAqIGZyb20gJy4vc2V0X3RodW1iX3Bvc2l0aW9uJztcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2ludGVybmFscy9pbmRleC5qc1xuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQHByb3RvdHlwZSB7RnVuY3Rpb259IF9fcmVuZGVyXG4gKi9cblxuaW1wb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH0gZnJvbSAnLi4vc21vb3RoX3Njcm9sbGJhcic7XG5cbmV4cG9ydCB7IFNtb290aFNjcm9sbGJhciB9O1xuXG5mdW5jdGlvbiBuZXh0VGljayhvcHRpb25zLCBjdXJyZW50LCBtb3ZlbWVudCkge1xuICAgIGNvbnN0IHsgZnJpY3RvbiB9ID0gb3B0aW9ucztcblxuICAgIGxldCBxID0gMSAtIGZyaWN0b24gLyAxMDA7XG4gICAgbGV0IG5leHQgPSBjdXJyZW50ICsgbW92ZW1lbnQgKiAoMSAtIHEpO1xuICAgIGxldCByZW1haW4gPSBtb3ZlbWVudCAqIHE7XG5cbiAgICBpZiAoTWF0aC5hYnMocmVtYWluKSA8IDEpIHtcbiAgICAgICAgcmVtYWluID0gMDtcbiAgICAgICAgbmV4dCA9IGN1cnJlbnQgPiBuZXh0ID8gTWF0aC5jZWlsKG5leHQpIDogTWF0aC5mbG9vcihuZXh0KTsgLy8gc3RvcCBhdCBpbnRlZ2VyIHBvc2l0aW9uXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcG9zaXRpb246IG5leHQsXG4gICAgICAgIG1vdmVtZW50OiByZW1haW5cbiAgICB9O1xufTtcblxuZnVuY3Rpb24gX19yZW5kZXIoKSB7XG4gICAgY29uc3Qge1xuICAgICAgICBvcHRpb25zLFxuICAgICAgICBvZmZzZXQsXG4gICAgICAgIG1vdmVtZW50LFxuICAgICAgICBfX3RpbWVySURcbiAgICB9ID0gdGhpcztcblxuICAgIGlmIChtb3ZlbWVudC54IHx8IG1vdmVtZW50LnkpIHtcbiAgICAgICAgbGV0IG5leHRYID0gbmV4dFRpY2sob3B0aW9ucywgb2Zmc2V0LngsIG1vdmVtZW50LngpO1xuICAgICAgICBsZXQgbmV4dFkgPSBuZXh0VGljayhvcHRpb25zLCBvZmZzZXQueSwgbW92ZW1lbnQueSk7XG5cbiAgICAgICAgbW92ZW1lbnQueCA9IG5leHRYLm1vdmVtZW50O1xuICAgICAgICBtb3ZlbWVudC55ID0gbmV4dFkubW92ZW1lbnQ7XG5cbiAgICAgICAgdGhpcy5zZXRQb3NpdGlvbihuZXh0WC5wb3NpdGlvbiwgbmV4dFkucG9zaXRpb24pO1xuICAgIH1cblxuICAgIF9fdGltZXJJRC5zY3JvbGxBbmltYXRpb24gPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpczo6X19yZW5kZXIpO1xuXG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSwgJ19fcmVuZGVyJywge1xuICAgIHZhbHVlOiBfX3JlbmRlcixcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2ludGVybmFscy9yZW5kZXIuanNcbiAqKi8iLCIvKipcbiAqIEBtb2R1bGVcbiAqIEBwcm90b3R5cGUge0Z1bmN0aW9ufSBfX3JlYWRvbmx5XG4gKiBAZGVwZW5kZW5jaWVzIFsgU21vb3RoU2Nyb2xsYmFyIF1cbiAqL1xuXG5pbXBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfSBmcm9tICcuLi9zbW9vdGhfc2Nyb2xsYmFyJztcblxuZXhwb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH07XG5cblxuLyoqXG4gKiBAbWV0aG9kXG4gKiBAaW50ZXJuYWxcbiAqIGNyZWF0ZSByZWFkb25seSBwcm9wZXJ0eVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wXG4gKiBAcGFyYW0ge0FueX0gdmFsdWVcbiAqL1xuZnVuY3Rpb24gX19yZWFkb25seShwcm9wLCB2YWx1ZSkge1xuICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgcHJvcCwge1xuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsICdfX3JlYWRvbmx5Jywge1xuICAgIHZhbHVlOiBfX3JlYWRvbmx5LFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxufSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9pbnRlcm5hbHMvcmVhZG9ubHkuanNcbiAqKi8iLCIvKipcbiAqIEBtb2R1bGVcbiAqIEBwcm90b3R5cGUge0Z1bmN0aW9ufSBfX2FkZEV2ZW50XG4gKi9cblxuaW1wb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH0gZnJvbSAnLi4vc21vb3RoX3Njcm9sbGJhcic7XG5cbmV4cG9ydCB7IFNtb290aFNjcm9sbGJhciB9O1xuXG5mdW5jdGlvbiBfX2FkZEV2ZW50KGVsZW0sIGV2ZW50cywgZm4pIHtcbiAgICBpZiAoIWVsZW0gfHwgdHlwZW9mIGVsZW0uYWRkRXZlbnRMaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBleHBlY3QgZWxlbSB0byBiZSBhIERPTSBlbGVtZW50LCBidXQgZ290ICR7ZWxlbX1gKTtcbiAgICB9XG5cbiAgICBldmVudHMuc3BsaXQoL1xccysvZykuZm9yRWFjaCgoZXZ0KSA9PiB7XG4gICAgICAgIHRoaXMuX19oYW5kbGVycy5wdXNoKHsgZXZ0LCBlbGVtLCBmbiB9KTtcblxuICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoZXZ0LCBmbik7XG4gICAgfSk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSwgJ19fYWRkRXZlbnQnLCB7XG4gICAgdmFsdWU6IF9fYWRkRXZlbnQsXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG59KTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9pbnRlcm5hbHMvYWRkX2V2ZW50LmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gX19pZ25vcmVFdmVudFxuICovXG5cbmltcG9ydCB7IFNtb290aFNjcm9sbGJhciB9IGZyb20gJy4uL3Ntb290aF9zY3JvbGxiYXInO1xuaW1wb3J0IHsgZ2V0T3JpZ2luYWxFdmVudCB9IGZyb20gJy4uL3V0aWxzL2luZGV4JztcblxuZXhwb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH07XG5cbmZ1bmN0aW9uIF9faWdub3JlRXZlbnQoZXZ0ID0ge30pIHtcbiAgICBjb25zdCB7IHRhcmdldCB9ID0gZ2V0T3JpZ2luYWxFdmVudChldnQpO1xuXG4gICAgaWYgKCF0YXJnZXQgfHwgdGFyZ2V0ID09PSB3aW5kb3cgfHwgIXRoaXMuY2hpbGRyZW4pIHJldHVybiBmYWxzZTtcblxuICAgIHJldHVybiAoIWV2dC50eXBlLm1hdGNoKC9kcmFnLykgJiYgZXZ0LmRlZmF1bHRQcmV2ZW50ZWQpfHxcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5zb21lKChzYikgPT4gc2IuY29udGFpbnModGFyZ2V0KSk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSwgJ19faWdub3JlRXZlbnQnLCB7XG4gICAgdmFsdWU6IF9faWdub3JlRXZlbnQsXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG59KTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9pbnRlcm5hbHMvaWdub3JlX2V2ZW50LmpzXG4gKiovIiwiLyoqXG4gKiBAbW9kdWxlXG4gKiBAcHJvdG90eXBlIHtGdW5jdGlvbn0gX19hZGRNb3ZlbWVudFxuICovXG5cbmltcG9ydCB7IFNtb290aFNjcm9sbGJhciB9IGZyb20gJy4uL3Ntb290aF9zY3JvbGxiYXInO1xuXG5leHBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfTtcblxuZnVuY3Rpb24gX19hZGRNb3ZlbWVudChkZWx0YVggPSAwLCBkZWx0YVkgPSAwKSB7XG4gICAgY29uc3QgeyBtb3ZlbWVudCwgb3B0aW9ucyB9ID0gdGhpcztcblxuICAgIG1vdmVtZW50LnggKz0gKGRlbHRhWCAqIG9wdGlvbnMuc3BlZWQpO1xuICAgIG1vdmVtZW50LnkgKz0gKGRlbHRhWSAqIG9wdGlvbnMuc3BlZWQpO1xufTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsICdfX2FkZE1vdmVtZW50Jywge1xuICAgIHZhbHVlOiBfX2FkZE1vdmVtZW50LFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxufSk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvaW50ZXJuYWxzL2FkZF9tb3ZlbWVudC5qc1xuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQHByb3RvdHlwZSB7RnVuY3Rpb259IF9faW5pdFNjcm9sbGJhclxuICovXG5cbmltcG9ydCB7IFNtb290aFNjcm9sbGJhciB9IGZyb20gJy4uL3Ntb290aF9zY3JvbGxiYXInO1xuXG5leHBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfTtcblxuXG4vKipcbiAqIEBtZXRob2RcbiAqIEBpbnRlcm5hbFxuICogaW5pdGlhbGl6ZSBzY3JvbGxiYXJcbiAqXG4gKiBUaGlzIG1ldGhvZCB3aWxsIGF0dGFjaCBzZXZlcmFsIGxpc3RlbmVycyB0byBlbGVtZW50c1xuICogYW5kIGNyZWF0ZSBhIGRlc3Ryb3kgbWV0aG9kIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uOiBhcyBpcyBleHBsYWluZWQgaW4gY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gX19pbml0U2Nyb2xsYmFyKCkge1xuICAgIHRoaXMudXBkYXRlKCk7IC8vIGluaXRpYWxpemUgdGh1bWIgcG9zaXRpb25cblxuICAgIHRoaXMuX19rZXlib2FyZEhhbmRsZXIoKTtcbiAgICB0aGlzLl9fcmVzaXplSGFuZGxlcigpO1xuICAgIHRoaXMuX19zZWxlY3RIYW5kbGVyKCk7XG4gICAgdGhpcy5fX21vdXNlSGFuZGxlcigpO1xuICAgIHRoaXMuX190b3VjaEhhbmRsZXIoKTtcbiAgICB0aGlzLl9fd2hlZWxIYW5kbGVyKCk7XG4gICAgdGhpcy5fX2RyYWdIYW5kbGVyKCk7XG5cbiAgICB0aGlzLl9fcmVuZGVyKCk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSwgJ19faW5pdFNjcm9sbGJhcicsIHtcbiAgICB2YWx1ZTogX19pbml0U2Nyb2xsYmFyLFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxufSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9pbnRlcm5hbHMvaW5pdF9zY3JvbGxiYXIuanNcbiAqKi8iLCIvKipcbiAqIEBtb2R1bGVcbiAqIEBwcm90b3R5cGUge0Z1bmN0aW9ufSBfX3VwZGF0ZUNoaWxkcmVuXG4gKi9cblxuaW1wb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH0gZnJvbSAnLi4vc21vb3RoX3Njcm9sbGJhcic7XG5pbXBvcnQgeyBzZWxlY3RvcnMgfSBmcm9tICcuLi9zaGFyZWQvc2VsZWN0b3JzJztcblxuZXhwb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH07XG5cbmZ1bmN0aW9uIF9fdXBkYXRlQ2hpbGRyZW4oKSB7XG4gICAgdGhpcy5fX3JlYWRvbmx5KCdjaGlsZHJlbicsIFsuLi50aGlzLnRhcmdldHMuY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9ycyldKTtcbn07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShTbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLCAnX191cGRhdGVDaGlsZHJlbicsIHtcbiAgICB2YWx1ZTogX191cGRhdGVDaGlsZHJlbixcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvaW50ZXJuYWxzL3VwZGF0ZV9jaGlsZHJlbi5qc1xuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQHByb3RvdHlwZSB7RnVuY3Rpb259IF9fdXBkYXRlQm91bmRpbmdcbiAqL1xuXG5pbXBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfSBmcm9tICcuLi9zbW9vdGhfc2Nyb2xsYmFyJztcbmltcG9ydCB7IHNlbGVjdG9ycyB9IGZyb20gJy4uL3NoYXJlZC9zZWxlY3RvcnMnO1xuXG5leHBvcnQgeyBTbW9vdGhTY3JvbGxiYXIgfTtcblxuZnVuY3Rpb24gX191cGRhdGVCb3VuZGluZygpIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lciB9ID0gdGhpcy50YXJnZXRzO1xuICAgIGNvbnN0IHsgdG9wLCByaWdodCwgYm90dG9tLCBsZWZ0IH0gPSBjb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgeyBpbm5lckhlaWdodCwgaW5uZXJXaWR0aCB9ID0gd2luZG93O1xuXG4gICAgdGhpcy5fX3JlYWRvbmx5KCdib3VuZGluZycsIHtcbiAgICAgICAgdG9wOiBNYXRoLm1heCh0b3AsIDApLFxuICAgICAgICByaWdodDogTWF0aC5taW4ocmlnaHQsIGlubmVyV2lkdGgpLFxuICAgICAgICBib3R0b206IE1hdGgubWluKGJvdHRvbSwgaW5uZXJIZWlnaHQpLFxuICAgICAgICBsZWZ0Ok1hdGgubWF4KGxlZnQsIDApXG4gICAgfSk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSwgJ19fdXBkYXRlQm91bmRpbmcnLCB7XG4gICAgdmFsdWU6IF9fdXBkYXRlQm91bmRpbmcsXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2ludGVybmFscy91cGRhdGVfYm91bmRpbmcuanNcbiAqKi8iLCIvKipcbiAqIEBtb2R1bGVcbiAqIEBwcm90b3R5cGUge0Z1bmN0aW9ufSBfX2dldE92ZXJmbG93RGlyXG4gKi9cblxuaW1wb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH0gZnJvbSAnLi4vc21vb3RoX3Njcm9sbGJhcic7XG5pbXBvcnQgeyBnZXRQb3NpdGlvbiB9IGZyb20gJy4uL3V0aWxzL2luZGV4JztcblxuZXhwb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH07XG5cbmZ1bmN0aW9uIF9fZ2V0T3ZlcmZsb3dEaXIoZXZ0LCBlZGdlID0gMCkge1xuICAgIGNvbnN0IHsgdG9wLCByaWdodCwgYm90dG9tLCBsZWZ0IH0gPSB0aGlzLmJvdW5kaW5nO1xuICAgIGNvbnN0IHsgeCwgeSB9ID0gZ2V0UG9zaXRpb24oZXZ0KTtcblxuICAgIGNvbnN0IHJlcyA9IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgIH07XG5cbiAgICBpZiAoeCA9PT0gMCAmJiB5ID09PSAwKSByZXR1cm4gcmVzO1xuXG4gICAgaWYgKHggPiByaWdodCAtIGVkZ2UpIHtcbiAgICAgICAgcmVzLnggPSAoeCAtIHJpZ2h0ICsgZWRnZSk7XG4gICAgfSBlbHNlIGlmICh4IDwgbGVmdCArIGVkZ2UpIHtcbiAgICAgICAgcmVzLnggPSAoeCAtIGxlZnQgLSBlZGdlKTtcbiAgICB9XG5cbiAgICBpZiAoeSA+IGJvdHRvbSAtIGVkZ2UpIHtcbiAgICAgICAgcmVzLnkgPSAoeSAtIGJvdHRvbSArIGVkZ2UpO1xuICAgIH0gZWxzZSBpZiAoeSA8IHRvcCArIGVkZ2UpIHtcbiAgICAgICAgcmVzLnkgPSAoeSAtIHRvcCAtIGVkZ2UpO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSwgJ19fZ2V0T3ZlcmZsb3dEaXInLCB7XG4gICAgdmFsdWU6IF9fZ2V0T3ZlcmZsb3dEaXIsXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG59KTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9pbnRlcm5hbHMvZ2V0X292ZXJmbG93X2Rpci5qc1xuICoqLyIsIi8qKlxuICogQG1vZHVsZVxuICogQHByb3RvdHlwZSB7RnVuY3Rpb259IF9fc2V0VGh1bWJQb3NpdGlvblxuICovXG5cbmltcG9ydCB7IHNldFN0eWxlIH0gZnJvbSAnLi4vdXRpbHMvaW5kZXgnO1xuaW1wb3J0IHsgU21vb3RoU2Nyb2xsYmFyIH0gZnJvbSAnLi4vc21vb3RoX3Njcm9sbGJhcic7XG5cbmV4cG9ydCB7IFNtb290aFNjcm9sbGJhciB9O1xuXG4vKipcbiAqIEBtZXRob2RcbiAqIEBpbnRlcm5hbFxuICogU2V0IHRodW1iIHBvc2l0aW9uIGluIHRyYWNrXG4gKi9cbmZ1bmN0aW9uIF9fc2V0VGh1bWJQb3NpdGlvbigpIHtcbiAgICBsZXQgeyB4LCB5IH0gPSB0aGlzLm9mZnNldDtcbiAgICBsZXQgeyB4QXhpcywgeUF4aXMgfSA9IHRoaXMudGFyZ2V0cztcblxuICAgIGxldCBzdHlsZVggPSBgdHJhbnNsYXRlM2QoJHt4IC8gdGhpcy5zaXplLmNvbnRlbnQud2lkdGggKiB0aGlzLnNpemUuY29udGFpbmVyLndpZHRofXB4LCAwLCAwKWA7XG4gICAgbGV0IHN0eWxlWSA9IGB0cmFuc2xhdGUzZCgwLCAke3kgLyB0aGlzLnNpemUuY29udGVudC5oZWlnaHQgKiB0aGlzLnNpemUuY29udGFpbmVyLmhlaWdodH1weCwgMClgO1xuXG4gICAgc2V0U3R5bGUoeEF4aXMudGh1bWIsIHtcbiAgICAgICAgJy13ZWJraXQtdHJhbnNmb3JtJzogc3R5bGVYLFxuICAgICAgICAndHJhbnNmb3JtJzogc3R5bGVYXG4gICAgfSk7XG5cbiAgICBzZXRTdHlsZSh5QXhpcy50aHVtYiwge1xuICAgICAgICAnLXdlYmtpdC10cmFuc2Zvcm0nOiBzdHlsZVksXG4gICAgICAgICd0cmFuc2Zvcm0nOiBzdHlsZVlcbiAgICB9KTtcbn07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShTbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLCAnX19zZXRUaHVtYlBvc2l0aW9uJywge1xuICAgIHZhbHVlOiBfX3NldFRodW1iUG9zaXRpb24sXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2ludGVybmFscy9zZXRfdGh1bWJfcG9zaXRpb24uanNcbiAqKi8iLCJpbXBvcnQgU2Nyb2xsYmFyIGZyb20gJy4uLy4uL3NyYy8nO1xuaW1wb3J0IHsgREVGQVVMVF9PUFRJT05TIH0gZnJvbSAnLi4vLi4vc3JjL29wdGlvbnMnO1xuXG5jb25zdCBEUFIgPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbmNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX09QVElPTlMpO1xuXG5jb25zdCBzaXplID0ge1xuICAgIHdpZHRoOiAyNTAsXG4gICAgaGVpZ2h0OiAxNTBcbn07XG5cbmNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcmV2aWV3Jyk7XG5jb25zdCBzY3JvbGxiYXIgPSBTY3JvbGxiYXIuZ2V0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250ZW50JykpO1xuY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbmNhbnZhcy53aWR0aCA9IHNpemUud2lkdGggKiBEUFI7XG5jYW52YXMuaGVpZ2h0ID0gc2l6ZS5oZWlnaHQgKiBEUFI7XG5jdHguc2NhbGUoRFBSLCBEUFIpO1xuXG5jdHguc3Ryb2tlU3R5bGUgPSAnIzk0YTZiNyc7XG5jdHguZmlsbFN0eWxlID0gJyNhYmMnO1xuXG5sZXQgc2hvdWxkVXBkYXRlID0gdHJ1ZTtcblxuZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIGlmICghc2hvdWxkVXBkYXRlKSB7XG4gICAgICAgIHJldHVybiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbiAgICB9XG5cbiAgICBsZXQgZG90cyA9IGNhbGNEb3RzKCk7XG5cbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIHNpemUud2lkdGgsIHNpemUuaGVpZ2h0KTtcbiAgICBjdHguc2F2ZSgpO1xuICAgIGN0eC50cmFuc2Zvcm0oMSwgMCwgMCwgLTEsIDAsIHNpemUuaGVpZ2h0KTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4Lm1vdmVUbygwLCAwKTtcblxuICAgIGxldCBzY2FsZVggPSAoc2l6ZS53aWR0aCAvIGRvdHMubGVuZ3RoKSAqIChvcHRpb25zLnNwZWVkIC8gMjAgKyAwLjUpO1xuICAgIGRvdHMuZm9yRWFjaCgoW3gsIHldKSA9PiB7XG4gICAgICAgIGN0eC5saW5lVG8oeCAqIHNjYWxlWCwgeSk7XG4gICAgfSk7XG5cbiAgICBjdHguc3Ryb2tlKCk7XG5cbiAgICBsZXQgW3gsIHldID0gZG90c1tkb3RzLmxlbmd0aCAtIDFdO1xuICAgIGN0eC5saW5lVG8oeCAqIHNjYWxlWCwgeSk7XG4gICAgY3R4LmZpbGwoKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgY3R4LnJlc3RvcmUoKTtcblxuICAgIHNob3VsZFVwZGF0ZSA9IGZhbHNlO1xuXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG59O1xuXG5yZW5kZXIoKTtcblxuZnVuY3Rpb24gY2FsY0RvdHMoKSB7XG4gICAgbGV0IHtcbiAgICAgICAgc3BlZWQsXG4gICAgICAgIGZyaWN0b25cbiAgICB9ID0gb3B0aW9ucztcblxuICAgIGxldCBkb3RzID0gW107XG5cbiAgICBsZXQgeCA9IDA7XG4gICAgbGV0IHkgPSAoc3BlZWQgLyAyMCArIDAuNSkgKiBzaXplLmhlaWdodDtcblxuICAgIHdoaWxlKHkgPiAwLjEpIHtcbiAgICAgICAgZG90cy5wdXNoKFt4LCB5XSk7XG5cbiAgICAgICAgeSAqPSAoMSAtIGZyaWN0b24gLyAxMDApO1xuICAgICAgICB4Kys7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRvdHM7XG59O1xuXG5bLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm9wdGlvbnMnKV0uZm9yRWFjaCgoZWwpID0+IHtcbiAgICBjb25zdCBwcm9wID0gZWwubmFtZTtcbiAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5vcHRpb24tJHtwcm9wfWApO1xuXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCAoKSA9PiB7XG4gICAgICAgIGxhYmVsLnRleHRDb250ZW50ID0gb3B0aW9uc1twcm9wXSA9IHBhcnNlRmxvYXQoZWwudmFsdWUpO1xuICAgICAgICBzY3JvbGxiYXIuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgc2hvdWxkVXBkYXRlID0gdHJ1ZTtcbiAgICB9KTtcbn0pO1xuXG5yZW5kZXIoKTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3Rlc3Qvc2NyaXB0cy9wcmV2aWV3LmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==