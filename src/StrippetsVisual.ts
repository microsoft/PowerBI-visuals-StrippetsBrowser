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

/// <reference path='../node_modules/powerbi-visuals/lib/powerbi-visuals.d.ts'/>
// /* tslint:disable:quotemark */
/* global powerbi, require, window */

import IVisual = powerbi.extensibility.v110.IVisual;
import VisualConstructorOptions = powerbi.extensibility.v110.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.VisualUpdateOptions;
import DataView = powerbi.DataView;
import IEnumType = powerbi.IEnumType;
import IVisualStyle = powerbi.IVisualStyle;
import VisualCapabilities = powerbi.VisualCapabilities;
import VisualInitOptions = powerbi.VisualInitOptions;
import VisualDataRoleKind = powerbi.VisualDataRoleKind;
import VisualDataChangeOperationKind = powerbi.VisualDataChangeOperationKind;
import IDataColorPalette = powerbi.IDataColorPalette;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import IVisualHostServices = powerbi.IVisualHostServices;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import SelectionManager = powerbi.visuals.utility.SelectionManager;
import SelectionId = powerbi.visuals.SelectionId;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewCategoricalSegment = powerbi.data.segmentation.DataViewCategoricalSegment;
import IColorInfo = powerbi.IColorInfo;
import { Bucket, HitNode, MappedEntity } from './interfaces';
import { COLOR_PALETTE, getSegmentColor } from './utils';

import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as $ from 'jquery';

require('velocity-animate');
const moment = require('moment');
const Mediator = require('@uncharted/strippets.common').mediator;
const thumbnailsDefaults = require('@uncharted/thumbnails/src/thumbnails.defaults');
const THUMBNAIL_READER_CLOSE_EVENTS = 'thumbnails:backgroundClick outlineReader:closeButtonClick';

/**
 * Width of one outline, in pixels.
 * @type {number}
 */
const OUTLINE_WIDTH = 24;

/**
 * Debounce interval for resizing thumbnails and outline components while the visual is being resized.
 * @type {number}
 */
const ENTITIES_REPOSITION_DELAY = 500;

/**
 * White list of HTML tags allowed in either the content or summary
 * @type {string[]}
 */
const HTML_WHITELIST_STANDARD = [
    'A', 'ABBR', 'ACRONYM', 'ADDRESS', 'AREA', 'ARTICLE', 'ASIDE',
    'B', 'BDI', 'BDO', 'BLOCKQUOTE', 'BR',
    'CAPTION', 'CITE', 'CODE', 'COL', 'COLGROUP',
    'DD', 'DEL', 'DETAILS', 'DFN', 'DIV', 'DL', 'DT',
    'EM',
    'FIGCAPTION', 'FIGURE', 'FONT', 'FOOTER',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HGROUP', 'HR', 'HTML',
    'I', 'INS',
    'LEGEND', 'LI', 'LINK',
    'MAIN', 'MAP',
    // We probably don't want navigation, but it's also probably mostly harmless
    // 'NAV',
    'OL',
    'P', 'PRE',
    'SECTION', 'SMALL', 'SOURCE', 'SPAN', 'STRONG', 'STYLE', 'SUB', 'SUMMARY', 'SUP',
    'TABLE', 'TBODY', 'TD', 'TEXTAREA', 'TFOOT', 'TH', 'THEAD', 'TIME', 'TR',
    'U', 'UL',
    'VAR',
];

/**
 * White list of HTML tags, for media, which are allowed only in the content
 * @type {string[]}
 */
const HTML_WHITELIST_MEDIA = [
    'IMG',
    'PICTURE',
    'SVG',
    'VIDEO'
];

/**
 * Grey color to use as the default when entities have buckets.
 * @type {string}
 */
const BUCKET_DEFAULT_GREY = '#DDDDDD';

/**
 * Strippet Browser visual definition.
 * The Strippet Browser has two tabs, corresponding to its two view: Thumbnails and Outlines,
 * which are implemented by the dynamically-loaded thumbnails and strippets components, respectively.
 */
export default class StrippetBrowser16424341054522 implements IVisual {
    public static HTML_WHITELIST_SUMMARY = HTML_WHITELIST_STANDARD;
    public static HTML_WHITELIST_CONTENT = HTML_WHITELIST_STANDARD.concat(HTML_WHITELIST_MEDIA);

    /**
     * Default formatting settings
     */
    private static DEFAULT_SETTINGS = {
        presentation: {
            wrap: false,
            viewControls: true,
            strippetType: 'thumbnails',
        },
        content: {
            readerContentType: 'html',
            summaryUrl: false,
        }
    };

    /**
     * Root div of the visual, parented to PowerBI's container
     */
    private element: JQuery;

    /**
     * Inner container: contains Thumbnails & Outlines, but not the nav tab buttons to switch between them
     */
    private $container: JQuery;

    /**
     * Size of the visual, including Thumbnails, Outlines, and the nav tabs
     */
    private viewportSize: any;

    /**
     * Navigation tabs, for switching between Thumbnails and Outlines
     */
    private $tabs: JQuery;

    /**
     * An object holding the Outlines instance and its JQuery-wrapped element
     */
    private outlines: any;

    /**
     * An object holding the Thumbnails instance and its JQuery-wrapped element
     */
    private thumbnails: any;

    /**
     * Local copy of the converted data
     */
    private data: any;

    /**
     * True if the visual is sandboxed in an iframe.
     */
    private inSandbox: boolean;

    /**
     * The number of rows in the most recent dataView
     * @type {number}
     */
    private lastDataViewLength: number = 0;

    /**
     * True if the visual is requesting additional data from the host (rather than the initial load)
     */
    private isLoadingMore: boolean;

    /**
     * True if the host has more data available
     */
    private hasMoreData: boolean;

    /**
     * The visual's interface to PowerBI services.
     */
    private host: IVisualHostServices;

    /**
     * Allows the visual to notify the host of changes in selection state.
     */
    private selectionManager: SelectionManager;
    private settings = $.extend({}, StrippetBrowser16424341054522.DEFAULT_SETTINGS);
    private baseRowsLoaded: number = 0;
    private minOutlineCount = 10;
    private isThumbnailsWrapLayout: boolean;
    private $loaderElement: JQuery;
    private INFINITE_SCROLL_DELAY = 50;
    private lastOpenedStoryId: string;
    private thumbnailViewportHeight: number = 0;
    private resizeOutlines: Function;
    private thumbnailsWrapTimeout: any = null;
    private colors: IColorInfo[];
    private suppressNextUpdate: boolean;
    private mediator: any = new Mediator();

    private static cleanString (str: any) {
        if (str && str.indexOf && str.indexOf('>') > -1) {
            return _.escape(str);
        }
        return str || '';
    }

    private static  asUtf8 (value: string) {
        return $('<div />').html(value).text();
    }

