const assert = require('assert');
const fs = require('fs');
const path = require('path');
const manifest = require('../package.json');
const lock = require('../package-lock.json');

for (const script of ['preinstall:prereq', 'preinstall:submodules', 'install-private-submodule']) {
    assert.strictEqual(manifest.scripts[script], undefined);
}
for (const helper of ['downloadPrivateSubmodules', 'installPrivateSubmodules']) {
    assert.strictEqual(fs.existsSync(path.join(__dirname, helper + '.js')), false);
    assert(!Object.values(manifest.scripts).some(script => script.includes(helper)));
}
for (const dependency of ['targz', 'mv']) {
    assert.strictEqual(manifest.devDependencies[dependency], undefined);
    assert.strictEqual(manifest.dependencies[dependency], undefined);
}
assert.strictEqual(lock.lockfileVersion, 3);
assert.strictEqual(manifest.scripts.postinstall, undefined);
assert.strictEqual(fs.lstatSync(path.join(__dirname, '../node_modules/@uncharted')).isSymbolicLink(), false);
for (const [name, version] of Object.entries(manifest.privateSubmodules)) {
    const localPath = path.join(__dirname, '../lib', name);
    const local = require(path.join(localPath, 'package.json'));
    assert.strictEqual(local.version, version);
    assert.strictEqual(local.private, true);
    assert.strictEqual(local.devDependencies, undefined);
    assert.strictEqual(manifest.dependencies[name], 'file:lib/' + name);
    assert.strictEqual(lock.packages['node_modules/' + name].link, true);
    assert.strictEqual(fs.realpathSync(path.join(__dirname, '../node_modules', name)), fs.realpathSync(localPath));
}

for (const name of ['targz', 'mv', 'powerbi-visuals', 'node-sass', 'tslint']) {
    assert.strictEqual(lock.packages['node_modules/' + name], undefined);
}
for (const helper of ['createSymLink', 'packageVisual', 'pbiPluginLoader', 'installSubmoduleDeps']) {
    assert.strictEqual(fs.existsSync(path.join(__dirname, helper + '.js')), false);
}
const source = fs.readFileSync(path.join(__dirname, '../src/StrippetsVisual.ts'), 'utf8');
assert(!source.includes('hostServices'));
assert(!source.includes("dataType: 'jsonp'"));
assert(!source.includes('window.open('));
console.log('Security checks passed: current lockfile, npm-managed local packages, supported host APIs, and no retired installer or JSONP paths.');