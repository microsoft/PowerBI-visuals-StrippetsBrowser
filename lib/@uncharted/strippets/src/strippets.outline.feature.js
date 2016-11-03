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
var Scrollable = require('@uncharted/stories.common').scrollable;
var config = require('./strippets.config.js');
var mediator = require('@uncharted/stories.common').mediator;
var EntityRenderMap = require('./strippets.entity.rendermap');

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

FeatureContent.prototype.init = function($parent, data, iconmap, settings) {
    this.Settings = $.extend({}, this.defaults, settings);

    this.constructLayout($parent);
    this.constructEntities(data, iconmap);
    this.registerEvents();
};

// Initial State should be hidden.
FeatureContent.prototype.constructLayout = function($parent) {
    var s = this;
    s.$mainOutlineContent = $(s.templates.maincontent.outlineMainTemplate)
        .addClass(s.classes.maincontent.outlinemaincontent)
        .appendTo($parent);

    s.$outlineEntityContainer = $(s.templates.maincontent.entityContainerTemplate)
        .addClass(s.classes.maincontent.outlineentitycontainer)
        .appendTo(s.$mainOutlineContent);
};

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

    //var orderedEntities = (entities || this.entities).sort(function(entityA, entityB) {
    //    var pos = entityA.data.firstPosition - entityB.data.firstPosition;
    //    if (pos === 0) {
    //        pos = ((entityA.bucket && entityA.bucket.value) || 0) - ((entityB.bucket && entityB.bucket.value) || 0)
    //    }
    //
    //    return pos - entity.weight;
    //});

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

        var consolidationField = 'name'; // TODO: use 'id' once I have a dataset that uses it appropriately
        $entities = entitiesRenderMap.map(function(map) {
            map.entity.setPosition(map.position.finalFrom * 100);
            if (map.hiddenEntities && map.hiddenEntities.length > 0) {

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
                            uniqueEntities[uniqueEntities.length - 2].types = types;
                        }
                        _.sortBy(types, function (iteratee) {
                            return iteratee.bucket ? iteratee.bucket.value : iteratee.firstPosition;
                        });
                        types = [consolidatedEntities[i].entity.data];
                    }
                    else {
                        types.push(consolidatedEntities[i].entity.data)
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

                    if (uniqueEntities[i].types) {
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
                    'data-entities': map.entity.data.name,
                });
            }
            map.entity.highlight(map.entity.isHighlight);
            return map.entity.$entity;
        });
        this.$outlineEntityContainer.html($entities);
    }
};

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
            if (_.any(highlightedEntities,
                    function(he) {
                        return he.type === entity.data.type && he.name === entity.data.name;
                    })) {
                entity = $.extend(true, {}, entity);
                entity.weight = 999;
                entity.isHighlight = true;
            }
            return entity;
        });
        t.renderEntities(resolvedEntities);
    }
};

FeatureContent.prototype.constructEntities = function(data, iconmap) {
    var s = this;
    var entitysettings = s.Settings.entity;
    s.entities = data.entities.map(function(d) {
        return new Entity(s._parentId, s.contentType, d, iconmap, entitysettings);
    });
};

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

FeatureContent.prototype.hide = function() {
    var s = this;
    s.$outlineEntityContainer.hide();
    return s.$mainOutlineContent.velocity({'width': 0}, {display: 'none'}).promise();
};

FeatureContent.prototype.minimize = function() {
    var s = this;
    return s.$mainOutlineContent.velocity({'width': s.Settings.minimizedWidth}).promise()
        .then(function() {
            s.$outlineEntityContainer.show();
        });
};

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

FeatureContent.prototype.getEntityContainerHeight = function() {
    var s = this;
    return s.$outlineEntityContainer.height();
};

module.exports = FeatureContent;
