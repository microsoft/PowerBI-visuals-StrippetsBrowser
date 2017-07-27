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
/* global $,_, window */

var $ = require('jquery');
var _ = require('underscore');
var Promise = require('bluebird');
var Base = require('./strippets.base');
var Mediator = require('@uncharted/strippets.common').mediator;
var Outline = require('./strippets.outline.js');
var UserConfig = require('./strippets.config.js');
var MouseHold = require('@uncharted/strippets.common').mousehold;
var Keyboard = require('@uncharted/strippets.common').Keyboard;
var util = require('@uncharted/strippets.common').util;

/**
 * Constructor for the Outlines component.
 * Outlines represents articles as a set of vertical strips (each an Outline) that use icons to indicate the position of
 * key Entities in the article.  Tapping on an outline expands it into an inline reader view, with the outline on the right.
 * @param {Object} elem - The HTML element to use as the parent for the component
 * @param {Object} options - configuration settings for the component
 * @param {Object=} mediator - Mediator instance to use as our event bus; optional: a local one will be created if none provide
 * @returns {Strippets}
 * @constructor
 */
var Strippets = function Strippets(elem, options, mediator) {
    var t = this;
    t._elem = elem;
    t.$elem = $(elem);
    t.options = options;
    t._items = [];
    t._iconMaps = [];
    t._mediator = mediator || null;
    t.init();
    t.loadData = this.loadData;
    t.enableSidebar = this.enableSidebar;
    t._globalFilter = null;
    t._globalHighlights = null;
    return t;
};

// the plugin prototype
Strippets.prototype = Object.create(Base.prototype);
Strippets.prototype.constructor = Strippets;

/**
 * Add a Mediator property to each component, so instances can be linked arbitrarily
 */
