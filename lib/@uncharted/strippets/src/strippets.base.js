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

var _ = require('underscore');
var util = require('@uncharted/strippets.common').util;

var StrippetsBase = /* istanbul ignore next */ function() {

};

/**
 * Function to retrieve CSS styles used by strippets. This will automatically load two styles (if they exist):
 * - Regular style (in the `normal` sub-object)
 * - Reading mode style (in the `reading` sub-object)
 *
 * @method retrieveStyles
 * @returns {Object} An object containing the styles.
 * @static
 */
StrippetsBase.retrieveStyles = function() {
    var styles = {};
    var styleRules = StrippetsBase.styleRules;

    _.each(styleRules, function(rule) {
        styles[rule] = {};
        _.each(util.getCSSRule(rule), function(styleRule) {
            if (StrippetsBase.readingStyleRegex.test(styleRule.selectorText)) {
                if (!styles[rule].reading) {
                    styles[rule].reading = styleRule.style;
                }
            } else {
                if (!styles[rule].normal) {
                    styles[rule].normal = styleRule.style;
                }
            }
        });
    });

    return styles;
};


/**
 * The style selector (in a regular expression) to look for when recognizing between reading mode and normal mode styles.
 *
 * @type {RegExp}
 * @static
 */
StrippetsBase.readingStyleRegex = /.*[. ]read[. ].*/;

/**
 * The names of the CSS style rules to load into styles.
 *
 * @type {Array}
 * @static
 */
StrippetsBase.styleRules = [
    'entity',
    'outlineItem',
    'sourceIcon',
    'outlineHeader',
];

/**
 * Object containing the CSS styles used by strippets.
 *
 * @type {Object}
 * @const
 */
StrippetsBase.prototype.styles = StrippetsBase.retrieveStyles();

StrippetsBase.prototype.attrs = {
    entity: 'data-entity',
    minimizedWidth: '_mw',
};

/**
 * Mediator events emitted by Outlines
 * @type {{container: null, outline: {Reset: string, Highlight: string, Minimize: string, Hide: string, ReadingMode: string, CenterElement: string, EntityClicked: string, EnableSidebar: string, RedrawEntity: string, OutlineClicked: string}, reader: {ReaderOpened: string, ReaderClosed: string}}}
 */
StrippetsBase.prototype.events = {
    container: null,
    outline: {
        Reset: '[Outline::Reset]',
        Highlight: '[Outline::Highlight]',
        Minimize: '[Outline::Minimize]',
        Hide: '[Outline::Hide]',
        ReadingMode: '[Outline::ReadingMode]',
        CenterElement: '[OutlineContainer::CenterElement]',
        EntityClicked: '[OutlineContent::EntityClicked]',
        EnableSidebar: '[Outline::EnableSidebar]',
        RedrawEntity: '[Outline::ReRenderEntity]',
        OutlineClicked: '[Outline::OutlineClicked]',
        Resize: '[Outline::Resize]',
    },
    reader: {
        ReaderOpened: '[Reader::Opened]',
        ReaderClosed: '[Reader::Closed]',
    },
};

/**
 * Names of CSS classes used by Outlines elements and accessed by the strippets code
 * @type {{container: {container: string, viewport: string, leftButton: string, rightButton: string, autoCenter: string, scrollable: string}, outline: {outlinecontainer: string, outline: string, minimizedmode: string, readmode: string, hiddenmode: string, sourceIcon: string, sourceText: string}, maincontent: {outlinemaincontent: string, outlineentitycontainer: string, slider: string}, sidebar: {sidebarContainer: string, sidebarentitycontainer: string}, reader: {readerContent: string}, entity: {outlineentity: string, title: string, details: string, name: string}}}
 */
StrippetsBase.prototype.classes = {
    container: {
        container: '_stories',
        viewport: '_vp',
        visual: 'viewport',
        leftButton: '_lb',
        rightButton: '_rb',
        autoCenter: 'auto-center',
        scrollable: 'scrollable',
    },
    outline: {
        outlinecontainer: '_sc', // outline container
        outline: '_si', // outline item
        minimizedmode: 'minimized',
        readmode: 'read',
        hiddenmode: 'hidden',
        sourceIcon: '_ss',
        sourceText: 'sourceText',
    },
    maincontent: {
        outlinemaincontent: '_smc', // main outline content
        outlineentitycontainer: '_sec', // outline entity container
        slider: '_rs',
    },
    sidebar: {
        sidebarContainer: 'sidebar',
        sidebarentitycontainer: '_sbec',
    },
    reader: {
        reader: 'reader',
        readerContent: '_rc',
        closeButton: '_window-close',
    },
    entity: {
        outlineentity: '_se', // outline entity
        title: '_t',
        details: '_ed',
        name: '_en',
    },
};

