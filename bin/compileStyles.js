const fs = require('node:fs');
const sass = require('sass');
const sharp = require('sharp');

async function compileStyles() {
    const result = sass.compile('style/strippetsbrowser.scss', {
        loadPaths: ['lib/@uncharted/strippets/sass'],
        style: 'compressed',
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'slash-div'],
    });
    fs.writeFileSync('style/strippetsbrowser.css', result.css);
    await sharp('assets/icon.svg').resize(20, 20).png().toFile('assets/icon.png');
}

compileStyles().catch(error => {
    console.error(error);
    process.exitCode = 1;
});