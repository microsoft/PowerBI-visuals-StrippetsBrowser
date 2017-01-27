(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.Uncharted || (g.Uncharted = {})).Strippets = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

module.exports = require('./strippets');
module.exports.asJQueryPlugin = require('./strippets').asJQueryPlugin;
module.exports.Outline = require('./strippets.outline.js');

},{"./strippets":6,"./strippets.outline.js":8}],2:[function(require,module,exports){
(function (global){
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

var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);
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
        '<i class="fa fa-times ' + StrippetsBase.prototype.classes.reader.closeButton + '"></i>' +
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

        readerContentErrorTemplate: '<div class="readerContentError">' +
        '<i class="fa fa-window-close-o"></i>' +
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"@uncharted/strippets.common":11}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
(function (global){
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

var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var Base = require('./strippets.base');
var config = require('./strippets.config.js');
var DEFAULT_ENTITYCOLOR = 'rgba(171,171,171,1)';

/**
 * Constructor for a single Entity on an Outline, represented by an icon.
 * @param {String} parentId - ID of the parent Outline
 * @param {String} contentType - description of the type of the entity
 * @param {Object} entitydata - Object including the weight, name, and type of the entity
 * @param {Array} iconmap - Array of icon info objects
 * @param {Object} settings - configuration options for the entity
 * @returns {OutlineEntity}
 * @constructor
 */
var OutlineEntity = function OutlineEntity(parentId, contentType, entitydata, iconmap, settings) {
    var t = this;
    t.defaults = config.outline.entity;
    t.data = entitydata;
    t.icon = null;
    t.weight = 0;
    t._parentId = parentId;
    t._contentType = contentType;
    t.init(entitydata, iconmap, settings);
    t.verticalPosition = 0;
    return t;
};
OutlineEntity.prototype = Object.create(Base.prototype);
OutlineEntity.prototype.constructor = OutlineEntity;

/**
 * Initialize an outline entity.
 * @param {Object} data - Entity object
 * @param {Array} iconmap - Array of icon info objects
 * @param {Object} settings - Configuration settings for the entity
 */
OutlineEntity.prototype.init = function(data, iconmap, settings) {
    this.Settings = $.extend({}, this.defaults, settings);

    this.construct(data, iconmap);
};

/**
 * Generate the entity element from the entity template,
 * assigning it the given data and applying the corresponding icon from the given icon map.
 * @param {Object} data - Entity object
 * @param {Array} iconmap - Array of icon info objects
 */
OutlineEntity.prototype.construct = function(data, iconmap) {
    var s = this;
    var entityTemplate = _.template(s.templates.entity.entityTemplate);
    s.weight = data.weight || 0;
    s.icon = s.getEntityIcon(data, iconmap);
    s.$entity = $(entityTemplate({
        iconClass: s.icon.class,
        iconColor: s.icon.color || DEFAULT_ENTITYCOLOR,
        name: data.name,
    }))
        .css('position', 'absolute')
        .attr(s.attrs.entity, JSON.stringify({name: data.name, type: data.type}))
        .addClass(s.classes.entity.outlineentity);
};

/**
 * Set the entity's position as a percentage of the outline's height.
 * @param {Number} positionAsPercent - Position in the range[0-100]
 * @returns {*} JQuery-wrapped entity element, for chaining
 */
OutlineEntity.prototype.setPosition = function(positionAsPercent) {
    return this.$entity.css('top', positionAsPercent + '%');
};

/**
 * Apply a set of CSS attributes to the entity.
 * @param {Object} attributes - set of CSS attributes to apply to the entity element
 */
OutlineEntity.prototype.setAttributes = function(attributes) {
    var t = this;
    if (attributes === Object(attributes)) {
        Object.keys(attributes).forEach(function(attribute) {
            t.$entity.attr(attribute, attributes[attribute]);
        });
    }
};

/**
 * Return the CSS height of the entity.
 * @returns {*} height
 */
OutlineEntity.prototype.getHeight = function() {
    return this.$entity.height();
};

/**
 * Set the highlight state for the entity
 * @param {boolean} enable - true to highlight the entity; otherwise, remove the highlight style
 * @param {String=} color - optional color for the highlight
 */
OutlineEntity.prototype.highlight = function(enable, color) {
    if (enable) {
        this.$entity.addClass('highlight');
        if (color) {
            this.$entity.css('border-right-color', color);
        }
    } else {
        this.$entity.removeClass('highlight');
        this.$entity.css('border-right-color', '');
    }
};

/**
 * Search the given icon map for the icon matching the given entity
 * @param {Object} d - an entity object
 * @param {Array} iconmap - Array of icon info objects
 * @returns {*} Object containing the entity's class and color
 */
OutlineEntity.prototype.getEntityIcon = function(d, iconmap) {
    var e = _.find(iconmap, function(im) {
        return im.type === d.type && im.name === d.name;
    });
    if (e) {
        return {class: e.class, color: e.color};
    }
    var dflt = _.find(iconmap, function(im) {
        return im.type === d.type && im.isDefault;
    });
    if (dflt) {
        return {class: dflt.class, color: dflt.color};
    }
    return {class: '', color: ''};
};

module.exports = OutlineEntity;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./strippets.base":2,"./strippets.config.js":3}],5:[function(require,module,exports){
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

/**
 * Create a render position map for use by the FeatureContent module's entity layout deconfliction algorithm.
 * @param {Number|String} position - parsed as a number then exposed as the originalFrom property.
 * A normalized value in the range (0, 1) representing the entity's position relative to the outline's height
 * @param {Number=} entitySize - A normalized value corresponding to the entity's icon height.
 * Used to compute the originalTo property.
 * @param {Number=} offset - A normalized value in the range (0, 1).
 * Represents how the entity's position has been adjusted relative to its original position.
 * @constructor
 */
var EntityRenderMap = function EntityRenderMap(position, entitySize, offset) {
    var t = this;

    t._entitySize = entitySize || 0;
    t._originalFrom = Number(position);
    t._originalTo = Number(position) + t._entitySize;

    t._offset = offset || 0;
};

EntityRenderMap.prototype.constructor = EntityRenderMap;

/**
 * Normalized value in the range (0, 1) representing the entity's original position relative to the outline's height
 */
Object.defineProperty(EntityRenderMap.prototype, 'originalFrom', {
    get: function() {
        return this._originalFrom;
    },
    set: function(value) {
        this._originalFrom = value;
    },
});

/**
 * Normalized value in the range (0, 1) representing the entity's original position relative to the outline's height,
 * plus it's icon height.
 */
Object.defineProperty(EntityRenderMap.prototype, 'originalTo', {
    get: function() {
        return this._originalTo;
    },
});

/**
 * Normalized value in the range (0, 1) representing the entity's adjusted position after deconfliction.
 */
Object.defineProperty(EntityRenderMap.prototype, 'finalFrom', {
    get: function() {
        return this._originalFrom + this._offset;
    },
    set: function(value) {
        this._offset = value - this.originalFrom;
    },
});

/**
 * Normalized value in the range (0, 1) representing the entity's adjusted position after deconfliction,
 * plus it's icon height.
 */
Object.defineProperty(EntityRenderMap.prototype, 'finalTo', {
    get: function() {
        return this.originalTo + this._offset;
    },
});

/**
 * Normalized value in the range (0, 1) representing how the deconfliction algorithm
 * adjusted entity's position relative to its original position.
 */
Object.defineProperty(EntityRenderMap.prototype, 'offset', {
    get: function() {
        return this._offset;
    },
    set: function(value) {
        this._offset = value;
    },
});

module.exports = EntityRenderMap;

},{}],6:[function(require,module,exports){
(function (global){
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
/* global $,_, window */

var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);
var Promise = require('bluebird');
var Base = require('./strippets.base');
var mediator = require('@uncharted/strippets.common').mediator;
var Outline = require('./strippets.outline.js');
var UserConfig = require('./strippets.config.js');
var MouseHold = require('@uncharted/strippets.common').mousehold;
var Keyboard = require('@uncharted/strippets.common').Keyboard;
var util = require('@uncharted/strippets.common').util;

/**
 * Constructor for the Outlines component.
 * Outlines represents articles as a set of vertical strips (each an Outline) that use icons to indicate the position of
 * key Entities in the article.  Tapping on an outline expands it into an inline reader view, with the outline on the right.
 * @param {Object} elem - The HTML element to use as the parent for the component
 * @param {Object} options - configuration settings for the component
 * @returns {Strippets}
 * @constructor
 */
var Strippets = function Strippets(elem, options) {
    var t = this;
    t._elem = elem;
    t.$elem = $(elem);
    t.options = options;
    t._items = [];
    t._iconMaps = [];
    t.init();
    t.loadData = this.loadData;
    t.enableSidebar = this.enableSidebar;
    t._globalFilter = null;
    t._globalHighlights = null;
    return t;
};

// the plugin prototype
Strippets.prototype = Object.create(Base.prototype);
Strippets.prototype.constructor = Strippets;

/**
 * Initialize the Outlines component.
 */
Strippets.prototype.init = function() {
    // Introduce defaults that can be extended either
    // globally or using an object literal.
    this.config = $.extend(true, UserConfig, this.options, this.metadata);

    // ignore velocity's default post-display behavior.
    if ($.Velocity) $.Velocity.defaults.display = '';

    this.initializeContainer();
    this.initializeIconMap();
    this.registerEvents();
    this.config.supportKeyboardNavigation && this.registerKeyboardHandler();
};

/**
 * Create the HTML elements that contain the outlines
 */
Strippets.prototype.initializeContainer = function() {
    var c = this;
    c.$strippets = $(c.templates.container.strippetsTemplate)
        .height(c.config.container.height)
        .width(c.config.container.width)
        .addClass(c.config.enableScrollBar ? c.classes.container.scrollable : '')
        .appendTo(c.$elem);

    c.$viewport = $(c.templates.container.viewportTemplate)
        .height(c.config.container.height)
        .width(c.config.container.width)
        .addClass(c.classes.container.viewport)
        .appendTo(c.$strippets);

    c.$chartContainer = $(c.templates.container.containerTemplate)
        .addClass(c.classes.container.container)
        .appendTo(c.$viewport);

    var $leftButtonContainer = $(c.templates.container.scrollLeftControlTemplate)
        .addClass(c.classes.container.leftButton)
        .appendTo(c.$strippets);

    c.$leftButton = $(c.templates.container.scrollLeftButtonTemplate)
        .appendTo($leftButtonContainer);

    var $rightButtonContainer = $(c.templates.container.scrollRightControlTemplate)
        .addClass(c.classes.container.rightButton)
        .appendTo(c.$strippets);

    c.$rightButton = $(c.templates.container.scrollRightButtonTemplate)
        .appendTo($rightButtonContainer);
};

/**
 * Function used to initialize the Entity Icon Map (used in mapping a class to an entity). There are two modes of operation:
 * - Auto Generate Icons based on a set of entity->icon configuration. This mode depends on the following configuration -
 *      (autoGenerateIconMap, defaultEntityIconConfig)
 * - Accept a pre-set mapping of entity->icon mappings. This mode depends on an "entityIcons" configuration.
 *
 * @method initializeIconMap
 * @static
 */
Strippets.prototype.initializeIconMap = function() {
    // flatten the icon map (translate format from user config -> system config
    var t = this;
    if (t.config.autoGenerateIconMap) {
        _.each(t.config.autoGenerateIconMappings, function(icons, entityType) {
            var iconMap = _.map(icons, function(icon) {
                return {type: entityType, 'class': icon.class, color: icon.color || null, isDefault: icon.isDefault};
            });
            t._iconMaps = _.union(t._iconMaps, iconMap);
        });
    } else {
        t._iconMaps = t.config.entityIcons;
    }
};

/**
 * Call resize when the containing visual has been resized.  This will notify the outlines to recompute their layout.
 */
Strippets.prototype.resize = function() {
    mediator.publish(this.events.outline.RedrawEntity);
};

/**
 * Register mouse and mediator event handlers, including mouse wheel horizontal scrolling.
 */
Strippets.prototype.registerEvents = function() {
    var s = this;
    var watchForElementTobeVisible;
    MouseHold.asJQueryPlugin();

    s.mapVerticalScrollToHorizontalScroll();
    s.$viewport.on('click', function(event) {
        var isViewport = event.target === event.currentTarget;
        var isChartContainer = event.target === s.$chartContainer[0];
        var isOutlineContainer = $(event.target).hasClass(s.classes.outline.outlinecontainer);
        if (isViewport || isChartContainer || isOutlineContainer) {
            mediator.publish(s.events.outline.Minimize);
            mediator.publish(s.events.outline.Reset);
        }
    });

    var scroll = function(direction) {
        return function(duration) {
            var topSpeedDuration = 1500;
            var d = duration > topSpeedDuration ? topSpeedDuration : duration;
            var resolution = ((d / 300) * 2 + 1) * direction;
            s.$viewport.stop(true, true).animate({'scrollLeft': '+=' + resolution});
        };
    };

    s.$leftButton.mousehold().bind(scroll(-1));
    s.$rightButton.mousehold().bind(scroll(1));

    mediator.subscribe(s.events.outline.CenterElement,
        s.centerElement,
        {}, s);

    var checkVisibilityAndRepositionEntities = function() {
        if (!s.$elem[0].offsetParent && !watchForElementTobeVisible) {
            watchForElementTobeVisible = setInterval(function() {
                if (s.$elem[0].offsetParent) {
                    mediator.publish(s.events.outline.RedrawEntity);
                    window.clearInterval(watchForElementTobeVisible);
                    watchForElementTobeVisible = undefined;
                }
            }, s.config.outline.entitiesRepositionInterval);
        }
    };

    checkVisibilityAndRepositionEntities();
};

/**
 * Allow the mouse wheel to scroll the view horizontally whenever the mouse is over content not needing vertical scrolling.
 */
Strippets.prototype.mapVerticalScrollToHorizontalScroll = function() {
    util.mapVerticalScrollToHorizontalScroll(this, this.$viewport, '_items', '$outline');
};

/**
 * Register keyboard navigation event handlers
 */
Strippets.prototype.registerKeyboardHandler = function() {
    var s = this;

    var findFirstOutline = function(state, array) {
        return _.find(array, function(outline) {
            return outline.getToState() === state;
        });
    };
    var findAndOpenOutline = function(searchBackward) {
        var targetOutline;
        var openedOutlineIndex = _.findIndex(s._items, function(outline) {
            return outline.getToState() === 'readingmode';
        });
        var openedOutline = s._items[openedOutlineIndex];

        if (!openedOutline) {
            return;
        }
        targetOutline = searchBackward
            ? findFirstOutline('minimal', s._items.slice(0, openedOutlineIndex).reverse())
            : findFirstOutline('minimal', s._items.slice(openedOutlineIndex + 1));

        if (targetOutline) {
            openedOutline.transitionState('minimal');
            targetOutline.transitionState('readingmode');
        }
    };

    var keyboard = new Keyboard(document, {repeatDelay: s.config.keyboardNavigationDelay});

    keyboard.bindKeydown(function(key) {
        switch (key) {
            case 37:
                findAndOpenOutline(true);
                break;
            case 39:
                findAndOpenOutline();
                break;
            default:
                return;
        }
    });
};

/**
 * Load a new dataset or additional data, updating the icon map and re-rendering, if needed.
 * @param {Array} data - Array of articles to render as outlines
 * @param {Boolean} append - true if this data should be appended to the existing outlines; false to replace the current outlines
 */
Strippets.prototype.loadData = function(data, append) {
    if (data) {
        if (!append) {
            this._items = [];
            this.$chartContainer.empty();
        }
        if (!this.config.entityIcons) {
            this.mapEntitiesToIconMap(data, this._iconMaps);
        }
        this.render(data);
    }
};

/**
 * Given an array of articles containing entities, and an icon map, associate each entity with the appropriate icon.
 * @param {Array} data - Array of article objects to render as outlines
 * @param {Array} iconMap - Array of icon info objects
 */
Strippets.prototype.mapEntitiesToIconMap = function(data, iconMap) {
    var concatEntities = function(array, item) {
        return array.concat(item.entities);
    };
    var nameAndType = function(entity) {
        return entity.name + '&' + entity.type;
    };
    var toEntityReference = function(entityList) {
        return {
            type: entityList[0].type,
            name: entityList[0].name,
            count: entityList.length,
        };
    };
    // process data
    var allEntities = data.reduce(concatEntities, []);
    var entityGroups = _.groupBy(allEntities, nameAndType);
    var entityReferences = Object.keys(entityGroups)
        .map(function(key) {
            return toEntityReference(entityGroups[key]);
        })
        .sort(function(entityRefA, entityRefB) {
            return entityRefB.count - entityRefA.count;
        });

    entityReferences.forEach(function(entity) {
        var entityAlreadyMapped = _.some(iconMap, function(icon) {
            return icon.type === entity.type && entity.name !== undefined && icon.name === entity.name;
        });
        if (!entityAlreadyMapped) {
            var unusedIcon = _.find(iconMap, function(icon) {
                return icon.type === entity.type && icon.name === undefined && !icon.isDefault;
            });
            if (unusedIcon) {
                unusedIcon.name = entity.name;
            }
        }
    });
};

/**
 * Generate an Outline element for each row in the given data
 * @param {Array} data - Array of article objects to render as outlines
 */
Strippets.prototype.render = function(data) {
    var s = this;
    // disable animations on initial render
    _.each(data,
        function(d) {
            var config = s.config.outline;
            var initialState = undefined;
            config.debugMode = s.config.debugMode;
            if (s._globalFilter) {
                initialState = Outline.shouldShow(d, s._globalFilter) ? 'minimal' : 'hidden';
            }
            var outline = new Outline(s.$chartContainer, d, s._iconMaps, config, initialState, s._globalHighlights);

            s._items.push(outline);
        });
};

/**
 * Horizontally center the indicated element within the viewport via an animated scroll.
 * @param {Object} details - contains references to tne jquery wrapper of the viewport,
 * as well as the id, expected width, and jquery wrapper of the element to center.
 * @returns {*} Promise returned by jquery.animate
 */
Strippets.prototype.centerElement = function(details) {
    var s = this;
    var scrollLeft = 0;

    if (details.$element) {
        var width = 0;
        _.find(s._items, function(item) {
            if (item._id === details.id) {
                return true;
            } else if (!item.$outlineContainer.hasClass('hidden')) {
                if (item.sidebar && item.sidebar.$sidebarContent) {
                    width += item.sidebar.$sidebarContent.width();
                }
                width += item.$outline.find('.' + s.classes.maincontent.outlinemaincontent).width();
            }

            return false;
        });

        scrollLeft = width -
            (0.5 * (s.$viewport.width() - details.expectedWidth));
    }

    return s.$viewport.animate({
        scrollLeft: scrollLeft,
    }).promise();
};

/**
 * Toggle the sidebar
 * @param {Boolean} isEnabled - true if the sidebar should be enabled
 */
Strippets.prototype.enableSidebar = function(isEnabled) {
    mediator.publish(this.events.outline.EnableSidebar, isEnabled);
};

/**
 * Reduce the list of outlines to only those that pass the given filter.  Center the remaining Outlines, if so configured.
 * @param {*} filter - Value, boolean, Array, or function to apply as a filter on the current set of items
 * @param {Boolean} onceOnly - True to apply this filter now, then forget about it;
 * false to store it as the current global filter
 * @returns {*} Promise
 */
Strippets.prototype.filter = function(filter, onceOnly) {
    var t = this;
    if (!onceOnly) {
        this._globalFilter = filter;
    }
    var promises = [];

    _.each(this._items, function(outline) {
        // if filter is null, then show. Otherwise, check if filter is an array, value or function and address accordingly.
        var shouldShow = Outline.shouldShow(outline.data, filter);

        var hidden = outline.getToState() === 'hidden';
        if (shouldShow && hidden) {
            promises.push(outline.transitionState('minimal'));
        } else if (!shouldShow && !hidden) {
            promises.push(outline.transitionState('hidden'));
        }
    });

    return Promise.all(promises).then(function() {
        if (t.config.centerAfterFilter) {
            t.startAutoCentering();
        }
    });
};

/**
 * Highlight the given entities in all the outlines.
 * @param {*} entities - an article or array of articles that should be highlighted in all outlines
 * @param {Boolean} onceOnly - True to apply these highlights now, then forget about them;
 * false to keep them around as the current global highlights
 */
Strippets.prototype.highlight = function(entities, onceOnly) {
    if (!onceOnly) {
        this._globalHighlights = entities;
    }
    mediator.publish(this.events.outline.Highlight, entities);
};

/**
 * Turn on the automatic scroll centering watcher,
 * which will recenter the horizontal scroll position when the viewport width changes.
 * Gives up if no width changes occur for 100 ms.
 */
Strippets.prototype.startAutoCentering = function() {
    var s = this;
    if (s.$viewport.hasClass(s.classes.container.autoCenter)) {
        return;
    }
    s.$viewport.addClass(s.classes.container.autoCenter);
    var viewPortWidth = s.$viewport.width();
    var maxScrollPosition = s.$viewport[0].scrollWidth - viewPortWidth;
    var endTimer;
    // Watch for scrollWidth change and set scroll position accordingly.
    var scrollWidthWatcher = setInterval(function() {
        var currentPosition = s.$viewport[0].scrollLeft;
        var newMaxScrollPosition = s.$viewport[0].scrollWidth - viewPortWidth;
        var targetPosition = newMaxScrollPosition / 2;
        var diff = Math.abs((maxScrollPosition - newMaxScrollPosition)) * 0.5;
        if (maxScrollPosition === newMaxScrollPosition) {
            return;
        }
        if (currentPosition < targetPosition) {
            s.$viewport[0].scrollLeft += diff;
        } else if (currentPosition > targetPosition) {
            s.$viewport[0].scrollLeft -= diff;
        }
        maxScrollPosition = newMaxScrollPosition;
        // Kill the watcher if no scroll width change is detected for 100 ms.
        clearTimeout(endTimer);
        endTimer = setTimeout(function() {
            clearInterval(scrollWidthWatcher);
            s.$viewport.removeClass(s.classes.container.autoCenter);
        }, 100);
    }, 0);
};

module.exports = Strippets;

/**
 * JQuery plugin interface for Outlines.  Deprecated.
 * @type {Function}
 */
module.exports.asJQueryPlugin = /* istanbul ignore next: Jquery Plugin Registration */ function() {
    $.fn.strippets = function(command) {
        var selector = this;
        var commands = {
            initialize: function(options) {
                this._strippets = new Strippets(this, options);
            },
            loaddata: function(data, append) {
                this._strippets.loadData(data, append);
            },
            enablesidebar: function(isenabled) {
                this._strippets.enableSidebar(isenabled);
            },
            filter: function(filter, onceOnly) {
                this._strippets.filter(filter, onceOnly);
            },
            highlight: function(entities) {
                this._strippets.highlight(entities);
            },
            dispose: function() {
                selector.each(function(index, element) {
                    element._strippets = null;
                    element.remove();
                });
            },
            resize: function () {
                this._strippets.resize();
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./strippets.base":2,"./strippets.config.js":3,"./strippets.outline.js":8,"@uncharted/strippets.common":11,"bluebird":18}],7:[function(require,module,exports){
(function (global){
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

var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var Entity = require('./strippets.entity.js');
var Base = require('./strippets.base');
var Scrollable = require('@uncharted/strippets.common').scrollable;
var config = require('./strippets.config.js');
var mediator = require('@uncharted/strippets.common').mediator;
var EntityRenderMap = require('./strippets.entity.rendermap');

var consolidationField = 'id';

/**
 * Constructor for the FeatureContent entity icon view.
 * @param {String} parentId - ID of the parent Outline
 * @param {Object} $parent - JQuery-wrapped element to which the feature content view will be appended
 * @param {Object} data - Object containing a reference to the entities to render in this view
 * @param {Array} iconmap - Array of icon info objects
 * @param {Object} settings - configuration options for the entity
 * @returns {FeatureContent}
 * @constructor
 */
var FeatureContent = function FeatureContent(parentId, $parent, data, iconmap, settings) {
    var t = this;
    t.defaults = config.outline.maincontent;
    t._parentId = parentId;
    t.entities = [];
    t.entitiesShown = [];
    t.entityPercentageHeight = undefined;
    t.contentType = 'Feature';
    t.entityHeight = this.styles.entity.normal ? parseFloat(this.styles.entity.normal.getPropertyValue('height')) : settings.entityHeight;
    t.init($parent, data, iconmap, settings);
    return t;
};
FeatureContent.prototype = Object.create(Base.prototype);
FeatureContent.prototype.constructor = FeatureContent;

/**
 * Initialize a feature content view
 * @param {Object} $parent - JQuery-wrapped element to which the feature content view will be appended
 * @param {Object} data - Object containing a reference to the entities to render in this view
 * @param {Array} iconmap - Array of icon info objects
 * @param {Object} settings - configuration options for the entity
 */
FeatureContent.prototype.init = function($parent, data, iconmap, settings) {
    this.Settings = $.extend({}, this.defaults, settings);

    this.constructLayout($parent);
    this.constructEntities(data, iconmap);
    this.registerEvents();
};

/**
 * Construct the elements that hold the entity icons and append them to the given parent element.
 * Initial State should be hidden.
 * @param {Object} $parent - JQuery-wrapped element to which the feature content view will be appended
 */
FeatureContent.prototype.constructLayout = function($parent) {
    var s = this;
    s.$mainOutlineContent = $(s.templates.maincontent.outlineMainTemplate)
        .addClass(s.classes.maincontent.outlinemaincontent)
        .appendTo($parent);

    s.$outlineEntityContainer = $(s.templates.maincontent.entityContainerTemplate)
        .addClass(s.classes.maincontent.outlineentitycontainer)
        .appendTo(s.$mainOutlineContent);
};

/**
 * Returns true if all the items in the given array are the same.
 * @param {Array} array - array to be checked for uniformity
 * @param {Function=} iteratee - function to extract a comparison value for a given array item
 * @returns {boolean} True if all items in the array are identical.
 */
var identical = function(array, iteratee) {
    var length = array.length;
    var first = iteratee ? iteratee(array[0]) : array[0];
    for (var i = 1; i < length; i++) {
        var item = iteratee ? iteratee(array[i]) : array[i];
        if (item !== first) {
            return false;
        }
    }

    return true;
};

/**
 * Return the type value for the given entity for use when building the tooltip
 * @param {Object} entity - data object for the entity being added to the tooltip
 * @returns {*}
 */
var getEntityType = function(entity) {
    return entity.type;
};

/**
 * Apply a 1D layout deconfliction algorithm to the given entities, then render them into the view.
 * Entities that can't be fully deconflicted by offsetting their position are grouped behind an entity badged with a '+'.
 * A tooltip is built for each icon; for grouped entities, the tooltip lists all the entities bundled into the group,
 * including type information when a single entity is present in the data more than once, but with multiple types.
 * @param {Array} entities - Array of entity objects to deconflict and render into the view
 */
FeatureContent.prototype.renderEntities = function(entities) {
    var $entities;
    var entitiesRenderMap = [];

    // get the number of pixels we will be working with, which is the height of the container - room for the entity at the bottom.
    var entityPercentageHeight = (this.entityHeight / this.$outlineEntityContainer.height());
    var thresholdPercentageHeight = (this.Settings.entityLayoutThreshold / this.$outlineEntityContainer.height());

    // Don't try to use fround when it doesn't exist (IE)
    if (Math.fround) {
        // fround it to avoid precision errors.
        entityPercentageHeight = Math.fround(entityPercentageHeight);
        thresholdPercentageHeight = Math.fround(thresholdPercentageHeight);
    }

    // order entities first by weight then by position (assume between 0-1)
    var orderedEntities = _.sortBy(entities || this.entities, function(entity) {
        return Number(entity.data.firstPosition) - entity.weight;
    });

    if (orderedEntities && orderedEntities.length > 0 && entityPercentageHeight > 0 &&
        (entityPercentageHeight !== this.entityPercentageHeight || !_.isEqual(this.entitiesShown, entities))) {
        this.entityPercentageHeight = entityPercentageHeight;
        this.entitiesShown = entities;

        // first pass: place the entities if possible
        orderedEntities.forEach(function(entity) {
            var primaryEntity = _.find(entitiesRenderMap, function(map) {
                return (map.position.originalFrom <= Number(entity.data.firstPosition) &&
                    map.position.originalTo >= Number(entity.data.firstPosition)) ||
                    (map.position.originalFrom <= (Number(entity.data.firstPosition) + entityPercentageHeight) &&
                    map.position.originalTo >= (Number(entity.data.firstPosition) + entityPercentageHeight));
            });
            var entityMap = {
                position: new EntityRenderMap(entity.data.firstPosition, entityPercentageHeight),
                entity: entity,
                hiddenEntities: [],
            };
            if (!primaryEntity) {
                entitiesRenderMap.push(entityMap);
            } else {
                primaryEntity.hiddenEntities.push(entityMap);
            }
        });

        // second pass : try to place remaining entities if there is enough space. This can only happen if the configured threshold is greater than the size of entity.
        // first make sure that all entities are ordered in ascending position sequence (weighting could have shifted everything around previously).
        entitiesRenderMap = _.sortBy(entitiesRenderMap, function(map) {
            return map.position.originalFrom;
        });

        if (thresholdPercentageHeight >= this.entityPercentageHeight) {
            var index;
            var length = entitiesRenderMap.length;
            var list = entitiesRenderMap.slice();
            entitiesRenderMap = [];

            for (index = 0; index < length; index++) {
                // check if there is enough space given the threshold
                var currentEntity = list[index];
                var entityToFit;
                var entityIndex;

                // only reposition if there are entities that can't be displayed
                if (currentEntity.hiddenEntities && currentEntity.hiddenEntities.length > 0) {
                    // if we already spread some entities around, account for them
                    var previous = list[index - 1];
                    var lastRepositioned = entitiesRenderMap[entitiesRenderMap.length - 1];
                    if (lastRepositioned && lastRepositioned.position.finalTo > previous.position.finalTo) {
                        previous = lastRepositioned;
                    }

                    var beforeSpace = Math.min(index > 0 ? currentEntity.position.originalFrom - previous.position.finalTo : currentEntity.position.originalFrom, thresholdPercentageHeight);
                    var afterSpace = Math.min(index < list.length - 1 ? list[index + 1].position.originalFrom - currentEntity.position.originalTo : 1 - currentEntity.position.originalTo, thresholdPercentageHeight);

                    // get available space, which is the available space before + the available space after + the space the entity takes up.
                    var availableSpace = beforeSpace
                        + afterSpace
                        + currentEntity.position.originalTo - currentEntity.position.originalFrom;

                    // number of entities to fit is the smaller number of the two: 1. original Entity + hidden entities or 2. however many is allowed in the given space.
                    var entitiesToFitCount = Math.min(Math.floor(availableSpace / entityPercentageHeight), currentEntity.hiddenEntities.length + 1);
                    // only reposition if there is enough room for more than 1 entity.
                    if (entitiesToFitCount > 1) {
                        var neededSpace = entitiesToFitCount * entityPercentageHeight;
                        // starting position should be the (available space FROM) + ((Available Space - Needed Space) / 2)
                        var availableSpaceFrom = currentEntity.position.originalFrom - beforeSpace;
                        var startingFrom = availableSpaceFrom + ((availableSpace - neededSpace) / 2);

                        // determine entity positioning (weight and priority don't get taken into account here as its just placement)
                        // move the repositioned entities from hiddenEntities to entitiesToFit
                        var entitiesToFit = _.sortBy([currentEntity].concat(currentEntity.hiddenEntities.splice(0, entitiesToFitCount - 1)),
                            function(m) {
                                return m.position.originalFrom;
                            });

                        // update new position
                        for (entityIndex = 0; entityIndex < entitiesToFit.length; entityIndex++) {
                            entityToFit = entitiesToFit[entityIndex];
                            entityToFit.position.finalFrom = startingFrom + (entityIndex * entityPercentageHeight);
                            entitiesRenderMap.push(entityToFit);
                        }
                    } else {
                        entitiesRenderMap.push(currentEntity);
                    }
                } else {
                    entitiesRenderMap.push(currentEntity);
                }
            }
        }

        $entities = entitiesRenderMap.map(function(map) {
            map.entity.setPosition(map.position.finalFrom * 100);
            if (map.hiddenEntities && map.hiddenEntities.length > 0) {
                if (map.hiddenEntities[0].entity.data.hasOwnProperty(consolidationField)) {
                    // For the Uncertainty feature,
                    // 1. consolidate adjacent entities of the same entity ID
                    var consolidatedEntities = _.sortBy([map].concat(map.hiddenEntities), function (iteratee) {
                        return iteratee.entity.data[consolidationField];
                    });
                    var consolidatedEntityCount = consolidatedEntities.length;
                    var types = [];
                    var uniqueEntities = [];
                    var i;
                    for (i = 0; i < consolidatedEntityCount; i++) {
                        if (i < 1 || consolidatedEntities[i].entity.data[consolidationField] !==
                            consolidatedEntities[i - 1].entity.data[consolidationField]) {
                            uniqueEntities.push(consolidatedEntities[i]);
                            if (types.length > 1) {
                                uniqueEntities[uniqueEntities.length - 2].types = _.sortBy(types, function (iteratee) {
                                    return iteratee.bucket ? iteratee.bucket.value : iteratee.firstPosition;
                                });
                            }
                            types = [consolidatedEntities[i].entity.data];
                        } else {
                            types.push(consolidatedEntities[i].entity.data);
                        }
                    }

                    uniqueEntities.sort(function (a, b) {
                        return a.position.originalFrom - b.position.originalFrom;
                    });

                    consolidatedEntityCount = uniqueEntities.length;

                    // 2. label the resulting entity with its types, in bucket order, e.g. Amazon [LOC, ORG], Samsung, ...
                    var tooltip = '';
                    for (i = 0; i < consolidatedEntityCount; i++) {
                        if (tooltip.length) {
                            tooltip += ', ';
                        }
                        tooltip += uniqueEntities[i].entity.data.name;

                        if (uniqueEntities[i].types && !identical(uniqueEntities[i].types, getEntityType)) {
                            tooltip += ' [' + uniqueEntities[i].types.reduce(function (a, b) {
                                var result = a;
                                if (a) {
                                    result += ', ';
                                }
                                result += b.type;
                                return result;
                            }, '') + ']';
                        }
                    }

                    map.entity.setAttributes({
                        'data-hidden-entities': consolidatedEntityCount,
                        'data-entities': tooltip,
                    });
                } else {
                    map.entity.setAttributes({
                        'data-hidden-entities': map.hiddenEntities.length,
                        'data-entities': [map].concat(map.hiddenEntities).sort(function(a, b) {
                            return a.position.originalFrom - b.position.originalFrom;
                        }).reduce(
                            function(memo, m) {
                                return (memo !== '' ? memo + ', ' : '') + m.entity.data.name;
                            }, ''),
                    });
                }
            } else {
                map.entity.setAttributes({
                    'data-hidden-entities': null,
                    'data-entities': map.entity.data.name,
                });
            }
            map.entity.highlight(map.entity.isHighlight, map.entity.color);
            return map.entity.$entity;
        });
        this.$outlineEntityContainer.html($entities);
    }
};

/**
 * Render the entities, highlighting any in the given collection.
 * @param {Object|Array=} highlights - Entity Object or Array of Entity Objects containing the entities to highlight
 */
FeatureContent.prototype.highlight = function(highlights) {
    var t = this;
    var highlightedEntities = highlights;
    if (!highlightedEntities) {
        t.renderEntities();
    } else {
        if (!(highlightedEntities instanceof Array)) {
            highlightedEntities = [highlightedEntities];
        }
        var resolvedEntities = _.map(t.entities, function(ent) {
            var entity = ent;
            var highlight = _.find(highlightedEntities,
                function(he) {
                    return he.type === entity.data.type && he.name === entity.data.name;
                });
            if (highlight) {
                entity = $.extend(true, {}, entity);
                entity.weight = 999;
                entity.isHighlight = true;
                entity.color = highlight.color;
            }
            return entity;
        });
        t.renderEntities(resolvedEntities);
    }
};

/**
 * Construct the OutlineEntity objects that map to icons in the view.
 * @param {Object} data - Object containing a reference to the entities to render in this view
 * @param {Array} iconmap - Array of icon info objects
 */
FeatureContent.prototype.constructEntities = function(data, iconmap) {
    var s = this;
    var entitysettings = s.Settings.entity;
    s.entities = data.entities.map(function(d) {
        return new Entity(s._parentId, s.contentType, d, iconmap, entitysettings);
    });
};

/**
 * Register a mouse click event handler.
 */
FeatureContent.prototype.registerEvents = function() {
    var t = this;
    Scrollable.asJQueryPlugin();

    t.$mainOutlineContent.on('click', '.' + t.classes.entity.outlineentity, t, function(event) {
        var entitydata = JSON.parse($(event.target).closest('[' + t.attrs.entity + ']').attr(t.attrs.entity));
        mediator.publish(t.events.outline.EntityClicked, {
            OutlineId: t._parentId,
            ContentType: t.contentType,
            EntityData: entitydata,
        });
        event.stopPropagation();
    });
};

/**
 * Hide the view using a transition animation.
 * @returns {*}
 */
FeatureContent.prototype.hide = function() {
    var s = this;
    s.$outlineEntityContainer.hide();
    return s.$mainOutlineContent.velocity({'width': 0}, {display: 'none'}).promise();
};

/**
 * Minimize the view using a transition animation.
 * @returns {*}
 */
FeatureContent.prototype.minimize = function() {
    var s = this;
    return s.$mainOutlineContent.velocity({'width': s.Settings.minimizedWidth}).promise()
        .then(function() {
            s.$outlineEntityContainer.show();
        });
};

/**
 * Enable scrolling the feature content view
 * @param {Element} viewportSelector - HTML Element to enable scrolling on
 */
FeatureContent.prototype.enableScroll = function(viewportSelector) {
    var s = this;
    var $viewPort = $(viewportSelector);

    var bottomSpace = s.$mainOutlineContent.height()
        - s.$outlineEntityContainer.height();

    var sliderRatio = $viewPort.height() / $viewPort.children().outerHeight(true);
    s.$slider = $(s.templates.maincontent.sliderTemplate)
        .addClass(s.classes.maincontent.slider)
        .css('height', 'calc(' + (100 * sliderRatio) + '% + ' + bottomSpace + 'px)')
        .appendTo(s.$outlineEntityContainer);
    s.$outlineEntityContainer.scrollable({
        sliderSelector: '.' + s.classes.maincontent.slider,
        viewportSelector: viewportSelector,
    });
    $(window).resize(function() {
        sliderRatio = $viewPort.height() / $viewPort.children().outerHeight(true);
        s.$slider.css('height', 'calc(' + (100 * sliderRatio) + '% + ' + bottomSpace + 'px)');
    });
};

/**
 * Get the height of the container element for the view.
 * @returns {*}
 */
FeatureContent.prototype.getEntityContainerHeight = function() {
    var s = this;
    return s.$outlineEntityContainer.height();
};

module.exports = FeatureContent;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./strippets.base":2,"./strippets.config.js":3,"./strippets.entity.js":4,"./strippets.entity.rendermap":5,"@uncharted/strippets.common":11}],8:[function(require,module,exports){
(function (global){
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

var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);
var Promise = require('bluebird');

var Base = require('./strippets.base');
var mediator = require('@uncharted/strippets.common').mediator;
var util = require('@uncharted/strippets.common').util;
var Feature = require('./strippets.outline.feature.js');
var Sidebar = require('./strippets.outline.sidebar.js');
var Reader = require('./strippets.outline.reader.js');
var config = require('./strippets.config.js');

var $tooltip = $('<div class="entity-tooltip"></div>');

/**
 * Constructor for an Outline
 * @param {JQuery} $parent - JQuery-wrapped element to which the feature content view will be appended
 * @param {Object} data - Object containing a reference to the entities to render in this view
 * @param {Array} iconMaps - Array of icon info objects
 * @param {Object} options - Configuration settings for the outline
 * @param {String=} initialState - 'hidden', 'minimal', or 'readingmode'; defaults to 'minimal'
 * @param {Object|Array=} initialHighlights - Entity Object or Array of Entity Objects containing the entities to highlight
 * @returns {Outline}
 * @constructor
 */
function Outline($parent, data, iconMaps, options, initialState, initialHighlights) {
    var t = this;
    t.defaults = config.outline;
    t.data = data;
    // use rank for ID for the time being
    // t.Id = t.data.rank;
    t.feature = null;
    t.sidebar = null;
    t.stateIndex = -1;
    t.toStateIndex = -1;
    /* eslint no-warning-comments: 0 */
    // TODO: iconMaps doesn't need to be stored with the object. it can be jettisoned after use to save mem.
    t.iconMap = iconMaps;
    t.layoutValues = {};
    t.changeStateTo = [];
    t.readerData = null;
    t.readerText = null;
    t.highlights = undefined;
    t.init($parent, options, initialState, initialHighlights);
    return t;
}

Outline.prototype = Object.create(Base.prototype);
Outline.prototype.constructor = Outline;

/**
 * Valid states for an Outline view are 'hidden': not visible; 'minimal': just a vertical strip of entity icons; and
 * 'readingmode': the inline reader view with a strip of entity icons on the right
 * @type {string[]}
 * @private
 */
Outline._states = [
    'hidden',
    'minimal',
    'readingmode',
];

/**
 * Determine if the given outline data should be displayed, given a filter
 * @param {Object} outlineData - article being outlined
 * @param {*} filter - Value, boolean, Array, or function to apply as a filter on the current set of items
 * @returns {Boolean} true if the outline corresponding to the given data should be displayed;
 * otherwise, the outline should be hidden
 */
Outline.shouldShow = function(outlineData, filter) {
    var shouldShow = undefined;
    var filterAsArrayFunc = function(id, values) {
        return _.some(values, function(v) {
            return v === id;
        });
    };
    var filterAsValueFunc = function(id, value) {
        return id === value;
    };

    if (!filter) {
        shouldShow = true;
    } else if (filter instanceof Array) {
        shouldShow = filterAsArrayFunc(outlineData.id, filter);
    } else if (typeof filter !== 'function') {
        shouldShow = filterAsValueFunc(outlineData.id, filter);
    } else {
        shouldShow = filter(outlineData);
    }
    return shouldShow;
};

/**
 * Initialize an Outline
 * @param {JQuery} $parent - JQuery-wrapped element to which the feature content view will be appended
 * @param {Object} options - Configuration settings for the outline
 * @param {String=} initialState - 'hidden', 'minimal', or 'readingmode'; defaults to 'minimal'
 * @param {Object|Array=} initialHighlights - Entity Object or Array of Entity Objects containing the entities to highlight
 */
Outline.prototype.init = function($parent, options, initialState, initialHighlights) {
    var t = this;
    t.Settings = $.extend({}, t.defaults, options);
    t._id = t.generateId();

    t.constructLayout($parent);
    t.initializeReader();
    t.initializeMainContent();
    t.initializeSidebar();
    t.registerEvents();
    t.registerStateMachine();

    var state = _.some(Outline._states, function(s) {
        return s === initialState;
    }) ? initialState : 'minimal';
    // Set Initial State
    t._currentOutlinePosition = t.Settings.centerOutlinePosition;
    t.toStateIndex = Outline._states.indexOf('hidden');
    t.stateIndex = Outline._states.indexOf('hidden');
    t.transitionPromise = Promise.resolve();
    t.readingModeEnabled = t.Settings.reader.enabled;
    if (initialHighlights) {
        t.highlights = (initialHighlights instanceof Array) ? initialHighlights : [initialHighlights];
    }

    if (state !== 'hidden') {
        t.transitionState(state).then(function() {
            if (t.highlights) {
                t.feature.highlight(t.highlights);
            }
        });
    }
};

/**
 * Generate a random ID
 * @returns {string} A random ID
 */
Outline.prototype.generateId = function() {
    return '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Get the current view state.
 * @returns {string|*}
 */
Outline.prototype.getCurrentState = function() {
    return Outline._states[this.stateIndex];
};

/**
 * Get the state the view is transitioning to
 * @returns {string|*}
 */
Outline.prototype.getToState = function() {
    return Outline._states[this.toStateIndex];
};

/**
 * Construct the Outline's elements and append them to the given parent.
 * @param {JQuery} $parent - JQuery-wrapped element to which the feature content view will be appended
 */
Outline.prototype.constructLayout = function($parent) {
    /* create the container */
    this.$outlineContainer = $(this.templates.outline.outlineContainerTemplate)
        .addClass(this.classes.outline.outlinecontainer)
        .addClass(this.classes.outline.minimizedmode)
        .appendTo($parent);

    /* create the outline */
    this.$outline = $(this.templates.outline.outlineItemTemplate)
        .addClass(this.classes.outline.outline)
        .css({'border-left-width': '0', 'border-right-width': '0'})
        .appendTo(this.$outlineContainer);

    /* create the header */
    this.$outlineHeader = $(this.templates.outline.outlineHeaderTemplate)
        .appendTo(this.$outline);

    /* create the source icon */
    this.$outlineSourceIcon = $(this.templates.outline.outlineSourceIconTemplate)
        .addClass(this.classes.outline.sourceIcon)
        .appendTo(this.$outlineHeader);

    if (this.data.sourceimage) {
        this.$outlineSourceIcon.css('background-image', "url('" + this.data.sourceimage + "')");
    } else if (this.data.sourceiconname || this.data.source) {
        var size = this.$outlineSourceIcon.height();
        var sourceName = (this.data.sourceiconname || this.data.source);
        this.$outlineSourceIcon.css('background-image', "url('" + util.createFallbackIconURL(size, size, sourceName) + "')");
    }

    /* create the source link */
    var outlineSourceTemplate = _.template(this.templates.outline.outlineSourceTemplate);
    /* eslint-disable camelcase */
    this.$outlineSource = $(outlineSourceTemplate({src_url: this.data.sourceUrl, src_title: this.data.source}))
    /* eslint-enable camelcase */
        .addClass(this.classes.outline.sourceText)
        .appendTo(this.$outlineSourceIcon);
};

/**
 * Initialize the inline reader
 */
Outline.prototype.initializeReader = function() {
    var s = this;
    var settings = s.Settings.reader;
    s.reader = new Reader(s._id, s.$outline, settings);
};

/**
 * Initialize the FeatureContent entity icon view
 */
Outline.prototype.initializeMainContent = function() {
    var s = this;
    var settings = s.Settings.maincontent;
    settings.entity = s.Settings.entity;
    s.feature = new Feature(s._id, s.$outline, s.data, s.iconMap, settings);
};

/**
 * Initialize the sidebars, if any are configured
 */
Outline.prototype.initializeSidebar = function() {
    var s = this;
    if (s.data.sidebars && s.data.sidebars.length > 0) {
        var settings = s.Settings.sidebar;
        settings.entity = s.Settings.entity;
        settings.events = s.events.outline;
        settings.headerSpace = 0;
        s.sidebar = new Sidebar(s._id, s.$outline, s.data.sidebars, s.iconMap, settings);
    }
};

/**
 * Register mouse and mediator event handlers.
 */
Outline.prototype.registerEvents = function() {
    var s = this;

    mediator.subscribe(s.events.outline.EntityClicked, s.handleEntityClicked.bind(s), {
        predicate: function(data) {
            return data.OutlineId === s._id && data.ContentType === 'Feature';
        },
    });

    s.$outline.on('click', s, function(event) {
        var outlineContext = event.data;
        if ($(event.target).hasClass(s.classes.reader.closeButton)) {
            $(event.target).css('visibility', 'hidden');
            mediator.publish(outlineContext.events.outline.Minimize, outlineContext._id);
            return outlineContext.transitionState('minimal');
        }

        if (s.Settings.onClicked) {
            s.Settings.onClicked(s.data);
        }

        if (outlineContext.getCurrentState() === 'hidden') {
            return undefined;
        } else if (outlineContext.getCurrentState() === 'expanded') {
            return outlineContext.transitionState('readingmode');
        } else if (outlineContext.getCurrentState() === 'readingmode') {
            // do nothing.
            return undefined;
        }

        outlineContext.transitionState('readingmode');
        if (!event.shiftKey) {
            mediator.publish(outlineContext.events.outline.Minimize, outlineContext._id);
        }
    });

    mediator.subscribe(s.events.outline.Reset,
        function() {
            s.resetState();
        },
        {
            predicate: function(data) {
                return !data || data.sourceOutlineId !== s._id;
            },
        });

    mediator.subscribe(s.events.outline.Highlight,
        function(entities) {
            s.highlights = entities;
            s.feature.highlight(entities);
        }, {
            predicate: function() {
                return s.toStateIndex > Outline._states.indexOf('hidden');
            },
        }, s);

    mediator.subscribe(s.events.outline.Minimize,
        function() {
            s.transitionState('minimal');
        },
        {
            predicate: function(OutlineId) {
                if (OutlineId !== s._id) {
                    return s.toStateIndex > Outline._states.indexOf('minimal');
                }
            },
        }, s);

    mediator.subscribe(s.events.outline.EnableSidebar,
        function(isEnabled) {
            if (s.Settings.sidebarEnabled !== isEnabled) {
                s.Settings.sidebarEnabled = isEnabled;

                if (s.sidebar && s.getCurrentState() !== 'hidden') {
                    s.sidebar.toggle(isEnabled);
                }
            }
        }, {
            predicate: function() {
                return s.sidebar;
            },
        });
    mediator.subscribe(s.events.outline.RedrawEntity,
        function() {
            if (s.feature) {
                // Highlight function calls renderEntities with the appropriate highlights.
                if (s.highlights) {
                    s.feature.highlight(s.highlights);
                } else {
                    s.feature.renderEntities();
                }
            }
            if (s.sidebar) {
                s.sidebar.renderEntities();
            }
        }, {
            predicate: function() {
                return s.feature || s.sidebar;
            },
        });

    // Register a delegated event for the entities' position-aware tooltips
    var entityClass = '.' + s.classes.entity.outlineentity;
    s.$outline.on('mouseenter', entityClass, function(event) {
        var $entity = $(this); // eslint-disable-line
        var tooltip = $entity.attr('data-entities');
        if (tooltip) {
            $tooltip.html(tooltip);
            $entity.append($tooltip);

            var $viewport = $('.viewport');
            var scale = util.getParentScale($viewport);
            var containerWidth = scale * $viewport.width();
            var tooltipWidth = $tooltip.width();
            var isRight = event.clientX + tooltipWidth + $entity.width() > containerWidth;
            $tooltip.toggleClass('tooltip-left', !isRight);
            $tooltip.toggleClass('tooltip-right', isRight);
            $tooltip.css('max-width', containerWidth - tooltipWidth);
        }
    }).on('mouseleave', entityClass, function() {
        $tooltip.toggleClass('tooltip-left tooltip-right', false);
    });
};

/**
 * Handle the entity clicked event emitted by the mediator.
 * @param {Object} data - Object containing entity data
 */
Outline.prototype.handleEntityClicked = function(data) {
    var t = this;

    if (t.Settings.onClicked) {
        t.Settings.onClicked(t.data);
    }

    /* sort if enabled */
    if (t.getCurrentState() === 'minimal') {
        mediator.publish(t.events.outline.Minimize, t._id);
        t.transitionState('readingmode');
    } else if (t.getCurrentState() === 'readingmode' && t.readerText) { /* if the outline is open and loaded, highlight the entity instances */
        var instanceKey = data.EntityData.name.replace(/\s+/g, '_');
        t.scrollToFirstInstanceOfEntity(instanceKey);
    }
};

/**
 * Scroll the reader view to the first instance of the entity matching the given key
 * @param {String} instanceKey - The entity name with spaces replaced by '_'
 */
Outline.prototype.scrollToFirstInstanceOfEntity = function(instanceKey) {
    var t = this;
    var element = t.readerText.find('#' + instanceKey.replace(/\./g, '\\.') + '_0');
    if (element.length) {
        var scrollOffset = t.reader.$readerContent.scrollTop() + element.offset().top - t.reader.$readerContent.offset().top;
        t.reader.$readerContent.animate({
            scrollTop: scrollOffset + 'px',
        }, 'fast');
    }
};

/**
 * Hide the Feature Content view and any sidebars
 * @returns {!Promise.<!Array>|*}
 */
Outline.prototype.hideOutlineItem = function() {
    var s = this;
    var hidePromises = [
        s.feature.hide(),
    ];
    if (s.sidebar) hidePromises.push(s.sidebar.hide());
    return Promise.all(hidePromises);
};

/**
 * Transition the Feature Content view and any sidebars to their minimized state
 * @returns {*|!Promise.<RESULT>}
 */
Outline.prototype.minimizeOutlineItem = function() {
    var s = this;
    var minimizePromises = [
        s.feature.minimize(),
    ];

    if (s.sidebar && s.Settings.sidebarEnabled) minimizePromises.push(s.sidebar.minimize());
    return Promise.all(minimizePromises).then(function() {
        // Highlight function calls renderEntities with the appropriate highlights.
        if (s.highlights) {
            s.feature.highlight(s.highlights);
        } else {
            s.feature.renderEntities();
        }
    });
};

/**
 * Transition the state to 'minimal'.
 * @returns {!Promise.<!Array>|*}
 */
Outline.prototype.resetState = function() {
    var t = this;
    var hidden = t.getToState() === 'hidden';
    var promises = [];
    if (hidden) {
        promises.push(t.transitionState('minimal'));
    }
    return Promise.all(promises);
};

/**
 * Transition the state to 'readingmode'
 * @returns {!Promise.<!Array>|*}
 */
Outline.prototype.openReadingMode = function() {
    var s = this;
    var promises = [];
    promises.push(s.reader.open().then(function() {
        if (!s.readerData) {
            return s.loadReadingModeContent();
        }
    }));
    if (s.styles.outlineItem.reading) {
        promises.push(s.$outline.velocity({
            'margin-right': s.styles.outlineItem.reading.getPropertyValue('margin-right'),
            'margin-left': s.styles.outlineItem.reading.getPropertyValue('margin-left'),
        }));
    }
    promises.push(
        mediator.publish(s.events.outline.CenterElement, {
            $element: s.$outlineContainer,
            expectedWidth: s.getTransitionSizes('readingmode').anticipated.width,
            id: s._id,
        })
    );
    return Promise.all(promises);
};

/**
 * Load the reader view's content
 * @returns {*}
 */
Outline.prototype.loadReadingModeContent = function() {
    var s = this;
    return s.reader.load(s.data.readerUrl, s.feature.entities)
        .then(function(data) {
            s.readerData = data;
            if (s.reader.$readerContent) {
                s.readerText = s.reader.$readerContent.find('div.content');
            }
        });
};

/**
 * Close the reader
 * @returns {!Promise.<!Array>|*}
 */
Outline.prototype.closeReadingMode = function() {
    var s = this;
    var promises = [];
    if (s.styles.outlineItem.normal) {
        promises.push(s.$outline.velocity({
            'margin-right': s.styles.outlineItem.normal.getPropertyValue('margin-right'),
            'margin-left': s.styles.outlineItem.normal.getPropertyValue('margin-left'),
        }));
    }
    promises.push(s.reader.hide());
    return Promise.all(promises);
};

/**
 * Apply the appropriate CSS for the given state
 * @param {String} state - 'hidden', 'minimal', or 'readingmode'
 */
Outline.prototype.toggleClassesForState = function(state) {
    var s = this;
    s.$outlineContainer.toggleClass(s.classes.outline.hiddenmode, state === 'hidden');
    s.$outlineContainer.toggleClass(s.classes.outline.minimizedmode, state === 'minimal');
    s.$outlineContainer.toggleClass(s.classes.outline.readmode, state === 'readingmode');
};

/**
 * Register the state machine, which specifies the transition sequences
 */
Outline.prototype.registerStateMachine = function() {
    var s = this;
    s.changeStateTo = [];

    var setCurrentState = function(state) {
        return function() {
            s.stateIndex = Outline._states.indexOf(state);
            s.toggleClassesForState(state);
        };
    };
    s.changeStateTo[0] = function toHidden() {
        return s.hideOutlineItem().then(setCurrentState('hidden'));
    };
    s.changeStateTo[1] = function toMinimal() {
        if (s.getCurrentState() === 'readingmode') {
            return s.closeReadingMode().then(setCurrentState('minimal'));
        }
        return s.minimizeOutlineItem().then(setCurrentState('minimal'));
    };
    s.changeStateTo[2] = function toReadingmode() {
        if (s.readingModeEnabled) {
            return s.openReadingMode().then(setCurrentState('readingmode'));
        }
    };
};

/**
 * Use the state machine to transition between the given states
 * @param {Number} fromStateIndex - index of the current state
 * @param {Number} toStateIndex - index of the target state
 * @returns {*} Promise
 */
Outline.prototype.changeStatesSequentially = function(fromStateIndex, toStateIndex) {
    var s = this;
    var stateChangers = [];
    // eg. 0 -> 3, 1 -> 2
    if (fromStateIndex < toStateIndex) {
        stateChangers = s.changeStateTo.slice(fromStateIndex + 1, toStateIndex + 1);
        // eg. 3 -> 0, 2 -> 1
    } else if (fromStateIndex > toStateIndex) {
        stateChangers = s.changeStateTo.slice(toStateIndex, fromStateIndex).reverse();
    }
    return stateChangers.reduce(function(cur, next) {
        return cur.then(next);
    }, Promise.resolve());
};

/**
 * Transition from the current state to the given state
 * @param {String} transitionTo - 'hidden', 'minimal', or 'readingmode'
 * @returns {*} Promise
 */
Outline.prototype.transitionState = function(transitionTo) {
    var s = this;
    s.toStateIndex = Outline._states.indexOf(transitionTo);
    s.transitionPromise = s.transitionPromise.then(function() {
        return s.changeStatesSequentially(s.stateIndex, s.toStateIndex);
    });
    return s.transitionPromise;
};

/**
 * Determine if the outline is currently in a state transition
 * @returns {boolean} true if the state is in flux
 */
Outline.prototype.isInTransition = function() {
    return this.stateIndex !== this.toStateIndex;
};

/**
 * Get the expected height and width of the outline after reaching the given state, or the current target state.
 * @param {String=} transitionToState - Optional Parameter transition to State.
 * If not specified, then we will use the current To State.
 * @returns {{current: {height: *, width: *}, anticipated: {height: *, width: *}}}
 */
Outline.prototype.getTransitionSizes = function(transitionToState) {
    var s = this;

    var currentOutlineSizes = {
        height: this.$outline.height(), width: this.$outline.width(),
    };
    var transitionCompleteSize = {height: currentOutlineSizes.height, width: currentOutlineSizes.width};

    if (transitionToState || s.isInTransition()) {
        var toState = transitionToState || s.getToState();
        if (toState === 'readingmode') {
            transitionCompleteSize = {
                height: s.$outline.height(),
                width: s.Settings.reader.readerWidth
                + s.Settings.maincontent.minimizedWidth
                + ((s.Settings.sidebarEnabled && s.sidebar) ? s.Settings.sidebar.minimizedWidth : 0),
            };
        } else { // minimized
            transitionCompleteSize = {
                height: s.$outline.height(),
                width: s.Settings.maincontent.minimizedWidth
                + ((s.Settings.sidebarEnabled && s.sidebar) ? s.Settings.sidebar.minimizedWidth : 0),
            };
        }
    }
    return {current: currentOutlineSizes, anticipated: transitionCompleteSize};
};

module.exports = Outline;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./strippets.base":2,"./strippets.config.js":3,"./strippets.outline.feature.js":7,"./strippets.outline.reader.js":9,"./strippets.outline.sidebar.js":10,"@uncharted/strippets.common":11,"bluebird":18}],9:[function(require,module,exports){
(function (global){
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

var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);
var Promise = require('bluebird');
var Base = require('./strippets.base');
var config = require('./strippets.config.js');

/**
 * Construct and initialize the inline content reader
 * @param {String} parentId - Generated ID of the parent Outline
 * @param {JQuery} $parent - JQuery-wrapped element of the parent Outline
 * @param {Object} settings - Reader-specific configuration options
 * @returns {Reader}
 * @constructor
 */
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

/**
 * Initialize the inline reader
 * @param {JQuery} $parent - JQuery-wrapped element of the parent Outline
 * @param {Object} settings - Reader-specific configuration options
 */
Reader.prototype.init = function($parent, settings) {
    this.Settings = $.extend({}, this.defaults, settings);
    this.compiledReaderContentTemplate = _.template(this.templates.reader.readerContentTemplate);
    this.compiledReaderContentErrorTemplate = _.template(this.templates.reader.readerContentErrorTemplate);
    this.construct($parent);
    this.registerEvents();
    this.activeLoadingQueue = null; // a promise chain we can abort
};

/**
 * Self-cleaning Promise chain pattern
 * Used to avoid promise leaks; for example, when a reader is closed with a load pending.
 * @returns {{queue: Array, enqueue: Function, dequeue: Function, cancel: Function}}
 */
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

/**
 * Construct the JQuery-wrapped reading pane element and append it to the given parent element.
 * @param {JQuery} $parent - JQuery-wrapped element of the parent Outline
 */
Reader.prototype.construct = function($parent) {
    this.$readingPane = $(this.templates.reader.readerTemplate)
        .width('0')
        .appendTo($parent);
};

/**
 * Register a mouse click handler for opening links
 */
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

/**
 * Open the reader view
 * @returns {*} Promise
 */
Reader.prototype.open = function() {
    var s = this;
    var options = {duration: s.Settings.disableAnimation ? 0 : undefined};
    return s.$readingPane.velocity({width: s.Settings.readerWidth}, options).promise();
};

/**
 * Load the reader view's content from the given URL
 * @param {String} uri - URL to load content from
 * @returns {*} Promise
 */
Reader.prototype.load = function(uri) {
    var s = this;
    var render = function(compiledTemplate, data) {
        return new Promise(function(resolve) {
            s.$readerContent = $(compiledTemplate({data: data}))
                .addClass(s.classes.reader.readerContent)
                .width(s.Settings.readerWidth)
                .height(s.Settings.readerHeight);
            s.$readingPane.html(s.$readerContent);

            var $closeButton = s.$readerContent.find('.' + Base.prototype.classes.reader.closeButton);
            var left = s.$readerContent.prop('clientWidth') - $closeButton.width() -
                parseInt($closeButton.css('margin-right'), 10);
            // fix close button covered by scrollbar in Edge
            if (s.$readerContent.css('-ms-overflow-style') === '-ms-autohiding-scrollbar') {
                left -= s.Settings.scrollBarWidth;
            }
            $closeButton.css('left', left);

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

/**
 * Release the reader content
 */
Reader.prototype.destroy = function() {
    this.$readingPane.html('');
};

/**
 * Get the reader's height in pixels
 * @returns {number} Reader Height, in px
 */
Reader.prototype.getReaderHeight = function() {
    return this.$readingPane.height() - 20;
};

/**
 * Hide the reader, using a transition animation, and abort any pending asynchronous load operation
 * @returns {*}
 */
Reader.prototype.hide = function() {
    var s = this;
    var options = {duration: s.Settings.disableAnimation ? 0 : undefined, display: 'none'};

    if (s.activeLoadingQueue) {
        // abort any pending load operations
        s.activeLoadingQueue.cancel();
        s.activeLoadingQueue = null;
    }

    s.$readingPane.find('.' + s.classes.reader.closeButton).css('visibility', 'hidden');
    return s.$readingPane.velocity({width: 0, 'border-width': 0}, options).promise()
        .then(function() {
            if (s.Settings.onReaderClosed && typeof s.Settings.onReaderClosed === 'function') {
                return s.Settings.onReaderClosed(s.readerContext.loadedUri);
            }
        });
};

/**
 * Get the CSS selector that refers to the reader's content
 * @returns {string} CSS selector, such as '._rc'
 */
Reader.prototype.getReaderContentSelector = function() {
    return '.' + this.classes.reader.readerContent;
};

module.exports = Reader;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./strippets.base":2,"./strippets.config.js":3,"bluebird":18}],10:[function(require,module,exports){
(function (global){
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
/* global $,_ */

var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
var Base = require('./strippets.base');
var config = require('./strippets.config.js');
var Entity = require('./strippets.entity.js');

/**
 * Construct and initialize a sidebar.
 * A sidebar is a secondary vertical strip of entity icons meant for grouping or subselections.
 * Deprecated.
 * @param {String} parentId - Generated ID of the parent Outline
 * @param {JQuery} $parent - JQuery-wrapped element of the parent Outline
 * @param {Array} sidebardata - Array of entity objects to render in this sidebar
 * @param {Array} iconmap - Array of icon info objects
 * @param {Object} settings - Sidebar-specific configuration options
 * @returns {Sidebar}
 * @constructor
 */
var Sidebar = function Sidebar(parentId, $parent, sidebardata, iconmap, settings) {
    var t = this;
    t.defaults = config.outline.sidebar;

    t._parentId = parentId;
    t.entities = [];
    t.contentType = 'Sidebar';
    t.entityHeight = this.styles.entity.normal ? parseFloat(this.styles.entity.normal.getPropertyValue('height')) : settings.entityHeight;
    t.init($parent, sidebardata, iconmap, settings);
    return t;
};

Sidebar.prototype = Object.create(Base.prototype);
Sidebar.prototype.constructor = Sidebar;

/**
 * Initialize a sidebar
 * @param {JQuery} $parent - JQuery-wrapped element of the parent Outline
 * @param {Array} data - Array of entity objects to render in this sidebar
 * @param {Array} iconmap - Array of icon info objects
 * @param {Object} settings - Sidebar-specific configuration options
 */
Sidebar.prototype.init = function($parent, data, iconmap, settings) {
    this.Settings = $.extend({}, this.defaults, settings);

    this.constructLayout($parent);
    this.constructEntities(data, iconmap);
    this.renderEntities();
};

/**
 * Construct the HTML elements that will contain the entity icons
 * @param {JQuery} $parent - JQuery-wrapped element of the parent Outline
 */
Sidebar.prototype.constructLayout = function($parent) {
    var s = this;
    s.$sidebarContent = $(s.templates.sidebar.sidebarTemplate)
        .addClass(s.classes.sidebar.sidebarContainer)
        .data(s.attrs.minimizedWidth, s.Settings.minimizedWidth);

    s.$sidebarEntityContainer = $(s.templates.sidebar.entityContainerTemplate)
        .addClass(s.classes.sidebar.sidebarentitycontainer)
        .appendTo(s.$sidebarContent);
    s.hide();
    s.$sidebarContent.appendTo($parent);
};

/**
 * Render the entity icons into the sidebar.
 * Note that, unlike FeatureContent entities, sidebar entities are neither deconflicted nor grouped
 */
Sidebar.prototype.renderEntities = function() {
    var $entities;
    var factor;
    var visibleEntities = {};
    var numEntitySlots = Math.floor(this.$sidebarEntityContainer.height() / this.entityHeight);
    if (numEntitySlots === this.numEntitySlots) {
        return;
    }
    this.numEntitySlots = numEntitySlots;
    visibleEntities = {};
    factor = 100 / this.numEntitySlots;
    this.entities.forEach(function(entity) {
        // round entityPosition to nearest multiple of the factor
        var entityPosition = String(Math.round(entity.data.firstPosition * 100 / factor) * factor);
        var visibleEntity = visibleEntities[entityPosition];
        if (!visibleEntity || entity.weight > visibleEntity.weight) {
            visibleEntities[entityPosition] = entity;
        }
    });
    $entities = Object.keys(visibleEntities).map(function(position) {
        var entity = visibleEntities[position];
        entity.setPosition(position);
        return entity.$entity;
    });
    this.$sidebarEntityContainer.html($entities);
};

/**
 * Generate OutlineEntity objects for each row in the given data, applying the appropriate icon from the given icon map
 * @param {Array} data - Array of entity objects to render in this sidebar
 * @param {Array} iconmap - Array of icon info objects
 */
Sidebar.prototype.constructEntities = function(data, iconmap) {
    var s = this;
    var entitysettings = s.Settings.entity;
    s.entities = data.map(function(d) {
        return new Entity(s._parentId, s.contentType, d, iconmap, entitysettings);
    });
};

/**
 * Hide the sidebar using a transition animation
 * @returns {*}
 */
Sidebar.prototype.hide = function() {
    var s = this;
    s.$sidebarEntityContainer.hide();
    return s.$sidebarContent.velocity({'width': 0}, {display: 'none'}).promise();
};

/**
 * Transition the sidebar into its minimized view
 * @returns {*}
 */
Sidebar.prototype.minimize = function() {
    var s = this;
    return s.$sidebarContent.velocity({'width': s.Settings.minimizedWidth}).promise()
        .then(function() {
            s.$sidebarEntityContainer.show();
        });
};

/**
 * Transition the sidebar to either its minimized or hidden view state
 * @param {Boolean=} enablestate - if true, transition to the minimized state; otherwise, hide the sidebar
 * @returns {*}
 */
Sidebar.prototype.toggle = function(enablestate) {
    if (enablestate) {
        return this.minimize();
    }
    return this.hide();
};

module.exports = Sidebar;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./strippets.base":2,"./strippets.config.js":3,"./strippets.entity.js":4}],11:[function(require,module,exports){
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

module.exports.mediator = require('./uncharted.mediator');
module.exports.mousehold = require('./uncharted.mousehold');
module.exports.scrollable = require('./uncharted.scrollable');
module.exports.InfiniteScroll = require('./uncharted.infiniteScroll');
module.exports.Keyboard = require('./uncharted.keyboard');
module.exports.util = require('./uncharted.util');

},{"./uncharted.infiniteScroll":12,"./uncharted.keyboard":13,"./uncharted.mediator":14,"./uncharted.mousehold":15,"./uncharted.scrollable":16,"./uncharted.util":17}],12:[function(require,module,exports){
(function (global){
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

var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);

function InfiniteScroll(element, scrollableViewport) {
    this._$viewport = $(scrollableViewport);
    this._$element = $(element);
    this._isLoading = false;
    this._disabled = false;
    this._timeoutDelay = 50;
}

InfiniteScroll.prototype.onInfinite = function (callback) {
    var t = this;
    var timeoutId;
    var $viewport = t._$viewport;
    var element = t._$element[0];
    $viewport.on('scroll', function () {
        timeoutId = setTimeout(function () {
            clearTimeout(timeoutId);
            if (!t._disabled && !t._isLoading && t.isElementInViewport(element, $viewport[0])) {
                t._isLoading = true;
                callback(); // eslint-disable-line
            }
        }, t._timeoutDelay);
    });
};

InfiniteScroll.prototype.infiniteScrollDone = function () {
    this._isLoading = false;
};

InfiniteScroll.prototype.disable = function () {
    this._disabled = true;
};

InfiniteScroll.prototype.enable = function () {
    this._disabled = false;
};

InfiniteScroll.prototype.isElementInViewport = function (el, vp) {
    var vpRect = vp.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    return (
        elRect.top >= vpRect.top &&
        elRect.left >= vpRect.left &&
        elRect.bottom <= vpRect.bottom &&
        elRect.right <= vpRect.right
    );
};

module.exports = InfiniteScroll;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
(function (global){
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

var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);

var UnchartedKeyboard = function UnchartedKeyboard(elem, options) {
    var opt = options || {};
    var delay = opt.repeatDelay || 100;
    var keysdown;
    var timerId;
    this.isHolding = function (key) {
        return keysdown[key];
    };
    this.bindKeydown = function (handler) {
        if (!keysdown) {
            keysdown = {};
        }
        $(elem).keydown(function(e) {
            if (!timerId) {
                keysdown[e.which] = true;
                timerId = setTimeout(function () {
                    handler(e.which);
                    timerId = undefined;
                }, delay);
            }
        });
        $(elem).keyup(function(e) {
            delete keysdown[e.which];
        });
    };
};

module.exports = UnchartedKeyboard;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],14:[function(require,module,exports){
(function (global){
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

var mediator = require('mediator-js');
var _mediatorInstance = null;

var UnchartedMediator = /* istanbul ignore next:Wrapper function */ function UnchartedMediator(m) {
    var t = this;
    var _mediator;
    var init = function (Mediator) {
        // make library available globally
        _mediator = new Mediator();
    };
    t.publish = function () {
        return _mediator.publish.apply(_mediator, arguments);
    };
    // options include: predicate: function(args), priority: [0|1|..], calls: [1,2..]
    t.subscribe = function (channel, callback, options, context) {
        return _mediator.subscribe(channel, callback, options, context);
    };
    t.remove = function (channel, cb) {
        return _mediator.remove(channel, cb);
    };
    init(m);
    return t;
};

module.exports = /* istanbul ignore next */ (function () {
    if (!_mediatorInstance) {
        // NOTE: In Webpack (AMD), the Mediator constructor is on the top-level of the require
        _mediatorInstance = new UnchartedMediator(mediator.Mediator || mediator);
    }
    return _mediatorInstance;
}());

module.exports.registerGlobal = /* istanbul ignore next */ function () {
    if (!global._uncharted) global._uncharted = {};
    global._uncharted.Mediator = module.exports;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"mediator-js":20}],15:[function(require,module,exports){
(function (global){
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

var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);

var MouseHold = function MouseHold($element) {
    var t = this;
    t.$e = $element;
    t._resolution = 5;
    t._isMouseDown = false;
    t._intervalId = null;
    t._whileMouseDown = null;
    t._duration = null;

    var bind = function (whileMouseDown) {
        if (typeof whileMouseDown !== 'function') throw new Error('whileMouseDown must a function');
        t._whileMouseDown = whileMouseDown;
        t.$e.on('mousedown', function () {
            if (!t._isMouseDown) {
                t._isMouseDown = true;
                t._duration = 0;
                t._intervalId = setInterval(function () {
                    t._duration += t._resolution;
                    if (t._isMouseDown) {
                        t._whileMouseDown(t._duration);
                    } else {
                        clearInterval(t._intervalId);
                    }
                }, t._resolution);
            }
        });
        t.$e.on('mouseup mouseoff', function () {
            t._isMouseDown = false;
            t._duration = null;
            clearInterval(t._intervalId);
        });
        return t;
    };

    var unbind = function () {
        // removes all handlers associated with these elements.

        t.$e.off('mousedown');
        t.$e.off('mouseup mouseoff');
        t._whileMouseDown = null;
    };
    t.bind = bind;
    t.unbind = unbind;
    return t;
};

module.exports = MouseHold;
module.exports.asJQueryPlugin = function () {
    $.fn.mousehold = function () {
        if (!this._mousehold) {
            this._mousehold = new MouseHold(this);
        }
        return this._mousehold;
    };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(require,module,exports){
(function (global){
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

var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);

var Scrollable = function Scrollable($container, options) {
    var t = this;
    var defaults = {
        sliderSelector: null,
        viewportSelector: null,
    };
    t.options = $.extend({}, defaults, options);

    t._slideStart = null;
    t._initialScrollPosition = null;
    t._isScrolling = false;
    t._scrollEnabled = true;
    t.$container = $container;

    if (!t.options.sliderSelector) throw new Error('A Slider Selector must be specified.');
    t.$slider = $(t.options.sliderSelector);
    if (!t.options.viewportSelector) throw new Error('A Viewport Selector must be specified.');
    t.$target = $(t.options.viewportSelector);

    var updateReadingModeScrollPosition = function (targetScrollPosition) {
        // Amount of Scrollable Distance
        var readingMaxScroll = t.$target.children().outerHeight(true) - t.$target.height();

        var readingMaxSlide = t.$container.height() - t.$slider.height();

        var slideRatio = targetScrollPosition / readingMaxSlide;
        // // determine slide position
        var scrollPosition = readingMaxScroll * slideRatio;

        // update slider
        t.$target.scrollTop(scrollPosition);
    };

    var onContainerMouseDown = function (e) {
        t._isScrolling = true;
        t._slideStart = e.pageY;
        t._initialScrollPosition = t.$slider.position().top;
    };

    var onContainerMouseMove = function (e) {
        // if the mouse button is compressed
        if (t._isScrolling && e.buttons === 1) {
            var delta = e.pageY - t._slideStart;
            var maxHeight = t.$container.height() - t.$slider.height();
            var position = (t._initialScrollPosition || 0) + delta;

            if (position < 0) {
                position = 0;
            } else if (position > maxHeight) {
                position = maxHeight;
            }
            updateReadingModeScrollPosition(position);
        }
    };

    var onContainerMouseUp = function () {
        t._isScrolling = false;
        t._slideStart = null;
        t._initialScrollPosition = null;
    };

    var updateReadingModeSliderPosition = function () {
        // Ratio of scroll content to viewport
        var readingSliderRatio = t.$target.height() / t.$target.children().outerHeight(true);
        // Amount of Scrollable Distance
        var readingMaxScroll = t.$target.children().outerHeight(true) - t.$target.height();
        // current state of the scroll
        var scrollRatio = t.$target.scrollTop() / readingMaxScroll;
        // amount of slide room
        var slideRoom = (1 - readingSliderRatio) * t.$container.height();

        // determine slide position
        var slidePosition = slideRoom * scrollRatio;

        // update slider
        t.$slider.css({top: slidePosition});
    };

    var dispose = function () {
        t.$container
            .off('mousedown', t.options.sliderSelector, onContainerMouseDown)
            .off('mousemove', onContainerMouseMove)
            .off('mouseup', t.options.sliderSelector, onContainerMouseUp);
    };

    var init = function () {
        // assume the immediate parent is the container;
        t._scrollEnabled = t.$target.height() < t.$target.children().outerHeight(true);

        if (t._scrollEnabled) {
            t.$container
                .on('mousedown', t.options.sliderSelector, onContainerMouseDown)
                .on('mousemove', onContainerMouseMove)
                .on('mouseup', t.options.sliderSelector, onContainerMouseUp);

            t.$target.scroll($.proxy(updateReadingModeSliderPosition, t));
        } else {
            t.$slider.hide();
        }
    };

    t.Dispose = dispose;

    init();

    return t.$container;
};

module.exports = Scrollable;
module.exports.asJQueryPlugin = function () {
    $.fn.scrollable = function (options) {
        return new Scrollable(this, options);
    };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],17:[function(require,module,exports){
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
/* global $ */

var util = {

};

/**
 * Utility function to find a given style declared in the document, good for things like animating styles.
 *
 * @method getCSSRule
 * @param {String} ruleName - The name of the CSS rule (class) to get.
 * @returns {Array} An array containing all the rules found that match the given name, or null if none were found or an error was encountered.
 * @static
 */
util.getCSSRule = function(ruleName) {
    var ruleNameLowerCase = ruleName.toLowerCase();
    var ret = [];
    if (document.styleSheets) {
        var styleSheets = document.styleSheets;
        for (var i = 0, n = styleSheets.length; i < n; ++i) {
            var cssRules;
            try {
                cssRules = styleSheets[i].cssRules || styleSheets[i].rules || null;
            } catch (e) {
                cssRules = null;
            }
            if (cssRules) {
                var cssRule = null;
                var classes = null;
                for (var ii = 0, nn = cssRules.length; ii < nn; ++ii) {
                    cssRule = cssRules[ii];
                    if (cssRule.type === CSSRule.STYLE_RULE) {
                        classes = cssRule.selectorText.split('.');
                        if (classes && classes.length && classes[classes.length - 1].toLowerCase() === ruleNameLowerCase) {
                            ret.push(cssRule);
                        }
                    }
                }
            }
        }
    }

    return ret.length ? ret : null;
};

/**
 * Walk up the DOM from the given child, looking for a CSS scale transform.
 * If found, return the numeric value of the scale, assuming it is uniform.
 * @param {Object} $child - JQuery-wrapped DOM node to start the search from
 * @returns {number} Scale transform of nearest scaled parent, or 1 if none is found.
 * @static
 */
util.getParentScale = function ($child) {
    if ($child.parent) {
        var $parent = $child.parent();
        if ($parent && $parent[0] !== document) {
            var transform = $parent.css('transform');
            if (transform !== 'none') {
                var values = transform.split('(')[1].split(')')[0].split(',');
                var a = Number(values[0]);
                var b = Number(values[1]);
                return Math.sqrt(a * a + b * b);
            }

            return util.getParentScale($parent);
        }
    }
    return 1;
};

/**
 * Hash a string, such as a domain, into one of 256 shades of gray.
 * @param {String} str - arbitrary string to hash into a grey shade
 * @param {Number=} min - optional lower bound for the grey value
 * @param {Number=} max - optional upper bound for the grey value
 * @returns {number|*} A shade of grey in the range [min|0, max|255]
 * @static
 */
util.grayShadeFromString = function(str, min, max) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    var color32bit = (hash & 0xFFFFFF);
    var r = (color32bit >> 16) & 255;
    var g = (color32bit >> 8) & 255;
    var b = color32bit & 255;

    /* clamp the colors */
    if (min !== undefined) {
        r = Math.max(r, min);
        g = Math.max(g, min);
        b = Math.max(b, min);
    }

    if (max !== undefined) {
        r = Math.min(r, max);
        g = Math.min(g, max);
        b = Math.min(b, max);
    }

    return Math.floor((r + g + b) / 3);
};

/**
 * Generate a Data URL encoding a grey single-letter icon.
 * @param {Number} width - width of the icon in pixels
 * @param {Number} height - height of the icon in pixels
 * @param {String} sourceName - string to create an icon for;
 * the first character becomes the icon's letter and the string as a whole gets hashed into a grey shade
 * @returns {string} Data URL encoding an icon image
 * @static
 */
util.createFallbackIconURL = function(width, height, sourceName) {
    /* get the gray shade for the background */
    var channel = util.grayShadeFromString(sourceName, 0, 102);

    /* initialize an offscreen canvas */
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');

    /* draw the background */
    context.fillStyle = 'rgb(' + channel + ',' + channel + ',' + channel + ')';
    context.fillRect(0, 0, width, height);

    /* make the channel brighter for the text */
    channel = Math.floor(channel * 2.5);
    context.fillStyle = 'rgb(' + channel + ',' + channel + ',' + channel + ')';

    /* draw the text */
    var letter = sourceName[0].toUpperCase();
    context.font = Math.round(height * 0.7) + 'px helvetica';
    context.fontWeight = 'bolder';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, width * 0.5, height * 0.5);

    return canvas.toDataURL();
};

/**
 * Test whether the given wheel scroll delta should be applied to the given element's vertical scroll position.
 * @param {Object} $element - JQuery-wrapped element being scrolled
 * @param {Number} wheelDelta - signed mouse wheel scroll amount
 * @returns {boolean} true if wheelDelta should be applied to scrollTop; otherwise, apply it to scrollLeft
 */
util.isScrollingVerticalContent = function ($element, wheelDelta) {
    var scrollTop = $element.scrollTop();
    var isScrollBottom = (scrollTop + $element.innerHeight()) >= $element[0].scrollHeight;
    return !(wheelDelta > 0 && scrollTop === 0) && !(wheelDelta < 0 && isScrollBottom);
};

/**
 * Allow the mouse wheel to scroll the view horizontally whenever the mouse is over content not needing vertical scrolling.
 * @param {Object} t - context object, where the scroll handlers will be attached (for testing)
 * @param {Object} $element - JQuery-wrapped scroll target
 * @param {String} listProperty - name of the property of t referring to an array of strippets
 * @param {String} itemProperty - name of the property of each strippet that is the strippet's JQuery element
 */
util.mapVerticalScrollToHorizontalScroll = function(t, $element, listProperty, itemProperty) {
    t._horizontalMouseScroll = function(event) {
        event.preventDefault();
        var direction = (event.originalEvent.detail < 0 || event.originalEvent.wheelDelta > 0) ? 1 : -1;
        var width = 2;
        var list = t[listProperty];
        var length = list.length;
        for (var i = 0; i < length; i++) {
            width = list[i][itemProperty].width() || width;
        }
        var wheelDelta = direction * width * 0.5;
        var isScrollingVerticalContent = util.isScrollingVerticalContent($(this), wheelDelta);
        if (isScrollingVerticalContent) {
            $element.scrollTop($element.scrollTop() - wheelDelta);
            event.stopPropagation();
        } else {
            $element.scrollLeft($element.scrollLeft() - wheelDelta);
        }
    };
    $element.on('mousewheel DOMMouseScroll', t._horizontalMouseScroll);

    t._readerMouseScroll = function (event) {
        var wheelDelta = event.type === 'DOMMouseScroll' // if firefox
            ? -event.originalEvent.detail
            : event.originalEvent.wheelDelta;
        var isScrollingVerticalContent = util.isScrollingVerticalContent($(this), wheelDelta);
        if (isScrollingVerticalContent) event.stopPropagation();
    };
    $element.on('mousewheel DOMMouseScroll', '.readerContent', t._readerMouseScroll);
};

module.exports = util;

},{}],18:[function(require,module,exports){
(function (process,global){
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013-2015 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
/**
 * bluebird build version 3.4.7
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, using, timers, filter, any, each
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule");
var Queue = _dereq_("./queue");
var util = _dereq_("./util");

function Async() {
    this._customScheduler = false;
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._haveDrainedQueues = false;
    this._trampolineEnabled = true;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule = schedule;
}

Async.prototype.setScheduler = function(fn) {
    var prev = this._schedule;
    this._schedule = fn;
    this._customScheduler = true;
    return prev;
};

Async.prototype.hasCustomScheduler = function() {
    return this._customScheduler;
};

Async.prototype.enableTrampoline = function() {
    this._trampolineEnabled = true;
};

Async.prototype.disableTrampolineIfNecessary = function() {
    if (util.hasDevTools) {
        this._trampolineEnabled = false;
    }
};

Async.prototype.haveItemsQueued = function () {
    return this._isTickUsed || this._haveDrainedQueues;
};


Async.prototype.fatalError = function(e, isNode) {
    if (isNode) {
        process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e) +
            "\n");
        process.exit(2);
    } else {
        this.throwLater(e);
    }
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

if (!util.hasDevTools) {
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
} else {
    Async.prototype.invokeLater = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvokeLater.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                setTimeout(function() {
                    fn.call(receiver, arg);
                }, 100);
            });
        }
    };

    Async.prototype.invoke = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvoke.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                fn.call(receiver, arg);
            });
        }
    };

    Async.prototype.settlePromises = function(promise) {
        if (this._trampolineEnabled) {
            AsyncSettlePromises.call(this, promise);
        } else {
            this._schedule(function() {
                promise._settlePromises();
            });
        }
    };
}

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    this._drainQueue(this._normalQueue);
    this._reset();
    this._haveDrainedQueues = true;
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = Async;
module.exports.firstLineError = firstLineError;

},{"./queue":26,"./schedule":29,"./util":36}],3:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise, debug) {
var calledBind = false;
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (((this._bitField & 50397184) === 0)) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    if (!calledBind) {
        calledBind = true;
        Promise.prototype._propagateFrom = debug.propagateFromFunction();
        Promise.prototype._boundValue = debug.boundValueFunction();
    }
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();
    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, undefined, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, undefined, ret, context);
        ret._setOnCancel(maybePromise);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 2097152;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~2097152);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 2097152) === 2097152;
};

Promise.bind = function (thisArg, value) {
    return Promise.resolve(value).bind(thisArg);
};
};

},{}],4:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise":22}],5:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!true) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var args = [].slice.call(arguments, 1);;
    if (!true) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util":36}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

Promise.prototype["break"] = Promise.prototype.cancel = function() {
    if (!debug.cancellation()) return this._warn("cancellation is disabled");

    var promise = this;
    var child = promise;
    while (promise._isCancellable()) {
        if (!promise._cancelBy(child)) {
            if (child._isFollowing()) {
                child._followee().cancel();
            } else {
                child._cancelBranched();
            }
            break;
        }

        var parent = promise._cancellationParent;
        if (parent == null || !parent._isCancellable()) {
            if (promise._isFollowing()) {
                promise._followee().cancel();
            } else {
                promise._cancelBranched();
            }
            break;
        } else {
            if (promise._isFollowing()) promise._followee().cancel();
            promise._setWillBeCancelled();
            child = promise;
            promise = parent;
        }
    }
};

Promise.prototype._branchHasCancelled = function() {
    this._branchesRemainingToCancel--;
};

Promise.prototype._enoughBranchesHaveCancelled = function() {
    return this._branchesRemainingToCancel === undefined ||
           this._branchesRemainingToCancel <= 0;
};

Promise.prototype._cancelBy = function(canceller) {
    if (canceller === this) {
        this._branchesRemainingToCancel = 0;
        this._invokeOnCancel();
        return true;
    } else {
        this._branchHasCancelled();
        if (this._enoughBranchesHaveCancelled()) {
            this._invokeOnCancel();
            return true;
        }
    }
    return false;
};

Promise.prototype._cancelBranched = function() {
    if (this._enoughBranchesHaveCancelled()) {
        this._cancel();
    }
};

Promise.prototype._cancel = function() {
    if (!this._isCancellable()) return;
    this._setCancelled();
    async.invoke(this._cancelPromises, this, undefined);
};

Promise.prototype._cancelPromises = function() {
    if (this._length() > 0) this._settlePromises();
};

Promise.prototype._unsetOnCancel = function() {
    this._onCancelField = undefined;
};

Promise.prototype._isCancellable = function() {
    return this.isPending() && !this._isCancelled();
};

Promise.prototype.isCancellable = function() {
    return this.isPending() && !this.isCancelled();
};

Promise.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
    if (util.isArray(onCancelCallback)) {
        for (var i = 0; i < onCancelCallback.length; ++i) {
            this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
        }
    } else if (onCancelCallback !== undefined) {
        if (typeof onCancelCallback === "function") {
            if (!internalOnly) {
                var e = tryCatch(onCancelCallback).call(this._boundValue());
                if (e === errorObj) {
                    this._attachExtraTrace(e.e);
                    async.throwLater(e.e);
                }
            }
        } else {
            onCancelCallback._resultCancelled(this);
        }
    }
};

Promise.prototype._invokeOnCancel = function() {
    var onCancelCallback = this._onCancel();
    this._unsetOnCancel();
    async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
};

Promise.prototype._invokeInternalOnCancel = function() {
    if (this._isCancellable()) {
        this._doInvokeOnCancel(this._onCancel(), true);
        this._unsetOnCancel();
    }
};

Promise.prototype._resultCancelled = function() {
    this.cancel();
};

};

},{"./util":36}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util");
var getKeys = _dereq_("./es5").keys;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function catchFilter(instances, cb, promise) {
    return function(e) {
        var boundTo = promise._boundValue();
        predicateLoop: for (var i = 0; i < instances.length; ++i) {
            var item = instances[i];

            if (item === Error ||
                (item != null && item.prototype instanceof Error)) {
                if (e instanceof item) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (typeof item === "function") {
                var matchesPredicate = tryCatch(item).call(boundTo, e);
                if (matchesPredicate === errorObj) {
                    return matchesPredicate;
                } else if (matchesPredicate) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (util.isObject(e)) {
                var keys = getKeys(item);
                for (var j = 0; j < keys.length; ++j) {
                    var key = keys[j];
                    if (item[key] != e[key]) {
                        continue predicateLoop;
                    }
                }
                return tryCatch(cb).call(boundTo, e);
            }
        }
        return NEXT_FILTER;
    };
}

return catchFilter;
};

},{"./es5":13,"./util":36}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var longStackTraces = false;
var contextStack = [];

Promise.prototype._promiseCreated = function() {};
Promise.prototype._pushContext = function() {};
Promise.prototype._popContext = function() {return null;};
Promise._peekContext = Promise.prototype._peekContext = function() {};

function Context() {
    this._trace = new Context.CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (this._trace !== undefined) {
        this._trace._promiseCreated = null;
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (this._trace !== undefined) {
        var trace = contextStack.pop();
        var ret = trace._promiseCreated;
        trace._promiseCreated = null;
        return ret;
    }
    return null;
};

function createContext() {
    if (longStackTraces) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}
Context.CapturedTrace = null;
Context.create = createContext;
Context.deactivateLongStackTraces = function() {};
Context.activateLongStackTraces = function() {
    var Promise_pushContext = Promise.prototype._pushContext;
    var Promise_popContext = Promise.prototype._popContext;
    var Promise_PeekContext = Promise._peekContext;
    var Promise_peekContext = Promise.prototype._peekContext;
    var Promise_promiseCreated = Promise.prototype._promiseCreated;
    Context.deactivateLongStackTraces = function() {
        Promise.prototype._pushContext = Promise_pushContext;
        Promise.prototype._popContext = Promise_popContext;
        Promise._peekContext = Promise_PeekContext;
        Promise.prototype._peekContext = Promise_peekContext;
        Promise.prototype._promiseCreated = Promise_promiseCreated;
        longStackTraces = false;
    };
    longStackTraces = true;
    Promise.prototype._pushContext = Context.prototype._pushContext;
    Promise.prototype._popContext = Context.prototype._popContext;
    Promise._peekContext = Promise.prototype._peekContext = peekContext;
    Promise.prototype._promiseCreated = function() {
        var ctx = this._peekContext();
        if (ctx && ctx._promiseCreated == null) ctx._promiseCreated = this;
    };
};
return Context;
};

},{}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, Context) {
var getDomain = Promise._getDomain;
var async = Promise._async;
var Warning = _dereq_("./errors").Warning;
var util = _dereq_("./util");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;
var nodeFramePattern = /\((?:timers\.js):\d+:\d+\)/;
var parseLinePattern = /[\/<\(](.+?):(\d+):(\d+)\)?\s*$/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var printWarning;
var debugging = !!(util.env("BLUEBIRD_DEBUG") != 0 &&
                        (true ||
                         util.env("BLUEBIRD_DEBUG") ||
                         util.env("NODE_ENV") === "development"));

var warnings = !!(util.env("BLUEBIRD_WARNINGS") != 0 &&
    (debugging || util.env("BLUEBIRD_WARNINGS")));

var longStackTraces = !!(util.env("BLUEBIRD_LONG_STACK_TRACES") != 0 &&
    (debugging || util.env("BLUEBIRD_LONG_STACK_TRACES")));

var wForgottenReturn = util.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 &&
    (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));

Promise.prototype.suppressUnhandledRejections = function() {
    var target = this._target();
    target._bitField = ((target._bitField & (~1048576)) |
                      524288);
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 524288) !== 0) return;
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._setReturnedNonUndefined = function() {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._returnedNonUndefined = function() {
    return (this._bitField & 268435456) !== 0;
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._settledValue();
        this._setUnhandledRejectionIsNotified();
        fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 262144;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~262144);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 262144) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 1048576;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~1048576);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._warn = function(message, shouldUseOwnTrace, promise) {
    return warn(message, shouldUseOwnTrace, promise || this);
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var domain = getDomain();
    possiblyUnhandledRejection =
        typeof fn === "function" ? (domain === null ?
                                            fn : util.domainBind(domain, fn))
                                 : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var domain = getDomain();
    unhandledRejectionHandled =
        typeof fn === "function" ? (domain === null ?
                                            fn : util.domainBind(domain, fn))
                                 : undefined;
};

var disableLongStackTraces = function() {};
Promise.longStackTraces = function () {
    if (async.haveItemsQueued() && !config.longStackTraces) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    if (!config.longStackTraces && longStackTracesIsSupported()) {
        var Promise_captureStackTrace = Promise.prototype._captureStackTrace;
        var Promise_attachExtraTrace = Promise.prototype._attachExtraTrace;
        config.longStackTraces = true;
        disableLongStackTraces = function() {
            if (async.haveItemsQueued() && !config.longStackTraces) {
                throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
            }
            Promise.prototype._captureStackTrace = Promise_captureStackTrace;
            Promise.prototype._attachExtraTrace = Promise_attachExtraTrace;
            Context.deactivateLongStackTraces();
            async.enableTrampoline();
            config.longStackTraces = false;
        };
        Promise.prototype._captureStackTrace = longStackTracesCaptureStackTrace;
        Promise.prototype._attachExtraTrace = longStackTracesAttachExtraTrace;
        Context.activateLongStackTraces();
        async.disableTrampolineIfNecessary();
    }
};

Promise.hasLongStackTraces = function () {
    return config.longStackTraces && longStackTracesIsSupported();
};

var fireDomEvent = (function() {
    try {
        if (typeof CustomEvent === "function") {
            var event = new CustomEvent("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event) {
                var domEvent = new CustomEvent(name.toLowerCase(), {
                    detail: event,
                    cancelable: true
                });
                return !util.global.dispatchEvent(domEvent);
            };
        } else if (typeof Event === "function") {
            var event = new Event("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event) {
                var domEvent = new Event(name.toLowerCase(), {
                    cancelable: true
                });
                domEvent.detail = event;
                return !util.global.dispatchEvent(domEvent);
            };
        } else {
            var event = document.createEvent("CustomEvent");
            event.initCustomEvent("testingtheevent", false, true, {});
            util.global.dispatchEvent(event);
            return function(name, event) {
                var domEvent = document.createEvent("CustomEvent");
                domEvent.initCustomEvent(name.toLowerCase(), false, true,
                    event);
                return !util.global.dispatchEvent(domEvent);
            };
        }
    } catch (e) {}
    return function() {
        return false;
    };
})();

var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function() {
            return process.emit.apply(process, arguments);
        };
    } else {
        if (!util.global) {
            return function() {
                return false;
            };
        }
        return function(name) {
            var methodName = "on" + name.toLowerCase();
            var method = util.global[methodName];
            if (!method) return false;
            method.apply(util.global, [].slice.call(arguments, 1));
            return true;
        };
    }
})();

function generatePromiseLifecycleEventObject(name, promise) {
    return {promise: promise};
}

var eventToObjectGenerator = {
    promiseCreated: generatePromiseLifecycleEventObject,
    promiseFulfilled: generatePromiseLifecycleEventObject,
    promiseRejected: generatePromiseLifecycleEventObject,
    promiseResolved: generatePromiseLifecycleEventObject,
    promiseCancelled: generatePromiseLifecycleEventObject,
    promiseChained: function(name, promise, child) {
        return {promise: promise, child: child};
    },
    warning: function(name, warning) {
        return {warning: warning};
    },
    unhandledRejection: function (name, reason, promise) {
        return {reason: reason, promise: promise};
    },
    rejectionHandled: generatePromiseLifecycleEventObject
};

var activeFireEvent = function (name) {
    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent.apply(null, arguments);
    } catch (e) {
        async.throwLater(e);
        globalEventFired = true;
    }

    var domEventFired = false;
    try {
        domEventFired = fireDomEvent(name,
                    eventToObjectGenerator[name].apply(null, arguments));
    } catch (e) {
        async.throwLater(e);
        domEventFired = true;
    }

    return domEventFired || globalEventFired;
};

Promise.config = function(opts) {
    opts = Object(opts);
    if ("longStackTraces" in opts) {
        if (opts.longStackTraces) {
            Promise.longStackTraces();
        } else if (!opts.longStackTraces && Promise.hasLongStackTraces()) {
            disableLongStackTraces();
        }
    }
    if ("warnings" in opts) {
        var warningsOption = opts.warnings;
        config.warnings = !!warningsOption;
        wForgottenReturn = config.warnings;

        if (util.isObject(warningsOption)) {
            if ("wForgottenReturn" in warningsOption) {
                wForgottenReturn = !!warningsOption.wForgottenReturn;
            }
        }
    }
    if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
        if (async.haveItemsQueued()) {
            throw new Error(
                "cannot enable cancellation after promises are in use");
        }
        Promise.prototype._clearCancellationData =
            cancellationClearCancellationData;
        Promise.prototype._propagateFrom = cancellationPropagateFrom;
        Promise.prototype._onCancel = cancellationOnCancel;
        Promise.prototype._setOnCancel = cancellationSetOnCancel;
        Promise.prototype._attachCancellationCallback =
            cancellationAttachCancellationCallback;
        Promise.prototype._execute = cancellationExecute;
        propagateFromFunction = cancellationPropagateFrom;
        config.cancellation = true;
    }
    if ("monitoring" in opts) {
        if (opts.monitoring && !config.monitoring) {
            config.monitoring = true;
            Promise.prototype._fireEvent = activeFireEvent;
        } else if (!opts.monitoring && config.monitoring) {
            config.monitoring = false;
            Promise.prototype._fireEvent = defaultFireEvent;
        }
    }
    return Promise;
};

function defaultFireEvent() { return false; }

Promise.prototype._fireEvent = defaultFireEvent;
Promise.prototype._execute = function(executor, resolve, reject) {
    try {
        executor(resolve, reject);
    } catch (e) {
        return e;
    }
};
Promise.prototype._onCancel = function () {};
Promise.prototype._setOnCancel = function (handler) { ; };
Promise.prototype._attachCancellationCallback = function(onCancel) {
    ;
};
Promise.prototype._captureStackTrace = function () {};
Promise.prototype._attachExtraTrace = function () {};
Promise.prototype._clearCancellationData = function() {};
Promise.prototype._propagateFrom = function (parent, flags) {
    ;
    ;
};

function cancellationExecute(executor, resolve, reject) {
    var promise = this;
    try {
        executor(resolve, reject, function(onCancel) {
            if (typeof onCancel !== "function") {
                throw new TypeError("onCancel must be a function, got: " +
                                    util.toString(onCancel));
            }
            promise._attachCancellationCallback(onCancel);
        });
    } catch (e) {
        return e;
    }
}

function cancellationAttachCancellationCallback(onCancel) {
    if (!this._isCancellable()) return this;

    var previousOnCancel = this._onCancel();
    if (previousOnCancel !== undefined) {
        if (util.isArray(previousOnCancel)) {
            previousOnCancel.push(onCancel);
        } else {
            this._setOnCancel([previousOnCancel, onCancel]);
        }
    } else {
        this._setOnCancel(onCancel);
    }
}

function cancellationOnCancel() {
    return this._onCancelField;
}

function cancellationSetOnCancel(onCancel) {
    this._onCancelField = onCancel;
}

function cancellationClearCancellationData() {
    this._cancellationParent = undefined;
    this._onCancelField = undefined;
}

function cancellationPropagateFrom(parent, flags) {
    if ((flags & 1) !== 0) {
        this._cancellationParent = parent;
        var branchesRemainingToCancel = parent._branchesRemainingToCancel;
        if (branchesRemainingToCancel === undefined) {
            branchesRemainingToCancel = 0;
        }
        parent._branchesRemainingToCancel = branchesRemainingToCancel + 1;
    }
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}

function bindingPropagateFrom(parent, flags) {
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}
var propagateFromFunction = bindingPropagateFrom;

function boundValueFunction() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
}

function longStackTracesCaptureStackTrace() {
    this._trace = new CapturedTrace(this._peekContext());
}

function longStackTracesAttachExtraTrace(error, ignoreSelf) {
    if (canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
}

function checkForgottenReturns(returnValue, promiseCreated, name, promise,
                               parent) {
    if (returnValue === undefined && promiseCreated !== null &&
        wForgottenReturn) {
        if (parent !== undefined && parent._returnedNonUndefined()) return;
        if ((promise._bitField & 65535) === 0) return;

        if (name) name = name + " ";
        var handlerLine = "";
        var creatorLine = "";
        if (promiseCreated._trace) {
            var traceLines = promiseCreated._trace.stack.split("\n");
            var stack = cleanStack(traceLines);
            for (var i = stack.length - 1; i >= 0; --i) {
                var line = stack[i];
                if (!nodeFramePattern.test(line)) {
                    var lineMatches = line.match(parseLinePattern);
                    if (lineMatches) {
                        handlerLine  = "at " + lineMatches[1] +
                            ":" + lineMatches[2] + ":" + lineMatches[3] + " ";
                    }
                    break;
                }
            }

            if (stack.length > 0) {
                var firstUserLine = stack[0];
                for (var i = 0; i < traceLines.length; ++i) {

                    if (traceLines[i] === firstUserLine) {
                        if (i > 0) {
                            creatorLine = "\n" + traceLines[i - 1];
                        }
                        break;
                    }
                }

            }
        }
        var msg = "a promise was created in a " + name +
            "handler " + handlerLine + "but was not returned from it, " +
            "see http://goo.gl/rRqMUw" +
            creatorLine;
        promise._warn(msg, true, promiseCreated);
    }
}

function deprecated(name, replacement) {
    var message = name +
        " is deprecated and will be removed in a future version.";
    if (replacement) message += " Use " + replacement + " instead.";
    return warn(message);
}

function warn(message, shouldUseOwnTrace, promise) {
    if (!config.warnings) return;
    var warning = new Warning(message);
    var ctx;
    if (shouldUseOwnTrace) {
        promise._attachExtraTrace(warning);
    } else if (config.longStackTraces && (ctx = Promise._peekContext())) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }

    if (!activeFireEvent("warning", warning)) {
        formatAndLogError(warning, "", true);
    }
}

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = "    (No stack trace)" === line ||
            stackFramePattern.test(line);
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0 && error.name != "SyntaxError") {
        stack = stack.slice(i);
    }
    return stack;
}

function parseStackAndMessage(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: error.name == "SyntaxError" ? stack : cleanStack(stack)
    };
}

function formatAndLogError(error, title, isSoft) {
    if (typeof console !== "undefined") {
        var message;
        if (util.isObject(error)) {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof printWarning === "function") {
            printWarning(message, isSoft);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
}

function fireRejectionEvent(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    if (name === "unhandledRejection") {
        if (!activeFireEvent(name, reason, promise) && !localEventFired) {
            formatAndLogError(reason, "Unhandled rejection ");
        }
    } else {
        activeFireEvent(name, promise);
    }
}

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj && typeof obj.toString === "function"
            ? obj.toString() : util.toString(obj);
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

function longStackTracesIsSupported() {
    return typeof captureStackTrace === "function";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}

function setBounds(firstLineError, lastLineError) {
    if (!longStackTracesIsSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
}

function CapturedTrace(parent) {
    this._parent = parent;
    this._promisesCreated = 0;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);
Context.CapturedTrace = CapturedTrace;

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit += 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit += 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit -= 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit += 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit -= 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    printWarning = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        printWarning = function(message, isSoft) {
            var color = isSoft ? "\u001b[33m" : "\u001b[31m";
            console.warn(color + message + "\u001b[0m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        printWarning = function(message, isSoft) {
            console.warn("%c" + message,
                        isSoft ? "color: darkorange" : "color: red");
        };
    }
}

var config = {
    warnings: warnings,
    longStackTraces: false,
    cancellation: false,
    monitoring: false
};

if (longStackTraces) Promise.longStackTraces();

return {
    longStackTraces: function() {
        return config.longStackTraces;
    },
    warnings: function() {
        return config.warnings;
    },
    cancellation: function() {
        return config.cancellation;
    },
    monitoring: function() {
        return config.monitoring;
    },
    propagateFromFunction: function() {
        return propagateFromFunction;
    },
    boundValueFunction: function() {
        return boundValueFunction;
    },
    checkForgottenReturns: checkForgottenReturns,
    setBounds: setBounds,
    warn: warn,
    deprecated: deprecated,
    CapturedTrace: CapturedTrace,
    fireDomEvent: fireDomEvent,
    fireGlobalEvent: fireGlobalEvent
};
};

},{"./errors":12,"./util":36}],10:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function returner() {
    return this.value;
}
function thrower() {
    throw this.reason;
}

Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value instanceof Promise) value.suppressUnhandledRejections();
    return this._then(
        returner, undefined, undefined, {value: value}, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    return this._then(
        thrower, undefined, undefined, {reason: reason}, undefined);
};

Promise.prototype.catchThrow = function (reason) {
    if (arguments.length <= 1) {
        return this._then(
            undefined, thrower, undefined, {reason: reason}, undefined);
    } else {
        var _reason = arguments[1];
        var handler = function() {throw _reason;};
        return this.caught(reason, handler);
    }
};

Promise.prototype.catchReturn = function (value) {
    if (arguments.length <= 1) {
        if (value instanceof Promise) value.suppressUnhandledRejections();
        return this._then(
            undefined, returner, undefined, {value: value}, undefined);
    } else {
        var _value = arguments[1];
        if (_value instanceof Promise) _value.suppressUnhandledRejections();
        var handler = function() {return _value;};
        return this.caught(value, handler);
    }
};
};

},{}],11:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;
var PromiseAll = Promise.all;

function promiseAllThis() {
    return PromiseAll(this);
}

function PromiseMapSeries(promises, fn) {
    return PromiseReduce(promises, fn, INTERNAL, INTERNAL);
}

Promise.prototype.each = function (fn) {
    return PromiseReduce(this, fn, INTERNAL, 0)
              ._then(promiseAllThis, undefined, undefined, this, undefined);
};

Promise.prototype.mapSeries = function (fn) {
    return PromiseReduce(this, fn, INTERNAL, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseReduce(promises, fn, INTERNAL, 0)
              ._then(promiseAllThis, undefined, undefined, promises, undefined);
};

Promise.mapSeries = PromiseMapSeries;
};


},{}],12:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    es5.defineProperty(Error, "__BluebirdErrorTypes__", {
        value: errorTypes,
        writable: false,
        enumerable: false,
        configurable: false
    });
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5":13,"./util":36}],13:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],14:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, tryConvertToPromise) {
var util = _dereq_("./util");
var CancellationError = Promise.CancellationError;
var errorObj = util.errorObj;

function PassThroughHandlerContext(promise, type, handler) {
    this.promise = promise;
    this.type = type;
    this.handler = handler;
    this.called = false;
    this.cancelPromise = null;
}

PassThroughHandlerContext.prototype.isFinallyHandler = function() {
    return this.type === 0;
};

function FinallyHandlerCancelReaction(finallyHandler) {
    this.finallyHandler = finallyHandler;
}

FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
    checkCancel(this.finallyHandler);
};

function checkCancel(ctx, reason) {
    if (ctx.cancelPromise != null) {
        if (arguments.length > 1) {
            ctx.cancelPromise._reject(reason);
        } else {
            ctx.cancelPromise._cancel();
        }
        ctx.cancelPromise = null;
        return true;
    }
    return false;
}

function succeed() {
    return finallyHandler.call(this, this.promise._target()._settledValue());
}
function fail(reason) {
    if (checkCancel(this, reason)) return;
    errorObj.e = reason;
    return errorObj;
}
function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    if (!this.called) {
        this.called = true;
        var ret = this.isFinallyHandler()
            ? handler.call(promise._boundValue())
            : handler.call(promise._boundValue(), reasonOrValue);
        if (ret !== undefined) {
            promise._setReturnedNonUndefined();
            var maybePromise = tryConvertToPromise(ret, promise);
            if (maybePromise instanceof Promise) {
                if (this.cancelPromise != null) {
                    if (maybePromise._isCancelled()) {
                        var reason =
                            new CancellationError("late cancellation observer");
                        promise._attachExtraTrace(reason);
                        errorObj.e = reason;
                        return errorObj;
                    } else if (maybePromise.isPending()) {
                        maybePromise._attachCancellationCallback(
                            new FinallyHandlerCancelReaction(this));
                    }
                }
                return maybePromise._then(
                    succeed, fail, undefined, this, undefined);
            }
        }
    }

    if (promise.isRejected()) {
        checkCancel(this);
        errorObj.e = reasonOrValue;
        return errorObj;
    } else {
        checkCancel(this);
        return reasonOrValue;
    }
}

Promise.prototype._passThrough = function(handler, type, success, fail) {
    if (typeof handler !== "function") return this.then();
    return this._then(success,
                      fail,
                      undefined,
                      new PassThroughHandlerContext(this, type, handler),
                      undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThrough(handler,
                             0,
                             finallyHandler,
                             finallyHandler);
};

Promise.prototype.tap = function (handler) {
    return this._passThrough(handler, 1, finallyHandler);
};

return PassThroughHandlerContext;
};

},{"./util":36}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise,
                          Proxyable,
                          debug) {
var errors = _dereq_("./errors");
var TypeError = errors.TypeError;
var util = _dereq_("./util");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    if (debug.cancellation()) {
        var internal = new Promise(INTERNAL);
        var _finallyPromise = this._finallyPromise = new Promise(INTERNAL);
        this._promise = internal.lastly(function() {
            return _finallyPromise;
        });
        internal._captureStackTrace();
        internal._setOnCancel(this);
    } else {
        var promise = this._promise = new Promise(INTERNAL);
        promise._captureStackTrace();
    }
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
    this._yieldedPromise = null;
    this._cancellationPhase = false;
}
util.inherits(PromiseSpawn, Proxyable);

PromiseSpawn.prototype._isResolved = function() {
    return this._promise === null;
};

PromiseSpawn.prototype._cleanup = function() {
    this._promise = this._generator = null;
    if (debug.cancellation() && this._finallyPromise !== null) {
        this._finallyPromise._fulfill();
        this._finallyPromise = null;
    }
};

PromiseSpawn.prototype._promiseCancelled = function() {
    if (this._isResolved()) return;
    var implementsReturn = typeof this._generator["return"] !== "undefined";

    var result;
    if (!implementsReturn) {
        var reason = new Promise.CancellationError(
            "generator .return() sentinel");
        Promise.coroutine.returnSentinel = reason;
        this._promise._attachExtraTrace(reason);
        this._promise._pushContext();
        result = tryCatch(this._generator["throw"]).call(this._generator,
                                                         reason);
        this._promise._popContext();
    } else {
        this._promise._pushContext();
        result = tryCatch(this._generator["return"]).call(this._generator,
                                                          undefined);
        this._promise._popContext();
    }
    this._cancellationPhase = true;
    this._yieldedPromise = null;
    this._continue(result);
};

PromiseSpawn.prototype._promiseFulfilled = function(value) {
    this._yieldedPromise = null;
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._promiseRejected = function(reason) {
    this._yieldedPromise = null;
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._resultCancelled = function() {
    if (this._yieldedPromise instanceof Promise) {
        var promise = this._yieldedPromise;
        this._yieldedPromise = null;
        promise.cancel();
    }
};

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._promiseFulfilled(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    var promise = this._promise;
    if (result === errorObj) {
        this._cleanup();
        if (this._cancellationPhase) {
            return promise.cancel();
        } else {
            return promise._rejectCallback(result.e, false);
        }
    }

    var value = result.value;
    if (result.done === true) {
        this._cleanup();
        if (this._cancellationPhase) {
            return promise.cancel();
        } else {
            return promise._resolveCallback(value);
        }
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._promiseRejected(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a\u000a".replace("%s", value) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise = maybePromise._target();
        var bitField = maybePromise._bitField;
        ;
        if (((bitField & 50397184) === 0)) {
            this._yieldedPromise = maybePromise;
            maybePromise._proxy(this, null);
        } else if (((bitField & 33554432) !== 0)) {
            Promise._async.invoke(
                this._promiseFulfilled, this, maybePromise._value()
            );
        } else if (((bitField & 16777216) !== 0)) {
            Promise._async.invoke(
                this._promiseRejected, this, maybePromise._reason()
            );
        } else {
            this._promiseCancelled();
        }
    }
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        var ret = spawn.promise();
        spawn._generator = generator;
        spawn._promiseFulfilled(undefined);
        return ret;
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    debug.deprecated("Promise.spawn()", "Promise.coroutine()");
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors":12,"./util":36}],17:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL, async,
         getDomain) {
var util = _dereq_("./util");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var promiseSetter = function(i) {
        return new Function("promise", "holder", "                           \n\
            'use strict';                                                    \n\
            holder.pIndex = promise;                                         \n\
            ".replace(/Index/g, i));
    };

    var generateHolderClass = function(total) {
        var props = new Array(total);
        for (var i = 0; i < props.length; ++i) {
            props[i] = "this.p" + (i+1);
        }
        var assignment = props.join(" = ") + " = null;";
        var cancellationCode= "var promise;\n" + props.map(function(prop) {
            return "                                                         \n\
                promise = " + prop + ";                                      \n\
                if (promise instanceof Promise) {                            \n\
                    promise.cancel();                                        \n\
                }                                                            \n\
            ";
        }).join("\n");
        var passedArguments = props.join(", ");
        var name = "Holder$" + total;


        var code = "return function(tryCatch, errorObj, Promise, async) {    \n\
            'use strict';                                                    \n\
            function [TheName](fn) {                                         \n\
                [TheProperties]                                              \n\
                this.fn = fn;                                                \n\
                this.asyncNeeded = true;                                     \n\
                this.now = 0;                                                \n\
            }                                                                \n\
                                                                             \n\
            [TheName].prototype._callFunction = function(promise) {          \n\
                promise._pushContext();                                      \n\
                var ret = tryCatch(this.fn)([ThePassedArguments]);           \n\
                promise._popContext();                                       \n\
                if (ret === errorObj) {                                      \n\
                    promise._rejectCallback(ret.e, false);                   \n\
                } else {                                                     \n\
                    promise._resolveCallback(ret);                           \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype.checkFulfillment = function(promise) {       \n\
                var now = ++this.now;                                        \n\
                if (now === [TheTotal]) {                                    \n\
                    if (this.asyncNeeded) {                                  \n\
                        async.invoke(this._callFunction, this, promise);     \n\
                    } else {                                                 \n\
                        this._callFunction(promise);                         \n\
                    }                                                        \n\
                                                                             \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype._resultCancelled = function() {              \n\
                [CancellationCode]                                           \n\
            };                                                               \n\
                                                                             \n\
            return [TheName];                                                \n\
        }(tryCatch, errorObj, Promise, async);                               \n\
        ";

        code = code.replace(/\[TheName\]/g, name)
            .replace(/\[TheTotal\]/g, total)
            .replace(/\[ThePassedArguments\]/g, passedArguments)
            .replace(/\[TheProperties\]/g, assignment)
            .replace(/\[CancellationCode\]/g, cancellationCode);

        return new Function("tryCatch", "errorObj", "Promise", "async", code)
                           (tryCatch, errorObj, Promise, async);
    };

    var holderClasses = [];
    var thenCallbacks = [];
    var promiseSetters = [];

    for (var i = 0; i < 8; ++i) {
        holderClasses.push(generateHolderClass(i + 1));
        thenCallbacks.push(thenCallback(i + 1));
        promiseSetters.push(promiseSetter(i + 1));
    }

    reject = function (reason) {
        this._reject(reason);
    };
}}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last <= 8 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var HolderClass = holderClasses[last - 1];
                var holder = new HolderClass(fn);
                var callbacks = thenCallbacks;

                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        var bitField = maybePromise._bitField;
                        ;
                        if (((bitField & 50397184) === 0)) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                            promiseSetters[i](maybePromise, holder);
                            holder.asyncNeeded = false;
                        } else if (((bitField & 33554432) !== 0)) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else if (((bitField & 16777216) !== 0)) {
                            ret._reject(maybePromise._reason());
                        } else {
                            ret._cancel();
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }

                if (!ret._isFateSealed()) {
                    if (holder.asyncNeeded) {
                        var domain = getDomain();
                        if (domain !== null) {
                            holder.fn = util.domainBind(domain, holder.fn);
                        }
                    }
                    ret._setAsyncGuaranteed();
                    ret._setOnCancel(holder);
                }
                return ret;
            }
        }
    }
    var args = [].slice.call(arguments);;
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util":36}],18:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var getDomain = Promise._getDomain;
var util = _dereq_("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    var domain = getDomain();
    this._callback = domain === null ? fn : util.domainBind(domain, fn);
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = [];
    async.invoke(this._asyncInit, this, undefined);
}
util.inherits(MappingPromiseArray, PromiseArray);

MappingPromiseArray.prototype._asyncInit = function() {
    this._init$(undefined, -2);
};

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;

    if (index < 0) {
        index = (index * -1) - 1;
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return true;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return false;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var promise = this._promise;
        var callback = this._callback;
        var receiver = promise._boundValue();
        promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        var promiseCreated = promise._popContext();
        debug.checkForgottenReturns(
            ret,
            promiseCreated,
            preservedValues !== null ? "Promise.filter" : "Promise.map",
            promise
        );
        if (ret === errorObj) {
            this._reject(ret.e);
            return true;
        }

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            var bitField = maybePromise._bitField;
            ;
            if (((bitField & 50397184) === 0)) {
                if (limit >= 1) this._inFlight++;
                values[index] = maybePromise;
                maybePromise._proxy(this, (index + 1) * -1);
                return false;
            } else if (((bitField & 33554432) !== 0)) {
                ret = maybePromise._value();
            } else if (((bitField & 16777216) !== 0)) {
                this._reject(maybePromise._reason());
                return true;
            } else {
                this._cancel();
                return true;
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }
        return true;
    }
    return false;
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }

    var limit = 0;
    if (options !== undefined) {
        if (typeof options === "object" && options !== null) {
            if (typeof options.concurrency !== "number") {
                return Promise.reject(
                    new TypeError("'concurrency' must be a number but it is " +
                                    util.classString(options.concurrency)));
            }
            limit = options.concurrency;
        } else {
            return Promise.reject(new TypeError(
                            "options argument must be an object but it is " +
                             util.classString(options)));
        }
    }
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter).promise();
}

Promise.prototype.map = function (fn, options) {
    return map(this, fn, options, null);
};

Promise.map = function (promises, fn, options, _filter) {
    return map(promises, fn, options, _filter);
};


};

},{"./util":36}],19:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("expecting a function but got " + util.classString(fn));
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        var promiseCreated = ret._popContext();
        debug.checkForgottenReturns(
            value, promiseCreated, "Promise.method", ret);
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value;
    if (arguments.length > 1) {
        debug.deprecated("calling Promise.try with more than 1 argument");
        var arg = arguments[1];
        var ctx = arguments[2];
        value = util.isArray(arg) ? tryCatch(fn).apply(ctx, arg)
                                  : tryCatch(fn).call(ctx, arg);
    } else {
        value = tryCatch(fn)();
    }
    var promiseCreated = ret._popContext();
    debug.checkForgottenReturns(
        value, promiseCreated, "Promise.try", ret);
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util":36}],20:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors");
var OperationalError = errors.OperationalError;
var es5 = _dereq_("./es5");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise, multiArgs) {
    return function(err, value) {
        if (promise === null) return;
        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (!multiArgs) {
            promise._fulfill(value);
        } else {
            var args = [].slice.call(arguments, 1);;
            promise._fulfill(args);
        }
        promise = null;
    };
}

module.exports = nodebackForPromise;

},{"./errors":12,"./es5":13,"./util":36}],21:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util");
var async = Promise._async;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundValue();
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var newReason = new Error(reason + "");
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.asCallback = Promise.prototype.nodeify = function (nodeback,
                                                                     options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./util":36}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var reflectHandler = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};
function Proxyable() {}
var UNDEFINED_BINDING = {};
var util = _dereq_("./util");

var getDomain;
if (util.isNode) {
    getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
    };
} else {
    getDomain = function() {
        return null;
    };
}
util.notEnumerableProp(Promise, "_getDomain", getDomain);

var es5 = _dereq_("./es5");
var Async = _dereq_("./async");
var async = new Async();
es5.defineProperty(Promise, "_async", {value: async});
var errors = _dereq_("./errors");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
var CancellationError = Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {};
var tryConvertToPromise = _dereq_("./thenables")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array")(Promise, INTERNAL,
                               tryConvertToPromise, apiRejection, Proxyable);
var Context = _dereq_("./context")(Promise);
 /*jshint unused:false*/
var createContext = Context.create;
var debug = _dereq_("./debuggability")(Promise, Context);
var CapturedTrace = debug.CapturedTrace;
var PassThroughHandlerContext =
    _dereq_("./finally")(Promise, tryConvertToPromise);
var catchFilter = _dereq_("./catch_filter")(NEXT_FILTER);
var nodebackForPromise = _dereq_("./nodeback");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function check(self, executor) {
    if (typeof executor !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(executor));
    }
    if (self.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
}

function Promise(executor) {
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    if (executor !== INTERNAL) {
        check(this, executor);
        this._resolveFromExecutor(executor);
    }
    this._promiseCreated();
    this._fireEvent("promiseCreated", this);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
                catchInstances[j++] = item;
            } else {
                return apiRejection("expecting an object but got " +
                    "A catch statement predicate " + util.classString(item));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        return this.then(undefined, catchFilter(catchInstances, fn, this));
    }
    return this.then(undefined, fn);
};

Promise.prototype.reflect = function () {
    return this._then(reflectHandler,
        reflectHandler, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject) {
    if (debug.warnings() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, undefined, undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject) {
    var promise =
        this._then(didFulfill, didReject, undefined, undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    return this.all()._then(fn, undefined, undefined, APPLY, undefined);
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    if (arguments.length > 0) {
        this._warn(".all() was passed arguments but it does not take any");
    }
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.getNewLibraryCopy = module.exports;

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = Promise.fromCallback = function(fn) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs
                                         : false;
    var result = tryCatch(fn)(nodebackForPromise(ret, multiArgs));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true);
    }
    if (!ret._isFateSealed()) ret._setAsyncGuaranteed();
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._setFulfilled();
        ret._rejectionHandler0 = obj;
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    return async.setScheduler(fn);
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    _,    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var promise = haveInternalData ? internalData : new Promise(INTERNAL);
    var target = this._target();
    var bitField = target._bitField;

    if (!haveInternalData) {
        promise._propagateFrom(this, 3);
        promise._captureStackTrace();
        if (receiver === undefined &&
            ((this._bitField & 2097152) !== 0)) {
            if (!((bitField & 50397184) === 0)) {
                receiver = this._boundValue();
            } else {
                receiver = target === this ? undefined : this._boundTo;
            }
        }
        this._fireEvent("promiseChained", this, promise);
    }

    var domain = getDomain();
    if (!((bitField & 50397184) === 0)) {
        var handler, value, settler = target._settlePromiseCtx;
        if (((bitField & 33554432) !== 0)) {
            value = target._rejectionHandler0;
            handler = didFulfill;
        } else if (((bitField & 16777216) !== 0)) {
            value = target._fulfillmentHandler0;
            handler = didReject;
            target._unsetRejectionIsUnhandled();
        } else {
            settler = target._settlePromiseLateCancellationObserver;
            value = new CancellationError("late cancellation observer");
            target._attachExtraTrace(value);
            handler = didReject;
        }

        async.invoke(settler, target, {
            handler: domain === null ? handler
                : (typeof handler === "function" &&
                    util.domainBind(domain, handler)),
            promise: promise,
            receiver: receiver,
            value: value
        });
    } else {
        target._addCallbacks(didFulfill, didReject, promise, receiver, domain);
    }

    return promise;
};

Promise.prototype._length = function () {
    return this._bitField & 65535;
};

Promise.prototype._isFateSealed = function () {
    return (this._bitField & 117506048) !== 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 67108864) === 67108864;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -65536) |
        (len & 65535);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 33554432;
    this._fireEvent("promiseFulfilled", this);
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 16777216;
    this._fireEvent("promiseRejected", this);
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 67108864;
    this._fireEvent("promiseResolved", this);
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._unsetCancelled = function() {
    this._bitField = this._bitField & (~65536);
};

Promise.prototype._setCancelled = function() {
    this._bitField = this._bitField | 65536;
    this._fireEvent("promiseCancelled", this);
};

Promise.prototype._setWillBeCancelled = function() {
    this._bitField = this._bitField | 8388608;
};

Promise.prototype._setAsyncGuaranteed = function() {
    if (async.hasCustomScheduler()) return;
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0 ? this._receiver0 : this[
            index * 4 - 4 + 3];
    if (ret === UNDEFINED_BINDING) {
        return undefined;
    } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return this[
            index * 4 - 4 + 2];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 1];
};

Promise.prototype._boundValue = function() {};

Promise.prototype._migrateCallback0 = function (follower) {
    var bitField = follower._bitField;
    var fulfill = follower._fulfillmentHandler0;
    var reject = follower._rejectionHandler0;
    var promise = follower._promise0;
    var receiver = follower._receiverAt(0);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._migrateCallbackAt = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    promise,
    receiver,
    domain
) {
    var index = this._length();

    if (index >= 65535 - 4) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        this._receiver0 = receiver;
        if (typeof fulfill === "function") {
            this._fulfillmentHandler0 =
                domain === null ? fulfill : util.domainBind(domain, fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 =
                domain === null ? reject : util.domainBind(domain, reject);
        }
    } else {
        var base = index * 4 - 4;
        this[base + 2] = promise;
        this[base + 3] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                domain === null ? fulfill : util.domainBind(domain, fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                domain === null ? reject : util.domainBind(domain, reject);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._proxy = function (proxyable, arg) {
    this._addCallbacks(undefined, undefined, arg, proxyable, null);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (((this._bitField & 117506048) !== 0)) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    if (shouldBind) this._propagateFrom(maybePromise, 2);

    var promise = maybePromise._target();

    if (promise === this) {
        this._reject(makeSelfResolutionError());
        return;
    }

    var bitField = promise._bitField;
    if (((bitField & 50397184) === 0)) {
        var len = this._length();
        if (len > 0) promise._migrateCallback0(this);
        for (var i = 1; i < len; ++i) {
            promise._migrateCallbackAt(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (((bitField & 33554432) !== 0)) {
        this._fulfill(promise._value());
    } else if (((bitField & 16777216) !== 0)) {
        this._reject(promise._reason());
    } else {
        var reason = new CancellationError("late cancellation observer");
        promise._attachExtraTrace(reason);
        this._reject(reason);
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, ignoreNonErrorWarnings) {
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
        var message = "a promise was rejected with a non-error: " +
            util.classString(reason);
        this._warn(message, true);
    }
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason);
};

Promise.prototype._resolveFromExecutor = function (executor) {
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = this._execute(executor, function(value) {
        promise._resolveCallback(value);
    }, function (reason) {
        promise._rejectCallback(reason, synchronous);
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined) {
        promise._rejectCallback(r, true);
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    var bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY) {
        if (!value || typeof value.length !== "number") {
            x = errorObj;
            x.e = new TypeError("cannot .spread() a non-array: " +
                                    util.classString(value));
        } else {
            x = tryCatch(handler).apply(this._boundValue(), value);
        }
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    var promiseCreated = promise._popContext();
    bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;

    if (x === NEXT_FILTER) {
        promise._reject(value);
    } else if (x === errorObj) {
        promise._rejectCallback(x.e, false);
    } else {
        debug.checkForgottenReturns(x, promiseCreated, "",  promise, this);
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._settlePromise = function(promise, handler, receiver, value) {
    var isPromise = promise instanceof Promise;
    var bitField = this._bitField;
    var asyncGuaranteed = ((bitField & 134217728) !== 0);
    if (((bitField & 65536) !== 0)) {
        if (isPromise) promise._invokeInternalOnCancel();

        if (receiver instanceof PassThroughHandlerContext &&
            receiver.isFinallyHandler()) {
            receiver.cancelPromise = promise;
            if (tryCatch(handler).call(receiver, value) === errorObj) {
                promise._reject(errorObj.e);
            }
        } else if (handler === reflectHandler) {
            promise._fulfill(reflectHandler.call(receiver));
        } else if (receiver instanceof Proxyable) {
            receiver._promiseCancelled(promise);
        } else if (isPromise || promise instanceof PromiseArray) {
            promise._cancel();
        } else {
            receiver.cancel();
        }
    } else if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            if (asyncGuaranteed) promise._setAsyncGuaranteed();
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof Proxyable) {
        if (!receiver._isResolved()) {
            if (((bitField & 33554432) !== 0)) {
                receiver._promiseFulfilled(value, promise);
            } else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (asyncGuaranteed) promise._setAsyncGuaranteed();
        if (((bitField & 33554432) !== 0)) {
            promise._fulfill(value);
        } else {
            promise._reject(value);
        }
    }
};

Promise.prototype._settlePromiseLateCancellationObserver = function(ctx) {
    var handler = ctx.handler;
    var promise = ctx.promise;
    var receiver = ctx.receiver;
    var value = ctx.value;
    if (typeof handler === "function") {
        if (!(promise instanceof Promise)) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (promise instanceof Promise) {
        promise._reject(value);
    }
};

Promise.prototype._settlePromiseCtx = function(ctx) {
    this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value);
};

Promise.prototype._settlePromise0 = function(handler, value, bitField) {
    var promise = this._promise0;
    var receiver = this._receiverAt(0);
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settlePromise(promise, handler, receiver, value);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    var base = index * 4 - 4;
    this[base + 2] =
    this[base + 3] =
    this[base + 0] =
    this[base + 1] = undefined;
};

Promise.prototype._fulfill = function (value) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._reject(err);
    }
    this._setFulfilled();
    this._rejectionHandler0 = value;

    if ((bitField & 65535) > 0) {
        if (((bitField & 134217728) !== 0)) {
            this._settlePromises();
        } else {
            async.settlePromises(this);
        }
    }
};

Promise.prototype._reject = function (reason) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    this._setRejected();
    this._fulfillmentHandler0 = reason;

    if (this._isFinal()) {
        return async.fatalError(reason, util.isNode);
    }

    if ((bitField & 65535) > 0) {
        async.settlePromises(this);
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._fulfillPromises = function (len, value) {
    for (var i = 1; i < len; i++) {
        var handler = this._fulfillmentHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, value);
    }
};

Promise.prototype._rejectPromises = function (len, reason) {
    for (var i = 1; i < len; i++) {
        var handler = this._rejectionHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, reason);
    }
};

Promise.prototype._settlePromises = function () {
    var bitField = this._bitField;
    var len = (bitField & 65535);

    if (len > 0) {
        if (((bitField & 16842752) !== 0)) {
            var reason = this._fulfillmentHandler0;
            this._settlePromise0(this._rejectionHandler0, reason, bitField);
            this._rejectPromises(len, reason);
        } else {
            var value = this._rejectionHandler0;
            this._settlePromise0(this._fulfillmentHandler0, value, bitField);
            this._fulfillPromises(len, value);
        }
        this._setLength(0);
    }
    this._clearCancellationData();
};

Promise.prototype._settledValue = function() {
    var bitField = this._bitField;
    if (((bitField & 33554432) !== 0)) {
        return this._rejectionHandler0;
    } else if (((bitField & 16777216) !== 0)) {
        return this._fulfillmentHandler0;
    }
};

function deferResolve(v) {this.promise._resolveCallback(v);}
function deferReject(v) {this.promise._rejectCallback(v, false);}

Promise.defer = Promise.pending = function() {
    debug.deprecated("Promise.defer", "new Promise");
    var promise = new Promise(INTERNAL);
    return {
        promise: promise,
        resolve: deferResolve,
        reject: deferReject
    };
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

_dereq_("./method")(Promise, INTERNAL, tryConvertToPromise, apiRejection,
    debug);
_dereq_("./bind")(Promise, INTERNAL, tryConvertToPromise, debug);
_dereq_("./cancel")(Promise, PromiseArray, apiRejection, debug);
_dereq_("./direct_resolve")(Promise);
_dereq_("./synchronous_inspection")(Promise);
_dereq_("./join")(
    Promise, PromiseArray, tryConvertToPromise, INTERNAL, async, getDomain);
Promise.Promise = Promise;
Promise.version = "3.4.7";
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
_dereq_('./call_get.js')(Promise);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug);
_dereq_('./timers.js')(Promise, INTERNAL, debug);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug);
_dereq_('./nodeify.js')(Promise);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
_dereq_('./settle.js')(Promise, PromiseArray, debug);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./filter.js')(Promise, INTERNAL);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./any.js')(Promise);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    debug.setBounds(Async.firstLineError, util.lastLineError);               
    return Promise;                                                          

};

},{"./any.js":1,"./async":2,"./bind":3,"./call_get.js":5,"./cancel":6,"./catch_filter":7,"./context":8,"./debuggability":9,"./direct_resolve":10,"./each.js":11,"./errors":12,"./es5":13,"./filter.js":14,"./finally":15,"./generators.js":16,"./join":17,"./map.js":18,"./method":19,"./nodeback":20,"./nodeify.js":21,"./promise_array":23,"./promisify.js":24,"./props.js":25,"./race.js":27,"./reduce.js":28,"./settle.js":30,"./some.js":31,"./synchronous_inspection":32,"./thenables":33,"./timers.js":34,"./using.js":35,"./util":36}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection, Proxyable) {
var util = _dereq_("./util");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    if (values instanceof Promise) {
        promise._propagateFrom(values, 3);
    }
    promise._setOnCancel(this);
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
util.inherits(PromiseArray, Proxyable);

PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        var bitField = values._bitField;
        ;
        this._values = values;

        if (((bitField & 50397184) === 0)) {
            this._promise._setAsyncGuaranteed();
            return values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
        } else if (((bitField & 33554432) !== 0)) {
            values = values._value();
        } else if (((bitField & 16777216) !== 0)) {
            return this._reject(values._reason());
        } else {
            return this._cancel();
        }
    }
    values = util.asArray(values);
    if (values === null) {
        var err = apiRejection(
            "expecting an array or an iterable object but got " + util.classString(values)).reason();
        this._promise._rejectCallback(err, false);
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    this._iterate(values);
};

PromiseArray.prototype._iterate = function(values) {
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var result = this._promise;
    var isResolved = false;
    var bitField = null;
    for (var i = 0; i < len; ++i) {
        var maybePromise = tryConvertToPromise(values[i], result);

        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            bitField = maybePromise._bitField;
        } else {
            bitField = null;
        }

        if (isResolved) {
            if (bitField !== null) {
                maybePromise.suppressUnhandledRejections();
            }
        } else if (bitField !== null) {
            if (((bitField & 50397184) === 0)) {
                maybePromise._proxy(this, i);
                this._values[i] = maybePromise;
            } else if (((bitField & 33554432) !== 0)) {
                isResolved = this._promiseFulfilled(maybePromise._value(), i);
            } else if (((bitField & 16777216) !== 0)) {
                isResolved = this._promiseRejected(maybePromise._reason(), i);
            } else {
                isResolved = this._promiseCancelled(i);
            }
        } else {
            isResolved = this._promiseFulfilled(maybePromise, i);
        }
    }
    if (!isResolved) result._setAsyncGuaranteed();
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype._cancel = function() {
    if (this._isResolved() || !this._promise._isCancellable()) return;
    this._values = null;
    this._promise._cancel();
};

PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false);
};

PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

PromiseArray.prototype._promiseCancelled = function() {
    this._cancel();
    return true;
};

PromiseArray.prototype._promiseRejected = function (reason) {
    this._totalResolved++;
    this._reject(reason);
    return true;
};

PromiseArray.prototype._resultCancelled = function() {
    if (this._isResolved()) return;
    var values = this._values;
    this._cancel();
    if (values instanceof Promise) {
        values.cancel();
    } else {
        for (var i = 0; i < values.length; ++i) {
            if (values[i] instanceof Promise) {
                values[i].cancel();
            }
        }
    }
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util":36}],24:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util");
var nodebackForPromise = _dereq_("./nodeback");
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyProps = [
    "arity",    "length",
    "name",
    "arguments",
    "caller",
    "callee",
    "prototype",
    "__isPromisified__"
];
var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

var defaultFilter = function(name) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/MqrFmX\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!true) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn, _, multiArgs) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";
    var body = "'use strict';                                                \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise, " + multiArgs + ");   \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
    ".replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode);
    body = body.replace("Parameters", parameterDeclaration(newParameterCount));
    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "notEnumerableProp",
                        "INTERNAL",
                        body)(
                    Promise,
                    fn,
                    receiver,
                    withAppended,
                    maybeWrapAsError,
                    nodebackForPromise,
                    util.tryCatch,
                    util.errorObj,
                    util.notEnumerableProp,
                    INTERNAL);
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn, __, multiArgs) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise, multiArgs);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        if (!promise._isFateSealed()) promise._setAsyncGuaranteed();
        return promise;
    }
    util.notEnumerableProp(promisified, "__isPromisified__", true);
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier, multiArgs) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        if (promisifier === makeNodePromisified) {
            obj[promisifiedKey] =
                makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
        } else {
            var promisified = promisifier(fn, function() {
                return makeNodePromisified(key, THIS, key,
                                           fn, suffix, multiArgs);
            });
            util.notEnumerableProp(promisified, "__isPromisified__", true);
            obj[promisifiedKey] = promisified;
        }
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver, multiArgs) {
    return makeNodePromisified(callback, receiver, undefined,
                                callback, null, multiArgs);
}

Promise.promisify = function (fn, options) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    if (isPromisified(fn)) {
        return fn;
    }
    options = Object(options);
    var receiver = options.context === undefined ? THIS : options.context;
    var multiArgs = !!options.multiArgs;
    var ret = promisify(fn, receiver, multiArgs);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    options = Object(options);
    var multiArgs = !!options.multiArgs;
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier,
                multiArgs);
            promisifyAll(value, suffix, filter, promisifier, multiArgs);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier, multiArgs);
};
};


},{"./errors":12,"./nodeback":20,"./util":36}],25:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util");
var isObject = util.isObject;
var es5 = _dereq_("./es5");
var Es6Map;
if (typeof Map === "function") Es6Map = Map;

var mapToEntries = (function() {
    var index = 0;
    var size = 0;

    function extractEntry(value, key) {
        this[index] = value;
        this[index + size] = key;
        index++;
    }

    return function mapToEntries(map) {
        size = map.size;
        index = 0;
        var ret = new Array(map.size * 2);
        map.forEach(extractEntry, ret);
        return ret;
    };
})();

var entriesToMap = function(entries) {
    var ret = new Es6Map();
    var length = entries.length / 2 | 0;
    for (var i = 0; i < length; ++i) {
        var key = entries[length + i];
        var value = entries[i];
        ret.set(key, value);
    }
    return ret;
};

function PropertiesPromiseArray(obj) {
    var isMap = false;
    var entries;
    if (Es6Map !== undefined && obj instanceof Es6Map) {
        entries = mapToEntries(obj);
        isMap = true;
    } else {
        var keys = es5.keys(obj);
        var len = keys.length;
        entries = new Array(len * 2);
        for (var i = 0; i < len; ++i) {
            var key = keys[i];
            entries[i] = obj[key];
            entries[i + len] = key;
        }
    }
    this.constructor$(entries);
    this._isMap = isMap;
    this._init$(undefined, -3);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val;
        if (this._isMap) {
            val = entriesToMap(this._values);
        } else {
            val = {};
            var keyOffset = this.length();
            for (var i = 0, len = this.length(); i < len; ++i) {
                val[this._values[i + keyOffset]] = this._values[i];
            }
        }
        this._resolve(val);
        return true;
    }
    return false;
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 2);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5":13,"./util":36}],26:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],27:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util");

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else {
        promises = util.asArray(promises);
        if (promises === null)
            return apiRejection("expecting an array or an iterable object but got " + util.classString(promises));
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 3);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util":36}],28:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var getDomain = Promise._getDomain;
var util = _dereq_("./util");
var tryCatch = util.tryCatch;

function ReductionPromiseArray(promises, fn, initialValue, _each) {
    this.constructor$(promises);
    var domain = getDomain();
    this._fn = domain === null ? fn : util.domainBind(domain, fn);
    if (initialValue !== undefined) {
        initialValue = Promise.resolve(initialValue);
        initialValue._attachCancellationCallback(this);
    }
    this._initialValue = initialValue;
    this._currentCancellable = null;
    if(_each === INTERNAL) {
        this._eachValues = Array(this._length);
    } else if (_each === 0) {
        this._eachValues = null;
    } else {
        this._eachValues = undefined;
    }
    this._promise._captureStackTrace();
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._gotAccum = function(accum) {
    if (this._eachValues !== undefined && 
        this._eachValues !== null && 
        accum !== INTERNAL) {
        this._eachValues.push(accum);
    }
};

ReductionPromiseArray.prototype._eachComplete = function(value) {
    if (this._eachValues !== null) {
        this._eachValues.push(value);
    }
    return this._eachValues;
};

ReductionPromiseArray.prototype._init = function() {};

ReductionPromiseArray.prototype._resolveEmptyArray = function() {
    this._resolve(this._eachValues !== undefined ? this._eachValues
                                                 : this._initialValue);
};

ReductionPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

ReductionPromiseArray.prototype._resolve = function(value) {
    this._promise._resolveCallback(value);
    this._values = null;
};

ReductionPromiseArray.prototype._resultCancelled = function(sender) {
    if (sender === this._initialValue) return this._cancel();
    if (this._isResolved()) return;
    this._resultCancelled$();
    if (this._currentCancellable instanceof Promise) {
        this._currentCancellable.cancel();
    }
    if (this._initialValue instanceof Promise) {
        this._initialValue.cancel();
    }
};

ReductionPromiseArray.prototype._iterate = function (values) {
    this._values = values;
    var value;
    var i;
    var length = values.length;
    if (this._initialValue !== undefined) {
        value = this._initialValue;
        i = 0;
    } else {
        value = Promise.resolve(values[0]);
        i = 1;
    }

    this._currentCancellable = value;

    if (!value.isRejected()) {
        for (; i < length; ++i) {
            var ctx = {
                accum: null,
                value: values[i],
                index: i,
                length: length,
                array: this
            };
            value = value._then(gotAccum, undefined, undefined, ctx, undefined);
        }
    }

    if (this._eachValues !== undefined) {
        value = value
            ._then(this._eachComplete, undefined, undefined, this, undefined);
    }
    value._then(completed, completed, undefined, value, this);
};

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};

function completed(valueOrReason, array) {
    if (this.isFulfilled()) {
        array._resolve(valueOrReason);
    } else {
        array._reject(valueOrReason);
    }
}

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

function gotAccum(accum) {
    this.accum = accum;
    this.array._gotAccum(accum);
    var value = tryConvertToPromise(this.value, this.array._promise);
    if (value instanceof Promise) {
        this.array._currentCancellable = value;
        return value._then(gotValue, undefined, undefined, this, undefined);
    } else {
        return gotValue.call(this, value);
    }
}

function gotValue(value) {
    var array = this.array;
    var promise = array._promise;
    var fn = tryCatch(array._fn);
    promise._pushContext();
    var ret;
    if (array._eachValues !== undefined) {
        ret = fn.call(promise._boundValue(), value, this.index, this.length);
    } else {
        ret = fn.call(promise._boundValue(),
                              this.accum, value, this.index, this.length);
    }
    if (ret instanceof Promise) {
        array._currentCancellable = ret;
    }
    var promiseCreated = promise._popContext();
    debug.checkForgottenReturns(
        ret,
        promiseCreated,
        array._eachValues !== undefined ? "Promise.each" : "Promise.reduce",
        promise
    );
    return ret;
}
};

},{"./util":36}],29:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var schedule;
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var NativePromise = util.getNativePromise();
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if (typeof NativePromise === "function" &&
           typeof NativePromise.resolve === "function") {
    var nativePromise = NativePromise.resolve();
    schedule = function(fn) {
        nativePromise.then(fn);
    };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            (window.navigator.standalone || window.cordova))) {
    schedule = (function() {
        var div = document.createElement("div");
        var opts = {attributes: true};
        var toggleScheduled = false;
        var div2 = document.createElement("div");
        var o2 = new MutationObserver(function() {
            div.classList.toggle("foo");
            toggleScheduled = false;
        });
        o2.observe(div2, opts);

        var scheduleToggle = function() {
            if (toggleScheduled) return;
                toggleScheduled = true;
                div2.classList.toggle("foo");
            };

            return function schedule(fn) {
            var o = new MutationObserver(function() {
                o.disconnect();
                fn();
            });
            o.observe(div, opts);
            scheduleToggle();
        };
    })();
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

},{"./util":36}],30:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray, debug) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 33554432;
    ret._settledValueField = value;
    return this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 16777216;
    ret._settledValueField = reason;
    return this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    debug.deprecated(".settle()", ".reflect()");
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return Promise.settle(this);
};
};

},{"./util":36}],31:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util");
var RangeError = _dereq_("./errors").RangeError;
var AggregateError = _dereq_("./errors").AggregateError;
var isArray = util.isArray;
var CANCELLATION = {};


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
        return true;
    }
    return false;

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    return this._checkOutcome();
};

SomePromiseArray.prototype._promiseCancelled = function () {
    if (this._values instanceof Promise || this._values == null) {
        return this._cancel();
    }
    this._addRejected(CANCELLATION);
    return this._checkOutcome();
};

SomePromiseArray.prototype._checkOutcome = function() {
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            if (this._values[i] !== CANCELLATION) {
                e.push(this._values[i]);
            }
        }
        if (e.length > 0) {
            this._reject(e);
        } else {
            this._cancel();
        }
        return true;
    }
    return false;
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors":12,"./util":36}],32:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValueField = promise._isFateSealed()
            ? promise._settledValue() : undefined;
    }
    else {
        this._bitField = 0;
        this._settledValueField = undefined;
    }
}

