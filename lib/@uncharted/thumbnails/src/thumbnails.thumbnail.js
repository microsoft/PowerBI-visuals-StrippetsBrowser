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
var thumbnailTemplate = require('../templates/thumbnail.handlebars');
var defaults = require('./thumbnails.defaults.js');
var util = require('@uncharted/strippets.common').util;
var Outline = require('@uncharted/strippets').Outline;

/**
 * Constructor for a Thumbnail
 * @param {Object} spec - Object referencing the HTML element to use as the parent and configuration settings for the thumbnail
 * @constructor
 */
function Thumbnail(spec) {
    var t = this;
    IBindable.call(t);
    t.data = spec.data;
    t._config = $.extend({}, defaults.config.thumbnail, spec.config);
    t._$element = null;
    t._$cardImage = null;
    t._blurEnabled = false;
    t._init(spec.show);
}

/**
 * @inheritance {IBindable}
 */
Thumbnail.prototype = Object.create(IBindable.prototype);
Thumbnail.prototype.constructor = Thumbnail;

/**
 * Add a blurEnabled property to Thumbnail, for an optional render effect
 */
Object.defineProperty(Thumbnail.prototype, 'blurEnabled', {
    get: function() {
        return this._blurEnabled;
    },

    set: function(value) {
        if (value !== this._blurEnabled) {
            this._blurEnabled = value;
            if (this._$cardImage) {
                this._$cardImage.toggleClass('card-image-blur', value);
            }
        }
    },
});

/**
 * Width of this thumbnail when it's expanded
 */
Object.defineProperty(Thumbnail.prototype, 'expandedWidth', {
    get: function() {
        return this._config.expandedWidth;
    },
});

Object.defineProperty(Thumbnail.prototype, 'isExpanded', {
    get: function() {
        return Boolean(this._isExpanded);
    },

    set: function(value) {
        this._isExpanded = Boolean(value);
        this._$element.toggleClass('expanded', this._isExpanded);
        this._isExpanded ? this._$element.css('width', this.expandedWidth) : this._$element.css('width', '');
    },
});

/**
 * Initialize a thumbnail
 * @param {Boolean=} show - if a boolean is provided, it determines whether the thumbnail should be displayed;
 * otherwise, the thumbnail is displayed
 * @private
 */
Thumbnail.prototype._init = function(show) {
    var t = this;
    t.data.formattedDate = t._formatDate(t.data.articledate);
    t.data.titleonly = !t.data.imageUrl && (t.data.source || t.data.sourceUrl);
    t._$element = $(thumbnailTemplate(t.data)).toggleClass('hidden', typeof show === 'boolean' ? !show : false);
    t._$thumbnailCardIcon = t._$element.find(defaults.classes.thumbnail.cardIcon).hide();
    t._$thumbnailCardIcon.css('background-size', t._$thumbnailCardIcon.width() + 'px ' + t._$thumbnailCardIcon.height() + 'px');

    if (t.data.sourceimage) {
        t._$thumbnailCardIcon.css({
            'background-image': "url('" + t.data.sourceimage + "')",
        }).show();
    } else if (t.data.sourceiconname || t.data.source) {
        var size = t._$thumbnailCardIcon.height() * 2;
        var sourceName = (t.data.sourceiconname || t.data.source);
        t._$thumbnailCardIcon.css('background-image', "url('" + util.createFallbackIconURL(size, size, sourceName) + "')").show();
    }

    /* initialize the image */
    if (t.data.imageUrl) {
        t._$cardImage = t._$element.find(defaults.classes.thumbnail.cardImage);
        t._loadImages(t.data.imageUrl, t._$cardImage);
    }

    t._registerEvents();
};

/**
 * Register event handlers.
 * @private
 */
Thumbnail.prototype._registerEvents = function() {
    var t = this;
    t._$element.on('click', defaults.classes.thumbnail.card, function() {
        t.emit(defaults.events.thumbnailClick, t.data);
    });
};

/**
 * Expand the thumbnail.
 */
Thumbnail.prototype.expand = function() {
    if (!this.isExpanded) {
        this.isExpanded = true;
        this.emit(defaults.events.thumbnailExpand, this.data);
    }
};

