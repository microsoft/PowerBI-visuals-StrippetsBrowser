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
var IBindable = require('./IBindable');
var Readerview = require('./thumbnails.readerview');
var OutlineReader = require('./thumbnails.outlineReader');
var defaults = require('./thumbnails.defaults');
var util = require('./thumbnails.util');
var thumbnailsTemplate = require('../templates/thumbnails.handlebars');
var dummyThumbnailTemplate = require('../templates/dummythumbnail.handlebars');
var Outline = require('@uncharted/strippets').Outline;
var strippetsUtil = require('@uncharted/strippets.common').util;

/**
 * Constructor for the Thumbnails component.
 * Thumbnails represents articles as thumbnails that can be arranged in either a wrapped view or a horizontal view.
 * Both views allow tapping on a thumbnail to expand it into a reader with an Outline on the right.
 * @param {Object} spec - Object referencing the HTML element to use as the parent and configuration settings for the component
 * @constructor
 */
function Thumbnails(spec) {
    var t = this;
    IBindable.call(t);
    t.iconMap = null;
    t.entityHighlgihts = undefined;
    t._config = $.extend({}, defaults.config.thumbnails, spec.config);
    t._$parent = $(spec.container);
    t._$element = null;
    t._readerview = null;
    t._outlineReader = undefined;
    t._thumbnailItems = [];
    t._$dummyThumbnails = [];
    t._blurEnabled = false;
    t._globalFilter = undefined;
    t._init();
}

/**
 * @inheritance {IBindable}
 */
Thumbnails.prototype = Object.create(IBindable.prototype);
Thumbnails.prototype.constructor = Thumbnails;

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
    t._outlineReader = new OutlineReader({
        iconMap: t.iconMap,
        config: t._config.outlineReader,
    });
    t._readerview = new Readerview({
        outlineReader: t._outlineReader,
        $scrollView: t._$element,
        config: t._config.readerview,
    });
    t.forward(t._outlineReader);
    t.forward(t._readerview);
    t._$thumbnailsContainer = t._$element.find(defaults.classes.thumbnails.thumbnailsContainer);

    /* add 20 dummy thumbnails to the panel to force the flexbox to left align the last row */
    for (var i = 0; i < 20; ++i) {
        t._$dummyThumbnails.push($(dummyThumbnailTemplate()));
    }
    t._registerEvents();
};

/**
 * Register event handlers.
 * @private
 */
Thumbnails.prototype._registerEvents = function() {
    var t = this;

    t.on(defaults.events.thumbnailClick, function (thumbnailData) {
        t.openReader(thumbnailData);
    });
    t.on(defaults.events.outlineReaderCloseButtonClick, function () {
        t.closeReader();
    });
    t.on(defaults.events.thumbnailsBackgroundClick, function () {
        t.closeReader();
    });

    t._$thumbnailsContainer.on('click.background', function (event) {
        if (event.target === t._$thumbnailsContainer[0] ||
            $(event.target).hasClass(defaults.classes.thumbnails.thumbnail.slice(1))
        ) {
            t.emit(defaults.events.thumbnailsBackgroundClick);
        }
    });

    t._$thumbnailsContainer.on('pointerdown mousedown', '.' + Outline.prototype.classes.reader.reader, function (event) {
        event.stopPropagation();
    });
};

/**
 * Generate a Thumbnail object for each article in the data
 * @param {Array} data - Array of article objects to render as thumbnaiils
 * @private
 */
Thumbnails.prototype._render = function(data) {
    var t = this;
    var thumbnailFragments = document.createDocumentFragment();
    data.forEach(function(d) {
        var initialState = undefined;
        if (t._globalFilter) {
            initialState = Outline.shouldShow(d, t._globalFilter);
        }
        var thumbnail = new Thumbnail({
            data: d,
            config: t._config.thumbnail,
            show: initialState,
        });

        thumbnailFragments.appendChild(thumbnail._$element[0]);
        thumbnail.blurEnabled = t._blurEnabled;
        t.forward(thumbnail);
        t._thumbnailItems.push(thumbnail);
    });
    t._$thumbnailsContainer.append(thumbnailFragments);
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
 * Find a thumbnail by thumbnail id
 * @param {Number|String} thumbnailId A thumbnail Id
 * @returns {Object} thumbnail
 */
Thumbnails.prototype.findThumbnailById = function (thumbnailId) {
    var t = this;
    return _.find(t._thumbnailItems, function(thumbnailItem) {
        return thumbnailItem.data.id === thumbnailId;
    });
};

/**
 * Close any open reader
 */
Thumbnails.prototype.closeReader = function () {
    this._inline
        ? this._closeInlineReader()
        : this._readerview.close();
};

/**
 * Open a reader for the provided thumbnail
 * @param {Object} thumbnailData Thumbnail data for the reader
 */
Thumbnails.prototype.openReader = function (thumbnailData) {
    this._inline
        ? this._openInlineReader(thumbnailData)
        : this._readerview.open(thumbnailData);
};

/**
 * Set the layout to either horizontal, which uses the inline reader, or wrapped, which uses the vertical Readerview
 * @param {boolean} state - true to enable inline (horizontal) display mode;
 * otherwise, enable wrapped (vertical) display mode
 */
Thumbnails.prototype.toggleInlineDisplayMode = function (state) {
    var t = this;
    if (state !== t._inline) {
        t.closeReader();
        t._$element.toggleClass(defaults.classes.thumbnails.inlineThumbnails.slice(1), state);
        state
            ? t.mapVerticalScrollToHorizontalScroll()
            : t.unmapVerticalScrollToHorizontalScroll();
        t._inline = state;
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
    t._thumbnailItems.forEach(function (thumbnail) {
        thumbnail.blurEnabled = enabled;
    });
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

        var isVisible = !thumbnailItem._$element.hasClass('hidden');
        if (!shouldShow && isVisible) {
            thumbnailItem._$element.addClass('hidden');
        } else if (shouldShow && !isVisible) {
            thumbnailItem._$element.removeClass('hidden');
        }
    });
};