PromiseInspection.prototype._settledValue = function() {
    return this._settledValueField;
};

var value = PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var reason = PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
    return (this._bitField & 33554432) !== 0;
};

var isRejected = PromiseInspection.prototype.isRejected = function () {
    return (this._bitField & 16777216) !== 0;
};

var isPending = PromiseInspection.prototype.isPending = function () {
    return (this._bitField & 50397184) === 0;
};

var isResolved = PromiseInspection.prototype.isResolved = function () {
    return (this._bitField & 50331648) !== 0;
};

PromiseInspection.prototype.isCancelled = function() {
    return (this._bitField & 8454144) !== 0;
};

Promise.prototype.__isCancelled = function() {
    return (this._bitField & 65536) === 65536;
};

Promise.prototype._isCancelled = function() {
    return this._target().__isCancelled();
};

Promise.prototype.isCancelled = function() {
    return (this._target()._bitField & 8454144) !== 0;
};

Promise.prototype.isPending = function() {
    return isPending.call(this._target());
};

Promise.prototype.isRejected = function() {
    return isRejected.call(this._target());
};

Promise.prototype.isFulfilled = function() {
    return isFulfilled.call(this._target());
};

Promise.prototype.isResolved = function() {
    return isResolved.call(this._target());
};

Promise.prototype.value = function() {
    return value.call(this._target());
};

