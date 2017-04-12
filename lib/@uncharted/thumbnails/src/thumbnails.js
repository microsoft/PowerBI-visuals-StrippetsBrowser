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
var Thumbnail = require('./thumbnails.thumbnail');
var Readerview = require('./thumbnails.readerview');
var defaults = require('./thumbnails.defaults');
var util = require('./thumbnails.util');
var thumbnailsTemplate = require('../templates/thumbnails.handlebars');
var dummyThumbnailTemplate = require('../templates/dummythumbnail.handlebars');
var Mediator = require('@uncharted/strippets.common').mediator;
var Outline = require('@uncharted/strippets').Outline;
var strippetsUtil = require('@uncharted/strippets.common').util;

/**
 * Constructor for the Thumbnails component.
 * Thumbnails represents articles as thumbnails that can be arranged in either a wrapped view or a horizontal view.
 * Both views allow tapping on a thumbnail to expand it into a reader with an Outline on the right.
 * @param {Object} spec - Object referencing the HTML element to use as the parent and configuration settings for the component
 * @param {Object=} mediator - Mediator instance to use as our event bus; optional: a local one will be created if none provide
 * @constructor
 */
function Thumbnails(spec, mediator) {
    var t = this;

    t.iconMap = null;
    t._config = $.extend({}, defaults.config.thumbnails, spec.config);
    t._$parent = $(spec.container);
    t._$element = null;
    t._readerview = null;
    t._thumbnailItems = [];
    t._$dummyThumbnails = [];
    t._blurEnabled = false;
    t._globalFilter = undefined;
    t._mediator = mediator || null;
    t._thumbnailClickCallback = null;
    t._backgroundClickCallback = null;
    t._init();
}

/**
 * Add a Mediator property to each component, so instances can be linked arbitrarily
 */
Object.defineProperty(Thumbnails.prototype, 'mediator', {
    get: function() {
        if (!this._mediator) {
            this._mediator = new Mediator();
        }
        return this._mediator;
    },

    set: function(value) {
        if (value !== this._mediator) {
            this._mediator = value;
            this.subscribe();
            this.propagateMediator();
        }
    },
});

/**
 * Initialize the Thumbnails component.
 */
Thumbnails.prototype._init = function() {
    var t = this;

    // ignore velocity's default post-display behavior.
    if ($.Velocity) $.Velocity.defaults.display = '';

    t.iconMap = t._config.entityIcons || util.flattenIconMap(t._config.autoGenerateIconMappings);
    t._$element = $(thumbnailsTemplate())
        .appendTo(t._$parent);
    t._readerview = new Readerview({
        $scrollView: t._$element,
        config: t._config.readerview,
    }, t._mediator);
    t._$thumbnailsContainer = t._$element.find(defaults.classes.thumbnails.thumbnailsContainer);

    /* add 20 dummy thumbnails to the panel to force the flexbox to left align the last row */
    for (var i = 0; i < 20; ++i) {
        t._$dummyThumbnails.push($(dummyThumbnailTemplate()));
    }
    t._registerEvents(false);
};

Thumbnails.prototype.subscribe = function() {
    var t = this;
    t.mediator.subscribe(defaults.events.thumbnailClicked, t._thumbnailClickCallback);
    if (t._readerview && t._readerview.outline) {
        t.mediator.subscribe(t._readerview.outline.events.outline.Minimize, t._closeInlineReader.bind(t));
        if (t._scrollToReader) {
            t.mediator.subscribe(t._readerview.outline.events.outline.CenterElement, t._scrollToReader);
        }
    }
};

Thumbnails.prototype.propagateMediator = function() {
    var t = this;
    _.each(t._thumbnailItems, function(thumbnail) {
        thumbnail.mediator = t._mediator;
    });

    t._readerview.mediator = t._mediator;
};

/**
 * Register mouse and mediator event handlers.
 * @param {boolean} inline - true to register events for the inline reader; otherwise, register events for the vertical reader
 * @private
 */
Thumbnails.prototype._registerEvents = function(inline) {
    var t = this;
    if (inline) {
        t.mapVerticalScrollToHorizontalScroll();
        t._thumbnailClickCallback = t._openInlineReader.bind(t);
    } else {
        t._thumbnailClickCallback = t._readerview.open.bind(t._readerview);
    }

    t.subscribe();

    t._backgroundClickCallback = function (event) {
        if (event.target === t._$thumbnailsContainer[0] ||
            $(event.target).hasClass(defaults.classes.thumbnails.thumbnail.slice(1))
        ) {
            t.closeReader();
        }
    };
    t._$thumbnailsContainer.on('click', t._backgroundClickCallback);

    t._$thumbnailsContainer.on('pointerdown mousedown', '.' + Outline.prototype.classes.reader.reader, function (event) {
        event.stopPropagation();
    });

    t._inline = inline;
};

