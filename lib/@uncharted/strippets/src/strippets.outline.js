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
var Mediator = require('@uncharted/strippets.common').mediator;
var util = require('@uncharted/strippets.common').util;
var Feature = require('./strippets.outline.feature.js');
var Sidebar = require('./strippets.outline.sidebar.js');
var Reader = require('./strippets.outline.reader.js');
var config = require('./strippets.config.js');

var $tooltip = $('<div class="entity-tooltip"></div>');

/**
 * Constructor for an Outline
 * @param {Object} $parent - JQuery-wrapped element to which the feature content view will be appended
 * @param {Object} data - Object containing a reference to the entities to render in this view
 * @param {Array} iconMaps - Array of icon info objects
 * @param {Object} options - Configuration settings for the outline
 * @param {String=} initialState - 'hidden', 'minimal', or 'readingmode'; defaults to 'minimal'
 * @param {Object|Array=} initialHighlights - Entity Object or Array of Entity Objects containing the entities to highlight
 * @param {Object=} mediator - Mediator instance to use as our event bus; optional: a local one will be created if none provide
 * @returns {Outline}
 * @constructor
 */
function Outline($parent, data, iconMaps, options, initialState, initialHighlights, mediator) {
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
    // TODO: iconMaps doesn't need to be stored with the object. it can be jettisoned after use to save mem.
    t.iconMap = iconMaps;
    t.layoutValues = {};
    t.changeStateTo = [];
    t.readerData = null;
    t.readerText = null;
    t.highlights = undefined;
    t._mediator = mediator || null;
    t.init($parent, options, initialState, initialHighlights);
    return t;
}

Outline.prototype = Object.create(Base.prototype);
Outline.prototype.constructor = Outline;

/**
 * Add a Mediator property to each component, so instances can be linked arbitrarily
 */
Object.defineProperty(Outline.prototype, 'mediator', {
    get: function() {
        if (!this._mediator) {
            this._mediator = new Mediator();
        }
        return this._mediator;
    },

    set: function(value) {
        if (value !== this._mediator) {
            this._mediator = value;
            this.subscribe();
            this.propagateMediator();
        }
    },
});

/**
 * Valid states for an Outline view are 'hidden': not visible; 'minimal': just a vertical strip of entity icons; and
 * 'readingmode': the inline reader view with a strip of entity icons on the right
 * @type {string[]}
 * @private
 */
Outline._states = [
    'hidden',
    'minimal',
    'readingmode',
];

/**
 * Determine if the given outline data should be displayed, given a filter
 * @param {Object} outlineData - article being outlined
 * @param {*} filter - Value, boolean, Array, or function to apply as a filter on the current set of items
 * @returns {Boolean} true if the outline corresponding to the given data should be displayed;
 * otherwise, the outline should be hidden
 */
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

/**
 * Initialize an Outline
 * @param {Object} $parent - JQuery-wrapped element to which the feature content view will be appended
 * @param {Object} options - Configuration settings for the outline
 * @param {String=} initialState - 'hidden', 'minimal', or 'readingmode'; defaults to 'minimal'
 * @param {Object|Array=} initialHighlights - Entity Object or Array of Entity Objects containing the entities to highlight
 */
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

/**
 * Generate a random ID
 * @returns {string} A random ID
 */
Outline.prototype.generateId = function() {
    return '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Get the current view state.
 * @returns {string|*}
 */
Outline.prototype.getCurrentState = function() {
    return Outline._states[this.stateIndex];
};

/**
 * Get the state the view is transitioning to
 * @returns {string|*}
 */
Outline.prototype.getToState = function() {
    return Outline._states[this.toStateIndex];
};

/**
 * Construct the Outline's elements and append them to the given parent.
 * @param {Object} $parent - JQuery-wrapped element to which the feature content view will be appended
 */
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
        this.$outlineSourceIcon.css('background-image', "url('" + util.createFallbackIconURL(size, size, sourceName) + "')");
    }

    /* create the source link */
    var outlineSourceTemplate = _.template(this.templates.outline.outlineSourceTemplate);
    /* eslint-disable camelcase */
    this.$outlineSource = $(outlineSourceTemplate({src_url: this.data.sourceUrl, src_title: this.data.source}))
        /* eslint-enable camelcase */
        .addClass(this.classes.outline.sourceText)
        .appendTo(this.$outlineSourceIcon);
};

