const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const sharp = require('sharp');
const { chromium } = require('@playwright/test');
const { startPreview } = require('./preview');
const config = require('../pbiviz.json');
const capabilities = require('../capabilities.json');

async function settle(page) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForFunction(() => !window.jQuery.Velocity.State.isTicking && window.jQuery(':animated').length === 0);
}

async function assertReaderInViewport(page) {
    const bounds = await page.evaluate(() => {
        const reader = window.visual.thumbnails.instance._readerview;
        const holder = reader.$currentReaderHolder[0].getBoundingClientRect();
        const viewport = reader.$scrollView[0].getBoundingClientRect();
        return { top: holder.top, bottom: holder.bottom, height: holder.height, viewportTop: viewport.top, viewportBottom: viewport.bottom, viewportHeight: viewport.height };
    });
    assert(bounds.top >= bounds.viewportTop - 1 &&
        (bounds.height > bounds.viewportHeight || bounds.bottom <= bounds.viewportBottom + 1),
    `The opened detail pane must scroll into view: ${JSON.stringify(bounds)}`);
}

async function assertReaderLayout(page) {
    const layout = await page.locator('.readerview .outlineItem').evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const header = element.querySelector('.outlineHeader').getBoundingClientRect();
        const reader = element.querySelector('.reader').getBoundingClientRect();
        const entities = element.querySelector('.mainOutlineContent').getBoundingClientRect();
        const viewport = element.closest('.thumbnails.viewport').getBoundingClientRect();
        return {
            availableHeight: bounds.bottom - header.bottom,
            readerHeight: reader.height,
            readerRight: reader.right,
            entitiesLeft: entities.left,
            entitiesRight: entities.right,
            outlineRight: bounds.right,
            outlineLeft: bounds.left,
            viewportLeft: viewport.left,
            viewportRight: viewport.right,
        };
    });
    assert(Math.abs(layout.readerHeight - layout.availableHeight) <= 2,
        `Article viewport must fill the reader below its header: ${JSON.stringify(layout)}`);
    assert(layout.entitiesLeft >= layout.readerRight - 1 && Math.abs(layout.entitiesRight - layout.outlineRight) <= 2,
        `Entity markers must stay in their own column: ${JSON.stringify(layout)}`);
    assert(layout.outlineLeft >= layout.viewportLeft - 1 && layout.outlineRight <= layout.viewportRight + 1,
        `The reader and entity markers must fit the viewport: ${JSON.stringify(layout)}`);
}

async function validateFirstCardOpen(page) {
    for (const index of [0, 11]) {
        await page.reload();
        await page.evaluate(() => window.ready);
        await page.locator('.thumbnail .title').nth(index).click();
        await page.waitForFunction(() => {
            const content = document.querySelector('.readerContentBody');
            return content && content.getBoundingClientRect().height > 100;
        });
        await settle(page);
        await assertReaderInViewport(page);
        await assertReaderLayout(page);
    }
}

async function validateGridReaderScrolling(page, wrapped = true) {
    await page.reload();
    await page.evaluate(async wrapped => {
        await window.ready;
        const content = window.fixture.categorical.categories.find(category => category.source.roles.content);
        content.values[0] = '<h2>Long article</h2>' +
            Array.from({ length: 30 }, (_, index) => `<p>Article paragraph ${index + 1}: Research findings connect people, places, and projects.</p>`).join('') +
            '<p>End of the complete article.</p>';
        await window.renderVisual({ presentation: { wrap: wrapped } });
        window.visual.thumbnails.instance.toggleInlineDisplayMode(!wrapped);
    }, wrapped);
    await page.locator('.thumbnail').first().click();
    const content = page.locator('.thumbnails-panel .readerContent:visible');
    await content.waitFor({ state: 'visible' });
    await settle(page);
    const dimensions = await content.evaluate(element => ({
        gutter: element.offsetWidth - element.clientWidth,
        height: element.clientHeight,
        scrollHeight: element.scrollHeight,
    }));
    assert(dimensions.scrollHeight > dimensions.height, 'Long articles must overflow inside the reader');
    assert(dimensions.gutter >= 8, 'The grid reader must expose a visible scrollbar track');
    await content.hover();
    const scrollbar = await content.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const parent = element.parentElement.getBoundingClientRect();
        return { right: bounds.right, parentRight: parent.right, colors: getComputedStyle(element).scrollbarColor };
    });
    assert(scrollbar.right <= scrollbar.parentRight + 1, 'The article scrollbar must not be clipped by its parent');
    assert.equal(scrollbar.colors, 'rgb(97, 97, 97) rgb(242, 242, 242)', 'Hover must reveal a contrasting scrollbar');
    await page.mouse.wheel(0, dimensions.scrollHeight);
    await page.waitForFunction(() => {
        const reader = window.jQuery('.thumbnails-panel .readerContent:visible')[0];
        return reader.scrollTop + reader.clientHeight >= reader.scrollHeight - 1;
    });
    const lastParagraph = await content.locator('p').last().boundingBox();
    const readerBounds = await content.boundingBox();
    assert(lastParagraph.y >= readerBounds.y && lastParagraph.y + lastParagraph.height <= readerBounds.y + readerBounds.height + 1,
        'Wheel scrolling must reveal the final paragraph inside the reader');
    await page.screenshot({ path: `test-results/reader-scroll-${wrapped ? 'grid' : 'inline'}-${page.viewportSize().width}.png` });
}

