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

'use strict';

var $ = require('jquery');
var _ = require('underscore');
var Promise = require('bluebird');

var Base = require('./strippets.base');
var mediator = require('@uncharted/stories.common').mediator;
var Feature = require('./strippets.outline.feature.js');
var Sidebar = require('./strippets.outline.sidebar.js');
var Reader = require('./strippets.outline.reader.js');
var config = require('./strippets.config.js');

function Outline($parent, data, iconMaps, options, initialState, initialHighlights) {
    var t = this;
    t.defaults = config.outline;
    t.data = data;
    // use rank for ID for the time being
    // t.Id = t.data.rank;
    t.feature = null;
    t.sidebar = null;
    t.stateIndex = -1;
    t.toStateIndex = -1;
    /* eslint no-warning-comments: 0 */
    // TODO: icon maps doesnt need to be stored with the object. it can be jettisoned after use to save mem.
    t.iconMap = iconMaps;
    t.layoutValues = {};
    t.changeStateTo = [];
    t.readerData = null;
    t.readerText = null;
    t.highlights = undefined;
    t.init($parent, options, initialState, initialHighlights);
    return t;
}

Outline.prototype = Object.create(Base.prototype);
Outline.prototype.constructor = Outline;

Outline._states = [
    'hidden',
    'minimal',
    'readingmode',
];

Outline.shouldShow = function(outlineData, filter) {
    var shouldShow = undefined;
    var filterAsArrayFunc = function(id, values) {
        return _.some(values, function(v) {
            return v === id;
        });
    };
    var filterAsValueFunc = function(id, value) {
        return id === value;
    };

    if (!filter) {
        shouldShow = true;
    } else if (filter instanceof Array) {
        shouldShow = filterAsArrayFunc(outlineData.id, filter);
    } else if (typeof filter !== 'function') {
        shouldShow = filterAsValueFunc(outlineData.id, filter);
    } else {
        shouldShow = filter(outlineData);
    }
    return shouldShow;
};

Outline.prototype.init = function($parent, options, initialState, initialHighlights) {
    var t = this;
    t.Settings = $.extend({}, t.defaults, options);
    t._id = t.generateId();

    t.constructLayout($parent);
    t.initializeReader();
    t.initializeMainContent();
    t.initializeSidebar();
    t.registerEvents();
    t.registerStateMachine();

    var state = _.some(Outline._states, function(s) {
        return s === initialState;
    }) ? initialState : 'minimal';
    // Set Initial State
    t._currentOutlinePosition = t.Settings.centerOutlinePosition;
    t.toStateIndex = Outline._states.indexOf('hidden');
    t.stateIndex = Outline._states.indexOf('hidden');
    t.transitionPromise = Promise.resolve();
    t.readingModeEnabled = t.Settings.reader.enabled;
    if (initialHighlights) {
        t.highlights = (initialHighlights instanceof Array) ? initialHighlights : [initialHighlights];
    }

    if (state !== 'hidden') {
        t.transitionState(state).then(function() {
            if (t.highlights) {
                t.feature.highlight(t.highlights);
            }
        });
    }
};

Outline.prototype.generateId = function() {
    return '_' + Math.random().toString(36).substr(2, 9);
};

Outline.prototype.getCurrentState = function() {
    return Outline._states[this.stateIndex];
};

Outline.prototype.getToState = function() {
    return Outline._states[this.toStateIndex];
};

