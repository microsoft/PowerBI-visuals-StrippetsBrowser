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

var $ = require('jquery');
var Base = require('./strippets.base');
var config = require('./strippets.config.js');
var Entity = require('./strippets.entity.js');

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

Sidebar.prototype.init = function($parent, data, iconmap, settings) {
    this.Settings = $.extend({}, this.defaults, settings);

    this.constructLayout($parent);
    this.constructEntities(data, iconmap);
    this.renderEntities();
};

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
        // round entityPosition to nerest multiple of the factor
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

Sidebar.prototype.constructEntities = function(data, iconmap) {
    var s = this;
    var entitysettings = s.Settings.entity;
    s.entities = data.map(function(d) {
        return new Entity(s._parentId, s.contentType, d, iconmap, entitysettings);
    });
};

Sidebar.prototype.hide = function() {
    var s = this;
    s.$sidebarEntityContainer.hide();
    return s.$sidebarContent.velocity({'width': 0}, {display: 'none'}).promise();
};

Sidebar.prototype.minimize = function() {
    var s = this;
    return s.$sidebarContent.velocity({'width': s.Settings.minimizedWidth}).promise()
        .then(function() {
            s.$sidebarEntityContainer.show();
        });
};

Sidebar.prototype.toggle = function(enablestate) {
    if (enablestate) {
        return this.minimize();
    }
    return this.hide();
};

module.exports = Sidebar;