async function validateUpdateSequences(page) {
    await page.reload();
    await page.evaluate(() => window.ready);
    const requestCount = await page.evaluate(() => {
        window.summaryResponses = [];
        window.fetch = () => new Promise((resolve, reject) => window.summaryResponses.push({ resolve, reject }));
        for (const category of window.fixture.categorical.categories) {
            if (category.source.roles.summary) category.values.fill('');
            if (category.source.roles.content) category.values.fill('https://example.com/summary');
            if (category.source.roles.title) category.values.fill('Updated document');
        }
        window.pendingRender = window.renderVisual({ content: { readerContentType: 'readability', summaryUrl: true } });
        return window.summaryResponses.length;
    });
    assert.equal(requestCount, 12);
    await page.evaluate(() => window.visual.update({ viewport: { width: innerWidth, height: innerHeight }, dataViews: [window.fixture], type: 4 }));
    await page.evaluate(async () => {
        window.summaryResponses[0].reject(new Error('Summary unavailable'));
        for (const response of window.summaryResponses.slice(1)) {
            response.resolve(new Response(JSON.stringify({ content: '<p>Updated summary</p>' }), { status: 200 }));
        }
        await window.pendingRender;
    });
    await settle(page);
    assert.equal(await page.locator('.thumbnail').count(), 12);
    assert.equal(await page.locator('.thumbnail .title').first().textContent(), 'Updated document');
    const formatting = await page.evaluate(async () => {
        window.savedCategories = structuredClone(window.fixture.categorical.categories);
        for (const category of window.fixture.categorical.categories) category.values = [];
        await window.renderVisual({ presentation: { viewControls: false, strippetType: 'outlines', wrap: true } });
        return window.visual.getFormattingModel().cards[0].groups[0].slices;
    });
    assert.equal(formatting.find(slice => slice.control.properties.descriptor.propertyName === 'viewControls').control.properties.value, false);
    assert.equal(formatting.find(slice => slice.control.properties.descriptor.propertyName === 'wrap').control.properties.value, true);
    assert.equal(await page.locator('.nav').isVisible(), false);
    assert.equal(await page.locator('.thumbnail').count(), 0);
    await page.evaluate(async () => {
        document.querySelector('.thumbnailsNav').click();
        await window.renderVisual({ presentation: { strippetType: 'thumbnails' } });
        document.querySelector('.outlinesNav').click();
        window.fixture.categorical.categories = window.savedCategories;
        await window.renderVisual();
    });
    await settle(page);
    assert.equal(await page.locator('.thumbnail').count(), 12);
    const events = await page.evaluate(() => window.hostState);
    assert.deepEqual(events.failed, []);
    assert.equal(events.started, events.finished);
}

async function validateReaderEcho(page) {
    await page.evaluate(() => {
        window.visual.host.persistProperties = properties => {
            window.hostState.persisted.push(properties);
            for (const merge of properties.merge) {
                window.fixture.metadata.objects[merge.objectName] = {
                    ...window.fixture.metadata.objects[merge.objectName], ...merge.properties,
                };
            }
            window.echoedRender = window.renderVisual(window.fixture.metadata.objects);
        };
        document.querySelector('.outlinesNav').click();
    });
    await page.evaluate(() => window.echoedRender);
    await settle(page);
    await page.waitForFunction(() => window.visual.outlines.instance._items.some(item => item.getCurrentState() === 'readingmode'));
    await page.evaluate(() => document.querySelector('.thumbnailsNav').click());
    await page.evaluate(() => window.echoedRender);
    await page.waitForFunction(() => {
        const content = document.querySelector('.readerContentBody');
        return content && content.getBoundingClientRect().height > 100 && content.textContent.includes('Research findings');
    });
    await settle(page);
    await assertReaderInViewport(page);
}

