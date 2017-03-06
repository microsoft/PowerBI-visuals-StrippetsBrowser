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

var Entity = require('./strippets.entity.js');
var Base = require('./strippets.base');
var Scrollable = require('@uncharted/strippets.common').scrollable;
var config = require('./strippets.config.js');
var Mediator = require('@uncharted/strippets.common').mediator;
var EntityRenderMap = require('./strippets.entity.rendermap');

var consolidationField = 'id';

/**
 * Constructor for the FeatureContent entity icon view.
 * @param {String} parentId - ID of the parent Outline
 * @param {Object} $parent - JQuery-wrapped element to which the feature content view will be appended
 * @param {Object} data - Object containing a reference to the entities to render in this view
 * @param {Array} iconmap - Array of icon info objects
 * @param {Object} settings - configuration options for the entity
 * @param {Object=} mediator - Mediator instance to use as our event bus; optional: a local one will be created if none provide
 * @returns {FeatureContent}
 * @constructor
 */
var FeatureContent = function FeatureContent(parentId, $parent, data, iconmap, settings, mediator) {
    var t = this;
    t.defaults = config.outline.maincontent;
    t._parentId = parentId;
    t.entities = [];
    t.entitiesShown = [];
    t.entityPercentageHeight = undefined;
    t.contentType = 'Feature';
    t.entityHeight = this.styles.entity.normal ? parseFloat(this.styles.entity.normal.getPropertyValue('height')) : settings.entityHeight;
    t._mediator = mediator || null;
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

var pushTypes = function (uniqueEntities, offset, types) {
    if (types.length > 1) {
        uniqueEntities[uniqueEntities.length - offset].types = _.sortBy(types, function (iteratee) {
            return iteratee.bucket ? iteratee.bucket.value : iteratee.firstPosition;
        });
    }
};

var compareEntities = function (a, b) {
    if (a.position.originalFrom === b.position.originalFrom &&
        a.entity.data.bucket && b.entity.data.bucket &&
        a.entity.data.bucket.value !== undefined && b.entity.data.bucket.value !== undefined) {
        var aLevel = a.entity.data.bucket.value;
        var bLevel = b.entity.data.bucket.value;
        return aLevel - bLevel;
    }

    return a.position.originalFrom - b.position.originalFrom;
};

var flattenEntityKey = function(key, group) {
    var result = group.entities[group.entityKeys[key][0]];
    for (var i = 1, n = group.entityKeys[key].length; i < n; ++i) {
        result.hiddenEntities.push(group.entities[group.entityKeys[key][i]]);
    }
    return result;
};

var flattenGroup = function(group) {
    var result = group.entities[0];
    for (var i = 1, n = group.entities.length; i < n; ++i) {
        result.hiddenEntities.push(group.entities[i]);
    }
    return result;
};

var addKeyToEntityMap = function(key, group, entityMap) {
    for (var i = 0, n = group.entityKeys[key].length; i < n; ++i) {
        entityMap.hiddenEntities.push(group.entities[group.entityKeys[key][i]]);
    }
};

var distributeEntities = function (processedKeys, entitiesToFit, entitiesToFitCount, currentGroup, entityMap, i) {
    if (!processedKeys[entityMap.key]) {
        processedKeys[entityMap.key] = true;
        if (entitiesToFit.length < entitiesToFitCount) {
            entitiesToFit.push(flattenEntityKey(entityMap.key, currentGroup));
        } else {
            addKeyToEntityMap(entityMap.key, currentGroup, entitiesToFit[i % entitiesToFitCount]);
        }
    }
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
            var entityGroup = _.find(entitiesRenderMap, function(map) {
                return (map.position.originalFrom <= Number(entity.data.firstPosition) &&
                    map.position.originalTo >= Number(entity.data.firstPosition)) ||
                    (map.position.originalFrom <= (Number(entity.data.firstPosition) + entityPercentageHeight) &&
                    map.position.originalTo >= (Number(entity.data.firstPosition) + entityPercentageHeight));
            });

            if (!entityGroup) {
                entityGroup = {
                    position: new EntityRenderMap(entity.data.firstPosition, entityPercentageHeight),
                    entityKeys: {},
                    entities: [],
                };
                entitiesRenderMap.push(entityGroup);
            }

            var key;
            if (entity.data.hasOwnProperty(consolidationField)) {
                key = entity.data[consolidationField];
            } else {
                key = Object.keys(entityGroup).toString();
            }

            if (!entityGroup.entityKeys[key]) {
                entityGroup.entityKeys[key] = [entityGroup.entities.length];
            } else {
                entityGroup.entityKeys[key].push(entityGroup.entities.length);
            }

            var entityMap = {
                position: new EntityRenderMap(entity.data.firstPosition, entityPercentageHeight),
                entity: entity,
                hiddenEntities: [],
                key: key,
            };

            entityGroup.entities.push(entityMap);
        });

        // second pass : try to place remaining entities if there is enough space. This can only happen if the configured threshold is greater than the size of entity.
        // first make sure that all entities are ordered in ascending position sequence (weighting could have shifted everything around previously).
        entitiesRenderMap = _.sortBy(entitiesRenderMap, function(map) {
            return map.position.originalFrom;
        });

        if (thresholdPercentageHeight >= this.entityPercentageHeight) {
            var index;
            var length = entitiesRenderMap.length;
            var list = entitiesRenderMap;
            entitiesRenderMap = [];

            for (index = 0; index < length; index++) {
                // check if there is enough space given the threshold
                var currentGroup = list[index];
                var groupKeys = Object.keys(currentGroup.entityKeys);

                // only reposition if the group has more than one entity
                if (groupKeys.length > 1) {
                    var entityToFit;
                    var entityIndex;
                    var currentEntity = currentGroup.entities[0];

                    // if we already spread some entities around, account for them
                    var beforeSpace;
                    if (index > 0) {
                        var previous = list[index - 1].entities[0];
                        var lastRepositioned = entitiesRenderMap[entitiesRenderMap.length - 1];
                        if (lastRepositioned && lastRepositioned.position.finalTo > previous.position.finalTo) {
                            previous = lastRepositioned;
                        }

                        beforeSpace = Math.min(currentEntity.position.originalFrom - previous.position.finalTo, thresholdPercentageHeight);
                    } else {
                        beforeSpace = Math.min(currentEntity.position.originalFrom, thresholdPercentageHeight);
                    }
                    var afterSpace = Math.min(index < list.length - 1 ? list[index + 1].position.originalFrom - currentEntity.position.originalTo : 1 - currentEntity.position.originalTo, thresholdPercentageHeight);

                    // get available space, which is the available space before + the available space after + the space the entity takes up.
                    var availableSpace = beforeSpace
                        + afterSpace
                        + currentEntity.position.originalTo - currentEntity.position.originalFrom;

                    // number of entities to fit is however many is allowed in the given space.
                    var entitiesToFitCount = Math.floor(availableSpace / entityPercentageHeight);
                    // only reposition if there is enough room for more than 1 entity.
                    if (entitiesToFitCount > 1) {
                        var neededSpace = entitiesToFitCount * entityPercentageHeight;
                        // starting position should be the (available space FROM) + ((Available Space - Needed Space) / 2)
                        var availableSpaceFrom = currentEntity.position.originalFrom - beforeSpace;
                        var startingFrom = availableSpaceFrom + ((availableSpace - neededSpace) / 2);

                        // determine entity positioning (weight and priority don't get taken into account here as it's just placement)
                        // find which entities should be placed separately and which ones should be merged to the top most entity
                        var processedKeys = {};
                        var entitiesToFit = [];
                        currentGroup.entities.forEach(distributeEntities.bind(null, processedKeys, entitiesToFit, entitiesToFitCount, currentGroup));

                        // update new position
                        for (entityIndex = 0; entityIndex < entitiesToFit.length; entityIndex++) {
                            entityToFit = entitiesToFit[entityIndex];
                            entityToFit.position.finalFrom = startingFrom + (entityIndex * entityPercentageHeight);
                            entitiesRenderMap.push(entityToFit);
                        }
                    } else {
                        entitiesRenderMap.push(flattenGroup(currentGroup));
                    }
                } else if (currentGroup.entities.length) {
                    entitiesRenderMap.push(flattenGroup(currentGroup));
                }
            }
        }

        $entities = entitiesRenderMap.map(function(map) {
            map.entity.setPosition(map.position.finalFrom * 100);
            if (map.hiddenEntities && map.hiddenEntities.length > 0) {
                if (map.hiddenEntities[0].entity.data.hasOwnProperty(consolidationField)) {
                    // For the Uncertainty feature,
                    // 1. consolidate adjacent entities of the same entity ID
                    var consolidatedEntities = [map].concat(map.hiddenEntities).sort(function (a, b) {
                        if (a.entity.data[consolidationField] < b.entity.data[consolidationField]) {
                            return -1;
                        }
                        if (a.entity.data[consolidationField] > b.entity.data[consolidationField]) {
                            return 1;
                        }
                        return compareEntities(a, b);
                    });
                    var consolidatedEntityCount = consolidatedEntities.length;
                    var types = [];
                    var uniqueEntities = [];
                    var i;
                    for (i = 0; i < consolidatedEntityCount; i++) {
                        if (i < 1 || consolidatedEntities[i].entity.data[consolidationField] !==
                            consolidatedEntities[i - 1].entity.data[consolidationField]) {
                            uniqueEntities.push(consolidatedEntities[i]);
                            pushTypes(uniqueEntities, 2, types);
                            types = [consolidatedEntities[i].entity.data];
                        } else {
                            types.push(consolidatedEntities[i].entity.data);
                        }
                    }

                    pushTypes(uniqueEntities, 1, types);

                    uniqueEntities.sort(compareEntities);

                    consolidatedEntityCount = uniqueEntities.length;

                    // 2. label the resulting entity with its types, in bucket order, e.g. Amazon [LOC, ORG], Samsung, ...
                    var appendTooltip = function (a, b) {
                        var result = a;
                        if (b.type !== uniqueEntities[i].entity.data.name) {
                            if (a) {
                                result += ', ';
                            }
                            result += b.type;
                        }
                        return result;
                    };

                    var tooltip = '';
                    for (i = 0; i < consolidatedEntityCount; i++) {
                        if (tooltip.length) {
                            tooltip += ', ';
                        }
                        tooltip += uniqueEntities[i].entity.data.name;

                        if (uniqueEntities[i].types && !identical(uniqueEntities[i].types, getEntityType)) {
                            tooltip += ' [' + uniqueEntities[i].types.reduce(appendTooltip, '') + ']';
                        }
                    }

                    map.entity.setAttributes({
                        'data-hidden-entities': consolidatedEntityCount > 1 ? consolidatedEntityCount : null,
                        'data-entities': tooltip,
                    });
                } else {
                    map.entity.setAttributes({
                        'data-hidden-entities': map.hiddenEntities.length,
                        'data-entities': [map].concat(map.hiddenEntities).sort(compareEntities).reduce(
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
 * Add a Mediator property to each component, so instances can be linked arbitrarily
 */
Object.defineProperty(FeatureContent.prototype, 'mediator', {
    get: function() {
        if (!this._mediator) {
            this._mediator = new Mediator();
        }
        return this._mediator;
    },

    set: function(value) {
        if (value !== this._mediator) {
            this._mediator = value;
        }
    },
});

/**
 * Register a mouse click event handler.
 */
FeatureContent.prototype.registerEvents = function() {
    var t = this;
    Scrollable.asJQueryPlugin();

    t.$mainOutlineContent.on('click', '.' + t.classes.entity.outlineentity, t, function(event) {
        var entitydata = JSON.parse($(event.target).closest('[' + t.attrs.entity + ']').attr(t.attrs.entity));
        t.mediator.publish(t.events.outline.EntityClicked, {
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
