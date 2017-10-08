# Smooth Scrollbar

[![npm](https://img.shields.io/npm/v/smooth-scrollbar.svg?style=flat-square)](https://www.npmjs.com/package/smooth-scrollbar)
[![downloads](https://img.shields.io/npm/dt/smooth-scrollbar.svg?style=flat-square)](https://www.npmjs.com/package/smooth-scrollbar)
[![license](https://img.shields.io/npm/l/smooth-scrollbar.svg?style=flat-square)](LICENSE)
[![Travis](https://img.shields.io/travis/idiotWu/smooth-scrollbar.svg)](https://travis-ci.org/idiotWu/smooth-scrollbar)

Customizable, Flexible, and High Performance Scrollbars!

## Installation

Via NPM **(recommended)**:

```
npm install smooth-scrollbar --save
```

Via Bower:

```
bower install smooth-scrollbar --save
```

## Browser Compatibility

| Browser | Version |
| :------ | :-----: |
| IE      | 10+     |
| Chrome  | 22+     |
| Firefox | 16+     |
| Safari  | 8+      |
| Android Browser | 4+ |
| Chrome for Android | 32+ |
| iOS Safari | 7+ |

## Demo

[http://idiotwu.github.io/smooth-scrollbar/](http://idiotwu.github.io/smooth-scrollbar/)

## Usage

Since this package has a [pkg.module](https://github.com/rollup/rollup/wiki/pkg.module) filed, it's highly recommended to import it as an ES6 module with some bundlers like [webpack](https://webpack.js.org/) or [rollup](https://rollupjs.org/):

```js
import Scrollbar from 'smooth-scrollbar';

Scrollbar.init(document.querySelector('#my-scrollbar'));
```

If you are not using any bundlers, you can just load the UMD bundle:

```html
<script src="dist/smooth-scrollbar.js"></script>

<script>
  var Scrollbar = window.Scrollbar;

  Scrollbar.init(document.querySelector('#my-scrollbar'));
</script>
```

## Documentation

| [latest](docs) | [7.x](https://github.com/idiotWu/smooth-scrollbar/tree/7.x) |
|----|----|

## License

[MIT](LICENSE)
