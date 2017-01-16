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
