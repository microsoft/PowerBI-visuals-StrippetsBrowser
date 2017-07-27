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
/* global $ */

var util = {

};
var MOUSE_WHEEL_EVENTS = 'mousewheel.stories.vtoh DOMMouseScroll.stories.vtoh';

/**
 * Utility function to find a given style declared in the document, good for things like animating styles.
 *
 * @method getCSSRule
 * @param {String} ruleName - The name of the CSS rule (class) to get.
 * @returns {Array} An array containing all the rules found that match the given name, or null if none were found or an error was encountered.
 * @static
 */
util.getCSSRule = function(ruleName) {
    var ruleNameLowerCase = ruleName.toLowerCase();
    var ret = [];
    if (document.styleSheets) {
        var styleSheets = document.styleSheets;
        for (var i = 0, n = styleSheets.length; i < n; ++i) {
            var cssRules;
            try {
                cssRules = styleSheets[i].cssRules || styleSheets[i].rules || null;
            } catch (e) {
                cssRules = null;
            }
            if (cssRules) {
                var cssRule = null;
                var classes = null;
                for (var ii = 0, nn = cssRules.length; ii < nn; ++ii) {
                    cssRule = cssRules[ii];
                    if (cssRule.type === CSSRule.STYLE_RULE) {
                        classes = cssRule.selectorText.split('.');
                        if (classes && classes.length && classes[classes.length - 1].toLowerCase() === ruleNameLowerCase) {
                            ret.push(cssRule);
                        }
                    }
                }
            }
        }
    }

    return ret.length ? ret : null;
};

/**
 * Compute the effective scale applied to the given element by setting the element to a fixed width,
 * then comparing the fixed width to the actual width returned by getBoundingClientRect().
 * Clears the element's width property afterwards.
 * @param {Object} $child - find the scale of this JQuery-wrapped DOM node
 * @returns {number} Scale applied to the given element, or 1 if the scale can't be determined.
 * @static
 */
util.getParentScale = function ($child) {
    if ($child && $child[0] && $child[0].getBoundingClientRect) {
        // compute the effective scale factor by sizing the tooltip and comparing to the actual result
        $child.width(100); // force it to resize, if needed, before we measure
        var scale = 100 / $child[0].getBoundingClientRect().width;
        $child.css('width', ''); // clear the fixed width we set
        return isFinite(scale) ? scale : 1;
    }

    return 1;
};

/**
 * Hash a string, such as a domain, into one of 256 shades of gray.
 * @param {String} str - arbitrary string to hash into a grey shade
 * @param {Number=} min - optional lower bound for the grey value
 * @param {Number=} max - optional upper bound for the grey value
 * @returns {number|*} A shade of grey in the range [min|0, max|255]
 * @static
 */
util.grayShadeFromString = function(str, min, max) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    var color32bit = (hash & 0xFFFFFF);
    var r = (color32bit >> 16) & 255;
    var g = (color32bit >> 8) & 255;
    var b = color32bit & 255;

    /* clamp the colors */
    if (min !== undefined) {
        r = Math.max(r, min);
        g = Math.max(g, min);
        b = Math.max(b, min);
    }

    if (max !== undefined) {
        r = Math.min(r, max);
        g = Math.min(g, max);
        b = Math.min(b, max);
    }

    return Math.floor((r + g + b) / 3);
};

/**
 * Generate a Data URL encoding a grey single-letter icon.
 * @param {Number} width - width of the icon in pixels
 * @param {Number} height - height of the icon in pixels
 * @param {String} sourceName - string to create an icon for;
 * the first character becomes the icon's letter and the string as a whole gets hashed into a grey shade
 * @returns {string} Data URL encoding an icon image
 * @static
 */
util.createFallbackIconURL = function(width, height, sourceName) {
    /* get the gray shade for the background */
    var channel = util.grayShadeFromString(sourceName, 0, 102);

    /* initialize an offscreen canvas */
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');

    /* draw the background */
    context.fillStyle = 'rgb(' + channel + ',' + channel + ',' + channel + ')';
    context.fillRect(0, 0, width, height);

    /* make the channel brighter for the text */
    channel = Math.floor(channel * 2.5);
    context.fillStyle = 'rgb(' + channel + ',' + channel + ',' + channel + ')';

    /* draw the text */
    var letter = sourceName[0].toUpperCase();
    context.font = Math.round(height * 0.7) + 'px helvetica';
    context.fontWeight = 'bolder';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, width * 0.5, height * 0.5);

    return canvas.toDataURL();
};

/**
 * Test whether the given wheel scroll delta should be applied to the given element's vertical scroll position.
 * @param {Object} $element - JQuery-wrapped element being scrolled
 * @param {Number} wheelDelta - signed mouse wheel scroll amount
 * @returns {boolean} true if wheelDelta should be applied to scrollTop; otherwise, apply it to scrollLeft
 */
util.isScrollingVerticalContent = function ($element, wheelDelta) {
    var scrollTop = $element.scrollTop();
    var isScrollBottom = (scrollTop + $element.innerHeight()) >= $element[0].scrollHeight;
    return !(wheelDelta > 0 && scrollTop === 0) && !(wheelDelta < 0 && isScrollBottom);
};

/**
 * Allow the mouse wheel to scroll the view horizontally whenever the mouse is over content not needing vertical scrolling.
 * @param {Object} $element - JQuery-wrapped scroll target
 * @param {number} delta - A positive integer determining how fast scrolling speed will be
 */
util.mapVerticalScrollToHorizontalScroll = function($element, delta) {
    var canIScrollVertically = true;
    var preventFollowingVerticalScrolling = util.debounce(function () {
        canIScrollVertically = true;
    }, 1000);
    var horizontalMouseScroll = function(event) {
        event.preventDefault();
        canIScrollVertically = false;
        var direction = (event.originalEvent.detail < 0 || event.originalEvent.wheelDelta > 0) ? 1 : -1;
        var wheelDelta = direction * (delta || 20) * 0.5;
        var isScrollingVerticalContent = util.isScrollingVerticalContent($(this), wheelDelta);
        if (isScrollingVerticalContent) {
            $element.scrollTop($element.scrollTop() - wheelDelta);
            event.stopPropagation();
        } else {
            $element.scrollLeft($element.scrollLeft() - wheelDelta);
        }
        preventFollowingVerticalScrolling();
    };
    $element.on(MOUSE_WHEEL_EVENTS, horizontalMouseScroll);

    var readerMouseScroll = function (event) {
        event.stopPropagation();
        !canIScrollVertically && event.preventDefault();
    };
    $element.on(MOUSE_WHEEL_EVENTS, '.readerContent', readerMouseScroll);
};

/**
 * Un map vertical scrolling to horizontal scrolling by mapVerticalScrollToHorizontalScroll().
 * @param {Object} $element - JQuery-wrapped element being scrolled
 */
util.unMapVerticalScrollToHorizontalScroll = function($element) {
    $element.off(MOUSE_WHEEL_EVENTS);
    $element.off(MOUSE_WHEEL_EVENTS, '.readerContent');
};

util.debounce = function (func, wait, immediate) {
    var timeout;
    return function () {
        var context = this;
        var args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

module.exports = util;
