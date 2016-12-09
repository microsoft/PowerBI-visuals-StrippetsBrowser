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

var UnchartedKeyboard = function UnchartedKeyboard(elem, options) {
    var opt = options || {};
    var delay = opt.repeatDelay || 100;
    var keysdown;
    var timerId;
    this.isHolding = function (key) {
        return keysdown[key];
    };
    this.bindKeydown = function (handler) {
        if (!keysdown) {
            keysdown = {};
        }
        $(elem).keydown(function(e) {
            if (!timerId) {
                keysdown[e.which] = true;
                timerId = setTimeout(function () {
                    handler(e.which);
                    timerId = undefined;
                }, delay);
            }
        });
        $(elem).keyup(function(e) {
            delete keysdown[e.which];
        });
    };
};

module.exports = UnchartedKeyboard;