/**
 * Unregister event handlers that were registered above.  Called when changing wrap modes.
 * @private
 */
Thumbnails.prototype._unregisterEvents = function () {
    if (this._thumbnailClickCallback) {
        this.mediator.remove(defaults.events.thumbnailClicked, this._thumbnailClickCallback);
        this.unmapVerticalScrollToHorizontalScroll();
        this._$thumbnailsContainer.off('click', this._backgroundClickCallback);
    }
};

/**
 * Generate a Thumbnail object for each article in the data
 * @param {Array} data - Array of article objects to render as thumbnaiils
 * @private
 */
Thumbnails.prototype._render = function(data) {
    var t = this;
    data.forEach(function(d) {
        var initialState = undefined;
        if (t._globalFilter) {
            initialState = Outline.shouldShow(d, t._globalFilter);
        }

        var thumbnail = new Thumbnail({
            $parent: t._$thumbnailsContainer,
            data: d,
            config: t._config.thumbnail,
            show: initialState,
        }, t._mediator);
        thumbnail.blurEnabled = t._blurEnabled;
        t._thumbnailItems.push(thumbnail);
    });
    t._$thumbnailsContainer.append(t._$dummyThumbnails);
};

/**
 * Remove all thumbnail items and close any open reader
 * @private
 */
Thumbnails.prototype._resetThumbnailsContainer = function() {
    var t = this;
    t._thumbnailItems = [];
    t.closeReader();
    if (t._readerview.$element) {
        // detach reader from the DOM so it's events are preserved during the empty()
        t._readerview.$element.detach();
    }
    t._$thumbnailsContainer.empty();
};

/**
 * Close any open reader
 * @returns {*} Promise from closing the vertical Readerview, if necessary
 */
Thumbnails.prototype.closeReader = function () {
    if (this._inline) {
        return this._closeInlineReader();
    }
    return this._readerview.close();
};

/**
 * Set the layout to either horizontal, which uses the inline reader, or wrapped, which uses the vertical Readerview
 * @param {boolean} state - true to enable inline (horizontal) display mode;
 * otherwise, enable wrapped (vertical) display mode
 */
Thumbnails.prototype.toggleInlineDisplayMode = function (state) {
    if (state !== this._inline) {
        this._unregisterEvents(state);

        this.closeReader(state);
        this._$element.toggleClass(defaults.classes.thumbnails.inlineThumbnails.slice(1), state);

        this._registerEvents(state);
    }
};

/**
 * Load new or additional data and re-render, updating the icon map if needed.
 * @param {Array} data - Array of articles to render as thumbnails
 * @param {Boolean} append - true if this data should be appended to the existing thumbnails;
 * false to replace the current thumbnails
 */
Thumbnails.prototype.loadData = function(data, append) {
    var t = this;
    if (!append) {
        t._resetThumbnailsContainer();
    }
    if (!t._config.entityIcons) {
        t.iconMap = util.mapEntitiesToIconMap(data, t.iconMap);
    }
    t._render(data);
    t._readerview.updateThumbnailItems(t._thumbnailItems, t.iconMap);
};

/**
 * Enable or disable a blur effect
 * @param {boolean} enabled - true to enable the blur effect
 */
Thumbnails.prototype.enableBlur = function(enabled) {
    var t = this;
    t._blurEnabled = enabled;
    t.mediator.publish(defaults.events.enableBlur, enabled);
};

/**
 * Reduce the list of thumbnails to only those that pass the given filter.
 * @param {*} filter - Value, boolean, Array, or function to apply as a filter on the current set of items
 * @param {Boolean} onceOnly - True to apply this filter now, then forget about it;
 * false to store it as the current global filter
 */
Thumbnails.prototype.filter = function(filter, onceOnly) {
    var t = this;

    if (!onceOnly) {
        this._globalFilter = filter;
    }

    _.each(t._thumbnailItems, function(thumbnailItem) {
        // if filter is null, then show. Otherwise, check if filter is an array, value or function and address accordingly.
        var shouldShow = Outline.shouldShow(thumbnailItem.data, filter);

        var isVisible = thumbnailItem._$element.is(':visible');
        if (!shouldShow && isVisible) {
            thumbnailItem._$element.hide();
        } else if (shouldShow && !isVisible) {
            thumbnailItem._$element.show();
        }
    });
};

