const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const JSZip = require('jszip');
const config = require('../pbiviz.json');

async function loadPackage() {
    const filename = path.join(__dirname, '..', 'dist', `${config.visual.guid}.${config.visual.version}.pbiviz`);
    const archive = await JSZip.loadAsync(fs.readFileSync(filename), { checkCRC32: true });
    const metadata = JSON.parse(await archive.file('package.json').async('string'));
    const resource = metadata.resources.find(item => item.resourceId === metadata.metadata.pbivizjson.resourceId);
    const payload = JSON.parse(await archive.file(resource.file).async('string'));
    return { archive, metadata, payload, filename };
}

function createDataView() {
    const image = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, '../assets/thumbnail.png')).toString('base64');
    const rows = Array.from({ length: 12 }, (_, index) => ({
        id: `document-${index}`,
        title: ['Research notes', 'Project overview', 'Field observations', 'Document review'][index % 4] + ` ${index + 1}`,
        summary: '<p>Research findings connect people, places, and projects across the collection.</p>',
        content: '<h2>Research findings</h2><p>Research findings connect people, places, and projects across the collection.</p><p>These observations provide the context for the next review.</p><p><a href="https://example.com/source">Original source</a></p>',
        author: 'Research team', source: 'Document collection', sourceUrl: 'https://example.com/source',
        imageUrl: image, articleDate: '2026-09-23',
        entityType: 'Topic||Place', entityName: 'Research||collection', entityPosition: '0.2||0.6',
        entityTypeColor: '#267e83||#b44a67', entityTypeClass: 'fa fa-circle||fa fa-square',
    }));
    const categories = Object.keys(rows[0]).map(name => ({
        source: { displayName: name, queryName: name, roles: { [name]: true }, type: { text: true } },
        values: rows.map(row => row[name]),
    }));
    return { metadata: { columns: categories.map(category => category.source), objects: {} }, categorical: { categories, values: [] } };
}

function bootstrap(guid, fixture) {
    window.fixture = fixture;
    window.hostState = { started: 0, finished: 0, failed: [], persisted: [], launched: [] };
    const host = {
        createSelectionManager: () => ({ clear: () => Promise.resolve([]), select: () => Promise.resolve([]) }),
        colorPalette: { getColor: () => ({ value: '#267e83' }), isHighContrast: false },
        fetchMoreData: () => false,
        launchUrl: url => window.hostState.launched.push(url),
        persistProperties: properties => window.hostState.persisted.push(properties),
        eventService: {
            renderingStarted: () => window.hostState.started++,
            renderingFinished: () => window.hostState.finished++,
            renderingFailed: (options, error) => window.hostState.failed.push(error),
        },
    };
    window.visual = window.powerbi.visuals.plugins[guid].create({ element: document.getElementById('visual'), host });
    window.renderVisual = async (objects = {}, type = 2) => {
        fixture.metadata.objects = objects;
        await window.visual.update({ viewport: { width: innerWidth, height: innerHeight }, dataViews: [fixture], type });
    };
    window.ready = window.renderVisual();
}

async function startPreview(port = 0) {
    const packaged = await loadPackage();
    const hostScript = `(${bootstrap.toString()})(${JSON.stringify(config.visual.guid)}, ${JSON.stringify(createDataView())});`;
    const routes = {
        '/': ['text/html', '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Strippet Browser Preview</title><link rel="stylesheet" href="/visual.css"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}#visual{width:100%;height:100%}</style></head><body><div id="visual"></div><script>window.powerbi={visuals:{plugins:{}}};</script><script src="/visual.js"></script><script src="/host.js"></script></body></html>'],
        '/visual.js': ['text/javascript', packaged.payload.content.js],
        '/visual.css': ['text/css', packaged.payload.content.css],
        '/host.js': ['text/javascript', hostScript],
    };
    const server = http.createServer((request, response) => {
        const route = routes[request.url];
        response.writeHead(route ? 200 : 404, { 'Content-Type': route ? route[0] : 'text/plain' });
        response.end(route ? route[1] : 'Not found');
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', resolve);
    });
    return { server, url: `http://127.0.0.1:${server.address().port}`, ...packaged };
}

module.exports = { loadPackage, startPreview };

if (require.main === module) {
    startPreview(Number(process.env.PORT || 8090)).then(({ url }) => console.log(`Packaged visual preview: ${url}`)).catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}