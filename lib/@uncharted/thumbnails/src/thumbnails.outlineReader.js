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
var Promise = require('bluebird');
var IBindable = require('./IBindable');
var Outline = require('@uncharted/strippets').Outline;
var defaults = require('./thumbnails.defaults.js');
var template = require('../templates/outlineReader.handlebars');

function OutlineReader(spec) {
    var t = this;
    IBindable.call(t);
    t._$element = $(template());
    t._config = $.extend({}, defaults.config.outlineReader, spec.config);
    t._iconMap = spec.iconMap;
    t._highlights = spec.highlights;
    t._outline = undefined;
    t._width = t._config.readerWidth;
}
/**
 * Width of the outline reader
 */
Object.defineProperty(OutlineReader.prototype, 'width', {
    get: function() {
        return this._width;
    },
    set: function(value) {
        this._width = value;
    },
});

/**
 * @inheritance {IBindable}
 */
OutlineReader.prototype = Object.create(IBindable.prototype);
OutlineReader.prototype.constructor = OutlineReader;

/**
 * Width of the outline reader
 */
Object.defineProperty(OutlineReader.prototype, 'width', {
    get: function() {
        return this._width;
    },
    set: function(value) {
        this._width = value;
    },
});

/**
 * Update the content of the reader.
 * @param {Object} data - data to be populated.
 */
OutlineReader.prototype.updateContent = function(data) {
    var t = this;
    t._data = data;
    t._$element.empty();
    t.abortContentLoading();
    $.Velocity.mock = true;
    t._outline = new Outline(t._$element, t._data, t._iconMap, t._getOutlineConfig(), 'readingmode', t._highlights);
    t._outline.$outline.on('click', '.' + t._outline.classes.reader.closeButton, function (event) {
        event.stopImmediatePropagation();
        t.emit(defaults.events.outlineReaderCloseButtonClick, t.data);
    });
};

OutlineReader.prototype.abortContentLoading = function () {
    if (this._outline && this._outline.reader && this._outline.reader.activeLoadingQueue) {
        this._outline.reader.activeLoadingQueue.cancel();
        this._outline.reader.activeLoadingQueue = undefined;
    }
};

/**
 * Append the reader to the given container
 * @param {Object} $container A container element in which this reader will be placed.
 */
OutlineReader.prototype.appendTo = function($container) {
    this._$element.appendTo($container);
};

/**
 * Append the reader to the given container
 * @param {Object} $container A container element in which this reader will be placed.
 */
OutlineReader.prototype.appendTo = function($container) {
    this._$element.appendTo($container);
};

/**
 * Highlight the given entities in the reader and outline.
 * @param {Object|Array} highlightedEntities - an article or array of articles that should be highlighted in the reader and outline
 */
OutlineReader.prototype.highlight = function(highlightedEntities) {
    var t = this;
    t._highlights = highlightedEntities;
    if (t._outline) {
        t._outline.feature.highlight(t._highlights);
    }
};

/**
 * Re-renders the entities in the outline.
 */
OutlineReader.prototype.redrawEntities = function() {
    var t = this;
    if (t._outline) {
        t._outline.onRedrawEntity();
        t._outline.feature.highlight(t._highlights);
    }
};

/**
 * Generate a config object for the outline used by the reader.
 * Called by both the vertical reader and the inline reader.
 * @returns {{reader: {enabled: boolean, readerWidth: number, onLoadUrl: Function, onReaderOpened: (*|readerview.onReaderOpened|Function|null), onReaderClosed: (*|readerview.onReaderClosed|Function|null)}, maincontent: {minimizedWidth: number}}}
 */
OutlineReader.prototype._getOutlineConfig = function() {
    var t = this;
    return {
        reader: {
            enabled: true,
            readerWidth: t.width,
            onLoadUrl: function(url) {
                return Promise.resolve(t._config.onLoadUrl(url)).then(function(result) {
                    if (result) {
                        t._outline.$outlineContainer.addClass('outline-loaded');
                    }
                    return result;
                });
            },
            onReaderOpened: function (readerUrl) {
                t.emit(defaults.events.outlineReaderContentLoad, readerUrl);
            },
            onSourceUrlClicked: t._config.onSourceUrlClicked,
        },
    };
};

module.exports = OutlineReader;