async function main() {
    const { server, url, archive, metadata, payload, filename } = await startPreview();
    let browser;
    try {
        assert.equal(metadata.visual.guid, config.visual.guid);
        assert.equal(metadata.visual.version, config.visual.version);
        assert.equal(metadata.version, config.visual.version);
        assert.equal(payload.apiVersion.split('.').slice(0, 2).join('.'), config.apiVersion.split('.').slice(0, 2).join('.'));
        assert.deepEqual(payload.capabilities, capabilities);
        for (const resource of metadata.resources) { assert(archive.file(resource.file)); }
        new vm.Script(payload.content.js);
        assert(!/\beval\s*\(/.test(payload.content.js));
        assert(payload.content.css.includes('.strippets-container'));
        assert(payload.content.css.includes('@font-face'));
        assert(payload.content.iconBase64.startsWith('data:image/png;base64,'));
        const icon = await sharp(Buffer.from(payload.content.iconBase64.split(',')[1], 'base64')).metadata();
        assert.equal(icon.width, 20);
        assert.equal(icon.height, 20);
        fs.mkdirSync('test-results', { recursive: true });
        browser = await chromium.launch({ headless: true, args: ['--no-sandbox'], ignoreDefaultArgs: ['--hide-scrollbars'] });
        const failures = [];
        const page = await browser.newPage();
        page.on('pageerror', error => failures.push(error.message));
        for (const viewport of [{ width: 1200, height: 720 }, { width: 390, height: 844 }]) {
            await page.setViewportSize(viewport);
            await page.goto(url);
            await page.evaluate(() => window.ready);
            await settle(page);
            assert.deepEqual(await page.evaluate(() => window.hostState.failed), []);
            assert.equal(await page.locator('.thumbnail').count(), 12);
            assert(await page.locator('.thumbnail .title').first().isVisible());
            const sourceIcons = await page.locator('.thumbnail .card-icon').evaluateAll(async elements => Promise.all(elements.map(async element => {
                const background = getComputedStyle(element).backgroundImage;
                const match = background.match(/^url\(["']?(.*?)["']?\)$/);
                const image = new Image();
                image.src = match ? match[1] : '';
                try {
                    await image.decode();
                    return image.naturalWidth > 0 && image.naturalHeight > 0;
                } catch {
                    return false;
                }
            })));
            assert.equal(sourceIcons.length, 12);
            assert(sourceIcons.every(Boolean), 'Every source card icon must contain a decodable image');
            assert(await page.evaluate(async () => {
                const image = new Image();
                image.src = window.fixture.categorical.categories.find(category => category.source.roles.imageUrl).values[0];
                await image.decode();
                return image.naturalWidth > 0;
            }));
            await page.evaluate(() => document.fonts.ready);
            const screenshot = await page.screenshot({ path: `test-results/thumbnails-${viewport.width}.png` });
            const pixels = await sharp(screenshot).stats();
            assert(pixels.channels.some(channel => channel.stdev > 10), 'Rendered visual must not be blank');
            const bounds = await page.locator('.strippets-container').boundingBox();
            assert(bounds.width > 0 && bounds.x >= 0 && bounds.x + bounds.width <= viewport.width + 1);
            await page.getByRole('button', { name: 'Outlines', exact: true }).focus();
            await page.keyboard.press('Enter');
            await settle(page);
            assert.equal(await page.getByRole('button', { name: 'Outlines', exact: true }).getAttribute('aria-pressed'), 'true');
            await page.reload();
            await page.evaluate(() => window.ready);
            await page.evaluate(() => window.renderVisual({ presentation: { strippetType: 'outlines' } }));
            await settle(page);
            assert.deepEqual(await page.evaluate(() => window.hostState.failed), []);
            assert.equal(await page.locator('.outlineItem').count(), 12);
            const positions = await page.locator('.outlineItem').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().x));
            assert.equal(new Set(positions).size, 12, 'Outlines must not overlap');
            await page.screenshot({ path: `test-results/outlines-${viewport.width}.png` });
            await page.evaluate(() => window.renderVisual({ presentation: { strippetType: 'thumbnails', wrap: true, viewControls: false } }));
            await settle(page);
            assert.equal(await page.locator('.nav').isVisible(), false);
            assert.equal(await page.locator('.thumbnail').count(), 12);
            await page.screenshot({ path: `test-results/wrapped-${viewport.width}.png` });
            await page.locator('.thumbnail .title').first().click();
            await page.waitForFunction(() => {
                const content = document.querySelector('.readerContentBody');
                return content && content.getBoundingClientRect().height > 100 && content.textContent.includes('Research findings');
            });
            await settle(page);
            await assertReaderInViewport(page);
            await assertReaderLayout(page);
            await page.screenshot({ path: `test-results/reader-${viewport.width}.png` });
            await page.getByRole('link', { name: 'Original source', exact: true }).click();
            assert.deepEqual(await page.evaluate(() => window.hostState.launched), ['https://example.com/source']);
            assert.deepEqual(await page.evaluate(() => window.hostState.failed), []);
            const model = await page.evaluate(() => window.visual.getFormattingModel());
            assert.equal(model.cards.length, 2);
            await validateReaderEcho(page);
            await validateFirstCardOpen(page);
            await validateGridReaderScrolling(page);
            await validateGridReaderScrolling(page, false);
            await validateUpdateSequences(page);
            await page.evaluate(() => window.visual.destroy());
            assert.equal(await page.locator('#visual').innerHTML(), '');
        }
        assert.deepEqual(failures, []);
        console.log(`Package and browser checks passed: ${filename}`);
        console.log('Validated ZIP CRCs, metadata, API, capabilities, JavaScript, embedded styles/icon, desktop/mobile views, readers, wrapping, overlapping updates, summary failures, empty bindings, and teardown.');
        console.log('Screenshots: test-results/');
    } finally {
        if (browser) { await browser.close(); }
        await new Promise(resolve => server.close(resolve));
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});