/**
 * Highlight the given entities in the reader view.
 * @param {*} entities - an article or array of articles that should be highlighted
 */
Thumbnails.prototype.highlight = function(entities) {
    this._readerview.highlight(entities);
};

/**
 * If a thumbnail has the inline reader open, close it.
 * @param {Boolean} isReopening - true if the reader is being reopened on another thumbnail;
 * used to optimize the transition animation
 * @returns {Mixed}
 * @private
 */
Thumbnails.prototype._closeInlineReader = function(isReopening) {
    var t = this;
    var inlineReaderClassName = defaults.classes.thumbnail.inlineReader.slice(1);
    var thumbnail = _.find(this._thumbnailItems, function(thumbnailItem) {
        return thumbnailItem._$element.hasClass(inlineReaderClassName);
    });

    if (thumbnail) {
        // close whatever card is open
        thumbnail._$element
            .toggleClass(inlineReaderClassName, false)
            .css('width', thumbnail.originalWidth);

        var card = thumbnail._$element.find(defaults.classes.thumbnail.card);
        card.css({
            visibility: 'visible',
            transform: 'scaleX(1)',
        });

        var $container = thumbnail._$element.find(defaults.classes.thumbnail.inlineReaderContainer);
        $container.removeClass('open').css('display', 'none').empty();
        if (t._readerview.outline) {
            t.mediator.remove(t._readerview.outline.events.outline.Minimize, t._closeInlineReader.bind(t));
            if (t._scrollToReader) {
                t.mediator.remove(t._readerview.outline.events.outline.CenterElement, t._scrollToReader);
                t._scrollToReader = null;
            }
            t._readerview.outline.closeReadingMode();
            t._readerview.outline = null;
        }
        var $thumbnailsContainer = t._$element.find(defaults.classes.thumbnails.thumbnailsContainer);
        if (isReopening === true) { // Mediator passes in an ID as an argument, so truthy isn't enough
            $thumbnailsContainer.width(thumbnail.originalWidth * t._thumbnailItems.length);
        } else {
            $thumbnailsContainer.animate({
                width: (thumbnail.originalWidth * t._thumbnailItems.length) + 'px',
            }, t._config.readerview.openAnimationMs);
        }
    }

    return thumbnail;
};

/**
 * Helper to retrieve the numeric value of the named CSS property from the given JQuery-wrapped element
 * @param {Object} $element - JQuery-wrapped element to query
 * @param {String} propertyName - name of a numeric property
 * @returns {Number} Value of the requested property
 * @private
 */
Thumbnails.prototype._getBoxProperty = function($element, propertyName) {
    return parseInt($element.css(propertyName), 10);
};

/**
 * Open the inline reader for the given thumbnail, and close any previously-open one.
 * @param {Object} thumbnailData - Thumbnail to open
 * @private
 */
