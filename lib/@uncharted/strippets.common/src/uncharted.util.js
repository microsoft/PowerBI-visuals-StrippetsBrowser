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

var util = {

};

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
 * Walk up the DOM from the given child, looking for a CSS scale transform.
 * If found, return the numeric value of the scale, assuming it is uniform.
 * @param {Object} $child - JQuery-wrapped DOM node to start the search from
 * @returns {number} Scale transform of nearest scaled parent, or 1 if none is found.
 * @static
 */
util.getParentScale = function ($child) {
    if ($child.parent) {
        var $parent = $child.parent();
        if ($parent && $parent[0] !== document) {
            var transform = $parent.css('transform');
            if (transform !== 'none') {
                var values = transform.split('(')[1].split(')')[0].split(',');
                var a = Number(values[0]);
                var b = Number(values[1]);
                return Math.sqrt(a * a + b * b);
            }

            return util.getParentScale($parent);
        }
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

util.isScrollingVerticalContent = function ($element, wheelDelta) {
    var scrollTop = $element.scrollTop();
    var isScrollBottom = (scrollTop + $element.innerHeight()) >= $element[0].scrollHeight;
    return !(wheelDelta > 0 && scrollTop === 0) && !(wheelDelta < 0 && isScrollBottom);
};

/**
 * Allow the mouse wheel to scroll the view horizontally whenever the mouse is over content not needing vertical scrolling.
 * @param {Object} t - context object, where the scroll handlers will be attached (for testing)
 * @param {Object} $element - JQuery-wrapped scroll target
 * @param {Array} listAccessor - name of the property of t referring to an array of strippets
 * @param {String} itemAccessor - name of the property of each list item that is the item's JQuery element
 */
util.mapVerticalScrollToHorizontalScroll = function(t, $element, listAccessor, itemAccessor) {
    t._horizontalMouseScroll = function(event) {
        event.preventDefault();
        var direction = (event.originalEvent.detail < 0 || event.originalEvent.wheelDelta > 0) ? 1 : -1;
        var wheelDelta = direction * ((t[listAccessor].length && t[listAccessor][0][itemAccessor].width()) || 2) * 0.5;
        var isScrollingVerticalContent = util.isScrollingVerticalContent($(this), wheelDelta);
        if (isScrollingVerticalContent) {
            $element.scrollTop($element.scrollTop() - wheelDelta);
            event.stopPropagation();
        } else {
            $element.scrollLeft($element.scrollLeft() - wheelDelta);
        }
    };
    $element.on('mousewheel DOMMouseScroll', t._horizontalMouseScroll);

    t._readerMouseScroll = function (event) {
        var wheelDelta = event.type === 'DOMMouseScroll' // if firefox
            ? -event.originalEvent.detail
            : event.originalEvent.wheelDelta;
        var isScrollingVerticalContent = util.isScrollingVerticalContent($(this), wheelDelta);
        if (isScrollingVerticalContent) event.stopPropagation();
    };
    $element.on('mousewheel DOMMouseScroll', '.readerContent', t._readerMouseScroll);
};

module.exports = util;
