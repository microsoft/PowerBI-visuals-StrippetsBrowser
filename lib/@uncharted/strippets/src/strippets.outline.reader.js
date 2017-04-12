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
var _ = require('underscore');
var Promise = require('bluebird');
var Base = require('./strippets.base');
var config = require('./strippets.config.js');

/**
 * Construct and initialize the inline content reader
 * @param {String} parentId - Generated ID of the parent Outline
 * @param {Object} $parent - JQuery-wrapped element of the parent Outline
 * @param {Object} settings - Reader-specific configuration options
 * @returns {Reader}
 * @constructor
 */
var Reader = function Reader(parentId, $parent, settings) {
    var t = this;
    t.defaults = config.outline.reader;
    t._id = parentId;
    t.$parent = $parent;
    t.init(settings);
    t.readerContext = {
        loadedUri: null,
    };
    return t;
};
Reader.prototype = Object.create(Base.prototype);
Reader.prototype.constructor = Reader;

/**
 * Add a dynamicWidth property to each component, so thumbnails can use static widths
 */
Object.defineProperty(Reader.prototype, 'dynamicWidth', {
    get: function() {
        return this._dynamicWidth;
    },

    set: function(value) {
        this._dynamicWidth = value;
    },
});

/**
 * Initialize the inline reader
 * @param {Object} settings - Reader-specific configuration options
 */
Reader.prototype.init = function(settings) {
    this.Settings = $.extend({}, this.defaults, settings);
    this.compiledReaderContentTemplate = _.template(this.templates.reader.readerContentTemplate);
    this.compiledReaderContentErrorTemplate = _.template(this.templates.reader.readerContentErrorTemplate);
    this.construct();
    this.registerEvents();
    this.activeLoadingQueue = null; // a promise chain we can abort
    this._dynamicWidth = true;
};

/**
 * Self-cleaning Promise chain pattern
 * Used to avoid promise leaks; for example, when a reader is closed with a load pending.
 * @returns {{queue: Array, enqueue: Function, dequeue: Function, cancel: Function}}
 */
Reader.prototype.createFunctionQueue = function () {
    return {
        queue: [],
        enqueue: function(func) {
            this.queue.unshift(func);
        },
        dequeue: function() {
            if (this.queue.length) {
                return this.queue.pop().apply(this, arguments);
            }
            return null;
        },
        cancel: function() {
            this.queue.length = 0;
        },
    };
};

/**
 * Construct the JQuery-wrapped reading pane element and append it to the given parent element.
 */
Reader.prototype.construct = function() {
    this.$readingPane = $(this.templates.reader.readerTemplate)
        .width('0')
        .appendTo(this.$parent);
};

/**
 * Register a mouse click handler for opening links
 */
Reader.prototype.registerEvents = function() {
    var t = this;
    t.$readingPane.on('click', 'a', function(e) {
        e.preventDefault();
        var $anchor = $(e.target).closest('a');
        var href = $anchor.attr('href');
        if (!href) {
            return;
        }
        window.open(href, '_blank');
    });
};

Reader.prototype.getActualReaderWidth = function(settings, $parent) {
    var marginLeft = 0;
    var marginRight = 0;
    var readerSettings = settings || this.Settings;
    var $parentElem = $parent || this.$parent;

    if (this.dynamicWidth && $parentElem) {
        if (Base.prototype.styles.outlineItem.reading) {
            marginLeft = parseInt(Base.prototype.styles.outlineItem.reading.marginLeft, 10);
            marginRight = parseInt(Base.prototype.styles.outlineItem.reading.marginRight, 10);
        }

        var $visual = $parentElem.parents('.' + Base.prototype.classes.container.visual);
        if ($visual.length) {
            var availableWidth = $visual.width() - marginLeft - marginRight;
            if (readerSettings.outlineWidth) {
                availableWidth -= readerSettings.outlineWidth;
            }
            availableWidth = Math.min(readerSettings.readerWidth, availableWidth);
            return availableWidth;
        }
    }

    return readerSettings.readerWidth;
};

