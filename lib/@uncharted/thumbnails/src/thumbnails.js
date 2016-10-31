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
var Thumbnail = require('./thumbnails.thumbnail');
var Readerview = require('./thumbnails.readerview');
var defaults = require('./thumbnails.defaults');
var util = require('./thumbnails.util');
var thumbnailsTemplate = require('../templates/thumbnails.handlebars');
var dummyThumbnailTemplate = require('../templates/dummythumbnail.handlebars');
var mediator = require('@uncharted/stories.common').mediator;
var Outline = require('@uncharted/strippets').Outline;

function Thumbnails(spec) {
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
    t._thumbnailClickCallback = null;
    t._backgroundClickCallback = null;
    t._init();
}

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
    });
    t._$thumbnailsContainer = t._$element.find(defaults.classes.thumbnails.thumbnailsContainer);

    /* add 20 dummy thumbnails to the panel to force the flexbox to left align the last row */
    for (var i = 0; i < 20; ++i) {
        t._$dummyThumbnails.push($(dummyThumbnailTemplate()));
    }
    t._registerEvents(false);
};

Thumbnails.prototype._registerEvents = function(inline) {
    var t = this;
    if (inline) {
        t.mapVerticalScrollToHorizontalScroll();
        t._thumbnailClickCallback = t._openInlineReader.bind(t);
    } else {
        t._thumbnailClickCallback = t._readerview.open.bind(t._readerview);
    }

    mediator.subscribe(defaults.events.thumbnailClicked, t._thumbnailClickCallback);

    t._backgroundClickCallback = function (event) {
        if (event.target === t._$thumbnailsContainer[0] ||
            $(event.target).hasClass(defaults.classes.thumbnails.thumbnail.slice(1))
        ) {
            t.closeReader();
        }
    };
    t._$thumbnailsContainer.on('click', t._backgroundClickCallback);
    t._inline = inline;
};

Thumbnails.prototype._unregisterEvents = function () {
    if (this._thumbnailClickCallback) {
        mediator.remove(defaults.events.thumbnailClicked, this._thumbnailClickCallback);
        this.unmapVerticalScrollToHorizontalScroll();
        this._$thumbnailsContainer.off('click', this._backgroundClickCallback);
    }
};

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
        });
        thumbnail.blurEnabled = t._blurEnabled;
        t._thumbnailItems.push(thumbnail);
    });
    t._$thumbnailsContainer.append(t._$dummyThumbnails);
};

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

Thumbnails.prototype.closeReader = function () {
    if (this._inline) {
        return this._closeInlineReader();
    }
    return this._readerview.close();
};

Thumbnails.prototype.toggleInlineDisplayMode = function (state) {
    if (state !== this._inline) {
        this._unregisterEvents(state);

        this.closeReader(state);
        this._$element.toggleClass(defaults.classes.thumbnails.inlineThumbnails.slice(1), state);

        this._registerEvents(state);
    }
};

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

Thumbnails.prototype.enableBlur = function(enabled) {
    var t = this;
    t._blurEnabled = enabled;
    mediator.publish(defaults.events.enableBlur, enabled);
};

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

Thumbnails.prototype.highlight = function(entities) {
    this._readerview.highlight(entities);
};

/**
 * If a thumbnail has the inline reader open, close it.
 * @returns {*}
 * @private
 */
Thumbnails.prototype._closeInlineReader = function() {
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
            transform: 'scaleX(1)',
            opacity: 1,
        });

        var container = thumbnail._$element.find(defaults.classes.thumbnail.inlineReaderContainer);
        container.removeClass('open').css('display', 'none').empty();

        if (this._readerview.outline) {
            this._readerview.outline.closeReadingMode();
        }
        this._readerview.outline = null;
    }

    return thumbnail;
};

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
    var thumbnail = t._closeInlineReader();
    var closedThumbnailId = thumbnail ? parseInt(thumbnail._$element.attr('data-id'), 10) : -1;

    // if we didn't just close the clicked card, open the clicked card
    if (!thumbnail || closedThumbnailId !== thumbnailData.id) {
        thumbnail = _.find(t._thumbnailItems, function(thumbnailItem, i) {
            thumbnailItem.index = i;
            return thumbnailItem.data.id === thumbnailData.id;
        });

        thumbnail.originalWidth = thumbnail._$element.width();

        var $card = thumbnail._$element.find(defaults.classes.thumbnail.card);
        var leftMargin = this._getBoxProperty($card, 'margin-left');
        var inlineReaderClassName = defaults.classes.thumbnail.inlineReader.slice(1);
        var $container = thumbnail._$element.find(defaults.classes.thumbnail.inlineReaderContainer);

        thumbnail._$element
            .toggleClass(inlineReaderClassName, true)
            .width(t._readerview._config.readerWidth
        );

        $card.css({
            opacity: 0,
            transform: 'scaleX(0)',
        });

        $container.css({
            display: 'block',
        });

        // initialize with Animations Enabled
        $.Velocity.mock = false;
        t._readerview.outline = new Outline($container, thumbnailData,
            t._readerview.iconMap, t._readerview.getOutlineConfig(), 'readingmode', t._readerview.highlights);

        $container.addClass('open');

        // scroll to the reader
        var scrollLeft =
            (thumbnail.index * thumbnail.originalWidth) -
            ((t._$element.width() - t._readerview._config.readerWidth) * 0.5) - leftMargin;

        t._$element.animate({
            scrollLeft: scrollLeft,
        }, 300);
    }
};

Thumbnails.prototype.mapVerticalScrollToHorizontalScroll = function() {
    var t = this;
    t._horizontalMouseScroll = function(event) {
        event.preventDefault();
        var wheelDelta = event.type === 'DOMMouseScroll' // if firefox
            ? -event.originalEvent.detail
            : event.originalEvent.wheelDelta;
        t._$element.scrollLeft(t._$element.scrollLeft() - wheelDelta);
    };
    t._$element.on('mousewheel DOMMouseScroll', t._horizontalMouseScroll);

    t._readerMouseScroll = function (event) {
        var wheelDelta = event.type === 'DOMMouseScroll' // if firefox
            ? -event.originalEvent.detail
            : event.originalEvent.wheelDelta;
        var scrollTop = $(this).scrollTop();
        var isScrollBottom = (scrollTop + $(this).innerHeight()) === $(this)[0].scrollHeight;
        var isScrollingVerticalContent = !(wheelDelta > 0 && scrollTop === 0) && !(wheelDelta < 0 && isScrollBottom);
        if (isScrollingVerticalContent) event.stopPropagation();
    };
    t._$element.on('mousewheel DOMMouseScroll', '.readerContent', t._readerMouseScroll);
};

Thumbnails.prototype.unmapVerticalScrollToHorizontalScroll = function() {
    var t = this;
    if (t._horizontalMouseScroll) {
        t._$element.off('mousewheel DOMMouseScroll', t._horizontalMouseScroll);
    }
    if (t._readerMouseScroll) {
        t._$element.off('mousewheel DOMMouseScroll', '.readerContent', t._readerMouseScroll);
    }
};

module.exports = Thumbnails;
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