/**
 * Initialize the inline reader
 */
Outline.prototype.initializeReader = function() {
    var s = this;
    var settings = s.Settings.reader;
    settings.outlineWidth = s.Settings.maincontent.minimizedWidth;
    s.reader = new Reader(s._id, s.$outline, settings);
};

/**
 * Initialize the FeatureContent entity icon view
 */
Outline.prototype.initializeMainContent = function() {
    var s = this;
    var settings = s.Settings.maincontent;
    settings.entity = s.Settings.entity;
    s.feature = new Feature(s._id, s.$outline, s.data, s.iconMap, settings, s._mediator);
};

/**
 * Initialize the sidebars, if any are configured
 */
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

Outline.prototype.redrawTimer = null;

/**
 * Wait until the target element has a non-zero height before drawing it using the given callback
 * @param {Object} $targetElem - JQuery-wrapped element to watch for a valid height
 * @param {Function} callback - method to call once the height becomes set
 * @returns {*} result of the callback, if called; otherwise, null
 */
Outline.prototype.redrawWhenHeightSet = function ($targetElem, callback) {
    var s = this;
    if ($targetElem.height()) {
        s.redrawTimer = null;
        return callback();
    } else if (!s.redrawTimer) {
        s.redrawTimer = setTimeout(function () {
            s.redrawWhenHeightSet($targetElem, callback);
        }, this.Settings.entitiesRepositionInterval);
    }

    return null;
};

Outline.prototype.onRedrawEntity = function() {
    var s = this;
    if (s.feature) {
        this.redrawWhenHeightSet(s.feature.$outlineEntityContainer, function () {
            // Highlight function calls renderEntities with the appropriate highlights.
            if (s.highlights) {
                s.feature.highlight(s.highlights);
            } else {
                s.feature.renderEntities();
            }
        });
    }
    if (s.sidebar) {
        this.redrawWhenHeightSet(s.sidebar.$sidebarEntityContainer, s.sidebar.renderEntities.bind(s.sidebar));
    }
};

