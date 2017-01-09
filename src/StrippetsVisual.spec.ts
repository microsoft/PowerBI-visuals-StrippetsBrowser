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

// fake powerbi functions
window['powerbi'] = {
    DataViewObjects: {
        getValue: () => undefined,
    },
    visuals: {
        valueFormatter: {
            create: (obj) => ({ format: (value) => obj.format + value }),
        },
        utility: {
            SelectionManager: function () {

            },
        }
    },
    extensibility: {
        visualApiVersions: [],
    },
};

import * as $ from 'jquery';
import * as sinon from 'sinon';
import { expect } from 'chai';
import StrippetsVisual from './StrippetsVisual';
import VisualInitOptions = powerbi.VisualInitOptions;
import VisualUpdateOptions = powerbi.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.v110.VisualConstructorOptions;
import mockDataView from './test_data/mockdataview';
import testDataValues from './test_data/testDataValues';
import DataViewObjects = powerbi.DataViewObjects;
import * as _ from 'lodash';

let testHtmlStrings = require('./test_data/testHtmlStrings.js');

// pbi wraps the categories with a "wrapCtor" that has the actual data accessors
function wrapCtor(category, values) {
    this.source = category.source;
    this.identity = [];
    this.identityFields = [];
    this.values = values || [];
}

describe('The Strippets Browser Component', function () {
    let strippets;
    let dataView;
    let values;

    function populateData(data, highlights = null) {
        dataView.categorical.categories = dataView.categorical.categories.map(function (category, index) {
            return new wrapCtor(category, data && data[index]);
        });

        if (highlights) {
            dataView.categorical.values[0].highlights = highlights;
        }
    }

    before(function() {
        const element = $('<div></div>');
        const dummyHost = {
            createSelectionManager: () => ({ hostServices: 'hostService' } as any),
        };
        strippets = new StrippetsVisual(<VisualConstructorOptions>{ element: element[0], host: dummyHost });
        values = _.cloneDeep(testDataValues);
    });

    beforeEach(() => {
        dataView = _.cloneDeep(mockDataView);
    });

    it('exists', function () {
        expect(StrippetsVisual).to.be.ok;
        expect(strippets).to.be.ok;
    });

    it('converts empty data', function () {
        populateData([]);
        const converted = StrippetsVisual.converter(dataView);
        expect(converted.items).to.be.ok;
        expect(converted.iconMap).to.be.ok;
        expect(converted.highlights).to.be.null;
    });

    it('converts normal data', function () {
        populateData(
            values.lipsum
        );
        const converted = StrippetsVisual.converter(dataView, true);
        expect(converted.items).to.be.ok;
        expect(converted.items[0].isHighlighted).to.be.false;
        expect(converted.items[0].entities.length).to.equal(4);

        expect(converted.iconMap).to.be.ok;
        expect(converted.iconMap.length).to.equal(0);

        expect(converted.highlights).to.be.null;
        // expect(converted.items[0].entities[0].bucket).to.be.ok;
        // expect(converted.items[0].entities[0].bucket.key).to.equal('Level 1');
    });

    it('converts data with highlights', function () {
        populateData(
            values.lipsum,
            values.highlights
        );
        const converted = StrippetsVisual.converter(dataView);
        expect(converted.items).to.be.ok;
        expect(converted.items[0].entities.length).to.equal(4);
        expect(converted.items[0].isHighlighted).to.be.ok;
        expect(converted.iconMap).to.be.ok;
        expect(converted.highlights).to.be.ok;
        expect(converted.highlights.itemIds.length).to.equal(3);
    });

    // it('converts compressed entities data', function () {
    //     populateData(
    //         values.compressed
    //     );
    //     const converted = StrippetsVisual.converter(dataView);
    //     expect(converted.items).to.be.ok;
    //     expect(converted.items[10].entities.length).to.equal(52);
    //     expect(converted.iconMap).to.be.ok;
    //     expect(converted.highlights).to.be.null;
    // });

    it('sanitizes HTML', function () {
        const sanitized = StrippetsVisual.sanitizeHTML(testHtmlStrings.testArticle, StrippetsVisual.HTML_WHITELIST_CONTENT);
        expect(sanitized).to.be.ok;
        expect(sanitized.indexOf('<script>')).to.equal(-1);
        expect(sanitized.indexOf('<SCRIPT>')).to.equal(-1);
    });

    it('recognizes URLs', function () {
        expect(StrippetsVisual.isUrl('http://uncharted.software')).to.be.true;
        expect(StrippetsVisual.isUrl('https://unchartedsoftware.com')).to.be.true;
        expect(StrippetsVisual.isUrl('notAUrl')).to.be.false;
        expect(StrippetsVisual.isUrl('<div><a href="http://uncharted.software">Uncharted Software</a></div>')).to.be.false;
    });

    it('highlights text', function () {
        let mock = {
            Node: function () {
                this.nodeValue = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
                this.hasHits = true;
            }
        };
        mock.Node.prototype = {
            parentNode: {
                insertBefore: sinon.stub(),
            },
            nextSibling: {},
            ownerDocument: {
                createElementNS: function () {
                    return {
                        appendChild: sinon.stub(),
                    };
                },
                createTextNode: sinon.stub(),
            }
        };
        sinon.spy(mock, 'Node');
        sinon.spy(mock.Node.prototype.ownerDocument, 'createElementNS');

        let regex = /\bconsectetur\b/gi;
        let node = new mock.Node();
        let newNodeType = 'span';

        StrippetsVisual.textNodeReplace(node, regex, function (match) {
            expect(match).to.equal('consectetur');
            return {
                name: newNodeType,
                content: match
            };
        });
        expect(mock.Node.prototype.parentNode.insertBefore).to.be.calledTwice;
        expect(mock.Node.prototype.ownerDocument.createElementNS).to.be.calledWith(undefined, newNodeType);
    });
});
