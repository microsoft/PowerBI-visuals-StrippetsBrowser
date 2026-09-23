> This repository is the result of research efforts that are no longer active. It has been marked read-only on GitHub to preserve the public code, but is no longer maintained or accepting contributions.

> **This repo has been updated while in archived state on 2026-09-22 to maintain dependency security. This update has not been thoroughly tested and there is no expectation that the code will work out of the box, only that it is compliant with our security scans.** There is a `legacy` tag that preserves the historical implementation. 

# Strippet Browser Custom Visual
![Alt text](assets/screenshot.png?raw=true "Strippets Browser")

## Requirements and Installation

Use Node 24 LTS (Node 22 or later is required) and npm.

```sh
if [[ -L node_modules/@uncharted ]]; then unlink node_modules/@uncharted; fi
npm ci --ignore-scripts
npx playwright install --with-deps chromium
```

The first command removes a scope-level symlink, if present, to protect local
sources during installation. On Linux, installing Chromium's system dependencies
may require administrator access.

## Development Container

Install Docker Desktop and the VS Code Dev Containers extension, then run
**Dev Containers: Reopen in Container** from the command palette. Run the
installation commands above inside the container.

## Debugging

1. Run `npm run install-certificate` and trust the resulting development certificate.
2. Enable developer mode using Microsoft's [environment setup guide](https://learn.microsoft.com/en-us/power-bi/developer/visuals/environment-setup).
3. Run `npm start` to serve the visual at `https://localhost:8080`.

After editing Sass, run `npm run styles` to regenerate the CSS.
For a standalone mock-host preview, run `npm run package` then `npm run preview`
and open `http://127.0.0.1:8090`. Verify the visual in Power BI before deployment.

## Building

After completing installation, package the visual:

```sh
npm run package
```

Import `dist/StrippetBrowser16424341054522.1.0.3.0.pbiviz` into Power BI using
**Import a visual from a file** in the Visualizations pane.

## Testing

- `npm test`: run browser unit tests.
- `npm run test:tdd`: run tests interactively in Chrome.
- `npm run validate`: run lint, typechecking, tests, packaging, and packaged-browser checks.

Set `CHROME_BIN` to use a different Chromium executable. Container tests disable
the browser sandbox; run trusted tests only.