/**
 * Highlight the given entities in the reader view.
 * @param {*} entities - an article or array of articles that should be highlighted
 */
Thumbnails.prototype.highlight = function(entities) {
    this.entityHighlgihts = entities;
    this._outlineReader.highlight(this.entityHighlgihts);
};

/**
 * Close any opened inline reader.
 */
Thumbnails.prototype._closeInlineReader = function() {
    var t = this;
    t._thumbnailItems.forEach(function (thumbnail) {
        if (thumbnail.isExpanded) {
            t._outlineReader.abortContentLoading();
            thumbnail.shrink();
        }
    });
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

Thumbnails.prototype._expandAndCenterThumbnail = function (thumbnail, scrollDuration) {
    var t = this;
    var $thumbnail = thumbnail._$element;
    var thumbnailOffsetLeft = $thumbnail[0].offsetLeft;
    var previouslyExpandedThumbnail = t._thumbnailItems.filter(function (thumbnailItem) { return thumbnailItem.isExpanded; })[0];
    var previouslyExpandedThumbnailElement = previouslyExpandedThumbnail && previouslyExpandedThumbnail._$element[0];
    var expandedToNormalLeftOffsetDifference = previouslyExpandedThumbnailElement && previouslyExpandedThumbnailElement.offsetLeft < thumbnailOffsetLeft
        ? Math.max(previouslyExpandedThumbnailElement.offsetWidth - $thumbnail[0].offsetWidth, 0) // previously expanded thumbnail width is 0 if it's display property is none;
        : 0;
    previouslyExpandedThumbnail && previouslyExpandedThumbnail.shrink();
    thumbnail.expand();
    t.centerInlineThumbnail(thumbnail, scrollDuration, -expandedToNormalLeftOffsetDifference);
};

/**
 * Scroll to the provided thumbnail and centers it.
 * @param {Object} thumbnail - A thumbnail to be centered.
 * @param {Number} duration - A number representing the duration of the centering animation in ms.
 * @param {Number} offset - Given thumbnail will be offset from the center by provided number.
 */
Thumbnails.prototype.centerInlineThumbnail = function(thumbnail, duration, offset) {
    var t = this;
    if (!t._inline) { return; }
    var $thumbnail = thumbnail._$element;
    var thumbnailOffsetLeft = $thumbnail[0].offsetLeft;
    var viewportWidth = t._$element[0].offsetWidth;
    var leftMargin = Math.max(viewportWidth - thumbnail.expandedWidth, 0) / 2;
    var scrollLeft = thumbnailOffsetLeft - leftMargin + (offset || 0);
    duration
        ? t._$element.animate({ scrollLeft: scrollLeft }, duration)
        : t._$element.scrollLeft(scrollLeft);
};

/**
 * Open the inline reader for the given thumbnail, and close any previously-open one.
 * @param {Object} thumbnailData - Thumbnail to open
 * @private
 */
Thumbnails.prototype._openInlineReader = function(thumbnailData) {
    var t = this;
    var thumbnail = t.findThumbnailById(thumbnailData.id);
    if (!thumbnail.isExpanded) {
        thumbnail.loadInlineReaderContent(t._outlineReader);
        t._expandAndCenterThumbnail(thumbnail, t._config.horizontalCenteringAnimationMs);
    }
};

/**
 * Allow the mouse wheel to scroll the view horizontally whenever the mouse is over content not needing vertical scrolling.
 */
Thumbnails.prototype.mapVerticalScrollToHorizontalScroll = function() {
    var cssRules = strippetsUtil.getCSSRule(defaults.classes.thumbnails.thumbnail.slice(1));
    var maxWidth = cssRules ? cssRules.reduce(function (memo, m) {
        var w = m.style.width;
        return w ? Math.max(memo, parseInt(w, 10)) : memo;
    }, 0) : 200;
    strippetsUtil.mapVerticalScrollToHorizontalScroll(this._$element, maxWidth);
};

/**
 * Remove the horizontal scroll bindings added above.  Used when changing to the wrapped layout.
 */
Thumbnails.prototype.unmapVerticalScrollToHorizontalScroll = function() {
    strippetsUtil.unMapVerticalScrollToHorizontalScroll(this._$element);
};

/**
 * Notify the reader's outline to recompute its layout.
 * Call this when the containing visual has been resized.
 */
Thumbnails.prototype.resize = function() {
    var t = this;
    t._readerview.rePositionReaderView();
    t._outlineReader.redrawEntities();
};

module.exports = Thumbnails;