Object.defineProperty(Strippets.prototype, 'mediator', {
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
 * Initialize the Outlines component.
 */
Strippets.prototype.init = function() {
    // Introduce defaults that can be extended either
    // globally or using an object literal.
    this.config = $.extend(true, UserConfig, this.options, this.metadata);

    // ignore velocity's default post-display behavior.
    if ($.Velocity) $.Velocity.defaults.display = '';

    this.initializeContainer();
    this.initializeIconMap();
    this.registerEvents();
    this.config.supportKeyboardNavigation && this.registerKeyboardHandler();
};

/**
 * Create the HTML elements that contain the outlines
 */
Strippets.prototype.initializeContainer = function() {
    var c = this;
    c.$strippets = $(c.templates.container.strippetsTemplate)
        .height(c.config.container.height)
        .width(c.config.container.width)
        .addClass(c.config.enableScrollBar ? c.classes.container.scrollable : '')
        .appendTo(c.$elem);

    c.$viewport = $(c.templates.container.viewportTemplate)
        .height(c.config.container.height)
        .width(c.config.container.width)
        .addClass(c.classes.container.viewport)
        .appendTo(c.$strippets);

    c.$chartContainer = $(c.templates.container.containerTemplate)
        .addClass(c.classes.container.container)
        .appendTo(c.$viewport);

    var $leftButtonContainer = $(c.templates.container.scrollLeftControlTemplate)
        .addClass(c.classes.container.leftButton)
        .appendTo(c.$strippets);

    c.$leftButton = $(c.templates.container.scrollLeftButtonTemplate)
        .appendTo($leftButtonContainer);

    var $rightButtonContainer = $(c.templates.container.scrollRightControlTemplate)
        .addClass(c.classes.container.rightButton)
        .appendTo(c.$strippets);

    c.$rightButton = $(c.templates.container.scrollRightButtonTemplate)
        .appendTo($rightButtonContainer);
};

/**
 * Function used to initialize the Entity Icon Map (used in mapping a class to an entity). There are two modes of operation:
 * - Auto Generate Icons based on a set of entity->icon configuration. This mode depends on the following configuration -
 *      (autoGenerateIconMap, defaultEntityIconConfig)
 * - Accept a pre-set mapping of entity->icon mappings. This mode depends on an "entityIcons" configuration.
 *
 * @method initializeIconMap
 * @static
 */
Strippets.prototype.initializeIconMap = function() {
    // flatten the icon map (translate format from user config -> system config
    var t = this;
    if (t.config.autoGenerateIconMap) {
        _.each(t.config.autoGenerateIconMappings, function(icons, entityType) {
            var iconMap = _.map(icons, function(icon) {
                return {type: entityType, 'class': icon.class, color: icon.color || null, isDefault: icon.isDefault};
            });
            t._iconMaps = _.union(t._iconMaps, iconMap);
        });
    } else {
        t._iconMaps = t.config.entityIcons;
    }
};

Strippets.prototype.subscribe = function() {
    this.mediator.subscribe(this.events.outline.CenterElement,
        this.centerElement,
        {}, this);
};

Strippets.prototype.propagateMediator = function() {
    var s = this;
    _.each(s._items, function(outline) {
        outline.mediator = s._mediator;
    });
};

/**
 * Call resize when the containing visual has been resized.  This will notify the outlines to recompute their layout.
 */
Strippets.prototype.resize = function() {
    this.mediator.publish(this.events.outline.Resize);
};

/**
 * Register mouse and mediator event handlers, including mouse wheel horizontal scrolling.
 */
Strippets.prototype.registerEvents = function() {
    var s = this;
    var watchForElementTobeVisible;
    MouseHold.asJQueryPlugin();

    s.mapVerticalScrollToHorizontalScroll();
    s.$viewport.on('click', function(event) {
        var isViewport = event.target === event.currentTarget;
        var isChartContainer = event.target === s.$chartContainer[0];
        var isOutlineContainer = $(event.target).hasClass(s.classes.outline.outlinecontainer);
        if (isViewport || isChartContainer || isOutlineContainer) {
            s.mediator.publish(s.events.outline.Minimize);
            s.mediator.publish(s.events.outline.Reset);
        }
    });

    var scroll = function(direction) {
        return function(duration) {
            var topSpeedDuration = 1500;
            var d = duration > topSpeedDuration ? topSpeedDuration : duration;
            var resolution = ((d / 300) * 2 + 1) * direction;
            s.$viewport.stop(true, true).animate({'scrollLeft': '+=' + resolution});
        };
    };

    s.$leftButton.mousehold().bind(scroll(-1));
    s.$rightButton.mousehold().bind(scroll(1));

    s.subscribe();

    var checkVisibilityAndRepositionEntities = function() {
        if (!s.$elem[0].offsetParent && !watchForElementTobeVisible) {
            watchForElementTobeVisible = setInterval(function() {
                if (s.$elem[0].offsetParent) {
                    s.mediator.publish(s.events.outline.RedrawEntity);
                    window.clearInterval(watchForElementTobeVisible);
                    watchForElementTobeVisible = undefined;
                }
            }, s.config.outline.entitiesRepositionInterval);
        }
    };

    checkVisibilityAndRepositionEntities();
};

/**
 * Allow the mouse wheel to scroll the view horizontally whenever the mouse is over content not needing vertical scrolling.
 */
Strippets.prototype.mapVerticalScrollToHorizontalScroll = function() {
    util.mapVerticalScrollToHorizontalScroll(this.$viewport, this.config.outline.maincontent.minimizedWidth);
};

/**
 * Register keyboard navigation event handlers
 */
Strippets.prototype.registerKeyboardHandler = function() {
    var s = this;

    var findFirstOutline = function(state, array) {
        return _.find(array, function(outline) {
            return outline.getToState() === state;
        });
    };
    var findAndOpenOutline = function(searchBackward) {
        var targetOutline;
        var openedOutlineIndex = _.findIndex(s._items, function(outline) {
            return outline.getToState() === 'readingmode';
        });
        var openedOutline = s._items[openedOutlineIndex];

        if (!openedOutline) {
            return;
        }
        targetOutline = searchBackward
            ? findFirstOutline('minimal', s._items.slice(0, openedOutlineIndex).reverse())
            : findFirstOutline('minimal', s._items.slice(openedOutlineIndex + 1));

        if (targetOutline) {
            openedOutline.transitionState('minimal');
            targetOutline.transitionState('readingmode');
        }
    };

    var keyboard = new Keyboard(document, {repeatDelay: s.config.keyboardNavigationDelay});

    keyboard.bindKeydown(function(key) {
        switch (key) {
            case 37:
                findAndOpenOutline(true);
                break;
            case 39:
                findAndOpenOutline();
                break;
            default:
                return;
        }
    });
};

/**
 * Load a new dataset or additional data, updating the icon map and re-rendering, if needed.
 * @param {Array} data - Array of articles to render as outlines
 * @param {Boolean} append - true if this data should be appended to the existing outlines; false to replace the current outlines
 */
Strippets.prototype.loadData = function(data, append) {
    if (data) {
        if (!append) {
            this._items = [];
            this.$chartContainer.empty();
        }
        if (!this.config.entityIcons) {
            this.mapEntitiesToIconMap(data, this._iconMaps);
        }
        this.render(data);
    }
};

/**
 * Given an array of articles containing entities, and an icon map, associate each entity with the appropriate icon.
 * @param {Array} data - Array of article objects to render as outlines
 * @param {Array} iconMap - Array of icon info objects
 */
Strippets.prototype.mapEntitiesToIconMap = function(data, iconMap) {
    var concatEntities = function(array, item) {
        return array.concat(item.entities);
    };
    var nameAndType = function(entity) {
        return entity.name + '&' + entity.type;
    };
    var toEntityReference = function(entityList) {
        return {
            type: entityList[0].type,
            name: entityList[0].name,
            count: entityList.length,
        };
    };
    // process data
    var allEntities = data.reduce(concatEntities, []);
    var entityGroups = _.groupBy(allEntities, nameAndType);
    var entityReferences = Object.keys(entityGroups)
        .map(function(key) {
            return toEntityReference(entityGroups[key]);
        })
        .sort(function(entityRefA, entityRefB) {
            return entityRefB.count - entityRefA.count;
        });

    entityReferences.forEach(function(entity) {
        var entityAlreadyMapped = _.some(iconMap, function(icon) {
            return icon.type === entity.type && entity.name !== undefined && icon.name === entity.name;
        });
        if (!entityAlreadyMapped) {
            var unusedIcon = _.find(iconMap, function(icon) {
                return icon.type === entity.type && icon.name === undefined && !icon.isDefault;
            });
            if (unusedIcon) {
                unusedIcon.name = entity.name;
            }
        }
    });
};

/**
 * Generate an Outline element for each row in the given data
 * @param {Array} data - Array of article objects to render as outlines
 */
Strippets.prototype.render = function(data) {
    var s = this;
    // disable animations on initial render
    _.each(data,
        function(d) {
            var config = s.config.outline;
            var initialState = undefined;
            config.debugMode = s.config.debugMode;
            if (s._globalFilter) {
                initialState = Outline.shouldShow(d, s._globalFilter) ? 'minimal' : 'hidden';
            }
            var outline = new Outline(s.$chartContainer, d, s._iconMaps, config, initialState, s._globalHighlights, s.mediator);

            s._items.push(outline);
        });
};

/**
 * Horizontally center the indicated element within the viewport via an animated scroll.
 * @param {Object} details - contains references to tne jquery wrapper of the viewport,
 * as well as the id, expected width, and jquery wrapper of the element to center.
 * @returns {*} Promise returned by jquery.animate
 */
Strippets.prototype.centerElement = function(details) {
    var s = this;
    var scrollLeft = 0;

    if (details.$element) {
        var width = 0;
        _.find(s._items, function(item) {
            if (item._id === details.id) {
                return true;
            } else if (!item.$outlineContainer.hasClass('hidden')) {
                if (item.sidebar && item.sidebar.$sidebarContent) {
                    width += item.sidebar.$sidebarContent.width();
                }
                width += item.$outline.find('.' + s.classes.maincontent.outlinemaincontent).width();
            }

            return false;
        });

        scrollLeft = width -
            (0.5 * (s.$viewport.width() - details.expectedWidth));
    }

    return s.$viewport.animate({
        scrollLeft: scrollLeft,
    }).promise();
};

/**
 * Toggle the sidebar
 * @param {Boolean} isEnabled - true if the sidebar should be enabled
 */
Strippets.prototype.enableSidebar = function(isEnabled) {
    this.mediator.publish(this.events.outline.EnableSidebar, isEnabled);
};

/**
 * Reduce the list of outlines to only those that pass the given filter.  Center the remaining Outlines, if so configured.
 * @param {*} filter - Value, boolean, Array, or function to apply as a filter on the current set of items
 * @param {Boolean} onceOnly - True to apply this filter now, then forget about it;
 * false to store it as the current global filter
 * @returns {*} Promise
 */
Strippets.prototype.filter = function(filter, onceOnly) {
    var t = this;
    if (!onceOnly) {
        this._globalFilter = filter;
    }
    var promises = [];

    _.each(this._items, function(outline) {
        // if filter is null, then show. Otherwise, check if filter is an array, value or function and address accordingly.
        var shouldShow = Outline.shouldShow(outline.data, filter);

        var hidden = outline.getToState() === 'hidden';
        if (shouldShow && hidden) {
            promises.push(outline.transitionState('minimal'));
        } else if (!shouldShow && !hidden) {
            promises.push(outline.transitionState('hidden'));
        }
    });

    return Promise.all(promises).then(function() {
        if (t.config.centerAfterFilter) {
            t.startAutoCentering();
        }
    });
};

/**
 * Highlight the given entities in all the outlines.
 * @param {*} entities - an article or array of articles that should be highlighted in all outlines
 * @param {Boolean} onceOnly - True to apply these highlights now, then forget about them;
 * false to keep them around as the current global highlights
 */
Strippets.prototype.highlight = function(entities, onceOnly) {
    if (!onceOnly) {
        this._globalHighlights = entities;
    }
    this.mediator.publish(this.events.outline.Highlight, entities);
};

/**
 * Turn on the automatic scroll centering watcher,
 * which will recenter the horizontal scroll position when the viewport width changes.
 * Gives up if no width changes occur for 100 ms.
 */
Strippets.prototype.startAutoCentering = function() {
    var s = this;
    if (s.$viewport.hasClass(s.classes.container.autoCenter)) {
        return;
    }
    s.$viewport.addClass(s.classes.container.autoCenter);
    var viewPortWidth = s.$viewport.width();
    var maxScrollPosition = s.$viewport[0].scrollWidth - viewPortWidth;
    var endTimer;
    // Watch for scrollWidth change and set scroll position accordingly.
    var scrollWidthWatcher = setInterval(function() {
        var currentPosition = s.$viewport[0].scrollLeft;
        var newMaxScrollPosition = s.$viewport[0].scrollWidth - viewPortWidth;
        var targetPosition = newMaxScrollPosition / 2;
        var diff = Math.abs((maxScrollPosition - newMaxScrollPosition)) * 0.5;
        if (maxScrollPosition === newMaxScrollPosition) {
            return;
        }
        if (currentPosition < targetPosition) {
            s.$viewport[0].scrollLeft += diff;
        } else if (currentPosition > targetPosition) {
            s.$viewport[0].scrollLeft -= diff;
        }
        maxScrollPosition = newMaxScrollPosition;
        // Kill the watcher if no scroll width change is detected for 100 ms.
        clearTimeout(endTimer);
        endTimer = setTimeout(function() {
            clearInterval(scrollWidthWatcher);
            s.$viewport.removeClass(s.classes.container.autoCenter);
        }, 100);
    }, 0);
};

module.exports = Strippets;

/**
 * JQuery plugin interface for Outlines.  Deprecated.
 * @type {Function}
 */
module.exports.asJQueryPlugin = /* istanbul ignore next: Jquery Plugin Registration */ function() {
    $.fn.strippets = function(command) {
        var selector = this;
        var commands = {
            initialize: function(options) {
                this._strippets = new Strippets(this, options);
            },
            loaddata: function(data, append) {
                this._strippets.loadData(data, append);
            },
            enablesidebar: function(isenabled) {
                this._strippets.enableSidebar(isenabled);
            },
            filter: function(filter, onceOnly) {
                this._strippets.filter(filter, onceOnly);
            },
            highlight: function(entities) {
                this._strippets.highlight(entities);
            },
            dispose: function() {
                selector.each(function(index, element) {
                    element._strippets = null;
                    element.remove();
                });
            },
            resize: function () {
                this._strippets.resize();
            },
        };
        // define argument variable here as arguments get overloaded in the each call below.
        var args = arguments;
        return selector.each(function(index, element) {
            // assume no command == initialization.
            if (command === undefined) {
                commands.initialize.apply(element, null);
            } else if (commands[command]) {
                commands[command].apply(element, Array.prototype.slice.call(args, 1));
            } else if (typeof command === 'object' || !command) {
                commands.initialize.apply(element, args);
            } else {
                $.error('Command: ' + command + 'does not exist.');
            }
        });
    };
};
