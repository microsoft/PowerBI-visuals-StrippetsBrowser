/// <reference path="../node_modules/powerbi-visuals/lib/powerbi-visuals.d.ts"/>
// /* tslint:disable:quotemark */

import IVisual = powerbi.extensibility.v110.IVisual;
import VisualConstructorOptions = powerbi.extensibility.v110.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.v110.VisualUpdateOptions;
import DataView = powerbi.DataView;
import IEnumType = powerbi.IEnumType;
import IVisualStyle = powerbi.IVisualStyle;
import VisualCapabilities = powerbi.VisualCapabilities;
import VisualInitOptions = powerbi.VisualInitOptions;
import VisualDataRoleKind = powerbi.VisualDataRoleKind;
import IDataColorPalette = powerbi.IDataColorPalette;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import IVisualHostServices = powerbi.IVisualHostServices;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import SelectionManager = powerbi.visuals.utility.SelectionManager;
import SelectionId = powerbi.visuals.SelectionId;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewCategoricalSegment = powerbi.data.segmentation.DataViewCategoricalSegment;
import {Bucket} from './interfaces.ts';

import * as Promise from 'bluebird';
import * as $ from 'jquery';
import * as _ from 'lodash';

require('velocity-animate');
const moment = require('moment');
const COLOR_PALETTE = ['#FF001F', '#FF8000', '#AC8000', '#95AF00', '#1BBB6A', '#00C6E1', '#B44AE7', '#DB00B0'];
//const COLOR_HIGHLIGHT = '#00BFFF';
const DOCUMENT_REQUEST_COUNT = 200;
const OUTLINE_WIDTH = 24;
const ENTITIES_REPOSITION_DELAY = 500;
const HTML_WHITELIST_STANDARD = [
    "A", "ABBR", "ACRONYM", "ADDRESS", "AREA", "ARTICLE", "ASIDE", "AUDIO",
    "B", "BDI", "BDO", "BLOCKQUOTE", "BR",
    "CAPTION", "CITE", "CODE", "COL", "COLGROUP",
    "DD", "DEL", "DETAILS", "DFN", "DIV", "DL", "DT",
    "EM",
    "FIGCAPTION", "FIGURE", "FONT", "FOOTER",
    "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HGROUP", "HR", "HTML",
    "I", "INS",
    "LEGEND", "LI", "LINK",
    "MAIN", "MAP",
    // We probably don't want navigation, but it's also probably mostly harmless
    // "NAV",
    "OL",
    "P", "PRE",
    "SECTION", "SMALL", "SOURCE", "SPAN", "STRONG", "STYLE", "SUB", "SUMMARY", "SUP",
    "TABLE", "TBODY", "TD", "TEXTAREA", "TFOOT", "TH", "THEAD", "TIME", "TR",
    "U", "UL",
    "VAR",
];
const HTML_WHITELIST_MEDIA = [
    "IMG",
    "PICTURE",
    "SVG",
    "VIDEO"
];

export default class StrippetsVisual implements IVisual {
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
     * My Strippets Instance
     */
    //private $outlines:JQuery;
    private element:JQuery;
    private $container:JQuery;
    private viewportSize:any;
    private $tabs:JQuery;
    private outlines:any;
    private thumbnails:any;
    //private dataView:DataView;
    private data:any;
    private iconMap:any[];
    private inSandbox:boolean;

    private lastDataViewLength:number = 0;

    //private previousData:any;
    private isLoadingMore:boolean;
    private hasMoreData:boolean;
    private host:IVisualHostServices;
    private selectionManager:SelectionManager;
    private settings = $.extend({}, StrippetsVisual.DEFAULT_SETTINGS);
    private baseRowsLoaded:number = 0;
    private minOutlineCount = 10;
    private isThumbnailsWrapLayout:boolean;
    private $loaderElement:JQuery;
    private INFINITE_SCROLL_DELAY = 50;
    private lastOpenedStoryId:string;
    private thumbnailViewportHeight:number = 0;
    private resizeOutlines:Function;
    private thumbnailsWrapTimeout:any = null;

