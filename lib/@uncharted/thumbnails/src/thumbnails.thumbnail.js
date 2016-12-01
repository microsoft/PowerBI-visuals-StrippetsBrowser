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
var thumbnailTemplate = require('../templates/thumbnail.handlebars');
var defaults = require('./thumbnails.defaults.js');
var mediator = require('@uncharted/strippets.common').mediator;
var util = require('@uncharted/strippets.common').util;

/**
 * Constructor for a Thumbnail
 * @param {Object} spec - Object referencing the HTML element to use as the parent and configuration settings for the thumbnail
 * @constructor
 */
function Thumbnail(spec) {
    var t = this;

    t.data = spec.data;
    t._$parent = spec.$parent;
    t._config = spec.config;
    t._$element = null;
    t._$cardImage = null;
    t._blurEnabled = false;
    t._init(spec.show);
}

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
 * Initialize a thumbnail
 * @param {Boolean=} show - if a boolean is provided, it determines whether the thumbnail should be displayed;
 * otherwise, the thumbnail is displayed
 * @private
 */
Thumbnail.prototype._init = function(show) {
    var t = this;
    t.data.formattedDate = t._formatDate(t.data.articledate);
    t.data.titleonly = !t.data.imageUrl && (t.data.source || t.data.sourceUrl);
    t._$element = $(thumbnailTemplate(t.data))
        .height(t._config.height)
        .toggle(typeof show === 'boolean' ? show : true)
        .appendTo(t._$parent);

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
 * Register mouse and mediator event handlers.
 * @private
 */
Thumbnail.prototype._registerEvents = function() {
    var t = this;
    t._$element.on('click', defaults.classes.thumbnail.card, function() {
        mediator.publish(defaults.events.thumbnailClicked, t.data);
        if (t._config.onClicked) {
            t._config.onClicked(t.data);
        }
    });
    mediator.subscribe(defaults.events.enableBlur, function(enabled) {
        t.blurEnabled = enabled;
    });
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
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[d.getUTCMonth()] + '. ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
};

/**
 * Asynchronously load images from all the given URLs,
 * setting them as background images for DIVs that will be appended to the given container element.
 * Throws exceptions for failed URLs.
 * @param {*} imageUrls - URL string or Array of URLs to images
 * @param {JQuery} imageContainer - JQuery-wrapped element to parent the images to
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