    /**
     * Convert PowerBI data into a format compatible with the Thumbnails and Outlines components.
     * @param {DataView} dataView - data from PowerBI
     * @param {Boolean=} updateIconMap - true if the entity icon data structure needs to be updated
     * @param {Object=} appendTo - if provided, the previous data, to which the contents of dataView should be appended (deprecated use case)
     * @param {Number=} lastDataViewLength - If we're appending, the number of rows in the previous dataView
     * @param {Array=} defaultColors - Array of colors to use when none are supplied by the data and the color palette has been exhausted.
     * @returns {{items: *, iconMap: any, highlights: {entities: any, itemIds: any}}} data in the components' internal format
     */
    public static converter(dataView: DataView, updateIconMap: boolean = false, appendTo?: any, lastDataViewLength: number = 0, defaultColors = []) {
        const categoricalDV = dataView.categorical;
        const categoriesDV = categoricalDV.categories;
        const valuesDV = categoricalDV.values;
        const categories = <any>{};
        const colors = COLOR_PALETTE.slice().concat(defaultColors.map((color: IColorInfo) => color.value));

        categoriesDV.forEach((category, index) => {
            Object.keys(category.source.roles).forEach(categoryName => categories[categoryName] = index);
        });

        const updateIM = updateIconMap && categories['entityType'];

        const strippetsData = (appendTo && appendTo.items) ? appendTo.items.reduce((memo, i) => {
            memo[i.id] = i;
            memo[i.id].order = Object.keys(memo).length + 1;
            return memo;
        }, {}) : <any>{};

        const iconMap = (appendTo && appendTo.iconMap) ? appendTo.iconMap.reduce((memo, im) => {
            const entityTypeId = im.type + '_' + im.name;
            memo[entityTypeId] = {
                class: im.class,
                color: im.color,
                type: im.type,
                name: im.name,
                isDefault: im.isDefault
            };
            return memo;
        }, {}) : <any>{};

        const highlightedEntities = (appendTo && appendTo.highlights && appendTo.highlights.entities) ? appendTo.highlights.entities.reduce((memo, im) => {
            const entityTypeId = im.type + '_' + im.name;
            memo[entityTypeId] = im;
            return memo;
        }, {}) : <any>{};

        const getCategoryValue = (fieldName: string, itemIndex: number) => {
            return categories[fieldName] !== undefined ? categoriesDV[categories[fieldName]].values[itemIndex] : null;
        };
        const isHighlightingOn = valuesDV && valuesDV[0].highlights && valuesDV[0].highlights.length > 0;

        const getHighlightValue = (itemIndex: number) => {
            return isHighlightingOn ? valuesDV[0].highlights[itemIndex] : false;
        };

        const bucketMap = {};
        const getBucket = (bucketValue: any) => {
            if (bucketValue) {
                if (!bucketMap[bucketValue]) {
                    let bucket: Bucket = {
                        key: bucketValue,
                        value: 0,
                    };
                    // store the bucket value (which is probably a string) for later sorting and value generation
                    bucketMap[bucketValue] = bucket;
                }
                return bucketMap[bucketValue];
            }

            return null;
        };

        const populateUncertaintyFields = function (entity, entityIds, buckets, index) {
            if (entityIds.length > index && (entityIds[index] || entityIds[index] === 0)) {
                entity.id = entityIds[index];
                if (buckets.length > index) {
                    entity.bucket = getBucket(buckets[index]);
                }
            }
        };

        const populateUncertaintyFieldsCompressed = function (entity, parsedEntity) {
            if (parsedEntity.hasOwnProperty('entityId') && (parsedEntity.entityId || parsedEntity.entityId === 0)) {
                entity.id = parsedEntity.entityId;
                if (parsedEntity.hasOwnProperty('bucket')) {
                    entity.bucket = getBucket(parsedEntity.bucket);
                }
            }
        };

        const adjustIconColor = function (iconMapEntity, bucket, dataColor, isHighlight) {
            if (bucket) {
                if (dataColor) {
                    iconMapEntity.color = getSegmentColor(dataColor, 100, 0, 1, isHighlight);
                }
                else {
                    iconMapEntity.color = BUCKET_DEFAULT_GREY;
                }
            }
        };

        const highlightEntityAndMapIcon = function (entity, entityClass, entityColor, isHighlighted) {
            let highlighted = false;

            if (entity.type && entity.name) {
                const entityTypeId = entity.type + '_' + entity.name;
                if (isHighlighted && !highlightedEntities[entityTypeId]) {
                    highlightedEntities[entityTypeId] = {
                        id: entity.id,
                        type: entity.type,
                        name: entity.name,
                        bucket: entity.bucket
                    };
                    adjustIconColor(highlightedEntities[entityTypeId], entity.bucket, entityColor, true);
                    highlighted = true;
                }
                if (updateIM && !iconMap[entityTypeId]) {
                    iconMap[entityTypeId] = {
                        class: entityClass || 'fa fa-circle',
                        color: entityColor === null ? colors.shift() : entityColor,
                        type: entity.type,
                        name: entity.name,
                        isDefault: false
                    };

                    adjustIconColor(iconMap[entityTypeId], entity.bucket, entityColor, false);
                }
            }

            return highlighted;
        };

        categoriesDV[categories['id']] && categoriesDV[categories['id']].values.slice(lastDataViewLength).forEach((id: any, adjustedIndex) => {
            // highlight table is not compensated. Since we slice the values, we need to compensate for the slice. Slicing at the highlights level
            // will result in slower performance.
            const index = adjustedIndex + lastDataViewLength;
            const isHighlighted = getHighlightValue(index);
            if (!strippetsData[id]) {
                const title = getCategoryValue('title', index);
                const summary = getCategoryValue('summary', index);
                let articleDate = getCategoryValue('articleDate', index);
                if (articleDate) {
                    articleDate = StrippetBrowser16424341054522.cleanString(articleDate);
                }
                    strippetsData[id] = {
                    id: id,
                    title: StrippetBrowser16424341054522.asUtf8(title ? StrippetBrowser16424341054522.cleanString(String(title)) : ''),
                    summary: summary ? StrippetBrowser16424341054522.sanitizeHTML(String(summary), StrippetBrowser16424341054522.HTML_WHITELIST_SUMMARY) : '',
                    content: getCategoryValue('content', index),
                    imageUrl: StrippetBrowser16424341054522.cleanString(getCategoryValue('imageUrl', index)),
                    author: StrippetBrowser16424341054522.cleanString(getCategoryValue('author', index)),
                    source: StrippetBrowser16424341054522.cleanString(String(getCategoryValue('source', index) || '')),
                    sourceUrl: StrippetBrowser16424341054522.cleanString(String(getCategoryValue('sourceUrl', index) || '')),
                    sourceimage: StrippetBrowser16424341054522.cleanString(getCategoryValue('sourceImage', index)),
                    articleDate: articleDate,
                    articledate: articleDate, // thumbnails data model has 'articledate' instead of 'articleDate'
                    entities: [],
                    readerUrl: id,
                    isHighlighted: isHighlighted,
                    order: Object.keys(strippetsData).length + 1
                };
            }

            const entityTypesString = String((categories['entityType'] && categoriesDV[categories['entityType']].values[index]) || '');
            const parsedEntityType = (toParse => {
                try {
                    return JSON.parse(toParse);
                } catch (err) {
                    return null;
                }
            })(entityTypesString);

            if (parsedEntityType instanceof Array &&
                parsedEntityType.length > 0 &&
                'entityType' in parsedEntityType[0] &&
                'entityValue' in parsedEntityType[0] &&
                'offsetPercentage' in parsedEntityType[0]) {
                // generate the instances based on the data in the JSON

                for (let i = 0, n = parsedEntityType.length; i < n; ++i) {
                    const parsedEntity = parsedEntityType[i];
                    const entityFirstPosition = parseFloat(parsedEntity.offsetPercentage);
                    const entity: any = {
                        name: parsedEntity.entityValue || '',
                        type: parsedEntity.entityType || '',
                        firstPosition: isNaN(entityFirstPosition) ? null : entityFirstPosition,
                        bucket: getBucket(parsedEntity.bucket)
                    };

                    populateUncertaintyFieldsCompressed(entity, parsedEntity);

                    if (highlightEntityAndMapIcon(entity, parsedEntity.cssClass, parsedEntity.cssColor, isHighlighted)) {
                        populateUncertaintyFieldsCompressed(entity, parsedEntity);
                    }

                    strippetsData[id].entities.push(entity);
                }
            } else {
                // fallback to reading one entity from each data field
                const entityTypes = entityTypesString.split('||');
                const entityIds = String((categories['entityId'] && categoriesDV[categories['entityId']].values[index]) || '').split('||');
                const entityNames = String((categories['entityName'] && categoriesDV[categories['entityName']].values[index]) || '').split('||');
                const entityPositions = String((categories['entityPosition'] && categoriesDV[categories['entityPosition']].values[index]) || '').split('||');
                const entityColors = String((categories['entityTypeColor'] && categoriesDV[categories['entityTypeColor']].values[index]) || '').split('||');
                const entityClasses = String((categories['entityTypeClass'] && categoriesDV[categories['entityTypeClass']].values[index]) || '').split('||');
                const buckets = String((categories['bucket'] && categoriesDV[categories['bucket']].values[index]) || '').split('||');

                const propertiesLength = Math.max(entityTypes.length, entityIds.length, entityNames.length, entityPositions.length);

                if (propertiesLength) {
                    for (let i = 0; i < propertiesLength; ++i) {
                        const entityColor = entityColors.length > i ? entityColors[i] : null;
                        const entityClass = entityClasses.length > i ? entityClasses[i] : null;
                        let bucket: Bucket = null;

                        let entity: any = {
                            name: entityNames.length > i ? entityNames[i] : '',
                            type: entityTypes.length > i ? entityTypes[i] : '',
                            firstPosition: entityPositions.length > i ? parseFloat(entityPositions[i]) : null,
                            bucket: getBucket(buckets[i]),
                        };

                        populateUncertaintyFields(entity, entityIds, buckets, i);
                        highlightEntityAndMapIcon(entity, entityClass, entityColor, isHighlighted);
                        strippetsData[id].entities.push(entity);
                    }
                }
            }

            // Set highlighted state only if strippets contains a highlighted entity.
            if (!strippetsData[id].isHighlighted && isHighlighted) {
                strippetsData[id].isHighlighted = isHighlighted;
            }
        });
        const items = Object.keys(strippetsData).reduce((memo, key) => {
            memo.push(strippetsData[key]);
            return memo;
        }, []).sort((a, b) => {
            return a.order - b.order;
        });

        const bucketList = _.sortBy(bucketMap, (bucket: Bucket) => bucket.key);
        const numBuckets: number = Math.max(1, bucketList.length);
        bucketList.map(function (bucket, index) {
            bucket.value = index / numBuckets;
        });

        return {
            items: items,
            iconMap: updateIM ? Object.keys(iconMap).map(key => {
                return iconMap[key];
            }) : [],
            highlights: isHighlightingOn ? {
                entities: Object.keys(highlightedEntities).reduce((memo, key) => {
                    memo.push(highlightedEntities[key]);
                    return memo;
                }, []),
                itemIds: items.reduce((memo, item) => {
                    if (item.isHighlighted) {
                        memo.push(item.id);
                    }
                    return memo;
                }, []),
            } : null,
        };
    }