/**
 * Shrink the thumbnail to its original size.
 */
Thumbnail.prototype.shrink = function() {
    if (this.isExpanded) {
        this.isExpanded = false;
        this.emit(defaults.events.thumbnailShrink, this.data);
    }
};

/**
 * Load the reader content to this thumbnail.
 * @param {Object} outlineReader - an outline reader instance.
 */
Thumbnail.prototype.loadInlineReaderContent = function(outlineReader) {
    var t = this;
    var $readerContainer = t._$element.find(defaults.classes.thumbnail.inlineReaderContainer).empty();
    outlineReader.width = this._config.expandedWidth;
    outlineReader.updateContent(t.data);
    outlineReader.appendTo($readerContainer);
};

/**
 * Helper to generate the source date string
 * @param {*} date - Anything acceptable to the JavaScript Date constructor,
 * including a UTC formatted date string such as "2016-11-01T04:00:00.000Z"
 * @returns {string} Date string formatted like "Nov. 1, 2016"
 * @private
 */
Thumbnail.prototype._formatDate = function(date) {
    var d = new Date(date);
    // don't try to format an invalid date
    if (d && d.getTime && !isNaN(d.getTime())) {
        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthNames[d.getUTCMonth()] + '. ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
    }

    return '';
};

/**
 * Asynchronously load images from all the given URLs,
 * setting them as background images for DIVs that will be appended to the given container element.
 * Throws exceptions for failed URLs.
 * @param {*} imageUrls - URL string or Array of URLs to images
 * @param {Object} imageContainer - JQuery-wrapped element to parent the images to
 * @returns {*} Promise
 * @private
 */
Thumbnail.prototype._loadImages = function(imageUrls, imageContainer) {
    var t = this;
    var i;
    var n;
    var promises = [];

    var urls;
    if (imageUrls instanceof Array) {
        urls = imageUrls;
    } else {
        urls = [imageUrls];
    }

    for (i = 0, n = urls.length; i < n; ++i) {
        promises.push(t._loadImage(urls[i]));
    }

    return Promise.all(promises).then(function(loadedImages) {
        var image;
        var containerWidth = imageContainer.width();
        var containerHeight = imageContainer.height();
        var width = containerWidth / urls.length;
        var cssWidth = ((1.0 / urls.length) * 100) + '%';
        var height = containerHeight;

        for (i = 0, n = loadedImages.length; i < n; ++i) {
            image = loadedImages[i];
            var imageHeight = loadedImages[i].height;
            if (image.width > containerWidth) {
                imageHeight *= (containerWidth / image.width);
            }
            height = Math.max(height, imageHeight);
        }

        if (height > containerHeight && height > imageContainer.parent().height() * 0.5) {
            height = imageContainer.parent().height() * 0.5;
        }

        if (height !== containerHeight) {
            imageContainer.css('height', height);
        }

        var subdivided = (urls.length > 1);

        for (i = 0, n = urls.length; i < n; ++i) {
            image = loadedImages[i];
            var div = $('<div></div>');
            var scale = Math.max(width / image.width, height / image.height);
            var scaledWidth = Math.round(image.width * scale);
            var sizeType;

            if ((subdivided && scaledWidth < width) || (!subdivided && scaledWidth > width)) {
                sizeType = 'contain';
            } else if (scale > 1) {
                sizeType = 'auto';
            } else {
                sizeType = 'cover';
            }

            div.css('background-image', 'url("' + urls[i] + '")');
            div.css('background-size', sizeType);
            div.css('width', cssWidth);
            div.css('height', imageContainer.height());

            imageContainer.append(div);
        }

        return Promise.resolve(loadedImages);
    }, function(reason) {
        throw reason;
    });
};

/**
 * Load one image from the given URL.
 * @param {String} url - Address of the image
 * @returns {Promise}
 * @private
 */
Thumbnail.prototype._loadImage = function(url) {
    return new Promise(function(resolve) {
        var img = $('<img />').on('load', function() {
            resolve(img[0]);
        }).attr('src', url);
    });
};

module.exports = Thumbnail;