Outline.prototype.constructLayout = function($parent) {
    /* create the container */
    this.$outlineContainer = $(this.templates.outline.outlineContainerTemplate)
        .addClass(this.classes.outline.outlinecontainer)
        .addClass(this.classes.outline.minimizedmode)
        .appendTo($parent);

    /* create the outline */
    this.$outline = $(this.templates.outline.outlineItemTemplate)
        .addClass(this.classes.outline.outline)
        .css({'border-left-width': '0', 'border-right-width': '0'})
        .appendTo(this.$outlineContainer);

    /* create the header */
    this.$outlineHeader = $(this.templates.outline.outlineHeaderTemplate)
        .appendTo(this.$outline);

    /* create the source icon */
    this.$outlineSourceIcon = $(this.templates.outline.outlineSourceIconTemplate)
        .addClass(this.classes.outline.sourceIcon)
        .appendTo(this.$outlineHeader);

    if (this.data.sourceimage) {
        this.$outlineSourceIcon.css('background-image', "url('" + this.data.sourceimage + "')");
    } else if (this.data.sourceiconname || this.data.source) {
        var size = this.$outlineSourceIcon.height();
        var sourceName = (this.data.sourceiconname || this.data.source);
        this.$outlineSourceIcon.css('background-image', "url('" + this.createFallbackIconURL(size, size, sourceName) + "')");
    }

    /* create the source link */
    var outlineSourceTemplate = _.template(this.templates.outline.outlineSourceTemplate);
    /* eslint-disable camelcase */
    this.$outlineSource = $(outlineSourceTemplate({src_url: this.data.sourceUrl, src_title: this.data.source}))
    /* eslint-enable camelcase */
        .addClass(this.classes.outline.sourceText)
        .appendTo(this.$outlineSourceIcon);
};
Outline.prototype.initializeReader = function() {
    var s = this;
    var settings = s.Settings.reader;
    s.reader = new Reader(s._id, s.$outline, settings);
};

Outline.prototype.initializeMainContent = function() {
    var s = this;
    var settings = s.Settings.maincontent;
    settings.entity = s.Settings.entity;
    s.feature = new Feature(s._id, s.$outline, s.data, s.iconMap, settings);
};

Outline.prototype.initializeSidebar = function() {
    var s = this;
    if (s.data.sidebars && s.data.sidebars.length > 0) {
        var settings = s.Settings.sidebar;
        settings.entity = s.Settings.entity;
        settings.events = s.events.outline;
        settings.headerSpace = 0;
        s.sidebar = new Sidebar(s._id, s.$outline, s.data.sidebars, s.iconMap, settings);
    }
};

Outline.prototype.grayShadeFromString = function(str, min, max) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    var color32bit = (hash & 0xFFFFFF);
    var r = (color32bit >> 16) & 255;
    var g = (color32bit >> 8) & 255;
    var b = color32bit & 255;

    /* clamp the colors */
    if (min !== undefined) {
        r = Math.max(r, min);
        g = Math.max(g, min);
        b = Math.max(b, min);
    }

    if (max !== undefined) {
        r = Math.min(r, max);
        g = Math.min(g, max);
        b = Math.min(b, max);
    }

    return Math.floor((r + g + b) / 3);
};

Outline.prototype.createFallbackIconURL = function(width, height, sourceName) {
    /* get the gray shade for the background */
    var channel = this.grayShadeFromString(sourceName, 0, 102);

    /* initialize an offscreen canvas */
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');

    /* draw the background */
    context.fillStyle = 'rgb(' + channel + ',' + channel + ',' + channel + ')';
    context.fillRect(0, 0, width, height);

    /* make the channel brighter for the text */
    channel = Math.floor(channel * 2.5);
    context.fillStyle = 'rgb(' + channel + ',' + channel + ',' + channel + ')';

    /* draw the text */
    var letter = sourceName[0].toUpperCase();
    context.font = Math.round(height * 0.7) + 'px helvetica';
    context.fontWeight = 'bolder';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, width * 0.5, height * 0.5);

    return canvas.toDataURL();
};