    /**
     * Initializes an instance of the IVisual.
     *
     * @param {VisualConstructorOptions} options Initialization options for the visual.
     */
    constructor(options: VisualConstructorOptions) {
        const template = require('./../templates/strippets.handlebars');
        this.$loaderElement = $(require('./../templates/loader.handlebars')());
        this.element = $('<div/>');
        this.element.append(template());
        $(options.element).append(this.element);

        this.$container = this.element.find('.strippets-container');
        this.$tabs = this.element.find('.nav');
        this.host = options.host.createSelectionManager()['hostServices'];
        this.selectionManager = new SelectionManager({ hostServices: this.host });
        this.colors = options.host.colors;

        this.inSandbox = this.element.parents('body.visual-sandbox').length > 0;

        this.viewportSize = { width: this.$container.parent().width(), height: this.$container.parent().height() };
        this.$container.width(this.viewportSize.width - this.$tabs.width());
        this.minOutlineCount = this.viewportSize.width / OUTLINE_WIDTH + 10;
        this.outlines = { $elem: this.$container.find('.outlines-panel') };
        this.thumbnails = { $elem: this.$container.find('.thumbnails-panel') };

        this.initializeTabs(this.$tabs);

        this.resizeOutlines = _.debounce(function () {
            if (this.outlines && this.outlines.instance) {
                this.outlines.instance.resize();
            }
            else if (this.thumbnails && this.thumbnails.instance) {
                this.thumbnails.instance.resize();
            }
        }, ENTITIES_REPOSITION_DELAY).bind(this);

        // Kill touch events to prevent PBI mobile app refreshing while scrolling strippets
        const killEvent = (event) => {
            event.originalEvent.stopPropagation();
            event.originalEvent.stopImmediatePropagation();
            return true;
        };
        this.$container.on('touchstart', killEvent);
        this.$container.on('touchmove', killEvent);
        this.$container.on('touchend', killEvent);
    }

    /**
     * Instantiates and configures the Outlines component
     * @returns {*|exports|module.exports}
     */
    private initializeOutlines(): any {
        const t = this;
        const Outlines = require('@uncharted/strippets');
        const $outlines = t.outlines.$elem;

        const outlinesInstance = new Outlines($outlines[0], {
            outline: {
                reader: {
                    enabled: true,
                    onLoadUrl: $.proxy(t.onLoadArticle, t),
                    onReaderOpened: (id) => {
                        t.lastOpenedStoryId = id;
                    },
                    onReaderClosed: () => {
                        t.lastOpenedStoryId = null;
                    },
                },
                enableExpandedMode: false,
            },
            autoGenerateIconMap: false,
            supportKeyboardNavigation: false,
            entityIcons: [],
        }, t.mediator);
        // set up infinite scroll
        let infiniteScrollTimeoutId: any;
        outlinesInstance.$viewport.on('scroll', (e) => {
            if ($(e.target).width() + e.target.scrollLeft >= e.target.scrollWidth) {
                infiniteScrollTimeoutId = setTimeout(() => {
                    clearTimeout(infiniteScrollTimeoutId);
                    if (!t.isLoadingMore && t.hasMoreData) {
                        t.isLoadingMore = true;
                        t.showLoader();
                        t.host.loadMoreData();
                    }
                }, t.INFINITE_SCROLL_DELAY);
            }
        });

        // Register Click Event
        outlinesInstance.$viewport.off('click');

        return outlinesInstance;
    }