/**
 * Handlebars templates for Outlines elements
 * @type {{container: {strippetsTemplate: string, viewportTemplate: string, containerTemplate: string, scrollLeftControlTemplate: string, scrollRightControlTemplate: string, scrollLeftButtonTemplate: string, scrollRightButtonTemplate: string}, outline: {outlineContainerTemplate: string, outlineHeaderTemplate: string, outlineItemTemplate: string, outlineSourceIconTemplate: string, outlineSourceTemplate: string}, maincontent: {outlineMainTemplate: string, entityContainerTemplate: string, sliderTemplate: string}, sidebar: {sidebarTemplate: string, entityContainerTemplate: string}, reader: {readerTemplate: string, readerContentTemplate: string, readerContentErrorTemplate: string, readerContentLoadingTemplate: string}, entity: {entityTemplate: string, entityDetailsTemplate: string, entityNameTemplate: string}}}
 */
StrippetsBase.prototype.templates = {
    container: {
        strippetsTemplate: '<div class="strippets"></div>',
        viewportTemplate: '<div class="viewport"></div>',
        containerTemplate: '<div class="outlineContainer"></div>',
        scrollLeftControlTemplate: '<div class="hoverpad left noselect"></div>',
        scrollRightControlTemplate: '<div class="hoverpad right noselect"></div>',
        scrollLeftButtonTemplate: '<div class="button"><i class="fa fa-left fa-chevron-left"></i></div>',
        scrollRightButtonTemplate: '<div class="button"><i class="fa fa-left fa-chevron-right"></i></div>',
    },
    outline: {
        outlineContainerTemplate: '<li class="outlineItemContainer"></li>',
        outlineHeaderTemplate: '<div class="outlineHeader"></div>',
        outlineItemTemplate: '<div class="outlineItem noselect"></div>',
        outlineSourceIconTemplate: '<div class="sourceIcon noselect"></div>',
        outlineSourceTemplate: '<div class="noselect"><% if (src_url) { %><a href="<%= src_url %>" target="_blank" class="sourceLink"><%= src_title %></a><% } else {%><span><%= src_title %></span><% }%></div>',
    },
    maincontent: {
        outlineMainTemplate: '<div class="mainOutlineContent"></div>',
        entityContainerTemplate: '<div class="entityContainer noselect"></div>',
        sliderTemplate: '<div class="readingSlider"></div>',
    },
    sidebar: {
        sidebarTemplate: '<div class="sidebar"></div>',
        entityContainerTemplate: '<div class="entityContainer noselect"></div>',
    },
    reader: {
        readerTemplate: '<div class="reader"></div>',
        readerContentTemplate: '<div class="readerContent">' +
        '<div class="readerContentBody">' +
        '<% if (data.title) { %> <h1 class="title"><%= data.title %></h1> <% } %>' +
        '<ul class="meta-line">' +
        '<% if (data.author) { %> <li class="author"><%= data.author %></li> <% } %>' +
        '<% if (data.lastupdatedon) { %> <li> <time class="updated"><%= data.lastupdatedon %></time></li> <% } %>' +
        '</ul>' +
        '<% if (data.figureImgUrl) { %>' +
        '<div class="figure">' +
        '<div class="figure-content">' +
        '<a href="" class="image">' +
        '<img src="<%= data.figureImgUrl %>">' +
        '</a>' +
        '<% if (data.figureCaption) { %><div class="figcaption"> <%= data.figureCaption %></div> <% } %>' +
        '</div>' +
        '</div>' +
        '<% } %>' +
        '<% if (data.content) { %> <div class="content"><%= data.content %></div> <% } %>' +
        '</div>' +
        '</div>',
        readerCloseButtonTemplate: '<i class="fa fa-times ' + StrippetsBase.prototype.classes.reader.closeButton + '"></i>',
        readerContentErrorTemplate: '<div class="readerContentError">' +
        '<div class="reader-broken">' +
        '<span class="emoticon"><i class="fa fa-meh-o"></i></span>' +
        '<br>' +
        '<span class="err-info"><%= data.errorCode %> <%= data.message %></span>' +
        '<p>Reader view is currently unavailable for this document.</p>' +
        '</div>' +
        '</div>',
        readerContentLoadingTemplate: '<div class="readerContentLoading"><div class="loader">Loading...</div></div>',
    },
    entity: {
        entityTemplate: '<div class="entity noselect"><div class="icon <%= iconClass %>" style="color:<%= iconColor %>"></div></div>',
        entityDetailsTemplate: '<div class="details"></div>',
        entityNameTemplate: '<div class="name"><%= name %></div>',
    },
};

module.exports = StrippetsBase;
