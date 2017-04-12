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
var template = require('../templates/readerview.handlebars');
var defaults = require('./thumbnails.defaults.js');
var Outline = require('@uncharted/strippets').Outline;
var Keyboard = require('@uncharted/strippets.common').Keyboard;
var Thumbnail = require('./thumbnails.thumbnail');
var Mediator = require('@uncharted/strippets.common').mediator;
var util = require('@uncharted/strippets.common').util;

/**
 * Construct and initialize the Thumbnails vertical reader view, used with Thumbnails' wrapped layout.
 * @param {Object} spec - Object referencing the viewport element that contains the reader and configuration settings
 * @param {Object=} mediator - Mediator instance to use as our event bus; optional: a local one will be created if none provide
 * @constructor
 */
function Readerview(spec, mediator) {
    var t = this;
    t.$scrollView = spec.$scrollView;
    t.thumbnailItems = [];
    t.iconMap = [];
    t._config = $.extend({}, defaults.config.readerview, spec.config);
    t.$element = undefined;
    t.$currentReaderHolder = undefined;
    t.outline = undefined;
    t.highlights = undefined;
    t._mediator = mediator || null;
    t._init();
}

/**
 * Add a Mediator property to each component, so instances can be linked arbitrarily
 */
Object.defineProperty(Readerview.prototype, 'mediator', {
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
 * Initialize the reader
 * @private
 */
Readerview.prototype._init = function() {
    var t = this;

    t.$element = $(template());
    t._$readerContainer = t.$element.find(defaults.classes.readerview.readerContainer);
    t._$buttonContainer = t.$element.find(defaults.classes.readerview.buttonContainer);
    t._$nextButton = t.$element.find(defaults.classes.readerview.readerNextButton);
    t._$prevButton = t.$element.find(defaults.classes.readerview.readerPrevButton);

    t._$readerContainer.width(t._config.readerWidth);
    t._$buttonContainer.width(t._config.readerWidth);
    t._registerEvents();
};

/**
 * Register mouse and keyboard event handlers
 */
Readerview.prototype._registerEvents = function() {
    var t = this;
    var keyboard = new Keyboard(t.$element);
    keyboard.bindKeydown(function(key) {
        var LEFT_ARROW_KEY = 37;
        var RIGHT_ARROW_KEY = 39;
        if (key === LEFT_ARROW_KEY) {
            t._navigate(-1);
        }
        if (key === RIGHT_ARROW_KEY) {
            t._navigate(1);
        }
    });
    t.$element.on('click', function(event) {
        if (event.target === t.$element[0]) {
            return t.close();
        }
        return null;
    });
    t._$nextButton.on('click', function() {
        t._navigate(1);
    });
    t._$prevButton.on('click', function() {
        t._navigate(-1);
    });
};

Readerview.prototype._placeMarker = function () {
    var t = this;
    if (t._clickedThumbnail) {
        var marker = t.$element.find('.marker');
        if (marker.length) {
            var bounds = t._clickedThumbnail._$element[0].getBoundingClientRect();
            var $container = t.$scrollView;
            var scale = util.getParentScale($container);
            marker.css('left', scale * (bounds.left - t.$scrollView[0].getBoundingClientRect().left + 0.5 * bounds.width) -
                parseInt(marker.css('border-left-width'), 10));
        }
    }
};

Readerview.prototype.subscribe = function() {
    var t = this;

    if (t.outline) {
        t.mediator.subscribe(t.outline.events.outline.Minimize, t.close.bind(t));
        t.mediator.subscribe(t.outline.events.outline.Resize, t._placeMarker.bind(t));
    }
};

Readerview.prototype.propagateMediator = function() {
    var t = this;
    _.each(t._thumbnailItems, function(thumbnail) {
        thumbnail.mediator = t._mediator;
    });

    t._readerview.mediator = t._mediator;
    if (t._readerview.outline) {
        t._readerview.outline.mediator = t._mediator;
    }
};

/**
 * Place the reader right next to the last element of the same row in which provided thumbnail is placed in.
 * @param {Number} thumbnailId - index of the thumbnail whose article should be displayed
 * @param {Boolean=} stayOpened - true to keep the current reader open, rather than closing it and opening a new one
 */
Readerview.prototype.placeReader = function (thumbnailId, stayOpened) {
    var t = this;
    var $previousPlaceHolder = t.$currentReaderHolder;
    var wasOpen = $previousPlaceHolder && $previousPlaceHolder.hasClass('open');
    var clickedThumbnail = _.find(t.thumbnailItems, function(thumbnail) {
        return thumbnail.data.id === thumbnailId;
    });
    var clickedThumbnailPosition = clickedThumbnail._$element.position();
    var visibleThumbnailsInSameRow = t.thumbnailItems.filter(function(item) {
        var isInSameRow = item._$element.position().top === clickedThumbnailPosition.top;
        return item._$element.is(':visible') && isInSameRow;
    });
    var lastVisibleThumbnailInRow = _.find(visibleThumbnailsInSameRow, function(item) {
        var $nextItems = item._$element.nextAll('.thumbnail:visible');
        return $nextItems.length > 0
            ? $($nextItems[0]).position().top !== clickedThumbnailPosition.top
            : true;
    });
    // check if the lastVisibleThumbnailInRow is in the last row (no visible thumbnails are next to it)
    var $nextItems = lastVisibleThumbnailInRow._$element.nextAll('.thumbnail:visible:first, .dummyThumbnail:last');
    var $targetElement = $($nextItems[0]).hasClass('dummyThumbnail')
        ? $($nextItems[0])
        : lastVisibleThumbnailInRow._$element;

    if (stayOpened) {
        // remove all previously created reader holders except the current one
        t.$currentReaderHolder.siblings('.reader-holder').remove();
    } else {
        t.$currentReaderHolder = $targetElement.next('.reader-holder').length === 0
            ? $('<div class="reader-holder"></div>')
            : $targetElement.next('.reader-holder');
        t.$currentReaderHolder.append(t.$element);

        if ($previousPlaceHolder && (t.$currentReaderHolder[0] !== $previousPlaceHolder[0])) {
            $previousPlaceHolder.removeClass('open');
            $previousPlaceHolder.height(0);
        }
    }
    $targetElement.after(t.$currentReaderHolder);

    // scroll to the reader
    var $scrollTo = lastVisibleThumbnailInRow._$element;
    if (lastVisibleThumbnailInRow) {
        var $container = t.$scrollView;
        var thumbsPerRow = 0;
        var top = undefined;
        var count = 0;
        _.each(t.thumbnailItems, function (thumbnailItem) {
            var $thumb = thumbnailItem._$element;
            if ($thumb.is(':visible')) {
                if (top === undefined) {
                    top = $thumb.position().top;
                }
                thumbnailItem.index = count;
                if (!thumbsPerRow && $thumb.position().top !== top) {
                    thumbsPerRow = count;
                }
                count++;
            }
        });

        var thumbnailIndex = lastVisibleThumbnailInRow.index - thumbsPerRow + 1;
        var currentTop = t.$currentReaderHolder.position().top;
        var previousTop = $previousPlaceHolder ? $previousPlaceHolder.position().top : currentTop;
        if (!wasOpen || previousTop !== currentTop || !$previousPlaceHolder || stayOpened) {
            // Top of the row containing the target thumbnail
            var thumbnailHeight = $scrollTo.height();
            var rowCount = Math.ceil(thumbnailIndex / thumbsPerRow);
            var scrollTop = thumbnailHeight * rowCount;
            var leftoverReaderHeight = Math.max(0, (thumbnailHeight + t._config.readerHeight) - $container.height());
            // try to bring the reader into view
            scrollTop = scrollTop + leftoverReaderHeight;
            var onComplete = function () {
                t.mediator.publish(t.outline.events.outline.Resize);
            };
            if (stayOpened) {
                $container.scrollTop(scrollTop);
                onComplete();
            } else {
                $container.animate({scrollTop: scrollTop}, {
                    duration: t._config.openAnimationMs,
                    complete: onComplete,
                });
            }
        }
    }

    t._clickedThumbnail = clickedThumbnail;
    t._placeMarker();
};

/**
 * Move to a neighbouring thumbnail
 * @param {Number} offset - +1 to move to the next thumbnail; -1 to move to the previous thumbnail
 * @private
 */
Readerview.prototype._navigate = function(offset) {
    var t = this;

    var visibleThumbnails = t.thumbnailItems.filter(function(item) {
        return item._$element.is(':visible');
    });
    var currentThumbnailIndex = _.findIndex(visibleThumbnails, function(item) {
        return item.data.id === t._currentLoadedThumbnailData.id;
    });

    var toIndex = (currentThumbnailIndex + offset) > 0 ? currentThumbnailIndex + offset : 0;

    if (toIndex >= 0 && toIndex < visibleThumbnails.length && currentThumbnailIndex !== toIndex) {
        t.navigateTo(visibleThumbnails[toIndex]);
    }
};

/**
 * Navigate to the thumbnail matching the thumbnail object or ID given
 * @param {Object|Number} to - A thumbnail object or ID
 */
Readerview.prototype.navigateTo = function(to) {
    var t = this;
    var thumbnail = undefined;
    if (to instanceof Thumbnail) {
        thumbnail = to;
    } else if (to.data) {
        // if to has a data object
        thumbnail = to;
    } else {
        thumbnail = _.find(t.thumbnailItems, function(item) {
            return item.data.id === to;
        });
    }
    if (thumbnail) {
        t.placeReader(thumbnail.data.id, true);
        t.loadOutline(thumbnail.data);
        t.$element.focus();
    }
};

/**
 * Open the reader for the given thumbnail
 * @param {Object} thumbnailData - a thumbnail object
 */
Readerview.prototype.open = function(thumbnailData) {
    if (thumbnailData) {
        var t = this;
        t.placeReader(thumbnailData.id);
        t.loadOutline(thumbnailData);

        // force it to calculate the height before it starts to animate the reader height properly
        t.$currentReaderHolder.height(t._config.readerHeight);
        t.$currentReaderHolder.addClass('open');
        t.$element.focus();
    }
};

/**
 * Close the reader
 * @returns {*} Promise returned by closing the outline's reading mode, if any; otherwise null.
 */
Readerview.prototype.close = function() {
    var t = this;
    t._clickedThumbnail = null;

    if (t.$currentReaderHolder) {
        t.$currentReaderHolder.removeClass('open');
        t.$currentReaderHolder.height(0);
    }
    if (t.outline) {
        t.mediator.remove(t.outline.events.outline.Resize, t._placeMarker.bind(t));
        t.mediator.remove(t.outline.events.outline.Minimize, t.close.bind(t));
        return t.outline.closeReadingMode();
    }
    return null;
};

/**
 * Update the cached thumbnail items and icon map
 * @param {Array} thumbnailItems - Array of thumbnail objects
 * @param {Array} iconMap - Array of icon objects
 */
Readerview.prototype.updateThumbnailItems = function(thumbnailItems, iconMap) {
    this.thumbnailItems = thumbnailItems;
    this.iconMap = iconMap;
};

/**
 * Generate a config object for the outline used by the reader.
 * Called by both the vertical reader and the inline reader.
 * @returns {{reader: {enabled: boolean, readerWidth: number, onLoadUrl: Function, onReaderOpened: (*|readerview.onReaderOpened|Function|null), onReaderClosed: (*|readerview.onReaderClosed|Function|null)}, maincontent: {minimizedWidth: number}}}
 */
Readerview.prototype.getOutlineConfig = function() {
    var t = this;
    var entityBarWidth = t._config.entityBarWidth;
    return {
        reader: {
            enabled: true,
            readerWidth: t._config.readerWidth - entityBarWidth,
            onLoadUrl: function(url) {
                return Promise.resolve(t._config.onLoadUrl(url)).then(function(result) {
                    if (result) {
                        t.outline.$outlineContainer.addClass('outline-loaded');
                    } else {
                        // There's a bit of a race condition; we might not have data at this point,
                        // because the user could have selected an article that then got filtered out of existence.
                        // To prevent the template dereferencing undefined, close the reader.
                        return t.close();
                    }
                    return result;
                });
            },
            onReaderOpened: t._config.onReaderOpened,
            onReaderClosed: t._config.onReaderClosed,
        },
        maincontent: {
            minimizedWidth: entityBarWidth,
        },
    };
};

/**
 * Construct and initialize an outline for use by the reader.
 * @param {Object} data - Article object to outline
 */
Readerview.prototype.loadOutline = function(data) {
    var t = this;
    t._$readerContainer.html('');
    t._currentLoadedThumbnailData = data;

    // initialize with Animations Disabled
    $.Velocity.mock = true;
    t.outline = new Outline(t._$readerContainer, data, t.iconMap, t.getOutlineConfig(), 'readingmode', t.highlights, t.mediator);
    t.subscribe();
};

/**
 * Highlight the given entities in the reader and outline.
 * @param {Object|Array} highlightedEntities - an article or array of articles that should be highlighted in the reader and outline
 */
Readerview.prototype.highlight = function(highlightedEntities) {
    var t = this;
    t.highlights = highlightedEntities;
    if (t.outline) {
        t.outline.feature.highlight(t.highlights);
    }
};

module.exports = Readerview;