Outline.prototype.registerEvents = function() {
    var s = this;

    mediator.subscribe(s.events.outline.EntityClicked, s.handleEntityClicked.bind(s), {
        predicate: function(data) {
            return data.OutlineId === s._id && data.ContentType === 'Feature';
        },
    });

    s.$outline.on('click', s, function(event) {
        if (s.Settings.onClicked) {
            s.Settings.onClicked(s.data);
        }

        var outlineContext = event.data;
        if (outlineContext.getCurrentState() === 'hidden') {
            return undefined;
        } else if (outlineContext.getCurrentState() === 'expanded') {
            return outlineContext.transitionState('readingmode');
        } else if (outlineContext.getCurrentState() === 'readingmode') {
            // do nothing.
            return undefined;
        }

        outlineContext.transitionState('readingmode');
        if (!event.shiftKey) {
            mediator.publish(outlineContext.events.outline.Minimize, outlineContext._id);
        }
    });

    mediator.subscribe(s.events.outline.Reset,
        function() {
            s.resetState();
        },
        {
            predicate: function(data) {
                return !data || data.sourceOutlineId !== s._id;
            },
        });

    mediator.subscribe(s.events.outline.Highlight,
        function(entities) {
            s.highlights = entities;
            s.feature.highlight(entities);
        }, {
            predicate: function() {
                return s.toStateIndex > Outline._states.indexOf('hidden');
            },
        }, s);

    mediator.subscribe(s.events.outline.Minimize,
        function() {
            s.transitionState('minimal');
        },
        {
            predicate: function(OutlineId) {
                if (OutlineId !== s._id) {
                    return s.toStateIndex > Outline._states.indexOf('minimal');
                }
            },
        }, s);

    mediator.subscribe(s.events.outline.EnableSidebar,
        function(isEnabled) {
            if (s.Settings.sidebarEnabled !== isEnabled) {
                s.Settings.sidebarEnabled = isEnabled;

                if (s.sidebar && s.getCurrentState() !== 'hidden') {
                    s.sidebar.toggle(isEnabled);
                }
            }
        }, {
            predicate: function() {
                return s.sidebar;
            },
        });
    mediator.subscribe(s.events.outline.RedrawEntity,
        function() {
            if (s.feature) {
                // Highlight function calls renderEntities with the appropriate highlights.
                if (s.highlights) {
                    s.feature.highlight(s.highlights);
                } else {
                    s.feature.renderEntities();
                }
            }
            if (s.sidebar) {
                s.sidebar.renderEntities();
            }
        }, {
            predicate: function() {
                return s.feature || s.sidebar;
            },
        });
};

Outline.prototype.handleEntityClicked = function(data) {
    var t = this;

    if (t.Settings.onClicked) {
        t.Settings.onClicked(t.data);
    }

    /* sort if enabled */
    if (t.getCurrentState() === 'minimal') {
        mediator.publish(t.events.outline.Minimize, t._id);
        t.transitionState('readingmode');
    } else if (t.getCurrentState() === 'readingmode' && t.readerText) { /* if the outline is open and loaded, highlight the entity instances */
        var instanceKey = data.EntityData.name.replace(/\s+/g, '_');
        t.scrollToFirstInstanceOfEntity(instanceKey);
    }
};

Outline.prototype.scrollToFirstInstanceOfEntity = function(instanceKey) {
    var t = this;
    var element = t.readerText.find('#' + instanceKey.replace(/\./g, '\\.') + '_0');
    if (element.length) {
        var scrollOffset = t.reader.$readerContent.scrollTop() + element.offset().top - t.reader.$readerContent.offset().top;
        t.reader.$readerContent.animate({
            scrollTop: scrollOffset + 'px',
        }, 'fast');
    }
};

Outline.prototype.hideOutlineItem = function() {
    var s = this;
    var hidePromises = [
        s.feature.hide(),
    ];
    if (s.sidebar) hidePromises.push(s.sidebar.hide());
    return Promise.all(hidePromises);
};

Outline.prototype.minimizeOutlineItem = function() {
    var s = this;
    var minimizePromises = [
        s.feature.minimize(),
    ];

    if (s.sidebar && s.Settings.sidebarEnabled) minimizePromises.push(s.sidebar.minimize());
    return Promise.all(minimizePromises).then(function() {
        // Highlight function calls renderEntities with the appropriate highlights.
        if (s.highlights) {
            s.feature.highlight(s.highlights);
        } else {
            s.feature.renderEntities();
        }
    });
};

// if an entity is passed in, use that to determine the positioning. otherwise, default the positioning to center outline positioning.
Outline.prototype.resetState = function() {
    var t = this;
    var hidden = t.getToState() === 'hidden';
    var promises = [];
    if (hidden) {
        promises.push(t.transitionState('minimal'));
    }
    return Promise.all(promises);
};

Outline.prototype.openReadingMode = function() {
    var s = this;
    var promises = [];
    promises.push(s.reader.open().then(function() {
        if (!s.readerData) {
            return s.loadReadingModeContent();
        }
    }));
    if (s.styles.outlineItem.reading) {
        promises.push(s.$outline.velocity({
            'margin-right': s.styles.outlineItem.reading.getPropertyValue('margin-right'),
            'margin-left': s.styles.outlineItem.reading.getPropertyValue('margin-left'),
        }));
    }
    promises.push(
        mediator.publish(s.events.outline.CenterElement, {
            $element: s.$outlineContainer,
            expectedWidth: s.getTransitionSizes('readingmode').anticipated.width,
            id: s._id,
        })
    );
    return Promise.all(promises);
};

