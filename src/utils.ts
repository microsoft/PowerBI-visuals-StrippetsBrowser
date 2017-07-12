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

import DataView = powerbi.DataView;
import * as _ from 'lodash';

/**
 * Default entity colors for when no colors are specified by the data
 * @type {string[]}
 */
export const COLOR_PALETTE = ['#FF001F', '#FF8000', '#AC8000', '#95AF00', '#1BBB6A', '#B44AE7', '#DB00B0'];

/**
 * Converts from RGB color space to HSL color space.
 *
 * @method toHSL
 * @param {Array} rgb - An array containing the RGB components.
 * @returns {Array}
 */
function toHSL(rgb) {
    const [r, g, b] = rgb.map(n => n / 255);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h;
    let s;
    let l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

/**
 * Converts the given hex color string to the equivalent rgba color string.
 * @param  {string}       hex     A hex color string.
 * @param  {number = 100} opacity A percentage of the opacity.
 * @return {string}               A rgba color string.
 */
export function hexToRgba(hex: string, opacity: number = 100) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

/**
 * Converts hex or rgba color to hsl color.
 *
 * @param  {string} colorString A hex or rgb(a) color string.
 * @return {Array}             An array representing hsl color, [h, s, l].
 */
export function convertToHSL(colorString: string) {
    const rgba = colorString.indexOf('#') >= 0 ? hexToRgba(colorString) : colorString;
    const [r, g, b] = rgba.substring(rgba.indexOf('(') + 1, rgba.indexOf(')')).split(',').map(n => Number(n));
    return toHSL([r, g, b]);
}

/**
 * Returns an hsl color string based on the given color, opacity, index, total number of segments, and a boolean indicating if it's highlighted.
 * Lightness of the color will be determined by segmentIndex and totalNumSegments, where a higher segmentIndex will produce a lighter color while segmentIndex < totalNumSegments.
 *
 * @param  {string}       baseColor        rgb or hex color string.
 * @param  {number = 100} opacity          Output color opacity, 0~100 in %.
 * @param  {number}       segmentIndex     The index of the segment.
 * @param  {number}       totalNumSegments The total number of segments.
 * @param  {boolean}      isHighlight      A boolean value indicating whether to generate a highlight color.
 * @return {string}                        An hsla color string.
 */
export function getSegmentColor(baseColor: string, opacity: number = 100, segmentIndex: number = 0, totalNumSegments: number = 1, isHighlight: boolean = false): string {
    const hue = convertToHSL(baseColor)[0] * 360;
    const [saturation, minLightness, maxLightness] = isHighlight
        ? [100, 50, 90]
        : [25, 30, 90];
    const lightnessRange = maxLightness - minLightness;
    const lightnessFactor = lightnessRange / totalNumSegments;
    const lightness = minLightness + (lightnessFactor * segmentIndex);
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity / 100})`;
}


/**
 * Finds and returns the dataview column(s) that matches the given data role name.
 *
 * @param  {DataView} dataView     A Powerbi dataView object.
 * @param  {string}   dataRoleName A name of the role for the columen.
 * @param  {boolean}  multi        A boolean flag indicating whether to find multiple matching columns or not           .
 * @return {any}                   A dataview table column or an array of the columns.
 */
export function findColumn(dataView: DataView, dataRoleName: string, multi?: boolean): any {
    const columns = dataView.metadata.columns;
    const result = (columns || []).filter((col: any) => col && col.roles[dataRoleName]);
    return multi
        ? (result[0] && result)
        : result[0];
}

/**
 * Check if provided dataView has all the columns with given data role names.
 *
 * @export
 * @param   {DataView} dataView      A Powerbi dataView object.
 * @param   {string[]} dataRoleNames An array of the data role names for corresponding columns.
 * @returns {boolean}                A Boolean value indicating whether the dataView has all matching columns.
 */
export function hasColumns(dataView: DataView, dataRoleNames: string[]): boolean {
    return dataRoleNames.reduce((prev, dataRoleName) => prev && findColumn(dataView, dataRoleName) !== undefined, true);
}

export function shadeColor(color, percent) {
    const f = parseInt(color.slice(1), 16),
        t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent * -1 : percent,
        R = f >> 16,
        G = f >> 8 & 0x00FF,
        B = f & 0x0000FF;
    return '#' + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
}