Thumbnails.prototype._openInlineReader = function(thumbnailData) {
    var t = this;
    var thumbnail = t._closeInlineReader(true);
    var closedThumbnailId = thumbnail ? parseInt(thumbnail._$element.attr('data-id'), 10) : -1;

    // if we didn't just close the clicked card, open the clicked card
    if (!thumbnail || closedThumbnailId !== thumbnailData.id) {
        var index = 0;
        thumbnail = _.find(t._thumbnailItems, function(thumbnailItem) {
            if (thumbnailItem._$element.css('display') !== 'none') {
                thumbnailItem.index = index++;
            }
            return thumbnailItem.data.id === thumbnailData.id;
        });

        if (thumbnail) {
            thumbnail.originalWidth = thumbnail._$element.width();

            var $card = thumbnail._$element.find(defaults.classes.thumbnail.card);
            var leftMargin = t._getBoxProperty($card, 'margin-left');
            var flexContainerWidth = thumbnail.originalWidth * (t._thumbnailItems.length - 1) +
                t._readerview._config.readerWidth + (2 * leftMargin + t._getBoxProperty($card, 'margin-right'));
            t._$element.find(defaults.classes.thumbnails.thumbnailsContainer)
                // Set the current container width so the first opening animation stays in between thumbnails
                .width(thumbnail.originalWidth * t._thumbnailItems.length)
                .animate({
                    // Explicitly animate to the final total width so IE's flexbox behaves
                    width: flexContainerWidth,
                }, t._config.readerview.openAnimationMs, 'swing');

            var inlineReaderClassName = defaults.classes.thumbnail.inlineReader.slice(1);

            thumbnail._$element
                .toggleClass(inlineReaderClassName, true)
                .width(t._readerview._config.readerWidth);

            $card.css({
                visibility: 'hidden',
                transform: 'scaleX(0)',
            });

            var $container = thumbnail._$element.find(defaults.classes.thumbnail.inlineReaderContainer);
            $container.css({
                display: 'inline-block',
                width: thumbnail.originalWidth + 'px',
            })
                .animate({
                    // Set the container width so IE makes room for the Outline;
                    // animate the width to prevent it jumping to full size at the start.
                    width: t._readerview._config.readerWidth + 'px',
                }, t._config.readerview.openAnimationMs);

            // disconnect from previous thumbnail's center handler
            if (t._scrollToReader) {
                t.mediator.remove(t._readerview.outline.events.outline.CenterElement, t._scrollToReader);
            }

            // scroll to the reader
            t._scrollToReader = function () {
                var scrollLeft =
                    (thumbnail.index * thumbnail.originalWidth) -
                    ((t._$element.width() - t._readerview._config.readerWidth) * 0.5) - leftMargin;

                t._$element.animate({
                    scrollLeft: scrollLeft,
                }, t._config.readerview.openAnimationMs);
            };

            // initialize with Animations Disabled (we'll override them with CSS transitions/animate()
            $.Velocity.mock = true;
            t._readerview.outline = new Outline($container, thumbnailData,
                t._readerview.iconMap, t._readerview.getOutlineConfig(), 'readingmode', t._readerview.highlights, t._mediator);
            t._readerview.outline.reader.dynamicWidth = false;
            t.mediator.subscribe(t._readerview.outline.events.outline.Minimize, t._closeInlineReader.bind(t));
            t.mediator.subscribe(t._readerview.outline.events.outline.CenterElement, t._scrollToReader);

            $container.addClass('open');
        }
    }
};

/**
 * Allow the mouse wheel to scroll the view horizontally whenever the mouse is over content not needing vertical scrolling.
 */
Thumbnails.prototype.mapVerticalScrollToHorizontalScroll = function() {
    strippetsUtil.mapVerticalScrollToHorizontalScroll(this, this._$element, '_thumbnailItems', '_$element');
};

/**
 * Remove the horizontal scroll bindings added above.  Used when changing to the wrapped layout.
 */
Thumbnails.prototype.unmapVerticalScrollToHorizontalScroll = function() {
    var t = this;
    if (t._horizontalMouseScroll) {
        t._$element.off('mousewheel DOMMouseScroll', t._horizontalMouseScroll);
    }
    if (t._readerMouseScroll) {
        t._$element.off('mousewheel DOMMouseScroll', '.readerContent', t._readerMouseScroll);
    }
};

/**
 * Notify the reader's outline to recompute its layout.
 * Call this when the containing visual has been resized.
 */
Thumbnails.prototype.resize = function() {
    var t = this;
    if (t._readerview && t._readerview.outline) {
        t.mediator.publish(t._readerview.outline.events.outline.Resize);
    }
};

module.exports = Thumbnails;

/**
 * JQuery plugin interface for Thumbnails.  Deprecated.
 * @type {Function}
 */
module.exports.asJQueryPlugin = /* istanbul ignore next: Jquery Plugin Registration */ function() {
    $.fn.thumbnails = function(command) {
        var selector = this;
        var commands = {
            initialize: function(options) {
                this._thumbnails = new Thumbnails({
                    container: this,
                    config: options,
                });
            },
            loaddata: function(data, append) {
                this._thumbnails.loadData(data, append);
            },
            enableblur: function(enabled) {
                this._thumbnails.enableBlur(enabled);
            },
            dispose: function() {
                selector.each(function(index, element) {
                    element._thumbnails = null;
                    element.remove();
                });
            },
            filter: function(filter) {
                this._thumbnails.filter(filter);
            },
            highlight: function(entities) {
                this._thumbnails.highlight(entities);
            },
            toggleInlineDisplayMode: function(state) {
                this._thumbnails.toggleInlineDisplayMode(state);
            },
            resize: function() {
                this._thumbnails.resize();
            },
        };
        // define argument variable here as arguments get overloaded in the each call below.
        var args = arguments;
        return selector.each(function(index, element) {
            // assume no command == initialization.
            if (command === undefined) {
                commands.initialize.apply(element, null);
            } else if (commands[command]) {
                commands[command].apply(element, Array.prototype.slice.call(args, 1));
            } else if (typeof command === 'object' || !command) {
                commands.initialize.apply(element, args);
            } else {
                $.error('Command: ' + command + 'does not exist.');
            }
        });
    };
};