    // https://stackoverflow.com/questions/35962586/javascript-remove-inline-event-handlers-attributes-of-a-node#35962814
    public static removeScriptAttributes(el) {
        const attributes = [].slice.call(el.attributes);

        for (let i = 0; i < attributes.length; i++) {
            const att = attributes[i].name;

            if (att.indexOf('on') === 0) {
                el.attributes.removeNamedItem(att);
            }
        }
    }

    /**
     * Removes dangerous tags, such as scripts, from the given HTML content.
     * @param {String} html - HTML content to clean
     * @param {Array} whiteList - Array of HTML tag names to accept
     * @returns {String} HTML content, devoid of any tags not in the whitelist
     */
    public static sanitizeHTML(html: string, whiteList: string[]): string {
        let cleanHTML = '';
        if (html && whiteList && whiteList.length) {
            // Stack Overflow is all like NEVER PARSE HTML WITH REGEX
            // http://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454
            // plus the C# whitelist regex I found didn't work in JS
            // http://stackoverflow.com/questions/307013/how-do-i-filter-all-html-tags-except-a-certain-whitelist#315851
            // So going with the innerHTML approach...
            // http://stackoverflow.com/questions/6659351/removing-all-script-tags-from-html-with-js-regular-expression

            let doomedNodeList = [];

            if (!document.createTreeWalker) {
                return ''; // in case someone's hax0ring us?
            }

            let div = $('<div/>');
            div.html(html);

            let filter: any = function (node) {
                if (whiteList.indexOf(node.nodeName.toUpperCase()) === -1) {
                    StrippetBrowser16424341054522.removeScriptAttributes(node);
                    return NodeFilter.FILTER_ACCEPT;
                }

                return NodeFilter.FILTER_SKIP;
            };

            filter.acceptNode = filter;

            // Create a tree walker (hierarchical iterator) that only exposes non-whitelisted nodes, which we'll delete.
            let treeWalker = document.createTreeWalker(
                div.get()[0],
                NodeFilter.SHOW_ELEMENT,
                filter,
                false
            );

            while (treeWalker.nextNode()) {
                doomedNodeList.push(treeWalker.currentNode);
            }

            let length = doomedNodeList.length;
            for (let i = 0; i < length; i++) {
                if (doomedNodeList[i].parentNode) {
                    try {
                        doomedNodeList[i].parentNode.removeChild(doomedNodeList[i]);
                    } catch (ex) { }
                }
            }

            // convert back to a string.
            cleanHTML = div.html().trim();
        }

        return cleanHTML;
    }

    /**
     * Handler for the readers to call when an article is ready to load.
     * If the article content is a readability URL, the actual article text will first be fetched.
     * The article is cleaned and highlighted before being returned in a Promise, as part of a reader config object.
     * @param {String} articleId - primary key value for the datum containing the article to load.
     */
    private onLoadArticle(articleId: string): any {
        const t = this;
        const data = _.find(<any>t.data.items, (d: any) => d.id === articleId);
        if (data) {
            if (StrippetBrowser16424341054522.isUrl(data.content)) {
                if (t.settings.content.readerContentType === 'readability') {
                    return new Promise((resolve: any, reject: any) => {
                        $.ajax({
                            dataType: 'jsonp',
                            method: 'GET',
                            url: data.content,
                        }).done((responseBody) => {
                            const highlightedContent = t.highlight(StrippetBrowser16424341054522.sanitizeHTML(responseBody.content || responseBody, StrippetBrowser16424341054522.HTML_WHITELIST_CONTENT), data.entities);
                            resolve({
                                title: StrippetBrowser16424341054522.asUtf8(data.title ? StrippetBrowser16424341054522.cleanString(String(data.title)) : ''),
                                content: highlightedContent || '',
                                author: StrippetBrowser16424341054522.cleanString(data.author),
                                source: StrippetBrowser16424341054522.cleanString(data.source),
                                sourceUrl: StrippetBrowser16424341054522.cleanString(data.sourceUrl),
                                figureImgUrl: StrippetBrowser16424341054522.cleanString(data.imageUrl),
                                figureCaption: '',
                                lastupdatedon: data.articleDate ? moment(data.articleDate).format('MMM. D, YYYY') : '',
                            });
                        }).fail((err) => {
                            reject(err);
                        });
                    });
                }
                else if (t.settings.content.readerContentType === 'web') {
                    const readerData = {
                        title: '',
                        content: '<iframe src="' + data.content + '" style="width:100%;height:100%;border:none;"></iframe>',
                        author: '',
                        source: '',
                        sourceUrl: StrippetBrowser16424341054522.cleanString(data.sourceUrl),
                        figureImgUrl: '',
                        figureCaption: '',
                        lastupdatedon: '',
                    };
                    return new Promise((resolve: any) => resolve(readerData));
                }
                else {
                    const readerData = {
                        title: StrippetBrowser16424341054522.asUtf8(data.title ? StrippetBrowser16424341054522.cleanString(String(data.title)) : ''),
                        content: '<a href="#" onclick="javascript:window.open(\'' + data.content + '\')">' + data.content + '</a>',
                        author: StrippetBrowser16424341054522.cleanString(data.author),
                        source: StrippetBrowser16424341054522.cleanString(data.source),
                        sourceUrl: StrippetBrowser16424341054522.cleanString(data.sourceUrl),
                        figureImgUrl: StrippetBrowser16424341054522.cleanString(data.imageUrl),
                        figureCaption: '',
                        lastupdatedon: data.articleDate ? moment(data.articleDate).format('MMM. D, YYYY') : '',
                    };
                    return new Promise((resolve: any) => resolve(readerData));
                }
            } else {
                const readerData = {
                    title: StrippetBrowser16424341054522.asUtf8(data.title ? StrippetBrowser16424341054522.cleanString(String(data.title)) : ''),
                    content: t.highlight(StrippetBrowser16424341054522.sanitizeHTML(data.content, StrippetBrowser16424341054522.HTML_WHITELIST_CONTENT), data.entities) || '',
                    author: StrippetBrowser16424341054522.cleanString(data.author),
                    source: StrippetBrowser16424341054522.cleanString(data.source),
                    sourceUrl: StrippetBrowser16424341054522.cleanString(data.sourceUrl),
                    figureImgUrl: StrippetBrowser16424341054522.cleanString(data.imageUrl),
                    figureCaption: '',
                    lastupdatedon: data.articleDate ? moment(data.articleDate).format('MMM. D, YYYY') : '',
                };
                return new Promise((resolve: any) => resolve(readerData));
            }
        } else {
            // throwing an error here will cause the component to be unresponsive.
            // throw new Error('Unable to load Document');
        }
    }

