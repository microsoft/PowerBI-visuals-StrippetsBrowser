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

OutlineEntity.prototype.init = function(data, iconmap, settings) {
    this.Settings = $.extend({}, this.defaults, settings);

    this.construct(data, iconmap);
};

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

OutlineEntity.prototype.setPosition = function(positionAsPercent) {
    return this.$entity.css('top', positionAsPercent + '%');
};

OutlineEntity.prototype.setAttributes = function(attributes) {
    var t = this;
    if (attributes === Object(attributes)) {
        Object.keys(attributes).forEach(function(attribute) {
            t.$entity.attr(attribute, attributes[attribute]);
        });
    }
};

OutlineEntity.prototype.getHeight = function() {
    return this.$entity.height();
};
OutlineEntity.prototype.highlight = function(enable) {
    if (enable) {
        this.$entity.addClass('highlight');
    } else {
        this.$entity.removeClass('highlight');
    }
};
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