Reader.prototype.positionCloseButton = function () {
    var s = this;
    var $closeButton = s.$readingPane.find('.' + Base.prototype.classes.reader.closeButton);
    if ($closeButton.length) {
        var left = s.getActualReaderWidth() - $closeButton.width() -
            parseInt($closeButton.css('margin-right'), 10) -
            this.Settings.scrollBarWidth;

        $closeButton.css('left', left);
    }
};

/**
 * Open the reader view
 * @returns {*} Promise
 */
Reader.prototype.open = function() {
    var s = this;
    var options = {duration: s.Settings.disableAnimation ? 0 : undefined};
    s.targetReaderWidth = s.getActualReaderWidth();
    return s.$readingPane.velocity({ width: s.targetReaderWidth }, options).promise();
};

/**
 * Open the reader view
 * @returns {*} Promise
 */
Reader.prototype.resize = function() {
    var s = this;
    var options = {duration: s.Settings.disableAnimation ? 0 : undefined};
    s.targetReaderWidth = s.getActualReaderWidth();
    return s.$readingPane.velocity({ width: s.targetReaderWidth }, options).promise().then(function () {
        s.$readerContent && s.$readerContent.width(s.targetReaderWidth);
        s.positionCloseButton();
    });
};

/**
 * Load the reader view's content from the given URL
 * @param {String} uri - URL to load content from
 * @returns {*} Promise
 */
Reader.prototype.load = function(uri) {
    var s = this;
    var render = function(compiledTemplate, data) {
        return new Promise(function(resolve) {
            s.$readerContent = $(compiledTemplate({data: data}))
                .addClass(s.classes.reader.readerContent)
                .width(s.targetReaderWidth || s.getActualReaderWidth())
                .height(s.Settings.readerHeight);
            s.$readingPane.html(s.$readerContent);
            s.positionCloseButton();

            return resolve(data);
        });
    };
    s.$readingPane.html(s.templates.reader.readerContentLoadingTemplate);

    this.activeLoadingQueue = this.createFunctionQueue();
    this.activeLoadingQueue.enqueue(render.bind(s, s.compiledReaderContentTemplate));
    this.activeLoadingQueue.enqueue(function() {
        s.readerContext.loadedUri = uri;
        if (s.Settings.onReaderOpened && typeof s.Settings.onReaderOpened === 'function') {
            s.Settings.onReaderOpened(s.readerContext.loadedUri);
        }
    });

    return Promise.resolve(s.Settings.onLoadUrl(uri))
        .then(s.activeLoadingQueue.dequeue.bind(s.activeLoadingQueue))
        .then(s.activeLoadingQueue.dequeue.bind(s.activeLoadingQueue))
        .catch(render.bind(s, s.compiledReaderContentErrorTemplate));
};

/**
 * Release the reader content
 */
Reader.prototype.destroy = function() {
    this.$readingPane.html('');
};

/**
 * Get the reader's height in pixels
 * @returns {number} Reader Height, in px
 */
Reader.prototype.getReaderHeight = function() {
    return this.$readingPane.height() - 20;
};

/**
 * Hide the reader, using a transition animation, and abort any pending asynchronous load operation
 * @returns {*}
 */
Reader.prototype.hide = function() {
    var s = this;
    var options = {duration: s.Settings.disableAnimation ? 0 : undefined, display: 'none'};

    if (s.activeLoadingQueue) {
        // abort any pending load operations
        s.activeLoadingQueue.cancel();
        s.activeLoadingQueue = null;
    }

    s.$readingPane.find('.' + s.classes.reader.closeButton).css('visibility', 'hidden');
    s.targetReaderWidth = 0;
    return s.$readingPane.velocity({width: s.targetReaderWidth, 'border-width': 0}, options).promise()
        .then(function() {
            if (s.Settings.onReaderClosed && typeof s.Settings.onReaderClosed === 'function') {
                return s.Settings.onReaderClosed(s.readerContext.loadedUri);
            }
        });
};

/**
 * Get the CSS selector that refers to the reader's content
 * @returns {string} CSS selector, such as '._rc'
 */
Reader.prototype.getReaderContentSelector = function() {
    return '.' + this.classes.reader.readerContent;
};

module.exports = Reader;