Outline.prototype.subscribe = function() {
    var s = this;
    s.mediator.subscribe(s.events.outline.EntityClicked, s.handleEntityClicked.bind(s), {
        predicate: function(data) {
            return data.OutlineId === s._id && data.ContentType === 'Feature';
        },
    });

    s.mediator.subscribe(s.events.outline.Reset,
        function() {
            s.resetState();
        },
        {
            predicate: function(data) {
                return !data || data.sourceOutlineId !== s._id;
            },
        });

    s.mediator.subscribe(s.events.outline.Highlight,
        function(entities) {
            s.highlights = entities;
            s.feature.highlight(entities);
        }, {
            predicate: function() {
                return s.toStateIndex > Outline._states.indexOf('hidden');
            },
        }, s);

    s.mediator.subscribe(s.events.outline.Minimize,
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

    s.mediator.subscribe(s.events.outline.EnableSidebar,
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

    s.mediator.subscribe(s.events.outline.RedrawEntity,
        s.onRedrawEntity, {
            predicate: function() {
                return s.feature || s.sidebar;
            },
        });

    s.mediator.subscribe(s.events.outline.Resize,
        function() {
            if (s.reader && s.getCurrentState() === 'readingmode') {
                s.reader.resize().then(s.onRedrawEntity.bind(s));
                s.mediator.publish(s.events.outline.CenterElement, {
                    $element: s.$outlineContainer,
                    expectedWidth: s.getTransitionSizes('readingmode').anticipated.width,
                    id: s._id,
                });
            } else {
                s.onRedrawEntity();
            }
        }, {
            predicate: function() {
                return s.feature || s.sidebar || s.reader;
            },
        });
};

Outline.prototype.propagateMediator = function() {
    var s = this;
    s.feature.mediator = s._mediator;
};

/**
 * Register mouse and mediator event handlers.
 */
Outline.prototype.registerEvents = function() {
    var s = this;

    s.subscribe();

    s.$outline.on('click', s, function(event) {
        var outlineContext = event.data;
        if ($(event.target).hasClass(s.classes.reader.closeButton)) {
            $(event.target).css('visibility', 'hidden');
            s.mediator.publish(outlineContext.events.outline.Minimize, outlineContext._id);
            return outlineContext.transitionState('minimal');
        }

        if (s.Settings.onClicked) {
            s.Settings.onClicked(s.data);
        }

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
            s.mediator.publish(outlineContext.events.outline.Minimize, outlineContext._id);
        }
    });

    // Register a delegated event for the entities' position-aware tooltips
    var entityClass = '.' + s.classes.entity.outlineentity;
    s.$outline.on('mouseenter', entityClass, function() {
        var $entity = $(this); // eslint-disable-line
        var tooltip = $entity.attr('data-entities');
        if (tooltip) {
            $tooltip.html(tooltip);
            $entity.append($tooltip);

            // compute the effective scale factor by sizing the tooltip and comparing to the actual result
            var scale = util.getParentScale($tooltip);
            var $viewport = $('.viewport');
            var viewportBounds = $viewport[0].getBoundingClientRect();
            var entityBounds = $entity[0].getBoundingClientRect();
            var spaceRight = (viewportBounds.right - entityBounds.right); // space to the right of the entity
            var spaceLeft = (entityBounds.left - viewportBounds.left); // space to the left of the entity
            $tooltip.css('max-width', scale * spaceLeft); // force it to resize to fit the text, if needed, before we measure
            var tooltipWidth = $tooltip[0].getBoundingClientRect().width;
            var isRightAligned = tooltipWidth > spaceRight && (spaceLeft > tooltipWidth || spaceLeft > spaceRight);
            $tooltip.toggleClass('tooltip-left', !isRightAligned);
            $tooltip.toggleClass('tooltip-right', isRightAligned);
            var maxWidth = isRightAligned ? spaceLeft : spaceRight;
            if (maxWidth !== spaceLeft) {
                $tooltip.css('max-width', scale * maxWidth);
            }
            $tooltip.css('word-wrap', maxWidth < tooltipWidth ? 'normal' : 'no-wrap');
        }
    }).on('mouseleave', entityClass, function() {
        $tooltip.toggleClass('tooltip-left tooltip-right', false);
    });
};

/**
 * Handle the entity clicked event emitted by the mediator.
 * @param {Object} data - Object containing entity data
 */
Outline.prototype.handleEntityClicked = function(data) {
    var t = this;

    if (t.Settings.onClicked) {
        t.Settings.onClicked(t.data);
    }

    /* sort if enabled */
    if (t.getCurrentState() === 'minimal') {
        t.mediator.publish(t.events.outline.Minimize, t._id);
        t.transitionState('readingmode');
    } else if (t.getCurrentState() === 'readingmode' && t.readerText) { /* if the outline is open and loaded, highlight the entity instances */
        var instanceKey = data.EntityData.name.replace(/\s+/g, '_');
        t.scrollToFirstInstanceOfEntity(instanceKey);
    }
};

/**
 * Scroll the reader view to the first instance of the entity matching the given key
 * @param {String} instanceKey - The entity name with spaces replaced by '_'
 */
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

/**
 * Hide the Feature Content view and any sidebars
 * @returns {!Promise.<!Array>|*}
 */
Outline.prototype.hideOutlineItem = function() {
    var s = this;
    var hidePromises = [
        s.feature.hide(),
    ];
    if (s.sidebar) hidePromises.push(s.sidebar.hide());
    return Promise.all(hidePromises);
};

/**
 * Transition the Feature Content view and any sidebars to their minimized state
 * @returns {*|!Promise.<RESULT>}
 */
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

/**
 * Transition the state to 'minimal'.
 * @returns {!Promise.<!Array>|*}
 */
Outline.prototype.resetState = function() {
    var t = this;
    var hidden = t.getToState() === 'hidden';
    var promises = [];
    if (hidden) {
        promises.push(t.transitionState('minimal'));
    }
    return Promise.all(promises);
};

Outline.prototype.showEntities = function (display) {
    var s = this;
    if (s.feature && s.feature.$outlineEntityContainer) {
        s.feature.$outlineEntityContainer.css({
            display: display,
        });
    }
};

/**
 * Transition the state to 'readingmode'
 * @returns {!Promise.<!Array>|*}
 */
Outline.prototype.openReadingMode = function() {
    var s = this;
    var promises = [];

    s.showEntities('none');

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
        s.mediator.publish(s.events.outline.CenterElement, {
            $element: s.$outlineContainer,
            expectedWidth: s.getTransitionSizes('readingmode').anticipated.width,
            id: s._id,
        })
    );

    return Promise.all(promises).then(function() {
        s.showEntities('block');
    });
};

