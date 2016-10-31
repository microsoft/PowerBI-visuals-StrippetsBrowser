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

var Reader = function Reader(parentId, $parent, settings) {
    var t = this;
    t.defaults = config.outline.reader;
    t._id = parentId;
    t.init($parent, settings);
    t.readerContext = {
        loadedUri: null,
    };
    return t;
};
Reader.prototype = Object.create(Base.prototype);
Reader.prototype.constructor = Reader;

Reader.prototype.init = function($parent, settings) {
    this.Settings = $.extend({}, this.defaults, settings);
    this.compiledReaderContentTemplate = _.template(this.templates.reader.readerContentTemplate);
    this.compiledReaderContentErrorTemplate = _.template(this.templates.reader.readerContentErrorTemplate);
    this.construct($parent);
    this.registerEvents();
    this.activeLoadingQueue = null; // a promise chain we can abort
};

// Dario's clever self-cleaning Promise chain pattern
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

Reader.prototype.construct = function($parent) {
    this.$readingPane = $(this.templates.reader.readerTemplate)
        .width('0')
        .appendTo($parent);
};

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

Reader.prototype.open = function() {
    var s = this;
    var options = {duration: s.Settings.disableAnimation ? 0 : undefined};
    return s.$readingPane.velocity({width: s.Settings.readerWidth}, options).promise();
};

Reader.prototype.load = function(uri) {
    var s = this;
    var render = function(compiledTemplate, data) {
        return new Promise(function(resolve) {
            s.$readerContent = $(compiledTemplate({data: data}))
                .addClass(s.classes.reader.readerContent)
                .width(s.Settings.readerWidth)
                .height(s.Settings.readerHeight);
            s.$readingPane.html(s.$readerContent);
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

Reader.prototype.destroy = function() {
    this.$readingPane.html('');
};

Reader.prototype.getReaderHeight = function() {
    return this.$readingPane.height() - 20;
};

Reader.prototype.hide = function() {
    var s = this;
    var options = {duration: s.Settings.disableAnimation ? 0 : undefined, display: 'none'};

    if (s.activeLoadingQueue) {
        // abort any pending load operations
        s.activeLoadingQueue.cancel();
        s.activeLoadingQueue = null;
    }

    return s.$readingPane.velocity({width: 0, 'border-width': 0}, options).promise()
        .then(function() {
            if (s.Settings.onReaderClosed && typeof s.Settings.onReaderClosed === 'function') {
                return s.Settings.onReaderClosed(s.readerContext.loadedUri);
            }
        });
};

Reader.prototype.getReaderContentSelector = function() {
    return '.' + this.classes.reader.readerContent;
};

module.exports = Reader;
