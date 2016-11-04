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

var testHtmlStrings = require('./test_data/testHtmlStrings.js');

// pbi wraps the categories with a "wrapCtor" that has the actual data accessors
function wrapCtor(category, values) {
    this.source = category.source;
    this.identity = [];
    this.identityFields = [];
    this.values = values || [];
}

describe("The Strippets Browser Component", function () {
    var strippets;
    var dataView;
    var values;

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

    it("exists", function () {
        expect(StrippetsVisual).to.be.ok;
        expect(strippets).to.be.ok;
    });

    it("converts empty data", function () {
        populateData([]);
        const converted = StrippetsVisual.converter(dataView);
        expect(converted.items).to.be.ok;
        expect(converted.iconMap).to.be.ok;
        expect(converted.highlights).to.be.null;
    });

    it("converts normal data", function () {
        populateData(
            values.explodingPhones
        );
        const converted = StrippetsVisual.converter(dataView);
        expect(converted.items).to.be.ok;
        expect(converted.items[0].isHighlighted).to.be.false;
        expect(converted.items[0].entities.length).to.equal(159);
        expect(converted.iconMap).to.be.ok;
        expect(converted.highlights).to.be.null;
    });

    it("converts data with highlights", function () {
        populateData(
            values.explodingPhones,
            values.highlights
        );
        const converted = StrippetsVisual.converter(dataView);
        expect(converted.items).to.be.ok;
        expect(converted.items[0].entities.length).to.equal(159);
        expect(converted.items[0].isHighlighted).to.be.ok;
        expect(converted.iconMap).to.be.ok;
        expect(converted.highlights).to.be.ok;
        expect(converted.highlights.itemIds.length).to.equal(1);
    });

    it("converts compressed entities data", function () {
        populateData(
            values.pokemon
        );
        const converted = StrippetsVisual.converter(dataView);
        expect(converted.items).to.be.ok;
        expect(converted.items[10].entities.length).to.equal(52);
        expect(converted.iconMap).to.be.ok;
        expect(converted.highlights).to.be.null;
    });

    it("sanitizes HTML", function () {
        const sanitized = StrippetsVisual.sanitizeHTML(testHtmlStrings.pokemon, StrippetsVisual.HTML_WHITELIST_CONTENT);
        expect(sanitized).to.be.ok;
        expect(sanitized.indexOf('<script>')).to.equal(-1);
        expect(sanitized.indexOf('<SCRIPT>')).to.equal(-1);
    });

    it("recognizes URLs", function () {
       expect(StrippetsVisual.isUrl("notAUrl")).to.be.false;
       expect(StrippetsVisual.isUrl("http://uncharted.software")).to.be.true;
       expect(StrippetsVisual.isUrl("https://unchartedsoftware.com")).to.be.true;
    });

    it("highlights text", function () {
        var mock = {
            Node: function () {
                this.nodeValue = "citing documents leaked to Korea's SBS (via ";
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

        var regex = /\bKorea\b/gi;
        var node = new mock.Node();
        var newNodeType = 'span';

        StrippetsVisual.textNodeReplace(node, regex, function (match) {
            expect(match).to.equal("Korea");
            return {
                name: newNodeType,
                content: match
            };
        });
        expect(mock.Node.prototype.parentNode.insertBefore).to.be.calledTwice;
        expect(mock.Node.prototype.ownerDocument.createElementNS).to.be.calledWith(undefined, newNodeType);
    });
});