Promise.prototype.reason = function() {
    var target = this._target();
    target._unsetRejectionIsUnhandled();
    return reason.call(target);
};

Promise.prototype._value = function() {
    return this._settledValue();
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue();
};

Promise.PromiseInspection = PromiseInspection;
};

},{}],33:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) return obj;
        var then = getThen(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            if (isAnyBluebirdPromise(obj)) {
                var ret = new Promise(INTERNAL);
                obj._then(
                    ret._fulfill,
                    ret._reject,
                    undefined,
                    ret,
                    null
                );
                return ret;
            }
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function doGetThen(obj) {
    return obj.then;
}

function getThen(obj) {
    try {
        return doGetThen(obj);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    try {
        return hasProp.call(obj, "_promise0");
    } catch (e) {
        return false;
    }
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x, resolve, reject);
    synchronous = false;

    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolve(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function reject(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util":36}],34:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, debug) {
var util = _dereq_("./util");
var TimeoutError = Promise.TimeoutError;

function HandleWrapper(handle)  {
    this.handle = handle;
}

HandleWrapper.prototype._resultCancelled = function() {
    clearTimeout(this.handle);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (ms, value) {
    var ret;
    var handle;
    if (value !== undefined) {
        ret = Promise.resolve(value)
                ._then(afterValue, null, null, ms, undefined);
        if (debug.cancellation() && value instanceof Promise) {
            ret._setOnCancel(value);
        }
    } else {
        ret = new Promise(INTERNAL);
        handle = setTimeout(function() { ret._fulfill(); }, +ms);
        if (debug.cancellation()) {
            ret._setOnCancel(new HandleWrapper(handle));
        }
        ret._captureStackTrace();
    }
    ret._setAsyncGuaranteed();
    return ret;
};

Promise.prototype.delay = function (ms) {
    return delay(ms, this);
};

var afterTimeout = function (promise, message, parent) {
    var err;
    if (typeof message !== "string") {
        if (message instanceof Error) {
            err = message;
        } else {
            err = new TimeoutError("operation timed out");
        }
    } else {
        err = new TimeoutError(message);
    }
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._reject(err);

    if (parent != null) {
        parent.cancel();
    }
};

function successClear(value) {
    clearTimeout(this.handle);
    return value;
}

function failureClear(reason) {
    clearTimeout(this.handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret, parent;

    var handleWrapper = new HandleWrapper(setTimeout(function timeoutTimeout() {
        if (ret.isPending()) {
            afterTimeout(ret, message, parent);
        }
    }, ms));

    if (debug.cancellation()) {
        parent = this.then();
        ret = parent._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
        ret._setOnCancel(handleWrapper);
    } else {
        ret = this._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
    }

    return ret;
};

};

},{"./util":36}],35:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext, INTERNAL, debug) {
    var util = _dereq_("./util");
    var TypeError = _dereq_("./errors").TypeError;
    var inherits = _dereq_("./util").inherits;
    var errorObj = util.errorObj;
    var tryCatch = util.tryCatch;
    var NULL = {};

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = new Promise(INTERNAL);
        function iterator() {
            if (i >= len) return ret._fulfill();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret;
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return NULL;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== NULL
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    function ResourceList(length) {
        this.length = length;
        this.promise = null;
        this[length-1] = null;
    }

    ResourceList.prototype._resultCancelled = function() {
        var len = this.length;
        for (var i = 0; i < len; ++i) {
            var item = this[i];
            if (item instanceof Promise) {
                item.cancel();
            }
        }
    };

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") {
            return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var input;
        var spreadArgs = true;
        if (len === 2 && Array.isArray(arguments[0])) {
            input = arguments[0];
            len = input.length;
            spreadArgs = false;
        } else {
            input = arguments;
            len--;
        }
        var resources = new ResourceList(len);
        for (var i = 0; i < len; ++i) {
            var resource = input[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var reflectedResources = new Array(resources.length);
        for (var i = 0; i < reflectedResources.length; ++i) {
            reflectedResources[i] = Promise.resolve(resources[i]).reflect();
        }

        var resultPromise = Promise.all(reflectedResources)
            .then(function(inspections) {
                for (var i = 0; i < inspections.length; ++i) {
                    var inspection = inspections[i];
                    if (inspection.isRejected()) {
                        errorObj.e = inspection.error();
                        return errorObj;
                    } else if (!inspection.isFulfilled()) {
                        resultPromise.cancel();
                        return;
                    }
                    inspections[i] = inspection.value();
                }
                promise._pushContext();

                fn = tryCatch(fn);
                var ret = spreadArgs
                    ? fn.apply(undefined, inspections) : fn(inspections);
                var promiseCreated = promise._popContext();
                debug.checkForgottenReturns(
                    ret, promiseCreated, "Promise.using", promise);
                return ret;
            });

        var promise = resultPromise.lastly(function() {
            var inspection = new Promise.PromiseInspection(resultPromise);
            return dispose(resources, inspection);
        });
        resources.promise = promise;
        promise._setOnCancel(resources);
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 131072;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 131072) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~131072);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors":12,"./util":36}],36:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var canEvaluate = typeof navigator == "undefined";

var errorObj = {e: {}};
var tryCatchTarget;
var globalObject = typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window :
    typeof global !== "undefined" ? global :
    this !== undefined ? this : null;

function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return typeof value === "function" ||
           typeof value === "object" && value !== null;
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function FakeConstructor() {}
    FakeConstructor.prototype = obj;
    var l = 8;
    while (l--) new FakeConstructor();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function isError(obj) {
    return obj !== null &&
           typeof obj === "object" &&
           typeof obj.message === "string" &&
           typeof obj.name === "string";
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return isError(obj) && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var asArray = function(v) {
    if (es5.isArray(v)) {
        return v;
    }
    return null;
};

if (typeof Symbol !== "undefined" && Symbol.iterator) {
    var ArrayFrom = typeof Array.from === "function" ? function(v) {
        return Array.from(v);
    } : function(v) {
        var ret = [];
        var it = v[Symbol.iterator]();
        var itResult;
        while (!((itResult = it.next()).done)) {
            ret.push(itResult.value);
        }
        return ret;
    };

    asArray = function(v) {
        if (es5.isArray(v)) {
            return v;
        } else if (v != null && typeof v[Symbol.iterator] === "function") {
            return ArrayFrom(v);
        }
        return null;
    };
}

var isNode = typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]";

var hasEnvVariables = typeof process !== "undefined" &&
    typeof process.env !== "undefined";

function env(key) {
    return hasEnvVariables ? process.env[key] : undefined;
}

function getNativePromise() {
    if (typeof Promise === "function") {
        try {
            var promise = new Promise(function(){});
            if ({}.toString.call(promise) === "[object Promise]") {
                return Promise;
            }
        } catch (e) {}
    }
}

function domainBind(self, cb) {
    return self.bind(cb);
}

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    asArray: asArray,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    isError: isError,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    hasDevTools: typeof chrome !== "undefined" && chrome &&
                 typeof chrome.loadTimes === "function",
    isNode: isNode,
    hasEnvVariables: hasEnvVariables,
    env: env,
    global: globalObject,
    getNativePromise: getNativePromise,
    domainBind: domainBind
};
ret.isRecentNode = ret.isNode && (function() {
    var version = process.versions.node.split(".").map(Number);
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5":13}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":19}],19:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],20:[function(require,module,exports){
(function (process){
module.exports = process.env.MEDIATOR_JS_COV
  ? require('./lib-cov/mediator')
  : require('./lib/mediator');

}).call(this,require('_process'))
},{"./lib-cov/mediator":21,"./lib/mediator":22,"_process":19}],21:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
try {
  if (typeof top === 'object' && top !== null && typeof top.opener === 'object' && top.opener !== null) {
    // this is a browser window that was opened from another window

    if (! top.opener._$jscoverage) {
      top.opener._$jscoverage = {};
    }
  }
}
catch (e) {}

try {
  if (typeof top === 'object' && top !== null) {
    // this is a browser window

    try {
      if (typeof top.opener === 'object' && top.opener !== null && top.opener._$jscoverage) {
        top._$jscoverage = top.opener._$jscoverage;
      }
    }
    catch (e) {}

    if (! top._$jscoverage) {
      top._$jscoverage = {};
    }
  }
}
catch (e) {}

try {
  if (typeof top === 'object' && top !== null && top._$jscoverage) {
    _$jscoverage = top._$jscoverage;
  }
}
catch (e) {}
if (typeof _$jscoverage !== 'object') {
  _$jscoverage = {};
}
if (! _$jscoverage['mediator.js']) {
  _$jscoverage['mediator.js'] = [];
  _$jscoverage['mediator.js'][16] = 0;
  _$jscoverage['mediator.js'][17] = 0;
  _$jscoverage['mediator.js'][19] = 0;
  _$jscoverage['mediator.js'][21] = 0;
  _$jscoverage['mediator.js'][22] = 0;
  _$jscoverage['mediator.js'][24] = 0;
  _$jscoverage['mediator.js'][26] = 0;
  _$jscoverage['mediator.js'][30] = 0;
  _$jscoverage['mediator.js'][33] = 0;
  _$jscoverage['mediator.js'][39] = 0;
  _$jscoverage['mediator.js'][40] = 0;
  _$jscoverage['mediator.js'][41] = 0;
  _$jscoverage['mediator.js'][44] = 0;
  _$jscoverage['mediator.js'][52] = 0;
  _$jscoverage['mediator.js'][53] = 0;
  _$jscoverage['mediator.js'][54] = 0;
  _$jscoverage['mediator.js'][57] = 0;
  _$jscoverage['mediator.js'][58] = 0;
  _$jscoverage['mediator.js'][59] = 0;
  _$jscoverage['mediator.js'][60] = 0;
  _$jscoverage['mediator.js'][61] = 0;
  _$jscoverage['mediator.js'][64] = 0;
  _$jscoverage['mediator.js'][70] = 0;
  _$jscoverage['mediator.js'][71] = 0;
  _$jscoverage['mediator.js'][72] = 0;
  _$jscoverage['mediator.js'][73] = 0;
  _$jscoverage['mediator.js'][74] = 0;
  _$jscoverage['mediator.js'][75] = 0;
  _$jscoverage['mediator.js'][82] = 0;
  _$jscoverage['mediator.js'][83] = 0;
  _$jscoverage['mediator.js'][84] = 0;
  _$jscoverage['mediator.js'][87] = 0;
  _$jscoverage['mediator.js'][88] = 0;
  _$jscoverage['mediator.js'][89] = 0;
  _$jscoverage['mediator.js'][90] = 0;
  _$jscoverage['mediator.js'][91] = 0;
  _$jscoverage['mediator.js'][100] = 0;
  _$jscoverage['mediator.js'][102] = 0;
  _$jscoverage['mediator.js'][104] = 0;
  _$jscoverage['mediator.js'][108] = 0;
  _$jscoverage['mediator.js'][110] = 0;
  _$jscoverage['mediator.js'][111] = 0;
  _$jscoverage['mediator.js'][113] = 0;
  _$jscoverage['mediator.js'][115] = 0;
  _$jscoverage['mediator.js'][118] = 0;
  _$jscoverage['mediator.js'][120] = 0;
  _$jscoverage['mediator.js'][127] = 0;
  _$jscoverage['mediator.js'][131] = 0;
  _$jscoverage['mediator.js'][134] = 0;
  _$jscoverage['mediator.js'][135] = 0;
  _$jscoverage['mediator.js'][136] = 0;
  _$jscoverage['mediator.js'][146] = 0;
  _$jscoverage['mediator.js'][150] = 0;
  _$jscoverage['mediator.js'][151] = 0;
  _$jscoverage['mediator.js'][152] = 0;
  _$jscoverage['mediator.js'][154] = 0;
  _$jscoverage['mediator.js'][157] = 0;
  _$jscoverage['mediator.js'][158] = 0;
  _$jscoverage['mediator.js'][159] = 0;
  _$jscoverage['mediator.js'][161] = 0;
  _$jscoverage['mediator.js'][162] = 0;
  _$jscoverage['mediator.js'][166] = 0;
  _$jscoverage['mediator.js'][170] = 0;
  _$jscoverage['mediator.js'][174] = 0;
  _$jscoverage['mediator.js'][178] = 0;
  _$jscoverage['mediator.js'][180] = 0;
  _$jscoverage['mediator.js'][183] = 0;
  _$jscoverage['mediator.js'][184] = 0;
  _$jscoverage['mediator.js'][185] = 0;
  _$jscoverage['mediator.js'][189] = 0;
  _$jscoverage['mediator.js'][190] = 0;
  _$jscoverage['mediator.js'][191] = 0;
  _$jscoverage['mediator.js'][192] = 0;
  _$jscoverage['mediator.js'][201] = 0;
  _$jscoverage['mediator.js'][207] = 0;
  _$jscoverage['mediator.js'][208] = 0;
  _$jscoverage['mediator.js'][209] = 0;
  _$jscoverage['mediator.js'][210] = 0;
  _$jscoverage['mediator.js'][211] = 0;
  _$jscoverage['mediator.js'][212] = 0;
  _$jscoverage['mediator.js'][213] = 0;
  _$jscoverage['mediator.js'][216] = 0;
  _$jscoverage['mediator.js'][217] = 0;
  _$jscoverage['mediator.js'][221] = 0;
  _$jscoverage['mediator.js'][222] = 0;
  _$jscoverage['mediator.js'][224] = 0;
  _$jscoverage['mediator.js'][225] = 0;
  _$jscoverage['mediator.js'][227] = 0;
  _$jscoverage['mediator.js'][232] = 0;
  _$jscoverage['mediator.js'][233] = 0;
  _$jscoverage['mediator.js'][236] = 0;
  _$jscoverage['mediator.js'][240] = 0;
  _$jscoverage['mediator.js'][241] = 0;
  _$jscoverage['mediator.js'][242] = 0;
  _$jscoverage['mediator.js'][245] = 0;
  _$jscoverage['mediator.js'][251] = 0;
  _$jscoverage['mediator.js'][257] = 0;
  _$jscoverage['mediator.js'][262] = 0;
  _$jscoverage['mediator.js'][263] = 0;
  _$jscoverage['mediator.js'][266] = 0;
  _$jscoverage['mediator.js'][267] = 0;
  _$jscoverage['mediator.js'][269] = 0;
  _$jscoverage['mediator.js'][270] = 0;
  _$jscoverage['mediator.js'][273] = 0;
  _$jscoverage['mediator.js'][277] = 0;
  _$jscoverage['mediator.js'][287] = 0;
  _$jscoverage['mediator.js'][289] = 0;
  _$jscoverage['mediator.js'][290] = 0;
  _$jscoverage['mediator.js'][292] = 0;
  _$jscoverage['mediator.js'][302] = 0;
  _$jscoverage['mediator.js'][303] = 0;
  _$jscoverage['mediator.js'][305] = 0;
  _$jscoverage['mediator.js'][312] = 0;
  _$jscoverage['mediator.js'][319] = 0;
  _$jscoverage['mediator.js'][328] = 0;
  _$jscoverage['mediator.js'][331] = 0;
  _$jscoverage['mediator.js'][333] = 0;
  _$jscoverage['mediator.js'][338] = 0;
  _$jscoverage['mediator.js'][339] = 0;
  _$jscoverage['mediator.js'][340] = 0;
  _$jscoverage['mediator.js'][341] = 0;
  _$jscoverage['mediator.js'][342] = 0;
  _$jscoverage['mediator.js'][346] = 0;
  _$jscoverage['mediator.js'][347] = 0;
  _$jscoverage['mediator.js'][348] = 0;
}
_$jscoverage['mediator.js'].source = ["/*jslint bitwise: true, nomen: true, plusplus: true, white: true */","","/*!","* Mediator.js Library v0.9.0","* https://github.com/ajacksified/Mediator.js","*","* Copyright 2013, Jack Lawson","* MIT Licensed (http://www.opensource.org/licenses/mit-license.php)","*","* For more information: http://thejacklawson.com/2011/06/mediators-for-modularized-asynchronous-programming-in-javascript/index.html","* Project on GitHub: https://github.com/ajacksified/Mediator.js","*","* Last update: Jan 04 2013","*/","","(function(root, factory) {","  'use strict';","","  if(typeof root.exports === 'function') {","    // Node/CommonJS","    root.exports.Mediator = factory();","  } else if(typeof root.define === 'function' &amp;&amp; root.define.amd) {","    // AMD","    root.define([], function() {","      // Export to global too, for backward compatiblity","      root.Mediator = factory();","    });","  } else {","    // Browser global","    root.Mediator = factory();","  }","}(this, function() {","  'use strict';","","  // We'll generate guids for class instances for easy referencing later on.","  // Subscriber instances will have an id that can be refernced for quick","  // lookups.","","  function guidGenerator() {","    var S4 = function() {","       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);","    };","","    return (S4()+S4()+\"-\"+S4()+\"-\"+S4()+\"-\"+S4()+\"-\"+S4()+S4()+S4());","  }","","  // Subscribers are instances of Mediator Channel registrations. We generate","  // an object instance so that it can be updated later on without having to","  // unregister and re-register. Subscribers are constructed with a function","  // to be called, options object, and context.","","  function Subscriber(fn, options, context){","    if(!(this instanceof Subscriber)) {","      return new Subscriber(fn, options, context);","    }","","    this.id = guidGenerator();","    this.fn = fn;","    this.options = options;","    this.context = context;","    this.channel = null;","  }","","  Subscriber.prototype = {","    // Mediator.update on a subscriber instance can update its function,context,","    // or options object. It takes in an object and looks for fn, context, or","    // options keys.","","    update: function(options){","      if(options){","        this.fn = options.fn || this.fn;","        this.context = options.context || this.context;","        this.options = options.options || this.options;","        if(this.channel &amp;&amp; this.options &amp;&amp; this.options.priority !== undefined) {","            this.channel.setPriority(this.id, this.options.priority);","        }","      }","    }","  };","","","  function Channel(namespace, parent){","    if(!(this instanceof Channel)) {","      return new Channel(namespace);","    }","","    this.namespace = namespace || \"\";","    this._subscribers = [];","    this._channels = [];","    this._parent = parent;","    this.stopped = false;","  }","","  // A Mediator channel holds a list of sub-channels and subscribers to be fired","  // when Mediator.publish is called on the Mediator instance. It also contains","  // some methods to manipulate its lists of data; only setPriority and","  // StopPropagation are meant to be used. The other methods should be accessed","  // through the Mediator instance.","","  Channel.prototype = {","    addSubscriber: function(fn, options, context){","      var subscriber = new Subscriber(fn, options, context);","","      if(options &amp;&amp; options.priority !== undefined){","        // Cheap hack to either parse as an int or turn it into 0. Runs faster","        // in many browsers than parseInt with the benefit that it won't","        // return a NaN.","        options.priority = options.priority &gt;&gt; 0;","","        if(options.priority &lt; 0){ options.priority = 0; }","        if(options.priority &gt;= this._subscribers.length){ options.priority = this._subscribers.length-1; }","","        this._subscribers.splice(options.priority, 0, subscriber);","      }else{","        this._subscribers.push(subscriber);","      }","","      subscriber.channel = this;","","      return subscriber;","    },","","    // The channel instance is passed as an argument to the mediator subscriber,","    // and further subscriber propagation can be called with","    // channel.StopPropagation().","    stopPropagation: function(){","      this.stopped = true;","    },","","    getSubscriber: function(identifier){","      var x = 0,","          y = this._subscribers.length;","","      for(x, y; x &lt; y; x++){","        if(this._subscribers[x].id === identifier || this._subscribers[x].fn === identifier){","          return this._subscribers[x];","        }","      }","    },","","    // Channel.setPriority is useful in updating the order in which Subscribers","    // are called, and takes an identifier (subscriber id or named function) and","    // an array index. It will not search recursively through subchannels.","","    setPriority: function(identifier, priority){","      var oldIndex = 0,","          x = 0,","          sub, firstHalf, lastHalf, y;","","      for(x = 0, y = this._subscribers.length; x &lt; y; x++){","        if(this._subscribers[x].id === identifier || this._subscribers[x].fn === identifier){","          break;","        }","        oldIndex ++;","      }","","      sub = this._subscribers[oldIndex];","      firstHalf = this._subscribers.slice(0, oldIndex);","      lastHalf = this._subscribers.slice(oldIndex+1);","","      this._subscribers = firstHalf.concat(lastHalf);","      this._subscribers.splice(priority, 0, sub);","    },","","    addChannel: function(channel){","      this._channels[channel] = new Channel((this.namespace ? this.namespace + ':' : '') + channel, this);","    },","","    hasChannel: function(channel){","      return this._channels.hasOwnProperty(channel);","    },","","    returnChannel: function(channel){","      return this._channels[channel];","    },","","    removeSubscriber: function(identifier){","      var x = 0,","          y;","          y = this._subscribers.length;","","      // If we don't pass in an id, we're clearing all","      if(!identifier){","        this._subscribers = [];","        return;","      }","","      // Going backwards makes splicing a whole lot easier.","      for(x, y; y &gt; x; y--) {","        if(this._subscribers[x].fn === identifier || this._subscribers[x].id === identifier){","          this._subscribers[x].channel = null;","          this._subscribers.splice(x,1);","        }","      }","    },","","    // This will publish arbitrary arguments to a subscriber and then to parent","    // channels.","","    publish: function(data){","      var x = 0,","          y = this._subscribers.length,","          called = false,","          subscriber, l;","","      // Priority is preserved in the _subscribers index.","      for(x, y; x &lt; y; x++) {","        if(!this.stopped){","          subscriber = this._subscribers[x];","          if(subscriber.options !== undefined &amp;&amp; typeof subscriber.options.predicate === \"function\"){","            if(subscriber.options.predicate.apply(subscriber.context, data)){","              subscriber.fn.apply(subscriber.context, data);","              called = true;","            }","          }else{","            subscriber.fn.apply(subscriber.context, data);","            called = true;","          }","        }","","        if(called &amp;&amp; subscriber.options &amp;&amp; subscriber.options !== undefined){","          subscriber.options.calls--;","","          if(subscriber.options.calls &lt; 1){","            this.removeSubscriber(subscriber.id);","          }else{","            subscriber.update(subscriber.options);","          }","        }","      }","","      if(this._parent){","        this._parent.publish(data);","      }","","      this.stopped = false;","    }","  };","","  function Mediator() {","    if(!(this instanceof Mediator)) {","      return new Mediator();","    }","","    this._channels = new Channel('');","  }","","  // A Mediator instance is the interface through which events are registered","  // and removed from publish channels.","","  Mediator.prototype = {","","    // Returns a channel instance based on namespace, for example","    // application:chat:message:received","","    getChannel: function(namespace){","      var channel = this._channels,","          namespaceHierarchy = namespace.split(':'),","          x = 0, ","          y = namespaceHierarchy.length;","","      if(namespace === ''){","        return channel;","      }","","      if(namespaceHierarchy.length &gt; 0){","        for(x, y; x &lt; y; x++){","","          if(!channel.hasChannel(namespaceHierarchy[x])){","            channel.addChannel(namespaceHierarchy[x]);","          }","","          channel = channel.returnChannel(namespaceHierarchy[x]);","        }","      }","","      return channel;","    },","","    // Pass in a channel namespace, function to be called, options, and context","    // to call the function in to Subscribe. It will create a channel if one","    // does not exist. Options can include a predicate to determine if it","    // should be called (based on the data published to it) and a priority","    // index.","","    subscribe: function(channelName, fn, options, context){","      var channel = this.getChannel(channelName);","","      options = options || {};","      context = context || {};","","      return channel.addSubscriber(fn, options, context);","    },","","    // Pass in a channel namespace, function to be called, options, and context","    // to call the function in to Subscribe. It will create a channel if one","    // does not exist. Options can include a predicate to determine if it","    // should be called (based on the data published to it) and a priority","    // index.","","    once: function(channelName, fn, options, context){","      options = options || {};","      options.calls = 1;","","      return this.subscribe(channelName, fn, options, context);","    },","","    // Returns a subscriber for a given subscriber id / named function and","    // channel namespace","","    getSubscriber: function(identifier, channel){","      return this.getChannel(channel || \"\").getSubscriber(identifier);","    },","","    // Remove a subscriber from a given channel namespace recursively based on","    // a passed-in subscriber id or named function.","","    remove: function(channelName, identifier){","      this.getChannel(channelName).removeSubscriber(identifier);","    },","","    // Publishes arbitrary data to a given channel namespace. Channels are","    // called recursively downwards; a post to application:chat will post to","    // application:chat:receive and application:chat:derp:test:beta:bananas.","    // Called using Mediator.publish(\"application:chat\", [ args ]);","","    publish: function(channelName){","      var args = Array.prototype.slice.call(arguments, 1),","          channel = this.getChannel(channelName);","","      args.push(channel);","","      this.getChannel(channelName).publish(args);","    }","  };","","  // Alias some common names for easy interop","  Mediator.prototype.on = Mediator.prototype.subscribe;","  Mediator.prototype.bind = Mediator.prototype.subscribe;","  Mediator.prototype.emit = Mediator.prototype.publish;","  Mediator.prototype.trigger = Mediator.prototype.publish;","  Mediator.prototype.off = Mediator.prototype.remove;","","  // Finally, expose it all.","","  Mediator.Channel = Channel;","  Mediator.Subscriber = Subscriber;","  return Mediator;","}));"];
_$jscoverage['mediator.js'][16]++;
(function (root, factory) {
  _$jscoverage['mediator.js'][17]++;
  "use strict";
  _$jscoverage['mediator.js'][19]++;
  if (((typeof root.exports) === "function")) {
    _$jscoverage['mediator.js'][21]++;
    root.exports.Mediator = factory();
  }
  else {
    _$jscoverage['mediator.js'][22]++;
    if ((((typeof root.define) === "function") && root.define.amd)) {
      _$jscoverage['mediator.js'][24]++;
      root.define([], (function () {
  _$jscoverage['mediator.js'][26]++;
  root.Mediator = factory();
}));
    }
    else {
      _$jscoverage['mediator.js'][30]++;
      root.Mediator = factory();
    }
  }
})(this, (function () {
  _$jscoverage['mediator.js'][33]++;
  "use strict";
  _$jscoverage['mediator.js'][39]++;
  function guidGenerator() {
    _$jscoverage['mediator.js'][40]++;
    var S4 = (function () {
  _$jscoverage['mediator.js'][41]++;
  return (((1 + Math.random()) * 65536) | 0).toString(16).substring(1);
});
    _$jscoverage['mediator.js'][44]++;
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
  _$jscoverage['mediator.js'][52]++;
  function Subscriber(fn, options, context) {
    _$jscoverage['mediator.js'][53]++;
    if ((! (this instanceof Subscriber))) {
      _$jscoverage['mediator.js'][54]++;
      return new Subscriber(fn, options, context);
    }
    _$jscoverage['mediator.js'][57]++;
    this.id = guidGenerator();
    _$jscoverage['mediator.js'][58]++;
    this.fn = fn;
    _$jscoverage['mediator.js'][59]++;
    this.options = options;
    _$jscoverage['mediator.js'][60]++;
    this.context = context;
    _$jscoverage['mediator.js'][61]++;
    this.channel = null;
}
  _$jscoverage['mediator.js'][64]++;
  Subscriber.prototype = {update: (function (options) {
  _$jscoverage['mediator.js'][70]++;
  if (options) {
    _$jscoverage['mediator.js'][71]++;
    this.fn = (options.fn || this.fn);
    _$jscoverage['mediator.js'][72]++;
    this.context = (options.context || this.context);
    _$jscoverage['mediator.js'][73]++;
    this.options = (options.options || this.options);
    _$jscoverage['mediator.js'][74]++;
    if ((this.channel && this.options && (this.options.priority !== undefined))) {
      _$jscoverage['mediator.js'][75]++;
      this.channel.setPriority(this.id, this.options.priority);
    }
  }
})};
  _$jscoverage['mediator.js'][82]++;
  function Channel(namespace, parent) {
    _$jscoverage['mediator.js'][83]++;
    if ((! (this instanceof Channel))) {
      _$jscoverage['mediator.js'][84]++;
      return new Channel(namespace);
    }
    _$jscoverage['mediator.js'][87]++;
    this.namespace = (namespace || "");
    _$jscoverage['mediator.js'][88]++;
    this._subscribers = [];
    _$jscoverage['mediator.js'][89]++;
    this._channels = [];
    _$jscoverage['mediator.js'][90]++;
    this._parent = parent;
    _$jscoverage['mediator.js'][91]++;
    this.stopped = false;
}
  _$jscoverage['mediator.js'][100]++;
  Channel.prototype = {addSubscriber: (function (fn, options, context) {
  _$jscoverage['mediator.js'][102]++;
  var subscriber = new Subscriber(fn, options, context);
  _$jscoverage['mediator.js'][104]++;
  if ((options && (options.priority !== undefined))) {
    _$jscoverage['mediator.js'][108]++;
    options.priority = (options.priority >> 0);
    _$jscoverage['mediator.js'][110]++;
    if ((options.priority < 0)) {
      _$jscoverage['mediator.js'][110]++;
      options.priority = 0;
    }
    _$jscoverage['mediator.js'][111]++;
    if ((options.priority >= this._subscribers.length)) {
      _$jscoverage['mediator.js'][111]++;
      options.priority = (this._subscribers.length - 1);
    }
    _$jscoverage['mediator.js'][113]++;
    this._subscribers.splice(options.priority, 0, subscriber);
  }
  else {
    _$jscoverage['mediator.js'][115]++;
    this._subscribers.push(subscriber);
  }
  _$jscoverage['mediator.js'][118]++;
  subscriber.channel = this;
  _$jscoverage['mediator.js'][120]++;
  return subscriber;
}), stopPropagation: (function () {
  _$jscoverage['mediator.js'][127]++;
  this.stopped = true;
}), getSubscriber: (function (identifier) {
  _$jscoverage['mediator.js'][131]++;
  var x = 0, y = this._subscribers.length;
  _$jscoverage['mediator.js'][134]++;
  for ((x, y); (x < y); (x++)) {
    _$jscoverage['mediator.js'][135]++;
    if (((this._subscribers[x].id === identifier) || (this._subscribers[x].fn === identifier))) {
      _$jscoverage['mediator.js'][136]++;
      return this._subscribers[x];
    }
}
}), setPriority: (function (identifier, priority) {
  _$jscoverage['mediator.js'][146]++;
  var oldIndex = 0, x = 0, sub, firstHalf, lastHalf, y;
  _$jscoverage['mediator.js'][150]++;
  for (((x = 0), (y = this._subscribers.length)); (x < y); (x++)) {
    _$jscoverage['mediator.js'][151]++;
    if (((this._subscribers[x].id === identifier) || (this._subscribers[x].fn === identifier))) {
      _$jscoverage['mediator.js'][152]++;
      break;
    }
    _$jscoverage['mediator.js'][154]++;
    (oldIndex++);
}
  _$jscoverage['mediator.js'][157]++;
  sub = this._subscribers[oldIndex];
  _$jscoverage['mediator.js'][158]++;
  firstHalf = this._subscribers.slice(0, oldIndex);
  _$jscoverage['mediator.js'][159]++;
  lastHalf = this._subscribers.slice((oldIndex + 1));
  _$jscoverage['mediator.js'][161]++;
  this._subscribers = firstHalf.concat(lastHalf);
  _$jscoverage['mediator.js'][162]++;
  this._subscribers.splice(priority, 0, sub);
}), addChannel: (function (channel) {
  _$jscoverage['mediator.js'][166]++;
  this._channels[channel] = new Channel(((this.namespace? (this.namespace + ":"): "") + channel), this);
}), hasChannel: (function (channel) {
  _$jscoverage['mediator.js'][170]++;
  return this._channels.hasOwnProperty(channel);
}), returnChannel: (function (channel) {
  _$jscoverage['mediator.js'][174]++;
  return this._channels[channel];
}), removeSubscriber: (function (identifier) {
  _$jscoverage['mediator.js'][178]++;
  var x = 0, y;
  _$jscoverage['mediator.js'][180]++;
  y = this._subscribers.length;
  _$jscoverage['mediator.js'][183]++;
  if ((! identifier)) {
    _$jscoverage['mediator.js'][184]++;
    this._subscribers = [];
    _$jscoverage['mediator.js'][185]++;
    return;
  }
  _$jscoverage['mediator.js'][189]++;
  for ((x, y); (y > x); (y--)) {
    _$jscoverage['mediator.js'][190]++;
    if (((this._subscribers[x].fn === identifier) || (this._subscribers[x].id === identifier))) {
      _$jscoverage['mediator.js'][191]++;
      this._subscribers[x].channel = null;
      _$jscoverage['mediator.js'][192]++;
      this._subscribers.splice(x, 1);
    }
}
}), publish: (function (data) {
  _$jscoverage['mediator.js'][201]++;
  var x = 0, y = this._subscribers.length, called = false, subscriber, l;
  _$jscoverage['mediator.js'][207]++;
  for ((x, y); (x < y); (x++)) {
    _$jscoverage['mediator.js'][208]++;
    if ((! this.stopped)) {
      _$jscoverage['mediator.js'][209]++;
      subscriber = this._subscribers[x];
      _$jscoverage['mediator.js'][210]++;
      if (((subscriber.options !== undefined) && ((typeof subscriber.options.predicate) === "function"))) {
        _$jscoverage['mediator.js'][211]++;
        if (subscriber.options.predicate.apply(subscriber.context, data)) {
          _$jscoverage['mediator.js'][212]++;
          subscriber.fn.apply(subscriber.context, data);
          _$jscoverage['mediator.js'][213]++;
          called = true;
        }
      }
      else {
        _$jscoverage['mediator.js'][216]++;
        subscriber.fn.apply(subscriber.context, data);
        _$jscoverage['mediator.js'][217]++;
        called = true;
      }
    }
    _$jscoverage['mediator.js'][221]++;
    if ((called && subscriber.options && (subscriber.options !== undefined))) {
      _$jscoverage['mediator.js'][222]++;
      (subscriber.options.calls--);
      _$jscoverage['mediator.js'][224]++;
      if ((subscriber.options.calls < 1)) {
        _$jscoverage['mediator.js'][225]++;
        this.removeSubscriber(subscriber.id);
      }
      else {
        _$jscoverage['mediator.js'][227]++;
        subscriber.update(subscriber.options);
      }
    }
}
  _$jscoverage['mediator.js'][232]++;
  if (this._parent) {
    _$jscoverage['mediator.js'][233]++;
    this._parent.publish(data);
  }
  _$jscoverage['mediator.js'][236]++;
  this.stopped = false;
})};
  _$jscoverage['mediator.js'][240]++;
  function Mediator() {
    _$jscoverage['mediator.js'][241]++;
    if ((! (this instanceof Mediator))) {
      _$jscoverage['mediator.js'][242]++;
      return new Mediator();
    }
    _$jscoverage['mediator.js'][245]++;
    this._channels = new Channel("");
}
  _$jscoverage['mediator.js'][251]++;
  Mediator.prototype = {getChannel: (function (namespace) {
  _$jscoverage['mediator.js'][257]++;
  var channel = this._channels, namespaceHierarchy = namespace.split(":"), x = 0, y = namespaceHierarchy.length;
  _$jscoverage['mediator.js'][262]++;
  if ((namespace === "")) {
    _$jscoverage['mediator.js'][263]++;
    return channel;
  }
  _$jscoverage['mediator.js'][266]++;
  if ((namespaceHierarchy.length > 0)) {
    _$jscoverage['mediator.js'][267]++;
    for ((x, y); (x < y); (x++)) {
      _$jscoverage['mediator.js'][269]++;
      if ((! channel.hasChannel(namespaceHierarchy[x]))) {
        _$jscoverage['mediator.js'][270]++;
        channel.addChannel(namespaceHierarchy[x]);
      }
      _$jscoverage['mediator.js'][273]++;
      channel = channel.returnChannel(namespaceHierarchy[x]);
}
  }
  _$jscoverage['mediator.js'][277]++;
  return channel;
}), subscribe: (function (channelName, fn, options, context) {
  _$jscoverage['mediator.js'][287]++;
  var channel = this.getChannel(channelName);
  _$jscoverage['mediator.js'][289]++;
  options = (options || {});
  _$jscoverage['mediator.js'][290]++;
  context = (context || {});
  _$jscoverage['mediator.js'][292]++;
  return channel.addSubscriber(fn, options, context);
}), once: (function (channelName, fn, options, context) {
  _$jscoverage['mediator.js'][302]++;
  options = (options || {});
  _$jscoverage['mediator.js'][303]++;
  options.calls = 1;
  _$jscoverage['mediator.js'][305]++;
  return this.subscribe(channelName, fn, options, context);
}), getSubscriber: (function (identifier, channel) {
  _$jscoverage['mediator.js'][312]++;
  return this.getChannel((channel || "")).getSubscriber(identifier);
}), remove: (function (channelName, identifier) {
  _$jscoverage['mediator.js'][319]++;
  this.getChannel(channelName).removeSubscriber(identifier);
}), publish: (function (channelName) {
  _$jscoverage['mediator.js'][328]++;
  var args = Array.prototype.slice.call(arguments, 1), channel = this.getChannel(channelName);
  _$jscoverage['mediator.js'][331]++;
  args.push(channel);
  _$jscoverage['mediator.js'][333]++;
  this.getChannel(channelName).publish(args);
})};
  _$jscoverage['mediator.js'][338]++;
  Mediator.prototype.on = Mediator.prototype.subscribe;
  _$jscoverage['mediator.js'][339]++;
  Mediator.prototype.bind = Mediator.prototype.subscribe;
  _$jscoverage['mediator.js'][340]++;
  Mediator.prototype.emit = Mediator.prototype.publish;
  _$jscoverage['mediator.js'][341]++;
  Mediator.prototype.trigger = Mediator.prototype.publish;
  _$jscoverage['mediator.js'][342]++;
  Mediator.prototype.off = Mediator.prototype.remove;
  _$jscoverage['mediator.js'][346]++;
  Mediator.Channel = Channel;
  _$jscoverage['mediator.js'][347]++;
  Mediator.Subscriber = Subscriber;
  _$jscoverage['mediator.js'][348]++;
  return Mediator;
}));

},{}],22:[function(require,module,exports){
/*jslint bitwise: true, nomen: true, plusplus: true, white: true */

/*!
* Mediator.js Library v0.9.8
* https://github.com/ajacksified/Mediator.js
*
* Copyright 2013, Jack Lawson
* MIT Licensed (http://www.opensource.org/licenses/mit-license.php)
*
* For more information: http://thejacklawson.com/2011/06/mediators-for-modularized-asynchronous-programming-in-javascript/index.html
* Project on GitHub: https://github.com/ajacksified/Mediator.js
*
* Last update: October 19 2013
*/

(function(global, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD
    define('mediator-js', [], function() {
      global.Mediator = factory();
      return global.Mediator;
    });
  } else if (typeof exports !== 'undefined') {
    // Node/CommonJS
    exports.Mediator = factory();
  } else {
    // Browser global
    global.Mediator = factory();
  }
}(this, function() {
  'use strict';

  // We'll generate guids for class instances for easy referencing later on.
  // Subscriber instances will have an id that can be refernced for quick
  // lookups.

  function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };

    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  }

  // Subscribers are instances of Mediator Channel registrations. We generate
  // an object instance so that it can be updated later on without having to
  // unregister and re-register. Subscribers are constructed with a function
  // to be called, options object, and context.

  function Subscriber(fn, options, context) {
    if (!(this instanceof Subscriber)) {
      return new Subscriber(fn, options, context);
    }

    this.id = guidGenerator();
    this.fn = fn;
    this.options = options;
    this.context = context;
    this.channel = null;
  }

  // Mediator.update on a subscriber instance can update its function,context,
  // or options object. It takes in an object and looks for fn, context, or
  // options keys.
  Subscriber.prototype.update = function(options) {
    if (options) {
      this.fn = options.fn || this.fn;
      this.context = options.context || this.context;
      this.options = options.options || this.options;
      if (this.channel && this.options && this.options.priority !== undefined) {
          this.channel.setPriority(this.id, this.options.priority);
      }
    }
  }


  function Channel(namespace, parent) {
    if (!(this instanceof Channel)) {
      return new Channel(namespace);
    }

    this.namespace = namespace || "";
    this._subscribers = [];
    this._channels = {};
    this._parent = parent;
    this.stopped = false;
  }

  // A Mediator channel holds a list of sub-channels and subscribers to be fired
  // when Mediator.publish is called on the Mediator instance. It also contains
  // some methods to manipulate its lists of data; only setPriority and
  // StopPropagation are meant to be used. The other methods should be accessed
  // through the Mediator instance.
  Channel.prototype.addSubscriber = function(fn, options, context) {
    var subscriber = new Subscriber(fn, options, context);

    if (options && options.priority !== undefined) {
      // Cheap hack to either parse as an int or turn it into 0. Runs faster
      // in many browsers than parseInt with the benefit that it won't
      // return a NaN.
      options.priority = options.priority >> 0;

      if (options.priority < 0) { options.priority = 0; }
      if (options.priority >= this._subscribers.length) { options.priority = this._subscribers.length-1; }

      this._subscribers.splice(options.priority, 0, subscriber);
    }else{
      this._subscribers.push(subscriber);
    }

    subscriber.channel = this;

    return subscriber;
  }

  // The channel instance is passed as an argument to the mediator subscriber,
  // and further subscriber propagation can be called with
  // channel.StopPropagation().
  Channel.prototype.stopPropagation = function() {
    this.stopped = true;
  }

  Channel.prototype.getSubscriber = function(identifier) {
    var x = 0,
        y = this._subscribers.length;

    for(x, y; x < y; x++) {
      if (this._subscribers[x].id === identifier || this._subscribers[x].fn === identifier) {
        return this._subscribers[x];
      }
    }
  }

  // Channel.setPriority is useful in updating the order in which Subscribers
  // are called, and takes an identifier (subscriber id or named function) and
  // an array index. It will not search recursively through subchannels.

  Channel.prototype.setPriority = function(identifier, priority) {
    var oldIndex = 0,
        x = 0,
        sub, firstHalf, lastHalf, y;

    for(x = 0, y = this._subscribers.length; x < y; x++) {
      if (this._subscribers[x].id === identifier || this._subscribers[x].fn === identifier) {
        break;
      }
      oldIndex ++;
    }

    sub = this._subscribers[oldIndex];
    firstHalf = this._subscribers.slice(0, oldIndex);
    lastHalf = this._subscribers.slice(oldIndex+1);

    this._subscribers = firstHalf.concat(lastHalf);
    this._subscribers.splice(priority, 0, sub);
  }

  Channel.prototype.addChannel = function(channel) {
    this._channels[channel] = new Channel((this.namespace ? this.namespace + ':' : '') + channel, this);
  }

  Channel.prototype.hasChannel = function(channel) {
    return this._channels.hasOwnProperty(channel);
  }

  Channel.prototype.returnChannel = function(channel) {
    return this._channels[channel];
  }

  Channel.prototype.removeSubscriber = function(identifier) {
    var x = this._subscribers.length - 1;

    // If we don't pass in an id, we're clearing all
    if (!identifier) {
      this._subscribers = [];
      return;
    }

    // Going backwards makes splicing a whole lot easier.
    for(x; x >= 0; x--) {
      if (this._subscribers[x].fn === identifier || this._subscribers[x].id === identifier) {
        this._subscribers[x].channel = null;
        this._subscribers.splice(x,1);
      }
    }
  }

    // This will publish arbitrary arguments to a subscriber and then to parent
    // channels.

  Channel.prototype.publish = function(data) {
    var x = 0,
        y = this._subscribers.length,
        shouldCall = false,
        subscriber, l,
        subsBefore,subsAfter;

    // Priority is preserved in the _subscribers index.
    for(x, y; x < y; x++) {
      // By default set the flag to false
      shouldCall = false;
      subscriber = this._subscribers[x];

      if (!this.stopped) {
        subsBefore = this._subscribers.length;
        if (subscriber.options !== undefined && typeof subscriber.options.predicate === "function") {
          if (subscriber.options.predicate.apply(subscriber.context, data)) {
            // The predicate matches, the callback function should be called
            shouldCall = true;
          }
        }else{
          // There is no predicate to match, the callback should always be called
          shouldCall = true;
        }
      }

      // Check if the callback should be called
      if (shouldCall) {
        // Check if the subscriber has options and if this include the calls options
        if (subscriber.options && subscriber.options.calls !== undefined) {
          // Decrease the number of calls left by one
          subscriber.options.calls--;
          // Once the number of calls left reaches zero or less we need to remove the subscriber
          if (subscriber.options.calls < 1) {
            this.removeSubscriber(subscriber.id);
          }
        }
        // Now we call the callback, if this in turns publishes to the same channel it will no longer
        // cause the callback to be called as we just removed it as a subscriber
        subscriber.fn.apply(subscriber.context, data);

        subsAfter = this._subscribers.length;
        y = subsAfter;
        if (subsAfter === subsBefore - 1) {
          x--;
        }
      }
    }

    if (this._parent) {
      this._parent.publish(data);
    }

    this.stopped = false;
  }

  function Mediator() {
    if (!(this instanceof Mediator)) {
      return new Mediator();
    }

    this._channels = new Channel('');
  }

  // A Mediator instance is the interface through which events are registered
  // and removed from publish channels.

  // Returns a channel instance based on namespace, for example
  // application:chat:message:received. If readOnly is true we
  // will refrain from creating non existing channels.
  Mediator.prototype.getChannel = function(namespace, readOnly) {
    var channel = this._channels,
        namespaceHierarchy = namespace.split(':'),
        x = 0,
        y = namespaceHierarchy.length;

    if (namespace === '') {
      return channel;
    }

    if (namespaceHierarchy.length > 0) {
      for(x, y; x < y; x++) {

        if (!channel.hasChannel(namespaceHierarchy[x])) {
          if (readOnly) {
            break;
          } else {
            channel.addChannel(namespaceHierarchy[x]);
          }
        }

        channel = channel.returnChannel(namespaceHierarchy[x]);
      }
    }

    return channel;
  }

  // Pass in a channel namespace, function to be called, options, and context
  // to call the function in to Subscribe. It will create a channel if one
  // does not exist. Options can include a predicate to determine if it
  // should be called (based on the data published to it) and a priority
  // index.

  Mediator.prototype.subscribe = function(channelName, fn, options, context) {
    var channel = this.getChannel(channelName || "", false);

    options = options || {};
    context = context || {};

    return channel.addSubscriber(fn, options, context);
  }

  // Pass in a channel namespace, function to be called, options, and context
  // to call the function in to Subscribe. It will create a channel if one
  // does not exist. Options can include a predicate to determine if it
  // should be called (based on the data published to it) and a priority
  // index.

  Mediator.prototype.once = function(channelName, fn, options, context) {
    options = options || {};
    options.calls = 1;

    return this.subscribe(channelName, fn, options, context);
  }

  // Returns a subscriber for a given subscriber id / named function and
  // channel namespace

  Mediator.prototype.getSubscriber = function(identifier, channelName) {
    var channel = this.getChannel(channelName || "", true);
    // We have to check if channel within the hierarchy exists and if it is
    // an exact match for the requested channel
    if (channel.namespace !== channelName) {
      return null;
    }

    return channel.getSubscriber(identifier);
  }

  // Remove a subscriber from a given channel namespace recursively based on
  // a passed-in subscriber id or named function.

  Mediator.prototype.remove = function(channelName, identifier) {
    var channel = this.getChannel(channelName || "", true);
    if (channel.namespace !== channelName) {
      return false;
    }

    channel.removeSubscriber(identifier);
  }

  // Publishes arbitrary data to a given channel namespace. Channels are
  // called recursively downwards; a post to application:chat will post to
  // application:chat:receive and application:chat:derp:test:beta:bananas.
  // Called using Mediator.publish("application:chat", [ args ]);

  Mediator.prototype.publish = function(channelName) {
    var channel = this.getChannel(channelName || "", true);
    if (channel.namespace !== channelName) {
      return null;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    args.push(channel);

    channel.publish(args);
  }

  // Alias some common names for easy interop
  Mediator.prototype.on = Mediator.prototype.subscribe;
  Mediator.prototype.bind = Mediator.prototype.subscribe;
  Mediator.prototype.emit = Mediator.prototype.publish;
  Mediator.prototype.trigger = Mediator.prototype.publish;
  Mediator.prototype.off = Mediator.prototype.remove;

  // Finally, expose it all.

  Mediator.Channel = Channel;
  Mediator.Subscriber = Subscriber;
  Mediator.version = "0.9.8";

  return Mediator;
}));

},{}]},{},[1])(1)
});