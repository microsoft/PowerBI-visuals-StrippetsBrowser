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

    function populateData(data) {
        dataView.categorical.categories = dataView.categorical.categories.map(function (category, index) {
            return new wrapCtor(category, data && data[index]);
        });
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
        expect(converted.items[0].entities.length).to.equal(159);
        expect(converted.iconMap).to.be.ok;
        expect(converted.highlights).to.be.null;
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
});
