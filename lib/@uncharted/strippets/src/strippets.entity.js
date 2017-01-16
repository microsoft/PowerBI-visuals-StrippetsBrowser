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
