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

/**
 * Convert a hierarchical icon mapping structure into a flat array
 * @param {Object} iconMappings - hierarchical mapping data structure
 * @returns {Array} Array of icon objects
 */
module.exports.flattenIconMap = function (iconMappings) {
    var iconMaps = [];
    Object.keys(iconMappings).forEach(function (entityType) {
        var icons = iconMappings[entityType];
        var imap = icons.map(function (icon) {
            return { type: entityType, 'class': icon.class, color: icon.color || null, isDefault: icon.isDefault};
        });
        iconMaps = iconMaps.concat(imap);
    });
    return iconMaps;
};

/**
 * Given an array of articles containing entities, and an icon map, associate each entity with the appropriate icon.
 * @param {Array} data - Array of article objects to render as outlines
 * @param {Array} iconMap - Array of icon info objects
 * @returns {Array} The iconMap
 */
module.exports.mapEntitiesToIconMap = function(data, iconMap) {
    var concatEntities = function (array, item) { return array.concat(item.entities); };
    var nameAndType = function (entity) { return entity.name + '&' + entity.type; };
    var toEntityReference = function (entityList) {
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
        .map(function (key) { return toEntityReference(entityGroups[key]); })
        .sort(function (entityRefA, entityRefB) {
            return entityRefB.count - entityRefA.count;
        });

    entityReferences.forEach(function (entity) {
        var entityAlreadyMapped = iconMap.some(function (icon) {
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
    return iconMap;
};
