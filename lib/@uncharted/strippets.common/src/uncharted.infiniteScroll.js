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

function InfiniteScroll(element, scrollableViewport) {
    this._$viewport = $(scrollableViewport);
    this._$element = $(element);
    this._isLoading = false;
    this._disabled = false;
    this._timeoutDelay = 50;
}

InfiniteScroll.prototype.onInfinite = function (callback) {
    var t = this;
    var timeoutId;
    var $viewport = t._$viewport;
    var element = t._$element[0];
    $viewport.on('scroll', function () {
        timeoutId = setTimeout(function () {
            clearTimeout(timeoutId);
            if (!t._disabled && !t._isLoading && t.isElementInViewport(element, $viewport[0])) {
                t._isLoading = true;
                callback(); // eslint-disable-line
            }
        }, t._timeoutDelay);
    });
};

InfiniteScroll.prototype.infiniteScrollDone = function () {
    this._isLoading = false;
};

InfiniteScroll.prototype.disable = function () {
    this._disabled = true;
};

InfiniteScroll.prototype.enable = function () {
    this._disabled = false;
};

InfiniteScroll.prototype.isElementInViewport = function (el, vp) {
    var vpRect = vp.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    return (
        elRect.top >= vpRect.top &&
        elRect.left >= vpRect.left &&
        elRect.bottom <= vpRect.bottom &&
        elRect.right <= vpRect.right
    );
};

module.exports = InfiniteScroll;
