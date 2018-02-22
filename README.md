[![CircleCI](https://circleci.com/gh/Microsoft/PowerBI-visuals-StrippetsBrowser/tree/master.svg?style=svg)](https://circleci.com/gh/Microsoft/PowerBI-visuals-StrippetsBrowser/tree/master)

# Strippet Browser Custom Visual
![Alt text](assets/screenshot.png?raw=true "Strippets Browser")

## Debugging

1. Install ssl certificate by running `npm run install-certificate` and following the steps from: [https://github.com/Microsoft/PowerBI-visuals/blob/master/tools/CertificateSetup.md](https://github.com/Microsoft/PowerBI-visuals/blob/master/tools/CertificateSetup.md)
2. Enable Developer Tools in PowerBI: [https://github.com/Microsoft/PowerBI-visuals/blob/master/tools/DebugVisualSetup.md](https://github.com/Microsoft/PowerBI-visuals/blob/master/tools/DebugVisualSetup.md)
3. Run `npm start` to start development.

## Building

1. Run `npm install` to download the dependencies.
2. Run `npm run package` to package the visual.

A `.pbiviz` file will be generated in the `dist` folder

## Testing

Run `npm test`