Outline.prototype.loadReadingModeContent = function() {
    var s = this;
    return s.reader.load(s.data.readerUrl, s.feature.entities)
        .then(function(data) {
            s.readerData = data;
            if (s.reader.$readerContent) {
                s.readerText = s.reader.$readerContent.find('div.content');
            }
        });
};

Outline.prototype.closeReadingMode = function() {
    var s = this;
    var promises = [];
    if (s.styles.outlineItem.normal) {
        promises.push(s.$outline.velocity({
            'margin-right': s.styles.outlineItem.normal.getPropertyValue('margin-right'),
            'margin-left': s.styles.outlineItem.normal.getPropertyValue('margin-left'),
        }));
    }
    promises.push(s.reader.hide());
    return Promise.all(promises);
};

Outline.prototype.toggleClassesForState = function(state) {
    var s = this;
    s.$outlineContainer.toggleClass(s.classes.outline.hiddenmode, state === 'hidden');
    s.$outlineContainer.toggleClass(s.classes.outline.minimizedmode, state === 'minimal');
    s.$outlineContainer.toggleClass(s.classes.outline.readmode, state === 'readingmode');
};

Outline.prototype.registerStateMachine = function() {
    var s = this;
    s.changeStateTo = [];

    var setCurrentState = function(state) {
        return function() {
            s.stateIndex = Outline._states.indexOf(state);
            s.toggleClassesForState(state);
        };
    };
    s.changeStateTo[0] = function toHidden() {
        return s.hideOutlineItem().then(setCurrentState('hidden'));
    };
    s.changeStateTo[1] = function toMinimal() {
        if (s.getCurrentState() === 'readingmode') {
            return s.closeReadingMode().then(setCurrentState('minimal'));
        }
        return s.minimizeOutlineItem().then(setCurrentState('minimal'));
    };
    s.changeStateTo[2] = function toReadingmode() {
        if (s.readingModeEnabled) {
            return s.openReadingMode().then(setCurrentState('readingmode'));
        }
    };
};

Outline.prototype.changeStatesSequentially = function(fromStateIndex, toStateIndex) {
    var s = this;
    var stateChangers = [];
    // eg. 0 -> 3, 1 -> 2
    if (fromStateIndex < toStateIndex) {
        stateChangers = s.changeStateTo.slice(fromStateIndex + 1, toStateIndex + 1);
        // eg. 3 -> 0, 2 -> 1
    } else if (fromStateIndex > toStateIndex) {
        stateChangers = s.changeStateTo.slice(toStateIndex, fromStateIndex).reverse();
    }
    return stateChangers.reduce(function(cur, next) {
        return cur.then(next);
    }, Promise.resolve());
};

Outline.prototype.transitionState = function(transitionTo) {
    var s = this;
    s.toStateIndex = Outline._states.indexOf(transitionTo);
    s.transitionPromise = s.transitionPromise.then(function() {
        return s.changeStatesSequentially(s.stateIndex, s.toStateIndex);
    });
    return s.transitionPromise;
};
Outline.prototype.isInTransition = function() {
    return this.stateIndex !== this.toStateIndex;
};

// Optional Parameter transition to State. if not specified, then we will use the current To State.
Outline.prototype.getTransitionSizes = function(transitionToState) {
    var s = this;

    var currentOutlineSizes = {
        height: this.$outline.height(), width: this.$outline.width(),
    };
    var transitionCompleteSize = {height: currentOutlineSizes.height, width: currentOutlineSizes.width};

    if (transitionToState || s.isInTransition()) {
        var toState = transitionToState || s.getToState();
        if (toState === 'readingmode') {
            transitionCompleteSize = {
                height: s.$outline.height(),
                width: s.Settings.reader.readerWidth
                + s.Settings.maincontent.minimizedWidth
                + ((s.Settings.sidebarEnabled && s.sidebar) ? s.Settings.sidebar.minimizedWidth : 0),
            };
        } else { // minimized
            transitionCompleteSize = {
                height: s.$outline.height(),
                width: s.Settings.maincontent.minimizedWidth
                + ((s.Settings.sidebarEnabled && s.sidebar) ? s.Settings.sidebar.minimizedWidth : 0),
            };
        }
    }
    return {current: currentOutlineSizes, anticipated: transitionCompleteSize};
};

module.exports = Outline;