    /**
     * Regular expression used to determine if a given string represents a URL.
     * @type {RegExp}
     */
    private static URL_PATTERN = new RegExp('^(https?)://[^\s/$.?#].[^\s]*', 'i');

    /**
     * Test if the given string is a URL.
     * @param {string} candidate - Check if this string is a URL
     * @returns {boolean} true if the candidate looks like a URL
     */
    public static isUrl(candidate) {
        // weak pattern, revisit later on.
        return StrippetBrowser16424341054522.URL_PATTERN.test(candidate);
    }

    /**
     * A Regex to escape a string to make it Regex-safe. Fight fire with fire.
     * http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
     * @param {string} s - string to escape
     * @returns {string} escaped string
     */
    public static escapeRegex(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    /**
     * Within the given HTML Text node, replace text matching the given regex using the given handler.
     * Adapted from:
     * http://stackoverflow.com/questions/22129405/replace-text-in-the-middle-of-a-textnode-with-an-element
     * @param {Object} node - An HTML Text node (a text run from between tags)
     * @param {Object} regex - a RegExp to test for the string we're replacing
     * @param {Function} handler - a method to perform the actual replacement,
     * accepting one argument: an array of hits as returned by regex.exec()
     */
    public static textNodeReplace(node, regex, handler) {
        let mom = node.parentNode, nxt = node.nextSibling,
            doc = node.ownerDocument, hits;
        if (node.hasHits) {
            if (regex.global) {
                while (node && (hits = regex.exec(node.nodeValue))) {
                    regex.lastIndex = 0;
                    node = handleResult(node, hits, handler.apply(this, hits));
                }
            } else if (hits = regex.exec(node.nodeValue)) {
                handleResult(node, hits, handler.apply(this, hits));
            }
        }

        function handleResult(node, hits, results) {
            let orig = node.nodeValue;
            node.nodeValue = orig.slice(0, hits.index);
            [].concat(create(mom, results)).forEach((n) => {
                mom.insertBefore(n, nxt);
            });
            let rest = orig.slice(hits.index + hits[0].length);
            return rest && mom.insertBefore(doc.createTextNode(rest), nxt);
        }

        function create(el, o) {
            if (o.map) return o.map((v) => { return create(el, v); });
            else if (typeof o === 'object') {
                let e = doc.createElementNS(o.namespaceURI || el.namespaceURI, o.name);
                if (o.attrs) for (let a in o.attrs) e.setAttribute(a, o.attrs[a]);
                if (o.content)[].concat(create(e, o.content)).forEach(e.appendChild, e);
                return e;
            } else return doc.createTextNode(o + '');
        }
    }

    /**
     * Highlight the given entities within the given content by surrounding the entity text with suitably-styled span elements.
     * @param {string} content - HTML passage to search for & highlight entities
     * @param {Array} entities - Array of entity Objects; instances of their names within content will be replaced by HTML to visually highlight them.
     * @returns {string} content with any found entities highlighted
     */
    private highlight(content, entities) {
        let highlightedContent = content;

        if (content && entities) {
            if (!document.createTreeWalker) {
                return highlightedContent; // in case someone's hax0ring us?
            }

            const t = this;
            const highlightClass = 'highlightedText';

            // Create an off-screen sub-DOM so we can do object-oriented highlighting instead of failure-prone regex.
            let div = $('<div/>');
            div.html(highlightedContent);

            let entityMap: any = {};

            const entityCount = entities.length;

            // remove duplicate entities
            for (let i = 0; i < entityCount; i++) {
                const entity = entities[i];
                const name = entity.name;
                const trim = name.trim();
                if (trim && !entityMap[trim]) {
                    const type = entity.type;
                    const iconMap = _.find(t.data.iconMap, (im: any) => {
                        return im.type === type && im.name === name;
                    });
                    const mappedEntity: MappedEntity = {
                        color: iconMap ? iconMap.color : '',
                        key: trim.replace(/\s+/g, '_'),
                        name: entity.name,
                        text: trim,
                        type: type
                    };
                    entityMap[trim] = mappedEntity;
                }
            }

            // Create a tree walker (hierarchical iterator) that only exposes non-highlighted text nodes, which we'll
            // search for entities.
            let filterRegex = null;
            let filter: any = function (node: HitNode) {
                if ($(node.parentNode).hasClass(highlightClass)) {
                    return NodeFilter.FILTER_REJECT;
                }

                if (filterRegex) {
                    // Using test() here, and only calling exec() (or match) when replacing,
                    // is empirically somewhat faster than calling exec() here and storing the matches for replacing;
                    // presumably because we test (and reject) significantly more nodes than we perform replacements on.
                    filterRegex.lastIndex = 0;
                    node.hasHits = filterRegex.test(node.nodeValue);
                    if (!node.hasHits) {
                        return NodeFilter.FILTER_REJECT;
                    }
                }
                else {
                    node.hasHits = true; // assume it has hits
                }

                return NodeFilter.FILTER_ACCEPT;
            };

            filter.acceptNode = filter;

            // Create a DOM tree walker that only iterates over text runs
            let treeWalker = document.createTreeWalker(div.get()[0], NodeFilter.SHOW_TEXT, filter, false);

            entityMap = _.toArray(entityMap).sort(function (a: MappedEntity, b: MappedEntity) {
                return b.text.length - a.text.length;
            });
            _.each(entityMap, function (entity) {
                let textNodes = [];

                // used by the NodeFilter above
                filterRegex = new RegExp('(?:^|\\s|[<\\[\\({"\'])' + StrippetBrowser16424341054522.escapeRegex(entity.text) + '(?:^|\\s|[.,;:!?\\]}>\\)\'"])', 'ig');

                // walk the DOM tree once per entity, so that newly-added spans are treated as nodes
                treeWalker.currentNode = treeWalker.root;

                while (treeWalker.nextNode()) {
                    textNodes.push(treeWalker.currentNode);
                }

                const textNodeCount = textNodes.length;
                if (textNodeCount) {
                    for (let i = 0; i < textNodeCount; i++) {
                        let node = textNodes[i];
                        filterRegex.lastIndex = 0;
                        StrippetBrowser16424341054522.textNodeReplace(node, filterRegex, function (match) {
                            return {
                                name: 'span',
                                attrs: {
                                    id: entity.key + '_' + i,
                                    class: highlightClass,
                                    'data-type': entity.type,
                                    'data-name': entity.name,
                                    style: entity.color
                                },
                                content: match
                            };
                        });
                    }
                }
            });

            highlightedContent = div.html();
        }

        return highlightedContent;
    }

    /**
     * Instantiates and configures the Thumbnails component
     * @returns {Thumbnails|exports|module.exports}
     */
    private initializeThumbnails(data): any {
        const t = this;
        const Thumbnails = require('@uncharted/thumbnails/src/thumbnails');
        const $thumbnails = t.thumbnails.$elem;
        const thumbnailsInstance = new Thumbnails({
            container: $thumbnails,
            entityIcons: (data && data.iconMap) || [],
            config: {
                outlineReader: {
                    onLoadUrl: t.onLoadArticle.bind(t),
                },
                thumbnail: {
                    height: '300px'
                },
            }
        });

        // set up infinite scroll
        let infiniteScrollTimeoutId: any;
        thumbnailsInstance._$element.on('scroll', (e) => {
            if ($(e.target).hasClass(thumbnailsDefaults.classes.thumbnails.inlineThumbnails.slice(1))) {
                if ($(e.target).width() + e.target.scrollLeft >= e.target.scrollWidth) {
                    infiniteScrollTimeoutId = setTimeout(() => {
                        clearTimeout(infiniteScrollTimeoutId);
                        if (!t.isLoadingMore && t.hasMoreData) {
                            t.isLoadingMore = true;
                            t.showLoader();
                            t.host.loadMoreData();
                        }
                    }, t.INFINITE_SCROLL_DELAY);
                }
            } else {
                if ($(e.target).height() + e.target.scrollTop >= e.target.scrollHeight) {
                    infiniteScrollTimeoutId = setTimeout(() => {
                        clearTimeout(infiniteScrollTimeoutId);
                        if (!t.isLoadingMore && t.hasMoreData) {
                            t.isLoadingMore = true;
                            t.showLoader();
                            t.host.loadMoreData();
                        }
                    }, t.INFINITE_SCROLL_DELAY);
                }
            }
        });

        // Disable keyboard event handling on readerview
        $thumbnails.find('.readerview').off('keyup').off('keydown');

        // Handle reader open & close events
        thumbnailsInstance.off(THUMBNAIL_READER_CLOSE_EVENTS);
        thumbnailsInstance.on(THUMBNAIL_READER_CLOSE_EVENTS, () => {
            t.closeReader();
            t.lastOpenedStoryId = null;
        });
        thumbnailsInstance.on('outlineReader:contentLoad', (id) => {
            t.lastOpenedStoryId = id;
        });

        return thumbnailsInstance;
    }

    private saveThumbnailType(): void {
        this.suppressNextUpdate = true;
        this.host.persistProperties({
            merge: [
                {
                    objectName: 'presentation',
                    selector: undefined,
                    properties: { strippetType: this.settings.presentation.strippetType },
                },
            ],
        });
    }

    /**
     * Binds click event handlers to the Thumbnails and Outlines tab controls.
     * @param {JQuery} $container - jquery-wrapped parent Element of the tabs
     */
    private initializeTabs($container: JQuery): void {
        const t = this;
        const $thumbnailsTab = $container.find('.thumbnailsNav');
        const $outlinesTab = $container.find('.outlinesNav');

        $thumbnailsTab.on('click', (e) => {
            if (this.settings.presentation.strippetType !== 'thumbnails') {
                e.stopPropagation();
                return t.showThumbnails(t.data, false).then(() => {
                    if (t.lastOpenedStoryId) {
                        t.openReader(t.lastOpenedStoryId);
                    }
                    t.saveThumbnailType();
                });
            }
        });
        $outlinesTab.on('click', (e) => {
            if (this.settings.presentation.strippetType !== 'outlines') {
                e.stopPropagation();
                t.showOutlines(t.data, false);
                if (t.lastOpenedStoryId) {
                    t.openReader(t.lastOpenedStoryId);
                }
                t.saveThumbnailType();
            }
        });
        $container.on('click', () => {
            t.closeReader();
        });
    }

    private static hasRequiredFields(dataView: DataView): boolean {
        const columns = dataView.metadata.columns;
        // return true if the id column is populated.
        return _.some(columns || [], (col: any) => col && col.roles.id);
    }

    /**
     * Notifies the IVisual of an update (data, viewmode, size change).
     * @param {VisualUpdateOptions} options - data and config from PowerBI
     */
    public update(options: VisualUpdateOptions): void {
        if (this.suppressNextUpdate) {
            this.suppressNextUpdate = false;
            return;
        }

        this.element.css({ width: options.viewport.width, height: options.viewport.height });
        if (options.dataViews && options.dataViews.length > 0) {

            let shouldLoadMore = false;
            const dataView = options.dataViews && options.dataViews.length && options.dataViews[0];
            const newObjects = dataView && dataView.metadata && dataView.metadata.objects;
            this.settings = $.extend(true, {}, StrippetBrowser16424341054522.DEFAULT_SETTINGS, newObjects);

            if (options.type & powerbi.VisualUpdateType.Resize || this.$tabs.is(':visible') !== this.settings.presentation.viewControls || !this.data) {
                // set the strippets container width dynamically.
                this.viewportSize = {
                    width: this.$container.parent().width(),
                    height: this.$container.parent().height()
                }; // options.viewport;
                this.$container.width(this.viewportSize.width - (this.settings.presentation.viewControls ? this.$tabs.width() : 0));
                this.minOutlineCount = this.viewportSize.width / OUTLINE_WIDTH + 10;
                this.settings.presentation.viewControls ? this.$tabs.show() : this.$tabs.hide();

                shouldLoadMore = !!dataView.metadata.segment && this.data && this.data.items.length < this.minOutlineCount;

                this.resizeOutlines();
            }

            // if first load, make sure outlines are filled (for situations where there are alot of entities)
            if (options.type & powerbi.VisualUpdateType.Data && dataView.categorical && dataView.categorical.categories) {
                // Sandbox mode vs non-sandbox mode handles merge data differently.
                const currentDataViewSize = dataView.categorical.categories[0].values.length;
                let currentRowCount = dataView.categorical.categories[0].values.length;
                let loadedPreviously = false;

                if (options.operationKind === VisualDataChangeOperationKind.Append) {
                    loadedPreviously = true;
                    currentRowCount = currentDataViewSize;
                }

                const previousLastItemIndex = loadedPreviously ? this.data.items.length - 1 : 0;

                const isHighlighting = (dataView.categorical
                    && dataView.categorical.values
                    && dataView.categorical.values.length
                    && dataView.categorical.values[0].highlights
                    && dataView.categorical.values[0].highlights.length > 0);

                // if highlighting and the reader is opened, close it.
                if (isHighlighting && this.lastOpenedStoryId) {
                    this.closeReader();
                }
                this.hasMoreData = !!dataView.metadata.segment && StrippetBrowser16424341054522.hasRequiredFields(dataView);

                const data = StrippetBrowser16424341054522.converter(options.dataViews[0], true, loadedPreviously ? this.data : null, loadedPreviously ? this.lastDataViewLength : 0, this.colors);
                this.lastDataViewLength = currentDataViewSize;

                //  initialize with highlighting disabled
                if (!loadedPreviously) {
                    this.setHighlighting(false);
                }

                // keep a copy of the converted data
                this.data = JSON.parse(JSON.stringify(data));

                // setup append object if documents have already been loaded.
                if (loadedPreviously && previousLastItemIndex > 0) {
                    data.items = data.items.slice(previousLastItemIndex);
                }
                // ignore the last element if there is more items to be loaded (in case there are more than N entities associated with the last document.
                if (this.hasMoreData && data.items.length > 0) {
                    data.items = data.items.slice(0, data.items.length - 1);
                }

                if (this.settings.presentation.strippetType === 'outlines') {
                    this.showOutlines.call(this, data, loadedPreviously);
                }
                else {
                    this.showThumbnails.call(this, data, loadedPreviously);
                }

                // Load more only if there is room to place more data. If not Highlighting, check items. If highlighting, check only highlighted items.
                const getShouldLoadMore = () => {
                    return (!isHighlighting && this.hasMoreData && this.data.items.length < this.minOutlineCount)
                        || (isHighlighting && this.hasMoreData && this.data.items.reduce((count, item) => {
                            return item.isHighlighted ? count + 1 : count;
                        }, 0) < this.minOutlineCount);
                };

                shouldLoadMore = shouldLoadMore || getShouldLoadMore();

                // count of unhighlighted rows to use as a baseline.
                if (!isHighlighting) {
                    this.baseRowsLoaded = currentRowCount;
                }

                // if there is no more data to be loaded, perform check to see if highlighting should be disabled.
                // Highlighting should be disabled if all elements for all documents have been highlighted.
                if (isHighlighting) {
                    const partiallyHighlighted = this.data.items.some((item) => {
                        return item.isHighlighted && item.entities.some((entity) => {
                            return !entity.isHighlighted;
                        });
                    });
                    this.setHighlighting(partiallyHighlighted);
                } else {
                    this.setHighlighting(true);
                }

            }

            if (shouldLoadMore) {
                this.showLoader();
                console.log('WidgetStrippets.update loadMoreData');
                this.host.loadMoreData();
            }

            // POST PROCESS (once all the thumbnails have been rendered)
            if (this.settings.presentation.strippetType === 'thumbnails') {
                const viewportPadding = 0;
                const viewportHeight = this.thumbnails.$elem.find('.viewport').height();
                const desiredThumbnailHeight = viewportHeight - viewportPadding;

                this.clearWrapTimeout();
                this.thumbnailsWrapTimeout = setTimeout(() => {
                    let oldIsWrap = this.isThumbnailsWrapLayout;
                    if (this.thumbnailViewportHeight !== this.viewportSize.height) {
                        const actualThumbnailHeight = parseInt(this.thumbnails.$elem.find('.thumbnail').css('height'));
                        const maxThumbnailHeight = parseInt(this.thumbnails.$elem.find('.thumbnail').css('max-height'));
                        if ((actualThumbnailHeight >= maxThumbnailHeight) && !this.settings.presentation.wrap) {
                            this.wrapThumbnails(true);
                            this.thumbnails.$elem.find('.thumbnail').height(desiredThumbnailHeight);
                            this.isThumbnailsWrapLayout = true;
                            this.thumbnailViewportHeight = this.viewportSize.height;
                        } else if ((actualThumbnailHeight >= desiredThumbnailHeight) && this.settings.presentation.wrap) {
                            this.wrapThumbnails(false);
                            this.thumbnails.$elem.find('.thumbnail').height('100%');
                            this.isThumbnailsWrapLayout = false;
                            this.thumbnailViewportHeight = this.viewportSize.height;
                        }
                    } else if (this.isThumbnailsWrapLayout !== this.settings.presentation.wrap) {
                        this.thumbnails.$elem.find('.thumbnail').height(desiredThumbnailHeight);
                        this.isThumbnailsWrapLayout = this.settings.presentation.wrap;
                    }

                    if (this.isThumbnailsWrapLayout !== oldIsWrap) {
                        this.host.persistProperties({
                            merge: [
                                {
                                    objectName: 'presentation',
                                    selector: undefined,
                                    properties: { wrap: this.isThumbnailsWrapLayout },
                                },
                            ],
                        });
                    }

                    this.thumbnailsWrapTimeout = null;
                }, 200);
            }
        }
    }

    /**
     * Adds or removes the highlight CSS style from the container Element.
     * @param {Boolean} state - true if we are highlighting
     */
    private setHighlighting(state: boolean) {
        const highlightClass = 'no-highlight';
        if (state) {
            this.$container.removeClass(highlightClass);
        } else {
            this.$container.addClass(highlightClass);
        }
    }

    /**
     * Switch to Outlines view, closing the Thumbnails reader if it's open, and instantiating Outlines, if necessary.
     * @param {Object} data - converted PowerBI data to render as outlines
     * @param {Boolean} append - true if the data contains new values only, and existing thumbnails should be preserved (deprecated use case)
     */
    private showOutlines(data: any, append: boolean = false) {
        // highlight outline tab
        this.$tabs.find('.navItem').removeClass('selected');
        this.$tabs.find('.outlinesNav').addClass('selected');
        this.settings.presentation.strippetType = 'outlines';


        if (this.thumbnails.instance && this.thumbnails.instance._readerview && $.contains(this.$container[0], this.thumbnails.$elem[0])) {
            // ensure that the reader view is closed before detaching.
            this.thumbnails.instance.closeReader();
            this.thumbnails.$elem.detach();
        }

        if (!this.outlines.instance) {
            this.outlines.instance = this.initializeOutlines.call(this, this.$container);
        }

        if (!$.contains(this.$container[0], this.outlines.$elem[0])) {
            this.$container.append(this.outlines.$elem[0]);
        }

        // enable animations
        (<any>$).Velocity.mock = false;

        this.hideLoader();
        this.updateOutlines.call(this, data, append);

    }

    /**
     * Switch to Thumbnails view, detaching the Outlines reader if it's open, and instantiating Thumbnails, if necessary.
     * @param {Object} data - converted PowerBI data to render as thumbnails
     * @param {Boolean} append - true if the data contains new values only, and existing thumbnails should be preserved (deprecated use case)
     */
    private showThumbnails(data: any, append: boolean = false) {
        // highlight thumbnail tab
        this.$tabs.find('.navItem').removeClass('selected');
        this.$tabs.find('.thumbnailsNav').addClass('selected');
        this.settings.presentation.strippetType = 'thumbnails';

        if (this.outlines && $.contains(this.$container[0], this.outlines.$elem[0])) {
            this.outlines.$elem.detach();
        }
        // Initialize Thumbnails if it hasn't been created yet.
        if (!this.thumbnails.instance) {
            this.thumbnails.instance = this.initializeThumbnails.call(this, data);
        }
        if (!$.contains(this.$container[0], this.thumbnails.$elem[0])) {
            this.$container.append(this.thumbnails.$elem[0]);
        }

        // enable animations
        (<any>$).Velocity.mock = true;

        this.hideLoader();
        return this.updateThumbnails.call(this, data, append, this.settings.presentation.wrap);
    }

    /**
     * Update the Outlines component's data
     * @param {Object} data - converted PowerBI data to render as outlines
     * @param {Boolean} append - true if the data contains new values only, and existing outlines should be preserved (deprecated use case)
     */
    private updateOutlines(data: any, append: boolean): any {
        if (!data.highlights) {
            // Initialize Outlines if it hasn't been created yet.
            this.outlines.instance._iconMaps = data.iconMap;
            // unhighlight
            this.outlines.instance.filter(null);
            this.outlines.instance.highlight(null);
            this.outlines.instance.loadData(data.items, append);
            this.isLoadingMore = false;
        } else {
            // if first load, filter everything first before the real filter
            if (!append) {
                this.outlines.instance.filter(() => {
                    return false;
                });
            }

            let newOutlineItems = data.items.filter((item) => {
                return !this.outlines.instance._items.some((outline) => {
                    return outline.data.id === item.id;
                });
            });
            if (newOutlineItems && newOutlineItems.length > 0) {
                this.outlines.instance._iconMaps = data.iconMap;
                this.outlines.instance.loadData(newOutlineItems, append);
            }
            this.outlines.instance.filter(data.highlights.itemIds);
            this.outlines.instance.highlight(data.highlights.entities);
        }
    }

    /**
     * Update the Thumbnails component's data
     * @param {Object} data - converted PowerBI data to render as thumbnails
     * @param {Boolean} append - true if the data contains new values only, and existing thumbnails should be preserved (deprecated use case)
     * @param {Boolean} wrapped - true if thumbnails should be rendered in multiple rows; false to keep them all in one row
     */
    private updateThumbnails(data: any, append: boolean, wrapped: boolean): any {
        if (!data.highlights) {
            this.thumbnails.instance.iconMap = data.iconMap;
            this.thumbnails.instance._outlineReader._iconMap = data.iconMap;

            // unhighlight
            this.thumbnails.instance.filter(null);
            this.thumbnails.instance.highlight(null);

            /* make sure the summary is populated if possible */
            const promises = [];
            data.items.forEach(item => {
                if (!item.summary && item.content) {
                    item.summary = item.content;
                    if (this.settings.content.readerContentType === 'readability' && StrippetBrowser16424341054522.isUrl(item.summary) &&
                        this.settings.content.summaryUrl) {
                        const promise = new Promise((resolve: any, reject: any) => {
                            $.ajax({
                                dataType: 'jsonp',
                                method: 'GET',
                                url: item.summary,
                            }).done((responseBody) => {
                                item.summary = StrippetBrowser16424341054522.sanitizeHTML(responseBody.content || responseBody, StrippetBrowser16424341054522.HTML_WHITELIST_SUMMARY);
                                resolve(true);
                            }).fail((err) => {
                                reject(err);
                            });
                        });
                        promises.push(promise);
                    } else {
                        item.summary = StrippetBrowser16424341054522.sanitizeHTML(item.summary, StrippetBrowser16424341054522.HTML_WHITELIST_SUMMARY);
                    }
                }
            });

            return Promise.all(promises).then(() => {
                this.thumbnails.instance.loadData(data.items, append);
                this.isLoadingMore = false;
                this.wrapThumbnails(wrapped);
                return null;
            });
        } else {
            let newThumbnailItems;
            if (append) {
                newThumbnailItems = data.items.filter((item) => {
                    return !this.thumbnails.instance._thumbnailItems.some((thumbnail) => {
                        return thumbnail.data.id === item.id;
                    });
                });
            }
            else {
                newThumbnailItems = data.items;
            }
            if (newThumbnailItems && newThumbnailItems.length > 0) {
                this.thumbnails.instance.iconMap = data.iconMap;
                this.thumbnails.instance.loadData(newThumbnailItems, append);
            }
            this.thumbnails.instance.filter(data.highlights.itemIds);
            this.thumbnails.instance.highlight(data.highlights.entities);
        }

        return Promise.resolve();
    }

    /**
     * Set the wrapping state of the thumbnails component.
     * @param {Boolean} wrapped - true if thumbnails should be rendered in multiple rows; false to keep them all in one row
     */
    private wrapThumbnails(wrapped: boolean) {
        this.thumbnails.instance.toggleInlineDisplayMode(!wrapped);
    }

    /**
     * Close any open reader,
     */
    public closeReader(): void {
        if (this.settings.presentation.strippetType === 'outlines') {
            const openOutline = _.find(this.outlines.instance._items, (outline: any) => {
                return outline.getCurrentState() === 'readingmode';
            });
            if (openOutline) {
                openOutline.transitionState('minimal');
            }
        }
        else {
            this.thumbnails.instance.closeReader();
        }
    }

    /**
     * Open the appropriate reader, given the current view mode, for the datum of the given id.
     * @param {any} id - primary key value of the story to display in the reader
     */
    public openReader(id: any): void {
        if (this.settings.presentation.strippetType === 'outlines') {
            const outline = _.find(this.outlines.instance._items, (o: any) => {
                return o.data.id === id;
            });
            if (outline) {
                outline.transitionState('readingmode');
            }
        }
        else {
            const thumbnail = _.find(this.thumbnails.instance._thumbnailItems, (tn: any) => {
                return tn.data.id === id;
            });
            if (thumbnail) {
                this.thumbnails.instance.openReader(thumbnail.data);
            }
        }
    }

    /**
     * Show the animated loading icon.
     */
    private showLoader(): void {
        if (this.settings.presentation.strippetType === 'outlines') {
            this.outlines.instance.$chartContainer.append(this.$loaderElement);
        }
        else {
            this.thumbnails.instance._$thumbnailsContainer.append(this.$loaderElement);
        }
    }

    /**
     * Hide the animated loading icon.
     */
    private hideLoader(): void {
        if (this.settings.presentation.strippetType === 'outlines') {
            this.$loaderElement.detach();
        }
        else {
            this.$loaderElement.detach();
        }
    }

    private clearWrapTimeout(): void {
        if (this.thumbnailsWrapTimeout !== null) {
            clearTimeout(this.thumbnailsWrapTimeout);
            this.thumbnailsWrapTimeout = null;
        }
    }

    // /**
    // * Gets the inline css used for this element
    // */
    // protected getCss():string[] {
    //
    //    return [
    //        require('!css!./../css/font-awesome/font-awesome.css'),
    //        require('!css!./../css/strippets/strippets.css'),
    //        require('!css!./../css/thumbnails/thumbnails.css'),
    //        require('!css!./../css/strippets.css')
    //    ];
    // }

    /**
     * Enumerates the instances for the objects that appear in the PowerBI panel.
     *
     * @method enumerateObjectInstances
     * @param {EnumerateVisualObjectInstancesOptions} options - Options object containing the objects to enumerate, as provided by PowerBI.
     * @returns {VisualObjectInstance[]}
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
        let instances: VisualObjectInstance[] = [{
            selector: null,
            objectName: options.objectName,
            properties: {}
        }];
        $.extend(true, instances[0].properties, this.settings[options.objectName]);
        return instances;
    }

    /**
     * StrippetBrowser's visualization destroy method. Called by PowerBI.
     *
     * @method destroy
     */
    public destroy(): void {
        this.clearWrapTimeout();
        if (this.thumbnails && this.thumbnails.instance) {
            this.thumbnails.instance._resetThumbnailsContainer();
        }

        this.thumbnails = null;
        this.outlines = null;

        this.data = null;
        this.selectionManager = null;
        this.host = null;
    }
}
