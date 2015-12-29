/**
 * @module
 * @prototype {Function} scrollTo
 * @dependencies [ SmoothScrollbar, #showTrack, #hideTrack, pickInRange ]
 */

import './set_position';
import { pickInRange } from '../utils/index';
import { SmoothScrollbar } from '../smooth_scrollbar';

export { SmoothScrollbar };

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
SmoothScrollbar.prototype.scrollTo = function(x = this.offset.x, y = this.offset.y, duration = 0, cb = null) {
    cb = typeof cb === 'function' ? cb : () => {};

    const { offset, limit, __timerID } = this;
    const destX = pickInRange(x, 0, limit.x);
    const destY = pickInRange(y, 0, limit.y);

    if (destX === offset.x && destY === offset.y) {
        return requestAnimationFrame(() => {
            cb(this);
        });
    }

    const frames = {
        x: this.__motionBuilder(offset.x, destX - offset.x, duration),
        y: this.__motionBuilder(offset.y, destY - offset.y, duration)
    };

    let i = 0, length = frames.x.length;

    let scroll = () => {
        if (i === length) {
            return cb(this);
        }

        this.setPosition(frames.x[i], frames.y[i]);

        i++;

        __timerID.scrollAnimation = requestAnimationFrame(scroll);
    };

    scroll();
};