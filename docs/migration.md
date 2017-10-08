# Migration from 7.x

> The following sections describe the major changes from 7.x to 8.x.

## Plugin System

See [Plugin System](plugin.md) for details;

## Standalone overscroll plugin

Overscroll effect is no longer bundle with main package. You need to import it manually:

```js
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';

Scrollbar.use(OverscrollPlugin);

Scrollbar.init(elem, {
  plugins: {
    overscroll: options | false,
  },
});
```

OR

```html
<script src="dist/smooth-scrollbar.js"></script>
<script src="dist/plugins/overscroll.js"></script>

<script>
  var Scrollbar = window.Scrollbar;

  Scrollbar.use(window.OverscrollPlugin)

  Scrollbar.init(elem, {
    plugins: {
      overscroll: options | false,
    },
  });
</script>
```

## Deprecated Options

The following options have been removed from 8.x.

### `options.speed`

Reason: can be implemented with `ScrollPlugin`:

```js
// 7.x speed scale
options.speed = 10;

// equivalent in 8.x
class ScalePlugin {
  static pluginName = 'scale';

  static defaultOptions = {
    speed: 1,
  };

  transformDelta(delta) {
    const { speed } = this.options;

    return {
      x: delta.x * speed,
      y: delta.y * speed,
    };
  }
}

Scrollbar.use(ScalePlugin);

Scrollbar.init(elem, {
  plugins: {
    scale: {
      speed: 10,
    },
  },
});
```

### `options.syncCallbacks`

Reason: scrolling listeners will always be invoked synchronously.

```js
// 7.x asynchronous listener:
options.syncCallbacks = false;

// equivalent in 8.x
scrollbar.addListener(() => {
  requestAnimationFrame(() => {
    // do something
  });
});
```

### `options.overscrollEffect`, `options.overscrollEffectColor`, `options.overscrollDamping`

Reason: use [overscroll plugin](overscroll.md).

## Imcompatible Properties

### `scrollbar.target`

Removed in 8.x.

## Deprecated Methods

### `scrollbar.infiniteScroll()`

Reason: can be implemented with `ScrollbarPlugin`.

### `scrollbar.stop()`

Reason: use `scrollbar.setMomentum(0, 0)`.

## Imcompatible Methods

### `scrollbar.setPosition()`

7.x: `scrollbar.setPosition(x, y, withoutCallbacks)`

8.x: `scrollbar.setPosition(x, y, options)`

```js
// 7.x
scrollbar.setPosition(0, 0, true);

// equivalent in 8.x
scrollbar.setPosition(0, 0, {
  withoutCallbacks: true,
});
```

### `scrollbar.scrollTo()`

7.x: `scrollbar.scrollTo(x, y, duration, callback)`

8.x: `scrollbar.scrollTo(x, y, duration, options)`

```js
// 7.x
scrollbar.scrollTo(0, 0, 300, cb);

// equivalent in 8.x
scrollbar.scrollTo(0, 0, 300, {
  callback: cb,
});
```
