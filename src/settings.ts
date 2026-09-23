import { formattingSettings } from 'powerbi-visuals-utils-formattingmodel';

class PresentationCard extends formattingSettings.SimpleCard {
    name = 'presentation';
    displayName = 'Configuration';
    strippetType = new formattingSettings.ItemDropdown({
        name: 'strippetType', displayName: 'Default',
        items: [
            { displayName: 'Outlines', value: 'outlines' },
            { displayName: 'Thumbnails', value: 'thumbnails' },
        ],
        value: { displayName: 'Thumbnails', value: 'thumbnails' },
    });
    viewControls = new formattingSettings.ToggleSwitch({
        name: 'viewControls', displayName: 'Switch', value: true,
    });
    wrap = new formattingSettings.ToggleSwitch({
        name: 'wrap', displayName: 'Wrap', value: false,
    });
    slices = [this.strippetType, this.viewControls, this.wrap];
}

class ContentCard extends formattingSettings.SimpleCard {
    name = 'content';
    displayName = 'Content';
    readerContentType = new formattingSettings.ItemDropdown({
        name: 'readerContentType', displayName: 'Type',
        items: [
            { displayName: 'HTML', value: 'html' },
            { displayName: 'Readability URL', value: 'readability' },
        ],
        value: { displayName: 'HTML', value: 'html' },
    });
    summaryUrl = new formattingSettings.ToggleSwitch({
        name: 'summaryUrl', displayName: 'Auto Summary URL', value: false,
    });
    slices = [this.readerContentType, this.summaryUrl];
}

export class VisualFormattingSettings extends formattingSettings.Model {
    presentation = new PresentationCard();
    content = new ContentCard();
    cards = [this.presentation, this.content];
}