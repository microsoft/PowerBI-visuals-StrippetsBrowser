/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

var $ = require('jquery');

var MouseHold = function MouseHold($element) {
    var t = this;
    t.$e = $element;
    t._resolution = 5;
    t._isMouseDown = false;
    t._intervalId = null;
    t._whileMouseDown = null;
    t._duration = null;

    var bind = function (whileMouseDown) {
        if (typeof whileMouseDown !== 'function') throw new Error('whileMouseDown must a function');
        t._whileMouseDown = whileMouseDown;
        t.$e.on('mousedown', function () {
            if (!t._isMouseDown) {
                t._isMouseDown = true;
                t._duration = 0;
                t._intervalId = setInterval(function () {
                    t._duration += t._resolution;
                    if (t._isMouseDown) {
                        t._whileMouseDown(t._duration);
                    } else {
                        clearInterval(t._intervalId);
                    }
                }, t._resolution);
            }
        });
        t.$e.on('mouseup mouseoff', function () {
            t._isMouseDown = false;
            t._duration = null;
            clearInterval(t._intervalId);
        });
        return t;
    };

    var unbind = function () {
        // removes all handlers associated with these elements.

        t.$e.off('mousedown');
        t.$e.off('mouseup mouseoff');
        t._whileMouseDown = null;
    };
    t.bind = bind;
    t.unbind = unbind;
    return t;
};

module.exports = MouseHold;
module.exports.asJQueryPlugin = function () {
    $.fn.mousehold = function () {
        if (!this._mousehold) {
            this._mousehold = new MouseHold(this);
        }
        return this._mousehold;
    };
};