    public static converter(dataView:DataView, updateIconMap:boolean = false, appendTo?:any, lastDataViewLength:number = 0) {
        const categoricalDV = dataView.categorical;
        const categoriesDV = categoricalDV.categories;
        const valuesDV = categoricalDV.values;
        const categories = <any>{};
        const colors = COLOR_PALETTE.slice();
        //const DEFAULT_GREY = '#DDDDDD';

        categoriesDV.forEach((category, index) => {
            Object.keys(category.source.roles).forEach(categoryName => categories[categoryName] = index)
        });

        const updateIM = updateIconMap && categories['entityType'];

        const strippetsData = (appendTo && appendTo.items) ? appendTo.items.reduce((memo, i)=> {
            memo[i.id] = i;
            memo[i.id].order = Object.keys(memo).length + 1;
            return memo;
        }, {}) : <any>{};

        const iconMap = (appendTo && appendTo.iconMap) ? appendTo.iconMap.reduce((memo, im)=> {
            const entityTypeId = im.type + '_' + im.name;
            memo[entityTypeId] = {
                class: im.class,
                color: im.color,
                type: im.type,
                name: im.name,
                //isHighlight: im.isHighlight,
                isDefault: im.isDefault
            };
            return memo;
        }, {}) : <any>{};

        const highlightedEntities = (appendTo && appendTo.highlights && appendTo.highlights.entities) ? appendTo.highlights.entities.reduce((memo, im)=> {
            const entityTypeId = im.type + '_' + im.name;
            memo[entityTypeId] = im;
            return memo;
        }, {}) : <any>{};

        const getCategoryValue = (fieldName:string, itemIndex:number) => {
            return categories[fieldName] !== undefined ? categoriesDV[categories[fieldName]].values[itemIndex] : null;
        };
        const isHighlightingOn = valuesDV && valuesDV[0].highlights && valuesDV[0].highlights.length > 0;

        const getHighlightValue = (itemIndex:number) => {
            return isHighlightingOn ? valuesDV[0].highlights[itemIndex] : false;
        };
        const asUtf8 = (value:string) => {
            return $('<div />').html(value).text();
        };

        const bucketMap = {};
        const getBucket = (bucketValue:any) => {
            if (bucketValue) {
                if (!bucketMap[bucketValue]) {
                    let bucket : Bucket = {
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

        categoriesDV[categories['id']] && categoriesDV[categories['id']].values.slice(lastDataViewLength).forEach((id :any, adjustedIndex) => {
            // highlight table is not compensated. Since we slice the values, we need to compensate for the slice. Slicing at the highlights level
            // will result in slower performance.
            const index = adjustedIndex + lastDataViewLength;
            const isHighlighted = getHighlightValue(index);
            const title = getCategoryValue('title', index);
            if (!strippetsData[id]) {
                strippetsData[id] = {
                    id: id,
                    title: asUtf8(title ? String(title) : ""),
                    summary: getCategoryValue('summary', index),
                    content: getCategoryValue('content', index),
                    imageUrl: getCategoryValue('imageUrl', index),
                    author: getCategoryValue('author', index),
                    source: String(getCategoryValue('source', index) || ''),
                    sourceUrl: String(getCategoryValue('sourceUrl', index) || ''),
                    sourceimage: getCategoryValue('sourceImage', index),
                    articleDate: getCategoryValue('articleDate', index),
                    articledate: getCategoryValue('articleDate', index), // thumbnails data model has 'articledate' instead of 'articleDate'
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
                parsedEntityType[0].entityType && parsedEntityType[0].entityValue && parsedEntityType[0].offsetPercentage) {
                // generate the instances based on the data in the JSON
                for (let i = 0, n = parsedEntityType.length; i < n; ++i) {
                    const parsedEntity = parsedEntityType[i];
                    const entity = {
                        id: parsedEntity.entityId || null,
                        name: parsedEntity.entityValue || '',
                        type: parsedEntity.entityType || '',
                        firstPosition: parsedEntity.offsetPercentage || null,
                        bucket: getBucket(parsedEntity.bucket)
                    };

                    if (entity.type && entity.name) {
                        const entityTypeId = entity.type + '_' + entity.name;
                        if (isHighlighted && !highlightedEntities[entityTypeId]) {
                            highlightedEntities[entityTypeId] = {
                                id: entity.id,
                                type: entity.type,
                                name: entity.name,
                                bucket: entity.bucket
                            };
                        }
                        if (updateIM && !iconMap[entityTypeId]) {
                            iconMap[entityTypeId] = {
                                class: parsedEntity.cssClass || 'fa fa-circle',
                                color: parsedEntity.cssColor || colors.shift(),
                                type: entity.type,
                                name: entity.name,
                                isDefault: false
                            }
                        }
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

                        const entity = {
                            id: entityIds.length > i ? entityIds[i] : '',
                            name: entityNames.length > i ? entityNames[i] : '',
                            type: entityTypes.length > i ? entityTypes[i] : '',
                            firstPosition: entityPositions.length > i ? parseFloat(entityPositions[i]) : null,
                            bucket: getBucket(buckets[i]),
                            //isHighlighted: isHighlighted,
                        };

                        if (entity.type && entity.name) {
                            const entityTypeId = entity.type + '_' + entity.name;
                            if (isHighlighted && !highlightedEntities[entityTypeId]) {
                                highlightedEntities[entityTypeId] = {
                                    id: entity.id,
                                    type: entity.type,
                                    name: entity.name,
                                    bucket: entity.bucket,
                                };
                            }
                            if (updateIM && !iconMap[entityTypeId]) {
                                iconMap[entityTypeId] = {
                                    class: entityClass || 'fa fa-circle',
                                    color: entityColor === null ? colors.shift() : entityColor,
                                    type: entity.type,
                                    name: entity.name,
                                    //isHighlight: isHighlighted,
                                    isDefault: false
                                }
                            }

                        }

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
        }, []).sort((a, b)=> {
            return a.order - b.order;
        });

        const bucketList = _.sortBy(bucketMap, (bucket : Bucket) => bucket.key);
        const numBuckets: number = Math.max(1, bucketList.length);
        bucketList.map(function(bucket, index) {
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
                itemIds: items.reduce((memo, item)=> {
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
     * @param options Initialization options for the visual.
     */
    constructor(options: VisualConstructorOptions) {
        const template = require('./../templates/strippets.handlebars');
        this.$loaderElement = $(require('./../templates/loader.handlebars')());
        this.element = $('<div/>');
        //this.element.css({width: options.viewport.width, height: options.viewport.height});
        this.element.append(template());
        $(options.element).append(this.element);
        //this.element.prepend($('<st' + 'yle>' + this.getCss().join('\n') + '</st' + 'yle>'));
        this.$container = this.element.find('#strippets-container');
        this.$tabs = this.element.find('.nav');
        this.host = options.host.createSelectionManager()['hostServices'];
        this.selectionManager = new SelectionManager({hostServices: this.host});

        this.inSandbox = this.element.parents('body.visual-sandbox').length > 0;

        this.viewportSize = {width: this.$container.parent().width(), height: this.$container.parent().height()}; //options.viewport;
        this.$container.width(this.viewportSize.width - this.$tabs.width());
        this.minOutlineCount = this.viewportSize.width / OUTLINE_WIDTH + 10;
        this.outlines = {$elem: this.$container.find('#outlines-panel')};
        this.thumbnails = {$elem: this.$container.find('#thumbnails-panel')};

        this.initializeTabs(this.$tabs);

        this.resizeOutlines = _.debounce(function () {
            if (this.outlines.instance) {
                this.outlines.instance.resize();
            }
            else if (this.thumbnails.instance) {
                this.thumbnails.instance.resize();
            }
        }, ENTITIES_REPOSITION_DELAY).bind(this);
    }

    private initializeOutlines($container:JQuery):any {
        const t = this;
        const Outlines = require("@uncharted/strippets");
        const $outlines = t.outlines.$elem;

        const outlinesInstance = new Outlines($outlines[0], {
            outline: {
                reader: {
                    enabled: true,
                    onLoadUrl: $.proxy(t.onLoadArticle, t),
                    onReaderOpened: (id)=> {
                        t.lastOpenedStoryId = id;
                    },
                    onReaderClosed: ()=> {
                        t.lastOpenedStoryId = null;
                    },
                },
                enableExpandedMode: false,
            },
            autoGenerateIconMap: false,
            supportKeyboardNavigation: false,
            entityIcons: [],
        });
        //set up infinite scroll
        let infiniteScrollTimeoutId:any;
        outlinesInstance.$viewport.on('scroll', (e)=> {
            if ($(e.target).width() + e.target.scrollLeft >= e.target.scrollWidth) {
                infiniteScrollTimeoutId = setTimeout(()=> {
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

    public static sanitizeHTML(html:string, whiteList:string[]):string {
        var cleanHTML = "";
        if (html && whiteList && whiteList.length) {
            // Stack Overflow is all like NEVER PARSE HTML WITH REGEX
            // http://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454
            // plus the C# whitelist regex I found didn't work in JS
            // http://stackoverflow.com/questions/307013/how-do-i-filter-all-html-tags-except-a-certain-whitelist#315851
            // So going with the innerHTML approach...
            // http://stackoverflow.com/questions/6659351/removing-all-script-tags-from-html-with-js-regular-expression

            let doomedNodeList = [];

            if (!document.createTreeWalker) {
                return ""; // in case someone's hax0ring us?
            }

            let div = $('<div/>');
            div.html(html);

            // Upcase the whitelist for easier matching later
            //length = whiteList.length;
            //for (i = 0; i < length; i++) {
            //    whiteList[i] = whiteList[i].toUpperCase();
            //}
            let filter = {
                acceptNode : function (node : Node) : number {
                    if (whiteList.indexOf(node.nodeName.toUpperCase()) === -1) {
                        return NodeFilter.FILTER_ACCEPT;
                    }

                    return NodeFilter.FILTER_SKIP;
                }
            };

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
                    } catch (ex) {}
                }
            }

            // convert back to a string.
            cleanHTML = div.html().trim();
        }

        return cleanHTML;
    }

    private onLoadArticle(articleId:string):any {
        const t = this;
        const data = <any>t.data.items.find(d=>d.id === articleId);
        if (data) {
            if (StrippetsVisual.isUrl(data.content)) {
                if (t.settings.content.readerContentType === 'readability') {
                    return new Promise((resolve:any, reject:any)=> {
                        $.ajax({
                            dataType: 'jsonp',
                            method: 'GET',
                            url: data.content,
                        }).done((responseBody) => {
                            const highlightedContent = t.highlight(StrippetsVisual.sanitizeHTML(responseBody.content || responseBody, StrippetsVisual.HTML_WHITELIST_CONTENT), data.entities);
                            resolve({
                                title: data.title || '',
                                content: highlightedContent || '',
                                author: data.author || '',
                                source: data.source || '',
                                sourceUrl: data.sourceUrl || '',
                                figureImgUrl: data.imageUrl || '',
                                figureCaption: '',
                                lastupdatedon: data.articleDate ? moment(data.articleDate).format('MMM. D, YYYY') : '',
                            });
                        }).fail((err)=> {
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
                        sourceUrl: data.sourceUrl || '',
                        figureImgUrl: '',
                        figureCaption: '',
                        lastupdatedon: '',
                    };
                    return new Promise((resolve:any) => resolve(readerData));
                }
                else {
                    const readerData = {
                        title: data.title || '',
                        content: '<a href="#" onclick="javascript:window.open(\'' + data.content + '\')">' + data.content + '</a>',
                        author: data.author || '',
                        source: data.source || '',
                        sourceUrl: data.sourceUrl || '',
                        figureImgUrl: data.imageUrl || '',
                        figureCaption: '',
                        lastupdatedon: data.articleDate ? moment(data.articleDate).format('MMM. D, YYYY') : '',
                    };
                    return new Promise((resolve:any) => resolve(readerData));
                }
            } else {
                const readerData = {
                    title: data.title || '',
                    content: t.highlight(StrippetsVisual.sanitizeHTML(data.content, StrippetsVisual.HTML_WHITELIST_CONTENT), data.entities) || '',
                    author: data.author || '',
                    source: data.source || '',
                    sourceUrl: data.sourceUrl || '',
                    figureImgUrl: data.imageUrl || '',
                    figureCaption: '',
                    lastupdatedon: data.articleDate ? moment(data.articleDate).format('MMM. D, YYYY') : '',
                };
                return new Promise((resolve:any) => resolve(readerData));
            }
        } else {
            // throwing an error here will cause the component to be unresponsive.
            //throw new Error('Unable to load Document');
        }
    }

    public static isUrl(candidate) {
        //weak pattern, revisit later on.
        var pattern = new RegExp('^(https?)://[^\s/$.?#].[^\s]*', 'i');
        return pattern.test(candidate);
    }

    // Adapted from:
    // http://stackoverflow.com/questions/22129405/replace-text-in-the-middle-of-a-textnode-with-an-element
    public static textNodeReplace(node, regex, handler) {
        var mom = node.parentNode, nxt = node.nextSibling,
            doc=node.ownerDocument, hits;
        if (node.hasHits) {
            if (regex.global) {
                while (node && (hits = regex.exec(node.nodeValue))){
                    regex.lastIndex = 0;
                    node = handleResult( node, hits, handler.apply(this, hits) );
                }
            } else if (hits = regex.exec(node.nodeValue)) {
                handleResult( node, hits, handler.apply(this,hits) );
            }
        }

        function handleResult(node, hits, results) {
            var orig = node.nodeValue;
            node.nodeValue = orig.slice(0, hits.index);
            [].concat(create(mom, results)).forEach((n) => {
                mom.insertBefore(n,nxt);
            });
            var rest = orig.slice(hits.index + hits[0].length);
            return rest && mom.insertBefore(doc.createTextNode(rest), nxt);
        }

        function create(el,o) {
            if (o.map) return o.map((v) => { return create(el,v) });
            else if (typeof o==='object') {
                var e = doc.createElementNS(o.namespaceURI || el.namespaceURI,o.name);
                if (o.attrs) for (var a in o.attrs) e.setAttribute(a,o.attrs[a]);
                if (o.content) [].concat(create(e,o.content)).forEach(e.appendChild,e);
                return e;
            } else return doc.createTextNode(o+"");
        }
    }

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
                const trim = name.replace(/(^\W)|(\W$)/g, '');
                if (trim && !entityMap[trim]) {
                    const type = entity.type;
                    const iconMap = t.data.iconMap.find((im) => {
                        return im.type === type && im.name === name;
                    });
                    entityMap[trim] = {
                        color: iconMap ? iconMap.color : '',
                        key: trim.replace(/\s+/g, '_'),
                        name: entity.name,
                        text: trim,
                        type: type
                    };
                }
            }

            // Create a tree walker (hierarchical iterator) that only exposes non-highlighted text nodes, which we'll
            // search for entities.
            let filterRegex = null;
            let filter = {
                acceptNode: (node) => {
                    if ($(node.parentNode).hasClass(highlightClass)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    if (filterRegex) {
                        // Using test() here, and only calling exec() (or match) when replacing,
                        // is empirically somewhat faster than calling exec() here and storing the matches for replacing;
                        // presumably because we test (and reject) significantly more nodes than we perform replacements on.
                        node.hasHits = filterRegex.test(node.nodeValue);
                        if (!node.hasHits) {
                            return NodeFilter.FILTER_REJECT;
                        }
                    }
                    else {
                        node.hasHits = true; // assume it has hits
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            };

            // Create a DOM tree walker that only iterates over text runs
            let treeWalker = document.createTreeWalker(div.get()[0], NodeFilter.SHOW_TEXT, filter, false);

            let uniqueEntityCount = 0;
            _.each(entityMap, function (entity) {
                uniqueEntityCount++;

                let textNodes = [];

                // used by the NodeFilter above
                filterRegex = new RegExp('\\b' + entity.text + '\\b', 'ig');

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
                        StrippetsVisual.textNodeReplace(node, filterRegex, function (match) {
                            return {
                                name: 'span',
                                attrs: {
                                    id: entity.key + '_' + i,
                                    class: highlightClass,
                                    "data-type": entity.type,
                                    "data-name": entity.name,
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

    private initializeThumbnails($container:JQuery):any {
        const t = this;
        const Thumbnails = require("@uncharted/thumbnails/src/thumbnails");
        const $thumbnails = t.thumbnails.$elem;
        const thumbnailsInstance = new Thumbnails({
            container: $thumbnails,
            entityIcons: [],
            config: {
                readerview: {
                    enabled: true,
                    onLoadUrl: $.proxy(t.onLoadArticle, t),
                    onReaderOpened: (id)=> {
                        t.lastOpenedStoryId = id;
                    },
                    onReaderClosed: ()=> {
                        t.lastOpenedStoryId = null;
                    },
                },
                thumbnail: {
                    height: '300px'
                },
            }
        });

        //set up infinite scroll
        let infiniteScrollTimeoutId:any;
        thumbnailsInstance._$element.on('scroll', (e)=> {
            if ($(e.target).hasClass('horizontal-align')) {
                if ($(e.target).width() + e.target.scrollLeft >= e.target.scrollWidth) {
                    infiniteScrollTimeoutId = setTimeout(()=> {
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
                    infiniteScrollTimeoutId = setTimeout(()=> {
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

        return thumbnailsInstance;
    }

    private initializeTabs($container:JQuery):void {
        const t = this;
        const $thumbnailsTab = $container.find('#thumbnailsNav');
        const $outlinesTab = $container.find('#outlinesNav');

        $thumbnailsTab.on('click', (e)=> {
            e.stopPropagation();
            t.showThumbnails(t.data, false);
            if (t.lastOpenedStoryId) {
                t.openReader(t.lastOpenedStoryId);
            }
        });
        $outlinesTab.on('click', (e)=> {
            e.stopPropagation();
            t.showOutlines(t.data, false);
            if (t.lastOpenedStoryId) {
                t.openReader(t.lastOpenedStoryId);
            }
        });
        $container.on('click', ()=> {
            t.closeReader();
        });
    }

    /**
     * Notifies the IVisual of an update (data, viewmode, size change).
     */
    public update(options:VisualUpdateOptions):void {
        this.element.css({width: options.viewport.width, height: options.viewport.height});
        if (options.dataViews && options.dataViews.length > 0) {

            let shouldLoadMore = false;
            const dataView = options.dataViews && options.dataViews.length && options.dataViews[0];
            const newObjects = dataView && dataView.metadata && dataView.metadata.objects;
            $.extend(true, this.settings, newObjects);

            if (options.type & powerbi.VisualUpdateType.Resize || this.$tabs.is(':visible') !== this.settings.presentation.viewControls || !this.data) {
                // set the strippets container width dynamically.
                this.viewportSize = {
                    width: this.$container.parent().width(),
                    height: this.$container.parent().height()
                }; //options.viewport;
                this.$container.width(this.viewportSize.width - (this.settings.presentation.viewControls ? this.$tabs.width() : 0));
                this.minOutlineCount = this.viewportSize.width / OUTLINE_WIDTH + 10;
                this.settings.presentation.viewControls ? this.$tabs.show() : this.$tabs.hide();

                shouldLoadMore = !!dataView.metadata.segment && this.data && this.data.items.length < this.minOutlineCount;

                this.resizeOutlines();
            }

            // if first load, make sure outlines are filled (for situations where there are alot of entities)
            if (options.type & powerbi.VisualUpdateType.Data && dataView.categorical && dataView.categorical.categories) {
                //Sandbox mode vs non-sandbox mode handles merge data differently.
                const lastMergeIndex = (<DataViewCategoricalSegment>dataView.categorical).lastMergeIndex;
                const currentDataViewSize = dataView.categorical.categories[0].values.length;
                let currentRowCount = dataView.categorical.categories[0].values.length;
                let loadedPreviously = false;
                if (lastMergeIndex !== undefined) {
                    loadedPreviously = !!this.data;
                    currentRowCount = (DOCUMENT_REQUEST_COUNT * lastMergeIndex || 0) + currentDataViewSize;
                } else {
                    // assume that if the dataview length <= the document request size, then its new data.
                    if (currentDataViewSize > DOCUMENT_REQUEST_COUNT) {
                        loadedPreviously = true;
                        currentRowCount = currentDataViewSize;
                    }
                }

                const previousLastItemIndex = loadedPreviously ? this.data.items.length - 1 : 0;


                const isHighlighting = dataView.categorical.values
                    && dataView.categorical.values[0].highlights
                    && dataView.categorical.values[0].highlights.length > 0;

                // if highlighting and the reader is opened, close it.
                if (isHighlighting && this.lastOpenedStoryId) {
                    this.closeReader();
                }
                this.hasMoreData = !!dataView.metadata.segment;

                const data = StrippetsVisual.converter(options.dataViews[0], true, loadedPreviously ? this.data : null, (loadedPreviously && lastMergeIndex === undefined) ? this.lastDataViewLength : 0);
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
                const getShouldLoadMore = ()=> {
                    return (!isHighlighting && this.hasMoreData && this.data.items.length < this.minOutlineCount)
                        || (isHighlighting && this.hasMoreData && this.data.items.reduce((count, item)=> {
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
                    const partiallyHighlighted = this.data.items.some((item)=> {
                        return item.isHighlighted && item.entities.some((entity)=> {
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
                console.log("WidgetStrippets.update loadMoreData");
                this.host.loadMoreData();
            }

            // POST PROCESS (once all the thumbnails have been rendered)
            if (this.settings.presentation.strippetType === 'thumbnails') {
                const viewportPadding = 0;
                const viewportHeight = this.thumbnails.$elem.find('.viewport').height();
                const desiredThumbnailHeight = viewportHeight - viewportPadding;

                if (this.thumbnailsWrapTimeout !== null) {
                    clearTimeout(this.thumbnailsWrapTimeout);
                    this.thumbnailsWrapTimeout = null;
                }

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
                            merge: [{
                                objectName: "presentation",
                                selector: undefined,
                                properties: {wrap: this.isThumbnailsWrapLayout},
                            },],
                        });
                    }

                    this.thumbnailsWrapTimeout = null;
                }, 200);
            }
        }
    }

    private setHighlighting(state:boolean) {
        const highlightClass = 'no-highlight';
        if (state) {
            this.$container.removeClass(highlightClass);
        } else {
            this.$container.addClass(highlightClass);
        }
    }

    private showOutlines(data:any, append:boolean = false) {
        // highlight outline tab
        this.$tabs.find('.navItem').removeClass('selected');
        this.$tabs.find('#outlinesNav').addClass('selected');
        this.settings.presentation.strippetType = 'outlines';


        if (this.thumbnails.instance && this.thumbnails.instance._readerview && $.contains(this.$container[0], this.thumbnails.$elem[0])) {
            //ensure that the reader view is closed before detaching.
            this.thumbnails.instance.closeReader();
            this.thumbnails.$elem.detach();
        }

        if (!this.outlines.instance) {
            this.outlines.instance = this.initializeOutlines.call(this, this.$container);
        }

        if (!$.contains(this.$container[0], this.outlines.$elem[0])) {
            this.$container.append(this.outlines.$elem[0]);
        }

        //enable animations
        (<any>$).Velocity.mock = false;

        this.hideLoader();
        this.updateOutlines.call(this, data, append);

    }

    private showThumbnails(data:any, append:boolean = false) {
        // highlight thumbnail tab
        this.$tabs.find('.navItem').removeClass('selected');
        this.$tabs.find('#thumbnailsNav').addClass('selected');
        this.settings.presentation.strippetType = 'thumbnails';

        if (this.outlines && $.contains(this.$container[0], this.outlines.$elem[0])) {
            this.outlines.$elem.detach();
        }
        //Initialize Thumbnails if it hasn't been created yet.
        if (!this.thumbnails.instance) {
            this.thumbnails.instance = this.initializeThumbnails.call(this, this.$container);
        }
        if (!$.contains(this.$container[0], this.thumbnails.$elem[0])) {
            this.$container.append(this.thumbnails.$elem[0]);
        }

        //enable animations
        (<any>$).Velocity.mock = true;

        this.hideLoader();
        this.updateThumbnails.call(this, data, append, this.settings.presentation.wrap);
    }

    private updateOutlines(data:any, append:boolean):any {
        if (!data.highlights) {
            //Initialize Outlines if it hasn't been created yet.
            this.outlines.instance._iconMaps = data.iconMap;
            //unhighlight
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

            var newOutlineItems = data.items.filter((item) => {
                return !this.outlines.instance._items.some((outline)=> {
                    return outline.data.id === item.id
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

    private updateThumbnails(data:any, append:boolean, wrapped:boolean):any {
        if (!data.highlights) {
            this.thumbnails.instance.iconMap = data.iconMap;
            //unhighlight
            this.thumbnails.instance.filter(null);
            this.thumbnails.instance.highlight(null);

            /* make sure the summary is populated if possible */
            const promises = [];
            data.items.forEach(item => {
                if (!item.summary && item.content) {
                    item.summary = item.content;
                    if (this.settings.content.readerContentType === 'readability' && StrippetsVisual.isUrl(item.summary) &&
                        this.settings.content.summaryUrl) {
                        const promise = new Promise((resolve:any, reject:any)=> {
                            $.ajax({
                                dataType: 'jsonp',
                                method: 'GET',
                                url: item.summary,
                            }).done((responseBody) => {
                                item.summary = StrippetsVisual.sanitizeHTML(responseBody.content || responseBody, StrippetsVisual.HTML_WHITELIST_SUMMARY);
                                resolve(true);
                            }).fail((err)=> {
                                reject(err);
                            });
                        });
                        promises.push(promise);
                    } else {
                        item.summary = StrippetsVisual.sanitizeHTML(item.summary, StrippetsVisual.HTML_WHITELIST_SUMMARY);
                    }
                }
            });

            Promise.all(promises).then(() => {
                this.thumbnails.instance.loadData(data.items, append);
                this.isLoadingMore = false;
                this.wrapThumbnails(wrapped);
            });
        } else {
            var newThumbnailItems;
            if (append) {
                newThumbnailItems = data.items.filter((item) => {
                    return !this.thumbnails.instance._thumbnailItems.some((thumbnail)=> {
                        return thumbnail.data.id === item.id
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
    }

    private wrapThumbnails(wrapped:boolean) {
        this.thumbnails.instance.toggleInlineDisplayMode(!wrapped);
    }

    public closeReader():void {
        if (this.settings.presentation.strippetType === 'outlines') {
            const openOutline = this.outlines.instance._items.find((outline)=> {
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

    public openReader(id:any):void {
        if (this.settings.presentation.strippetType === 'outlines') {
            const outline = this.outlines.instance._items.find((o)=> {
                return o.data.id === id;
            });
            if (outline) {
                outline.transitionState('readingmode');
            }
        }
        else {
            const thumbnail = this.thumbnails.instance._thumbnailItems.find((tn)=> {
                return tn.data.id === id;
            });
            if (thumbnail) {
                thumbnail._$element.trigger('click');
            }
        }
    }

    private showLoader():void {
        if (this.settings.presentation.strippetType === 'outlines') {
            this.outlines.instance.$chartContainer.append(this.$loaderElement);
        }
        else {
            this.thumbnails.instance._$thumbnailsContainer.append(this.$loaderElement);
        }
    }

    private hideLoader():void {
        if (this.settings.presentation.strippetType === 'outlines') {
            this.$loaderElement.detach();
        }
        else {
            this.$loaderElement.detach();
        }
    }

    ///**
    // * Gets the inline css used for this element
    // */
    //protected getCss():string[] {
    //
    //    return [
    //        require("!css!./../css/font-awesome/font-awesome.css"),
    //        require("!css!./../css/strippets/strippets.css"),
    //        require("!css!./../css/thumbnails/thumbnails.css"),
    //        require("!css!./../css/strippets.css")
    //    ];
    //}

    public enumerateObjectInstances(options:EnumerateVisualObjectInstancesOptions):VisualObjectInstance[] {
        let instances:VisualObjectInstance[] = [{
            selector: null,
            objectName: options.objectName,
            properties: {}
        }];
        $.extend(true, instances[0].properties, this.settings[options.objectName]);
        return instances;
    }
}
