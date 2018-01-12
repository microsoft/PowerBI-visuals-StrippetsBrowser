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

module.exports = {
    debugMode: false,
    container: {
        width: '100%',
        height: '100%',
    },
    centerAfterFilter: false,
    enableScrollBar: true,
    supportKeyboardNavigation: true,
    keyboardNavigationDelay: 410,
    outline: {
        centerOutlinePosition: 0.5,
        sidebarEnabled: true,
        entitiesRepositionDelay: 500,
        entitiesRepositionInterval: 300,
        onClicked: null,
        maincontent: {
            entityLayoutThreshold: 20,
            minimizedWidth: 24,

            // Technical debt
            // this value is to calculate the number of entities in a strippets when there is no style sheet loaded and StrippetsBase.retrieveStyles returns nothing
            // value must be matched with the entity height specified in the stylesheet. otherwise, it will break.
            // /TODO: come up with better solution and get rid of this
            entityHeight: 20,
        },
        sidebar: {
            minimizedWidth: 24,
            entityHeight: 20, // /TODO: same as maincontent.entityHeight
        },
        entity: {
            entityDescriptionLength: 15,
        },
        reader: {
            enabled: true,
            readerWidth: 500,
            readerHeight: '100%',
            onLoadUrl: null,
            onReaderOpened: null,
            onReaderClosed: null,
            onSourceUrlClicked: null,
            disableAnimation: false,
            scrollBarWidth: 16,
        },
    },
    autoGenerateIconMap: true,
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
};
