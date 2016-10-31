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

module.exports.config = {
    thumbnails: {
        entityIcons: null,
        // icons available for entity mapping. Initialization and loading of data reserves available entities.
        autoGenerateIconMappings: {
            person: [{'class': 'fa fa-male', 'color': '#400000'},
                {'class': 'fa fa-male', 'color': '#d26502'},
                {'class': 'fa fa-male', 'color': '#f0ab21'},
                {'class': 'fa fa-male', 'color': '#9ab3ca'},
                {'class': 'fa fa-male', 'color': '#35364e'},
                {'class': 'fa fa-male', isDefault: true}],
            place: [{'class': 'fa fa-globe', 'color': '#1b2c3f'},
                {'class': 'fa fa-globe', 'color': '#3d697a'},
                {'class': 'fa fa-globe', 'color': '#a68900'},
                {'class': 'fa fa-globe', 'color': '#f4651a'},
                {'class': 'fa fa-globe', 'color': '#fca771'},
                {'class': 'fa fa-globe', isDefault: true}],
            thing: [{'class': 'fa fa-certificate', 'color': '#f9bac4'},
                {'class': 'fa fa-certificate', 'color': '#d2e5eb'},
                {'class': 'fa fa-certificate', 'color': '#91d4d1'},
                {'class': 'fa fa-certificate', 'color': '#e5ab6a'},
                {'class': 'fa fa-certificate', 'color': '#58373e'},
                {'class': 'fa fa-certificate', isDefault: true}],
        },
    },
    thumbnail: {
        height: 400,
        onClicked: null,
    },
    readerview: {
        readerHeight: 400,
        readerWidth: 500,
        entityBarWidth: 24, // readerWidth - entityBarWidth = reader content width
        openAnimationMs: 300,
        onLoadUrl: null,
        onReaderOpened: null,
        onReaderClosed: null,
    },
};

module.exports.classes = {
    thumbnails: {
        thumbnailsContainer: '.thumbnails-container',
        inlineThumbnails: '.inline-thumbnails',
        viewport: '.viewport',
        thumbnail: '.thumbnail',
    },
    thumbnail: {
        card: '.card',
        cardIcon: '.card-icon',
        cardImage: '.card-image',
        inlineReader: '.inline-reader',
        inlineReaderContainer: '.inline-reader-container',
    },
    readerview: {
        readerContainer: '.reader-container',
        buttonContainer: '.button-container',
        readerNextButton: '.reader-next-button',
        readerPrevButton: '.reader-prev-button',
    },
};

module.exports.events = {
    thumbnailClicked: '[Thumbnail::ThumbnailClicked]',
    enableBlur: '[Thumbnail::ThumbnailEnableBlur]',
};
