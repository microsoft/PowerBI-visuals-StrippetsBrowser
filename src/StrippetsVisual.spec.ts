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

import powerbi from 'powerbi-visuals-api';
import $ from 'jquery';
import * as sinon from 'sinon';
import { expect } from 'chai';
import StrippetsVisual from './StrippetsVisual';
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import mockDataView from './test_data/mockdataview';
import testDataValues from './test_data/testDataValues';
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
            createSelectionManager: () => ({} as any),
            colorPalette: { getColor: () => ({ value: '#123456' }) },
            fetchMoreData: sinon.stub().returns(true),
            launchUrl: sinon.stub(),
            eventService: {
                renderingStarted: sinon.stub(), renderingFinished: sinon.stub(), renderingFailed: sinon.stub(),
            },
        };
        strippets = new StrippetsVisual({ element: element[0], host: dummyHost } as unknown as VisualConstructorOptions);
        values = _.cloneDeep(testDataValues);
    });

    beforeEach(() => {
        dataView = _.cloneDeep(mockDataView);
    });

    it('exists', function () {
        expect(StrippetsVisual).to.be.ok;
        expect(strippets).to.be.ok;
    });

    it('exposes both modern formatting cards', () => {
        expect(strippets.getFormattingModel().cards.map(card => card.displayName))
            .to.deep.equal(['Configuration', 'Content']);
    });

    const formattingDefaults = [
        ['presentation', 'strippetType', 'thumbnails'],
        ['presentation', 'viewControls', true],
        ['presentation', 'wrap', false],
        ['content', 'readerContentType', 'html'],
        ['content', 'summaryUrl', false],
    ];
    formattingDefaults.forEach(([objectName, propertyName, value]) => {
        it(`preserves the ${objectName}.${propertyName} formatting contract`, () => {
            const cards = strippets.getFormattingModel().cards;
            const slices = cards.flatMap(card => card.groups.flatMap(group => group.slices));
            const control = slices.find(slice => slice.control.properties.descriptor.propertyName === propertyName).control;
            expect(control.properties.descriptor.objectName).to.equal(objectName);
            const actualValue = control.type === 'Dropdown' ? control.properties.value.value : control.properties.value;
            expect(actualValue).to.deep.equal(value);
            expect(cards.flatMap(card => card.revertToDefaultDescriptors))
                .to.deep.include({ objectName, propertyName });
        });
    });

    it('returns changed settings in the format pane', () => {
        strippets.settings.presentation.wrap = true;
        const card = strippets.getFormattingModel().cards[0];
        const wrap = card.groups[0].slices.find(slice => slice.control.properties.descriptor.propertyName === 'wrap');
        expect(wrap.control.properties.value).to.equal(true);
        strippets.settings.presentation.wrap = false;
    });

    it('does not share mutable defaults between visual instances', () => {
        strippets.settings.presentation.wrap = true;
        const other = new StrippetsVisual({ element: document.createElement('div'), host: strippets.host } as VisualConstructorOptions);
        expect(other['settings'].presentation.wrap).to.equal(false);
        other.destroy();
        strippets.settings.presentation.wrap = false;
    });

    it('converts empty data', function () {
        populateData([]);
        const converted = StrippetsVisual.converter(dataView);
        expect(converted.items).to.be.ok;
        expect(converted.iconMap).to.be.ok;
        expect(converted.highlights).to.be.null;
    });

    [undefined, {}, { metadata: { columns: [] } }, { categorical: { categories: [], values: [] } }].forEach((emptyData, index) => {
        it(`handles absent categorical data ${index}`, () => {
            expect(StrippetsVisual.converter(emptyData as powerbi.DataView).items).to.deep.equal([]);
        });
    });

    it('handles an empty measures array', () => {
        populateData(values.lipsum);
        dataView.categorical.values = [];
        expect(StrippetsVisual.converter(dataView).highlights).to.equal(null);
    });

    it('ignores columns with no assigned roles', () => {
        populateData(values.lipsum);
        dataView.categorical.categories.push({ source: {}, values: [] });
        expect(StrippetsVisual.converter(dataView).items.length).to.be.greaterThan(0);
    });

    it('ignores roles explicitly marked false', () => {
        populateData(values.lipsum);
        const expected = StrippetsVisual.converter(dataView);
        dataView.categorical.categories.push({ source: { roles: { id: false } }, values: [] });
        expect(StrippetsVisual.converter(dataView)).to.deep.equal(expected);
    });

    it('merges aggregated fetch segments without duplicate documents', () => {
        populateData(values.lipsum);
        const complete = StrippetsVisual.converter(dataView, true);
        const partial = _.cloneDeep(dataView);
        partial.categorical.categories.forEach(category => category.values = category.values.slice(0, 5));
        const initial = StrippetsVisual.converter(partial, true);
        const appended = StrippetsVisual.converter(dataView, true, initial, 5);
        expect(appended.items.map(item => item.id)).to.deep.equal(complete.items.map(item => item.id));
        expect(appended.items.map(item => item.entities.length)).to.deep.equal(complete.items.map(item => item.entities.length));
    });

    describe('supported host data fetching', () => {
        let showLoader;
        let hideLoader;
        beforeEach(() => {
            strippets.hasMoreData = true;
            strippets.isLoadingMore = false;
            strippets.host.fetchMoreData.resetHistory();
            strippets.host.fetchMoreData.returns(true);
            showLoader = sinon.stub(strippets, 'showLoader');
            hideLoader = sinon.stub(strippets, 'hideLoader');
        });
        afterEach(() => {
            showLoader.restore();
            hideLoader.restore();
        });
        it('requests aggregated data through the public host', () => {
            expect(strippets.loadMoreData()).to.equal(true);
            expect(strippets.host.fetchMoreData).to.have.been.calledWithExactly(true);
            expect(showLoader).to.have.been.calledOnce;
        });
        it('does not issue concurrent requests', () => {
            strippets.loadMoreData();
            expect(strippets.loadMoreData()).to.equal(false);
            expect(strippets.host.fetchMoreData).to.have.been.calledOnce;
        });
        it('stops loading when the host refuses more data', () => {
            strippets.host.fetchMoreData.returns(false);
            expect(strippets.loadMoreData()).to.equal(false);
            expect(strippets.isLoadingMore).to.equal(false);
            expect(strippets.hasMoreData).to.equal(false);
            expect(hideLoader).to.have.been.calledOnce;
            expect(showLoader).not.to.have.been.called;
        });
        it('does not request data without a segment', () => {
            strippets.hasMoreData = false;
            strippets.loadMoreData();
            expect(strippets.host.fetchMoreData).not.to.have.been.called;
        });
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

    describe('rendering lifecycle', () => {
        let visual;
        let host;
        let options;
        beforeEach(() => {
            host = {
                createSelectionManager: () => ({}),
                colorPalette: { getColor: () => ({ value: '#123456' }) },
                eventService: {
                    renderingStarted: sinon.spy(), renderingFinished: sinon.spy(), renderingFailed: sinon.spy(),
                },
                persistProperties: sinon.spy(),
                fetchMoreData: sinon.stub().returns(false),
            };
            visual = new StrippetsVisual({ element: document.createElement('div'), host } as unknown as VisualConstructorOptions);
            options = { viewport: { width: 640, height: 360 }, type: powerbi.VisualUpdateType.Data, dataViews: [] };
        });
        afterEach(() => {
            visual.destroy();
            sinon.restore();
        });
        function prepareSummaryUpdate() {
            populateData(values.lipsum);
            dataView.metadata.objects = { content: { readerContentType: 'readability', summaryUrl: true } };
            dataView.categorical.categories.forEach(category => {
                if (category.source.roles.summary) category.values.fill('');
                if (category.source.roles.content) category.values.fill('https://example.com/content');
            });
            options.dataViews = [dataView];
            visual.thumbnails.instance = {
                filter: sinon.spy(), highlight: sinon.spy(), loadData: sinon.spy(), resize: sinon.spy(),
                toggleInlineDisplayMode: sinon.spy(), _outlineReader: {}, _resetThumbnailsContainer: sinon.spy(),
            };
            const requests: Array<{ resolve: (content: string) => void; reject: (error: Error) => void }> = [];
            sinon.stub(StrippetsVisual as any, 'fetchContent').callsFake(() => new globalThis.Promise((resolve, reject) => {
                requests.push({ resolve, reject });
            }));
            return requests;
        }
        async function prepareViewEcho() {
            const requests = prepareSummaryUpdate();
            dataView.metadata.segment = {};
            host.fetchMoreData.returns(true);
            const pending = visual.update(options);
            requests.forEach(request => request.resolve('Initial summary'));
            await pending;
            (StrippetsVisual as any).fetchContent.resolves('Next summary');
            visual.thumbnails.instance.loadData.resetHistory();
            visual.saveThumbnailType();
            const echo = _.cloneDeep(dataView);
            echo.metadata.objects.presentation = { strippetType: visual.settings.presentation.strippetType };
            return echo;
        }
        it('pairs started and finished events for empty data', async () => {
            await visual.update(options);
            expect(host.eventService.renderingStarted).to.have.been.calledWithExactly(options);
            expect(host.eventService.renderingFinished).to.have.been.calledWithExactly(options);
            expect(host.eventService.renderingFailed).not.to.have.been.called;
        });
        it('reports rendering failures without a success event', async () => {
            sinon.stub(visual, 'render').rejects(new Error('Render failed'));
            await visual.update(options);
            expect(host.eventService.renderingFailed).to.have.been.calledOnce;
            expect(host.eventService.renderingFinished).not.to.have.been.called;
        });
        it('waits for asynchronous rendering before reporting completion', async () => {
            let complete;
            sinon.stub(visual, 'render').returns(new globalThis.Promise(resolve => { complete = resolve; }));
            const pending = visual.update(options);
            expect(host.eventService.renderingFinished).not.to.have.been.called;
            complete();
            await pending;
            expect(host.eventService.renderingFinished).to.have.been.calledOnce;
        });
        it('clears stale data when bindings are removed', async () => {
            visual.data = { items: [{ id: 'old' }] };
            visual.lastDataViewLength = 25;
            visual.hasMoreData = true;
            visual.thumbnails.instance = { loadData: sinon.spy(), _resetThumbnailsContainer: sinon.spy() };
            await visual.update(options);
            expect(visual.data).to.equal(null);
            expect(visual.lastDataViewLength).to.equal(0);
            expect(visual.hasMoreData).to.equal(false);
            expect(visual.thumbnails.instance.loadData).to.have.been.calledWithExactly([], false);
        });
        it('resizes without requiring a data view', async () => {
            options.type = powerbi.VisualUpdateType.Resize;
            await visual.update(options);
            expect(visual.element.width()).to.equal(640);
            expect(visual.viewportSize.height).to.equal(360);
        });
        it('applies formatting even when data bindings are empty', async () => {
            options.dataViews = [{ metadata: { columns: [], objects: {
                presentation: { viewControls: false, strippetType: 'outlines', wrap: true },
            } } }];
            await visual.update(options);
            expect(visual.settings.presentation).to.deep.equal({ viewControls: false, strippetType: 'outlines', wrap: true });
            expect(visual.$tabs.css('display')).to.equal('none');
            const slices = visual.getFormattingModel().cards[0].groups[0].slices;
            expect(slices.find(slice => slice.control.properties.descriptor.propertyName === 'wrap').control.properties.value).to.equal(true);
        });
        ['outlines', 'thumbnails'].forEach(mode => {
            it(`ignores ${mode} tab clicks after data is cleared`, async () => {
                await visual.update(options);
                visual.settings.presentation.strippetType = mode === 'outlines' ? 'thumbnails' : 'outlines';
                expect(() => visual.$tabs.find(`.${mode}Nav`).trigger('click')).not.to.throw();
                expect(host.persistProperties).not.to.have.been.called;
            });
        });
        it('does not skip data updates after persisting a view choice', async () => {
            visual.data = { items: [{ id: 'old' }] };
            visual.saveThumbnailType();
            await visual.update(options);
            expect(host.eventService.renderingFinished).to.have.been.calledOnce;
            expect(visual.data).to.equal(null);
        });
        it('does not render stale asynchronous thumbnail results', async () => {
            visual.thumbnails.instance = {
                filter: sinon.spy(), highlight: sinon.spy(), loadData: sinon.spy(),
                _outlineReader: {}, _resetThumbnailsContainer: sinon.spy(),
            };
            const pending = visual.updateThumbnails({ items: [], iconMap: [], highlights: null }, false, false);
            visual.renderVersion++;
            await pending;
            expect(visual.thumbnails.instance.loadData).not.to.have.been.called;
        });
        ['resize', 'view mode'].forEach(kind => {
            it(`preserves pending thumbnails across a ${kind} update`, async () => {
                const requests = prepareSummaryUpdate();
                const pending = visual.update(options);
                expect(requests.length).to.be.greaterThan(0);
                const next = { ...options, type: kind === 'resize' ? powerbi.VisualUpdateType.Resize : powerbi.VisualUpdateType.ViewMode };
                await visual.update(next);
                requests.forEach(request => request.resolve('<p>Summary</p>'));
                await pending;
                expect(visual.thumbnails.instance.loadData).to.have.been.calledOnce;
                expect(host.eventService.renderingStarted.callCount).to.equal(2);
                expect(host.eventService.renderingFinished.callCount).to.equal(2);
                expect(host.eventService.renderingFailed).not.to.have.been.called;
            });
        });
        it('renders the full aggregate when append supersedes pending thumbnails', async () => {
            const requests = prepareSummaryUpdate();
            const partial = _.cloneDeep(dataView);
            partial.categorical.categories.forEach(category => category.values = category.values.slice(0, 5));
            const pending = visual.update({ ...options, dataViews: [partial] });
            const previousRequests = requests.splice(0);
            const appended = visual.update({ ...options, operationKind: powerbi.VisualDataChangeOperationKind.Append });
            requests.forEach(request => request.resolve('New summary'));
            await appended;
            previousRequests.forEach(request => request.resolve('Old summary'));
            await pending;
            const loadData = visual.thumbnails.instance.loadData;
            expect(loadData).to.have.been.calledOnce;
            expect(loadData.firstCall.args[0].map(item => item.id)).to.deep.equal(StrippetsVisual.converter(dataView).items.map(item => item.id));
            expect(loadData.firstCall.args[1]).to.equal(false);
            expect(host.eventService.renderingFinished.callCount).to.equal(2);
        });
        it('keeps replacement data when an older summary fails late', async () => {
            const requests = prepareSummaryUpdate();
            const pending = visual.update(options);
            const previousRequests = requests.splice(0);
            const replacement = visual.update(options);
            requests.forEach(request => request.resolve('Replacement summary'));
            await replacement;
            previousRequests.forEach(request => request.reject(new Error('Old request failed')));
            await pending;
            expect(visual.thumbnails.instance.loadData).to.have.been.calledOnce;
            expect(visual.thumbnails.instance.loadData.firstCall.args[0][0].summary).to.equal('Replacement summary');
            expect(host.eventService.renderingStarted.callCount).to.equal(2);
            expect(host.eventService.renderingFinished.callCount).to.equal(2);
            expect(host.eventService.renderingFailed).not.to.have.been.called;
        });
        it('renders other documents when one summary request fails', async () => {
            const requests = prepareSummaryUpdate();
            const pending = visual.update(options);
            requests[0].reject(new Error('CORS denied'));
            requests.slice(1).forEach(request => request.resolve('<p>Available summary</p>'));
            await pending;
            expect(visual.thumbnails.instance.loadData).to.have.been.calledOnce;
            const items = visual.thumbnails.instance.loadData.firstCall.args[0];
            expect(items[0].summary).to.equal('');
            expect(items.slice(1).every(item => item.summary === '<p>Available summary</p>')).to.equal(true);
            expect(host.eventService.renderingFailed).not.to.have.been.called;
        });
        it('cancels queued pagination on destruction', () => {
            const clock = sinon.useFakeTimers();
            visual.hasMoreData = true;
            const loadMore = sinon.spy(visual, 'loadMoreData');
            visual.queueLoadMore();
            visual.destroy();
            clock.tick(100);
            expect(loadMore).not.to.have.been.called;
            expect(host.fetchMoreData).not.to.have.been.called;
            expect(visual.loadMoreData()).to.equal(false);
        });
        it('does not clear an outstanding host fetch when summaries finish after resize', async () => {
            const requests = prepareSummaryUpdate();
            dataView.metadata.segment = {};
            host.fetchMoreData.returns(true);
            const pending = visual.update(options);
            await visual.update({ ...options, type: powerbi.VisualUpdateType.Resize });
            expect(host.fetchMoreData).to.have.been.calledOnce;
            requests.forEach(request => request.resolve('Summary'));
            await pending;
            expect(host.fetchMoreData).to.have.been.calledOnce;
            expect(visual.isLoadingMore).to.equal(true);
        });
        it('ignores reader close events after an empty update changes view type', async () => {
            visual.thumbnails.instance = { loadData: sinon.spy(), closeReader: sinon.spy(), _resetThumbnailsContainer: sinon.spy() };
            options.dataViews = [{ metadata: { columns: [], objects: { presentation: { strippetType: 'outlines' } } } }];
            await visual.update(options);
            expect(() => visual.closeReader()).not.to.throw();
        });
        it('does not persist or reopen a reader after an asynchronous tab switch is destroyed', async () => {
            const requests = prepareSummaryUpdate();
            visual.data = StrippetsVisual.converter(dataView);
            visual.settings = _.cloneDeep({ presentation: { strippetType: 'outlines' }, ...dataView.metadata.objects });
            const pending = visual.$tabs.find('.thumbnailsNav').triggerHandler('click');
            expect(requests.length).to.be.greaterThan(0);
            expect(host.persistProperties).to.have.been.calledOnce;
            visual.destroy();
            requests.forEach(request => request.resolve('Summary'));
            await pending;
            expect(host.persistProperties).to.have.been.calledOnce;
        });
        it('preserves a pending tab choice when resize carries old saved settings', async () => {
            const requests = prepareSummaryUpdate();
            dataView.metadata.objects.presentation = { strippetType: 'outlines' };
            visual.data = StrippetsVisual.converter(dataView);
            visual.settings = _.cloneDeep(dataView.metadata.objects);
            const pending = visual.$tabs.find('.thumbnailsNav').triggerHandler('click');
            await visual.update({ ...options, type: powerbi.VisualUpdateType.Resize });
            requests.forEach(request => request.resolve('Summary'));
            await pending;
            expect(visual.settings.presentation.strippetType).to.equal('thumbnails');
            expect(host.persistProperties.firstCall.args[0].merge[0].properties.strippetType).to.equal('thumbnails');
        });
        it('renders the current tab when the host echoes persisted properties during summary fetching', async () => {
            const requests = prepareSummaryUpdate();
            dataView.metadata.objects.presentation = { strippetType: 'outlines' };
            visual.data = StrippetsVisual.converter(dataView);
            visual.settings = _.cloneDeep(dataView.metadata.objects);
            const echoes = [];
            host.persistProperties = sinon.spy(properties => {
                const presentation = properties.merge[0].properties;
                if (presentation.strippetType) {
                    dataView.metadata.objects.presentation = { ...presentation };
                    echoes.push(visual.update(options));
                }
            });
            const pending = visual.$tabs.find('.thumbnailsNav').triggerHandler('click');
            expect(echoes.length).to.equal(1);
            requests.forEach(request => request.resolve('Echoed summary'));
            await globalThis.Promise.all([pending, ...echoes]);
            expect(visual.settings.presentation.strippetType).to.equal('thumbnails');
            expect(visual.thumbnails.instance.loadData).to.have.been.calledOnce;
            expect(visual.thumbnails.instance.loadData.firstCall.args[0].map(item => item.id)).to.deep.equal(visual.data.items.map(item => item.id));
            expect(host.eventService.renderingStarted.callCount).to.equal(host.eventService.renderingFinished.callCount);
            expect(host.eventService.renderingFailed).not.to.have.been.called;
        });
        it('withholds the incomplete boundary document when changing tabs', () => {
            populateData(values.lipsum);
            visual.data = StrippetsVisual.converter(dataView);
            visual.hasMoreData = true;
            const showOutlines = sinon.stub(visual, 'showOutlines');
            visual.$tabs.find('.outlinesNav').triggerHandler('click');
            expect(showOutlines.firstCall.args[0].items.map(item => item.id)).to.deep.equal(visual.data.items.slice(0, -1).map(item => item.id));
        });
        it('preserves the component and outstanding page request for an exact view echo', async () => {
            const echo = await prepareViewEcho();
            const version = visual.renderVersion;
            await visual.update({ ...options, dataViews: [echo] });
            expect(visual.thumbnails.instance.loadData).not.to.have.been.called;
            expect(visual.renderVersion).to.equal(version);
            expect(visual.isLoadingMore).to.equal(true);
            expect(host.fetchMoreData).to.have.been.calledOnce;
        });
        it('does not mistake changed titles with the same document IDs for a view echo', async () => {
            const echo = await prepareViewEcho();
            echo.categorical.categories.find(category => category.source.roles.title).values[0] = 'Changed title';
            await visual.update({ ...options, dataViews: [echo] });
            expect(visual.thumbnails.instance.loadData).to.have.been.calledOnce;
            expect(visual.data.items[0].title).to.equal('Changed title');
        });
        it('does not mistake changed highlights for a view echo', async () => {
            const echo = await prepareViewEcho();
            echo.categorical.values[0].highlights = values.highlights;
            const version = visual.renderVersion;
            await visual.update({ ...options, dataViews: [echo] });
            expect(visual.renderVersion).to.equal(version + 1);
            expect(visual.data.highlights).not.to.equal(null);
        });
        it('preserves outstanding pagination when rendering outlines', () => {
            visual.isLoadingMore = true;
            visual.outlines.instance = { filter: sinon.spy(), highlight: sinon.spy(), loadData: sinon.spy() };
            visual.updateOutlines({ items: [], iconMap: [], highlights: null }, false);
            expect(visual.isLoadingMore).to.equal(true);
        });
        it('cancels queued resize callbacks on destruction', () => {
            const cancel = sinon.spy(visual.resizeOutlines, 'cancel');
            visual.destroy();
            expect(cancel).to.have.been.calledOnce;
            expect(visual.destroyed).to.equal(true);
        });
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
        expect(StrippetsVisual.isUrl('https://uncharted.software')).to.be.true;
        expect(StrippetsVisual.isUrl('https://unchartedsoftware.com')).to.be.true;
        expect(StrippetsVisual.isUrl('notAUrl')).to.be.false;
        expect(StrippetsVisual.isUrl('<div><a href="https://uncharted.software">Uncharted Software</a></div>')).to.be.false;
    });

    ['javascript:alert(1)', 'data:text/html,unsafe', '//example.com', 'https://user:pass@example.com', 'https://example.com/a b', null, 42].forEach(url => {
        it(`rejects unsafe or malformed URL ${url}`, () => {
            expect(StrippetsVisual.isUrl(url)).to.equal(false);
        });
    });

    ['https://example.com', 'https://example.com/path?value=1#anchor'].forEach(url => {
        it(`accepts a supported navigation URL ${url}`, () => {
            expect(StrippetsVisual.isUrl(url)).to.equal(true);
        });
    });

    [
        '<p onclick="alert(1)">text</p>',
        '<img src="x" onerror="alert(1)">',
        '<a href="javascript:alert(1)">link</a>',
        '<svg onload="alert(1)"></svg>',
        '<style>body{display:none}</style><p>text</p>',
        '<link rel="stylesheet" href="https://example.com/unsafe.css">',
        '<iframe src="https://example.com"></iframe>',
    ].forEach((html, index) => {
        it(`sanitizes active content case ${index}`, () => {
            const clean = StrippetsVisual.sanitizeHTML(html, StrippetsVisual.HTML_WHITELIST_CONTENT);
            expect(clean).not.to.match(/onclick|onerror|onload|javascript:|<style|<link|<iframe/i);
        });
    });

    it('preserves safe article markup', () => {
        const html = '<p><strong>Summary</strong> <a href="https://example.com">source</a></p>';
        expect(StrippetsVisual.sanitizeHTML(html, StrippetsVisual.HTML_WHITELIST_CONTENT)).to.equal(html);
    });

    it('omits images from summaries', () => {
        expect(StrippetsVisual.sanitizeHTML('<p>text</p><img src="https://example.com/photo.png">', StrippetsVisual.HTML_WHITELIST_SUMMARY))
            .to.equal('<p>text</p>');
    });

    it('launches links only through the public host', () => {
        const host = strippets.host;
        host.launchUrl.resetHistory();
        strippets.launchUrl('javascript:alert(1)');
        expect(host.launchUrl).not.to.have.been.called;
        strippets.launchUrl('https://example.com');
        expect(host.launchUrl).to.have.been.calledWithExactly('https://example.com');
    });

    describe('CORS content requests', () => {
        let fetchStub;
        beforeEach(() => {
            fetchStub = sinon.stub(window, 'fetch');
        });
        afterEach(() => fetchStub.restore());
        it('loads JSON content without credentials or JSONP', async () => {
            fetchStub.resolves(new Response(JSON.stringify({ content: '<p>article</p>' }), { status: 200 }));
            expect(await StrippetsVisual['fetchContent']('https://example.com/article')).to.equal('<p>article</p>');
            expect(fetchStub).to.have.been.calledWithExactly('https://example.com/article', { mode: 'cors', credentials: 'omit' });
        });
        it('accepts a JSON string response', async () => {
            fetchStub.resolves(new Response(JSON.stringify('article'), { status: 200 }));
            expect(await StrippetsVisual['fetchContent']('https://example.com/article')).to.equal('article');
        });
        [
            [['http', '://example.com/article'].join(''), 200, {}, 'HTTPS'],
            ['https://example.com/article', 403, {}, '403'],
            ['https://example.com/article', 200, {}, 'content string'],
        ].forEach(([url, status, body, message]) => {
            it(`reports content failure ${message}`, async () => {
                fetchStub.resolves(new Response(JSON.stringify(body), { status: Number(status) }));
                let failure;
                try { await StrippetsVisual['fetchContent'](String(url)); } catch (error) { failure = error; }
                expect(failure).to.be.instanceOf(Error);
                expect(failure.message).to.contain(message);
            });
        });
    });

    it('escapes strings for regex', function () {
        const escaped = StrippetsVisual.escapeRegex('rgba(255,128,0,0.6');
        expect(escaped).to.equal('rgba\\(255,128,0,0\\.6');
        expect(new RegExp(escaped, 'ig')).to.be.ok;
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