/**
 * Load the reader view's content
 * @returns {*}
 */
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

/**
 * Close the reader
 * @returns {!Promise.<!Array>|*}
 */
Outline.prototype.closeReadingMode = function() {
    var s = this;
    var promises = [];
    s.showEntities('none');
    if (s.styles.outlineItem.normal) {
        promises.push(s.$outline.velocity({
            'margin-right': s.styles.outlineItem.normal.getPropertyValue('margin-right'),
            'margin-left': s.styles.outlineItem.normal.getPropertyValue('margin-left'),
        }));
    }
    promises.push(s.reader.hide());
    return Promise.all(promises).then(function () {
        s.showEntities('block');
    });
};

/**
 * Apply the appropriate CSS for the given state
 * @param {String} state - 'hidden', 'minimal', or 'readingmode'
 */
Outline.prototype.toggleClassesForState = function(state) {
    var s = this;
    s.$outlineContainer.toggleClass(s.classes.outline.hiddenmode, state === 'hidden');
    s.$outlineContainer.toggleClass(s.classes.outline.minimizedmode, state === 'minimal');
    s.$outlineContainer.toggleClass(s.classes.outline.readmode, state === 'readingmode');
};

/**
 * Register the state machine, which specifies the transition sequences
 */
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

/**
 * Use the state machine to transition between the given states
 * @param {Number} fromStateIndex - index of the current state
 * @param {Number} toStateIndex - index of the target state
 * @returns {*} Promise
 */
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

/**
 * Transition from the current state to the given state
 * @param {String} transitionTo - 'hidden', 'minimal', or 'readingmode'
 * @returns {*} Promise
 */
Outline.prototype.transitionState = function(transitionTo) {
    var s = this;
    s.toStateIndex = Outline._states.indexOf(transitionTo);
    s.transitionPromise = s.transitionPromise.then(function() {
        return s.changeStatesSequentially(s.stateIndex, s.toStateIndex);
    });
    return s.transitionPromise;
};

/**
 * Determine if the outline is currently in a state transition
 * @returns {boolean} true if the state is in flux
 */
Outline.prototype.isInTransition = function() {
    return this.stateIndex !== this.toStateIndex;
};

/**
 * Get the expected height and width of the outline after reaching the given state, or the current target state.
 * @param {String=} transitionToState - Optional Parameter transition to State.
 * If not specified, then we will use the current To State.
 * @returns {{current: {height: *, width: *}, anticipated: {height: *, width: *}}}
 */
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
                width: Reader.prototype.getActualReaderWidth(s.Settings.reader, s.$outline)
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
