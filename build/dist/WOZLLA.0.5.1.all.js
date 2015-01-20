/*! Hammer.JS - v1.1.3 - 2014-05-22
 * http://eightmedia.github.io/hammer.js
 *
 * Copyright (c) 2014 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */

(function(window, undefined) {
    'use strict';

    /**
     * @main
     * @module hammer
     *
     * @class Hammer
     * @static
     */

    /**
     * Hammer, use this to create instances
     * ````
     * var hammertime = new Hammer(myElement);
     * ````
     *
     * @method Hammer
     * @param {HTMLElement} element
     * @param {Object} [options={}]
     * @return {Hammer.Instance}
     */
    var Hammer = function Hammer(element, options) {
        return new Hammer.Instance(element, options || {});
    };

    /**
     * version, as defined in package.json
     * the value will be set at each build
     * @property VERSION
     * @final
     * @type {String}
     */
    Hammer.VERSION = '1.1.3';

    /**
     * default settings.
     * more settings are defined per gesture at `/gestures`. Each gesture can be disabled/enabled
     * by setting it's name (like `swipe`) to false.
     * You can set the defaults for all instances by changing this object before creating an instance.
     * @example
     * ````
     *  Hammer.defaults.drag = false;
     *  Hammer.defaults.behavior.touchAction = 'pan-y';
     *  delete Hammer.defaults.behavior.userSelect;
     * ````
     * @property defaults
     * @type {Object}
     */
    Hammer.defaults = {
        /**
         * this setting object adds styles and attributes to the element to prevent the browser from doing
         * its native behavior. The css properties are auto prefixed for the browsers when needed.
         * @property defaults.behavior
         * @type {Object}
         */
        behavior: {
            /**
             * Disables text selection to improve the dragging gesture. When the value is `none` it also sets
             * `onselectstart=false` for IE on the element. Mainly for desktop browsers.
             * @property defaults.behavior.userSelect
             * @type {String}
             * @default 'none'
             */
            userSelect: 'none',

            /**
             * Specifies whether and how a given region can be manipulated by the user (for instance, by panning or zooming).
             * Used by Chrome 35> and IE10>. By default this makes the element blocking any touch event.
             * @property defaults.behavior.touchAction
             * @type {String}
             * @default: 'pan-y'
             */
            touchAction: 'pan-y',

            /**
             * Disables the default callout shown when you touch and hold a touch target.
             * On iOS, when you touch and hold a touch target such as a link, Safari displays
             * a callout containing information about the link. This property allows you to disable that callout.
             * @property defaults.behavior.touchCallout
             * @type {String}
             * @default 'none'
             */
            touchCallout: 'none',

            /**
             * Specifies whether zooming is enabled. Used by IE10>
             * @property defaults.behavior.contentZooming
             * @type {String}
             * @default 'none'
             */
            contentZooming: 'none',

            /**
             * Specifies that an entire element should be draggable instead of its contents.
             * Mainly for desktop browsers.
             * @property defaults.behavior.userDrag
             * @type {String}
             * @default 'none'
             */
            userDrag: 'none',

            /**
             * Overrides the highlight color shown when the user taps a link or a JavaScript
             * clickable element in Safari on iPhone. This property obeys the alpha value, if specified.
             *
             * If you don't specify an alpha value, Safari on iPhone applies a default alpha value
             * to the color. To disable tap highlighting, set the alpha value to 0 (invisible).
             * If you set the alpha value to 1.0 (opaque), the element is not visible when tapped.
             * @property defaults.behavior.tapHighlightColor
             * @type {String}
             * @default 'rgba(0,0,0,0)'
             */
            tapHighlightColor: 'rgba(0,0,0,0)'
        }
    };

    /**
     * hammer document where the base events are added at
     * @property DOCUMENT
     * @type {HTMLElement}
     * @default window.document
     */
    Hammer.DOCUMENT = document;

    /**
     * detect support for pointer events
     * @property HAS_POINTEREVENTS
     * @type {Boolean}
     */
    Hammer.HAS_POINTEREVENTS = navigator.pointerEnabled || navigator.msPointerEnabled;

    /**
     * detect support for touch events
     * @property HAS_TOUCHEVENTS
     * @type {Boolean}
     */
    Hammer.HAS_TOUCHEVENTS = ('ontouchstart' in window);

    /**
     * detect mobile browsers
     * @property IS_MOBILE
     * @type {Boolean}
     */
    Hammer.IS_MOBILE = /mobile|tablet|ip(ad|hone|od)|android|silk/i.test(navigator.userAgent);

    /**
     * detect if we want to support mouseevents at all
     * @property NO_MOUSEEVENTS
     * @type {Boolean}
     */
    Hammer.NO_MOUSEEVENTS = (Hammer.HAS_TOUCHEVENTS && Hammer.IS_MOBILE) || Hammer.HAS_POINTEREVENTS;

    /**
     * interval in which Hammer recalculates current velocity/direction/angle in ms
     * @property CALCULATE_INTERVAL
     * @type {Number}
     * @default 25
     */
    Hammer.CALCULATE_INTERVAL = 25;

    /**
     * eventtypes per touchevent (start, move, end) are filled by `Event.determineEventTypes` on `setup`
     * the object contains the DOM event names per type (`EVENT_START`, `EVENT_MOVE`, `EVENT_END`)
     * @property EVENT_TYPES
     * @private
     * @writeOnce
     * @type {Object}
     */
    var EVENT_TYPES = {};

    /**
     * direction strings, for safe comparisons
     * @property DIRECTION_DOWN|LEFT|UP|RIGHT
     * @final
     * @type {String}
     * @default 'down' 'left' 'up' 'right'
     */
    var DIRECTION_DOWN = Hammer.DIRECTION_DOWN = 'down';
    var DIRECTION_LEFT = Hammer.DIRECTION_LEFT = 'left';
    var DIRECTION_UP = Hammer.DIRECTION_UP = 'up';
    var DIRECTION_RIGHT = Hammer.DIRECTION_RIGHT = 'right';

    /**
     * pointertype strings, for safe comparisons
     * @property POINTER_MOUSE|TOUCH|PEN
     * @final
     * @type {String}
     * @default 'mouse' 'touch' 'pen'
     */
    var POINTER_MOUSE = Hammer.POINTER_MOUSE = 'mouse';
    var POINTER_TOUCH = Hammer.POINTER_TOUCH = 'touch';
    var POINTER_PEN = Hammer.POINTER_PEN = 'pen';

    /**
     * eventtypes
     * @property EVENT_START|MOVE|END|RELEASE|TOUCH
     * @final
     * @type {String}
     * @default 'start' 'change' 'move' 'end' 'release' 'touch'
     */
    var EVENT_START = Hammer.EVENT_START = 'start';
    var EVENT_MOVE = Hammer.EVENT_MOVE = 'move';
    var EVENT_END = Hammer.EVENT_END = 'end';
    var EVENT_RELEASE = Hammer.EVENT_RELEASE = 'release';
    var EVENT_TOUCH = Hammer.EVENT_TOUCH = 'touch';

    /**
     * if the window events are set...
     * @property READY
     * @writeOnce
     * @type {Boolean}
     * @default false
     */
    Hammer.READY = false;

    /**
     * plugins namespace
     * @property plugins
     * @type {Object}
     */
    Hammer.plugins = Hammer.plugins || {};

    /**
     * gestures namespace
     * see `/gestures` for the definitions
     * @property gestures
     * @type {Object}
     */
    Hammer.gestures = Hammer.gestures || {};

    /**
     * setup events to detect gestures on the document
     * this function is called when creating an new instance
     * @private
     */
    function setup() {
        if(Hammer.READY) {
            return;
        }

        // find what eventtypes we add listeners to
        Event.determineEventTypes();

        // Register all gestures inside Hammer.gestures
        Utils.each(Hammer.gestures, function(gesture) {
            Detection.register(gesture);
        });

        // Add touch events on the document
        Event.onTouch(Hammer.DOCUMENT, EVENT_MOVE, Detection.detect);
        Event.onTouch(Hammer.DOCUMENT, EVENT_END, Detection.detect);

        // Hammer is ready...!
        Hammer.READY = true;
    }

    /**
     * @module hammer
     *
     * @class Utils
     * @static
     */
    var Utils = Hammer.utils = {
        /**
         * extend method, could also be used for cloning when `dest` is an empty object.
         * changes the dest object
         * @method extend
         * @param {Object} dest
         * @param {Object} src
         * @param {Boolean} [merge=false]  do a merge
         * @return {Object} dest
         */
        extend: function extend(dest, src, merge) {
            for(var key in src) {
                if(!src.hasOwnProperty(key) || (dest[key] !== undefined && merge)) {
                    continue;
                }
                dest[key] = src[key];
            }
            return dest;
        },

        /**
         * simple addEventListener wrapper
         * @method on
         * @param {HTMLElement} element
         * @param {String} type
         * @param {Function} handler
         */
        on: function on(element, type, handler) {
            element.addEventListener(type, handler, false);
        },

        /**
         * simple removeEventListener wrapper
         * @method off
         * @param {HTMLElement} element
         * @param {String} type
         * @param {Function} handler
         */
        off: function off(element, type, handler) {
            element.removeEventListener(type, handler, false);
        },

        /**
         * forEach over arrays and objects
         * @method each
         * @param {Object|Array} obj
         * @param {Function} iterator
         * @param {any} iterator.item
         * @param {Number} iterator.index
         * @param {Object|Array} iterator.obj the source object
         * @param {Object} context value to use as `this` in the iterator
         */
        each: function each(obj, iterator, context) {
            var i, len;

            // native forEach on arrays
            if('forEach' in obj) {
                obj.forEach(iterator, context);
                // arrays
            } else if(obj.length !== undefined) {
                for(i = 0, len = obj.length; i < len; i++) {
                    if(iterator.call(context, obj[i], i, obj) === false) {
                        return;
                    }
                }
                // objects
            } else {
                for(i in obj) {
                    if(obj.hasOwnProperty(i) &&
                        iterator.call(context, obj[i], i, obj) === false) {
                        return;
                    }
                }
            }
        },

        /**
         * find if a string contains the string using indexOf
         * @method inStr
         * @param {String} src
         * @param {String} find
         * @return {Boolean} found
         */
        inStr: function inStr(src, find) {
            return src.indexOf(find) > -1;
        },

        /**
         * find if a array contains the object using indexOf or a simple polyfill
         * @method inArray
         * @param {String} src
         * @param {String} find
         * @return {Boolean|Number} false when not found, or the index
         */
        inArray: function inArray(src, find) {
            if(src.indexOf) {
                var index = src.indexOf(find);
                return (index === -1) ? false : index;
            } else {
                for(var i = 0, len = src.length; i < len; i++) {
                    if(src[i] === find) {
                        return i;
                    }
                }
                return false;
            }
        },

        /**
         * convert an array-like object (`arguments`, `touchlist`) to an array
         * @method toArray
         * @param {Object} obj
         * @return {Array}
         */
        toArray: function toArray(obj) {
            return Array.prototype.slice.call(obj, 0);
        },

        /**
         * find if a node is in the given parent
         * @method hasParent
         * @param {HTMLElement} node
         * @param {HTMLElement} parent
         * @return {Boolean} found
         */
        hasParent: function hasParent(node, parent) {
            while(node) {
                if(node == parent) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        },

        /**
         * get the center of all the touches
         * @method getCenter
         * @param {Array} touches
         * @return {Object} center contains `pageX`, `pageY`, `clientX` and `clientY` properties
         */
        getCenter: function getCenter(touches) {
            var pageX = [],
                pageY = [],
                clientX = [],
                clientY = [],
                min = Math.min,
                max = Math.max;

            // no need to loop when only one touch
            if(touches.length === 1) {
                return {
                    pageX: touches[0].pageX,
                    pageY: touches[0].pageY,
                    clientX: touches[0].clientX,
                    clientY: touches[0].clientY
                };
            }

            Utils.each(touches, function(touch) {
                pageX.push(touch.pageX);
                pageY.push(touch.pageY);
                clientX.push(touch.clientX);
                clientY.push(touch.clientY);
            });

            return {
                pageX: (min.apply(Math, pageX) + max.apply(Math, pageX)) / 2,
                pageY: (min.apply(Math, pageY) + max.apply(Math, pageY)) / 2,
                clientX: (min.apply(Math, clientX) + max.apply(Math, clientX)) / 2,
                clientY: (min.apply(Math, clientY) + max.apply(Math, clientY)) / 2
            };
        },

        /**
         * calculate the velocity between two points. unit is in px per ms.
         * @method getVelocity
         * @param {Number} deltaTime
         * @param {Number} deltaX
         * @param {Number} deltaY
         * @return {Object} velocity `x` and `y`
         */
        getVelocity: function getVelocity(deltaTime, deltaX, deltaY) {
            return {
                x: Math.abs(deltaX / deltaTime) || 0,
                y: Math.abs(deltaY / deltaTime) || 0
            };
        },

        /**
         * calculate the angle between two coordinates
         * @method getAngle
         * @param {Touch} touch1
         * @param {Touch} touch2
         * @return {Number} angle
         */
        getAngle: function getAngle(touch1, touch2) {
            var x = touch2.clientX - touch1.clientX,
                y = touch2.clientY - touch1.clientY;

            return Math.atan2(y, x) * 180 / Math.PI;
        },

        /**
         * do a small comparision to get the direction between two touches.
         * @method getDirection
         * @param {Touch} touch1
         * @param {Touch} touch2
         * @return {String} direction matches `DIRECTION_LEFT|RIGHT|UP|DOWN`
         */
        getDirection: function getDirection(touch1, touch2) {
            var x = Math.abs(touch1.clientX - touch2.clientX),
                y = Math.abs(touch1.clientY - touch2.clientY);

            if(x >= y) {
                return touch1.clientX - touch2.clientX > 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
            }
            return touch1.clientY - touch2.clientY > 0 ? DIRECTION_UP : DIRECTION_DOWN;
        },

        /**
         * calculate the distance between two touches
         * @method getDistance
         * @param {Touch}touch1
         * @param {Touch} touch2
         * @return {Number} distance
         */
        getDistance: function getDistance(touch1, touch2) {
            var x = touch2.clientX - touch1.clientX,
                y = touch2.clientY - touch1.clientY;

            return Math.sqrt((x * x) + (y * y));
        },

        /**
         * calculate the scale factor between two touchLists
         * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
         * @method getScale
         * @param {Array} start array of touches
         * @param {Array} end array of touches
         * @return {Number} scale
         */
        getScale: function getScale(start, end) {
            // need two fingers...
            if(start.length >= 2 && end.length >= 2) {
                return this.getDistance(end[0], end[1]) / this.getDistance(start[0], start[1]);
            }
            return 1;
        },

        /**
         * calculate the rotation degrees between two touchLists
         * @method getRotation
         * @param {Array} start array of touches
         * @param {Array} end array of touches
         * @return {Number} rotation
         */
        getRotation: function getRotation(start, end) {
            // need two fingers
            if(start.length >= 2 && end.length >= 2) {
                return this.getAngle(end[1], end[0]) - this.getAngle(start[1], start[0]);
            }
            return 0;
        },

        /**
         * find out if the direction is vertical   *
         * @method isVertical
         * @param {String} direction matches `DIRECTION_UP|DOWN`
         * @return {Boolean} is_vertical
         */
        isVertical: function isVertical(direction) {
            return direction == DIRECTION_UP || direction == DIRECTION_DOWN;
        },

        /**
         * set css properties with their prefixes
         * @param {HTMLElement} element
         * @param {String} prop
         * @param {String} value
         * @param {Boolean} [toggle=true]
         * @return {Boolean}
         */
        setPrefixedCss: function setPrefixedCss(element, prop, value, toggle) {
            var prefixes = ['', 'Webkit', 'Moz', 'O', 'ms'];
            prop = Utils.toCamelCase(prop);

            for(var i = 0; i < prefixes.length; i++) {
                var p = prop;
                // prefixes
                if(prefixes[i]) {
                    p = prefixes[i] + p.slice(0, 1).toUpperCase() + p.slice(1);
                }

                // test the style
                if(p in element.style) {
                    element.style[p] = (toggle == null || toggle) && value || '';
                    break;
                }
            }
        },

        /**
         * toggle browser default behavior by setting css properties.
         * `userSelect='none'` also sets `element.onselectstart` to false
         * `userDrag='none'` also sets `element.ondragstart` to false
         *
         * @method toggleBehavior
         * @param {HtmlElement} element
         * @param {Object} props
         * @param {Boolean} [toggle=true]
         */
        toggleBehavior: function toggleBehavior(element, props, toggle) {
            if(!props || !element || !element.style) {
                return;
            }

            // set the css properties
            Utils.each(props, function(value, prop) {
                Utils.setPrefixedCss(element, prop, value, toggle);
            });

            var falseFn = toggle && function() {
                return false;
            };

            // also the disable onselectstart
            if(props.userSelect == 'none') {
                element.onselectstart = falseFn;
            }
            // and disable ondragstart
            if(props.userDrag == 'none') {
                element.ondragstart = falseFn;
            }
        },

        /**
         * convert a string with underscores to camelCase
         * so prevent_default becomes preventDefault
         * @param {String} str
         * @return {String} camelCaseStr
         */
        toCamelCase: function toCamelCase(str) {
            return str.replace(/[_-]([a-z])/g, function(s) {
                return s[1].toUpperCase();
            });
        }
    };


    /**
     * @module hammer
     */
    /**
     * @class Event
     * @static
     */
    var Event = Hammer.event = {
        /**
         * when touch events have been fired, this is true
         * this is used to stop mouse events
         * @property prevent_mouseevents
         * @private
         * @type {Boolean}
         */
        preventMouseEvents: false,

        /**
         * if EVENT_START has been fired
         * @property started
         * @private
         * @type {Boolean}
         */
        started: false,

        /**
         * when the mouse is hold down, this is true
         * @property should_detect
         * @private
         * @type {Boolean}
         */
        shouldDetect: false,

        /**
         * simple event binder with a hook and support for multiple types
         * @method on
         * @param {HTMLElement} element
         * @param {String} type
         * @param {Function} handler
         * @param {Function} [hook]
         * @param {Object} hook.type
         */
        on: function on(element, type, handler, hook) {
            var types = type.split(' ');
            Utils.each(types, function(type) {
                Utils.on(element, type, handler);
                hook && hook(type);
            });
        },

        /**
         * simple event unbinder with a hook and support for multiple types
         * @method off
         * @param {HTMLElement} element
         * @param {String} type
         * @param {Function} handler
         * @param {Function} [hook]
         * @param {Object} hook.type
         */
        off: function off(element, type, handler, hook) {
            var types = type.split(' ');
            Utils.each(types, function(type) {
                Utils.off(element, type, handler);
                hook && hook(type);
            });
        },

        /**
         * the core touch event handler.
         * this finds out if we should to detect gestures
         * @method onTouch
         * @param {HTMLElement} element
         * @param {String} eventType matches `EVENT_START|MOVE|END`
         * @param {Function} handler
         * @return onTouchHandler {Function} the core event handler
         */
        onTouch: function onTouch(element, eventType, handler) {
            var self = this;

            var onTouchHandler = function onTouchHandler(ev) {

                var srcType = ev.type.toLowerCase(),
                    isPointer = Hammer.HAS_POINTEREVENTS,
                    isMouse = Utils.inStr(srcType, 'mouse'),
                    triggerType;

                // if we are in a mouseevent, but there has been a touchevent triggered in this session
                // we want to do nothing. simply break out of the event.
                if(isMouse && self.preventMouseEvents) {
                    return;

                    // mousebutton must be down
                } else if(isMouse && eventType == EVENT_START && ev.button === 0) {
                    self.preventMouseEvents = false;
                    self.shouldDetect = true;
                } else if(isPointer && eventType == EVENT_START) {
                    self.shouldDetect = (ev.buttons === 1 || PointerEvent.matchType(POINTER_TOUCH, ev));
                    // just a valid start event, but no mouse
                } else if(!isMouse && eventType == EVENT_START) {
                    self.preventMouseEvents = true;
                    self.shouldDetect = true;
                }

                // update the pointer event before entering the detection
                if(isPointer && eventType != EVENT_END) {
                    PointerEvent.updatePointer(eventType, ev);
                }

                // we are in a touch/down state, so allowed detection of gestures
                if(self.shouldDetect) {
                    triggerType = self.doDetect.call(self, ev, eventType, element, handler);
                }

                // ...and we are done with the detection
                // so reset everything to start each detection totally fresh
                if(triggerType == EVENT_END) {
                    self.preventMouseEvents = false;
                    self.shouldDetect = false;
                    PointerEvent.reset();
                    // update the pointerevent object after the detection
                }

                if(isPointer && eventType == EVENT_END) {
                    PointerEvent.updatePointer(eventType, ev);
                }
            };

            this.on(element, EVENT_TYPES[eventType], onTouchHandler);
            return onTouchHandler;
        },

        /**
         * the core detection method
         * this finds out what hammer-touch-events to trigger
         * @method doDetect
         * @param {Object} ev
         * @param {String} eventType matches `EVENT_START|MOVE|END`
         * @param {HTMLElement} element
         * @param {Function} handler
         * @return {String} triggerType matches `EVENT_START|MOVE|END`
         */
        doDetect: function doDetect(ev, eventType, element, handler) {
            var touchList = this.getTouchList(ev, eventType);
            var touchListLength = touchList.length;
            var triggerType = eventType;
            var triggerChange = touchList.trigger; // used by fakeMultitouch plugin
            var changedLength = touchListLength;

            // at each touchstart-like event we want also want to trigger a TOUCH event...
            if(eventType == EVENT_START) {
                triggerChange = EVENT_TOUCH;
                // ...the same for a touchend-like event
            } else if(eventType == EVENT_END) {
                triggerChange = EVENT_RELEASE;

                // keep track of how many touches have been removed
                changedLength = touchList.length - ((ev.changedTouches) ? ev.changedTouches.length : 1);
            }

            // after there are still touches on the screen,
            // we just want to trigger a MOVE event. so change the START or END to a MOVE
            // but only after detection has been started, the first time we actualy want a START
            if(changedLength > 0 && this.started) {
                triggerType = EVENT_MOVE;
            }

            // detection has been started, we keep track of this, see above
            this.started = true;

            // generate some event data, some basic information
            var evData = this.collectEventData(element, triggerType, touchList, ev);

            // trigger the triggerType event before the change (TOUCH, RELEASE) events
            // but the END event should be at last
            if(eventType != EVENT_END) {
                handler.call(Detection, evData);
            }

            // trigger a change (TOUCH, RELEASE) event, this means the length of the touches changed
            if(triggerChange) {
                evData.changedLength = changedLength;
                evData.eventType = triggerChange;

                handler.call(Detection, evData);

                evData.eventType = triggerType;
                delete evData.changedLength;
            }

            // trigger the END event
            if(triggerType == EVENT_END) {
                handler.call(Detection, evData);

                // ...and we are done with the detection
                // so reset everything to start each detection totally fresh
                this.started = false;
            }

            return triggerType;
        },

        /**
         * we have different events for each device/browser
         * determine what we need and set them in the EVENT_TYPES constant
         * the `onTouch` method is bind to these properties.
         * @method determineEventTypes
         * @return {Object} events
         */
        determineEventTypes: function determineEventTypes() {
            var types;
            if(Hammer.HAS_POINTEREVENTS) {
                if(window.PointerEvent) {
                    types = [
                        'pointerdown',
                        'pointermove',
                        'pointerup pointercancel lostpointercapture'
                    ];
                } else {
                    types = [
                        'MSPointerDown',
                        'MSPointerMove',
                        'MSPointerUp MSPointerCancel MSLostPointerCapture'
                    ];
                }
            } else if(Hammer.NO_MOUSEEVENTS) {
                types = [
                    'touchstart',
                    'touchmove',
                    'touchend touchcancel'
                ];
            } else {
                types = [
                    'touchstart mousedown',
                    'touchmove mousemove',
                    'touchend touchcancel mouseup'
                ];
            }

            EVENT_TYPES[EVENT_START] = types[0];
            EVENT_TYPES[EVENT_MOVE] = types[1];
            EVENT_TYPES[EVENT_END] = types[2];
            return EVENT_TYPES;
        },

        /**
         * create touchList depending on the event
         * @method getTouchList
         * @param {Object} ev
         * @param {String} eventType
         * @return {Array} touches
         */
        getTouchList: function getTouchList(ev, eventType) {
            // get the fake pointerEvent touchlist
            if(Hammer.HAS_POINTEREVENTS) {
                return PointerEvent.getTouchList();
            }

            // get the touchlist
            if(ev.touches) {
                if(eventType == EVENT_MOVE) {
                    return ev.touches;
                }

                var identifiers = [];
                var concat = [].concat(Utils.toArray(ev.touches), Utils.toArray(ev.changedTouches));
                var touchList = [];

                Utils.each(concat, function(touch) {
                    if(Utils.inArray(identifiers, touch.identifier) === false) {
                        touchList.push(touch);
                    }
                    identifiers.push(touch.identifier);
                });

                return touchList;
            }

            // make fake touchList from mouse position
            ev.identifier = 1;
            return [ev];
        },

        /**
         * collect basic event data
         * @method collectEventData
         * @param {HTMLElement} element
         * @param {String} eventType matches `EVENT_START|MOVE|END`
         * @param {Array} touches
         * @param {Object} ev
         * @return {Object} ev
         */
        collectEventData: function collectEventData(element, eventType, touches, ev) {
            // find out pointerType
            var pointerType = POINTER_TOUCH;
            if(Utils.inStr(ev.type, 'mouse') || PointerEvent.matchType(POINTER_MOUSE, ev)) {
                pointerType = POINTER_MOUSE;
            } else if(PointerEvent.matchType(POINTER_PEN, ev)) {
                pointerType = POINTER_PEN;
            }

            return {
                center: Utils.getCenter(touches),
                timeStamp: Date.now(),
                target: ev.target,
                touches: touches,
                eventType: eventType,
                pointerType: pointerType,
                srcEvent: ev,

                /**
                 * prevent the browser default actions
                 * mostly used to disable scrolling of the browser
                 */
                preventDefault: function() {
                    var srcEvent = this.srcEvent;
                    srcEvent.preventManipulation && srcEvent.preventManipulation();
                    srcEvent.preventDefault && srcEvent.preventDefault();
                },

                /**
                 * stop bubbling the event up to its parents
                 */
                stopPropagation: function() {
                    this.srcEvent.stopPropagation();
                },

                /**
                 * immediately stop gesture detection
                 * might be useful after a swipe was detected
                 * @return {*}
                 */
                stopDetect: function() {
                    return Detection.stopDetect();
                }
            };
        }
    };


    /**
     * @module hammer
     *
     * @class PointerEvent
     * @static
     */
    var PointerEvent = Hammer.PointerEvent = {
        /**
         * holds all pointers, by `identifier`
         * @property pointers
         * @type {Object}
         */
        pointers: {},

        /**
         * get the pointers as an array
         * @method getTouchList
         * @return {Array} touchlist
         */
        getTouchList: function getTouchList() {
            var touchlist = [];
            // we can use forEach since pointerEvents only is in IE10
            Utils.each(this.pointers, function(pointer) {
                touchlist.push(pointer);
            });

            return touchlist;
        },

        /**
         * update the position of a pointer
         * @method updatePointer
         * @param {String} eventType matches `EVENT_START|MOVE|END`
         * @param {Object} pointerEvent
         */
        updatePointer: function updatePointer(eventType, pointerEvent) {
            if(eventType == EVENT_END) {
                delete this.pointers[pointerEvent.pointerId];
            } else {
                pointerEvent.identifier = pointerEvent.pointerId;
                this.pointers[pointerEvent.pointerId] = pointerEvent;
            }
        },

        /**
         * check if ev matches pointertype
         * @method matchType
         * @param {String} pointerType matches `POINTER_MOUSE|TOUCH|PEN`
         * @param {PointerEvent} ev
         */
        matchType: function matchType(pointerType, ev) {
            if(!ev.pointerType) {
                return false;
            }

            var pt = ev.pointerType,
                types = {};

            types[POINTER_MOUSE] = (pt === (ev.MSPOINTER_TYPE_MOUSE || POINTER_MOUSE));
            types[POINTER_TOUCH] = (pt === (ev.MSPOINTER_TYPE_TOUCH || POINTER_TOUCH));
            types[POINTER_PEN] = (pt === (ev.MSPOINTER_TYPE_PEN || POINTER_PEN));
            return types[pointerType];
        },

        /**
         * reset the stored pointers
         * @method reset
         */
        reset: function resetList() {
            this.pointers = {};
        }
    };


    /**
     * @module hammer
     *
     * @class Detection
     * @static
     */
    var Detection = Hammer.detection = {
        // contains all registred Hammer.gestures in the correct order
        gestures: [],

        // data of the current Hammer.gesture detection session
        current: null,

        // the previous Hammer.gesture session data
        // is a full clone of the previous gesture.current object
        previous: null,

        // when this becomes true, no gestures are fired
        stopped: false,

        /**
         * start Hammer.gesture detection
         * @method startDetect
         * @param {Hammer.Instance} inst
         * @param {Object} eventData
         */
        startDetect: function startDetect(inst, eventData) {
            // already busy with a Hammer.gesture detection on an element
            if(this.current) {
                return;
            }

            this.stopped = false;

            // holds current session
            this.current = {
                inst: inst, // reference to HammerInstance we're working for
                startEvent: Utils.extend({}, eventData), // start eventData for distances, timing etc
                lastEvent: false, // last eventData
                lastCalcEvent: false, // last eventData for calculations.
                futureCalcEvent: false, // last eventData for calculations.
                lastCalcData: {}, // last lastCalcData
                name: '' // current gesture we're in/detected, can be 'tap', 'hold' etc
            };

            this.detect(eventData);
        },

        /**
         * Hammer.gesture detection
         * @method detect
         * @param {Object} eventData
         * @return {any}
         */
        detect: function detect(eventData) {
            if(!this.current || this.stopped) {
                return;
            }

            // extend event data with calculations about scale, distance etc
            eventData = this.extendEventData(eventData);

            // hammer instance and instance options
            var inst = this.current.inst,
                instOptions = inst.options;

            // call Hammer.gesture handlers
            Utils.each(this.gestures, function triggerGesture(gesture) {
                // only when the instance options have enabled this gesture
                if(!this.stopped && inst.enabled && instOptions[gesture.name]) {
                    gesture.handler.call(gesture, eventData, inst);
                }
            }, this);

            // store as previous event event
            if(this.current) {
                this.current.lastEvent = eventData;
            }

            if(eventData.eventType == EVENT_END) {
                this.stopDetect();
            }

            return eventData;
        },

        /**
         * clear the Hammer.gesture vars
         * this is called on endDetect, but can also be used when a final Hammer.gesture has been detected
         * to stop other Hammer.gestures from being fired
         * @method stopDetect
         */
        stopDetect: function stopDetect() {
            // clone current data to the store as the previous gesture
            // used for the double tap gesture, since this is an other gesture detect session
            this.previous = Utils.extend({}, this.current);

            // reset the current
            this.current = null;
            this.stopped = true;
        },

        /**
         * calculate velocity, angle and direction
         * @method getVelocityData
         * @param {Object} ev
         * @param {Object} center
         * @param {Number} deltaTime
         * @param {Number} deltaX
         * @param {Number} deltaY
         */
        getCalculatedData: function getCalculatedData(ev, center, deltaTime, deltaX, deltaY) {
            var cur = this.current,
                recalc = false,
                calcEv = cur.lastCalcEvent,
                calcData = cur.lastCalcData;

            if(calcEv && ev.timeStamp - calcEv.timeStamp > Hammer.CALCULATE_INTERVAL) {
                center = calcEv.center;
                deltaTime = ev.timeStamp - calcEv.timeStamp;
                deltaX = ev.center.clientX - calcEv.center.clientX;
                deltaY = ev.center.clientY - calcEv.center.clientY;
                recalc = true;
            }

            if(ev.eventType == EVENT_TOUCH || ev.eventType == EVENT_RELEASE) {
                cur.futureCalcEvent = ev;
            }

            if(!cur.lastCalcEvent || recalc) {
                calcData.velocity = Utils.getVelocity(deltaTime, deltaX, deltaY);
                calcData.angle = Utils.getAngle(center, ev.center);
                calcData.direction = Utils.getDirection(center, ev.center);

                cur.lastCalcEvent = cur.futureCalcEvent || ev;
                cur.futureCalcEvent = ev;
            }

            ev.velocityX = calcData.velocity.x;
            ev.velocityY = calcData.velocity.y;
            ev.interimAngle = calcData.angle;
            ev.interimDirection = calcData.direction;
        },

        /**
         * extend eventData for Hammer.gestures
         * @method extendEventData
         * @param {Object} ev
         * @return {Object} ev
         */
        extendEventData: function extendEventData(ev) {
            var cur = this.current,
                startEv = cur.startEvent,
                lastEv = cur.lastEvent || startEv;

            // update the start touchlist to calculate the scale/rotation
            if(ev.eventType == EVENT_TOUCH || ev.eventType == EVENT_RELEASE) {
                startEv.touches = [];
                Utils.each(ev.touches, function(touch) {
                    startEv.touches.push({
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    });
                });
            }

            var deltaTime = ev.timeStamp - startEv.timeStamp,
                deltaX = ev.center.clientX - startEv.center.clientX,
                deltaY = ev.center.clientY - startEv.center.clientY;

            this.getCalculatedData(ev, lastEv.center, deltaTime, deltaX, deltaY);

            Utils.extend(ev, {
                startEvent: startEv,

                deltaTime: deltaTime,
                deltaX: deltaX,
                deltaY: deltaY,

                distance: Utils.getDistance(startEv.center, ev.center),
                angle: Utils.getAngle(startEv.center, ev.center),
                direction: Utils.getDirection(startEv.center, ev.center),
                scale: Utils.getScale(startEv.touches, ev.touches),
                rotation: Utils.getRotation(startEv.touches, ev.touches)
            });

            return ev;
        },

        /**
         * register new gesture
         * @method register
         * @param {Object} gesture object, see `gestures/` for documentation
         * @return {Array} gestures
         */
        register: function register(gesture) {
            // add an enable gesture options if there is no given
            var options = gesture.defaults || {};
            if(options[gesture.name] === undefined) {
                options[gesture.name] = true;
            }

            // extend Hammer default options with the Hammer.gesture options
            Utils.extend(Hammer.defaults, options, true);

            // set its index
            gesture.index = gesture.index || 1000;

            // add Hammer.gesture to the list
            this.gestures.push(gesture);

            // sort the list by index
            this.gestures.sort(function(a, b) {
                if(a.index < b.index) {
                    return -1;
                }
                if(a.index > b.index) {
                    return 1;
                }
                return 0;
            });

            return this.gestures;
        }
    };


    /**
     * @module hammer
     */

    /**
     * create new hammer instance
     * all methods should return the instance itself, so it is chainable.
     *
     * @class Instance
     * @constructor
     * @param {HTMLElement} element
     * @param {Object} [options={}] options are merged with `Hammer.defaults`
     * @return {Hammer.Instance}
     */
    Hammer.Instance = function(element, options) {
        var self = this;

        // setup HammerJS window events and register all gestures
        // this also sets up the default options
        setup();

        /**
         * @property element
         * @type {HTMLElement}
         */
        this.element = element;

        /**
         * @property enabled
         * @type {Boolean}
         * @protected
         */
        this.enabled = true;

        /**
         * options, merged with the defaults
         * options with an _ are converted to camelCase
         * @property options
         * @type {Object}
         */
        Utils.each(options, function(value, name) {
            delete options[name];
            options[Utils.toCamelCase(name)] = value;
        });

        this.options = Utils.extend(Utils.extend({}, Hammer.defaults), options || {});

        // add some css to the element to prevent the browser from doing its native behavoir
        if(this.options.behavior) {
            Utils.toggleBehavior(this.element, this.options.behavior, true);
        }

        /**
         * event start handler on the element to start the detection
         * @property eventStartHandler
         * @type {Object}
         */
        this.eventStartHandler = Event.onTouch(element, EVENT_START, function(ev) {
            if(self.enabled && ev.eventType == EVENT_START) {
                Detection.startDetect(self, ev);
            } else if(ev.eventType == EVENT_TOUCH) {
                Detection.detect(ev);
            }
        });

        /**
         * keep a list of user event handlers which needs to be removed when calling 'dispose'
         * @property eventHandlers
         * @type {Array}
         */
        this.eventHandlers = [];
    };

    Hammer.Instance.prototype = {
        /**
         * bind events to the instance
         * @method on
         * @chainable
         * @param {String} gestures multiple gestures by splitting with a space
         * @param {Function} handler
         * @param {Object} handler.ev event object
         */
        on: function onEvent(gestures, handler) {
            var self = this;
            Event.on(self.element, gestures, handler, function(type) {
                self.eventHandlers.push({ gesture: type, handler: handler });
            });
            return self;
        },

        /**
         * unbind events to the instance
         * @method off
         * @chainable
         * @param {String} gestures
         * @param {Function} handler
         */
        off: function offEvent(gestures, handler) {
            var self = this;

            Event.off(self.element, gestures, handler, function(type) {
                var index = Utils.inArray({ gesture: type, handler: handler });
                if(index !== false) {
                    self.eventHandlers.splice(index, 1);
                }
            });
            return self;
        },

        /**
         * trigger gesture event
         * @method trigger
         * @chainable
         * @param {String} gesture
         * @param {Object} [eventData]
         */
        trigger: function triggerEvent(gesture, eventData) {
            // optional
            if(!eventData) {
                eventData = {};
            }

            // create DOM event
            var event = Hammer.DOCUMENT.createEvent('Event');
            event.initEvent(gesture, true, true);
            event.gesture = eventData;

            // trigger on the target if it is in the instance element,
            // this is for event delegation tricks
            var element = this.element;
            if(Utils.hasParent(eventData.target, element)) {
                element = eventData.target;
            }

            if(navigator.isCocoonJS) {
                var me = this;
                me.eventHandlers.forEach(function(eventHandler) {
                    if(gesture === eventHandler.gesture) {
                        eventHandler.handler(event);
                    }
                });
            } else {
                element.dispatchEvent(event);
            }
            return this;
        },

        /**
         * enable of disable hammer.js detection
         * @method enable
         * @chainable
         * @param {Boolean} state
         */
        enable: function enable(state) {
            this.enabled = state;
            return this;
        },

        /**
         * dispose this hammer instance
         * @method dispose
         * @return {Null}
         */
        dispose: function dispose() {
            var i, eh;

            // undo all changes made by stop_browser_behavior
            Utils.toggleBehavior(this.element, this.options.behavior, false);

            // unbind all custom event handlers
            for(i = -1; (eh = this.eventHandlers[++i]);) {
                Utils.off(this.element, eh.gesture, eh.handler);
            }

            this.eventHandlers = [];

            // unbind the start event listener
            Event.off(this.element, EVENT_TYPES[EVENT_START], this.eventStartHandler);

            return null;
        }
    };


    /**
     * @module gestures
     */
    /**
     * Move with x fingers (default 1) around on the page.
     * Preventing the default browser behavior is a good way to improve feel and working.
     * ````
     *  hammertime.on("drag", function(ev) {
 *    console.log(ev);
 *    ev.gesture.preventDefault();
 *  });
     * ````
     *
     * @class Drag
     * @static
     */
    /**
     * @event drag
     * @param {Object} ev
     */
    /**
     * @event dragstart
     * @param {Object} ev
     */
    /**
     * @event dragend
     * @param {Object} ev
     */
    /**
     * @event drapleft
     * @param {Object} ev
     */
    /**
     * @event dragright
     * @param {Object} ev
     */
    /**
     * @event dragup
     * @param {Object} ev
     */
    /**
     * @event dragdown
     * @param {Object} ev
     */

    /**
     * @param {String} name
     */
    (function(name) {
        var triggered = false;

        function dragGesture(ev, inst) {
            var cur = Detection.current;

            // max touches
            if(inst.options.dragMaxTouches > 0 &&
                ev.touches.length > inst.options.dragMaxTouches) {
                return;
            }

            switch(ev.eventType) {
                case EVENT_START:
                    triggered = false;
                    break;

                case EVENT_MOVE:
                    // when the distance we moved is too small we skip this gesture
                    // or we can be already in dragging
                    if(ev.distance < inst.options.dragMinDistance &&
                        cur.name != name) {
                        return;
                    }

                    var startCenter = cur.startEvent.center;

                    // we are dragging!
                    if(cur.name != name) {
                        cur.name = name;
                        if(inst.options.dragDistanceCorrection && ev.distance > 0) {
                            // When a drag is triggered, set the event center to dragMinDistance pixels from the original event center.
                            // Without this correction, the dragged distance would jumpstart at dragMinDistance pixels instead of at 0.
                            // It might be useful to save the original start point somewhere
                            var factor = Math.abs(inst.options.dragMinDistance / ev.distance);
                            startCenter.pageX += ev.deltaX * factor;
                            startCenter.pageY += ev.deltaY * factor;
                            startCenter.clientX += ev.deltaX * factor;
                            startCenter.clientY += ev.deltaY * factor;

                            // recalculate event data using new start point
                            ev = Detection.extendEventData(ev);
                        }
                    }

                    // lock drag to axis?
                    if(cur.lastEvent.dragLockToAxis ||
                        ( inst.options.dragLockToAxis &&
                            inst.options.dragLockMinDistance <= ev.distance
                            )) {
                        ev.dragLockToAxis = true;
                    }

                    // keep direction on the axis that the drag gesture started on
                    var lastDirection = cur.lastEvent.direction;
                    if(ev.dragLockToAxis && lastDirection !== ev.direction) {
                        if(Utils.isVertical(lastDirection)) {
                            ev.direction = (ev.deltaY < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                        } else {
                            ev.direction = (ev.deltaX < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                        }
                    }

                    // first time, trigger dragstart event
                    if(!triggered) {
                        inst.trigger(name + 'start', ev);
                        triggered = true;
                    }

                    // trigger events
                    inst.trigger(name, ev);
                    inst.trigger(name + ev.direction, ev);

                    var isVertical = Utils.isVertical(ev.direction);

                    // block the browser events
                    if((inst.options.dragBlockVertical && isVertical) ||
                        (inst.options.dragBlockHorizontal && !isVertical)) {
                        ev.preventDefault();
                    }
                    break;

                case EVENT_RELEASE:
                    if(triggered && ev.changedLength <= inst.options.dragMaxTouches) {
                        inst.trigger(name + 'end', ev);
                        triggered = false;
                    }
                    break;

                case EVENT_END:
                    triggered = false;
                    break;
            }
        }

        Hammer.gestures.Drag = {
            name: name,
            index: 50,
            handler: dragGesture,
            defaults: {
                /**
                 * minimal movement that have to be made before the drag event gets triggered
                 * @property dragMinDistance
                 * @type {Number}
                 * @default 10
                 */
                dragMinDistance: 10,

                /**
                 * Set dragDistanceCorrection to true to make the starting point of the drag
                 * be calculated from where the drag was triggered, not from where the touch started.
                 * Useful to avoid a jerk-starting drag, which can make fine-adjustments
                 * through dragging difficult, and be visually unappealing.
                 * @property dragDistanceCorrection
                 * @type {Boolean}
                 * @default true
                 */
                dragDistanceCorrection: true,

                /**
                 * set 0 for unlimited, but this can conflict with transform
                 * @property dragMaxTouches
                 * @type {Number}
                 * @default 1
                 */
                dragMaxTouches: 1,

                /**
                 * prevent default browser behavior when dragging occurs
                 * be careful with it, it makes the element a blocking element
                 * when you are using the drag gesture, it is a good practice to set this true
                 * @property dragBlockHorizontal
                 * @type {Boolean}
                 * @default false
                 */
                dragBlockHorizontal: false,

                /**
                 * same as `dragBlockHorizontal`, but for vertical movement
                 * @property dragBlockVertical
                 * @type {Boolean}
                 * @default false
                 */
                dragBlockVertical: false,

                /**
                 * dragLockToAxis keeps the drag gesture on the axis that it started on,
                 * It disallows vertical directions if the initial direction was horizontal, and vice versa.
                 * @property dragLockToAxis
                 * @type {Boolean}
                 * @default false
                 */
                dragLockToAxis: false,

                /**
                 * drag lock only kicks in when distance > dragLockMinDistance
                 * This way, locking occurs only when the distance has become large enough to reliably determine the direction
                 * @property dragLockMinDistance
                 * @type {Number}
                 * @default 25
                 */
                dragLockMinDistance: 25
            }
        };
    })('drag');

    /**
     * @module gestures
     */
    /**
     * trigger a simple gesture event, so you can do anything in your handler.
     * only usable if you know what your doing...
     *
     * @class Gesture
     * @static
     */
    /**
     * @event gesture
     * @param {Object} ev
     */
    Hammer.gestures.Gesture = {
        name: 'gesture',
        index: 1337,
        handler: function releaseGesture(ev, inst) {
            inst.trigger(this.name, ev);
        }
    };

    /**
     * @module gestures
     */
    /**
     * Touch stays at the same place for x time
     *
     * @class Hold
     * @static
     */
    /**
     * @event hold
     * @param {Object} ev
     */

    /**
     * @param {String} name
     */
    (function(name) {
        var timer;

        function holdGesture(ev, inst) {
            var options = inst.options,
                current = Detection.current;

            switch(ev.eventType) {
                case EVENT_START:
                    clearTimeout(timer);

                    // set the gesture so we can check in the timeout if it still is
                    current.name = name;

                    // set timer and if after the timeout it still is hold,
                    // we trigger the hold event
                    timer = setTimeout(function() {
                        if(current && current.name == name) {
                            inst.trigger(name, ev);
                        }
                    }, options.holdTimeout);
                    break;

                case EVENT_MOVE:
                    if(ev.distance > options.holdThreshold) {
                        clearTimeout(timer);
                    }
                    break;

                case EVENT_RELEASE:
                    clearTimeout(timer);
                    break;
            }
        }

        Hammer.gestures.Hold = {
            name: name,
            index: 10,
            defaults: {
                /**
                 * @property holdTimeout
                 * @type {Number}
                 * @default 500
                 */
                holdTimeout: 500,

                /**
                 * movement allowed while holding
                 * @property holdThreshold
                 * @type {Number}
                 * @default 2
                 */
                holdThreshold: 2
            },
            handler: holdGesture
        };
    })('hold');

    /**
     * @module gestures
     */
    /**
     * when a touch is being released from the page
     *
     * @class Release
     * @static
     */
    /**
     * @event release
     * @param {Object} ev
     */
    Hammer.gestures.Release = {
        name: 'release',
        index: Infinity,
        handler: function releaseGesture(ev, inst) {
            if(ev.eventType == EVENT_RELEASE) {
                inst.trigger(this.name, ev);
            }
        }
    };

    /**
     * @module gestures
     */
    /**
     * triggers swipe events when the end velocity is above the threshold
     * for best usage, set `preventDefault` (on the drag gesture) to `true`
     * ````
     *  hammertime.on("dragleft swipeleft", function(ev) {
 *    console.log(ev);
 *    ev.gesture.preventDefault();
 *  });
     * ````
     *
     * @class Swipe
     * @static
     */
    /**
     * @event swipe
     * @param {Object} ev
     */
    /**
     * @event swipeleft
     * @param {Object} ev
     */
    /**
     * @event swiperight
     * @param {Object} ev
     */
    /**
     * @event swipeup
     * @param {Object} ev
     */
    /**
     * @event swipedown
     * @param {Object} ev
     */
    Hammer.gestures.Swipe = {
        name: 'swipe',
        index: 40,
        defaults: {
            /**
             * @property swipeMinTouches
             * @type {Number}
             * @default 1
             */
            swipeMinTouches: 1,

            /**
             * @property swipeMaxTouches
             * @type {Number}
             * @default 1
             */
            swipeMaxTouches: 1,

            /**
             * horizontal swipe velocity
             * @property swipeVelocityX
             * @type {Number}
             * @default 0.6
             */
            swipeVelocityX: 0.6,

            /**
             * vertical swipe velocity
             * @property swipeVelocityY
             * @type {Number}
             * @default 0.6
             */
            swipeVelocityY: 0.6
        },

        handler: function swipeGesture(ev, inst) {
            if(ev.eventType == EVENT_RELEASE) {
                var touches = ev.touches.length,
                    options = inst.options;

                // max touches
                if(touches < options.swipeMinTouches ||
                    touches > options.swipeMaxTouches) {
                    return;
                }

                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(ev.velocityX > options.swipeVelocityX ||
                    ev.velocityY > options.swipeVelocityY) {
                    // trigger swipe events
                    inst.trigger(this.name, ev);
                    inst.trigger(this.name + ev.direction, ev);
                }
            }
        }
    };

    /**
     * @module gestures
     */
    /**
     * Single tap and a double tap on a place
     *
     * @class Tap
     * @static
     */
    /**
     * @event tap
     * @param {Object} ev
     */
    /**
     * @event doubletap
     * @param {Object} ev
     */

    /**
     * @param {String} name
     */
    (function(name) {
        var hasMoved = false;

        function tapGesture(ev, inst) {
            var options = inst.options,
                current = Detection.current,
                prev = Detection.previous,
                sincePrev,
                didDoubleTap;

            switch(ev.eventType) {
                case EVENT_START:
                    hasMoved = false;
                    break;

                case EVENT_MOVE:
                    hasMoved = hasMoved || (ev.distance > options.tapMaxDistance);
                    break;

                case EVENT_END:
                    if(!Utils.inStr(ev.srcEvent.type, 'cancel') && ev.deltaTime < options.tapMaxTime && !hasMoved) {
                        // previous gesture, for the double tap since these are two different gesture detections
                        sincePrev = prev && prev.lastEvent && ev.timeStamp - prev.lastEvent.timeStamp;
                        didDoubleTap = false;

                        // check if double tap
                        if(prev && prev.name == name &&
                            (sincePrev && sincePrev < options.doubleTapInterval) &&
                            ev.distance < options.doubleTapDistance) {
                            inst.trigger('doubletap', ev);
                            didDoubleTap = true;
                        }

                        // do a single tap
                        if(!didDoubleTap || options.tapAlways) {
                            current.name = name;
                            inst.trigger(current.name, ev);
                        }
                    }
                    break;
            }
        }

        Hammer.gestures.Tap = {
            name: name,
            index: 100,
            handler: tapGesture,
            defaults: {
                /**
                 * max time of a tap, this is for the slow tappers
                 * @property tapMaxTime
                 * @type {Number}
                 * @default 250
                 */
                tapMaxTime: 250,

                /**
                 * max distance of movement of a tap, this is for the slow tappers
                 * @property tapMaxDistance
                 * @type {Number}
                 * @default 10
                 */
                tapMaxDistance: 10,

                /**
                 * always trigger the `tap` event, even while double-tapping
                 * @property tapAlways
                 * @type {Boolean}
                 * @default true
                 */
                tapAlways: true,

                /**
                 * max distance between two taps
                 * @property doubleTapDistance
                 * @type {Number}
                 * @default 20
                 */
                doubleTapDistance: 20,

                /**
                 * max time between two taps
                 * @property doubleTapInterval
                 * @type {Number}
                 * @default 300
                 */
                doubleTapInterval: 300
            }
        };
    })('tap');

    /**
     * @module gestures
     */
    /**
     * when a touch is being touched at the page
     *
     * @class Touch
     * @static
     */
    /**
     * @event touch
     * @param {Object} ev
     */
    Hammer.gestures.Touch = {
        name: 'touch',
        index: -Infinity,
        defaults: {
            /**
             * call preventDefault at touchstart, and makes the element blocking by disabling the scrolling of the page,
             * but it improves gestures like transforming and dragging.
             * be careful with using this, it can be very annoying for users to be stuck on the page
             * @property preventDefault
             * @type {Boolean}
             * @default false
             */
            preventDefault: false,

            /**
             * disable mouse events, so only touch (or pen!) input triggers events
             * @property preventMouse
             * @type {Boolean}
             * @default false
             */
            preventMouse: false
        },
        handler: function touchGesture(ev, inst) {
            if(inst.options.preventMouse && ev.pointerType == POINTER_MOUSE) {
                ev.stopDetect();
                return;
            }

            if(inst.options.preventDefault) {
                ev.preventDefault();
            }

            if(ev.eventType == EVENT_TOUCH) {
                inst.trigger('touch', ev);
            }
        }
    };

    /**
     * @module gestures
     */
    /**
     * User want to scale or rotate with 2 fingers
     * Preventing the default browser behavior is a good way to improve feel and working. This can be done with the
     * `preventDefault` option.
     *
     * @class Transform
     * @static
     */
    /**
     * @event transform
     * @param {Object} ev
     */
    /**
     * @event transformstart
     * @param {Object} ev
     */
    /**
     * @event transformend
     * @param {Object} ev
     */
    /**
     * @event pinchin
     * @param {Object} ev
     */
    /**
     * @event pinchout
     * @param {Object} ev
     */
    /**
     * @event rotate
     * @param {Object} ev
     */

    /**
     * @param {String} name
     */
    (function(name) {
        var triggered = false;

        function transformGesture(ev, inst) {
            switch(ev.eventType) {
                case EVENT_START:
                    triggered = false;
                    break;

                case EVENT_MOVE:
                    // at least multitouch
                    if(ev.touches.length < 2) {
                        return;
                    }

                    var scaleThreshold = Math.abs(1 - ev.scale);
                    var rotationThreshold = Math.abs(ev.rotation);

                    // when the distance we moved is too small we skip this gesture
                    // or we can be already in dragging
                    if(scaleThreshold < inst.options.transformMinScale &&
                        rotationThreshold < inst.options.transformMinRotation) {
                        return;
                    }

                    // we are transforming!
                    Detection.current.name = name;

                    // first time, trigger dragstart event
                    if(!triggered) {
                        inst.trigger(name + 'start', ev);
                        triggered = true;
                    }

                    inst.trigger(name, ev); // basic transform event

                    // trigger rotate event
                    if(rotationThreshold > inst.options.transformMinRotation) {
                        inst.trigger('rotate', ev);
                    }

                    // trigger pinch event
                    if(scaleThreshold > inst.options.transformMinScale) {
                        inst.trigger('pinch', ev);
                        inst.trigger('pinch' + (ev.scale < 1 ? 'in' : 'out'), ev);
                    }
                    break;

                case EVENT_RELEASE:
                    if(triggered && ev.changedLength < 2) {
                        inst.trigger(name + 'end', ev);
                        triggered = false;
                    }
                    break;
            }
        }

        Hammer.gestures.Transform = {
            name: name,
            index: 45,
            defaults: {
                /**
                 * minimal scale factor, no scale is 1, zoomin is to 0 and zoomout until higher then 1
                 * @property transformMinScale
                 * @type {Number}
                 * @default 0.01
                 */
                transformMinScale: 0.01,

                /**
                 * rotation in degrees
                 * @property transformMinRotation
                 * @type {Number}
                 * @default 1
                 */
                transformMinRotation: 1
            },

            handler: transformGesture
        };
    })('transform');

    /**
     * @module hammer
     */

// AMD export
    if(typeof define == 'function' && define.amd) {
        define(function() {
            return Hammer;
        });
// commonjs export
    } else if(typeof module !== 'undefined' && module.exports) {
        module.exports = Hammer;
// browser export
    } else {
        window.Hammer = Hammer;
    }

})(window);/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var Animation = (function () {
        /**
         * Creates a new Animation instance and attaches it to the passed Armature.
         * @param armature An Armature to attach this Animation instance to.
         */
        function Animation(armature) {
            /** @private */
            this._animationStateCount = 0;
            this._armature = armature;
            this._animationList = [];
            this._animationStateList = [];
            this._timeScale = 1;
            this._isPlaying = false;
            this.tweenEnabled = true;
        }
        /**
         * Qualifies all resources used by this Animation instance for garbage collection.
         */
        Animation.prototype.dispose = function () {
            if (!this._armature) {
                return;
            }
            var i = this._animationStateList.length;
            while (i--) {
                dragonBones.AnimationState._returnObject(this._animationStateList[i]);
            }
            this._animationList.length = 0;
            this._animationStateList.length = 0;
            this._armature = null;
            this._animationDataList = null;
            this._animationList = null;
            this._animationStateList = null;
        };
        /**
         * Fades the animation with name animation in over a period of time seconds and fades other animations out.
         * @param animationName The name of the AnimationData to play.
         * @param fadeInTime A fade time to apply (>= 0), -1 means use xml data's fadeInTime.
         * @param duration The duration of that Animation. -1 means use xml data's duration.
         * @param playTimes Play times(0:loop forever, >=1:play times, -1~-∞:will fade animation after play complete), 默认使用AnimationData.loop.
         * @param layer The layer of the animation.
         * @param group The group of the animation.
         * @param fadeOutMode Fade out mode (none, sameLayer, sameGroup, sameLayerAndGroup, all).
         * @param pauseFadeOut Pause other animation playing.
         * @param pauseFadeIn Pause this animation playing before fade in complete.
         * @return AnimationState.
         * @see dragonBones.objects.AnimationData.
         * @see dragonBones.animation.AnimationState.
         */
        Animation.prototype.gotoAndPlay = function (animationName, fadeInTime, duration, playTimes, layer, group, fadeOutMode, pauseFadeOut, pauseFadeIn) {
            if (fadeInTime === void 0) { fadeInTime = -1; }
            if (duration === void 0) { duration = -1; }
            if (playTimes === void 0) { playTimes = NaN; }
            if (layer === void 0) { layer = 0; }
            if (group === void 0) { group = null; }
            if (fadeOutMode === void 0) { fadeOutMode = Animation.SAME_LAYER_AND_GROUP; }
            if (pauseFadeOut === void 0) { pauseFadeOut = true; }
            if (pauseFadeIn === void 0) { pauseFadeIn = true; }
            if (!this._animationDataList) {
                return null;
            }
            var i = this._animationDataList.length;
            var animationData;
            while (i--) {
                if (this._animationDataList[i].name == animationName) {
                    animationData = this._animationDataList[i];
                    break;
                }
            }
            if (!animationData) {
                return null;
            }
            this._isPlaying = true;
            this._isFading = true;
            //
            fadeInTime = fadeInTime < 0 ? (animationData.fadeTime < 0 ? 0.3 : animationData.fadeTime) : fadeInTime;
            var durationScale;
            if (duration < 0) {
                durationScale = animationData.scale < 0 ? 1 : animationData.scale;
            }
            else {
                durationScale = duration * 1000 / animationData.duration;
            }
            playTimes = isNaN(playTimes) ? animationData.playTimes : playTimes;
            //根据fadeOutMode,选择正确的animationState执行fadeOut
            var animationState;
            switch (fadeOutMode) {
                case Animation.NONE:
                    break;
                case Animation.SAME_LAYER:
                    i = this._animationStateList.length;
                    while (i--) {
                        animationState = this._animationStateList[i];
                        if (animationState.layer == layer) {
                            animationState.fadeOut(fadeInTime, pauseFadeOut);
                        }
                    }
                    break;
                case Animation.SAME_GROUP:
                    i = this._animationStateList.length;
                    while (i--) {
                        animationState = this._animationStateList[i];
                        if (animationState.group == group) {
                            animationState.fadeOut(fadeInTime, pauseFadeOut);
                        }
                    }
                    break;
                case Animation.ALL:
                    i = this._animationStateList.length;
                    while (i--) {
                        animationState = this._animationStateList[i];
                        animationState.fadeOut(fadeInTime, pauseFadeOut);
                    }
                    break;
                case Animation.SAME_LAYER_AND_GROUP:
                default:
                    i = this._animationStateList.length;
                    while (i--) {
                        animationState = this._animationStateList[i];
                        if (animationState.layer == layer && animationState.group == group) {
                            animationState.fadeOut(fadeInTime, pauseFadeOut);
                        }
                    }
                    break;
            }
            this._lastAnimationState = dragonBones.AnimationState._borrowObject();
            this._lastAnimationState._layer = layer;
            this._lastAnimationState._group = group;
            this._lastAnimationState.autoTween = this.tweenEnabled;
            this._lastAnimationState._fadeIn(this._armature, animationData, fadeInTime, 1 / durationScale, playTimes, pauseFadeIn);
            this.addState(this._lastAnimationState);
            //控制子骨架播放同名动画
            var slotList = this._armature.getSlots(false);
            i = slotList.length;
            while (i--) {
                var slot = slotList[i];
                if (slot.childArmature) {
                    slot.childArmature.animation.gotoAndPlay(animationName, fadeInTime);
                }
            }
            return this._lastAnimationState;
        };
        /**
         * Control the animation to stop with a specified time. If related animationState haven't been created, then create a new animationState.
         * @param animationName The name of the animationState.
         * @param time
         * @param normalizedTime
         * @param fadeInTime A fade time to apply (>= 0), -1 means use xml data's fadeInTime.
         * @param duration The duration of that Animation. -1 means use xml data's duration.
         * @param layer The layer of the animation.
         * @param group The group of the animation.
         * @param fadeOutMode Fade out mode (none, sameLayer, sameGroup, sameLayerAndGroup, all).
         * @return AnimationState.
         * @see dragonBones.objects.AnimationData.
         * @see dragonBones.animation.AnimationState.
         */
        Animation.prototype.gotoAndStop = function (animationName, time, normalizedTime, fadeInTime, duration, layer, group, fadeOutMode) {
            if (normalizedTime === void 0) { normalizedTime = -1; }
            if (fadeInTime === void 0) { fadeInTime = 0; }
            if (duration === void 0) { duration = -1; }
            if (layer === void 0) { layer = 0; }
            if (group === void 0) { group = null; }
            if (fadeOutMode === void 0) { fadeOutMode = Animation.ALL; }
            var animationState = this.getState(animationName, layer);
            if (!animationState) {
                animationState = this.gotoAndPlay(animationName, fadeInTime, duration, NaN, layer, group, fadeOutMode);
            }
            if (normalizedTime >= 0) {
                animationState.setCurrentTime(animationState.totalTime * normalizedTime);
            }
            else {
                animationState.setCurrentTime(time);
            }
            animationState.stop();
            return animationState;
        };
        /**
         * Play the animation from the current position.
         */
        Animation.prototype.play = function () {
            if (!this._animationDataList || this._animationDataList.length == 0) {
                return;
            }
            if (!this._lastAnimationState) {
                this.gotoAndPlay(this._animationDataList[0].name);
            }
            else if (!this._isPlaying) {
                this._isPlaying = true;
            }
            else {
                this.gotoAndPlay(this._lastAnimationState.name);
            }
        };
        Animation.prototype.stop = function () {
            this._isPlaying = false;
        };
        /**
         * Returns the AnimationState named name.
         * @return A AnimationState instance.
         * @see dragonBones.animation.AnimationState.
         */
        Animation.prototype.getState = function (name, layer) {
            if (layer === void 0) { layer = 0; }
            var i = this._animationStateList.length;
            while (i--) {
                var animationState = this._animationStateList[i];
                if (animationState.name == name && animationState.layer == layer) {
                    return animationState;
                }
            }
            return null;
        };
        /**
         * check if contains a AnimationData by name.
         * @return Boolean.
         * @see dragonBones.animation.AnimationData.
         */
        Animation.prototype.hasAnimation = function (animationName) {
            var i = this._animationDataList.length;
            while (i--) {
                if (this._animationDataList[i].name == animationName) {
                    return true;
                }
            }
            return false;
        };
        /** @private */
        Animation.prototype._advanceTime = function (passedTime) {
            if (!this._isPlaying) {
                return;
            }
            var isFading = false;
            passedTime *= this._timeScale;
            var i = this._animationStateList.length;
            while (i--) {
                var animationState = this._animationStateList[i];
                if (animationState._advanceTime(passedTime)) {
                    this.removeState(animationState);
                }
                else if (animationState.fadeState != 1) {
                    isFading = true;
                }
            }
            this._isFading = isFading;
        };
        /** @private */
        //当动画播放过程中Bonelist改变时触发
        Animation.prototype._updateAnimationStates = function () {
            var i = this._animationStateList.length;
            while (i--) {
                this._animationStateList[i]._updateTimelineStates();
            }
        };
        Animation.prototype.addState = function (animationState) {
            if (this._animationStateList.indexOf(animationState) < 0) {
                this._animationStateList.unshift(animationState);
                this._animationStateCount = this._animationStateList.length;
            }
        };
        Animation.prototype.removeState = function (animationState) {
            var index = this._animationStateList.indexOf(animationState);
            if (index >= 0) {
                this._animationStateList.splice(index, 1);
                dragonBones.AnimationState._returnObject(animationState);
                if (this._lastAnimationState == animationState) {
                    if (this._animationStateList.length > 0) {
                        this._lastAnimationState = this._animationStateList[0];
                    }
                    else {
                        this._lastAnimationState = null;
                    }
                }
                this._animationStateCount = this._animationStateList.length;
            }
        };
        Object.defineProperty(Animation.prototype, "movementList", {
            /**
            * Unrecommended API. Recommend use animationList.
            */
            get: function () {
                return this._animationList;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation.prototype, "movementID", {
            /**
            * Unrecommended API. Recommend use lastAnimationName.
            */
            get: function () {
                return this.lastAnimationName;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation.prototype, "lastAnimationState", {
            /**
             * The last AnimationState this Animation played.
             * @see dragonBones.objects.AnimationData.
             */
            get: function () {
                return this._lastAnimationState;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation.prototype, "lastAnimationName", {
            /**
             * The name of the last AnimationData played.
             * @see dragonBones.objects.AnimationData.
             */
            get: function () {
                return this._lastAnimationState ? this._lastAnimationState.name : null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation.prototype, "animationList", {
            /**
             * An vector containing all AnimationData names the Animation can play.
             * @see dragonBones.objects.AnimationData.
             */
            get: function () {
                return this._animationList;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation.prototype, "isPlaying", {
            /**
             * Is the animation playing.
             * @see dragonBones.animation.AnimationState.
             */
            get: function () {
                return this._isPlaying && !this.isComplete;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation.prototype, "isComplete", {
            /**
             * Is animation complete.
             * @see dragonBones.animation.AnimationState.
             */
            get: function () {
                if (this._lastAnimationState) {
                    if (!this._lastAnimationState.isComplete) {
                        return false;
                    }
                    var i = this._animationStateList.length;
                    while (i--) {
                        if (!this._animationStateList[i].isComplete) {
                            return false;
                        }
                    }
                    return true;
                }
                return true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation.prototype, "timeScale", {
            /**
             * The amount by which passed time should be scaled. Used to slow down or speed up animations. Defaults to 1.
             */
            get: function () {
                return this._timeScale;
            },
            set: function (value) {
                if (isNaN(value) || value < 0) {
                    value = 1;
                }
                this._timeScale = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation.prototype, "animationDataList", {
            /**
             * The AnimationData list associated with this Animation instance.
             * @see dragonBones.objects.AnimationData.
             */
            get: function () {
                return this._animationDataList;
            },
            set: function (value) {
                this._animationDataList = value;
                this._animationList.length = 0;
                for (var key in this._animationDataList) {
                    var animationData = this._animationDataList[key];
                    this._animationList[this._animationList.length] = animationData.name;
                }
            },
            enumerable: true,
            configurable: true
        });
        Animation.NONE = "none";
        Animation.SAME_LAYER = "sameLayer";
        Animation.SAME_GROUP = "sameGroup";
        Animation.SAME_LAYER_AND_GROUP = "sameLayerAndGroup";
        Animation.ALL = "all";
        return Animation;
    })();
    dragonBones.Animation = Animation;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var AnimationState = (function () {
        function AnimationState() {
            /** @private */
            this._layer = 0;
            this._currentFrameIndex = 0;
            this._currentFramePosition = 0;
            this._currentFrameDuration = 0;
            this._currentPlayTimes = 0;
            this._totalTime = 0;
            this._currentTime = 0;
            //-1 beforeFade, 0 fading, 1 fadeComplete
            this._fadeState = 0;
            this._playTimes = 0;
            this._timelineStateList = [];
            this._boneMasks = [];
        }
        /** @private */
        AnimationState._borrowObject = function () {
            if (AnimationState._pool.length == 0) {
                return new AnimationState();
            }
            return AnimationState._pool.pop();
        };
        /** @private */
        AnimationState._returnObject = function (animationState) {
            animationState.clear();
            if (AnimationState._pool.indexOf(animationState) < 0) {
                AnimationState._pool[AnimationState._pool.length] = animationState;
            }
        };
        /** @private */
        AnimationState._clear = function () {
            var i = AnimationState._pool.length;
            while (i--) {
                AnimationState._pool[i].clear();
            }
            AnimationState._pool.length = 0;
            dragonBones.TimelineState._clear();
        };
        AnimationState.prototype.clear = function () {
            var i = this._timelineStateList.length;
            while (i--) {
                dragonBones.TimelineState._returnObject(this._timelineStateList[i]);
            }
            this._timelineStateList.length = 0;
            this._boneMasks.length = 0;
            this._armature = null;
            this._clip = null;
        };
        //骨架装配
        AnimationState.prototype.containsBoneMask = function (boneName) {
            return this._boneMasks.length == 0 || this._boneMasks.indexOf(boneName) >= 0;
        };
        /**
         * Adds a bone which should be animated. This allows you to reduce the number of animations you have to create.
         * @param boneName Bone's name.
         * @param ifInvolveChildBones if involve child bone's animation.
         */
        AnimationState.prototype.addBoneMask = function (boneName, ifInvolveChildBones) {
            if (ifInvolveChildBones === void 0) { ifInvolveChildBones = true; }
            this.addBoneToBoneMask(currentBone.name);
            if (ifInvolveChildBones) {
                var currentBone = this._armature.getBone(boneName);
                if (currentBone) {
                    var boneList = this._armature.getBones(false);
                    var i = boneList.length;
                    while (i--) {
                        var tempBone = boneList[i];
                        if (currentBone.contains(tempBone)) {
                            this.addBoneToBoneMask(currentBone.name);
                        }
                    }
                }
            }
            this._updateTimelineStates();
            return this;
        };
        /**
         * Removes a bone which was supposed be animated.
         * @param boneName Bone's timeline name.
         * @param ifInvolveChildBones If involved child bone's timeline.
         */
        AnimationState.prototype.removeBoneMask = function (boneName, ifInvolveChildBones) {
            if (ifInvolveChildBones === void 0) { ifInvolveChildBones = true; }
            this.removeBoneFromBoneMask(boneName);
            if (ifInvolveChildBones) {
                var currentBone = this._armature.getBone(boneName);
                if (currentBone) {
                    var boneList = this._armature.getBones(false);
                    var i = boneList.length;
                    while (i--) {
                        var tempBone = boneList[i];
                        if (currentBone.contains(tempBone)) {
                            this.removeBoneFromBoneMask(currentBone.name);
                        }
                    }
                }
            }
            this._updateTimelineStates();
            return this;
        };
        AnimationState.prototype.removeAllMixingTransform = function () {
            this._boneMasks.length = 0;
            this._updateTimelineStates();
            return this;
        };
        AnimationState.prototype.addBoneToBoneMask = function (boneName) {
            if (this._clip.getTimeline(boneName) && this._boneMasks.indexOf(boneName) < 0) {
                this._boneMasks.push(boneName);
            }
        };
        AnimationState.prototype.removeBoneFromBoneMask = function (boneName) {
            var index = this._boneMasks.indexOf(boneName);
            if (index >= 0) {
                this._boneMasks.splice(index, 1);
            }
        };
        /**
         * @private
         * Update timeline state based on mixing transforms and clip.
         */
        AnimationState.prototype._updateTimelineStates = function () {
            var timelineState;
            var i = this._timelineStateList.length;
            while (i--) {
                timelineState = this._timelineStateList[i];
                if (!this._armature.getBone(timelineState.name)) {
                    this.removeTimelineState(timelineState);
                }
            }
            if (this._boneMasks.length > 0) {
                i = this._timelineStateList.length;
                while (i--) {
                    timelineState = this._timelineStateList[i];
                    if (this._boneMasks.indexOf(timelineState.name) < 0) {
                        this.removeTimelineState(timelineState);
                    }
                }
                for (var key in this._boneMasks) {
                    var timelineName = this._boneMasks[key];
                    this.addTimelineState(timelineName);
                }
            }
            else {
                for (var key in this._clip.timelineList) {
                    var timeline = this._clip.timelineList[key];
                    this.addTimelineState(timeline.name);
                }
            }
        };
        AnimationState.prototype.addTimelineState = function (timelineName) {
            var bone = this._armature.getBone(timelineName);
            if (bone) {
                for (var key in this._timelineStateList) {
                    var eachState = this._timelineStateList[key];
                    if (eachState.name == timelineName) {
                        return;
                    }
                }
                var timelineState = dragonBones.TimelineState._borrowObject();
                timelineState._fadeIn(bone, this, this._clip.getTimeline(timelineName));
                this._timelineStateList.push(timelineState);
            }
        };
        AnimationState.prototype.removeTimelineState = function (timelineState) {
            var index = this._timelineStateList.indexOf(timelineState);
            this._timelineStateList.splice(index, 1);
            dragonBones.TimelineState._returnObject(timelineState);
        };
        //动画
        /**
         * Play the current animation. 如果动画已经播放完毕, 将不会继续播放.
         */
        AnimationState.prototype.play = function () {
            this._isPlaying = true;
            return this;
        };
        /**
         * Stop playing current animation.
         */
        AnimationState.prototype.stop = function () {
            this._isPlaying = false;
            return this;
        };
        /** @private */
        AnimationState.prototype._fadeIn = function (armature, clip, fadeTotalTime, timeScale, playTimes, pausePlayhead) {
            this._armature = armature;
            this._clip = clip;
            this._pausePlayheadInFade = pausePlayhead;
            this._name = this._clip.name;
            this._totalTime = this._clip.duration;
            this.autoTween = this._clip.autoTween;
            this.setTimeScale(timeScale);
            this.setPlayTimes(playTimes);
            //reset
            this._isComplete = false;
            this._currentFrameIndex = -1;
            this._currentPlayTimes = -1;
            if (Math.round(this._totalTime * this._clip.frameRate * 0.001) < 2 || timeScale == Infinity) {
                this._currentTime = this._totalTime;
            }
            else {
                this._currentTime = -1;
            }
            this._time = 0;
            this._boneMasks.length = 0;
            //fade start
            this._isFadeOut = false;
            this._fadeWeight = 0;
            this._fadeTotalWeight = 1;
            this._fadeState = -1;
            this._fadeCurrentTime = 0;
            this._fadeBeginTime = this._fadeCurrentTime;
            this._fadeTotalTime = fadeTotalTime * this._timeScale;
            //default
            this._isPlaying = true;
            this.displayControl = true;
            this.lastFrameAutoTween = true;
            this.additiveBlending = false;
            this.weight = 1;
            this.fadeOutTime = fadeTotalTime;
            this._updateTimelineStates();
            return this;
        };
        /**
         * Fade out the animation state
         * @param fadeTotalTime fadeOutTime
         * @param pausePlayhead pauseBeforeFadeOutComplete pause the animation before fade out complete
         */
        AnimationState.prototype.fadeOut = function (fadeTotalTime, pausePlayhead) {
            if (!this._armature) {
                return null;
            }
            if (isNaN(fadeTotalTime) || fadeTotalTime < 0) {
                fadeTotalTime = 0;
            }
            this._pausePlayheadInFade = pausePlayhead;
            if (this._isFadeOut) {
                if (fadeTotalTime > this._fadeTotalTime / this._timeScale - (this._fadeCurrentTime - this._fadeBeginTime)) {
                    //如果已经在淡出中，新的淡出需要更长的淡出时间，则忽略
                    //If the animation is already in fade out, the new fade out will be ignored.
                    return this;
                }
            }
            else {
                for (var key in this._timelineStateList) {
                    var timelineState = this._timelineStateList[key];
                    timelineState._fadeOut();
                }
            }
            //fade start
            this._isFadeOut = true;
            this._fadeTotalWeight = this._fadeWeight;
            this._fadeState = -1;
            this._fadeBeginTime = this._fadeCurrentTime;
            this._fadeTotalTime = this._fadeTotalWeight >= 0 ? fadeTotalTime * this._timeScale : 0;
            //default
            this.displayControl = false;
            return this;
        };
        /** @private */
        AnimationState.prototype._advanceTime = function (passedTime) {
            passedTime *= this._timeScale;
            this.advanceFadeTime(passedTime);
            if (this._fadeWeight) {
                this.advanceTimelinesTime(passedTime);
            }
            return this._isFadeOut && this._fadeState == 1;
        };
        AnimationState.prototype.advanceFadeTime = function (passedTime) {
            var fadeStartFlg = false;
            var fadeCompleteFlg = false;
            if (this._fadeBeginTime >= 0) {
                var fadeState = this._fadeState;
                this._fadeCurrentTime += passedTime < 0 ? -passedTime : passedTime;
                if (this._fadeCurrentTime >= this._fadeBeginTime + this._fadeTotalTime) {
                    //fade完全结束之后触发 
                    //TODO 研究明白为什么要下次再触发
                    if (this._fadeWeight == 1 || this._fadeWeight == 0) {
                        fadeState = 1;
                        if (this._pausePlayheadInFade) {
                            this._pausePlayheadInFade = false;
                            this._currentTime = -1;
                        }
                    }
                    this._fadeWeight = this._isFadeOut ? 0 : 1;
                }
                else if (this._fadeCurrentTime >= this._fadeBeginTime) {
                    //fading
                    fadeState = 0;
                    //暂时只支持线性淡入淡出
                    //Currently only support Linear fadein and fadeout
                    this._fadeWeight = (this._fadeCurrentTime - this._fadeBeginTime) / this._fadeTotalTime * this._fadeTotalWeight;
                    if (this._isFadeOut) {
                        this._fadeWeight = this._fadeTotalWeight - this._fadeWeight;
                    }
                }
                else {
                    //before fade
                    fadeState = -1;
                    this._fadeWeight = this._isFadeOut ? 1 : 0;
                }
                if (this._fadeState != fadeState) {
                    //_fadeState == -1 && (fadeState == 0 || fadeState == 1)
                    if (this._fadeState == -1) {
                        fadeStartFlg = true;
                    }
                    //(_fadeState == -1 || _fadeState == 0) && fadeState == 1
                    if (fadeState == 1) {
                        fadeCompleteFlg = true;
                    }
                    this._fadeState = fadeState;
                }
            }
            var event;
            if (fadeStartFlg) {
                if (this._isFadeOut) {
                    if (this._armature.hasEventListener(dragonBones.AnimationEvent.FADE_OUT)) {
                        event = new dragonBones.AnimationEvent(dragonBones.AnimationEvent.FADE_OUT);
                        event.animationState = this;
                        this._armature._eventList.push(event);
                    }
                }
                else {
                    //动画开始，先隐藏不需要的骨头
                    this.hideBones();
                    if (this._armature.hasEventListener(dragonBones.AnimationEvent.FADE_IN)) {
                        event = new dragonBones.AnimationEvent(dragonBones.AnimationEvent.FADE_IN);
                        event.animationState = this;
                        this._armature._eventList.push(event);
                    }
                }
            }
            if (fadeCompleteFlg) {
                if (this._isFadeOut) {
                    if (this._armature.hasEventListener(dragonBones.AnimationEvent.FADE_OUT_COMPLETE)) {
                        event = new dragonBones.AnimationEvent(dragonBones.AnimationEvent.FADE_OUT_COMPLETE);
                        event.animationState = this;
                        this._armature._eventList.push(event);
                    }
                }
                else {
                    if (this._armature.hasEventListener(dragonBones.AnimationEvent.FADE_IN_COMPLETE)) {
                        event = new dragonBones.AnimationEvent(dragonBones.AnimationEvent.FADE_IN_COMPLETE);
                        event.animationState = this;
                        this._armature._eventList.push(event);
                    }
                }
            }
        };
        AnimationState.prototype.advanceTimelinesTime = function (passedTime) {
            if (this._isPlaying && !this._pausePlayheadInFade) {
                this._time += passedTime;
            }
            var startFlg = false;
            var completeFlg = false;
            var loopCompleteFlg = false;
            var isThisComplete = false;
            var currentPlayTimes = 0;
            var currentTime = this._time * 1000;
            if (this._playTimes == 0) {
                isThisComplete = false;
                currentPlayTimes = Math.ceil(Math.abs(currentTime) / this._totalTime) || 1;
                if (currentTime >= 0) {
                    currentTime -= Math.floor(currentTime / this._totalTime) * this._totalTime;
                }
                else {
                    currentTime -= Math.ceil(currentTime / this._totalTime) * this._totalTime;
                }
                if (currentTime < 0) {
                    currentTime += this._totalTime;
                }
            }
            else {
                var totalTimes = this._playTimes * this._totalTime;
                if (currentTime >= totalTimes) {
                    currentTime = totalTimes;
                    isThisComplete = true;
                }
                else if (currentTime <= -totalTimes) {
                    currentTime = -totalTimes;
                    isThisComplete = true;
                }
                else {
                    isThisComplete = false;
                }
                if (currentTime < 0) {
                    currentTime += totalTimes;
                }
                currentPlayTimes = Math.ceil(currentTime / this._totalTime) || 1;
                if (currentTime >= 0) {
                    currentTime -= Math.floor(currentTime / this._totalTime) * this._totalTime;
                }
                else {
                    currentTime -= Math.ceil(currentTime / this._totalTime) * this._totalTime;
                }
                if (isThisComplete) {
                    currentTime = this._totalTime;
                }
            }
            //update timeline
            this._isComplete = isThisComplete;
            var progress = this._time * 1000 / this._totalTime;
            for (var key in this._timelineStateList) {
                var timeline = this._timelineStateList[key];
                timeline._update(progress);
                this._isComplete = timeline._isComplete && this._isComplete;
            }
            //update main timeline
            if (this._currentTime != currentTime) {
                if (this._currentPlayTimes != currentPlayTimes) {
                    if (this._currentPlayTimes > 0 && currentPlayTimes > 1) {
                        loopCompleteFlg = true;
                    }
                    this._currentPlayTimes = currentPlayTimes;
                }
                if (this._currentTime < 0) {
                    startFlg = true;
                }
                if (this._isComplete) {
                    completeFlg = true;
                }
                this._currentTime = currentTime;
                /*
                if(isThisComplete)
                {
                currentTime = _totalTime * 0.999999;
                }
                //[0, _totalTime)
                */
                this.updateMainTimeline(isThisComplete);
            }
            var event;
            if (startFlg) {
                if (this._armature.hasEventListener(dragonBones.AnimationEvent.START)) {
                    event = new dragonBones.AnimationEvent(dragonBones.AnimationEvent.START);
                    event.animationState = this;
                    this._armature._eventList.push(event);
                }
            }
            if (completeFlg) {
                if (this._armature.hasEventListener(dragonBones.AnimationEvent.COMPLETE)) {
                    event = new dragonBones.AnimationEvent(dragonBones.AnimationEvent.COMPLETE);
                    event.animationState = this;
                    this._armature._eventList.push(event);
                }
                if (this.autoFadeOut) {
                    this.fadeOut(this.fadeOutTime, true);
                }
            }
            else if (loopCompleteFlg) {
                if (this._armature.hasEventListener(dragonBones.AnimationEvent.LOOP_COMPLETE)) {
                    event = new dragonBones.AnimationEvent(dragonBones.AnimationEvent.LOOP_COMPLETE);
                    event.animationState = this;
                    this._armature._eventList.push(event);
                }
            }
        };
        AnimationState.prototype.updateMainTimeline = function (isThisComplete) {
            var frameList = this._clip.frameList;
            if (frameList.length > 0) {
                var prevFrame;
                var currentFrame;
                for (var i = 0, l = this._clip.frameList.length; i < l; ++i) {
                    if (this._currentFrameIndex < 0) {
                        this._currentFrameIndex = 0;
                    }
                    else if (this._currentTime < this._currentFramePosition || this._currentTime >= this._currentFramePosition + this._currentFrameDuration) {
                        this._currentFrameIndex++;
                        if (this._currentFrameIndex >= frameList.length) {
                            if (isThisComplete) {
                                this._currentFrameIndex--;
                                break;
                            }
                            else {
                                this._currentFrameIndex = 0;
                            }
                        }
                    }
                    else {
                        break;
                    }
                    currentFrame = frameList[this._currentFrameIndex];
                    if (prevFrame) {
                        this._armature._arriveAtFrame(prevFrame, null, this, true);
                    }
                    this._currentFrameDuration = currentFrame.duration;
                    this._currentFramePosition = currentFrame.position;
                    prevFrame = currentFrame;
                }
                if (currentFrame) {
                    this._armature._arriveAtFrame(currentFrame, null, this, false);
                }
            }
        };
        AnimationState.prototype.hideBones = function () {
            for (var key in this._clip.hideTimelineNameMap) {
                var timelineName = this._clip.hideTimelineNameMap[key];
                var bone = this._armature.getBone(timelineName);
                if (bone) {
                    bone._hideSlots();
                }
            }
        };
        //属性访问
        AnimationState.prototype.setAdditiveBlending = function (value) {
            this.additiveBlending = value;
            return this;
        };
        AnimationState.prototype.setAutoFadeOut = function (value, fadeOutTime) {
            if (fadeOutTime === void 0) { fadeOutTime = -1; }
            this.autoFadeOut = value;
            if (fadeOutTime >= 0) {
                this.fadeOutTime = fadeOutTime * this._timeScale;
            }
            return this;
        };
        AnimationState.prototype.setWeight = function (value) {
            if (isNaN(value) || value < 0) {
                value = 1;
            }
            this.weight = value;
            return this;
        };
        AnimationState.prototype.setFrameTween = function (autoTween, lastFrameAutoTween) {
            this.autoTween = autoTween;
            this.lastFrameAutoTween = lastFrameAutoTween;
            return this;
        };
        AnimationState.prototype.setCurrentTime = function (value) {
            if (value < 0 || isNaN(value)) {
                value = 0;
            }
            this._time = value;
            this._currentTime = this._time * 1000;
            return this;
        };
        AnimationState.prototype.setTimeScale = function (value) {
            if (isNaN(value) || value == Infinity) {
                value = 1;
            }
            this._timeScale = value;
            return this;
        };
        AnimationState.prototype.setPlayTimes = function (value) {
            if (value === void 0) { value = 0; }
            //如果动画只有一帧  播放一次就可以
            if (Math.round(this._totalTime * 0.001 * this._clip.frameRate) < 2) {
                this._playTimes = value < 0 ? -1 : 1;
            }
            else {
                this._playTimes = value < 0 ? -value : value;
            }
            this.autoFadeOut = value < 0 ? true : false;
            return this;
        };
        Object.defineProperty(AnimationState.prototype, "name", {
            /**
             * The name of the animation state.
             */
            get: function () {
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "layer", {
            /**
             * The layer of the animation. When calculating the final blend weights, animations in higher layers will get their weights.
             */
            get: function () {
                return this._layer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "group", {
            /**
             * The group of the animation.
             */
            get: function () {
                return this._group;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "clip", {
            /**
             * The clip that is being played by this animation state.
             * @see dragonBones.objects.AnimationData.
             */
            get: function () {
                return this._clip;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "isComplete", {
            /**
             * Is animation complete.
             */
            get: function () {
                return this._isComplete;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "isPlaying", {
            /**
             * Is animation playing.
             */
            get: function () {
                return (this._isPlaying && !this._isComplete);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "currentPlayTimes", {
            /**
             * Current animation played times
             */
            get: function () {
                return this._currentPlayTimes < 0 ? 0 : this._currentPlayTimes;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "totalTime", {
            /**
             * The length of the animation clip in seconds.
             */
            get: function () {
                return this._totalTime * 0.001;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "currentTime", {
            /**
             * The current time of the animation.
             */
            get: function () {
                return this._currentTime < 0 ? 0 : this._currentTime * 0.001;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "fadeWeight", {
            get: function () {
                return this._fadeWeight;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "fadeState", {
            get: function () {
                return this._fadeState;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "fadeTotalTime", {
            get: function () {
                return this._fadeTotalTime;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "timeScale", {
            /**
             * The amount by which passed time should be scaled. Used to slow down or speed up the animation. Defaults to 1.
             */
            get: function () {
                return this._timeScale;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationState.prototype, "playTimes", {
            /**
             * playTimes Play times(0:loop forever, 1~+∞:play times, -1~-∞:will fade animation after play complete).
             */
            get: function () {
                return this._playTimes;
            },
            enumerable: true,
            configurable: true
        });
        AnimationState._pool = [];
        return AnimationState;
    })();
    dragonBones.AnimationState = AnimationState;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var TimelineState = (function () {
        function TimelineState() {
            this._totalTime = 0; //duration
            this._currentTime = 0;
            this._currentFrameIndex = 0;
            this._currentFramePosition = 0;
            this._currentFrameDuration = 0;
            //-1: frameLength>1, 0:frameLength==0, 1:frameLength==1
            this._updateMode = 0;
            this._transform = new dragonBones.DBTransform();
            this._pivot = new dragonBones.Point();
            this._durationTransform = new dragonBones.DBTransform();
            this._durationPivot = new dragonBones.Point();
            this._durationColor = new dragonBones.ColorTransform();
        }
        /** @private */
        TimelineState._borrowObject = function () {
            if (TimelineState._pool.length == 0) {
                return new TimelineState();
            }
            return TimelineState._pool.pop();
        };
        /** @private */
        TimelineState._returnObject = function (timeline) {
            if (TimelineState._pool.indexOf(timeline) < 0) {
                TimelineState._pool[TimelineState._pool.length] = timeline;
            }
            timeline.clear();
        };
        /** @private */
        TimelineState._clear = function () {
            var i = TimelineState._pool.length;
            while (i--) {
                TimelineState._pool[i].clear();
            }
            TimelineState._pool.length = 0;
        };
        TimelineState.prototype.clear = function () {
            if (this._bone) {
                this._bone._removeState(this);
                this._bone = null;
            }
            this._armature = null;
            this._animation = null;
            this._animationState = null;
            this._timelineData = null;
            this._originTransform = null;
            this._originPivot = null;
        };
        //动画开始结束
        /** @private */
        TimelineState.prototype._fadeIn = function (bone, animationState, timelineData) {
            this._bone = bone;
            this._armature = this._bone.armature;
            this._animation = this._armature.animation;
            this._animationState = animationState;
            this._timelineData = timelineData;
            this._originTransform = this._timelineData.originTransform;
            this._originPivot = this._timelineData.originPivot;
            this.name = timelineData.name;
            this._totalTime = this._timelineData.duration;
            this._rawAnimationScale = this._animationState.clip.scale;
            this._isComplete = false;
            this._blendEnabled = false;
            this._tweenTransform = false;
            this._tweenScale = false;
            this._tweenColor = false;
            this._currentFrameIndex = -1;
            this._currentTime = -1;
            this._tweenEasing = NaN;
            this._weight = 1;
            this._transform.x = 0;
            this._transform.y = 0;
            this._transform.scaleX = 1;
            this._transform.scaleY = 1;
            this._transform.skewX = 0;
            this._transform.skewY = 0;
            this._pivot.x = 0;
            this._pivot.y = 0;
            this._durationTransform.x = 0;
            this._durationTransform.y = 0;
            this._durationTransform.scaleX = 1;
            this._durationTransform.scaleY = 1;
            this._durationTransform.skewX = 0;
            this._durationTransform.skewY = 0;
            this._durationPivot.x = 0;
            this._durationPivot.y = 0;
            switch (this._timelineData.frameList.length) {
                case 0:
                    this._updateMode = 0;
                    break;
                case 1:
                    this._updateMode = 1;
                    break;
                default:
                    this._updateMode = -1;
                    break;
            }
            this._bone._addState(this);
        };
        /** @private */
        TimelineState.prototype._fadeOut = function () {
            this._transform.skewX = dragonBones.TransformUtil.formatRadian(this._transform.skewX);
            this._transform.skewY = dragonBones.TransformUtil.formatRadian(this._transform.skewY);
        };
        //动画进行中
        /** @private */
        TimelineState.prototype._update = function (progress) {
            if (this._updateMode == -1) {
                this.updateMultipleFrame(progress);
            }
            else if (this._updateMode == 1) {
                this._updateMode = 0;
                this.updateSingleFrame();
            }
        };
        TimelineState.prototype.updateMultipleFrame = function (progress) {
            var currentPlayTimes = 0;
            progress /= this._timelineData.scale;
            progress += this._timelineData.offset;
            var currentTime = this._totalTime * progress;
            var playTimes = this._animationState.playTimes;
            if (playTimes == 0) {
                this._isComplete = false;
                currentPlayTimes = Math.ceil(Math.abs(currentTime) / this._totalTime) || 1;
                if (currentTime >= 0) {
                    currentTime -= Math.floor(currentTime / this._totalTime) * this._totalTime;
                }
                else {
                    currentTime -= Math.ceil(currentTime / this._totalTime) * this._totalTime;
                }
                if (currentTime < 0) {
                    currentTime += this._totalTime;
                }
            }
            else {
                var totalTimes = playTimes * this._totalTime;
                if (currentTime >= totalTimes) {
                    currentTime = totalTimes;
                    this._isComplete = true;
                }
                else if (currentTime <= -totalTimes) {
                    currentTime = -totalTimes;
                    this._isComplete = true;
                }
                else {
                    this._isComplete = false;
                }
                if (currentTime < 0) {
                    currentTime += totalTimes;
                }
                currentPlayTimes = Math.ceil(currentTime / this._totalTime) || 1;
                if (this._isComplete) {
                    currentTime = this._totalTime;
                }
                else {
                    if (currentTime >= 0) {
                        currentTime -= Math.floor(currentTime / this._totalTime) * this._totalTime;
                    }
                    else {
                        currentTime -= Math.ceil(currentTime / this._totalTime) * this._totalTime;
                    }
                }
            }
            if (this._currentTime != currentTime) {
                this._currentTime = currentTime;
                var frameList = this._timelineData.frameList;
                var prevFrame;
                var currentFrame;
                for (var i = 0, l = this._timelineData.frameList.length; i < l; ++i) {
                    if (this._currentFrameIndex < 0) {
                        this._currentFrameIndex = 0;
                    }
                    else if (this._currentTime < this._currentFramePosition || this._currentTime >= this._currentFramePosition + this._currentFrameDuration) {
                        this._currentFrameIndex++;
                        if (this._currentFrameIndex >= frameList.length) {
                            if (this._isComplete) {
                                this._currentFrameIndex--;
                                break;
                            }
                            else {
                                this._currentFrameIndex = 0;
                            }
                        }
                    }
                    else {
                        break;
                    }
                    currentFrame = (frameList[this._currentFrameIndex]);
                    if (prevFrame) {
                        this._bone._arriveAtFrame(prevFrame, this, this._animationState, true);
                    }
                    this._currentFrameDuration = currentFrame.duration;
                    this._currentFramePosition = currentFrame.position;
                    prevFrame = currentFrame;
                }
                if (currentFrame) {
                    this._bone._arriveAtFrame(currentFrame, this, this._animationState, false);
                    this._blendEnabled = currentFrame.displayIndex >= 0;
                    if (this._blendEnabled) {
                        this.updateToNextFrame(currentPlayTimes);
                    }
                    else {
                        this._tweenEasing = NaN;
                        this._tweenTransform = false;
                        this._tweenScale = false;
                        this._tweenColor = false;
                    }
                }
                if (this._blendEnabled) {
                    this.updateTween();
                }
            }
        };
        TimelineState.prototype.updateToNextFrame = function (currentPlayTimes) {
            if (currentPlayTimes === void 0) { currentPlayTimes = 0; }
            var nextFrameIndex = this._currentFrameIndex + 1;
            if (nextFrameIndex >= this._timelineData.frameList.length) {
                nextFrameIndex = 0;
            }
            var currentFrame = (this._timelineData.frameList[this._currentFrameIndex]);
            var nextFrame = (this._timelineData.frameList[nextFrameIndex]);
            var tweenEnabled = false;
            if (nextFrameIndex == 0 && (!this._animationState.lastFrameAutoTween || (this._animationState.playTimes && this._animationState.currentPlayTimes >= this._animationState.playTimes && ((this._currentFramePosition + this._currentFrameDuration) / this._totalTime + currentPlayTimes - this._timelineData.offset) * this._timelineData.scale > 0.999999))) {
                this._tweenEasing = NaN;
                tweenEnabled = false;
            }
            else if (currentFrame.displayIndex < 0 || nextFrame.displayIndex < 0) {
                this._tweenEasing = NaN;
                tweenEnabled = false;
            }
            else if (this._animationState.autoTween) {
                this._tweenEasing = this._animationState.clip.tweenEasing;
                if (isNaN(this._tweenEasing)) {
                    this._tweenEasing = currentFrame.tweenEasing;
                    if (isNaN(this._tweenEasing)) {
                        tweenEnabled = false;
                    }
                    else {
                        if (this._tweenEasing == 10) {
                            this._tweenEasing = 0;
                        }
                        //_tweenEasing [-1, 0) 0 (0, 1] (1, 2]
                        tweenEnabled = true;
                    }
                }
                else {
                    //_tweenEasing [-1, 0) 0 (0, 1] (1, 2]
                    tweenEnabled = true;
                }
            }
            else {
                this._tweenEasing = currentFrame.tweenEasing;
                if (isNaN(this._tweenEasing) || this._tweenEasing == 10) {
                    this._tweenEasing = NaN;
                    tweenEnabled = false;
                }
                else {
                    //_tweenEasing [-1, 0) 0 (0, 1] (1, 2]
                    tweenEnabled = true;
                }
            }
            if (tweenEnabled) {
                //transform
                this._durationTransform.x = nextFrame.transform.x - currentFrame.transform.x;
                this._durationTransform.y = nextFrame.transform.y - currentFrame.transform.y;
                this._durationTransform.skewX = nextFrame.transform.skewX - currentFrame.transform.skewX;
                this._durationTransform.skewY = nextFrame.transform.skewY - currentFrame.transform.skewY;
                this._durationTransform.scaleX = nextFrame.transform.scaleX - currentFrame.transform.scaleX + nextFrame.scaleOffset.x;
                this._durationTransform.scaleY = nextFrame.transform.scaleY - currentFrame.transform.scaleY + nextFrame.scaleOffset.y;
                if (nextFrameIndex == 0) {
                    this._durationTransform.skewX = dragonBones.TransformUtil.formatRadian(this._durationTransform.skewX);
                    this._durationTransform.skewY = dragonBones.TransformUtil.formatRadian(this._durationTransform.skewY);
                }
                this._durationPivot.x = nextFrame.pivot.x - currentFrame.pivot.x;
                this._durationPivot.y = nextFrame.pivot.y - currentFrame.pivot.y;
                if (this._durationTransform.x || this._durationTransform.y || this._durationTransform.skewX || this._durationTransform.skewY || this._durationTransform.scaleX || this._durationTransform.scaleY || this._durationPivot.x || this._durationPivot.y) {
                    this._tweenTransform = true;
                    this._tweenScale = currentFrame.tweenScale;
                }
                else {
                    this._tweenTransform = false;
                    this._tweenScale = false;
                }
                //color
                if (currentFrame.color && nextFrame.color) {
                    this._durationColor.alphaOffset = nextFrame.color.alphaOffset - currentFrame.color.alphaOffset;
                    this._durationColor.redOffset = nextFrame.color.redOffset - currentFrame.color.redOffset;
                    this._durationColor.greenOffset = nextFrame.color.greenOffset - currentFrame.color.greenOffset;
                    this._durationColor.blueOffset = nextFrame.color.blueOffset - currentFrame.color.blueOffset;
                    this._durationColor.alphaMultiplier = nextFrame.color.alphaMultiplier - currentFrame.color.alphaMultiplier;
                    this._durationColor.redMultiplier = nextFrame.color.redMultiplier - currentFrame.color.redMultiplier;
                    this._durationColor.greenMultiplier = nextFrame.color.greenMultiplier - currentFrame.color.greenMultiplier;
                    this._durationColor.blueMultiplier = nextFrame.color.blueMultiplier - currentFrame.color.blueMultiplier;
                    if (this._durationColor.alphaOffset || this._durationColor.redOffset || this._durationColor.greenOffset || this._durationColor.blueOffset || this._durationColor.alphaMultiplier || this._durationColor.redMultiplier || this._durationColor.greenMultiplier || this._durationColor.blueMultiplier) {
                        this._tweenColor = true;
                    }
                    else {
                        this._tweenColor = false;
                    }
                }
                else if (currentFrame.color) {
                    this._tweenColor = true;
                    this._durationColor.alphaOffset = -currentFrame.color.alphaOffset;
                    this._durationColor.redOffset = -currentFrame.color.redOffset;
                    this._durationColor.greenOffset = -currentFrame.color.greenOffset;
                    this._durationColor.blueOffset = -currentFrame.color.blueOffset;
                    this._durationColor.alphaMultiplier = 1 - currentFrame.color.alphaMultiplier;
                    this._durationColor.redMultiplier = 1 - currentFrame.color.redMultiplier;
                    this._durationColor.greenMultiplier = 1 - currentFrame.color.greenMultiplier;
                    this._durationColor.blueMultiplier = 1 - currentFrame.color.blueMultiplier;
                }
                else if (nextFrame.color) {
                    this._tweenColor = true;
                    this._durationColor.alphaOffset = nextFrame.color.alphaOffset;
                    this._durationColor.redOffset = nextFrame.color.redOffset;
                    this._durationColor.greenOffset = nextFrame.color.greenOffset;
                    this._durationColor.blueOffset = nextFrame.color.blueOffset;
                    this._durationColor.alphaMultiplier = nextFrame.color.alphaMultiplier - 1;
                    this._durationColor.redMultiplier = nextFrame.color.redMultiplier - 1;
                    this._durationColor.greenMultiplier = nextFrame.color.greenMultiplier - 1;
                    this._durationColor.blueMultiplier = nextFrame.color.blueMultiplier - 1;
                }
                else {
                    this._tweenColor = false;
                }
            }
            else {
                this._tweenTransform = false;
                this._tweenScale = false;
                this._tweenColor = false;
            }
            if (!this._tweenTransform) {
                if (this._animationState.additiveBlending) {
                    this._transform.x = currentFrame.transform.x;
                    this._transform.y = currentFrame.transform.y;
                    this._transform.skewX = currentFrame.transform.skewX;
                    this._transform.skewY = currentFrame.transform.skewY;
                    this._transform.scaleX = currentFrame.transform.scaleX;
                    this._transform.scaleY = currentFrame.transform.scaleY;
                    this._pivot.x = currentFrame.pivot.x;
                    this._pivot.y = currentFrame.pivot.y;
                }
                else {
                    this._transform.x = this._originTransform.x + currentFrame.transform.x;
                    this._transform.y = this._originTransform.y + currentFrame.transform.y;
                    this._transform.skewX = this._originTransform.skewX + currentFrame.transform.skewX;
                    this._transform.skewY = this._originTransform.skewY + currentFrame.transform.skewY;
                    this._transform.scaleX = this._originTransform.scaleX * currentFrame.transform.scaleX;
                    this._transform.scaleY = this._originTransform.scaleY * currentFrame.transform.scaleY;
                    this._pivot.x = this._originPivot.x + currentFrame.pivot.x;
                    this._pivot.y = this._originPivot.y + currentFrame.pivot.y;
                }
                this._bone.invalidUpdate();
            }
            else if (!this._tweenScale) {
                if (this._animationState.additiveBlending) {
                    this._transform.scaleX = currentFrame.transform.scaleX;
                    this._transform.scaleY = currentFrame.transform.scaleY;
                }
                else {
                    this._transform.scaleX = this._originTransform.scaleX * currentFrame.transform.scaleX;
                    this._transform.scaleY = this._originTransform.scaleY * currentFrame.transform.scaleY;
                }
            }
            if (!this._tweenColor && this._animationState.displayControl) {
                if (currentFrame.color) {
                    this._bone._updateColor(currentFrame.color.alphaOffset, currentFrame.color.redOffset, currentFrame.color.greenOffset, currentFrame.color.blueOffset, currentFrame.color.alphaMultiplier, currentFrame.color.redMultiplier, currentFrame.color.greenMultiplier, currentFrame.color.blueMultiplier, true);
                }
                else if (this._bone._isColorChanged) {
                    this._bone._updateColor(0, 0, 0, 0, 1, 1, 1, 1, false);
                }
            }
        };
        TimelineState.prototype.updateTween = function () {
            var progress = (this._currentTime - this._currentFramePosition) / this._currentFrameDuration;
            if (this._tweenEasing) {
                progress = dragonBones.MathUtil.getEaseValue(progress, this._tweenEasing);
            }
            var currentFrame = (this._timelineData.frameList[this._currentFrameIndex]);
            if (this._tweenTransform) {
                var currentTransform = currentFrame.transform;
                var currentPivot = currentFrame.pivot;
                if (this._animationState.additiveBlending) {
                    //additive blending
                    this._transform.x = currentTransform.x + this._durationTransform.x * progress;
                    this._transform.y = currentTransform.y + this._durationTransform.y * progress;
                    this._transform.skewX = currentTransform.skewX + this._durationTransform.skewX * progress;
                    this._transform.skewY = currentTransform.skewY + this._durationTransform.skewY * progress;
                    if (this._tweenScale) {
                        this._transform.scaleX = currentTransform.scaleX + this._durationTransform.scaleX * progress;
                        this._transform.scaleY = currentTransform.scaleY + this._durationTransform.scaleY * progress;
                    }
                    this._pivot.x = currentPivot.x + this._durationPivot.x * progress;
                    this._pivot.y = currentPivot.y + this._durationPivot.y * progress;
                }
                else {
                    //normal blending
                    this._transform.x = this._originTransform.x + currentTransform.x + this._durationTransform.x * progress;
                    this._transform.y = this._originTransform.y + currentTransform.y + this._durationTransform.y * progress;
                    this._transform.skewX = this._originTransform.skewX + currentTransform.skewX + this._durationTransform.skewX * progress;
                    this._transform.skewY = this._originTransform.skewY + currentTransform.skewY + this._durationTransform.skewY * progress;
                    if (this._tweenScale) {
                        this._transform.scaleX = this._originTransform.scaleX * currentTransform.scaleX + this._durationTransform.scaleX * progress;
                        this._transform.scaleY = this._originTransform.scaleY * currentTransform.scaleY + this._durationTransform.scaleY * progress;
                    }
                    this._pivot.x = this._originPivot.x + currentPivot.x + this._durationPivot.x * progress;
                    this._pivot.y = this._originPivot.y + currentPivot.y + this._durationPivot.y * progress;
                }
                this._bone.invalidUpdate();
            }
            if (this._tweenColor && this._animationState.displayControl) {
                if (currentFrame.color) {
                    this._bone._updateColor(currentFrame.color.alphaOffset + this._durationColor.alphaOffset * progress, currentFrame.color.redOffset + this._durationColor.redOffset * progress, currentFrame.color.greenOffset + this._durationColor.greenOffset * progress, currentFrame.color.blueOffset + this._durationColor.blueOffset * progress, currentFrame.color.alphaMultiplier + this._durationColor.alphaMultiplier * progress, currentFrame.color.redMultiplier + this._durationColor.redMultiplier * progress, currentFrame.color.greenMultiplier + this._durationColor.greenMultiplier * progress, currentFrame.color.blueMultiplier + this._durationColor.blueMultiplier * progress, true);
                }
                else {
                    this._bone._updateColor(this._durationColor.alphaOffset * progress, this._durationColor.redOffset * progress, this._durationColor.greenOffset * progress, this._durationColor.blueOffset * progress, 1 + this._durationColor.alphaMultiplier * progress, 1 + this._durationColor.redMultiplier * progress, 1 + this._durationColor.greenMultiplier * progress, 1 + this._durationColor.blueMultiplier * progress, true);
                }
            }
        };
        TimelineState.prototype.updateSingleFrame = function () {
            var currentFrame = (this._timelineData.frameList[0]);
            this._bone._arriveAtFrame(currentFrame, this, this._animationState, false);
            this._isComplete = true;
            this._tweenEasing = NaN;
            this._tweenTransform = false;
            this._tweenScale = false;
            this._tweenColor = false;
            this._blendEnabled = currentFrame.displayIndex >= 0;
            if (this._blendEnabled) {
                /**
                 * <使用绝对数据>
                 * 单帧的timeline，第一个关键帧的transform为0
                 * timeline.originTransform = firstFrame.transform;
                 * eachFrame.transform = eachFrame.transform - timeline.originTransform;
                 * firstFrame.transform == 0;
                 *
                 * <使用相对数据>
                 * 使用相对数据时，timeline.originTransform = 0，第一个关键帧的transform有可能不为 0
                 */
                if (this._animationState.additiveBlending) {
                    this._transform.x = currentFrame.transform.x;
                    this._transform.y = currentFrame.transform.y;
                    this._transform.skewX = currentFrame.transform.skewX;
                    this._transform.skewY = currentFrame.transform.skewY;
                    this._transform.scaleX = currentFrame.transform.scaleX;
                    this._transform.scaleY = currentFrame.transform.scaleY;
                    this._pivot.x = currentFrame.pivot.x;
                    this._pivot.y = currentFrame.pivot.y;
                }
                else {
                    this._transform.x = this._originTransform.x + currentFrame.transform.x;
                    this._transform.y = this._originTransform.y + currentFrame.transform.y;
                    this._transform.skewX = this._originTransform.skewX + currentFrame.transform.skewX;
                    this._transform.skewY = this._originTransform.skewY + currentFrame.transform.skewY;
                    this._transform.scaleX = this._originTransform.scaleX * currentFrame.transform.scaleX;
                    this._transform.scaleY = this._originTransform.scaleY * currentFrame.transform.scaleY;
                    this._pivot.x = this._originPivot.x + currentFrame.pivot.x;
                    this._pivot.y = this._originPivot.y + currentFrame.pivot.y;
                }
                this._bone.invalidUpdate();
                if (this._animationState.displayControl) {
                    if (currentFrame.color) {
                        this._bone._updateColor(currentFrame.color.alphaOffset, currentFrame.color.redOffset, currentFrame.color.greenOffset, currentFrame.color.blueOffset, currentFrame.color.alphaMultiplier, currentFrame.color.redMultiplier, currentFrame.color.greenMultiplier, currentFrame.color.blueMultiplier, true);
                    }
                    else if (this._bone._isColorChanged) {
                        this._bone._updateColor(0, 0, 0, 0, 1, 1, 1, 1, false);
                    }
                }
            }
        };
        TimelineState.HALF_PI = Math.PI * 0.5;
        TimelineState.DOUBLE_PI = Math.PI * 2;
        TimelineState._pool = [];
        return TimelineState;
    })();
    dragonBones.TimelineState = TimelineState;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var WorldClock = (function () {
        /**
         * Creates a new WorldClock instance. (use the static var WorldClock.clock instead).
         */
        function WorldClock(time, timeScale) {
            if (time === void 0) { time = -1; }
            if (timeScale === void 0) { timeScale = 1; }
            this._time = time >= 0 ? time : new Date().getTime() * 0.001;
            this._timeScale = isNaN(timeScale) ? 1 : timeScale;
            this._animatableList = [];
        }
        Object.defineProperty(WorldClock.prototype, "time", {
            get: function () {
                return this._time;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WorldClock.prototype, "timeScale", {
            /**
             * The time scale to apply to the number of second passed to the advanceTime() method.
             * @param A Number to use as a time scale.
             */
            get: function () {
                return this._timeScale;
            },
            set: function (value) {
                if (isNaN(value) || value < 0) {
                    value = 1;
                }
                this._timeScale = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns true if the IAnimatable instance is contained by WorldClock instance.
         * @param An IAnimatable instance (Armature or custom)
         * @return true if the IAnimatable instance is contained by WorldClock instance.
         */
        WorldClock.prototype.contains = function (animatable) {
            return this._animatableList.indexOf(animatable) >= 0;
        };
        /**
         * Add a IAnimatable instance (Armature or custom) to this WorldClock instance.
         * @param An IAnimatable instance (Armature, WorldClock or custom)
         */
        WorldClock.prototype.add = function (animatable) {
            if (animatable && this._animatableList.indexOf(animatable) == -1) {
                this._animatableList.push(animatable);
            }
        };
        /**
         * Remove a IAnimatable instance (Armature or custom) from this WorldClock instance.
         * @param An IAnimatable instance (Armature or custom)
         */
        WorldClock.prototype.remove = function (animatable) {
            var index = this._animatableList.indexOf(animatable);
            if (index >= 0) {
                this._animatableList[index] = null;
            }
        };
        /**
         * Remove all IAnimatable instance (Armature or custom) from this WorldClock instance.
         */
        WorldClock.prototype.clear = function () {
            this._animatableList.length = 0;
        };
        /**
         * Update all registered IAnimatable instance animations using this method typically in an ENTERFRAME Event or with a Timer.
         * @param The amount of second to move the playhead ahead.
         */
        WorldClock.prototype.advanceTime = function (passedTime) {
            if (passedTime === void 0) { passedTime = -1; }
            if (passedTime < 0) {
                passedTime = new Date().getTime() - this._time;
            }
            passedTime *= this._timeScale;
            this._time += passedTime;
            var length = this._animatableList.length;
            if (length == 0) {
                return;
            }
            var currentIndex = 0;
            for (var i = 0; i < length; i++) {
                var animatable = this._animatableList[i];
                if (animatable) {
                    if (currentIndex != i) {
                        this._animatableList[currentIndex] = animatable;
                        this._animatableList[i] = null;
                    }
                    animatable.advanceTime(passedTime);
                    currentIndex++;
                }
            }
            if (currentIndex != i) {
                length = this._animatableList.length;
                while (i < length) {
                    this._animatableList[currentIndex++] = this._animatableList[i++];
                }
                this._animatableList.length = currentIndex;
            }
        };
        /**
         * A global static WorldClock instance ready to use.
         */
        WorldClock.clock = new WorldClock();
        return WorldClock;
    })();
    dragonBones.WorldClock = WorldClock;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var EventDispatcher = (function () {
        function EventDispatcher() {
        }
        EventDispatcher.prototype.hasEventListener = function (type) {
            if (this._listenersMap && this._listenersMap[type]) {
                return true;
            }
            return false;
        };
        EventDispatcher.prototype.addEventListener = function (type, listener) {
            if (type && listener) {
                if (!this._listenersMap) {
                    this._listenersMap = {};
                }
                var listeners = this._listenersMap[type];
                if (listeners) {
                    this.removeEventListener(type, listener);
                }
                if (listeners) {
                    listeners.push(listener);
                }
                else {
                    this._listenersMap[type] = [listener];
                }
            }
        };
        EventDispatcher.prototype.removeEventListener = function (type, listener) {
            if (!this._listenersMap || !type || !listener) {
                return;
            }
            var listeners = this._listenersMap[type];
            if (listeners) {
                var length = listeners.length;
                for (var i = 0; i < length; i++) {
                    if (listeners[i] == listener) {
                        if (length == 1) {
                            listeners.length = 0;
                            delete this._listenersMap[type];
                        }
                        else {
                            listeners.splice(i, 1);
                        }
                    }
                }
            }
        };
        EventDispatcher.prototype.removeAllEventListeners = function (type) {
            if (type) {
                delete this._listenersMap[type];
            }
            else {
                this._listenersMap = null;
            }
        };
        EventDispatcher.prototype.dispatchEvent = function (event) {
            if (event) {
                var listeners = this._listenersMap[event.type];
                if (listeners) {
                    event.target = this;
                    var listenersCopy = listeners.concat();
                    var length = listeners.length;
                    for (var i = 0; i < length; i++) {
                        listenersCopy[i](event);
                    }
                }
            }
        };
        return EventDispatcher;
    })();
    dragonBones.EventDispatcher = EventDispatcher;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../events/EventDispatcher.ts"/>
var dragonBones;
(function (dragonBones) {
    var Armature = (function (_super) {
        __extends(Armature, _super);
        /**
         * Creates a Armature blank instance.
         * @param Instance type of this object varies from flash.display.DisplayObject to startling.display.DisplayObject and subclasses.
         * @see #display
         */
        function Armature(display) {
            _super.call(this);
            this._display = display;
            this._animation = new dragonBones.Animation(this);
            this._slotsZOrderChanged = false;
            this._slotList = [];
            this._boneList = [];
            this._eventList = [];
            this._delayDispose = false;
            this._lockDispose = false;
            this._armatureData = null;
        }
        Object.defineProperty(Armature.prototype, "armatureData", {
            /**
             * ArmatureData.
             * @see dragonBones.objects.ArmatureData.
             */
            get: function () {
                return this._armatureData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Armature.prototype, "display", {
            /**
             * Armature's display object. It's instance type depends on render engine. For example "flash.display.DisplayObject" or "startling.display.DisplayObject"
             */
            get: function () {
                return this._display;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Unrecommended API. Please use .display instead.
         * @returns {any}
         */
        Armature.prototype.getDisplay = function () {
            return this._display;
        };
        Object.defineProperty(Armature.prototype, "animation", {
            /**
             * An Animation instance
             * @see dragonBones.animation.Animation
             */
            get: function () {
                return this._animation;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Cleans up any resources used by this instance.
         */
        Armature.prototype.dispose = function () {
            this._delayDispose = true;
            if (!this._animation || this._lockDispose) {
                return;
            }
            this.userData = null;
            this._animation.dispose();
            var i = this._slotList.length;
            while (i--) {
                this._slotList[i].dispose();
            }
            i = this._boneList.length;
            while (i--) {
                this._boneList[i].dispose();
            }
            this._armatureData = null;
            this._animation = null;
            this._slotList = null;
            this._boneList = null;
            this._eventList = null;
            //_display = null;
        };
        /**
         * Force update bones and slots. (When bone's animation play complete, it will not update)
         */
        Armature.prototype.invalidUpdate = function (boneName) {
            if (boneName === void 0) { boneName = null; }
            if (boneName) {
                var bone = this.getBone(boneName);
                if (bone) {
                    bone.invalidUpdate();
                }
            }
            else {
                var i = this._boneList.length;
                while (i--) {
                    this._boneList[i].invalidUpdate();
                }
            }
        };
        /**
         * Update the animation using this method typically in an ENTERFRAME Event or with a Timer.
         * @param The amount of second to move the playhead ahead.
         */
        Armature.prototype.advanceTime = function (passedTime) {
            this._lockDispose = true;
            this._animation._advanceTime(passedTime);
            passedTime *= this._animation.timeScale; //_animation's time scale will impact childArmature
            var isFading = this._animation._isFading;
            var i = this._boneList.length;
            while (i--) {
                var bone = this._boneList[i];
                bone._update(isFading);
            }
            i = this._slotList.length;
            while (i--) {
                var slot = this._slotList[i];
                slot._update();
                if (slot._isShowDisplay) {
                    var childArmature = slot.childArmature;
                    if (childArmature) {
                        childArmature.advanceTime(passedTime);
                    }
                }
            }
            if (this._slotsZOrderChanged) {
                this.updateSlotsZOrder();
                if (this.hasEventListener(dragonBones.ArmatureEvent.Z_ORDER_UPDATED)) {
                    this.dispatchEvent(new dragonBones.ArmatureEvent(dragonBones.ArmatureEvent.Z_ORDER_UPDATED));
                }
            }
            if (this._eventList.length > 0) {
                for (var key in this._eventList) {
                    var event = this._eventList[key];
                    this.dispatchEvent(event);
                }
                this._eventList.length = 0;
            }
            this._lockDispose = false;
            if (this._delayDispose) {
                this.dispose();
            }
        };
        /**
         * Get all Slot instance associated with this armature.
         * @param if return Vector copy
         * @return A Vector.&lt;Slot&gt; instance.
         * @see dragonBones.Slot
         */
        Armature.prototype.getSlots = function (returnCopy) {
            if (returnCopy === void 0) { returnCopy = true; }
            return returnCopy ? this._slotList.concat() : this._slotList;
        };
        /**
         * Retrieves a Slot by name
         * @param The name of the Bone to retrieve.
         * @return A Slot instance or null if no Slot with that name exist.
         * @see dragonBones.Slot
         */
        Armature.prototype.getSlot = function (slotName) {
            var length = this._slotList.length;
            for (var i = 0; i < length; i++) {
                var slot = this._slotList[i];
                if (slot.name == slotName) {
                    return slot;
                }
            }
            return null;
        };
        /**
         * Gets the Slot associated with this DisplayObject.
         * @param Instance type of this object varies from flash.display.DisplayObject to startling.display.DisplayObject and subclasses.
         * @return A Slot instance or null if no Slot with that DisplayObject exist.
         * @see dragonBones.Slot
         */
        Armature.prototype.getSlotByDisplay = function (displayObj) {
            if (displayObj) {
                var length = this._slotList.length;
                for (var i = 0; i < length; i++) {
                    var slot = this._slotList[i];
                    if (slot.display == displayObj) {
                        return slot;
                    }
                }
            }
            return null;
        };
        /**
         * Add a slot to a bone as child.
         * @param slot A Slot instance
         * @param boneName bone name
         * @see dragonBones.core.DBObject
         */
        Armature.prototype.addSlot = function (slot, boneName) {
            var bone = this.getBone(boneName);
            if (bone) {
                bone.addSlot(slot);
            }
            else {
                throw new Error();
            }
        };
        /**
         * Remove a Slot instance from this Armature instance.
         * @param The Slot instance to remove.
         * @see dragonBones.Slot
         */
        Armature.prototype.removeSlot = function (slot) {
            if (!slot || slot.armature != this) {
                throw new Error();
            }
            slot.parent.removeSlot(slot);
        };
        /**
         * Remove a Slot instance from this Armature instance.
         * @param The name of the Slot instance to remove.
         * @see dragonBones.Slot
         */
        Armature.prototype.removeSlotByName = function (slotName) {
            var slot = this.getSlot(slotName);
            if (slot) {
                this.removeSlot(slot);
            }
            return slot;
        };
        /**
         * Get all Bone instance associated with this armature.
         * @param if return Vector copy
         * @return A Vector.&lt;Bone&gt; instance.
         * @see dragonBones.Bone
         */
        Armature.prototype.getBones = function (returnCopy) {
            if (returnCopy === void 0) { returnCopy = true; }
            return returnCopy ? this._boneList.concat() : this._boneList;
        };
        /**
         * Retrieves a Bone by name
         * @param The name of the Bone to retrieve.
         * @return A Bone instance or null if no Bone with that name exist.
         * @see dragonBones.Bone
         */
        Armature.prototype.getBone = function (boneName) {
            var length = this._boneList.length;
            for (var i = 0; i < length; i++) {
                var bone = this._boneList[i];
                if (bone.name == boneName) {
                    return bone;
                }
            }
            return null;
        };
        /**
         * Gets the Bone associated with this DisplayObject.
         * @param Instance type of this object varies from flash.display.DisplayObject to startling.display.DisplayObject and subclasses.
         * @return A Bone instance or null if no Bone with that DisplayObject exist..
         * @see dragonBones.Bone
         */
        Armature.prototype.getBoneByDisplay = function (display) {
            var slot = this.getSlotByDisplay(display);
            return slot ? slot.parent : null;
        };
        /**
         * Add a Bone instance to this Armature instance.
         * @param A Bone instance.
         * @param (optional) The parent's name of this Bone instance.
         * @see dragonBones.Bone
         */
        Armature.prototype.addBone = function (bone, parentName, updateLater) {
            if (parentName === void 0) { parentName = null; }
            if (updateLater === void 0) { updateLater = false; }
            var parentBone;
            if (parentName) {
                parentBone = this.getBone(parentName);
                if (!parentBone) {
                    throw new Error();
                }
            }
            if (parentBone) {
                parentBone.addChildBone(bone, updateLater);
            }
            else {
                if (bone.parent) {
                    bone.parent.removeChildBone(bone, updateLater);
                }
                bone._setArmature(this);
                if (!updateLater) {
                    this._updateAnimationAfterBoneListChanged();
                }
            }
        };
        /**
         * Remove a Bone instance from this Armature instance.
         * @param The Bone instance to remove.
         * @see	dragonBones.Bone
         */
        Armature.prototype.removeBone = function (bone, updateLater) {
            if (updateLater === void 0) { updateLater = false; }
            if (!bone || bone.armature != this) {
                throw new Error();
            }
            if (bone.parent) {
                bone.parent.removeChildBone(bone, updateLater);
            }
            else {
                bone._setArmature(null);
                if (!updateLater) {
                    this._updateAnimationAfterBoneListChanged(false);
                }
            }
        };
        /**
         * Remove a Bone instance from this Armature instance.
         * @param The name of the Bone instance to remove.
         * @see dragonBones.Bone
         */
        Armature.prototype.removeBoneByName = function (boneName) {
            var bone = this.getBone(boneName);
            if (bone) {
                this.removeBone(bone);
            }
            return bone;
        };
        /** @private */
        Armature.prototype._addBoneToBoneList = function (bone) {
            if (this._boneList.indexOf(bone) < 0) {
                this._boneList[this._boneList.length] = bone;
            }
        };
        /** @private */
        Armature.prototype._removeBoneFromBoneList = function (bone) {
            var index = this._boneList.indexOf(bone);
            if (index >= 0) {
                this._boneList.splice(index, 1);
            }
        };
        /** @private */
        Armature.prototype._addSlotToSlotList = function (slot) {
            if (this._slotList.indexOf(slot) < 0) {
                this._slotList[this._slotList.length] = slot;
            }
        };
        /** @private */
        Armature.prototype._removeSlotFromSlotList = function (slot) {
            var index = this._slotList.indexOf(slot);
            if (index >= 0) {
                this._slotList.splice(index, 1);
            }
        };
        /**
         * Sort all slots based on zOrder
         */
        Armature.prototype.updateSlotsZOrder = function () {
            this._slotList.sort(this.sortSlot);
            var i = this._slotList.length;
            while (i--) {
                var slot = this._slotList[i];
                if (slot._isShowDisplay) {
                    //_display 实际上是container, 这个方法就是把原来的显示对象放到container中的第一个
                    slot._addDisplayToContainer(this._display);
                }
            }
            this._slotsZOrderChanged = false;
        };
        Armature.prototype._updateAnimationAfterBoneListChanged = function (ifNeedSortBoneList) {
            if (ifNeedSortBoneList === void 0) { ifNeedSortBoneList = true; }
            if (ifNeedSortBoneList) {
                this.sortBoneList();
            }
            this._animation._updateAnimationStates();
        };
        Armature.prototype.sortBoneList = function () {
            var i = this._boneList.length;
            if (i == 0) {
                return;
            }
            var helpArray = [];
            while (i--) {
                var level = 0;
                var bone = this._boneList[i];
                var boneParent = bone;
                while (boneParent) {
                    level++;
                    boneParent = boneParent.parent;
                }
                helpArray[i] = [level, bone];
            }
            helpArray.sort(dragonBones.ArmatureData.sortBoneDataHelpArrayDescending);
            i = helpArray.length;
            while (i--) {
                this._boneList[i] = helpArray[i][1];
            }
            helpArray.length = 0;
        };
        /** @private When AnimationState enter a key frame, call this func*/
        Armature.prototype._arriveAtFrame = function (frame, timelineState, animationState, isCross) {
            if (frame.event && this.hasEventListener(dragonBones.FrameEvent.ANIMATION_FRAME_EVENT)) {
                var frameEvent = new dragonBones.FrameEvent(dragonBones.FrameEvent.ANIMATION_FRAME_EVENT);
                frameEvent.animationState = animationState;
                frameEvent.frameLabel = frame.event;
                this._eventList.push(frameEvent);
            }
            /*
            if(frame.sound && _soundManager.hasEventListener(SoundEvent.SOUND))
            {
                var soundEvent:SoundEvent = new SoundEvent(SoundEvent.SOUND);
                soundEvent.armature = this;
                soundEvent.animationState = animationState;
                soundEvent.sound = frame.sound;
                _soundManager.dispatchEvent(soundEvent);
            }
            */
            //[TODO]currently there is only gotoAndPlay belongs to frame action. In future, there will be more.  
            //后续会扩展更多的action，目前只有gotoAndPlay的含义
            if (frame.action) {
                if (animationState.displayControl) {
                    this.animation.gotoAndPlay(frame.action);
                }
            }
        };
        Armature.prototype.sortSlot = function (slot1, slot2) {
            return slot1.zOrder < slot2.zOrder ? 1 : -1;
        };
        return Armature;
    })(dragonBones.EventDispatcher);
    dragonBones.Armature = Armature;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var Matrix = (function () {
        function Matrix() {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.tx = 0;
            this.ty = 0;
        }
        Matrix.prototype.invert = function () {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            var tx1 = this.tx;
            var n = a1 * d1 - b1 * c1;
            this.a = d1 / n;
            this.b = -b1 / n;
            this.c = -c1 / n;
            this.d = a1 / n;
            this.tx = (c1 * this.ty - d1 * tx1) / n;
            this.ty = -(a1 * this.ty - b1 * tx1) / n;
        };
        Matrix.prototype.concat = function (m) {
            var ma = m.a;
            var mb = m.b;
            var mc = m.c;
            var md = m.d;
            var tx1 = this.tx;
            var ty1 = this.ty;
            if (ma != 1 || mb != 0 || mc != 0 || md != 1) {
                var a1 = this.a;
                var b1 = this.b;
                var c1 = this.c;
                var d1 = this.d;
                this.a = a1 * ma + b1 * mc;
                this.b = a1 * mb + b1 * md;
                this.c = c1 * ma + d1 * mc;
                this.d = c1 * mb + d1 * md;
            }
            this.tx = tx1 * ma + ty1 * mc + m.tx;
            this.ty = tx1 * mb + ty1 * md + m.ty;
        };
        return Matrix;
    })();
    dragonBones.Matrix = Matrix;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var DBTransform = (function () {
        /**
         * Creat a new DBTransform instance.
         */
        function DBTransform() {
            this.x = 0;
            this.y = 0;
            this.skewX = 0;
            this.skewY = 0;
            this.scaleX = 1;
            this.scaleY = 1;
        }
        Object.defineProperty(DBTransform.prototype, "rotation", {
            /**
             * The rotation of that DBTransform instance.
             */
            get: function () {
                return this.skewX;
            },
            set: function (value) {
                this.skewX = this.skewY = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Copy all properties from this DBTransform instance to the passed DBTransform instance.
         * @param node
         */
        DBTransform.prototype.copy = function (transform) {
            this.x = transform.x;
            this.y = transform.y;
            this.skewX = transform.skewX;
            this.skewY = transform.skewY;
            this.scaleX = transform.scaleX;
            this.scaleY = transform.scaleY;
        };
        /**
         * Get a string representing all DBTransform property values.
         * @return String All property values in a formatted string.
         */
        DBTransform.prototype.toString = function () {
            var string = "x:" + this.x + " y:" + this.y + " skewX:" + this.skewX + " skewY:" + this.skewY + " scaleX:" + this.scaleX + " scaleY:" + this.scaleY;
            return string;
        };
        return DBTransform;
    })();
    dragonBones.DBTransform = DBTransform;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/// <reference path="../geom/Matrix.ts"/>
/// <reference path="../model/DBTransform.ts"/>
var dragonBones;
(function (dragonBones) {
    var DBObject = (function () {
        function DBObject() {
            this._globalTransformMatrix = new dragonBones.Matrix();
            this._global = new dragonBones.DBTransform();
            this._origin = new dragonBones.DBTransform();
            this._offset = new dragonBones.DBTransform();
            this._offset.scaleX = this._offset.scaleY = 1;
            this._visible = true;
            this._armature = null;
            this._parent = null;
            this.userData = null;
            this.inheritRotation = true;
            this.inheritScale = true;
            this.inheritTranslation = true;
        }
        Object.defineProperty(DBObject.prototype, "global", {
            /**
             * This DBObject instance global transform instance.
             * @see dragonBones.objects.DBTransform
             */
            get: function () {
                return this._global;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DBObject.prototype, "origin", {
            /**
             * This DBObject instance related to parent transform instance.
             * @see dragonBones.objects.DBTransform
             */
            get: function () {
                return this._origin;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DBObject.prototype, "offset", {
            /**
             * This DBObject instance offset transform instance (For manually control).
             * @see dragonBones.objects.DBTransform
             */
            get: function () {
                return this._offset;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DBObject.prototype, "armature", {
            /**
             * The armature this DBObject instance belongs to.
             */
            get: function () {
                return this._armature;
            },
            enumerable: true,
            configurable: true
        });
        /** @private */
        DBObject.prototype._setArmature = function (value) {
            this._armature = value;
        };
        Object.defineProperty(DBObject.prototype, "parent", {
            /**
             * Indicates the Bone instance that directly contains this DBObject instance if any.
             */
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        /** @private */
        DBObject.prototype._setParent = function (value) {
            this._parent = value;
        };
        /**
         * Cleans up any resources used by this DBObject instance.
         */
        DBObject.prototype.dispose = function () {
            this.userData = null;
            this._globalTransformMatrix = null;
            this._global = null;
            this._origin = null;
            this._offset = null;
            this._armature = null;
            this._parent = null;
        };
        DBObject.prototype._calculateRelativeParentTransform = function () {
        };
        DBObject.prototype._calculateParentTransform = function () {
            if (this.parent && (this.inheritTranslation || this.inheritRotation || this.inheritScale)) {
                var parentGlobalTransform = this._parent._globalTransformForChild;
                var parentGlobalTransformMatrix = this._parent._globalTransformMatrixForChild;
                if (!this.inheritTranslation || !this.inheritRotation || !this.inheritScale) {
                    parentGlobalTransform = DBObject._tempParentGlobalTransform;
                    parentGlobalTransform.copy(this._parent._globalTransformForChild);
                    if (!this.inheritTranslation) {
                        parentGlobalTransform.x = 0;
                        parentGlobalTransform.y = 0;
                    }
                    if (!this.inheritScale) {
                        parentGlobalTransform.scaleX = 1;
                        parentGlobalTransform.scaleY = 1;
                    }
                    if (!this.inheritRotation) {
                        parentGlobalTransform.skewX = 0;
                        parentGlobalTransform.skewY = 0;
                    }
                    parentGlobalTransformMatrix = DBObject._tempParentGlobalTransformMatrix;
                    dragonBones.TransformUtil.transformToMatrix(parentGlobalTransform, parentGlobalTransformMatrix, true);
                }
                return { parentGlobalTransform: parentGlobalTransform, parentGlobalTransformMatrix: parentGlobalTransformMatrix };
            }
            return null;
        };
        DBObject.prototype._updateGlobal = function () {
            this._calculateRelativeParentTransform();
            dragonBones.TransformUtil.transformToMatrix(this._global, this._globalTransformMatrix, true);
            var output = this._calculateParentTransform();
            if (output) {
                this._globalTransformMatrix.concat(output.parentGlobalTransformMatrix);
                dragonBones.TransformUtil.matrixToTransform(this._globalTransformMatrix, this._global, this._global.scaleX * output.parentGlobalTransform.scaleX >= 0, this._global.scaleY * output.parentGlobalTransform.scaleY >= 0);
            }
            return output;
        };
        DBObject._tempParentGlobalTransformMatrix = new dragonBones.Matrix();
        DBObject._tempParentGlobalTransform = new dragonBones.DBTransform();
        return DBObject;
    })();
    dragonBones.DBObject = DBObject;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/// <reference path="DBObject.ts"/>
var dragonBones;
(function (dragonBones) {
    var Bone = (function (_super) {
        __extends(Bone, _super);
        function Bone() {
            _super.call(this);
            this.applyOffsetTranslationToChild = true;
            this.applyOffsetRotationToChild = true;
            this.applyOffsetScaleToChild = false;
            /** @private */
            this._needUpdate = 0;
            this._tween = new dragonBones.DBTransform();
            this._tweenPivot = new dragonBones.Point();
            this._tween.scaleX = this._tween.scaleY = 1;
            this._boneList = [];
            this._slotList = [];
            this._timelineStateList = [];
            this._needUpdate = 2;
            this._isColorChanged = false;
        }
        Bone.initWithBoneData = function (boneData) {
            var outputBone = new Bone();
            outputBone.name = boneData.name;
            outputBone.inheritRotation = boneData.inheritRotation;
            outputBone.inheritScale = boneData.inheritScale;
            outputBone.origin.copy(boneData.transform);
            return outputBone;
        };
        /**
         * @inheritDoc
         */
        Bone.prototype.dispose = function () {
            if (!this._boneList) {
                return;
            }
            _super.prototype.dispose.call(this);
            var i = this._boneList.length;
            while (i--) {
                this._boneList[i].dispose();
            }
            i = this._slotList.length;
            while (i--) {
                this._slotList[i].dispose();
            }
            this._tween = null;
            this._tweenPivot = null;
            this._boneList = null;
            this._slotList = null;
            this._timelineStateList = null;
        };
        //骨架装配
        /**
         * If contains some bone or slot
         * @param Slot or Bone instance
         * @return Boolean
         * @see dragonBones.core.DBObject
         */
        Bone.prototype.contains = function (child) {
            if (!child) {
                throw new Error();
            }
            if (child == this) {
                return false;
            }
            var ancestor = child;
            while (!(ancestor == this || ancestor == null)) {
                ancestor = ancestor.parent;
            }
            return ancestor == this;
        };
        Bone.prototype.addChildBone = function (childBone, updateLater) {
            if (updateLater === void 0) { updateLater = false; }
            if (!childBone) {
                throw new Error();
            }
            if (childBone == this || childBone.contains(this)) {
                throw new Error("An Bone cannot be added as a child to itself or one of its children (or children's children, etc.)");
            }
            if (childBone.parent == this) {
                return;
            }
            if (childBone.parent) {
                childBone.parent.removeChildBone(childBone, updateLater);
            }
            this._boneList[this._boneList.length] = childBone;
            childBone._setParent(this);
            childBone._setArmature(this._armature);
            if (this._armature && !updateLater) {
                this._armature._updateAnimationAfterBoneListChanged();
            }
        };
        Bone.prototype.removeChildBone = function (childBone, updateLater) {
            if (updateLater === void 0) { updateLater = false; }
            if (!childBone) {
                throw new Error();
            }
            var index = this._boneList.indexOf(childBone);
            if (index < 0) {
                throw new Error();
            }
            this._boneList.splice(index, 1);
            childBone._setParent(null);
            childBone._setArmature(null);
            if (this._armature && !updateLater) {
                this._armature._updateAnimationAfterBoneListChanged(false);
            }
        };
        Bone.prototype.addSlot = function (childSlot) {
            if (!childSlot) {
                throw new Error();
            }
            if (childSlot.parent) {
                childSlot.parent.removeSlot(childSlot);
            }
            this._slotList[this._slotList.length] = childSlot;
            childSlot._setParent(this);
            childSlot.setArmature(this._armature);
        };
        Bone.prototype.removeSlot = function (childSlot) {
            if (!childSlot) {
                throw new Error();
            }
            var index = this._slotList.indexOf(childSlot);
            if (index < 0) {
                throw new Error();
            }
            this._slotList.splice(index, 1);
            childSlot._setParent(null);
            childSlot.setArmature(null);
        };
        /** @private */
        Bone.prototype._setArmature = function (value) {
            if (this._armature == value) {
                return;
            }
            if (this._armature) {
                this._armature._removeBoneFromBoneList(this);
                this._armature._updateAnimationAfterBoneListChanged(false);
            }
            this._armature = value;
            if (this._armature) {
                this._armature._addBoneToBoneList(this);
            }
            var i = this._boneList.length;
            while (i--) {
                this._boneList[i]._setArmature(this._armature);
            }
            i = this._slotList.length;
            while (i--) {
                this._slotList[i].setArmature(this._armature);
            }
        };
        /**
         * Get all Bone instance associated with this bone.
         * @return A Vector.&lt;Slot&gt; instance.
         * @see dragonBones.Slot
         */
        Bone.prototype.getBones = function (returnCopy) {
            if (returnCopy === void 0) { returnCopy = true; }
            return returnCopy ? this._boneList.concat() : this._boneList;
        };
        /**
         * Get all Slot instance associated with this bone.
         * @return A Vector.&lt;Slot&gt; instance.
         * @see dragonBones.Slot
         */
        Bone.prototype.getSlots = function (returnCopy) {
            if (returnCopy === void 0) { returnCopy = true; }
            return returnCopy ? this._slotList.concat() : this._slotList;
        };
        //动画
        /**
         * Force update the bone in next frame even if the bone is not moving.
         */
        Bone.prototype.invalidUpdate = function () {
            this._needUpdate = 2;
        };
        Bone.prototype._calculateRelativeParentTransform = function () {
            this._global.scaleX = this._origin.scaleX * this._tween.scaleX * this._offset.scaleX;
            this._global.scaleY = this._origin.scaleY * this._tween.scaleY * this._offset.scaleY;
            this._global.skewX = this._origin.skewX + this._tween.skewX + this._offset.skewX;
            this._global.skewY = this._origin.skewY + this._tween.skewY + this._offset.skewY;
            this._global.x = this._origin.x + this._tween.x + this._offset.x;
            this._global.y = this._origin.y + this._tween.y + this._offset.y;
        };
        /** @private */
        Bone.prototype._update = function (needUpdate) {
            if (needUpdate === void 0) { needUpdate = false; }
            this._needUpdate--;
            if (needUpdate || this._needUpdate > 0 || (this._parent && this._parent._needUpdate > 0)) {
                this._needUpdate = 1;
            }
            else {
                return;
            }
            this.blendingTimeline();
            //计算global
            var result = this._updateGlobal();
            var parentGlobalTransform = result ? result.parentGlobalTransform : null;
            var parentGlobalTransformMatrix = result ? result.parentGlobalTransformMatrix : null;
            //计算globalForChild
            var ifExistOffsetTranslation = this._offset.x != 0 || this._offset.y != 0;
            var ifExistOffsetScale = this._offset.scaleX != 0 || this._offset.scaleY != 0;
            var ifExistOffsetRotation = this._offset.skewX != 0 || this._offset.skewY != 0;
            if ((!ifExistOffsetTranslation || this.applyOffsetTranslationToChild) && (!ifExistOffsetScale || this.applyOffsetScaleToChild) && (!ifExistOffsetRotation || this.applyOffsetRotationToChild)) {
                this._globalTransformForChild = this._global;
                this._globalTransformMatrixForChild = this._globalTransformMatrix;
            }
            else {
                if (!this._tempGlobalTransformForChild) {
                    this._tempGlobalTransformForChild = new dragonBones.DBTransform();
                }
                this._globalTransformForChild = this._tempGlobalTransformForChild;
                if (!this._tempGlobalTransformMatrixForChild) {
                    this._tempGlobalTransformMatrixForChild = new dragonBones.Matrix();
                }
                this._globalTransformMatrixForChild = this._tempGlobalTransformMatrixForChild;
                this._globalTransformForChild.x = this._origin.x + this._tween.x;
                this._globalTransformForChild.y = this._origin.y + this._tween.y;
                this._globalTransformForChild.scaleX = this._origin.scaleX * this._tween.scaleX;
                this._globalTransformForChild.scaleY = this._origin.scaleY * this._tween.scaleY;
                this._globalTransformForChild.skewX = this._origin.skewX + this._tween.skewX;
                this._globalTransformForChild.skewY = this._origin.skewY + this._tween.skewY;
                if (this.applyOffsetTranslationToChild) {
                    this._globalTransformForChild.x += this._offset.x;
                    this._globalTransformForChild.y += this._offset.y;
                }
                if (this.applyOffsetScaleToChild) {
                    this._globalTransformForChild.scaleX *= this._offset.scaleX;
                    this._globalTransformForChild.scaleY *= this._offset.scaleY;
                }
                if (this.applyOffsetRotationToChild) {
                    this._globalTransformForChild.skewX += this._offset.skewX;
                    this._globalTransformForChild.skewY += this._offset.skewY;
                }
                dragonBones.TransformUtil.transformToMatrix(this._globalTransformForChild, this._globalTransformMatrixForChild, true);
                if (parentGlobalTransformMatrix) {
                    this._globalTransformMatrixForChild.concat(parentGlobalTransformMatrix);
                    dragonBones.TransformUtil.matrixToTransform(this._globalTransformMatrixForChild, this._globalTransformForChild, this._globalTransformForChild.scaleX * parentGlobalTransform.scaleX >= 0, this._globalTransformForChild.scaleY * parentGlobalTransform.scaleY >= 0);
                }
            }
        };
        /** @private */
        Bone.prototype._updateColor = function (aOffset, rOffset, gOffset, bOffset, aMultiplier, rMultiplier, gMultiplier, bMultiplier, colorChanged) {
            var length = this._slotList.length;
            for (var i = 0; i < length; i++) {
                var childSlot = this._slotList[i];
                childSlot._updateDisplayColor(aOffset, rOffset, gOffset, bOffset, aMultiplier, rMultiplier, gMultiplier, bMultiplier);
            }
            this._isColorChanged = colorChanged;
        };
        /** @private */
        Bone.prototype._hideSlots = function () {
            var length = this._slotList.length;
            for (var i = 0; i < length; i++) {
                var childSlot = this._slotList[i];
                childSlot._changeDisplay(-1);
            }
        };
        /** @private When bone timeline enter a key frame, call this func*/
        Bone.prototype._arriveAtFrame = function (frame, timelineState, animationState, isCross) {
            var displayControl = animationState.displayControl && (!this.displayController || this.displayController == animationState.name) && animationState.containsBoneMask(this.name);
            if (displayControl) {
                var tansformFrame = frame;
                var displayIndex = tansformFrame.displayIndex;
                var childSlot;
                var length = this._slotList.length;
                for (var i = 0; i < length; i++) {
                    childSlot = this._slotList[i];
                    childSlot._changeDisplay(displayIndex);
                    childSlot._updateDisplayVisible(tansformFrame.visible);
                    if (displayIndex >= 0) {
                        if (!isNaN(tansformFrame.zOrder) && tansformFrame.zOrder != childSlot._tweenZOrder) {
                            childSlot._tweenZOrder = tansformFrame.zOrder;
                            this._armature._slotsZOrderChanged = true;
                        }
                    }
                }
                if (frame.event && this._armature.hasEventListener(dragonBones.FrameEvent.BONE_FRAME_EVENT)) {
                    var frameEvent = new dragonBones.FrameEvent(dragonBones.FrameEvent.BONE_FRAME_EVENT);
                    frameEvent.bone = this;
                    frameEvent.animationState = animationState;
                    frameEvent.frameLabel = frame.event;
                    this._armature._eventList.push(frameEvent);
                }
                /*
                if(frame.sound && _soundManager.hasEventListener(SoundEvent.SOUND))
                {
                    var soundEvent:SoundEvent = new SoundEvent(SoundEvent.SOUND);
                    soundEvent.armature = this._armature;
                    soundEvent.animationState = animationState;
                    soundEvent.sound = frame.sound;
                    _soundManager.dispatchEvent(soundEvent);
                }
                */
                //[TODO]currently there is only gotoAndPlay belongs to frame action. In future, there will be more.  
                //后续会扩展更多的action，目前只有gotoAndPlay的含义
                if (frame.action) {
                    var length1 = this._slotList.length;
                    for (var i1 = 0; i1 < length1; i1++) {
                        childSlot = this._slotList[i1];
                        var childArmature = childSlot.childArmature;
                        if (childArmature) {
                            childArmature.animation.gotoAndPlay(frame.action);
                        }
                    }
                }
            }
        };
        /** @private */
        Bone.prototype._addState = function (timelineState) {
            if (this._timelineStateList.indexOf(timelineState) < 0) {
                this._timelineStateList.push(timelineState);
                this._timelineStateList.sort(this.sortState);
            }
        };
        /** @private */
        Bone.prototype._removeState = function (timelineState) {
            var index = this._timelineStateList.indexOf(timelineState);
            if (index >= 0) {
                this._timelineStateList.splice(index, 1);
            }
        };
        Bone.prototype.blendingTimeline = function () {
            var timelineState;
            var transform;
            var pivot;
            var weight;
            var i = this._timelineStateList.length;
            if (i == 1) {
                timelineState = this._timelineStateList[0];
                weight = timelineState._animationState.weight * timelineState._animationState.fadeWeight;
                timelineState._weight = weight;
                transform = timelineState._transform;
                pivot = timelineState._pivot;
                this._tween.x = transform.x * weight;
                this._tween.y = transform.y * weight;
                this._tween.skewX = transform.skewX * weight;
                this._tween.skewY = transform.skewY * weight;
                this._tween.scaleX = 1 + (transform.scaleX - 1) * weight;
                this._tween.scaleY = 1 + (transform.scaleY - 1) * weight;
                this._tweenPivot.x = pivot.x * weight;
                this._tweenPivot.y = pivot.y * weight;
            }
            else if (i > 1) {
                var x = 0;
                var y = 0;
                var skewX = 0;
                var skewY = 0;
                var scaleX = 0;
                var scaleY = 0;
                var pivotX = 0;
                var pivotY = 0;
                var weigthLeft = 1;
                var layerTotalWeight = 0;
                var prevLayer = this._timelineStateList[i - 1]._animationState.layer;
                var currentLayer = 0;
                while (i--) {
                    timelineState = this._timelineStateList[i];
                    currentLayer = timelineState._animationState.layer;
                    if (prevLayer != currentLayer) {
                        if (layerTotalWeight >= weigthLeft) {
                            timelineState._weight = 0;
                            break;
                        }
                        else {
                            weigthLeft -= layerTotalWeight;
                        }
                    }
                    prevLayer = currentLayer;
                    weight = timelineState._animationState.weight * timelineState._animationState.fadeWeight * weigthLeft;
                    timelineState._weight = weight;
                    if (weight && timelineState._blendEnabled) {
                        transform = timelineState._transform;
                        pivot = timelineState._pivot;
                        x += transform.x * weight;
                        y += transform.y * weight;
                        skewX += transform.skewX * weight;
                        skewY += transform.skewY * weight;
                        scaleX += (transform.scaleX - 1) * weight;
                        scaleY += (transform.scaleY - 1) * weight;
                        pivotX += pivot.x * weight;
                        pivotY += pivot.y * weight;
                        layerTotalWeight += weight;
                    }
                }
                this._tween.x = x;
                this._tween.y = y;
                this._tween.skewX = skewX;
                this._tween.skewY = skewY;
                this._tween.scaleX = scaleX;
                this._tween.scaleY = scaleY;
                this._tweenPivot.x = pivotX;
                this._tweenPivot.y = pivotY;
            }
        };
        Bone.prototype.sortState = function (state1, state2) {
            return state1._animationState.layer < state2._animationState.layer ? -1 : 1;
        };
        Object.defineProperty(Bone.prototype, "childArmature", {
            /**
             * Unrecommended API. Recommend use slot.childArmature.
             */
            get: function () {
                if (this.slot) {
                    return this.slot.childArmature;
                }
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Bone.prototype, "display", {
            /**
             * Unrecommended API. Recommend use slot.display.
             */
            get: function () {
                if (this.slot) {
                    return this.slot.display;
                }
                return null;
            },
            set: function (value) {
                if (this.slot) {
                    this.slot.display = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Bone.prototype, "node", {
            /**
             * Unrecommended API. Recommend use offset.
             */
            get: function () {
                return this._offset;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Bone.prototype, "visible", {
            /** @private */
            set: function (value) {
                if (this._visible != value) {
                    this._visible = value;
                    var length = this._slotList.length;
                    for (var i = 0; i < length; i++) {
                        var childSlot = this._slotList[i];
                        childSlot._updateDisplayVisible(this._visible);
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Bone.prototype, "slot", {
            get: function () {
                return this._slotList.length > 0 ? this._slotList[0] : null;
            },
            enumerable: true,
            configurable: true
        });
        return Bone;
    })(dragonBones.DBObject);
    dragonBones.Bone = Bone;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/// <reference path="DBObject.ts"/>
var dragonBones;
(function (dragonBones) {
    var Slot = (function (_super) {
        __extends(Slot, _super);
        function Slot(self) {
            _super.call(this);
            this._currentDisplayIndex = 0;
            if (self != this) {
                throw new Error("Abstract class can not be instantiated!");
            }
            this._displayList = [];
            this._currentDisplayIndex = -1;
            this._originZOrder = 0;
            this._tweenZOrder = 0;
            this._offsetZOrder = 0;
            this._isShowDisplay = false;
            this._colorTransform = new dragonBones.ColorTransform();
            this._displayDataList = null;
            //_childArmature = null;
            this._currentDisplay = null;
            this.inheritRotation = true;
            this.inheritScale = true;
        }
        Slot.prototype.initWithSlotData = function (slotData) {
            this.name = slotData.name;
            this.blendMode = slotData.blendMode;
            this._originZOrder = slotData.zOrder;
            this._displayDataList = slotData.displayDataList;
        };
        /**
         * @inheritDoc
         */
        Slot.prototype.dispose = function () {
            if (!this._displayList) {
                return;
            }
            _super.prototype.dispose.call(this);
            this._displayList.length = 0;
            this._displayDataList = null;
            this._displayList = null;
            this._currentDisplay = null;
            //_childArmature = null;
        };
        //骨架装配
        /** @private */
        Slot.prototype.setArmature = function (value) {
            if (this._armature == value) {
                return;
            }
            if (this._armature) {
                this._armature._removeSlotFromSlotList(this);
            }
            this._armature = value;
            if (this._armature) {
                this._armature._addSlotToSlotList(this);
                this._armature._slotsZOrderChanged = true;
                this._addDisplayToContainer(this._armature.display);
            }
            else {
                this._removeDisplayFromContainer();
            }
        };
        //动画
        /** @private */
        Slot.prototype._update = function () {
            if (this._parent._needUpdate <= 0) {
                return;
            }
            this._updateGlobal();
            this._updateTransform();
        };
        Slot.prototype._calculateRelativeParentTransform = function () {
            this._global.scaleX = this._origin.scaleX * this._offset.scaleX;
            this._global.scaleY = this._origin.scaleY * this._offset.scaleY;
            this._global.skewX = this._origin.skewX + this._offset.skewX;
            this._global.skewY = this._origin.skewY + this._offset.skewY;
            this._global.x = this._origin.x + this._offset.x + this._parent._tweenPivot.x;
            this._global.y = this._origin.y + this._offset.y + this._parent._tweenPivot.y;
        };
        Slot.prototype.updateChildArmatureAnimation = function () {
            if (this.childArmature) {
                if (this._isShowDisplay) {
                    if (this._armature && this._armature.animation.lastAnimationState && this.childArmature.animation.hasAnimation(this._armature.animation.lastAnimationState.name)) {
                        this.childArmature.animation.gotoAndPlay(this._armature.animation.lastAnimationState.name);
                    }
                    else {
                        this.childArmature.animation.play();
                    }
                }
                else {
                    this.childArmature.animation.stop();
                    this.childArmature.animation._lastAnimationState = null;
                }
            }
        };
        /** @private */
        Slot.prototype._changeDisplay = function (displayIndex) {
            if (displayIndex === void 0) { displayIndex = 0; }
            if (displayIndex < 0) {
                if (this._isShowDisplay) {
                    this._isShowDisplay = false;
                    this._removeDisplayFromContainer();
                    this.updateChildArmatureAnimation();
                }
            }
            else if (this._displayList.length > 0) {
                var length = this._displayList.length;
                if (displayIndex >= length) {
                    displayIndex = length - 1;
                }
                if (this._currentDisplayIndex != displayIndex) {
                    this._isShowDisplay = true;
                    this._currentDisplayIndex = displayIndex;
                    this._updateSlotDisplay();
                    this.updateChildArmatureAnimation();
                    if (this._displayDataList && this._displayDataList.length > 0 && this._currentDisplayIndex < this._displayDataList.length) {
                        this._origin.copy(this._displayDataList[this._currentDisplayIndex].transform);
                    }
                }
                else if (!this._isShowDisplay) {
                    this._isShowDisplay = true;
                    if (this._armature) {
                        this._armature._slotsZOrderChanged = true;
                        this._addDisplayToContainer(this._armature.display);
                    }
                    this.updateChildArmatureAnimation();
                }
            }
        };
        /** @private
         * Updates the display of the slot.
         */
        Slot.prototype._updateSlotDisplay = function () {
            var currentDisplayIndex = -1;
            if (this._currentDisplay) {
                currentDisplayIndex = this._getDisplayIndex();
                this._removeDisplayFromContainer();
            }
            var displayObj = this._displayList[this._currentDisplayIndex];
            if (displayObj) {
                if (displayObj instanceof dragonBones.Armature) {
                    //_childArmature = display as Armature;
                    this._currentDisplay = displayObj.display;
                }
                else {
                    //_childArmature = null;
                    this._currentDisplay = displayObj;
                }
            }
            else {
                this._currentDisplay = null;
            }
            this._updateDisplay(this._currentDisplay);
            if (this._currentDisplay) {
                if (this._armature && this._isShowDisplay) {
                    if (currentDisplayIndex < 0) {
                        this._armature._slotsZOrderChanged = true;
                        this._addDisplayToContainer(this._armature.display);
                    }
                    else {
                        this._addDisplayToContainer(this._armature.display, currentDisplayIndex);
                    }
                }
                this._updateDisplayBlendMode(this._blendMode);
                this._updateDisplayColor(this._colorTransform.alphaOffset, this._colorTransform.redOffset, this._colorTransform.greenOffset, this._colorTransform.blueOffset, this._colorTransform.alphaMultiplier, this._colorTransform.redMultiplier, this._colorTransform.greenMultiplier, this._colorTransform.blueMultiplier);
                this._updateDisplayVisible(this._visible);
            }
        };
        Object.defineProperty(Slot.prototype, "visible", {
            /** @private */
            set: function (value) {
                if (this._visible != value) {
                    this._visible = value;
                    this._updateDisplayVisible(this._visible);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Slot.prototype, "displayList", {
            /**
             * The DisplayObject list belonging to this Slot instance (display or armature). Replace it to implement switch texture.
             */
            get: function () {
                return this._displayList;
            },
            set: function (value) {
                if (!value) {
                    throw new Error();
                }
                //为什么要修改_currentDisplayIndex?
                if (this._currentDisplayIndex < 0) {
                    this._currentDisplayIndex = 0;
                }
                var i = this._displayList.length = value.length;
                while (i--) {
                    this._displayList[i] = value[i];
                }
                //在index不改变的情况下强制刷新 TO DO需要修改
                var displayIndexBackup = this._currentDisplayIndex;
                this._currentDisplayIndex = -1;
                this._changeDisplay(displayIndexBackup);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Slot.prototype, "display", {
            /**
             * The DisplayObject belonging to this Slot instance. Instance type of this object varies from flash.display.DisplayObject to startling.display.DisplayObject and subclasses.
             */
            get: function () {
                return this._currentDisplay;
            },
            set: function (value) {
                if (this._currentDisplayIndex < 0) {
                    this._currentDisplayIndex = 0;
                }
                if (this._displayList[this._currentDisplayIndex] == value) {
                    return;
                }
                this._displayList[this._currentDisplayIndex] = value;
                this._updateSlotDisplay();
                this.updateChildArmatureAnimation();
                this._updateTransform(); //是否可以延迟更新？
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Unrecommended API. Please use .display instead.
         * @returns {any}
         */
        Slot.prototype.getDisplay = function () {
            return this.display;
        };
        /**
         * Unrecommended API. Please use .display = instead.
         * @returns {any}
         */
        Slot.prototype.setDisplay = function (value) {
            this.display = value;
        };
        Object.defineProperty(Slot.prototype, "childArmature", {
            /**
             * The sub-armature of this Slot instance.
             */
            get: function () {
                if (this._displayList[this._currentDisplayIndex] instanceof dragonBones.Armature) {
                    return (this._displayList[this._currentDisplayIndex]);
                }
                return null;
            },
            set: function (value) {
                //设计的不好，要修改
                this.display = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Slot.prototype, "zOrder", {
            /**
             * zOrder. Support decimal for ensure dynamically added slot work toghther with animation controled slot.
             * @return zOrder.
             */
            get: function () {
                return this._originZOrder + this._tweenZOrder + this._offsetZOrder;
            },
            set: function (value) {
                if (this.zOrder != value) {
                    this._offsetZOrder = value - this._originZOrder - this._tweenZOrder;
                    if (this._armature) {
                        this._armature._slotsZOrderChanged = true;
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Slot.prototype, "blendMode", {
            /**
             * blendMode
             * @return blendMode.
             */
            get: function () {
                return this._blendMode;
            },
            set: function (value) {
                if (this._blendMode != value) {
                    this._blendMode = value;
                    this._updateDisplayBlendMode(this._blendMode);
                }
            },
            enumerable: true,
            configurable: true
        });
        //Abstract method
        /**
         * @private
         */
        Slot.prototype._updateDisplay = function (value) {
            throw new Error("Abstract method needs to be implemented in subclass!");
        };
        /**
         * @private
         */
        Slot.prototype._getDisplayIndex = function () {
            throw new Error("Abstract method needs to be implemented in subclass!");
        };
        /**
         * @private
         * Adds the original display object to another display object.
         * @param container
         * @param index
         */
        Slot.prototype._addDisplayToContainer = function (container, index) {
            if (index === void 0) { index = -1; }
            throw new Error("Abstract method needs to be implemented in subclass!");
        };
        /**
         * @private
         * remove the original display object from its parent.
         */
        Slot.prototype._removeDisplayFromContainer = function () {
            throw new Error("Abstract method needs to be implemented in subclass!");
        };
        /**
         * @private
         * Updates the transform of the slot.
         */
        Slot.prototype._updateTransform = function () {
            throw new Error("Abstract method needs to be implemented in subclass!");
        };
        /**
         * @private
         */
        Slot.prototype._updateDisplayVisible = function (value) {
            throw new Error("Abstract method needs to be implemented in subclass!");
        };
        /**
         * @private
         * Updates the color of the display object.
         * @param a
         * @param r
         * @param g
         * @param b
         * @param aM
         * @param rM
         * @param gM
         * @param bM
         */
        Slot.prototype._updateDisplayColor = function (aOffset, rOffset, gOffset, bOffset, aMultiplier, rMultiplier, gMultiplier, bMultiplier) {
            this._colorTransform.alphaOffset = aOffset;
            this._colorTransform.redOffset = rOffset;
            this._colorTransform.greenOffset = gOffset;
            this._colorTransform.blueOffset = bOffset;
            this._colorTransform.alphaMultiplier = aMultiplier;
            this._colorTransform.redMultiplier = rMultiplier;
            this._colorTransform.greenMultiplier = gMultiplier;
            this._colorTransform.blueMultiplier = bMultiplier;
        };
        /**
         * @private
         * Update the blend mode of the display object.
         * @param value The blend mode to use.
         */
        Slot.prototype._updateDisplayBlendMode = function (value) {
            throw new Error("Abstract method needs to be implemented in subclass!");
        };
        return Slot;
    })(dragonBones.DBObject);
    dragonBones.Slot = Slot;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var DragonBones = (function () {
        function DragonBones() {
        }
        DragonBones.DATA_VERSION = "2.3";
        DragonBones.PARENT_COORDINATE_DATA_VERSION = "3.0";
        return DragonBones;
    })();
    dragonBones.DragonBones = DragonBones;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var Event = (function () {
        function Event(type) {
            this.type = type;
        }
        return Event;
    })();
    dragonBones.Event = Event;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/// <reference path="Event.ts"/>
var dragonBones;
(function (dragonBones) {
    var AnimationEvent = (function (_super) {
        __extends(AnimationEvent, _super);
        /**
         * Creates a new AnimationEvent instance.
         * @param type
         * @param cancelable
         */
        function AnimationEvent(type, cancelable) {
            if (cancelable === void 0) { cancelable = false; }
            _super.call(this, type);
        }
        Object.defineProperty(AnimationEvent, "MOVEMENT_CHANGE", {
            /**
             * 不推荐使用.
             */
            get: function () {
                return AnimationEvent.FADE_IN;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationEvent.prototype, "movementID", {
            /**
             * 不推荐的API.
             */
            get: function () {
                return this.animationName;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationEvent.prototype, "armature", {
            /**
             * The armature that is the taget of this event.
             */
            get: function () {
                return (this.target);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationEvent.prototype, "animationName", {
            get: function () {
                return this.animationState.name;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Dispatched when the playback of an animation fade in.
         */
        AnimationEvent.FADE_IN = "fadeIn";
        /**
         * Dispatched when the playback of an animation fade out.
         */
        AnimationEvent.FADE_OUT = "fadeOut";
        /**
         * Dispatched when the playback of an animation starts.
         */
        AnimationEvent.START = "start";
        /**
         * Dispatched when the playback of a animation stops.
         */
        AnimationEvent.COMPLETE = "complete";
        /**
         * Dispatched when the playback of a animation completes a loop.
         */
        AnimationEvent.LOOP_COMPLETE = "loopComplete";
        /**
         * Dispatched when the playback of an animation fade in complete.
         */
        AnimationEvent.FADE_IN_COMPLETE = "fadeInComplete";
        /**
         * Dispatched when the playback of an animation fade out complete.
         */
        AnimationEvent.FADE_OUT_COMPLETE = "fadeOutComplete";
        return AnimationEvent;
    })(dragonBones.Event);
    dragonBones.AnimationEvent = AnimationEvent;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/// <reference path="Event.ts"/>
var dragonBones;
(function (dragonBones) {
    var ArmatureEvent = (function (_super) {
        __extends(ArmatureEvent, _super);
        function ArmatureEvent(type) {
            _super.call(this, type);
        }
        /**
         * Dispatched after a successful z order update.
         */
        ArmatureEvent.Z_ORDER_UPDATED = "zOrderUpdated";
        return ArmatureEvent;
    })(dragonBones.Event);
    dragonBones.ArmatureEvent = ArmatureEvent;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/// <reference path="Event.ts"/>
var dragonBones;
(function (dragonBones) {
    var FrameEvent = (function (_super) {
        __extends(FrameEvent, _super);
        /**
         * Creates a new FrameEvent instance.
         * @param type
         * @param cancelable
         */
        function FrameEvent(type, cancelable) {
            if (cancelable === void 0) { cancelable = false; }
            _super.call(this, type);
        }
        Object.defineProperty(FrameEvent, "MOVEMENT_FRAME_EVENT", {
            get: function () {
                return FrameEvent.ANIMATION_FRAME_EVENT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FrameEvent.prototype, "armature", {
            /**
             * The armature that is the target of this event.
             */
            get: function () {
                return (this.target);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Dispatched when the animation of the armatrue enter a frame.
         */
        FrameEvent.ANIMATION_FRAME_EVENT = "animationFrameEvent";
        /**
         *
         */
        FrameEvent.BONE_FRAME_EVENT = "boneFrameEvent";
        return FrameEvent;
    })(dragonBones.Event);
    dragonBones.FrameEvent = FrameEvent;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/// <reference path="../events/EventDispatcher.ts"/>
var dragonBones;
(function (dragonBones) {
    var BaseFactory = (function (_super) {
        __extends(BaseFactory, _super);
        function BaseFactory(self) {
            _super.call(this);
            /** @private */
            this.dragonBonesDataDic = {};
            /** @private */
            this.textureAtlasDic = {};
            if (self != this) {
                throw new Error("Abstract class can not be instantiated!");
            }
        }
        /**
         * Cleans up resources used by this BaseFactory instance.
         * @param (optional) Destroy all internal references.
         */
        BaseFactory.prototype.dispose = function (disposeData) {
            if (disposeData === void 0) { disposeData = true; }
            if (disposeData) {
                for (var skeletonName in this.dragonBonesDataDic) {
                    (this.dragonBonesDataDic[skeletonName]).dispose();
                    delete this.dragonBonesDataDic[skeletonName];
                }
                for (var textureAtlasName in this.textureAtlasDic) {
                    (this.textureAtlasDic[textureAtlasName]).dispose();
                    delete this.textureAtlasDic[textureAtlasName];
                }
            }
            this.dragonBonesDataDic = null;
            this.textureAtlasDic = null;
            //_currentDataName = null;
            //_currentTextureAtlasName = null;
        };
        /**
         * Returns a DragonBonesData instance.
         * @param The name of an existing DragonBonesData instance.
         * @return A DragonBonesData instance with given name (if exist).
         */
        BaseFactory.prototype.getDragonBonesData = function (name) {
            return this.dragonBonesDataDic[name];
        };
        /**
         * Recommend using getDragonBonesData API instead.
         */
        BaseFactory.prototype.getSkeletonData = function (name) {
            return this.getDragonBonesData(name);
        };
        /**
         * Add a DragonBonesData instance to this BaseFactory instance.
         * @param A DragonBonesData instance.
         * @param (optional) A name for this DragonBonesData instance.
         */
        BaseFactory.prototype.addDragonBonesData = function (data, name) {
            if (name === void 0) { name = null; }
            if (!data) {
                throw new Error();
            }
            name = name || data.name;
            if (!name) {
                throw new Error("Unnamed data!");
            }
            if (this.dragonBonesDataDic[name]) {
                throw new Error();
            }
            this.dragonBonesDataDic[name] = data;
        };
        /**
         * Recommend using addDragonBonesData API instead.
         */
        BaseFactory.prototype.addSkeletonData = function (data, name) {
            if (name === void 0) { name = null; }
            this.addDragonBonesData(data, name);
        };
        /**
         * Remove a DragonBonesData instance from this BaseFactory instance.
         * @param The name for the DragonBonesData instance to remove.
         */
        BaseFactory.prototype.removeDragonBonesData = function (name) {
            delete this.dragonBonesDataDic[name];
        };
        /**
         * Recommend using removeDragonBonesData API instead.
         */
        BaseFactory.prototype.removeSkeletonData = function (name) {
            delete this.dragonBonesDataDic[name];
        };
        /**
         * Return the TextureAtlas by name.
         * @param The name of the TextureAtlas to return.
         * @return A textureAtlas.
         */
        BaseFactory.prototype.getTextureAtlas = function (name) {
            return this.textureAtlasDic[name];
        };
        /**
         * Add a textureAtlas to this BaseFactory instance.
         * @param A textureAtlas to add to this BaseFactory instance.
         * @param (optional) A name for this TextureAtlas.
         */
        BaseFactory.prototype.addTextureAtlas = function (textureAtlas, name) {
            if (name === void 0) { name = null; }
            if (!textureAtlas) {
                throw new Error();
            }
            /*
            if(!name && textureAtlas instanceof ITextureAtlas){
                name = textureAtlas.name;
            }
            */
            if (!name && textureAtlas.hasOwnProperty("name")) {
                name = textureAtlas.name;
            }
            if (!name) {
                throw new Error("Unnamed data!");
            }
            if (this.textureAtlasDic[name]) {
                throw new Error();
            }
            this.textureAtlasDic[name] = textureAtlas;
        };
        /**
         * Remove a textureAtlas from this baseFactory instance.
         * @param The name of the TextureAtlas to remove.
         */
        BaseFactory.prototype.removeTextureAtlas = function (name) {
            delete this.textureAtlasDic[name];
        };
        /**
         * Return the TextureDisplay.
         * @param The name of this Texture.
         * @param The name of the TextureAtlas.
         * @param The registration pivotX position.
         * @param The registration pivotY position.
         * @return An Object.
         */
        BaseFactory.prototype.getTextureDisplay = function (textureName, textureAtlasName, pivotX, pivotY) {
            if (textureAtlasName === void 0) { textureAtlasName = null; }
            if (pivotX === void 0) { pivotX = NaN; }
            if (pivotY === void 0) { pivotY = NaN; }
            var targetTextureAtlas;
            if (textureAtlasName) {
                targetTextureAtlas = this.textureAtlasDic[textureAtlasName];
            }
            else {
                for (textureAtlasName in this.textureAtlasDic) {
                    targetTextureAtlas = this.textureAtlasDic[textureAtlasName];
                    if (targetTextureAtlas.getRegion(textureName)) {
                        break;
                    }
                    targetTextureAtlas = null;
                }
            }
            if (!targetTextureAtlas) {
                return null;
            }
            if (isNaN(pivotX) || isNaN(pivotY)) {
                //默认dragonBonesData的名字和和纹理集的名字是一致的
                var data = this.dragonBonesDataDic[textureAtlasName];
                data = data ? data : this.findFirstDragonBonesData();
                if (data) {
                    var displayData = data.getDisplayDataByName(textureName);
                    if (displayData) {
                        pivotX = displayData.pivot.x;
                        pivotY = displayData.pivot.y;
                    }
                }
            }
            return this._generateDisplay(targetTextureAtlas, textureName, pivotX, pivotY);
        };
        //一般情况下dragonBonesData和textureAtlas是一对一的，通过相同的key对应。
        //TO DO 以后会支持一对多的情况
        BaseFactory.prototype.buildArmature = function (armatureName, fromDragonBonesDataName, fromTextureAtlasName, skinName) {
            if (fromDragonBonesDataName === void 0) { fromDragonBonesDataName = null; }
            if (fromTextureAtlasName === void 0) { fromTextureAtlasName = null; }
            if (skinName === void 0) { skinName = null; }
            var buildArmatureDataPackage = {};
            if (this.fillBuildArmatureDataPackageArmatureInfo(armatureName, fromDragonBonesDataName, buildArmatureDataPackage)) {
                this.fillBuildArmatureDataPackageTextureInfo(fromTextureAtlasName, buildArmatureDataPackage);
            }
            var dragonBonesData = buildArmatureDataPackage.dragonBonesData;
            var armatureData = buildArmatureDataPackage.armatureData;
            var textureAtlas = buildArmatureDataPackage.textureAtlas;
            if (!armatureData || !textureAtlas) {
                return null;
            }
            return this.buildArmatureUsingArmatureDataFromTextureAtlas(dragonBonesData, armatureData, textureAtlas, skinName);
        };
        BaseFactory.prototype.buildArmatureUsingArmatureDataFromTextureAtlas = function (dragonBonesData, armatureData, textureAtlas, skinName) {
            if (skinName === void 0) { skinName = null; }
            var outputArmature = this._generateArmature();
            outputArmature.name = armatureData.name;
            outputArmature.__dragonBonesData = dragonBonesData;
            outputArmature._armatureData = armatureData;
            outputArmature.animation.animationDataList = armatureData.animationDataList;
            this._buildBones(outputArmature);
            //TO DO: Support multi textureAtlas case in future
            this._buildSlots(outputArmature, skinName, textureAtlas);
            outputArmature.advanceTime(0);
            return outputArmature;
        };
        //暂时不支持ifRemoveOriginalAnimationList为false的情况
        BaseFactory.prototype.copyAnimationsToArmature = function (toArmature, fromArmatreName, fromDragonBonesDataName, ifRemoveOriginalAnimationList) {
            if (fromDragonBonesDataName === void 0) { fromDragonBonesDataName = null; }
            if (ifRemoveOriginalAnimationList === void 0) { ifRemoveOriginalAnimationList = true; }
            var buildArmatureDataPackage = {};
            if (!this.fillBuildArmatureDataPackageArmatureInfo(fromArmatreName, fromDragonBonesDataName, buildArmatureDataPackage)) {
                return false;
            }
            var fromArmatureData = buildArmatureDataPackage.armatureData;
            toArmature.animation.animationDataList = fromArmatureData.animationDataList;
            //处理子骨架的复制
            var fromSkinData = fromArmatureData.getSkinData("");
            var fromSlotData;
            var fromDisplayData;
            var toSlotList = toArmature.getSlots(false);
            var toSlot;
            var toSlotDisplayList;
            var toSlotDisplayListLength = 0;
            var toDisplayObject;
            var toChildArmature;
            var length1 = toSlotList.length;
            for (var i1 = 0; i1 < length1; i1++) {
                toSlot = toSlotList[i1];
                toSlotDisplayList = toSlot.displayList;
                toSlotDisplayListLength = toSlotDisplayList.length;
                for (var i = 0; i < toSlotDisplayListLength; i++) {
                    toDisplayObject = toSlotDisplayList[i];
                    if (toDisplayObject instanceof dragonBones.Armature) {
                        toChildArmature = toDisplayObject;
                        fromSlotData = fromSkinData.getSlotData(toSlot.name);
                        fromDisplayData = fromSlotData.displayDataList[i];
                        if (fromDisplayData.type == dragonBones.DisplayData.ARMATURE) {
                            this.copyAnimationsToArmature(toChildArmature, fromDisplayData.name, buildArmatureDataPackage.dragonBonesDataName, ifRemoveOriginalAnimationList);
                        }
                    }
                }
            }
            return true;
        };
        BaseFactory.prototype.fillBuildArmatureDataPackageArmatureInfo = function (armatureName, dragonBonesDataName, outputBuildArmatureDataPackage) {
            if (dragonBonesDataName) {
                outputBuildArmatureDataPackage.dragonBonesDataName = dragonBonesDataName;
                outputBuildArmatureDataPackage.dragonBonesData = this.dragonBonesDataDic[dragonBonesDataName];
                outputBuildArmatureDataPackage.armatureData = outputBuildArmatureDataPackage.dragonBonesData.getArmatureDataByName(armatureName);
            }
            else {
                for (dragonBonesDataName in this.dragonBonesDataDic) {
                    outputBuildArmatureDataPackage.dragonBonesData = this.dragonBonesDataDic[dragonBonesDataName];
                    outputBuildArmatureDataPackage.armatureData = outputBuildArmatureDataPackage.dragonBonesData.getArmatureDataByName(armatureName);
                    if (outputBuildArmatureDataPackage.armatureData) {
                        outputBuildArmatureDataPackage.dragonBonesDataName = dragonBonesDataName;
                        return true;
                    }
                }
            }
            return false;
        };
        BaseFactory.prototype.fillBuildArmatureDataPackageTextureInfo = function (fromTextureAtlasName, outputBuildArmatureDataPackage) {
            outputBuildArmatureDataPackage.textureAtlas = this.textureAtlasDic[fromTextureAtlasName ? fromTextureAtlasName : outputBuildArmatureDataPackage.dragonBonesDataName];
        };
        BaseFactory.prototype.findFirstDragonBonesData = function () {
            for (var key in this.dragonBonesDataDic) {
                var outputDragonBonesData = this.dragonBonesDataDic[key];
                if (outputDragonBonesData) {
                    return outputDragonBonesData;
                }
            }
            return null;
        };
        BaseFactory.prototype.findFirstTextureAtlas = function () {
            for (var key in this.textureAtlasDic) {
                var outputTextureAtlas = this.textureAtlasDic[key];
                if (outputTextureAtlas) {
                    return outputTextureAtlas;
                }
            }
            return null;
        };
        BaseFactory.prototype._buildBones = function (armature) {
            //按照从属关系的顺序建立
            var boneDataList = armature.armatureData.boneDataList;
            var boneData;
            var bone;
            var parent;
            for (var i = 0; i < boneDataList.length; i++) {
                boneData = boneDataList[i];
                bone = dragonBones.Bone.initWithBoneData(boneData);
                parent = boneData.parent;
                if (parent && armature.armatureData.getBoneData(parent) == null) {
                    parent = null;
                }
                //Todo use a internal addBone method to avoid sortBones every time.
                armature.addBone(bone, parent, true);
            }
            armature._updateAnimationAfterBoneListChanged();
        };
        BaseFactory.prototype._buildSlots = function (armature, skinName, textureAtlas) {
            var skinData = armature.armatureData.getSkinData(skinName);
            if (!skinData) {
                return;
            }
            var displayList = [];
            var slotDataList = skinData.slotDataList;
            var slotData;
            var slot;
            var bone;
            for (var i = 0; i < slotDataList.length; i++) {
                slotData = slotDataList[i];
                bone = armature.getBone(slotData.parent);
                if (!bone) {
                    continue;
                }
                slot = this._generateSlot();
                slot.initWithSlotData(slotData);
                bone.addSlot(slot);
                var l = slotData.displayDataList.length;
                while (l--) {
                    var displayData = slotData.displayDataList[l];
                    switch (displayData.type) {
                        case dragonBones.DisplayData.ARMATURE:
                            var childArmature = this.buildArmatureUsingArmatureDataFromTextureAtlas(armature.__dragonBonesData, armature.__dragonBonesData.getArmatureDataByName(displayData.name), textureAtlas, skinName);
                            displayList[l] = childArmature;
                            break;
                        case dragonBones.DisplayData.IMAGE:
                        default:
                            displayList[l] = this._generateDisplay(textureAtlas, displayData.name, displayData.pivot.x, displayData.pivot.y);
                            break;
                    }
                }
                for (var key in displayList) {
                    var displayObject = displayList[key];
                    if (displayObject instanceof dragonBones.Armature) {
                        displayObject = displayObject.display;
                    }
                    if (displayObject.hasOwnProperty("name")) {
                        try {
                            displayObject["name"] = slot.name;
                        }
                        catch (err) {
                        }
                    }
                }
                //==================================================
                slot.displayList = displayList;
                slot._changeDisplay(0);
            }
        };
        /**
         * @private
         * Generates an Armature instance.
         * @return Armature An Armature instance.
         */
        BaseFactory.prototype._generateArmature = function () {
            return null;
        };
        /**
         * @private
         * Generates an Slot instance.
         * @return Slot An Slot instance.
         */
        BaseFactory.prototype._generateSlot = function () {
            return null;
        };
        /**
         * @private
         * Generates a DisplayObject
         * @param textureAtlas The TextureAtlas.
         * @param fullName A qualified name.
         * @param pivotX A pivot x based value.
         * @param pivotY A pivot y based value.
         * @return
         */
        BaseFactory.prototype._generateDisplay = function (textureAtlas, fullName, pivotX, pivotY) {
            return null;
        };
        BaseFactory._helpMatrix = new dragonBones.Matrix();
        return BaseFactory;
    })(dragonBones.EventDispatcher);
    dragonBones.BaseFactory = BaseFactory;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var Point = (function () {
        function Point(x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            this.x = x;
            this.y = y;
        }
        Point.prototype.toString = function () {
            return "[Point (x=" + this.x + " y=" + this.y + ")]";
        };
        return Point;
    })();
    dragonBones.Point = Point;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var Rectangle = (function () {
        function Rectangle(x, y, width, height) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (width === void 0) { width = 0; }
            if (height === void 0) { height = 0; }
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        return Rectangle;
    })();
    dragonBones.Rectangle = Rectangle;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var Timeline = (function () {
        function Timeline() {
            this.duration = 0;
            this._frameList = [];
            this.duration = 0;
            this.scale = 1;
        }
        Timeline.prototype.dispose = function () {
            var i = this._frameList.length;
            while (i--) {
                this._frameList[i].dispose();
            }
            this._frameList = null;
        };
        Timeline.prototype.addFrame = function (frame) {
            if (!frame) {
                throw new Error();
            }
            if (this._frameList.indexOf(frame) < 0) {
                this._frameList[this._frameList.length] = frame;
            }
            else {
                throw new Error();
            }
        };
        Object.defineProperty(Timeline.prototype, "frameList", {
            get: function () {
                return this._frameList;
            },
            enumerable: true,
            configurable: true
        });
        return Timeline;
    })();
    dragonBones.Timeline = Timeline;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/// <reference path="Timeline.ts"/>
var dragonBones;
(function (dragonBones) {
    var AnimationData = (function (_super) {
        __extends(AnimationData, _super);
        function AnimationData() {
            _super.call(this);
            this.frameRate = 0;
            this.playTimes = 0;
            this.lastFrameDuration = 0;
            this.fadeTime = 0;
            this.playTimes = 0;
            this.autoTween = true;
            this.tweenEasing = NaN;
            this.hideTimelineNameMap = [];
            this._timelineList = [];
        }
        Object.defineProperty(AnimationData.prototype, "timelineList", {
            get: function () {
                return this._timelineList;
            },
            enumerable: true,
            configurable: true
        });
        AnimationData.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.hideTimelineNameMap = null;
            for (var key in this._timelineList) {
                var timeline = this._timelineList[key];
                timeline.dispose();
            }
            this._timelineList = null;
        };
        AnimationData.prototype.getTimeline = function (timelineName) {
            var i = this._timelineList.length;
            while (i--) {
                if (this._timelineList[i].name == timelineName) {
                    return this._timelineList[i];
                }
            }
            return null;
        };
        AnimationData.prototype.addTimeline = function (timeline) {
            if (!timeline) {
                throw new Error();
            }
            if (this._timelineList.indexOf(timeline) < 0) {
                this._timelineList[this._timelineList.length] = timeline;
            }
        };
        return AnimationData;
    })(dragonBones.Timeline);
    dragonBones.AnimationData = AnimationData;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var ArmatureData = (function () {
        function ArmatureData() {
            this._boneDataList = [];
            this._skinDataList = [];
            this._animationDataList = [];
            //_areaDataList = new Vector.<IAreaData>(0, true);
        }
        ArmatureData.sortBoneDataHelpArray = function (object1, object2) {
            return object1[0] > object2[0] ? 1 : -1;
        };
        ArmatureData.sortBoneDataHelpArrayDescending = function (object1, object2) {
            return object1[0] > object2[0] ? -1 : 1;
        };
        ArmatureData.prototype.dispose = function () {
            var i = this._boneDataList.length;
            while (i--) {
                this._boneDataList[i].dispose();
            }
            i = this._skinDataList.length;
            while (i--) {
                this._skinDataList[i].dispose();
            }
            i = this._animationDataList.length;
            while (i--) {
                this._animationDataList[i].dispose();
            }
            this._boneDataList = null;
            this._skinDataList = null;
            this._animationDataList = null;
        };
        ArmatureData.prototype.getBoneData = function (boneName) {
            var i = this._boneDataList.length;
            while (i--) {
                if (this._boneDataList[i].name == boneName) {
                    return this._boneDataList[i];
                }
            }
            return null;
        };
        ArmatureData.prototype.getSkinData = function (skinName) {
            if (!skinName && this._skinDataList.length > 0) {
                return this._skinDataList[0];
            }
            var i = this._skinDataList.length;
            while (i--) {
                if (this._skinDataList[i].name == skinName) {
                    return this._skinDataList[i];
                }
            }
            return null;
        };
        ArmatureData.prototype.getAnimationData = function (animationName) {
            var i = this._animationDataList.length;
            while (i--) {
                if (this._animationDataList[i].name == animationName) {
                    return this._animationDataList[i];
                }
            }
            return null;
        };
        ArmatureData.prototype.addBoneData = function (boneData) {
            if (!boneData) {
                throw new Error();
            }
            if (this._boneDataList.indexOf(boneData) < 0) {
                this._boneDataList[this._boneDataList.length] = boneData;
            }
            else {
                throw new Error();
            }
        };
        ArmatureData.prototype.addSkinData = function (skinData) {
            if (!skinData) {
                throw new Error();
            }
            if (this._skinDataList.indexOf(skinData) < 0) {
                this._skinDataList[this._skinDataList.length] = skinData;
            }
            else {
                throw new Error();
            }
        };
        ArmatureData.prototype.addAnimationData = function (animationData) {
            if (!animationData) {
                throw new Error();
            }
            if (this._animationDataList.indexOf(animationData) < 0) {
                this._animationDataList[this._animationDataList.length] = animationData;
            }
        };
        ArmatureData.prototype.sortBoneDataList = function () {
            var i = this._boneDataList.length;
            if (i == 0) {
                return;
            }
            var helpArray = [];
            while (i--) {
                var boneData = this._boneDataList[i];
                var level = 0;
                var parentData = boneData;
                while (parentData) {
                    level++;
                    parentData = this.getBoneData(parentData.parent);
                }
                helpArray[i] = [level, boneData];
            }
            helpArray.sort(ArmatureData.sortBoneDataHelpArray);
            i = helpArray.length;
            while (i--) {
                this._boneDataList[i] = helpArray[i][1];
            }
        };
        Object.defineProperty(ArmatureData.prototype, "boneDataList", {
            get: function () {
                return this._boneDataList;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArmatureData.prototype, "skinDataList", {
            get: function () {
                return this._skinDataList;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArmatureData.prototype, "animationDataList", {
            get: function () {
                return this._animationDataList;
            },
            enumerable: true,
            configurable: true
        });
        return ArmatureData;
    })();
    dragonBones.ArmatureData = ArmatureData;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var BoneData = (function () {
        function BoneData() {
            this.length = 0;
            this.global = new dragonBones.DBTransform();
            this.transform = new dragonBones.DBTransform();
            this.inheritRotation = true;
            this.inheritScale = false;
        }
        BoneData.prototype.dispose = function () {
            this.global = null;
            this.transform = null;
        };
        return BoneData;
    })();
    dragonBones.BoneData = BoneData;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var ColorTransform = (function () {
        function ColorTransform() {
            this.alphaMultiplier = 1;
            this.alphaOffset = 0;
            this.blueMultiplier = 1;
            this.blueOffset = 0;
            this.greenMultiplier = 1;
            this.greenOffset = 0;
            this.redMultiplier = 1;
            this.redOffset = 0;
        }
        return ColorTransform;
    })();
    dragonBones.ColorTransform = ColorTransform;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var DisplayData = (function () {
        function DisplayData() {
            this.transform = new dragonBones.DBTransform();
            this.pivot = new dragonBones.Point();
        }
        DisplayData.prototype.dispose = function () {
            this.transform = null;
            this.pivot = null;
        };
        DisplayData.ARMATURE = "armature";
        DisplayData.IMAGE = "image";
        return DisplayData;
    })();
    dragonBones.DisplayData = DisplayData;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var DragonBonesData = (function () {
        function DragonBonesData() {
            this._armatureDataList = [];
            this._displayDataDictionary = {};
        }
        DragonBonesData.prototype.dispose = function () {
            for (var key in this._armatureDataList) {
                var armatureData = this._armatureDataList[key];
                armatureData.dispose();
            }
            this._armatureDataList = null;
            this.removeAllDisplayData();
            this._displayDataDictionary = null;
        };
        Object.defineProperty(DragonBonesData.prototype, "armatureDataList", {
            get: function () {
                return this._armatureDataList;
            },
            enumerable: true,
            configurable: true
        });
        DragonBonesData.prototype.getArmatureDataByName = function (armatureName) {
            var i = this._armatureDataList.length;
            while (i--) {
                if (this._armatureDataList[i].name == armatureName) {
                    return this._armatureDataList[i];
                }
            }
            return null;
        };
        DragonBonesData.prototype.addArmatureData = function (armatureData) {
            if (!armatureData) {
                throw new Error();
            }
            if (this._armatureDataList.indexOf(armatureData) < 0) {
                this._armatureDataList[this._armatureDataList.length] = armatureData;
            }
            else {
                throw new Error();
            }
        };
        DragonBonesData.prototype.removeArmatureData = function (armatureData) {
            var index = this._armatureDataList.indexOf(armatureData);
            if (index >= 0) {
                this._armatureDataList.splice(index, 1);
            }
        };
        DragonBonesData.prototype.removeArmatureDataByName = function (armatureName) {
            var i = this._armatureDataList.length;
            while (i--) {
                if (this._armatureDataList[i].name == armatureName) {
                    this._armatureDataList.splice(i, 1);
                }
            }
        };
        DragonBonesData.prototype.getDisplayDataByName = function (name) {
            return this._displayDataDictionary[name];
        };
        DragonBonesData.prototype.addDisplayData = function (displayData) {
            this._displayDataDictionary[displayData.name] = displayData;
        };
        DragonBonesData.prototype.removeDisplayDataByName = function (name) {
            delete this._displayDataDictionary[name];
        };
        DragonBonesData.prototype.removeAllDisplayData = function () {
            for (var name in this._displayDataDictionary) {
                delete this._displayDataDictionary[name];
            }
        };
        return DragonBonesData;
    })();
    dragonBones.DragonBonesData = DragonBonesData;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var Frame = (function () {
        function Frame() {
            this.position = 0;
            this.duration = 0;
            this.position = 0;
            this.duration = 0;
        }
        Frame.prototype.dispose = function () {
        };
        return Frame;
    })();
    dragonBones.Frame = Frame;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var SkinData = (function () {
        function SkinData() {
            this._slotDataList = [];
        }
        SkinData.prototype.dispose = function () {
            var i = this._slotDataList.length;
            while (i--) {
                this._slotDataList[i].dispose();
            }
            this._slotDataList = null;
        };
        SkinData.prototype.getSlotData = function (slotName) {
            var i = this._slotDataList.length;
            while (i--) {
                if (this._slotDataList[i].name == slotName) {
                    return this._slotDataList[i];
                }
            }
            return null;
        };
        SkinData.prototype.addSlotData = function (slotData) {
            if (!slotData) {
                throw new Error();
            }
            if (this._slotDataList.indexOf(slotData) < 0) {
                this._slotDataList[this._slotDataList.length] = slotData;
            }
            else {
                throw new Error();
            }
        };
        Object.defineProperty(SkinData.prototype, "slotDataList", {
            get: function () {
                return this._slotDataList;
            },
            enumerable: true,
            configurable: true
        });
        return SkinData;
    })();
    dragonBones.SkinData = SkinData;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var SlotData = (function () {
        function SlotData() {
            this._displayDataList = [];
            this.zOrder = 0;
        }
        SlotData.prototype.dispose = function () {
            var i = this._displayDataList.length;
            while (i--) {
                this._displayDataList[i].dispose();
            }
            this._displayDataList = null;
        };
        SlotData.prototype.addDisplayData = function (displayData) {
            if (!displayData) {
                throw new Error();
            }
            if (this._displayDataList.indexOf(displayData) < 0) {
                this._displayDataList[this._displayDataList.length] = displayData;
            }
            else {
                throw new Error();
            }
        };
        SlotData.prototype.getDisplayData = function (displayName) {
            var i = this._displayDataList.length;
            while (i--) {
                if (this._displayDataList[i].name == displayName) {
                    return this._displayDataList[i];
                }
            }
            return null;
        };
        Object.defineProperty(SlotData.prototype, "displayDataList", {
            get: function () {
                return this._displayDataList;
            },
            enumerable: true,
            configurable: true
        });
        return SlotData;
    })();
    dragonBones.SlotData = SlotData;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/// <reference path="Frame.ts"/>
var dragonBones;
(function (dragonBones) {
    var TransformFrame = (function (_super) {
        __extends(TransformFrame, _super);
        function TransformFrame() {
            _super.call(this);
            //旋转几圈
            this.tweenRotate = 0;
            this.displayIndex = 0;
            this.tweenEasing = 10;
            this.tweenRotate = 0;
            this.tweenScale = true;
            this.displayIndex = 0;
            this.visible = true;
            this.zOrder = NaN;
            this.global = new dragonBones.DBTransform();
            this.transform = new dragonBones.DBTransform();
            this.pivot = new dragonBones.Point();
            this.scaleOffset = new dragonBones.Point();
        }
        TransformFrame.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.global = null;
            this.transform = null;
            this.pivot = null;
            this.scaleOffset = null;
            this.color = null;
        };
        return TransformFrame;
    })(dragonBones.Frame);
    dragonBones.TransformFrame = TransformFrame;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/// <reference path="Timeline.ts"/>
var dragonBones;
(function (dragonBones) {
    var TransformTimeline = (function (_super) {
        __extends(TransformTimeline, _super);
        function TransformTimeline() {
            _super.call(this);
            this.originTransform = new dragonBones.DBTransform();
            this.originTransform.scaleX = 1;
            this.originTransform.scaleY = 1;
            this.originPivot = new dragonBones.Point();
            this.offset = 0;
        }
        TransformTimeline.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.originTransform = null;
            this.originPivot = null;
        };
        return TransformTimeline;
    })(dragonBones.Timeline);
    dragonBones.TransformTimeline = TransformTimeline;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var DataParser = (function () {
        function DataParser() {
        }
        DataParser.parseTextureAtlasData = function (rawData, scale) {
            if (scale === void 0) { scale = 1; }
            var textureAtlasData = {};
            var subTextureFrame;
            var subTextureList = rawData[dragonBones.ConstValues.SUB_TEXTURE];
            for (var key in subTextureList) {
                var subTextureObject = subTextureList[key];
                var subTextureName = subTextureObject[dragonBones.ConstValues.A_NAME];
                var subTextureRegion = new dragonBones.Rectangle();
                subTextureRegion.x = DataParser.getNumber(subTextureObject, dragonBones.ConstValues.A_X, 0) / scale;
                subTextureRegion.y = DataParser.getNumber(subTextureObject, dragonBones.ConstValues.A_Y, 0) / scale;
                subTextureRegion.width = DataParser.getNumber(subTextureObject, dragonBones.ConstValues.A_WIDTH, 0) / scale;
                subTextureRegion.height = DataParser.getNumber(subTextureObject, dragonBones.ConstValues.A_HEIGHT, 0) / scale;
                var rotated = subTextureObject[dragonBones.ConstValues.A_ROTATED] == "true";
                var frameWidth = DataParser.getNumber(subTextureObject, dragonBones.ConstValues.A_FRAME_WIDTH, 0) / scale;
                var frameHeight = DataParser.getNumber(subTextureObject, dragonBones.ConstValues.A_FRAME_HEIGHT, 0) / scale;
                if (frameWidth > 0 && frameHeight > 0) {
                    subTextureFrame = new dragonBones.Rectangle();
                    subTextureFrame.x = DataParser.getNumber(subTextureObject, dragonBones.ConstValues.A_FRAME_X, 0) / scale;
                    subTextureFrame.y = DataParser.getNumber(subTextureObject, dragonBones.ConstValues.A_FRAME_Y, 0) / scale;
                    subTextureFrame.width = frameWidth;
                    subTextureFrame.height = frameHeight;
                }
                else {
                    subTextureFrame = null;
                }
                textureAtlasData[subTextureName] = new dragonBones.TextureData(subTextureRegion, subTextureFrame, rotated);
            }
            return textureAtlasData;
        };
        DataParser.parseDragonBonesData = function (rawDataToParse) {
            if (!rawDataToParse) {
                throw new Error();
            }
            var version = rawDataToParse[dragonBones.ConstValues.A_VERSION];
            version = version.toString();
            if (version.toString() != dragonBones.DragonBones.DATA_VERSION && version.toString() != dragonBones.DragonBones.PARENT_COORDINATE_DATA_VERSION) {
                throw new Error("Nonsupport version!");
            }
            var frameRate = DataParser.getNumber(rawDataToParse, dragonBones.ConstValues.A_FRAME_RATE, 0) || 0;
            var outputDragonBonesData = new dragonBones.DragonBonesData();
            outputDragonBonesData.name = rawDataToParse[dragonBones.ConstValues.A_NAME];
            outputDragonBonesData.isGlobal = rawDataToParse[dragonBones.ConstValues.A_IS_GLOBAL] == "0" ? false : true;
            DataParser.tempDragonBonesData = outputDragonBonesData;
            var armatureList = rawDataToParse[dragonBones.ConstValues.ARMATURE];
            for (var key in armatureList) {
                var armatureObject = rawDataToParse[dragonBones.ConstValues.ARMATURE][key];
                outputDragonBonesData.addArmatureData(DataParser.parseArmatureData(armatureObject, frameRate));
            }
            DataParser.tempDragonBonesData = null;
            return outputDragonBonesData;
        };
        DataParser.parseArmatureData = function (armatureDataToParse, frameRate) {
            var outputArmatureData = new dragonBones.ArmatureData();
            outputArmatureData.name = armatureDataToParse[dragonBones.ConstValues.A_NAME];
            var boneList = armatureDataToParse[dragonBones.ConstValues.BONE];
            for (var key in boneList) {
                var boneObject = boneList[key];
                outputArmatureData.addBoneData(DataParser.parseBoneData(boneObject));
            }
            var skinList = armatureDataToParse[dragonBones.ConstValues.SKIN];
            for (var key in skinList) {
                var skinObject = skinList[key];
                outputArmatureData.addSkinData(DataParser.parseSkinData(skinObject));
            }
            if (DataParser.tempDragonBonesData.isGlobal) {
                dragonBones.DBDataUtil.transformArmatureData(outputArmatureData);
            }
            outputArmatureData.sortBoneDataList();
            var animationList = armatureDataToParse[dragonBones.ConstValues.ANIMATION];
            for (var key in animationList) {
                var animationObject = animationList[key];
                var animationData = DataParser.parseAnimationData(animationObject, frameRate);
                dragonBones.DBDataUtil.addHideTimeline(animationData, outputArmatureData);
                dragonBones.DBDataUtil.transformAnimationData(animationData, outputArmatureData, DataParser.tempDragonBonesData.isGlobal);
                outputArmatureData.addAnimationData(animationData);
            }
            return outputArmatureData;
        };
        //把bone的初始transform解析并返回
        DataParser.parseBoneData = function (boneObject) {
            var boneData = new dragonBones.BoneData();
            boneData.name = boneObject[dragonBones.ConstValues.A_NAME];
            boneData.parent = boneObject[dragonBones.ConstValues.A_PARENT];
            boneData.length = Number(boneObject[dragonBones.ConstValues.A_LENGTH]) || 0;
            boneData.inheritRotation = DataParser.getBoolean(boneObject, dragonBones.ConstValues.A_INHERIT_ROTATION, true);
            boneData.inheritScale = DataParser.getBoolean(boneObject, dragonBones.ConstValues.A_INHERIT_SCALE, true);
            DataParser.parseTransform(boneObject[dragonBones.ConstValues.TRANSFORM], boneData.transform);
            if (DataParser.tempDragonBonesData.isGlobal) {
                boneData.global.copy(boneData.transform);
            }
            return boneData;
        };
        DataParser.parseSkinData = function (skinObject) {
            var skinData = new dragonBones.SkinData();
            skinData.name = skinObject[dragonBones.ConstValues.A_NAME];
            var slotList = skinObject[dragonBones.ConstValues.SLOT];
            for (var key in slotList) {
                var slotObject = slotList[key];
                skinData.addSlotData(DataParser.parseSlotData(slotObject));
            }
            return skinData;
        };
        DataParser.parseSlotData = function (slotObject) {
            var slotData = new dragonBones.SlotData();
            slotData.name = slotObject[dragonBones.ConstValues.A_NAME];
            slotData.parent = slotObject[dragonBones.ConstValues.A_PARENT];
            slotData.zOrder = (slotObject[dragonBones.ConstValues.A_Z_ORDER]);
            slotData.zOrder = DataParser.getNumber(slotObject, dragonBones.ConstValues.A_Z_ORDER, 0) || 0;
            slotData.blendMode = slotObject[dragonBones.ConstValues.A_BLENDMODE];
            var displayList = slotObject[dragonBones.ConstValues.DISPLAY];
            for (var key in displayList) {
                var displayObject = displayList[key];
                slotData.addDisplayData(DataParser.parseDisplayData(displayObject));
            }
            return slotData;
        };
        DataParser.parseDisplayData = function (displayObject) {
            var displayData = new dragonBones.DisplayData();
            displayData.name = displayObject[dragonBones.ConstValues.A_NAME];
            displayData.type = displayObject[dragonBones.ConstValues.A_TYPE];
            DataParser.parseTransform(displayObject[dragonBones.ConstValues.TRANSFORM], displayData.transform, displayData.pivot);
            if (DataParser.tempDragonBonesData != null) {
                DataParser.tempDragonBonesData.addDisplayData(displayData);
            }
            return displayData;
        };
        /** @private */
        DataParser.parseAnimationData = function (animationObject, frameRate) {
            var animationData = new dragonBones.AnimationData();
            animationData.name = animationObject[dragonBones.ConstValues.A_NAME];
            animationData.frameRate = frameRate;
            animationData.duration = Math.round((DataParser.getNumber(animationObject, dragonBones.ConstValues.A_DURATION, 1) || 1) * 1000 / frameRate);
            animationData.playTimes = DataParser.getNumber(animationObject, dragonBones.ConstValues.A_LOOP, 1);
            animationData.playTimes = animationData.playTimes != NaN ? animationData.playTimes : 1;
            animationData.fadeTime = DataParser.getNumber(animationObject, dragonBones.ConstValues.A_FADE_IN_TIME, 0) || 0;
            animationData.scale = DataParser.getNumber(animationObject, dragonBones.ConstValues.A_SCALE, 1) || 0;
            //use frame tweenEase, NaN
            //overwrite frame tweenEase, [-1, 0):ease in, 0:line easing, (0, 1]:ease out, (1, 2]:ease in out
            animationData.tweenEasing = DataParser.getNumber(animationObject, dragonBones.ConstValues.A_TWEEN_EASING, NaN);
            animationData.autoTween = DataParser.getBoolean(animationObject, dragonBones.ConstValues.A_AUTO_TWEEN, true);
            var frameObjectList = animationObject[dragonBones.ConstValues.FRAME];
            for (var index in frameObjectList) {
                var frameObject = frameObjectList[index];
                var frame = DataParser.parseTransformFrame(frameObject, frameRate);
                animationData.addFrame(frame);
            }
            DataParser.parseTimeline(animationObject, animationData);
            var lastFrameDuration = animationData.duration;
            var timelineObjectList = animationObject[dragonBones.ConstValues.TIMELINE];
            for (var index in timelineObjectList) {
                var timelineObject = timelineObjectList[index];
                var timeline = DataParser.parseTransformTimeline(timelineObject, animationData.duration, frameRate);
                timeline = DataParser.parseTransformTimeline(timelineObject, animationData.duration, frameRate);
                lastFrameDuration = Math.min(lastFrameDuration, timeline.frameList[timeline.frameList.length - 1].duration);
                animationData.addTimeline(timeline);
            }
            if (animationData.frameList.length > 0) {
                lastFrameDuration = Math.min(lastFrameDuration, animationData.frameList[animationData.frameList.length - 1].duration);
            }
            //取得timeline中最小的lastFrameDuration并保存
            animationData.lastFrameDuration = lastFrameDuration;
            return animationData;
        };
        DataParser.parseTransformTimeline = function (timelineObject, duration, frameRate) {
            var outputTimeline = new dragonBones.TransformTimeline();
            outputTimeline.name = timelineObject[dragonBones.ConstValues.A_NAME];
            outputTimeline.scale = DataParser.getNumber(timelineObject, dragonBones.ConstValues.A_SCALE, 1) || 0;
            outputTimeline.offset = DataParser.getNumber(timelineObject, dragonBones.ConstValues.A_OFFSET, 0) || 0;
            outputTimeline.originPivot.x = DataParser.getNumber(timelineObject, dragonBones.ConstValues.A_PIVOT_X, 0) || 0;
            outputTimeline.originPivot.y = DataParser.getNumber(timelineObject, dragonBones.ConstValues.A_PIVOT_Y, 0) || 0;
            outputTimeline.duration = duration;
            var frameList = timelineObject[dragonBones.ConstValues.FRAME];
            for (var key in frameList) {
                var frameObject = frameList[key];
                var frame = DataParser.parseTransformFrame(frameObject, frameRate);
                outputTimeline.addFrame(frame);
            }
            DataParser.parseTimeline(timelineObject, outputTimeline);
            return outputTimeline;
        };
        DataParser.parseTransformFrame = function (frameObject, frameRate) {
            var outputFrame = new dragonBones.TransformFrame();
            DataParser.parseFrame(frameObject, outputFrame, frameRate);
            outputFrame.visible = !DataParser.getBoolean(frameObject, dragonBones.ConstValues.A_HIDE, false);
            //NaN:no tween, 10:auto tween, [-1, 0):ease in, 0:line easing, (0, 1]:ease out, (1, 2]:ease in out
            outputFrame.tweenEasing = DataParser.getNumber(frameObject, dragonBones.ConstValues.A_TWEEN_EASING, 10) || 10;
            outputFrame.tweenRotate = Math.floor(DataParser.getNumber(frameObject, dragonBones.ConstValues.A_TWEEN_ROTATE, 0) || 0);
            outputFrame.tweenScale = DataParser.getBoolean(frameObject, dragonBones.ConstValues.A_TWEEN_SCALE, true);
            outputFrame.displayIndex = Math.floor(DataParser.getNumber(frameObject, dragonBones.ConstValues.A_DISPLAY_INDEX, 0) || 0);
            //如果为NaN，则说明没有改变过zOrder
            outputFrame.zOrder = DataParser.getNumber(frameObject, dragonBones.ConstValues.A_Z_ORDER, DataParser.tempDragonBonesData.isGlobal ? NaN : 0);
            DataParser.parseTransform(frameObject[dragonBones.ConstValues.TRANSFORM], outputFrame.transform, outputFrame.pivot);
            if (DataParser.tempDragonBonesData.isGlobal) {
                outputFrame.global.copy(outputFrame.transform);
            }
            outputFrame.scaleOffset.x = DataParser.getNumber(frameObject, dragonBones.ConstValues.A_SCALE_X_OFFSET, 0) || 0;
            outputFrame.scaleOffset.y = DataParser.getNumber(frameObject, dragonBones.ConstValues.A_SCALE_Y_OFFSET, 0) || 0;
            var colorTransformObject = frameObject[dragonBones.ConstValues.COLOR_TRANSFORM];
            if (colorTransformObject) {
                outputFrame.color = new dragonBones.ColorTransform();
                DataParser.parseColorTransform(colorTransformObject, outputFrame.color);
            }
            return outputFrame;
        };
        DataParser.parseTimeline = function (timelineObject, outputTimeline) {
            var position = 0;
            var frame;
            var frameList = outputTimeline.frameList;
            for (var key in frameList) {
                frame = frameList[key];
                frame.position = position;
                position += frame.duration;
            }
            //防止duration计算有误差
            if (frame) {
                frame.duration = outputTimeline.duration - frame.position;
            }
        };
        DataParser.parseFrame = function (frameObject, outputFrame, frameRate) {
            if (frameRate === void 0) { frameRate = 0; }
            outputFrame.duration = Math.round(((frameObject[dragonBones.ConstValues.A_DURATION]) || 1) * 1000 / frameRate);
            outputFrame.action = frameObject[dragonBones.ConstValues.A_ACTION];
            outputFrame.event = frameObject[dragonBones.ConstValues.A_EVENT];
            outputFrame.sound = frameObject[dragonBones.ConstValues.A_SOUND];
        };
        DataParser.parseTransform = function (transformObject, transform, pivot) {
            if (pivot === void 0) { pivot = null; }
            if (transformObject) {
                if (transform) {
                    transform.x = DataParser.getNumber(transformObject, dragonBones.ConstValues.A_X, 0) || 0;
                    transform.y = DataParser.getNumber(transformObject, dragonBones.ConstValues.A_Y, 0) || 0;
                    transform.skewX = DataParser.getNumber(transformObject, dragonBones.ConstValues.A_SKEW_X, 0) * dragonBones.ConstValues.ANGLE_TO_RADIAN || 0;
                    transform.skewY = DataParser.getNumber(transformObject, dragonBones.ConstValues.A_SKEW_Y, 0) * dragonBones.ConstValues.ANGLE_TO_RADIAN || 0;
                    transform.scaleX = DataParser.getNumber(transformObject, dragonBones.ConstValues.A_SCALE_X, 1) || 0;
                    transform.scaleY = DataParser.getNumber(transformObject, dragonBones.ConstValues.A_SCALE_Y, 1) || 0;
                }
                if (pivot) {
                    pivot.x = DataParser.getNumber(transformObject, dragonBones.ConstValues.A_PIVOT_X, 0) || 0;
                    pivot.y = DataParser.getNumber(transformObject, dragonBones.ConstValues.A_PIVOT_Y, 0) || 0;
                }
            }
        };
        DataParser.parseColorTransform = function (colorTransformObject, colorTransform) {
            if (colorTransformObject) {
                if (colorTransform) {
                    colorTransform.alphaOffset = DataParser.getNumber(colorTransformObject, dragonBones.ConstValues.A_ALPHA_OFFSET, 0);
                    colorTransform.redOffset = DataParser.getNumber(colorTransformObject, dragonBones.ConstValues.A_RED_OFFSET, 0);
                    colorTransform.greenOffset = DataParser.getNumber(colorTransformObject, dragonBones.ConstValues.A_GREEN_OFFSET, 0);
                    colorTransform.blueOffset = DataParser.getNumber(colorTransformObject, dragonBones.ConstValues.A_BLUE_OFFSET, 0);
                    colorTransform.alphaMultiplier = DataParser.getNumber(colorTransformObject, dragonBones.ConstValues.A_ALPHA_MULTIPLIER, 100) * 0.01;
                    colorTransform.redMultiplier = DataParser.getNumber(colorTransformObject, dragonBones.ConstValues.A_RED_MULTIPLIER, 100) * 0.01;
                    colorTransform.greenMultiplier = DataParser.getNumber(colorTransformObject, dragonBones.ConstValues.A_GREEN_MULTIPLIER, 100) * 0.01;
                    colorTransform.blueMultiplier = DataParser.getNumber(colorTransformObject, dragonBones.ConstValues.A_BLUE_MULTIPLIER, 100) * 0.01;
                }
            }
        };
        DataParser.getBoolean = function (data, key, defaultValue) {
            if (data && key in data) {
                switch (String(data[key])) {
                    case "0":
                    case "NaN":
                    case "":
                    case "false":
                    case "null":
                    case "undefined":
                        return false;
                    case "1":
                    case "true":
                    default:
                        return true;
                }
            }
            return defaultValue;
        };
        DataParser.getNumber = function (data, key, defaultValue) {
            if (data && key in data) {
                switch (String(data[key])) {
                    case "NaN":
                    case "":
                    case "false":
                    case "null":
                    case "undefined":
                        return NaN;
                    default:
                        return Number(data[key]);
                }
            }
            return defaultValue;
        };
        return DataParser;
    })();
    dragonBones.DataParser = DataParser;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var TextureData = (function () {
        function TextureData(region, frame, rotated) {
            this.region = region;
            this.frame = frame;
            this.rotated = rotated;
        }
        return TextureData;
    })();
    dragonBones.TextureData = TextureData;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var ConstValues = (function () {
        function ConstValues() {
        }
        ConstValues.ANGLE_TO_RADIAN = Math.PI / 180;
        ConstValues.RADIAN_TO_ANGLE = 180 / Math.PI;
        ConstValues.DRAGON_BONES = "dragonBones";
        ConstValues.ARMATURE = "armature";
        ConstValues.SKIN = "skin";
        ConstValues.BONE = "bone";
        ConstValues.SLOT = "slot";
        ConstValues.DISPLAY = "display";
        ConstValues.ANIMATION = "animation";
        ConstValues.TIMELINE = "timeline";
        ConstValues.FRAME = "frame";
        ConstValues.TRANSFORM = "transform";
        ConstValues.COLOR_TRANSFORM = "colorTransform";
        ConstValues.RECTANGLE = "rectangle";
        ConstValues.ELLIPSE = "ellipse";
        ConstValues.TEXTURE_ATLAS = "TextureAtlas";
        ConstValues.SUB_TEXTURE = "SubTexture";
        ConstValues.A_ROTATED = "rotated";
        ConstValues.A_FRAME_X = "frameX";
        ConstValues.A_FRAME_Y = "frameY";
        ConstValues.A_FRAME_WIDTH = "frameWidth";
        ConstValues.A_FRAME_HEIGHT = "frameHeight";
        ConstValues.A_VERSION = "version";
        ConstValues.A_IMAGE_PATH = "imagePath";
        ConstValues.A_FRAME_RATE = "frameRate";
        ConstValues.A_NAME = "name";
        ConstValues.A_IS_GLOBAL = "isGlobal";
        ConstValues.A_PARENT = "parent";
        ConstValues.A_LENGTH = "length";
        ConstValues.A_TYPE = "type";
        ConstValues.A_FADE_IN_TIME = "fadeInTime";
        ConstValues.A_DURATION = "duration";
        ConstValues.A_SCALE = "scale";
        ConstValues.A_OFFSET = "offset";
        ConstValues.A_LOOP = "loop";
        ConstValues.A_EVENT = "event";
        ConstValues.A_EVENT_PARAMETERS = "eventParameters";
        ConstValues.A_SOUND = "sound";
        ConstValues.A_ACTION = "action";
        ConstValues.A_HIDE = "hide";
        ConstValues.A_AUTO_TWEEN = "autoTween";
        ConstValues.A_TWEEN_EASING = "tweenEasing";
        ConstValues.A_TWEEN_ROTATE = "tweenRotate";
        ConstValues.A_TWEEN_SCALE = "tweenScale";
        ConstValues.A_DISPLAY_INDEX = "displayIndex";
        ConstValues.A_Z_ORDER = "z";
        ConstValues.A_BLENDMODE = "blendMode";
        ConstValues.A_WIDTH = "width";
        ConstValues.A_HEIGHT = "height";
        ConstValues.A_INHERIT_SCALE = "inheritScale";
        ConstValues.A_INHERIT_ROTATION = "inheritRotation";
        ConstValues.A_X = "x";
        ConstValues.A_Y = "y";
        ConstValues.A_SKEW_X = "skX";
        ConstValues.A_SKEW_Y = "skY";
        ConstValues.A_SCALE_X = "scX";
        ConstValues.A_SCALE_Y = "scY";
        ConstValues.A_PIVOT_X = "pX";
        ConstValues.A_PIVOT_Y = "pY";
        ConstValues.A_ALPHA_OFFSET = "aO";
        ConstValues.A_RED_OFFSET = "rO";
        ConstValues.A_GREEN_OFFSET = "gO";
        ConstValues.A_BLUE_OFFSET = "bO";
        ConstValues.A_ALPHA_MULTIPLIER = "aM";
        ConstValues.A_RED_MULTIPLIER = "rM";
        ConstValues.A_GREEN_MULTIPLIER = "gM";
        ConstValues.A_BLUE_MULTIPLIER = "bM";
        ConstValues.A_SCALE_X_OFFSET = "scXOffset";
        ConstValues.A_SCALE_Y_OFFSET = "scYOffset";
        ConstValues.A_SCALE_MODE = "scaleMode";
        ConstValues.A_FIXED_ROTATION = "fixedRotation";
        return ConstValues;
    })();
    dragonBones.ConstValues = ConstValues;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var DBDataUtil = (function () {
        function DBDataUtil() {
        }
        DBDataUtil.transformArmatureData = function (armatureData) {
            var boneDataList = armatureData.boneDataList;
            var i = boneDataList.length;
            while (i--) {
                var boneData = boneDataList[i];
                if (boneData.parent) {
                    var parentBoneData = armatureData.getBoneData(boneData.parent);
                    if (parentBoneData) {
                        boneData.transform.copy(boneData.global);
                        dragonBones.TransformUtil.globalToLocal(boneData.transform, parentBoneData.global);
                    }
                }
            }
        };
        DBDataUtil.transformArmatureDataAnimations = function (armatureData) {
            var animationDataList = armatureData.animationDataList;
            var i = animationDataList.length;
            while (i--) {
                DBDataUtil.transformAnimationData(animationDataList[i], armatureData, false);
            }
        };
        DBDataUtil.transformRelativeAnimationData = function (animationData, armatureData) {
        };
        DBDataUtil.transformAnimationData = function (animationData, armatureData, isGlobalData) {
            if (!isGlobalData) {
                DBDataUtil.transformRelativeAnimationData(animationData, armatureData);
                return;
            }
            var skinData = armatureData.getSkinData(null);
            var boneDataList = armatureData.boneDataList;
            var slotDataList;
            if (skinData) {
                slotDataList = skinData.slotDataList;
            }
            for (var i = 0; i < boneDataList.length; i++) {
                var boneData = boneDataList[i];
                var timeline = animationData.getTimeline(boneData.name);
                if (!timeline) {
                    continue;
                }
                var slotData = null;
                if (slotDataList) {
                    for (var key in slotDataList) {
                        slotData = slotDataList[key];
                        //找到属于当前Bone的slot(FLash Pro制作的动画一个Bone只包含一个slot)
                        if (slotData.parent == boneData.name) {
                            break;
                        }
                    }
                }
                var frameList = timeline.frameList;
                var originTransform = null;
                var originPivot = null;
                var prevFrame = null;
                var frameListLength = frameList.length;
                for (var j = 0; j < frameListLength; j++) {
                    var frame = (frameList[j]);
                    //计算frame的transoform信息
                    DBDataUtil.setFrameTransform(animationData, armatureData, boneData, frame);
                    frame.transform.x -= boneData.transform.x;
                    frame.transform.y -= boneData.transform.y;
                    frame.transform.skewX -= boneData.transform.skewX;
                    frame.transform.skewY -= boneData.transform.skewY;
                    frame.transform.scaleX /= boneData.transform.scaleX;
                    frame.transform.scaleY /= boneData.transform.scaleY;
                    if (!timeline.transformed) {
                        if (slotData) {
                            frame.zOrder -= slotData.zOrder;
                        }
                    }
                    //如果originTransform不存在说明当前帧是第一帧，将当前帧的transform保存至timeline的originTransform
                    if (!originTransform) {
                        originTransform = timeline.originTransform;
                        originTransform.copy(frame.transform);
                        originTransform.skewX = dragonBones.TransformUtil.formatRadian(originTransform.skewX);
                        originTransform.skewY = dragonBones.TransformUtil.formatRadian(originTransform.skewY);
                        originPivot = timeline.originPivot;
                        originPivot.x = frame.pivot.x;
                        originPivot.y = frame.pivot.y;
                    }
                    frame.transform.x -= originTransform.x;
                    frame.transform.y -= originTransform.y;
                    frame.transform.skewX = dragonBones.TransformUtil.formatRadian(frame.transform.skewX - originTransform.skewX);
                    frame.transform.skewY = dragonBones.TransformUtil.formatRadian(frame.transform.skewY - originTransform.skewY);
                    frame.transform.scaleX /= originTransform.scaleX;
                    frame.transform.scaleY /= originTransform.scaleY;
                    if (!timeline.transformed) {
                        frame.pivot.x -= originPivot.x;
                        frame.pivot.y -= originPivot.y;
                    }
                    if (prevFrame) {
                        var dLX = frame.transform.skewX - prevFrame.transform.skewX;
                        if (prevFrame.tweenRotate) {
                            if (prevFrame.tweenRotate > 0) {
                                if (dLX < 0) {
                                    frame.transform.skewX += Math.PI * 2;
                                    frame.transform.skewY += Math.PI * 2;
                                }
                                if (prevFrame.tweenRotate > 1) {
                                    frame.transform.skewX += Math.PI * 2 * (prevFrame.tweenRotate - 1);
                                    frame.transform.skewY += Math.PI * 2 * (prevFrame.tweenRotate - 1);
                                }
                            }
                            else {
                                if (dLX > 0) {
                                    frame.transform.skewX -= Math.PI * 2;
                                    frame.transform.skewY -= Math.PI * 2;
                                }
                                if (prevFrame.tweenRotate < 1) {
                                    frame.transform.skewX += Math.PI * 2 * (prevFrame.tweenRotate + 1);
                                    frame.transform.skewY += Math.PI * 2 * (prevFrame.tweenRotate + 1);
                                }
                            }
                        }
                        else {
                            frame.transform.skewX = prevFrame.transform.skewX + dragonBones.TransformUtil.formatRadian(frame.transform.skewX - prevFrame.transform.skewX);
                            frame.transform.skewY = prevFrame.transform.skewY + dragonBones.TransformUtil.formatRadian(frame.transform.skewY - prevFrame.transform.skewY);
                        }
                    }
                    prevFrame = frame;
                }
                timeline.transformed = true;
            }
        };
        //计算frame的transoform信息
        DBDataUtil.setFrameTransform = function (animationData, armatureData, boneData, frame) {
            frame.transform.copy(frame.global);
            //找到当前bone的父亲列表 并将timeline信息存入parentTimelineList 将boneData信息存入parentDataList
            var parentData = armatureData.getBoneData(boneData.parent);
            if (parentData) {
                var parentTimeline = animationData.getTimeline(parentData.name);
                if (parentTimeline) {
                    var parentTimelineList = [];
                    var parentDataList = [];
                    while (parentTimeline) {
                        parentTimelineList.push(parentTimeline);
                        parentDataList.push(parentData);
                        parentData = armatureData.getBoneData(parentData.parent);
                        if (parentData) {
                            parentTimeline = animationData.getTimeline(parentData.name);
                        }
                        else {
                            parentTimeline = null;
                        }
                    }
                    var i = parentTimelineList.length;
                    var globalTransform;
                    var globalTransformMatrix = new dragonBones.Matrix();
                    var currentTransform = new dragonBones.DBTransform();
                    var currentTransformMatrix = new dragonBones.Matrix();
                    while (i--) {
                        parentTimeline = parentTimelineList[i];
                        parentData = parentDataList[i];
                        //一级一级找到当前帧对应的每个父节点的transform(相对transform)
                        DBDataUtil.getTimelineTransform(parentTimeline, frame.position, currentTransform, !globalTransform);
                        if (!globalTransform) {
                            globalTransform = new dragonBones.DBTransform();
                            globalTransform.copy(currentTransform);
                        }
                        else {
                            currentTransform.x += parentTimeline.originTransform.x + parentData.transform.x;
                            currentTransform.y += parentTimeline.originTransform.y + parentData.transform.y;
                            currentTransform.skewX += parentTimeline.originTransform.skewX + parentData.transform.skewX;
                            currentTransform.skewY += parentTimeline.originTransform.skewY + parentData.transform.skewY;
                            currentTransform.scaleX *= parentTimeline.originTransform.scaleX * parentData.transform.scaleX;
                            currentTransform.scaleY *= parentTimeline.originTransform.scaleY * parentData.transform.scaleY;
                            dragonBones.TransformUtil.transformToMatrix(currentTransform, currentTransformMatrix, true);
                            currentTransformMatrix.concat(globalTransformMatrix);
                            dragonBones.TransformUtil.matrixToTransform(currentTransformMatrix, globalTransform, currentTransform.scaleX * globalTransform.scaleX >= 0, currentTransform.scaleY * globalTransform.scaleY >= 0);
                        }
                        dragonBones.TransformUtil.transformToMatrix(globalTransform, globalTransformMatrix, true);
                    }
                    dragonBones.TransformUtil.globalToLocal(frame.transform, globalTransform);
                }
            }
        };
        DBDataUtil.getTimelineTransform = function (timeline, position, retult, isGlobal) {
            var frameList = timeline.frameList;
            var i = frameList.length;
            while (i--) {
                var currentFrame = (frameList[i]);
                //找到穿越当前帧的关键帧
                if (currentFrame.position <= position && currentFrame.position + currentFrame.duration > position) {
                    //是最后一帧或者就是当前帧
                    if (i == frameList.length - 1 || position == currentFrame.position) {
                        retult.copy(isGlobal ? currentFrame.global : currentFrame.transform);
                    }
                    else {
                        var tweenEasing = currentFrame.tweenEasing;
                        var progress = (position - currentFrame.position) / currentFrame.duration;
                        if (tweenEasing && tweenEasing != 10) {
                            progress = dragonBones.MathUtil.getEaseValue(progress, tweenEasing);
                        }
                        var nextFrame = frameList[i + 1];
                        var currentTransform = isGlobal ? currentFrame.global : currentFrame.transform;
                        var nextTransform = isGlobal ? nextFrame.global : nextFrame.transform;
                        retult.x = currentTransform.x + (nextTransform.x - currentTransform.x) * progress;
                        retult.y = currentTransform.y + (nextTransform.y - currentTransform.y) * progress;
                        retult.skewX = dragonBones.TransformUtil.formatRadian(currentTransform.skewX + (nextTransform.skewX - currentTransform.skewX) * progress);
                        retult.skewY = dragonBones.TransformUtil.formatRadian(currentTransform.skewY + (nextTransform.skewY - currentTransform.skewY) * progress);
                        retult.scaleX = currentTransform.scaleX + (nextTransform.scaleX - currentTransform.scaleX) * progress;
                        retult.scaleY = currentTransform.scaleY + (nextTransform.scaleY - currentTransform.scaleY) * progress;
                    }
                    break;
                }
            }
        };
        DBDataUtil.addHideTimeline = function (animationData, armatureData) {
            var boneDataList = armatureData.boneDataList;
            var i = boneDataList.length;
            while (i--) {
                var boneData = boneDataList[i];
                var boneName = boneData.name;
                if (!animationData.getTimeline(boneName)) {
                    if (animationData.hideTimelineNameMap.indexOf(boneName) < 0) {
                        animationData.hideTimelineNameMap.push(boneName);
                    }
                }
            }
        };
        return DBDataUtil;
    })();
    dragonBones.DBDataUtil = DBDataUtil;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var MathUtil = (function () {
        function MathUtil() {
        }
        /** @private */
        MathUtil.getEaseValue = function (value, easing) {
            var valueEase = 1;
            if (easing > 1) {
                valueEase = 0.5 * (1 - Math.cos(value * Math.PI));
                easing -= 1;
            }
            else if (easing > 0) {
                valueEase = 1 - Math.pow(1 - value, 2);
            }
            else if (easing < 0) {
                easing *= -1;
                valueEase = Math.pow(value, 2);
            }
            return (valueEase - value) * easing + value;
        };
        return MathUtil;
    })();
    dragonBones.MathUtil = MathUtil;
})(dragonBones || (dragonBones = {}));
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var dragonBones;
(function (dragonBones) {
    var TransformUtil = (function () {
        function TransformUtil() {
        }
        TransformUtil.globalToLocal = function (transform, parent) {
            TransformUtil.transformToMatrix(transform, TransformUtil._helpTransformMatrix, true);
            TransformUtil.transformToMatrix(parent, TransformUtil._helpParentTransformMatrix, true);
            TransformUtil._helpParentTransformMatrix.invert();
            TransformUtil._helpTransformMatrix.concat(TransformUtil._helpParentTransformMatrix);
            TransformUtil.matrixToTransform(TransformUtil._helpTransformMatrix, transform, transform.scaleX * parent.scaleX >= 0, transform.scaleY * parent.scaleY >= 0);
        };
        TransformUtil.transformToMatrix = function (transform, matrix, keepScale) {
            if (keepScale === void 0) { keepScale = false; }
            if (keepScale) {
                matrix.a = transform.scaleX * Math.cos(transform.skewY);
                matrix.b = transform.scaleX * Math.sin(transform.skewY);
                matrix.c = -transform.scaleY * Math.sin(transform.skewX);
                matrix.d = transform.scaleY * Math.cos(transform.skewX);
                matrix.tx = transform.x;
                matrix.ty = transform.y;
            }
            else {
                matrix.a = Math.cos(transform.skewY);
                matrix.b = Math.sin(transform.skewY);
                matrix.c = -Math.sin(transform.skewX);
                matrix.d = Math.cos(transform.skewX);
                matrix.tx = transform.x;
                matrix.ty = transform.y;
            }
        };
        TransformUtil.matrixToTransform = function (matrix, transform, scaleXF, scaleYF) {
            transform.x = matrix.tx;
            transform.y = matrix.ty;
            transform.scaleX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b) * (scaleXF ? 1 : -1);
            transform.scaleY = Math.sqrt(matrix.d * matrix.d + matrix.c * matrix.c) * (scaleYF ? 1 : -1);
            var skewXArray = [];
            skewXArray[0] = Math.acos(matrix.d / transform.scaleY);
            skewXArray[1] = -skewXArray[0];
            skewXArray[2] = Math.asin(-matrix.c / transform.scaleY);
            skewXArray[3] = skewXArray[2] >= 0 ? Math.PI - skewXArray[2] : skewXArray[2] - Math.PI;
            if (Number(skewXArray[0]).toFixed(4) == Number(skewXArray[2]).toFixed(4) || Number(skewXArray[0]).toFixed(4) == Number(skewXArray[3]).toFixed(4)) {
                transform.skewX = skewXArray[0];
            }
            else {
                transform.skewX = skewXArray[1];
            }
            var skewYArray = [];
            skewYArray[0] = Math.acos(matrix.a / transform.scaleX);
            skewYArray[1] = -skewYArray[0];
            skewYArray[2] = Math.asin(matrix.b / transform.scaleX);
            skewYArray[3] = skewYArray[2] >= 0 ? Math.PI - skewYArray[2] : skewYArray[2] - Math.PI;
            if (Number(skewYArray[0]).toFixed(4) == Number(skewYArray[2]).toFixed(4) || Number(skewYArray[0]).toFixed(4) == Number(skewYArray[3]).toFixed(4)) {
                transform.skewY = skewYArray[0];
            }
            else {
                transform.skewY = skewYArray[1];
            }
        };
        TransformUtil.formatRadian = function (radian) {
            //radian %= DOUBLE_PI;
            if (radian > Math.PI) {
                radian -= TransformUtil.DOUBLE_PI;
            }
            if (radian < -Math.PI) {
                radian += TransformUtil.DOUBLE_PI;
            }
            return radian;
        };
        TransformUtil.HALF_PI = Math.PI * 0.5;
        TransformUtil.DOUBLE_PI = Math.PI * 2;
        TransformUtil._helpTransformMatrix = new dragonBones.Matrix();
        TransformUtil._helpParentTransformMatrix = new dragonBones.Matrix();
        return TransformUtil;
    })();
    dragonBones.TransformUtil = TransformUtil;
})(dragonBones || (dragonBones = {}));
var WOZLLA;
(function (WOZLLA) {
    var event;
    (function (event) {
        /**
         * @enum {number} WOZLLA.event.EventPhase
         * all enumerations of event phase
         */
        (function (EventPhase) {
            /** @property {number} [CAPTURE] */
            EventPhase[EventPhase["CAPTURE"] = 0] = "CAPTURE";
            /** @property {number} [BUBBLE] */
            EventPhase[EventPhase["BUBBLE"] = 1] = "BUBBLE";
            /** @property {number} [TARGET] */
            EventPhase[EventPhase["TARGET"] = 2] = "TARGET";
        })(event.EventPhase || (event.EventPhase = {}));
        var EventPhase = event.EventPhase;
        /**
         * @class WOZLLA.event.Event
         * Base class for all event object of WOZLLA engine.    <br/>
         * see also:    <br/>
         * {@link WOZLLA.event.EventPhase}  <br/>
         * {@link WOZLLA.event.EventDispatcher}     <br/>
         */
        var Event = (function () {
            /**
             * @method constructor
             * create a new Event object
             * @member WOZLLA.event.Event
             * @param {string} type
             * @param {boolean} bubbles
             * @param {any} data
             * @param {boolean} canStopBubbles
             */
            function Event(type, bubbles, data, canStopBubbles) {
                if (bubbles === void 0) { bubbles = false; }
                if (data === void 0) { data = null; }
                if (canStopBubbles === void 0) { canStopBubbles = true; }
                this._eventPhase = 0 /* CAPTURE */;
                this._immediatePropagationStoped = false;
                this._propagationStoped = false;
                this._listenerRemove = false;
                this._type = type;
                this._bubbles = bubbles;
                this._data = data;
                this._canStopBubbles = canStopBubbles;
            }
            Object.defineProperty(Event.prototype, "data", {
                /**
                 * event data.
                 * @member WOZLLA.event.Event
                 * @property {any} data
                 * @readonly
                 */
                get: function () {
                    return this._data;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Event.prototype, "type", {
                /**
                 * event type.
                 * @member WOZLLA.event.Event
                 * @property {string} type
                 * @readonly
                 */
                get: function () {
                    return this._type;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Event.prototype, "target", {
                /**
                 * event origin target.
                 * @member WOZLLA.event.Event
                 * @property {WOZLLA.event.EventDispatcher} target
                 * @readonly
                 */
                get: function () {
                    return this._target;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Event.prototype, "currentTarget", {
                /**
                 * current event target in event bubbling.
                 * @member WOZLLA.event.Event
                 * @property {WOZLLA.event.EventDispatcher} currentTarget
                 * @readonly
                 */
                get: function () {
                    return this._currentTarget;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Event.prototype, "eventPhase", {
                /**
                 * which phase this event is in.
                 * @member WOZLLA.event.Event
                 * @property {WOZLLA.event.EventPhase} eventPhase
                 * @readonly
                 */
                get: function () {
                    return this._eventPhase;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Event.prototype, "bubbles", {
                /**
                 * true to identify this event could be bubbled, false otherwise.
                 * @member WOZLLA.event.Event
                 * @property {boolean} bubbles
                 * @readonly
                 */
                get: function () {
                    return this._bubbles;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Event.prototype, "canStopBubbles", {
                /**
                 * true to identify this event could be stop bubbles, false otherwise.
                 * @member WOZLLA.event.Event
                 * @property {boolean} canStopBubbles
                 * @readonly
                 */
                get: function () {
                    return this._canStopBubbles;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * @method isStopPropagation
             * @member WOZLLA.event.Event
             * @returns {boolean}
             */
            Event.prototype.isStopPropagation = function () {
                return this._propagationStoped;
            };
            /**
             * stop bubble to next parent
             * @method stopPropagation
             * @member WOZLLA.event.Event
             */
            Event.prototype.stopPropagation = function () {
                if (!this._canStopBubbles) {
                    return;
                }
                this._propagationStoped = true;
            };
            /**
             * @method isStopImmediatePropagation
             * @member WOZLLA.event.Event
             * @returns {boolean}
             */
            Event.prototype.isStopImmediatePropagation = function () {
                return this._immediatePropagationStoped;
            };
            /**
             * stop event bubble immediately even other listeners dosen't receive this event.
             * @method stopImmediatePropagation
             * @member WOZLLA.event.Event
             */
            Event.prototype.stopImmediatePropagation = function () {
                if (!this._canStopBubbles) {
                    return;
                }
                this._immediatePropagationStoped = true;
                this._propagationStoped = true;
            };
            /**
             * call from current listener to remove the current listener
             */
            Event.prototype.removeCurrentListener = function () {
                this._listenerRemove = true;
            };
            return Event;
        })();
        event.Event = Event;
    })(event = WOZLLA.event || (WOZLLA.event = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Event.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var event;
    (function (_event) {
        var ListenerList = (function () {
            function ListenerList() {
                this._listeners = [];
            }
            ListenerList.prototype.add = function (listener) {
                this._listeners.push(listener);
            };
            ListenerList.prototype.remove = function (listener) {
                var i, len = this._listeners.length;
                for (i = 0; i < len; i++) {
                    if (this._listeners[i] === listener) {
                        this._listeners.splice(i, 1);
                        return true;
                    }
                }
                return false;
            };
            ListenerList.prototype.removeAt = function (idx) {
                return this._listeners.splice(idx, 1);
            };
            ListenerList.prototype.get = function (idx) {
                return this._listeners[idx];
            };
            ListenerList.prototype.length = function () {
                return this._listeners.length;
            };
            ListenerList.prototype.clear = function () {
                this._listeners.length = 0;
            };
            return ListenerList;
        })();
        /**
         * @class WOZLLA.event.EventDispatcher
         * Base class for bubblable event system
         *
         */
        var EventDispatcher = (function () {
            function EventDispatcher() {
                this._captureDict = {};
                this._bubbleDict = {};
            }
            /**
             * @method setBubbleParent
             * set bubble parent of this dispatcher
             * @param {WOZLLA.event.EventDispatcher} bubbleParent
             */
            EventDispatcher.prototype.setBubbleParent = function (bubbleParent) {
                this._bubbleParent = bubbleParent;
            };
            /**
             * @method hasListener
             * @param {string} type
             * @param {boolean} useCapture true to check capture phase, false to check bubble and target phases.
             */
            EventDispatcher.prototype.hasListener = function (type, useCapture) {
                if (useCapture === void 0) { useCapture = false; }
                return this._getListenerList(type, useCapture).length() > 0;
            };
            /**
             * @method getListenerCount
             * @param {string} type
             * @param {boolean} useCapture true to check capture phase, false to check bubble and target phases.
             * @returns {number}
             */
            EventDispatcher.prototype.getListenerCount = function (type, useCapture) {
                return this._getListenerList(type, useCapture).length();
            };
            /**
             * @method addListener
             * @param {string} type
             * @param {boolean} useCapture true to check capture phase, false to check bubble and target phases.
             */
            EventDispatcher.prototype.addListener = function (type, listener, useCapture) {
                if (useCapture === void 0) { useCapture = false; }
                this._getListenerList(type, useCapture).add(listener);
            };
            /**
             * @method removeListener
             * @param {string} type
             * @param {boolean} useCapture true to check capture phase, false to check bubble and target phases.
             */
            EventDispatcher.prototype.removeListener = function (type, listener, useCapture) {
                if (useCapture === void 0) { useCapture = false; }
                return this._getListenerList(type, useCapture).remove(listener);
            };
            /**
             * @method clearListeners
             * @param {string} type
             * @param {boolean} useCapture true to check capture phase, false to check bubble and target phases.
             */
            EventDispatcher.prototype.clearListeners = function (type, useCapture) {
                this._getListenerList(type, useCapture).clear();
            };
            /**
             * @method clearAllListeners
             *  clear all listeners
             */
            EventDispatcher.prototype.clearAllListeners = function () {
                this._captureDict = {};
                this._bubbleDict = {};
            };
            /**
             * @method dispatch an event
             * @param {WOZLLA.event.Event} event
             */
            EventDispatcher.prototype.dispatchEvent = function (event) {
                var i, len, ancients, ancient;
                event._target = this;
                if (!event.bubbles) {
                    this._dispatchEventInPhase(event, 2 /* TARGET */);
                    return;
                }
                ancients = this._getAncients();
                len = ancients.length;
                for (i = len - 1; i >= 0; i--) {
                    ancient = ancients[i];
                    if (ancient._dispatchEventInPhase(event, 0 /* CAPTURE */)) {
                        return;
                    }
                }
                if (this._dispatchEventInPhase(event, 0 /* CAPTURE */)) {
                    return;
                }
                if (this._dispatchEventInPhase(event, 2 /* TARGET */)) {
                    return;
                }
                for (i = 0; i < len; i++) {
                    ancient = ancients[i];
                    if (ancient._dispatchEventInPhase(event, 1 /* BUBBLE */)) {
                        return;
                    }
                }
            };
            EventDispatcher.prototype._dispatchEventInPhase = function (event, phase) {
                var i, len;
                var listener;
                var listenerList;
                event._eventPhase = phase;
                event._listenerRemove = false;
                event._currentTarget = this;
                listenerList = this._getListenerList(event.type, phase === 0 /* CAPTURE */);
                len = listenerList.length();
                if (len > 0) {
                    for (i = len - 1; i >= 0; i--) {
                        listener = listenerList.get(i);
                        listener(event);
                        // handle remove listener when client call event.removeCurrentListener();
                        if (event._listenerRemove) {
                            event._listenerRemove = false;
                            listenerList.removeAt(i);
                        }
                        if (event.isStopImmediatePropagation()) {
                            return true;
                        }
                    }
                    if (event.isStopPropagation()) {
                        return true;
                    }
                }
                return false;
            };
            EventDispatcher.prototype._getAncients = function () {
                var ancients = [];
                var parent = this;
                while (parent._bubbleParent) {
                    parent = parent._bubbleParent;
                    ancients.push(parent);
                }
                return ancients;
            };
            EventDispatcher.prototype._getListenerList = function (type, useCapture) {
                var listenerList;
                var dict = useCapture ? this._captureDict : this._bubbleDict;
                listenerList = dict[type];
                if (!listenerList) {
                    listenerList = new ListenerList();
                    dict[type] = listenerList;
                }
                return listenerList;
            };
            return EventDispatcher;
        })();
        _event.EventDispatcher = EventDispatcher;
    })(event = WOZLLA.event || (WOZLLA.event = {}));
})(WOZLLA || (WOZLLA = {}));
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../event/EventDispatcher.ts"/>
/// <reference path="../event/Event.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var assets;
    (function (assets) {
        /**
         * Base class of all assets in WOZLLA engine.
         * an asset contains a reference count which increase by **retain** function,
         * decrease by **release** function.
         * an asset would be unload when reference count reach 0.
         * @class WOZLLA.assets.Asset
         * @extends WOZLLA.event.EventDispatcher
         * @abstract
         */
        var Asset = (function (_super) {
            __extends(Asset, _super);
            function Asset(src) {
                _super.call(this);
                this._refCount = 0;
                this._src = src;
            }
            Object.defineProperty(Asset.prototype, "src", {
                /**
                 * @property {string} src
                 * @readonly
                 */
                get: function () {
                    return this._src;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * retain this asset
             */
            Asset.prototype.retain = function () {
                this._refCount++;
            };
            /**
             * release this asset
             * @param {boolean} [decreaceRefCount=true]
             */
            Asset.prototype.release = function (decreaceRefCount) {
                if (decreaceRefCount === void 0) { decreaceRefCount = true; }
                if (decreaceRefCount) {
                    if (this._refCount > 0) {
                        this._refCount--;
                    }
                }
                if (this._refCount === 0) {
                    this.unload();
                }
            };
            /**
             * load this asset
             * @param onSuccess
             * @param onError
             */
            Asset.prototype.load = function (onSuccess, onError) {
                onSuccess();
            };
            /**
             * unload this asset
             * @fires unload event
             */
            Asset.prototype.unload = function () {
                var event = new WOZLLA.event.Event(Asset.EVENT_UNLOAD, false);
                event.target = event.currentTarget = this;
                this.dispatchEvent(event);
            };
            Asset.EVENT_UNLOAD = 'unload';
            return Asset;
        })(WOZLLA.event.EventDispatcher);
        assets.Asset = Asset;
    })(assets = WOZLLA.assets || (WOZLLA.assets = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var assets;
    (function (assets) {
        /**
         * an singleton class for asset loading and asset management
         * @class WOZLLA.assets.AssetLoader
         * @singleton
         */
        var AssetLoader = (function () {
            function AssetLoader() {
                this._loadedAssets = {};
                this._loadingUnits = {};
            }
            /**
             * return the singleton of this class
             * @method getInstance
             * @static
             * @returns {WOZLLA.assets.AssetLoader}
             */
            AssetLoader.getInstance = function () {
                if (!AssetLoader.instance) {
                    AssetLoader.instance = new AssetLoader();
                }
                return AssetLoader.instance;
            };
            /**
             * get an asset by src
             * @param src
             * @returns {any}
             */
            AssetLoader.prototype.getAsset = function (src) {
                return this._loadedAssets[src];
            };
            /**
             * add asset to asset loader, the asset would be auto removed when unloaded.
             * @param asset
             */
            AssetLoader.prototype.addAsset = function (asset) {
                var _this = this;
                this._loadedAssets[asset.src] = asset;
                asset.addListener(assets.Asset.EVENT_UNLOAD, function (e) {
                    e.removeCurrentListener();
                    _this.removeAsset(asset);
                });
            };
            /**
             * remove asset from asset loader
             * @param asset
             */
            AssetLoader.prototype.removeAsset = function (asset) {
                delete this._loadedAssets[asset.src];
            };
            /**
             * load all asset
             * @param items
             */
            AssetLoader.prototype.loadAll = function (items) {
                var item, i, len;
                for (i = 0, len = items.length; i < len; i++) {
                    item = items[i];
                    this.load(item.src, item.AssetClass, item.callback);
                }
            };
            /**
             * load an asset by src, AssetClass(constructor/factory)
             * @param src
             * @param AssetClass
             * @param callback
             */
            AssetLoader.prototype.load = function (src, AssetClass, callback) {
                var _this = this;
                var asset, loadUnit;
                asset = this._loadedAssets[src];
                if (asset) {
                    callback && callback();
                    return;
                }
                loadUnit = this._loadingUnits[src];
                if (loadUnit) {
                    loadUnit.addCallback(callback, callback);
                    return;
                }
                asset = (new AssetClass(src));
                loadUnit = new LoadUnit(src);
                loadUnit.addCallback(callback, callback);
                this._loadingUnits[src] = loadUnit;
                asset.load(function () {
                    delete _this._loadingUnits[src];
                    _this.addAsset(asset);
                    loadUnit.complete(null, asset);
                }, function (error) {
                    console.log(error);
                    delete _this._loadingUnits[src];
                    loadUnit.complete(error);
                });
            };
            return AssetLoader;
        })();
        assets.AssetLoader = AssetLoader;
        var LoadUnit = (function () {
            function LoadUnit(src) {
                this.callbacks = [];
                this.src = src;
            }
            LoadUnit.prototype.addCallback = function (onSuccess, onError) {
                this.callbacks.push({
                    onSuccess: onSuccess,
                    onError: onError
                });
            };
            LoadUnit.prototype.complete = function (error, asset) {
                this.callbacks.forEach(function (callback) {
                    if (error) {
                        callback.onError && callback.onError(error);
                    }
                    else {
                        callback.onSuccess && callback.onSuccess(asset);
                    }
                });
            };
            return LoadUnit;
        })();
    })(assets = WOZLLA.assets || (WOZLLA.assets = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        var ITexture;
        (function (ITexture) {
            /**
             * @property DOC
             * @readonly
             * @static
             * @member WOZLLA.renderer.ITexture
             */
            ITexture.DOC = 'DOC';
        })(ITexture = renderer.ITexture || (renderer.ITexture = {}));
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        var IRenderer;
        (function (IRenderer) {
            /**
             * @property DOC
             * @readonly
             * @static
             * @member WOZLLA.renderer.IRenderer
             */
            IRenderer.DOC = 'DOC';
        })(IRenderer = renderer.IRenderer || (renderer.IRenderer = {}));
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var math;
    (function (math) {
        /**
         * @class WOZLLA.math.Matrix
         * a util class for 2d matrix
         */
        var Matrix = (function () {
            function Matrix() {
                /**
                 * get values of this matrix
                 * @property {Float32Array} values
                 * @readonly
                 */
                this.values = new Float32Array(9);
                this.identity();
            }
            /**
             * apply from another matrix
             * @param matrix
             */
            Matrix.prototype.applyMatrix = function (matrix) {
                this.values.set(matrix.values);
            };
            /**
             * identify this matrix
             */
            Matrix.prototype.identity = function () {
                this.values[0] = 1; // a
                this.values[1] = 0; // b
                this.values[2] = 0;
                this.values[3] = 0; // c
                this.values[4] = 1; // d
                this.values[5] = 0;
                this.values[6] = 0; // tx
                this.values[7] = 0; // ty
                this.values[8] = 1;
            };
            /**
             * invert this matrix
             */
            Matrix.prototype.invert = function () {
                var a1 = this.values[0];
                var b1 = this.values[1];
                var c1 = this.values[3];
                var d1 = this.values[4];
                var tx1 = this.values[6];
                var ty1 = this.values[7];
                var n = a1 * d1 - b1 * c1;
                this.values[0] = d1 / n;
                this.values[1] = -b1 / n;
                this.values[3] = -c1 / n;
                this.values[4] = a1 / n;
                this.values[6] = (c1 * ty1 - d1 * tx1) / n;
                this.values[7] = -(a1 * ty1 - b1 * tx1) / n;
            };
            /**
             * prepend 2d params to this matrix
             * @param a
             * @param b
             * @param c
             * @param d
             * @param tx
             * @param ty
             */
            Matrix.prototype.prepend = function (a, b, c, d, tx, ty) {
                var a1, b1, c1, d1;
                var values = this.values;
                var tx1 = values[6];
                var ty1 = values[7];
                if (a != 1 || b != 0 || c != 0 || d != 1) {
                    a1 = values[0];
                    b1 = values[1];
                    c1 = values[3];
                    d1 = values[4];
                    values[0] = a1 * a + b1 * c;
                    values[1] = a1 * b + b1 * d;
                    values[3] = c1 * a + d1 * c;
                    values[4] = c1 * b + d1 * d;
                }
                values[6] = tx1 * a + ty1 * c + tx;
                values[7] = tx1 * b + ty1 * d + ty;
            };
            /**
             * append 2d params to this matrix
             * @param a
             * @param b
             * @param c
             * @param d
             * @param tx
             * @param ty
             */
            Matrix.prototype.append = function (a, b, c, d, tx, ty) {
                var a1, b1, c1, d1;
                var values = this.values;
                a1 = values[0];
                b1 = values[1];
                c1 = values[3];
                d1 = values[4];
                values[0] = a * a1 + b * c1;
                values[1] = a * b1 + b * d1;
                values[3] = c * a1 + d * c1;
                values[4] = c * b1 + d * d1;
                values[6] = tx * a1 + ty * c1 + values[6];
                values[7] = tx * b1 + ty * d1 + values[7];
            };
            /**
             * prepend 2d transform params to this matrix
             * @param x
             * @param y
             * @param scaleX
             * @param scaleY
             * @param rotation
             * @param skewX
             * @param skewY
             * @param regX
             * @param regY
             * @returns {WOZLLA.math.Matrix}
             */
            Matrix.prototype.prependTransform = function (x, y, scaleX, scaleY, rotation, skewX, skewY, regX, regY) {
                if (rotation % 360) {
                    var r = rotation * Matrix.DEG_TO_RAD;
                    var cos = Math.cos(r);
                    var sin = Math.sin(r);
                }
                else {
                    cos = 1;
                    sin = 0;
                }
                if (regX || regY) {
                    this.values[6] -= regX;
                    this.values[7] -= regY;
                }
                if (skewX || skewY) {
                    skewX *= Matrix.DEG_TO_RAD;
                    skewY *= Matrix.DEG_TO_RAD;
                    this.prepend(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, 0, 0);
                    this.prepend(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), x, y);
                }
                else {
                    this.prepend(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y);
                }
                return this;
            };
            /**
             * append 2d transform params to this matrix
             * @param x
             * @param y
             * @param scaleX
             * @param scaleY
             * @param rotation
             * @param skewX
             * @param skewY
             * @param regX
             * @param regY
             * @returns {WOZLLA.math.Matrix}
             */
            Matrix.prototype.appendTransform = function (x, y, scaleX, scaleY, rotation, skewX, skewY, regX, regY) {
                if (rotation % 360) {
                    var r = rotation * Matrix.DEG_TO_RAD;
                    var cos = Math.cos(r);
                    var sin = Math.sin(r);
                }
                else {
                    cos = 1;
                    sin = 0;
                }
                if (skewX || skewY) {
                    skewX *= Matrix.DEG_TO_RAD;
                    skewY *= Matrix.DEG_TO_RAD;
                    this.append(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), x, y);
                    this.append(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, 0, 0);
                }
                else {
                    this.append(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y);
                }
                if (regX || regY) {
                    // prepend the registration offset:
                    this.values[6] -= regX * this.values[0] + regY * this.values[3];
                    this.values[7] -= regX * this.values[1] + regY * this.values[4];
                }
                return this;
            };
            /**
             * @property DEG_TO_RAD
             * @member WOZLLA.math.Matrix
             * @readonly
             * @static
             */
            Matrix.DEG_TO_RAD = Math.PI / 180;
            return Matrix;
        })();
        math.Matrix = Matrix;
    })(math = WOZLLA.math || (WOZLLA.math = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var utils;
    (function (utils) {
        var Tween = (function () {
            function Tween(target, props, pluginData) {
                this._target = null;
                this._useTicks = false;
                this.ignoreGlobalPause = false;
                this.loop = false;
                this.pluginData = null;
                this._steps = null;
                this._actions = null;
                this.paused = false;
                this.duration = 0;
                this._prevPos = -1;
                this.position = null;
                this._prevPosition = 0;
                this._stepPosition = 0;
                this.passive = false;
                this.initialize(target, props, pluginData);
            }
            Tween.get = function (target, props, pluginData, override) {
                if (props === void 0) { props = null; }
                if (pluginData === void 0) { pluginData = null; }
                if (override === void 0) { override = false; }
                if (override) {
                    Tween.removeTweens(target);
                }
                return new Tween(target, props, pluginData);
            };
            Tween.removeTweens = function (target) {
                if (!target.tween_count) {
                    return;
                }
                var tweens = Tween._tweens;
                for (var i = tweens.length - 1; i >= 0; i--) {
                    if (tweens[i]._target == target) {
                        tweens[i].paused = true;
                        tweens.splice(i, 1);
                    }
                }
                target.tween_count = 0;
            };
            Tween.tick = function (delta, paused) {
                if (paused === void 0) { paused = false; }
                var tweens = Tween._tweens.concat();
                for (var i = tweens.length - 1; i >= 0; i--) {
                    var tween = tweens[i];
                    if ((paused && !tween.ignoreGlobalPause) || tween.paused) {
                        continue;
                    }
                    tween.tick(tween._useTicks ? 1 : delta);
                }
            };
            Tween._register = function (tween, value) {
                var target = tween._target;
                var tweens = Tween._tweens;
                if (value) {
                    if (target) {
                        target.tween_count = target.tween_count ? target.tween_count + 1 : 1;
                    }
                    tweens.push(tween);
                }
                else {
                    if (target) {
                        target.tween_count--;
                    }
                    var i = tweens.length;
                    while (i--) {
                        if (tweens[i] == tween) {
                            tweens.splice(i, 1);
                            return;
                        }
                    }
                }
            };
            Tween.removeAllTweens = function () {
                var tweens = Tween._tweens;
                for (var i = 0, l = tweens.length; i < l; i++) {
                    var tween = tweens[i];
                    tween.paused = true;
                    tween._target.tweenjs_count = 0;
                }
                tweens.length = 0;
            };
            Tween.prototype.initialize = function (target, props, pluginData) {
                this._target = target;
                if (props) {
                    this._useTicks = props.useTicks;
                    this.ignoreGlobalPause = props.ignoreGlobalPause;
                    this.loop = props.loop;
                    //                props.onChange && this.addEventListener("change", props.onChange, props.onChangeObj);
                    if (props.override) {
                        Tween.removeTweens(target);
                    }
                }
                this.pluginData = pluginData || {};
                this._curQueueProps = {};
                this._initQueueProps = {};
                this._steps = [];
                this._actions = [];
                if (props && props.paused) {
                    this.paused = true;
                }
                else {
                    Tween._register(this, true);
                }
                if (props && props.position != null) {
                    this.setPosition(props.position, Tween.NONE);
                }
            };
            Tween.prototype.setPosition = function (value, actionsMode) {
                if (actionsMode === void 0) { actionsMode = 1; }
                if (value < 0) {
                    value = 0;
                }
                var t = value;
                var end = false;
                if (t >= this.duration) {
                    if (this.loop) {
                        t = t % this.duration;
                    }
                    else {
                        t = this.duration;
                        end = true;
                    }
                }
                if (t == this._prevPos) {
                    return end;
                }
                var prevPos = this._prevPos;
                this.position = this._prevPos = t;
                this._prevPosition = value;
                if (this._target) {
                    if (end) {
                        this._updateTargetProps(null, 1);
                    }
                    else if (this._steps.length > 0) {
                        for (var i = 0, l = this._steps.length; i < l; i++) {
                            if (this._steps[i].t > t) {
                                break;
                            }
                        }
                        var step = this._steps[i - 1];
                        this._updateTargetProps(step, (this._stepPosition = t - step.t) / step.d);
                    }
                }
                if (actionsMode != 0 && this._actions.length > 0) {
                    if (this._useTicks) {
                        this._runActions(t, t);
                    }
                    else if (actionsMode == 1 && t < prevPos) {
                        if (prevPos != this.duration) {
                            this._runActions(prevPos, this.duration);
                        }
                        this._runActions(0, t, true);
                    }
                    else {
                        this._runActions(prevPos, t);
                    }
                }
                if (end) {
                    this.setPaused(true);
                }
                //            this.dispatchEventWith("change");
                return end;
            };
            Tween.prototype._runActions = function (startPos, endPos, includeStart) {
                if (includeStart === void 0) { includeStart = false; }
                var sPos = startPos;
                var ePos = endPos;
                var i = -1;
                var j = this._actions.length;
                var k = 1;
                if (startPos > endPos) {
                    sPos = endPos;
                    ePos = startPos;
                    i = j;
                    j = k = -1;
                }
                while ((i += k) != j) {
                    var action = this._actions[i];
                    var pos = action.t;
                    if (pos == ePos || (pos > sPos && pos < ePos) || (includeStart && pos == startPos)) {
                        action.f.apply(action.o, action.p);
                    }
                }
            };
            Tween.prototype._updateTargetProps = function (step, ratio) {
                var p0, p1, v, v0, v1, arr;
                if (!step && ratio == 1) {
                    this.passive = false;
                    p0 = p1 = this._curQueueProps;
                }
                else {
                    this.passive = !!step.v;
                    if (this.passive) {
                        return;
                    }
                    if (step.e) {
                        ratio = step.e(ratio, 0, 1, 1);
                    }
                    p0 = step.p0;
                    p1 = step.p1;
                }
                for (var n in this._initQueueProps) {
                    if ((v0 = p0[n]) == null) {
                        p0[n] = v0 = this._initQueueProps[n];
                    }
                    if ((v1 = p1[n]) == null) {
                        p1[n] = v1 = v0;
                    }
                    if (v0 == v1 || ratio == 0 || ratio == 1 || (typeof (v0) != "number")) {
                        v = ratio == 1 ? v1 : v0;
                    }
                    else {
                        v = v0 + (v1 - v0) * ratio;
                    }
                    var ignore = false;
                    if (arr = Tween._plugins[n]) {
                        for (var i = 0, l = arr.length; i < l; i++) {
                            var v2 = arr[i].tween(this, n, v, p0, p1, ratio, !!step && p0 == p1, !step);
                            if (v2 == Tween.IGNORE) {
                                ignore = true;
                            }
                            else {
                                v = v2;
                            }
                        }
                    }
                    if (!ignore) {
                        this._target[n] = v;
                    }
                }
            };
            Tween.prototype.setPaused = function (value) {
                this.paused = value;
                Tween._register(this, !value);
                return this;
            };
            Tween.prototype._cloneProps = function (props) {
                var o = {};
                for (var n in props) {
                    o[n] = props[n];
                }
                return o;
            };
            Tween.prototype._addStep = function (o) {
                if (o.d > 0) {
                    this._steps.push(o);
                    o.t = this.duration;
                    this.duration += o.d;
                }
                return this;
            };
            Tween.prototype._appendQueueProps = function (o) {
                var arr, oldValue, i, l, injectProps;
                for (var n in o) {
                    if (this._initQueueProps[n] === undefined) {
                        oldValue = this._target[n];
                        if (arr = Tween._plugins[n]) {
                            for (i = 0, l = arr.length; i < l; i++) {
                                oldValue = arr[i].init(this, n, oldValue);
                            }
                        }
                        this._initQueueProps[n] = this._curQueueProps[n] = (oldValue === undefined) ? null : oldValue;
                    }
                    else {
                        oldValue = this._curQueueProps[n];
                    }
                }
                for (var n in o) {
                    oldValue = this._curQueueProps[n];
                    if (arr = Tween._plugins[n]) {
                        injectProps = injectProps || {};
                        for (i = 0, l = arr.length; i < l; i++) {
                            if (arr[i].step) {
                                arr[i].step(this, n, oldValue, o[n], injectProps);
                            }
                        }
                    }
                    this._curQueueProps[n] = o[n];
                }
                if (injectProps) {
                    this._appendQueueProps(injectProps);
                }
                return this._curQueueProps;
            };
            Tween.prototype._addAction = function (o) {
                o.t = this.duration;
                this._actions.push(o);
                return this;
            };
            Tween.prototype._set = function (props, o) {
                for (var n in props) {
                    o[n] = props[n];
                }
            };
            Tween.prototype.wait = function (duration, passive) {
                if (passive === void 0) { passive = false; }
                if (duration == null || duration <= 0) {
                    return this;
                }
                var o = this._cloneProps(this._curQueueProps);
                return this._addStep({ d: duration, p0: o, p1: o, v: passive });
            };
            Tween.prototype.to = function (props, duration, ease) {
                if (ease === void 0) { ease = undefined; }
                if (isNaN(duration) || duration < 0) {
                    duration = 0;
                }
                return this._addStep({ d: duration || 0, p0: this._cloneProps(this._curQueueProps), e: ease, p1: this._cloneProps(this._appendQueueProps(props)) });
            };
            Tween.prototype.call = function (callback, thisObj, params) {
                if (thisObj === void 0) { thisObj = undefined; }
                if (params === void 0) { params = undefined; }
                if (!callback) {
                    callback = function () {
                    };
                }
                return this._addAction({ f: callback, p: params ? params : [this], o: thisObj ? thisObj : this._target });
            };
            Tween.prototype.set = function (props, target) {
                if (target === void 0) { target = null; }
                return this._addAction({ f: this._set, o: this, p: [props, target ? target : this._target] });
            };
            Tween.prototype.play = function (tween) {
                if (!tween) {
                    tween = this;
                }
                return this.call(tween.setPaused, [false], tween);
            };
            Tween.prototype.pause = function (tween) {
                if (!tween) {
                    tween = this;
                }
                return this.call(tween.setPaused, [true], tween);
            };
            Tween.prototype.tick = function (delta) {
                if (this.paused) {
                    return;
                }
                this.setPosition(this._prevPosition + delta);
            };
            Tween.NONE = 0;
            Tween.LOOP = 1;
            Tween.REVERSE = 2;
            Tween._tweens = [];
            Tween.IGNORE = {};
            Tween._plugins = {};
            Tween._inited = false;
            return Tween;
        })();
        utils.Tween = Tween;
    })(utils = WOZLLA.utils || (WOZLLA.utils = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../math/Matrix.ts"/>
/// <reference path="../utils/Tween.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var helpMatrix = new WOZLLA.math.Matrix();
    /**
     * this class define the position, scale, rotation and about transform information of {@link WOZLLA.GameObject}
     * @class WOZLLA.Transform
     */
    var Transform = (function () {
        function Transform() {
            /**
             * @property {WOZLLA.math.Matrix} worldMatrix
             * @readonly
             */
            this.worldMatrix = new WOZLLA.math.Matrix();
            /**
             * specify this tranform
             * @type {boolean}
             */
            this.useGLCoords = false;
            this._relative = true;
            this._dirty = false;
            this._values = new Array(9);
            this.reset();
        }
        Object.defineProperty(Transform.prototype, "x", {
            get: function () {
                return this._values[0];
            },
            set: function (value) {
                this._values[0] = value;
                this._dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "y", {
            get: function () {
                return this._values[1];
            },
            set: function (value) {
                this._values[1] = value;
                this._dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "rotation", {
            get: function () {
                return this._values[4];
            },
            set: function (value) {
                this._values[4] = value;
                this._dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "scaleX", {
            get: function () {
                return this._values[5];
            },
            set: function (value) {
                this._values[5] = value;
                this._dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "scaleY", {
            get: function () {
                return this._values[6];
            },
            set: function (value) {
                this._values[6] = value;
                this._dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "skewX", {
            get: function () {
                return this._values[7];
            },
            set: function (value) {
                this._values[7] = value;
                this._dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "skewY", {
            get: function () {
                return this._values[8];
            },
            set: function (value) {
                this._values[8] = value;
                this._dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "relative", {
            get: function () {
                return this._relative;
            },
            set: function (relative) {
                this._relative = relative;
                this._dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "dirty", {
            get: function () {
                return this._dirty;
            },
            set: function (value) {
                this._dirty = value;
            },
            enumerable: true,
            configurable: true
        });
        Transform.prototype.setPosition = function (x, y) {
            this._values[0] = x;
            this._values[1] = y;
            this._dirty = true;
        };
        Transform.prototype.setAnchor = function (anchorX, anchorY) {
            this._values[2] = anchorX;
            this._values[3] = anchorY;
            this._dirty = true;
        };
        Transform.prototype.setRotation = function (rotation) {
            this._values[4] = rotation;
            this._dirty = true;
        };
        Transform.prototype.setScale = function (scaleX, scaleY) {
            this._values[5] = scaleX;
            this._values[6] = scaleY;
            this._dirty = true;
        };
        Transform.prototype.setSkew = function (skewX, skewY) {
            this._values[7] = skewX;
            this._values[8] = skewY;
            this._dirty = true;
        };
        Transform.prototype.reset = function () {
            this._values[0] = 0; // x
            this._values[1] = 0; // y
            this._values[2] = 0; // @deprecated
            this._values[3] = 0; // @deprecated
            this._values[4] = 0; // rotation
            this._values[5] = 1; // scaleX
            this._values[6] = 1; // scaleY
            this._values[7] = 0; // skewX
            this._values[8] = 0; // skewY
        };
        Transform.prototype.set = function (transform) {
            if (typeof transform.x === "number") {
                this._values[0] = transform.x; //x
            }
            if (typeof transform.y === "number") {
                this._values[1] = transform.y; // y
            }
            if (typeof transform.rotation === 'number') {
                this._values[4] = transform.rotation; // rotation
            }
            if (typeof transform.scaleX === 'number') {
                this._values[5] = transform.scaleX; // scaleX
            }
            if (typeof transform.scaleY === 'number') {
                this._values[6] = transform.scaleY; // scaleY
            }
            if (typeof transform.skewX === 'number') {
                this._values[7] = transform.skewX; // skewX
            }
            if (typeof transform.skewY === 'number') {
                this._values[8] = transform.skewY; // skewY
            }
            if (typeof transform.relative !== 'undefined') {
                this._relative = transform.relative;
            }
            this._dirty = true;
        };
        Transform.prototype.transform = function (parentTransform) {
            if (parentTransform === void 0) { parentTransform = null; }
            var cos, sin, r;
            var matrix;
            var worldMatrix = this.worldMatrix;
            var x = this._values[0];
            var y = this._values[1];
            var rotation = this._values[4];
            var scaleX = this._values[5];
            var scaleY = this._values[6];
            var skewX = this._values[7];
            var skewY = this._values[8];
            if (this.useGLCoords) {
                skewX += 180;
            }
            if (parentTransform && this._relative) {
                worldMatrix.applyMatrix(parentTransform.worldMatrix);
            }
            else {
                //                worldMatrix.identity();
                //                parentTransform = Director.getInstance().getStage().transform;
                // if this is the transform of stage
                if (this === parentTransform) {
                    worldMatrix.identity();
                }
                else {
                    worldMatrix.applyMatrix(parentTransform.worldMatrix);
                }
            }
            if (this.__local_matrix) {
                matrix = this.__local_matrix;
                worldMatrix.append(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
                this._dirty = false;
                return;
            }
            if (rotation % 360) {
                r = rotation * Transform.DEG_TO_RAD;
                cos = Math.cos(r);
                sin = Math.sin(r);
            }
            else {
                cos = 1;
                sin = 0;
            }
            if (skewX || skewY) {
                skewX *= Transform.DEG_TO_RAD;
                skewY *= Transform.DEG_TO_RAD;
                worldMatrix.append(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), x, y);
                worldMatrix.append(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, 0, 0);
            }
            else {
                worldMatrix.append(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y);
            }
            this._dirty = false;
        };
        Transform.prototype.updateWorldMatrix = function () {
            if (!this._dirty) {
                return;
            }
            var matrix = this.worldMatrix;
            if (matrix) {
                matrix.identity();
            }
            else {
                matrix = new WOZLLA.math.Matrix();
            }
            var o = this;
            while (o != null) {
                matrix.prependTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, 0, 0);
                o = o.parent;
            }
        };
        Transform.prototype.globalToLocal = function (x, y, updateMatrix) {
            if (updateMatrix === void 0) { updateMatrix = false; }
            if (updateMatrix) {
                this.updateWorldMatrix();
            }
            helpMatrix.applyMatrix(this.worldMatrix);
            helpMatrix.invert();
            helpMatrix.append(1, 0, 0, 1, x, y);
            return {
                x: helpMatrix.values[6],
                y: helpMatrix.values[7]
            };
        };
        Transform.prototype.localToGlobal = function (x, y, updateMatrix) {
            if (updateMatrix === void 0) { updateMatrix = false; }
            if (updateMatrix) {
                this.updateWorldMatrix();
            }
            helpMatrix.applyMatrix(this.worldMatrix);
            helpMatrix.append(1, 0, 0, 1, x, y);
            return {
                x: helpMatrix.values[6],
                y: helpMatrix.values[7]
            };
        };
        Transform.prototype.tween = function (override) {
            return WOZLLA.utils.Tween.get(this, null, null, override);
        };
        Transform.prototype.clearTweens = function () {
            return WOZLLA.utils.Tween.removeTweens(this);
        };
        /**
         * @property {number} DEG_TO_RAD
         * @readonly
         * @static
         */
        Transform.DEG_TO_RAD = Math.PI / 180;
        return Transform;
    })();
    WOZLLA.Transform = Transform;
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Transform.ts"/>
var WOZLLA;
(function (WOZLLA) {
    /**
     * RectTransform is a subclass of {@link WOZLLA.Transform}, define a rect region
     * for {@WOZLLA.GameObject} and a anchor mode to specify how to related to it's parent.
     * @class WOZLLA.RectTransform
     */
    var RectTransform = (function (_super) {
        __extends(RectTransform, _super);
        function RectTransform() {
            _super.apply(this, arguments);
            this._width = 0;
            this._height = 0;
            this._top = 0;
            this._left = 0;
            this._right = 0;
            this._bottom = 0;
            this._px = 0;
            this._py = 0;
            this._anchorMode = RectTransform.ANCHOR_CENTER | RectTransform.ANCHOR_MIDDLE;
        }
        Object.defineProperty(RectTransform.prototype, "width", {
            /**
             * get or set width, this property only effect on fixed size mode
             * @property {number} width
             */
            get: function () {
                return this._width;
            },
            set: function (value) {
                if (this._width === value)
                    return;
                this._width = value;
                this.dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RectTransform.prototype, "height", {
            /**
             * get or set height, this property only effect on fixed size mode
             * @property {number} height
             */
            get: function () {
                return this._height;
            },
            set: function (value) {
                if (this._height === value)
                    return;
                this._height = value;
                this.dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RectTransform.prototype, "top", {
            /**
             * get or set top
             * @property {number} top
             */
            get: function () {
                return this._top;
            },
            set: function (value) {
                if (this._top === value)
                    return;
                this._top = value;
                this.dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RectTransform.prototype, "left", {
            /**
             * get or set left
             * @property {number} left
             */
            get: function () {
                return this._left;
            },
            set: function (value) {
                if (this._left === value)
                    return;
                this._left = value;
                this.dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RectTransform.prototype, "right", {
            /**
             * get or set right
             * @property {number} right
             */
            get: function () {
                return this._right;
            },
            set: function (value) {
                if (this._right === value)
                    return;
                this._right = value;
                this.dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RectTransform.prototype, "bottom", {
            /**
             * get or set bottom
             * @property {number} bottom
             */
            get: function () {
                return this._bottom;
            },
            set: function (value) {
                if (this._bottom === value)
                    return;
                this._bottom = value;
                this.dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RectTransform.prototype, "px", {
            /**
             * get or set px, this only effect on strengthen mode
             * @property {number} px specify x coords
             */
            get: function () {
                return this._px;
            },
            set: function (value) {
                if (this._px === value)
                    return;
                this._px = value;
                this.dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RectTransform.prototype, "py", {
            /**
             * get or set py, this only effect on strengthen mode
             * @property {number} py specify y coords
             */
            get: function () {
                return this._py;
            },
            set: function (value) {
                if (this._py === value)
                    return;
                this._py = value;
                this.dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RectTransform.prototype, "anchorMode", {
            /**
             * get or set anchor mode
             * @property {number} anchorMode
             */
            get: function () {
                return this._anchorMode;
            },
            set: function (value) {
                if (this._anchorMode === value)
                    return;
                this._anchorMode = value;
                this.dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * set rect transform
         * @param {WOZLLA.RectTransform} rectTransform
         */
        RectTransform.prototype.set = function (rectTransform) {
            this._anchorMode = rectTransform.anchorMode;
            this._width = rectTransform.width || 0;
            this._height = rectTransform.height || 0;
            this._top = rectTransform.top || 0;
            this._left = rectTransform.left || 0;
            this._right = rectTransform.right || 0;
            this._bottom = rectTransform.bottom || 0;
            this._px = rectTransform.px || 0;
            this._px = rectTransform.py || 0;
            this.dirty = true;
        };
        /**
         * transform with parent transform
         * @param {WOZLLA.Transform} parentTransform
         */
        RectTransform.prototype.transform = function (parentTransform) {
            if (parentTransform === void 0) { parentTransform = null; }
            var m, R, p;
            if (!parentTransform || !this._relative || !(parentTransform instanceof RectTransform)) {
                p = WOZLLA.Director.getInstance().viewRectTransform;
            }
            else {
                p = parentTransform;
            }
            m = this._anchorMode;
            R = RectTransform;
            if ((m & R.ANCHOR_LEFT) === R.ANCHOR_LEFT) {
                this.x = this._px;
            }
            else if ((m & R.ANCHOR_RIGHT) === R.ANCHOR_RIGHT) {
                this.x = p._width + this._px;
            }
            else if ((m & R.ANCHOR_HORIZONTAL_STRENGTH) === R.ANCHOR_HORIZONTAL_STRENGTH) {
                this.x = this._left;
                this._width = p._width - this._left - this._right;
            }
            else {
                this.x = p._width / 2 + this._px;
            }
            if ((m & R.ANCHOR_TOP) === R.ANCHOR_TOP) {
                this.y = this._py;
            }
            else if ((m & R.ANCHOR_BOTTOM) === R.ANCHOR_BOTTOM) {
                this.y = p._height + this._py;
            }
            else if ((m & R.ANCHOR_VERTICAL_STRENGTH) === R.ANCHOR_VERTICAL_STRENGTH) {
                this.y = this._top;
                this._height = p._height - this._top - this._bottom;
            }
            else {
                this.y = p._height / 2 + this._py;
            }
            _super.prototype.transform.call(this, parentTransform);
        };
        /**
         * vertical anchor mode
         * @property {number} ANCHOR_TOP
         * @readonly
         * @static
         */
        RectTransform.ANCHOR_TOP = 0x1;
        /**
         * vertical anchor mode
         * @property {number} ANCHOR_MIDDLE
         * @readonly
         * @static
         */
        RectTransform.ANCHOR_MIDDLE = 0x10;
        /**
         * vertical anchor mode
         * @property {number} ANCHOR_BOTTOM
         * @readonly
         * @static
         */
        RectTransform.ANCHOR_BOTTOM = 0x100;
        /**
         * vertical anchor mode
         * @property {number} ANCHOR_VERTICAL_STRENGTH
         * @readonly
         * @static
         */
        RectTransform.ANCHOR_VERTICAL_STRENGTH = 0x1000;
        /**
         * horizontal anchor mode
         * @property {number} ANCHOR_LEFT
         * @readonly
         * @static
         */
        RectTransform.ANCHOR_LEFT = 0x10000;
        /**
         * horizontal anchor mode
         * @property {number} ANCHOR_CENTER
         * @readonly
         * @static
         */
        RectTransform.ANCHOR_CENTER = 0x100000;
        /**
         * horizontal anchor mode
         * @property {number} ANCHOR_RIGHT
         * @readonly
         * @static
         */
        RectTransform.ANCHOR_RIGHT = 0x1000000;
        /**
         * horizontal anchor mode
         * @property {number} ANCHOR_HORIZONTAL_STRENGTH
         * @readonly
         * @static
         */
        RectTransform.ANCHOR_HORIZONTAL_STRENGTH = 0x10000000;
        return RectTransform;
    })(WOZLLA.Transform);
    WOZLLA.RectTransform = RectTransform;
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var Assert = (function () {
        function Assert() {
        }
        Assert.isTrue = function (test, msg) {
            if (msg === void 0) { msg = Assert.DEFAULT_MESSAGE; }
            if (test !== true) {
                throw new Error(msg);
            }
        };
        Assert.isFalse = function (test, msg) {
            if (msg === void 0) { msg = Assert.DEFAULT_MESSAGE; }
            if (test !== false) {
                throw new Error(msg);
            }
        };
        Assert.isTypeof = function (test, type, msg) {
            if (msg === void 0) { msg = Assert.DEFAULT_MESSAGE; }
            if (typeof test !== type) {
                throw new Error(msg);
            }
        };
        Assert.isNotTypeof = function (test, type, msg) {
            if (msg === void 0) { msg = Assert.DEFAULT_MESSAGE; }
            if (typeof test === type) {
                throw new Error(msg);
            }
        };
        Assert.isString = function (test, msg) {
            if (msg === void 0) { msg = Assert.DEFAULT_MESSAGE; }
            Assert.isTypeof(test, 'string', msg);
        };
        Assert.isObject = function (test, msg) {
            if (msg === void 0) { msg = Assert.DEFAULT_MESSAGE; }
            Assert.isTypeof(test, 'object', msg);
        };
        Assert.isUndefined = function (test, msg) {
            if (msg === void 0) { msg = Assert.DEFAULT_MESSAGE; }
            Assert.isTypeof(test, 'undefined', msg);
        };
        Assert.isNotUndefined = function (test, msg) {
            if (msg === void 0) { msg = Assert.DEFAULT_MESSAGE; }
            Assert.isNotTypeof(test, 'undefined', msg);
        };
        Assert.isFunction = function (test, msg) {
            if (msg === void 0) { msg = Assert.DEFAULT_MESSAGE; }
            Assert.isTypeof(test, 'function', msg);
        };
        Assert.DEFAULT_MESSAGE = 'Assertion Fail';
        return Assert;
    })();
    WOZLLA.Assert = Assert;
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Transform.ts"/>
/// <reference path="../utils/Assert.ts"/>
var WOZLLA;
(function (WOZLLA) {
    /**
     * Top class of all components
     * @class WOZLLA.Component
     * @extends WOZLLA.event.EventDispatcher
     * @abstract
     */
    var Component = (function (_super) {
        __extends(Component, _super);
        function Component() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(Component.prototype, "gameObject", {
            /**
             * get the GameObject of this component belongs to.
             * @property {WOZLLA.GameObject} gameObject
             * @readonly
             */
            get: function () {
                return this._gameObject;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "transform", {
            /**
             *  get transform of the gameObject of this component
             *  @property {WOZLLA.Transform} transform
             */
            get: function () {
                return this._gameObject.transform;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * init this component
         */
        Component.prototype.init = function () {
        };
        /**
         * destroy this component
         */
        Component.prototype.destroy = function () {
        };
        Component.prototype.loadAssets = function (callback) {
            callback && callback();
        };
        Component.prototype.listRequiredComponents = function () {
            return [];
        };
        /**
         * register an component class and it's configuration
         * @method register
         * @static
         * @param ctor
         * @param configuration
         */
        Component.register = function (ctor, config) {
            WOZLLA.Assert.isObject(config);
            WOZLLA.Assert.isString(config.name);
            WOZLLA.Assert.isUndefined(Component.configMap[config.name]);
            Component.ctorMap[config.name] = ctor;
            Component.configMap[config.name] = config;
        };
        Component.unregister = function (name) {
            WOZLLA.Assert.isString(name);
            WOZLLA.Assert.isNotUndefined(Component.configMap[name]);
            delete Component.ctorMap[name];
            delete Component.configMap[name];
        };
        /**
         * create component by it's registed name.
         * @param name the component name
         * @returns {WOZLLA.Component}
         */
        Component.create = function (name) {
            WOZLLA.Assert.isString(name);
            var ctor = Component.ctorMap[name];
            WOZLLA.Assert.isFunction(ctor);
            return new ctor();
        };
        Component.getConfig = function (name) {
            var config;
            WOZLLA.Assert.isString(name);
            config = Component.configMap[name];
            WOZLLA.Assert.isNotUndefined(config);
            return config;
        };
        Component.ctorMap = {};
        Component.configMap = {};
        return Component;
    })(WOZLLA.event.EventDispatcher);
    WOZLLA.Component = Component;
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Component.ts"/>
var WOZLLA;
(function (WOZLLA) {
    /**
     * abstract base class for all colliders
     * @class WOZLLA.Collider
     * @extends WOZLLA.Component
     * @abstract
     */
    var Collider = (function (_super) {
        __extends(Collider, _super);
        function Collider() {
            _super.apply(this, arguments);
        }
        /**
         * @method {boolean} containsXY
         * @param localX x coords relate to the gameObject of this collider
         * @param localY y coords relate to the gameObject of this collider
         * @returns {boolean}
         */
        Collider.prototype.collideXY = function (localX, localY) {
            return false;
        };
        Collider.prototype.collide = function (collider) {
            return false;
        };
        return Collider;
    })(WOZLLA.Component);
    WOZLLA.Collider = Collider;
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Transform.ts"/>
/// <reference path="RectTransform.ts"/>
/// <reference path="Collider.ts"/>
/// <reference path="../event/EventDispatcher.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var comparator = function (a, b) {
        return a.z - b.z;
    };
    var idMap = {};
    /**
     * GameObject is the base element in WOZLLA engine. It contains
     * many child instance of {@link WOZLLA.GameObject} and many
     * instance of {@link WOZLLA.Component}.
     * <br/>
     * <br/>
     * Tree structure of the GameObject is the core of WOZLLA engine.
     *
     * @class WOZLLA.GameObject
     * @extends WOZLLA.event.EventDispatcher
     */
    var GameObject = (function (_super) {
        __extends(GameObject, _super);
        /**
         * new a GameObject
         * @method constructor
         * @member WOZLLA.GameObject
         * @param {boolean} useRectTransform specify which transform this game object should be used.
         */
        function GameObject(useRectTransform) {
            if (useRectTransform === void 0) { useRectTransform = false; }
            _super.call(this);
            this._active = true;
            this._visible = true;
            this._initialized = false;
            this._destroyed = false;
            this._touchable = false;
            this._loadingAssets = false;
            this._name = 'GameObject';
            this._children = [];
            this._components = [];
            this._transform = useRectTransform ? new WOZLLA.RectTransform() : new WOZLLA.Transform();
            this._rectTransform = useRectTransform ? this._transform : null;
            this._z = 0;
            this._behaviours = [];
        }
        /**
         * return the GameObject with the specified id.
         * @method {WOZLLA.GameObject} getById
         * @static
         * @param id the specified id
         * @member WOZLLA.GameObject
         */
        GameObject.getById = function (id) {
            return idMap[id];
        };
        Object.defineProperty(GameObject.prototype, "id", {
            /**
             * get or set the id of this game object
             * @property {string} id
             * @member WOZLLA.GameObject
             */
            get: function () {
                return this._id;
            },
            set: function (value) {
                var oldId = this._id;
                this._id = value;
                if (oldId) {
                    delete idMap[oldId];
                }
                idMap[value] = this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "name", {
            /**
             * get or set the name of this game object
             * @property {string} name
             * @member WOZLLA.GameObject
             */
            get: function () {
                return this._name;
            },
            set: function (value) {
                this._name = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "transform", {
            /**
             * get transform of this game object
             * @property {WOZLLA.Transform} transform
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._transform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "rectTransform", {
            /**
             * get rect transform of this game object
             * @property {WOZLLA.RectTransform} rectTransform
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._rectTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "parent", {
            /**
             * get parent game object
             * @property {WOZLLA.GameObject} parent
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "children", {
            /**
             * get children of this game object
             * @property {WOZLLA.GameObject[]} children
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._children.slice(0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "childCount", {
            /**
             * get child count
             * @property {number} childCount
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._children.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "z", {
            /**
             * get or set z order of this game object, and then resort children.
             * @property {number} z
             * @member WOZLLA.GameObject
             */
            get: function () {
                return this._z;
            },
            set: function (value) {
                this.setZ(value, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "active", {
            /**
             * get or set active of this game object.
             * the update method would be call every frame when active was true, false otherwise.
             * if active is set from false to true, the transform dirty would be true.
             * @property {boolean} active
             * @member WOZLLA.GameObject
             */
            get: function () {
                return this._active;
            },
            set: function (value) {
                var oldActive = this._active;
                this._active = value;
                if (!oldActive && value) {
                    this._transform.dirty = true;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "visible", {
            /**
             * get visible of this game object.
             * the render method would be call every frame when visible and active both true.
             * @property {boolean} visible
             * @member WOZLLA.GameObject
             */
            get: function () {
                return this._visible;
            },
            set: function (value) {
                this._visible = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "initialized", {
            /**
             * get initialized of this game object
             * @property {boolean} initialized
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._initialized;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "destroyed", {
            /**
             * get destroyed of this game object
             * @property {boolean} destroyed
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._destroyed;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "touchable", {
            /**
             * get or set touchable of this game object. identify this game object is interactive.
             * @property {boolean} touchable
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._touchable;
            },
            set: function (value) {
                this._touchable = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "renderer", {
            /**
             * get renderer component of this game object
             * @property {WOZLLA.Renderer} renderer
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._renderer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "collider", {
            /**
             * get collider of this game object
             * @property {WOZLLA.Collider} collider
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._collider;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "behaviours", {
            /**
             * get behaviours of this game object
             * @property {WOZLLA.Behaviour[]} behaviours
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._behaviours.slice(0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "mask", {
            /**
             * get mask component of this game object
             * @property {WOZLLA.Mask} mask
             * @member WOZLLA.GameObject
             * @readonly
             */
            get: function () {
                return this._mask;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * set z order
         * @param value
         * @param sort true is set to resort children
         */
        GameObject.prototype.setZ = function (value, sort) {
            if (sort === void 0) { sort = true; }
            if (this._z === value)
                return;
            this._z = value;
            if (sort) {
                this._children.sort(comparator);
            }
        };
        /**
         * add a child game object, it would be fail when this game object has contains the child.
         * @param child
         * @param sort true is set to resort children
         * @returns {boolean} true is success to, false otherwise.
         */
        GameObject.prototype.addChild = function (child, sort) {
            if (sort === void 0) { sort = true; }
            if (this._children.indexOf(child) !== -1) {
                return false;
            }
            if (child._parent) {
                child.removeMe();
            }
            child.dispatchEvent(new WOZLLA.CoreEvent('beforeadd', true));
            this._children.push(child);
            if (sort) {
                this._children.sort(comparator);
            }
            child._parent = this;
            child._transform.dirty = true;
            child.dispatchEvent(new WOZLLA.CoreEvent('add', true));
            return true;
        };
        /**
         * remove the specified child.
         * @param child
         * @returns {boolean} true is success to, false otherwise.
         */
        GameObject.prototype.removeChild = function (child) {
            var idx = this._children.indexOf(child);
            if (idx !== -1) {
                child.dispatchEvent(new WOZLLA.CoreEvent('beforeremove', true, null, false));
                this._children.splice(idx, 1);
                child._parent = null;
                child.dispatchEvent(new WOZLLA.CoreEvent('remove', true, null, false));
                return true;
            }
            return false;
        };
        /**
         * get the first child with the specified name.
         * @param name
         * @returns {WOZLLA.GameObject}
         */
        GameObject.prototype.getChild = function (name) {
            var child, i, len;
            for (i = 0, len = this._children.length; i < len; i++) {
                child = this._children[i];
                if (child._name === name) {
                    return child;
                }
            }
            return null;
        };
        /**
         * get all children with the specified name.
         * @param name
         * @returns {Array}
         */
        GameObject.prototype.getChildren = function (name) {
            var child, i, len;
            var result = [];
            for (i = 0, len = this._children.length; i < len; i++) {
                child = this._children[i];
                if (child._name === name) {
                    result.push(child);
                }
            }
            return result;
        };
        /**
         * remove this game object from parent.
         * @returns {boolean}
         */
        GameObject.prototype.removeMe = function () {
            var parent = this._parent;
            return parent && parent.removeChild(this);
        };
        /**
         * iterator children of this game object
         * @param func interator function.
         */
        GameObject.prototype.eachChild = function (func) {
            this._children.forEach(func);
        };
        /**
         * sort children
         */
        GameObject.prototype.sortChildren = function () {
            this._children.sort(comparator);
        };
        /**
         * get path of this game object
         * @param split delimiter
         * @returns {string}
         */
        GameObject.prototype.getPath = function (split) {
            if (split === void 0) { split = '/'; }
            var arr = [];
            var obj = this;
            while (obj) {
                arr.unshift(obj.name);
                obj = obj.parent;
            }
            return arr.join(split);
        };
        /**
         * whether contains the specified game object of this tree structure.
         * @param child
         * @returns {boolean}
         */
        GameObject.prototype.contains = function (child) {
            if (child === this) {
                return true;
            }
            var parent = child;
            while (parent = parent.parent) {
                if (parent === this) {
                    return true;
                }
            }
            return false;
        };
        /**
         * get first component of type of the specified Type(constructor).
         * @param Type
         * @returns {WOZLLA.Component}
         */
        GameObject.prototype.getComponent = function (Type) {
            var comp, i, len;
            if (this._components.length <= 0) {
                return null;
            }
            for (i = 0, len = this._components.length; i < len; i++) {
                comp = this._components[i];
                if (comp instanceof Type) {
                    return comp;
                }
            }
            return null;
        };
        /**
         * @method hasComponent
         * @param Type
         * @returns {boolean}
         */
        GameObject.prototype.hasComponent = function (Type) {
            var comp, i, len;
            if (this._components.length <= 0) {
                return false;
            }
            for (i = 0, len = this._components.length; i < len; i++) {
                comp = this._components[i];
                if (comp instanceof Type) {
                    return true;
                }
            }
            return false;
        };
        /**
         * get all components of type of Type(constructor).
         * @param Type
         * @returns {Array}
         */
        GameObject.prototype.getComponents = function (Type) {
            var comp, i, len;
            var result = [];
            if (this._components.length <= 0) {
                return result;
            }
            for (i = 0, len = this._components.length; i < len; i++) {
                comp = this._components[i];
                if (comp instanceof Type) {
                    result.push(comp);
                }
            }
            return result;
        };
        /**
         * add componen to this game object. this method would check component dependency
         * by method of component's listRequiredComponents.
         * @param comp
         * @returns {boolean}
         */
        GameObject.prototype.addComponent = function (comp) {
            if (this._components.indexOf(comp) !== -1) {
                return false;
            }
            if (!this.checkComponentDependency(comp)) {
                throw new Error('Can\'t not add, because of dependency');
            }
            if (comp._gameObject) {
                comp._gameObject.removeComponent(comp);
            }
            this._components.push(comp);
            comp._gameObject = this;
            if (comp instanceof WOZLLA.Behaviour) {
                this._behaviours.push(comp);
            }
            else if (comp instanceof WOZLLA.Renderer) {
                this._renderer = comp;
            }
            else if (comp instanceof WOZLLA.Collider) {
                this._collider = comp;
            }
            else if (comp instanceof WOZLLA.Mask) {
                this._mask = comp;
            }
            return true;
        };
        /**
         * remove the specified component
         * @param comp
         * @returns {boolean}
         */
        GameObject.prototype.removeComponent = function (comp) {
            var i, len, otherComp;
            var idx = this._components.indexOf(comp);
            if (idx !== -1) {
                for (i = 0, len = this._components.length; i < len; i++) {
                    otherComp = this._components[i];
                    if (otherComp !== comp) {
                        if (this.checkComponentDependency(otherComp)) {
                            throw new Error('Can\'t not remove, because of dependency');
                        }
                    }
                }
                this._components.splice(idx, 1);
                if (comp instanceof WOZLLA.Behaviour) {
                    this._behaviours.splice(this._behaviours.indexOf(comp), 1);
                }
                else if (comp instanceof WOZLLA.Renderer) {
                    this._renderer = null;
                }
                else if (comp instanceof WOZLLA.Collider) {
                    this._collider = null;
                }
                else if (comp instanceof WOZLLA.Mask) {
                    this._mask = null;
                }
                comp._gameObject = null;
                return true;
            }
            return false;
        };
        /**
         * init this game object.
         */
        GameObject.prototype.init = function () {
            var i, len;
            if (this._initialized || this._destroyed)
                return;
            for (i = 0, len = this._components.length; i < len; i++) {
                this._components[i].init();
            }
            for (i = 0, len = this._children.length; i < len; i++) {
                this._children[i].init();
            }
            this._initialized = true;
        };
        /**
         * destroy this game object.
         */
        GameObject.prototype.destroy = function () {
            var i, len;
            if (this._destroyed || !this._initialized)
                return;
            for (i = 0, len = this._components.length; i < len; i++) {
                this._components[i].destroy();
            }
            for (i = 0, len = this._children.length; i < len; i++) {
                this._children[i].destroy();
            }
            if (this._id) {
                delete idMap[this._id];
            }
            this.clearAllListeners();
            this._destroyed = true;
        };
        /**
         * call every frame when active was true.
         */
        GameObject.prototype.update = function () {
            var i, len, behaviour;
            if (!this._active)
                return;
            if (this._behaviours.length > 0) {
                for (i = 0, len = this._behaviours.length; i < len; i++) {
                    behaviour = this._behaviours[i];
                    behaviour.enabled && behaviour.update();
                }
            }
            if (this._children.length > 0) {
                for (i = 0, len = this._children.length; i < len; i++) {
                    this._children[i].update();
                }
            }
        };
        /**
         * visit this game object and it's all chidlren, children of children.
         * @param renderer
         * @param parentTransform
         * @param flags
         */
        GameObject.prototype.visit = function (renderer, parentTransform, flags) {
            var i, len;
            if (!this._active || !this._initialized || this._destroyed) {
                if ((flags & GameObject.MASK_TRANSFORM_DIRTY) === GameObject.MASK_TRANSFORM_DIRTY) {
                    this._transform.dirty = true;
                }
                return;
            }
            if (this._transform.dirty) {
                flags |= GameObject.MASK_TRANSFORM_DIRTY;
            }
            if ((flags & GameObject.MASK_TRANSFORM_DIRTY) == GameObject.MASK_TRANSFORM_DIRTY) {
                this._transform.transform(parentTransform);
            }
            if (!this._visible) {
                flags &= (~GameObject.MASK_VISIBLE);
            }
            if ((flags & GameObject.MASK_VISIBLE) === GameObject.MASK_VISIBLE) {
                this.render(renderer, flags);
            }
            for (i = 0, len = this._children.length; i < len; i++) {
                this._children[i].visit(renderer, this._transform, flags);
            }
        };
        /**
         * render this game object
         * @param renderer
         * @param flags
         */
        GameObject.prototype.render = function (renderer, flags) {
            this._mask && this._mask.render(renderer, flags);
            this._renderer && this._renderer.render(renderer, flags);
        };
        /**
         * get a game object under the point.
         * @param x
         * @param y
         * @param touchable
         * @returns {WOZLLA.GameObject}
         */
        GameObject.prototype.getUnderPoint = function (x, y, touchable) {
            if (touchable === void 0) { touchable = false; }
            var found, localP, child;
            var childrenArr;
            if (!this._active || !this._visible)
                return null;
            childrenArr = this._children;
            if (childrenArr.length > 0) {
                for (var i = childrenArr.length - 1; i >= 0; i--) {
                    child = childrenArr[i];
                    found = child.getUnderPoint(x, y, touchable);
                    if (found) {
                        return found;
                    }
                }
            }
            if (!touchable || this._touchable) {
                localP = this.transform.globalToLocal(x, y);
                if (this.testHit(localP.x, localP.y)) {
                    return this;
                }
            }
            return null;
        };
        /**
         * try to do a hit test
         * @param localX
         * @param localY
         * @returns {boolean}
         */
        GameObject.prototype.testHit = function (localX, localY) {
            var collider = this._collider;
            return collider && collider.collideXY(localX, localY);
        };
        GameObject.prototype.loadAssets = function (callback) {
            var i, len, count, comp;
            if (this._loadingAssets)
                return;
            count = this._components.length + this._children.length;
            if (count === 0) {
                callback && callback();
                return;
            }
            for (i = 0, len = this._components.length; i < len; i++) {
                comp = this._components[i];
                comp.loadAssets(function () {
                    if (--count === 0) {
                        callback && callback();
                    }
                });
            }
            for (i = 0, len = this._children.length; i < len; i++) {
                this._children[i].loadAssets(function () {
                    if (--count === 0) {
                        callback && callback();
                    }
                });
            }
        };
        GameObject.prototype.checkComponentDependency = function (comp) {
            var Type;
            var requires = comp.listRequiredComponents();
            var ret = true;
            for (var i = 0, len = requires.length; i < len; i++) {
                Type = requires[i];
                ret = ret && this.hasComponent(Type);
            }
            return ret;
        };
        GameObject.MASK_TRANSFORM_DIRTY = 0x1;
        GameObject.MASK_VISIBLE = 0x10;
        return GameObject;
    })(WOZLLA.event.EventDispatcher);
    WOZLLA.GameObject = GameObject;
})(WOZLLA || (WOZLLA = {}));
/// <reference path="GameObject.ts"/>
var WOZLLA;
(function (WOZLLA) {
    /**
     * the root game object of WOZLLA engine
     * @class WOZLLA.Stage
     * @extends WOZLLA.GameObject
     */
    var Stage = (function (_super) {
        __extends(Stage, _super);
        function Stage() {
            _super.call(this);
            this.id = Stage.ID;
            this.name = Stage.ID;
            this._rootTransform = new WOZLLA.Transform();
            this._viewRectTransform = new WOZLLA.RectTransform();
            this._viewRectTransform.anchorMode = WOZLLA.RectTransform.ANCHOR_TOP | WOZLLA.RectTransform.ANCHOR_LEFT;
            this._viewRectTransform.width = WOZLLA.Director.getInstance().renderer.viewport.width;
            this._viewRectTransform.height = WOZLLA.Director.getInstance().renderer.viewport.height;
            this.init();
        }
        Object.defineProperty(Stage.prototype, "viewRectTransform", {
            get: function () {
                return this._viewRectTransform;
            },
            enumerable: true,
            configurable: true
        });
        Stage.prototype.visitStage = function (renderer) {
            _super.prototype.visit.call(this, renderer, this._rootTransform, WOZLLA.GameObject.MASK_VISIBLE);
        };
        Stage.ID = 'WOZLLAStage';
        return Stage;
    })(WOZLLA.GameObject);
    WOZLLA.Stage = Stage;
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    /**
     * @class WOZLLA.Time
     * @static
     */
    var Time = (function () {
        function Time() {
        }
        Time.update = function (timeScale) {
            var now = Date.now() + this._nowIncrease;
            if (this.now) {
                this.delta = (now - this.now) * timeScale;
                this._nowIncrease += this.delta * (timeScale - 1);
                this.now += this.delta;
                this.measuredFPS = 1000 / this.delta;
            }
            else {
                this.now = now;
                this.delta = 1000 / 60;
            }
        };
        Time.reset = function () {
            this.delta = 0;
            this.now = 0;
            this._nowIncrease = 0;
            this.measuredFPS = 0;
        };
        /**
         * @property {number} delta
         * @readonly
         * @static
         */
        Time.delta = 0;
        /**
         * @property {number} now
         * @readonly
         * @static
         */
        Time.now = 0;
        /**
         * @property {number} measuredFPS
         * @readonly
         * @static
         */
        Time.measuredFPS = 0;
        Time._nowIncrease = 0;
        return Time;
    })();
    WOZLLA.Time = Time;
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Time.ts"/>
var WOZLLA;
(function (WOZLLA) {
    /**
     * @class WOZLLA.Scheduler
     * @singleton
     */
    var Scheduler = (function () {
        function Scheduler() {
            this._scheduleCount = 0;
            this._schedules = {};
            this._runScheduleCount = 0;
        }
        /**
         * @method {WOZLLA.Scheduler} getInstance
         * @static
         * @member WOZLLA.Scheduler
         */
        Scheduler.getInstance = function () {
            if (!Scheduler.instance) {
                Scheduler.instance = new Scheduler();
            }
            return Scheduler.instance;
        };
        Scheduler.prototype.runSchedule = function () {
            var scheduleId, scheduleItem;
            this._runScheduleCount = 0;
            for (scheduleId in this._schedules) {
                scheduleItem = this._schedules[scheduleId];
                if (scheduleItem.isFrame && !scheduleItem.paused) {
                    scheduleItem.frame--;
                    if (scheduleItem.frame < 0) {
                        delete this._schedules[scheduleId];
                        scheduleItem.task.apply(scheduleItem, scheduleItem.args);
                    }
                }
                else if (scheduleItem.isTime && !scheduleItem.paused) {
                    scheduleItem.time -= WOZLLA.Time.delta;
                    if (scheduleItem.time < 0) {
                        delete this._schedules[scheduleId];
                        scheduleItem.task.apply(scheduleItem, scheduleItem.args);
                    }
                }
                else if (scheduleItem.isInterval && !scheduleItem.paused) {
                    scheduleItem.time -= WOZLLA.Time.delta;
                    if (scheduleItem.time < 0) {
                        scheduleItem.task.apply(scheduleItem, scheduleItem.args);
                        scheduleItem.time += scheduleItem.intervalTime;
                    }
                }
                else if (scheduleItem.isLoop && !scheduleItem.paused) {
                    scheduleItem.task.apply(scheduleItem, scheduleItem.args);
                }
                this._runScheduleCount++;
            }
        };
        /**
         * remove the specify schedule by id
         * @param id
         */
        Scheduler.prototype.removeSchedule = function (id) {
            delete this._schedules[id];
        };
        /**
         * schedule the task to each frame
         * @param task
         * @param args
         * @returns {string} schedule id
         */
        Scheduler.prototype.scheduleLoop = function (task, args) {
            var scheduleId = 'Schedule_' + (this._scheduleCount++);
            this._schedules[scheduleId] = {
                task: task,
                args: args,
                isLoop: true
            };
            return scheduleId;
        };
        /**
         * schedule the task to the next speficied frame
         * @param task
         * @param {number} frame
         * @param args
         * @returns {string} schedule id
         */
        Scheduler.prototype.scheduleFrame = function (task, frame, args) {
            if (frame === void 0) { frame = 0; }
            var scheduleId = 'Schedule_' + (this._scheduleCount++);
            this._schedules[scheduleId] = {
                task: task,
                frame: frame,
                args: args,
                isFrame: true
            };
            return scheduleId;
        };
        /**
         * schedule the task to internal, like setInterval
         * @param task
         * @param time
         * @param args
         * @returns {string} schedule id
         */
        Scheduler.prototype.scheduleInterval = function (task, time, args) {
            if (time === void 0) { time = 0; }
            var scheduleId = 'Schedule_' + (this._scheduleCount++);
            this._schedules[scheduleId] = {
                task: task,
                intervalTime: time,
                time: time,
                args: args,
                isInterval: true
            };
            return scheduleId;
        };
        /**
         * schedule the task to time, like setTimeout
         * @param task
         * @param time
         * @param args
         * @returns {string} schedule id
         */
        Scheduler.prototype.scheduleTime = function (task, time, args) {
            if (time === void 0) { time = 0; }
            var scheduleId = 'Schedule_' + (this._scheduleCount++);
            time = time || 0;
            this._schedules[scheduleId] = {
                task: task,
                time: time,
                args: args,
                isTime: true
            };
            return scheduleId;
        };
        /**
         * resume the specified schedule
         * @param scheduleId
         */
        Scheduler.prototype.resumeSchedule = function (scheduleId) {
            this._schedules[scheduleId].paused = false;
        };
        /**
         * pause the specified schedule
         * @param scheduleId
         */
        Scheduler.prototype.pauseSchedule = function (scheduleId) {
            this._schedules[scheduleId].paused = true;
        };
        return Scheduler;
    })();
    WOZLLA.Scheduler = Scheduler;
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../../libs/hammerjs.d.ts"/>
/// <reference path="Scheduler.ts"/>
/// <reference path="Stage.ts"/>
/// <reference path="Director.ts"/>
var WOZLLA;
(function (WOZLLA) {
    function getCanvasOffset(canvas) {
        var obj = canvas;
        var offset = { x: obj.offsetLeft, y: obj.offsetTop };
        while (obj = obj.offsetParent) {
            offset.x += obj.offsetLeft;
            offset.y += obj.offsetTop;
        }
        return offset;
    }
    var GestureEvent = (function (_super) {
        __extends(GestureEvent, _super);
        function GestureEvent(params) {
            _super.call(this, params.type, params.bubbles, params.data);
            this.touchMoveDetection = false;
            this.x = params.x;
            this.y = params.y;
            this.touch = params.touch;
            this.touchMoveDetection = params.touchMoveDetection;
            this.gesture = params.gesture;
            this.identifier = params.identifier;
        }
        GestureEvent.prototype.setTouchMoveDetection = function (value) {
            this.touchMoveDetection = value;
        };
        return GestureEvent;
    })(WOZLLA.event.Event);
    WOZLLA.GestureEvent = GestureEvent;
    /**
     * class for touch management <br/>
     * get the instance form {@link WOZLLA.Director}
     * @class WOZLLA.Touch
     * @protected
     */
    var Touch = (function () {
        function Touch(canvas, touchScale) {
            if (touchScale === void 0) { touchScale = 1; }
            /**
             * get or set enabled of touch system
             * @property {boolean} enabled
             */
            this.enabled = true;
            this.canvas = null;
            this.canvasOffset = null;
            this.channelMap = {};
            var me = this;
            var nav = window.navigator;
            me.canvas = canvas;
            me.canvasOffset = getCanvasOffset(canvas);
            me.touchScale = touchScale;
            Hammer(nav.isCocoonJS ? document : canvas, {
                transform: false,
                doubletap: false,
                hold: false,
                rotate: false,
                pinch: false
            }).on(Touch.enabledGestures || 'touch release tap swipe drag dragstart dragend', function (e) {
                if (e.type === 'release' || me.enabled) {
                    WOZLLA.Scheduler.getInstance().scheduleFrame(function () {
                        me.onGestureEvent(e);
                    });
                }
            });
        }
        Touch.setEanbledGestures = function (gestures) {
            this.enabledGestures = gestures;
        };
        Touch.prototype.onGestureEvent = function (e) {
            var x, y, i, len, touch, identifier, channel, changedTouches, target, type = e.type, stage = WOZLLA.Director.getInstance().stage;
            var me = this;
            var canvasScale = this.touchScale || 1;
            changedTouches = e.gesture.srcEvent.changedTouches;
            if (!changedTouches) {
                identifier = 1;
                x = e.gesture.srcEvent.pageX - me.canvasOffset.x;
                y = e.gesture.srcEvent.pageY - me.canvasOffset.y;
                x *= canvasScale;
                y *= canvasScale;
                if (type === 'touch') {
                    target = stage.getUnderPoint(x, y, true);
                    if (target) {
                        me.channelMap[identifier] = me.createDispatchChanel(target);
                    }
                    else {
                        delete me.channelMap[identifier];
                    }
                }
                channel = me.channelMap[identifier];
                channel && channel.onGestureEvent(e, target, x, y, identifier);
            }
            else {
                len = changedTouches.length;
                for (i = 0; i < len; i++) {
                    touch = changedTouches[i];
                    identifier = parseInt(touch.identifier);
                    x = touch.pageX - me.canvasOffset.x;
                    y = touch.pageY - me.canvasOffset.y;
                    x *= canvasScale;
                    y *= canvasScale;
                    if (type === 'touch') {
                        target = stage.getUnderPoint(x, y, true);
                        if (target) {
                            me.channelMap[identifier] = me.createDispatchChanel(target);
                            delete me.channelMap[identifier - 10];
                        }
                    }
                    channel = me.channelMap[identifier];
                    channel && channel.onGestureEvent(e, target, x, y, identifier);
                }
            }
        };
        Touch.prototype.createDispatchChanel = function (touchTarget) {
            var touchMoveDetection = true;
            return {
                onGestureEvent: function (e, target, x, y, identifier) {
                    var touchEvent, type = e.type, stage = WOZLLA.Director.getInstance().stage;
                    switch (type) {
                        case 'drag':
                            if (!touchMoveDetection) {
                                target = touchTarget;
                                break;
                            }
                        case 'tap':
                        case 'release':
                            target = stage.getUnderPoint(x, y, true);
                            break;
                    }
                    if (type === 'tap' && touchTarget !== target) {
                        return;
                    }
                    touchEvent = new GestureEvent({
                        x: x,
                        y: y,
                        type: type,
                        bubbles: true,
                        touch: target,
                        gesture: e.gesture,
                        identifier: identifier,
                        touchMoveDetection: false
                    });
                    touchTarget.dispatchEvent(touchEvent);
                    touchMoveDetection = touchEvent.touchMoveDetection;
                }
            };
        };
        return Touch;
    })();
    WOZLLA.Touch = Touch;
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        function applyProperties(target, source) {
            for (var i in source) {
                if (typeof target[i] === 'undefined') {
                    target[i] = source[i];
                }
            }
            return target;
        }
        /**
         * @class WOZLLA.renderer.WebGLUtils
         * @abstract
         */
        var WebGLUtils = (function () {
            function WebGLUtils() {
            }
            WebGLUtils.getGLContext = function (canvas, options) {
                var gl;
                options = applyProperties(options || {}, {
                    alpha: true,
                    antialias: true,
                    premultipliedAlpha: false,
                    stencil: true
                });
                try {
                    gl = canvas.getContext('experimental-webgl', options);
                }
                catch (e) {
                    try {
                        gl = canvas.getContext('webgl', options);
                    }
                    catch (e2) {
                    }
                }
                return gl;
            };
            WebGLUtils.compileShader = function (gl, shaderType, shaderSrc) {
                var src = shaderSrc;
                var shader = gl.createShader(shaderType);
                gl.shaderSource(shader, src);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    console.log(gl.getShaderInfoLog(shader));
                    return null;
                }
                return shader;
            };
            WebGLUtils.compileProgram = function (gl, vertexSrc, fragmentSrc) {
                var vertexShader = WebGLUtils.compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
                var fragmentShader = WebGLUtils.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
                var shaderProgram = gl.createProgram();
                gl.attachShader(shaderProgram, vertexShader);
                gl.attachShader(shaderProgram, fragmentShader);
                gl.linkProgram(shaderProgram);
                if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                    console.log("Could not initialise program");
                }
                return {
                    program: shaderProgram,
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader
                };
            };
            return WebGLUtils;
        })();
        renderer.WebGLUtils = WebGLUtils;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        var ILayerManager;
        (function (ILayerManager) {
            /**
             * @property {string} DEFAULT
             * @readonly
             * @static
             * @member WOZLLA.renderer.ILayerManager
             */
            ILayerManager.DEFAULT = 'default';
        })(ILayerManager = renderer.ILayerManager || (renderer.ILayerManager = {}));
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../ILayerManager.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        /**
         * @class WOZLLA.renderer.LayerManager
         * @extends WOZLLA.renderer.ILayerManager
         */
        var LayerManager = (function () {
            function LayerManager() {
                this._layerIndexMap = {};
                this._sortedLayers = [];
                this.define(renderer.ILayerManager.DEFAULT, 0);
            }
            LayerManager.prototype.define = function (layer, zindex) {
                var _this = this;
                if (this._layerIndexMap[layer]) {
                    throw new Error('Layer has been defined: ' + layer);
                }
                this._layerIndexMap[layer] = zindex;
                this._sortedLayers.push(layer);
                this._sortedLayers.sort(function (a, b) {
                    return _this.getZIndex(a) - _this.getZIndex(b);
                });
            };
            LayerManager.prototype.undefine = function (layer) {
                this._sortedLayers.splice(this._sortedLayers.indexOf(layer), 1);
                delete this._layerIndexMap[layer];
            };
            LayerManager.prototype.getZIndex = function (layer) {
                return this._layerIndexMap[layer];
            };
            LayerManager.prototype.getSortedLayers = function () {
                return this._sortedLayers.slice(0);
            };
            LayerManager.prototype._getSortedLayers = function () {
                return this._sortedLayers;
            };
            return LayerManager;
        })();
        renderer.LayerManager = LayerManager;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        /**
         * @class WOZLLA.renderer.BlendType
         */
        var BlendType = (function () {
            function BlendType(srcFactor, distFactor) {
                this._srcFactor = srcFactor;
                this._distFactor = distFactor;
            }
            Object.defineProperty(BlendType.prototype, "srcFactor", {
                get: function () {
                    return this._srcFactor;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BlendType.prototype, "distFactor", {
                get: function () {
                    return this._distFactor;
                },
                enumerable: true,
                configurable: true
            });
            BlendType.prototype.applyBlend = function (gl) {
                gl.blendFunc(this._srcFactor, this._distFactor);
            };
            BlendType.NORMAL = 1;
            BlendType.ADD = 2;
            BlendType.MULTIPLY = 3;
            BlendType.SCREEN = 4;
            return BlendType;
        })();
        renderer.BlendType = BlendType;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        /**
         * @class WOZLLA.renderer.Material
         * @extends WOZLLA.renderer.IMaterial
         */
        var Material = (function () {
            function Material(id, shaderProgramId, blendType) {
                this._id = id;
                this._shaderProgramId = shaderProgramId;
                this._blendType = blendType;
            }
            Object.defineProperty(Material.prototype, "id", {
                get: function () {
                    return this._id;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Material.prototype, "shaderProgramId", {
                get: function () {
                    return this._shaderProgramId;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Material.prototype, "blendType", {
                get: function () {
                    return this._blendType;
                },
                enumerable: true,
                configurable: true
            });
            Material.prototype.equals = function (other) {
                return other.blendType === this._blendType && other.shaderProgramId === this._shaderProgramId;
            };
            return Material;
        })();
        renderer.Material = Material;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        var IMaterial;
        (function (IMaterial) {
            /**
             * default material key of built-in
             * @property {string} DEFAULT
             * @readonly
             * @static
             * @member WOZLLA.renderer.IMaterial
             */
            IMaterial.DEFAULT = 'Builtin_default';
        })(IMaterial = renderer.IMaterial || (renderer.IMaterial = {}));
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        var IShaderProgram;
        (function (IShaderProgram) {
            /**
             * @property {string} V2T2C1A1
             * @readonly
             * @static
             * @member WOZLLA.renderer.IShaderProgram
             */
            IShaderProgram.V2T2C1A1 = 'Builtin_V2T2C1A1';
        })(IShaderProgram = renderer.IShaderProgram || (renderer.IShaderProgram = {}));
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Material.ts"/>
/// <reference path="../IMaterial.ts"/>
/// <reference path="../IShaderProgram.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        /**
         * @class WOZLLA.renderer.MaterialManager
         * @extends WOZLLA.renderer.IMaterialManager
         */
        var MaterialManager = (function () {
            function MaterialManager() {
                this._materialMap = {};
                this._materialMap[renderer.IMaterial.DEFAULT] = this.createMaterial(renderer.IMaterial.DEFAULT, renderer.IShaderProgram.V2T2C1A1, renderer.BlendType.NORMAL);
            }
            MaterialManager.prototype.createMaterial = function (id, shaderProgramId, blendType) {
                var material = new renderer.Material(id, shaderProgramId, blendType);
                this._materialMap[id] = material;
                return material;
            };
            MaterialManager.prototype.getMaterial = function (id) {
                return this._materialMap[id];
            };
            MaterialManager.prototype.deleteMaterial = function (material) {
                delete this._materialMap[material.id];
            };
            MaterialManager.prototype.clear = function () {
                this._materialMap = {};
            };
            return MaterialManager;
        })();
        renderer.MaterialManager = MaterialManager;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        /**
         * @class WOZLLA.renderer.ShaderProgram
         * @extends WOZLLA.renderer.IShaderProgram
         */
        var ShaderProgram = (function () {
            function ShaderProgram(id, vertexShader, fragmentShader) {
                this._id = id;
                this._vertexShader = vertexShader;
                this._fragmentShader = fragmentShader;
            }
            Object.defineProperty(ShaderProgram.prototype, "id", {
                get: function () {
                    return this._id;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ShaderProgram.prototype, "vertexShader", {
                get: function () {
                    return this._vertexShader;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ShaderProgram.prototype, "fragmentShader", {
                get: function () {
                    return this._fragmentShader;
                },
                enumerable: true,
                configurable: true
            });
            ShaderProgram.prototype.useProgram = function (gl) {
                gl.useProgram(this._id);
            };
            ShaderProgram.prototype.syncUniforms = function (gl, uniforms) {
            };
            return ShaderProgram;
        })();
        renderer.ShaderProgram = ShaderProgram;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        var shader;
        (function (shader) {
            /**
             * @class WOZLLA.renderer.shader.V2T2C1A1
             */
            var V2T2C1A1 = (function (_super) {
                __extends(V2T2C1A1, _super);
                function V2T2C1A1(id, vertexShader, fragmentShader) {
                    _super.call(this, id, vertexShader, fragmentShader);
                    this._locations = {
                        initialized: false
                    };
                }
                V2T2C1A1.prototype.useProgram = function (gl) {
                    _super.prototype.useProgram.call(this, gl);
                    if (!this._locations.initialized) {
                        this._initLocaitions(gl);
                        this._locations.initialized = true;
                    }
                    this._activate(gl);
                };
                V2T2C1A1.prototype.syncUniforms = function (gl, uniforms) {
                    gl.uniform2f(this._locations.projectionVector, uniforms.projection.x, uniforms.projection.y);
                };
                V2T2C1A1.prototype._initLocaitions = function (gl) {
                    var program = this._id;
                    this._locations.uSampler = gl.getUniformLocation(program, 'uSampler');
                    this._locations.projectionVector = gl.getUniformLocation(program, 'projectionVector');
                    this._locations.offsetVector = gl.getUniformLocation(program, 'offsetVector');
                    this._locations.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
                    this._locations.aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
                    this._locations.aColor = gl.getAttribLocation(program, 'aColor');
                };
                V2T2C1A1.prototype._activate = function (gl) {
                    gl.activeTexture(gl.TEXTURE0);
                    var stride = renderer.Quad.V2T2C1A1.strade * 4;
                    gl.vertexAttribPointer(this._locations.aVertexPosition, 2, gl.FLOAT, false, stride, 0);
                    gl.vertexAttribPointer(this._locations.aTextureCoord, 2, gl.FLOAT, false, stride, 2 * 4);
                    gl.vertexAttribPointer(this._locations.aColor, 2, gl.FLOAT, false, stride, 4 * 4);
                    gl.enableVertexAttribArray(this._locations.aVertexPosition);
                    gl.enableVertexAttribArray(this._locations.aTextureCoord);
                    gl.enableVertexAttribArray(this._locations.aColor);
                };
                V2T2C1A1.VERTEX_SOURCE = [
                    'attribute vec2 aVertexPosition;\n',
                    'attribute vec2 aTextureCoord;\n',
                    'attribute vec2 aColor;\n',
                    'uniform vec2 projectionVector;\n',
                    'uniform vec2 offsetVector;\n',
                    'varying vec2 vTextureCoord;\n',
                    'varying vec4 vColor;\n',
                    'const vec2 center = vec2(-1.0, 1.0);\n',
                    'void main(void) {\n',
                    'gl_Position = vec4( ((aVertexPosition + offsetVector) / projectionVector) + center , 0.0, 1.0);\n',
                    'vTextureCoord = aTextureCoord;\n',
                    'vec3 color = mod(vec3(aColor.y/65536.0, aColor.y/256.0, aColor.y), 256.0) / 256.0;\n',
                    'vColor = vec4(color * aColor.x, aColor.x);\n',
                    '}'
                ].join('');
                V2T2C1A1.FRAGMENT_SOURCE = [
                    'precision mediump float;\n',
                    'varying vec2 vTextureCoord;\n',
                    'varying vec4 vColor;\n',
                    'uniform sampler2D uSampler;\n',
                    'void main(void) {\n',
                    'gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor ;\n',
                    '}'
                ].join('');
                return V2T2C1A1;
            })(WOZLLA.renderer.ShaderProgram);
            shader.V2T2C1A1 = V2T2C1A1;
        })(shader = renderer.shader || (renderer.shader = {}));
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="ShaderProgram.ts"/>
/// <reference path="../IShaderProgram.ts"/>
/// <reference path="../shader/V2T2C1A1.ts"/>
/// <reference path="../WebGLUtils.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        /**
         * @class WOZLLA.renderer.ShaderManager
         * @extends WOZLLA.renderer.IShaderManager
         */
        var ShaderManager = (function () {
            function ShaderManager(gl) {
                this._gl = gl;
                this._shaderMap = {};
                this._shaderMap[renderer.IShaderProgram.V2T2C1A1] = this.createShaderProgram(renderer.shader.V2T2C1A1.VERTEX_SOURCE, renderer.shader.V2T2C1A1.FRAGMENT_SOURCE, renderer.shader.V2T2C1A1);
            }
            ShaderManager.prototype.getShaderProgram = function (id) {
                return this._shaderMap[id];
            };
            ShaderManager.prototype.createShaderProgram = function (vertexSource, fragmentSource, ShaderClass) {
                if (ShaderClass === void 0) { ShaderClass = renderer.ShaderProgram; }
                var result = renderer.WebGLUtils.compileProgram(this._gl, vertexSource, fragmentSource);
                var shaderProgram = new ShaderClass(result.program, result.vertexShader, result.fragmentShader);
                this._shaderMap[shaderProgram.id] = shaderProgram;
                return shaderProgram;
            };
            ShaderManager.prototype.deleteShaderProgram = function (shaderProgram) {
                this._gl.deleteProgram(shaderProgram.id);
                this._gl.deleteShader(shaderProgram.vertexShader);
                this._gl.deleteShader(shaderProgram.fragmentShader);
                delete this._shaderMap[shaderProgram.id];
            };
            ShaderManager.prototype.clear = function () {
                for (var id in this._shaderMap) {
                    this.deleteShaderProgram(this._shaderMap[id]);
                }
            };
            return ShaderManager;
        })();
        renderer.ShaderManager = ShaderManager;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        /**
         * @class WOZLLA.renderer.Texture
         * @extends WOZLLA.renderer.ITexture
         */
        var Texture = (function () {
            function Texture(id, descriptor) {
                this._id = id;
                this._descriptor = descriptor;
            }
            Object.defineProperty(Texture.prototype, "id", {
                get: function () {
                    return this._id;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Texture.prototype, "descriptor", {
                get: function () {
                    return this._descriptor;
                },
                enumerable: true,
                configurable: true
            });
            Texture.prototype.bind = function (gl) {
                gl.bindTexture(gl.TEXTURE_2D, this._id);
            };
            return Texture;
        })();
        renderer.Texture = Texture;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Texture.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        function isPowerOf2(num) {
            return (num & (num - 1)) === 0;
        }
        /**
         * @class WOZLLA.renderer.TextureManager
         * @extends WOZLLA.renderer.ITextureManager
         */
        var TextureManager = (function () {
            function TextureManager(gl) {
                this._gl = gl;
                this._textureMap = {};
            }
            TextureManager.prototype.getTexture = function (id) {
                return this._textureMap[id];
            };
            TextureManager.prototype.generateTexture = function (descriptor, textureId) {
                var texture;
                var pvrtcExt;
                var compressedType;
                var gl = this._gl;
                var id = textureId || gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, id);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                if (isPowerOf2(descriptor.width) && isPowerOf2(descriptor.height)) {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                }
                else {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                }
                switch (descriptor.textureFormat) {
                    case 0 /* PNG */:
                    case 1 /* JPEG */:
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, descriptor.source);
                        break;
                    case 2 /* PVR */:
                        switch (descriptor.pixelFormat) {
                            case 5 /* PVRTC2 */:
                                pvrtcExt = renderer.WebGLExtension.getExtension(gl, renderer.WebGLExtension.PVRTC);
                                compressedType = pvrtcExt.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
                                break;
                            case 4 /* PVRTC4 */:
                                pvrtcExt = renderer.WebGLExtension.getExtension(gl, renderer.WebGLExtension.PVRTC);
                                compressedType = pvrtcExt.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
                                break;
                            default:
                                throw new Error('Unsupported pixel format: ' + descriptor.pixelFormat);
                        }
                        gl.compressedTexImage2D(gl.TEXTURE_2D, 0, compressedType, descriptor.width, descriptor.height, 0, descriptor.source);
                        break;
                    default:
                        throw new Error('Unsupported texture format: ' + descriptor.textureFormat);
                }
                texture = new renderer.Texture(id, descriptor);
                this._textureMap[id] = texture;
                return texture;
            };
            TextureManager.prototype.updateTexture = function (texture) {
                this.generateTexture(texture.descriptor, texture.id);
            };
            TextureManager.prototype.deleteTexture = function (texture) {
                this._gl.deleteTexture(texture.id);
                delete this._textureMap[texture.id];
            };
            TextureManager.prototype.clear = function () {
                for (var id in this._textureMap) {
                    this.deleteTexture(this._textureMap[id]);
                }
            };
            return TextureManager;
        })();
        renderer.TextureManager = TextureManager;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="LayerManager.ts"/>
/// <reference path="../BlendType.ts"/>
/// <reference path="MaterialManager.ts"/>
/// <reference path="ShaderManager.ts"/>
/// <reference path="TextureManager.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        var Renderer = (function () {
            function Renderer(gl, viewport) {
                this._commandQueueMap = {};
                this._blendModes = {};
                this._uniforms = {};
                this._gl = gl;
                this._viewport = viewport;
                this._blendModes[renderer.BlendType.NORMAL] = new renderer.BlendType(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                this._blendModes[renderer.BlendType.ADD] = new renderer.BlendType(gl.SRC_ALPHA, gl.DST_ALPHA);
                this._blendModes[renderer.BlendType.MULTIPLY] = new renderer.BlendType(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
                this._blendModes[renderer.BlendType.SCREEN] = new renderer.BlendType(gl.SRC_ALPHA, gl.ONE);
                this._layerManager = new renderer.LayerManager();
                this._materialManager = new renderer.MaterialManager();
                this._shaderManager = new renderer.ShaderManager(gl);
                this._textureManager = new renderer.TextureManager(gl);
                this._quadBatch = new QuadBatch(gl);
                this._uniforms.projection = {
                    x: viewport.width / 2,
                    y: -viewport.height / 2
                };
                gl.disable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
                gl.enable(gl.BLEND);
            }
            Object.defineProperty(Renderer.prototype, "layerManager", {
                get: function () {
                    return this._layerManager;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Renderer.prototype, "materialManager", {
                get: function () {
                    return this._materialManager;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Renderer.prototype, "shaderManager", {
                get: function () {
                    return this._shaderManager;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Renderer.prototype, "textureManager", {
                get: function () {
                    return this._textureManager;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Renderer.prototype, "gl", {
                get: function () {
                    return this._gl;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Renderer.prototype, "viewport", {
                get: function () {
                    return this._viewport;
                },
                enumerable: true,
                configurable: true
            });
            Renderer.prototype.addCommand = function (command) {
                var layer = command.layer;
                var commandQueue = this._commandQueueMap[layer];
                if (!commandQueue) {
                    commandQueue = this._commandQueueMap[layer] = new CommandQueue(layer);
                }
                commandQueue.add(command);
            };
            Renderer.prototype.render = function () {
                var _this = this;
                var lastCommand;
                var currentTexture;
                var currentMaterial;
                var gl = this._gl;
                gl.viewport(0, 0, this._viewport.width, this._viewport.height);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                this._eachCommand(function (command) {
                    var quadCommand;
                    var customCommand;
                    if (!lastCommand) {
                        _this.flush();
                    }
                    else if (lastCommand instanceof renderer.CustomCommand) {
                        _this.flush();
                    }
                    else if (command instanceof renderer.CustomCommand) {
                        _this.flush();
                    }
                    else if (command.materialId !== currentMaterial.id) {
                        _this.flush();
                    }
                    else if (command.texture !== currentTexture) {
                        _this.flush();
                    }
                    if (command instanceof renderer.CustomCommand) {
                        customCommand = command;
                        customCommand.execute(_this);
                    }
                    else {
                        quadCommand = command;
                        if (_this._quadBatch.canFill(quadCommand.quad)) {
                            _this._quadBatch.fillQuad(quadCommand.quad);
                        }
                        else {
                            _this.flush();
                            _this._quadBatch.fillQuad(quadCommand.quad);
                        }
                    }
                    _this._usingMaterial = currentMaterial = _this._materialManager.getMaterial(command.materialId);
                    _this._usingTexture = currentTexture = command.texture;
                    lastCommand = command;
                });
                if (lastCommand) {
                    this.flush();
                    this._clearCommands();
                    this._usingTexture = null;
                    this._usingMaterial = null;
                }
            };
            Renderer.prototype.flush = function () {
                var gl, shaderProgram;
                if (!this._usingMaterial) {
                    return;
                }
                gl = this._gl;
                shaderProgram = this._shaderManager.getShaderProgram(this._usingMaterial.shaderProgramId);
                shaderProgram.useProgram(gl);
                shaderProgram.syncUniforms(gl, this._uniforms);
                this._blendModes[this._usingMaterial.blendType].applyBlend(gl);
                if (this._usingTexture) {
                    this._usingTexture.bind(gl);
                }
                this._quadBatch.flush(gl);
            };
            Renderer.prototype._clearCommands = function () {
                var commandQueueMap = this._commandQueueMap;
                for (var layer in commandQueueMap) {
                    commandQueueMap[layer].clear();
                }
            };
            Renderer.prototype._eachCommand = function (func) {
                var i, len, j, len2;
                var layer;
                var commandQueue;
                var zQueue;
                var command;
                var commandQueueMap = this._commandQueueMap;
                var layers = this._layerManager._getSortedLayers();
                for (i = 0, len = layers.length; i < len; i++) {
                    layer = layers[i];
                    commandQueue = commandQueueMap[layer];
                    if (commandQueue) {
                        zQueue = commandQueue.negativeZQueue;
                        if (zQueue.length > 0) {
                            for (j = 0, len2 = zQueue.length; j < len2; j++) {
                                command = zQueue[j];
                                func(command);
                            }
                        }
                        zQueue = commandQueue.zeroZQueue;
                        if (zQueue.length > 0) {
                            for (j = 0, len2 = zQueue.length; j < len2; j++) {
                                command = zQueue[j];
                                func(command);
                            }
                        }
                        zQueue = commandQueue.positiveZQueue;
                        if (zQueue.length > 0) {
                            for (j = 0, len2 = zQueue.length; j < len2; j++) {
                                command = zQueue[j];
                                func(command);
                            }
                        }
                    }
                }
            };
            Renderer.MAX_QUAD_SIZE = 500;
            return Renderer;
        })();
        renderer.Renderer = Renderer;
        function compareCommandByGlobalZ(a, b) {
            if (a.globalZ === b.globalZ) {
                return a._addIndex - b._addIndex;
            }
            return a.globalZ - b.globalZ;
        }
        var CommandQueue = (function () {
            function CommandQueue(layer) {
                this._addIndex = 0;
                this.negativeZQueue = [];
                this.zeroZQueue = [];
                this.positiveZQueue = [];
                this.layer = layer;
            }
            CommandQueue.prototype.add = function (command) {
                command._addIndex = this._addIndex++;
                if (command.globalZ === 0) {
                    this.zeroZQueue.push(command);
                }
                else if (command.globalZ > 0) {
                    this.positiveZQueue.push(command);
                }
                else {
                    this.negativeZQueue.push(command);
                }
            };
            CommandQueue.prototype.clear = function () {
                var i, len, command;
                for (i = 0, len = this.negativeZQueue.length; i < len; i++) {
                    command = this.negativeZQueue[i];
                    if (command.isPoolable) {
                        command.release();
                    }
                }
                for (i = 0, len = this.zeroZQueue.length; i < len; i++) {
                    command = this.zeroZQueue[i];
                    if (command.isPoolable) {
                        command.release();
                    }
                }
                for (i = 0, len = this.positiveZQueue.length; i < len; i++) {
                    command = this.positiveZQueue[i];
                    if (command.isPoolable) {
                        command.release();
                    }
                }
                this.negativeZQueue.length = 0;
                this.zeroZQueue.length = 0;
                this.positiveZQueue.length = 0;
                this._addIndex = 0;
            };
            CommandQueue.prototype.sort = function () {
                this.positiveZQueue.sort(compareCommandByGlobalZ);
                this.negativeZQueue.sort(compareCommandByGlobalZ);
            };
            return CommandQueue;
        })();
        var QuadBatch = (function () {
            function QuadBatch(gl) {
                this._size = Renderer.MAX_QUAD_SIZE;
                this._curVertexIndex = 0;
                this._curBatchSize = 0;
                this._gl = gl;
                this._initBuffers();
            }
            Object.defineProperty(QuadBatch.prototype, "vertexBuffer", {
                get: function () {
                    return this._vertexBuffer;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(QuadBatch.prototype, "indexBuffer", {
                get: function () {
                    return this._indexBuffer;
                },
                enumerable: true,
                configurable: true
            });
            QuadBatch.prototype.canFill = function (quad) {
                return this._curVertexIndex < this._size;
            };
            QuadBatch.prototype.fillQuad = function (quad) {
                var vertexIndex, storage;
                var vertices = this._vertices;
                vertexIndex = this._curVertexIndex;
                if (quad.count === quad.renderCount) {
                    vertices.set(quad.storage, vertexIndex);
                }
                else {
                    var j = 0;
                    var i = quad.renderOffset * quad.type.size;
                    var len = quad.renderCount * quad.type.size;
                    storage = quad.storage;
                    for (; j < len; i++, j++) {
                        vertices[vertexIndex + j] = storage[i];
                    }
                }
                this._curVertexIndex += quad.renderCount * quad.type.size;
                this._curBatchSize += quad.renderCount;
            };
            QuadBatch.prototype.flush = function (gl) {
                if (this._curBatchSize === 0) {
                    return;
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.DYNAMIC_DRAW);
                gl.drawElements(gl.TRIANGLES, this._curBatchSize * 6, gl.UNSIGNED_SHORT, 0);
                this._curVertexIndex = 0;
                this._curBatchSize = 0;
            };
            QuadBatch.prototype._initBuffers = function () {
                var i, j;
                var gl = this._gl;
                var numVerts = this._size * 4 * 6;
                var numIndices = this._size * 6;
                this._vertices = new Float32Array(numVerts);
                this._indices = new Uint16Array(numIndices);
                for (i = 0, j = 0; i < numIndices; i += 6, j += 4) {
                    this._indices[i] = j;
                    this._indices[i + 1] = j + 1;
                    this._indices[i + 2] = j + 2;
                    this._indices[i + 3] = j;
                    this._indices[i + 4] = j + 2;
                    this._indices[i + 5] = j + 3;
                }
                // create a couple of buffers
                this._vertexBuffer = gl.createBuffer();
                this._indexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indices, gl.STATIC_DRAW);
                gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.DYNAMIC_DRAW);
            };
            return QuadBatch;
        })();
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Stage.ts"/>
/// <reference path="Touch.ts"/>
/// <reference path="../renderer/WebGLUtils.ts"/>
/// <reference path="../renderer/internal/Renderer.ts"/>
/// <reference path="Scheduler.ts"/>
/// <reference path="../assets/AssetLoader.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var requestAnimationFrame = window.requestAnimationFrame || window.msRequestAnimationFrame || function (frameCall, intervalTime) {
        if (intervalTime === void 0) { intervalTime = 1000 / 62; }
        setTimeout(frameCall, intervalTime);
    };
    /**
     * a director hold this instances: <br/>
     * 1. {@link WOZLLA.Stage} <br/>
     * 2. {@link WOZLLA.renderer.IRenderer} <br/>
     * 3. {@link WOZLLA.Scheduler} <br/>
     * 4. {@link WOZLLA.Touch} <br/>
     * 5. {@link WOZLLA.assets.AssetLoader} <br/>
     * <br/>
     * <br/>
     * and also responsable to setup engine and control main loop.
     *
     * @class WOZLLA.Director
     * @singleton
     */
    var Director = (function () {
        function Director(view, options) {
            if (options === void 0) { options = {}; }
            this._runing = false;
            this._paused = false;
            this._timeScale = 1;
            Director.instance = this;
            this._view = typeof view === 'string' ? document.getElementById('canvas') : view;
            this._scheduler = WOZLLA.Scheduler.getInstance();
            this._assetLoader = WOZLLA.assets.AssetLoader.getInstance();
            this._touch = new WOZLLA.Touch(view, options.touchScale);
            this._renderer = new WOZLLA.renderer.Renderer(WOZLLA.renderer.WebGLUtils.getGLContext(view, options.renderer), {
                x: 0,
                y: 0,
                width: view.width,
                height: view.height
            });
            this._stage = new WOZLLA.Stage();
        }
        Director.getInstance = function () {
            return Director.instance;
        };
        Object.defineProperty(Director.prototype, "view", {
            /**
             * get the canvas element
             * @property {any} view
             */
            get: function () {
                return this._view;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Director.prototype, "touch", {
            /**
             * get the touch instance
             * @property {WOZLLA.Touch} touch
             * @readonly
             */
            get: function () {
                return this._touch;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Director.prototype, "stage", {
            /**
             * get the stage instance
             * @property {WOZLLA.Stage} stage
             * @readonly
             */
            get: function () {
                return this._stage;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Director.prototype, "scheduler", {
            /**
             * get the scheduler instance
             * @property {WOZLLA.Scheduler} scheduler
             * @readonly
             */
            get: function () {
                return this._scheduler;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Director.prototype, "renderer", {
            /**
             * get the renderer instance
             * @property {WOZLLA.renderer.IRenderer} renderer
             * @readonly
             */
            get: function () {
                return this._renderer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Director.prototype, "assetLoader", {
            /**
             * get the asset loader instance
             * @property {WOZLLA.assets.AssetLoader} assetLoader
             * @readonly
             */
            get: function () {
                return this._assetLoader;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Director.prototype, "viewRectTransform", {
            /**
             * get the root instance of RectTransform
             * @returns {WOZLLA.RectTransform} viewRectTransform
             */
            get: function () {
                return this._stage.viewRectTransform;
            },
            enumerable: true,
            configurable: true
        });
        /**
         *  start main loop
         */
        Director.prototype.start = function () {
            var _this = this;
            var frame;
            if (this._runing) {
                return;
            }
            this._runing = true;
            WOZLLA.Time.reset();
            frame = function () {
                if (_this._runing) {
                    requestAnimationFrame(frame);
                }
                _this.runStep();
            };
            requestAnimationFrame(frame);
        };
        /**
         * stop main loop
         */
        Director.prototype.stop = function () {
            this._runing = false;
        };
        /**
         * run one frame
         * @param {number} [timeScale=1]
         */
        Director.prototype.runStep = function (timeScale) {
            if (timeScale === void 0) { timeScale = this._timeScale; }
            WOZLLA.Time.update(timeScale);
            this._stage.update();
            this._stage.visitStage(this._renderer);
            this._renderer.render();
            this._scheduler.runSchedule();
            WOZLLA.utils.Tween.tick(WOZLLA.Time.delta);
        };
        return Director;
    })();
    WOZLLA.Director = Director;
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Asset.ts"/>
/// <reference path="../renderer/ITexture.ts"/>
/// <reference path="../renderer/IRenderer.ts"/>
/// <reference path="../core/Director.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var assets;
    (function (assets) {
        /**
         * internal class
         * @class WOZLLA.assets.GLTextureAsset
         * @extends WOZLLA.assets.Asset
         * @abstract
         */
        var GLTextureAsset = (function (_super) {
            __extends(GLTextureAsset, _super);
            function GLTextureAsset(src) {
                _super.call(this, src);
            }
            Object.defineProperty(GLTextureAsset.prototype, "glTexture", {
                get: function () {
                    return this._glTexture;
                },
                enumerable: true,
                configurable: true
            });
            GLTextureAsset.prototype._generateTexture = function (image) {
                var renderer = WOZLLA.Director.getInstance().renderer;
                if (!renderer) {
                    throw new Error("Director not initialized");
                }
                this._glTexture = renderer.textureManager.generateTexture(new HTMLImageDescriptor(image));
            };
            GLTextureAsset.prototype._generatePVRTexture = function (pvrSource) {
                throw new Error("Unsupported now");
            };
            return GLTextureAsset;
        })(assets.Asset);
        assets.GLTextureAsset = GLTextureAsset;
        var HTMLImageDescriptor = (function () {
            function HTMLImageDescriptor(source) {
                this._source = source;
                this._textureFormat = 0 /* PNG */;
                this._pixelFormat = 0 /* RGBA8888 */;
            }
            Object.defineProperty(HTMLImageDescriptor.prototype, "width", {
                get: function () {
                    return this._source.width;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(HTMLImageDescriptor.prototype, "height", {
                get: function () {
                    return this._source.height;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(HTMLImageDescriptor.prototype, "source", {
                get: function () {
                    return this._source;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(HTMLImageDescriptor.prototype, "textureFormat", {
                get: function () {
                    return this._textureFormat;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(HTMLImageDescriptor.prototype, "pixelFormat", {
                get: function () {
                    return this._pixelFormat;
                },
                enumerable: true,
                configurable: true
            });
            return HTMLImageDescriptor;
        })();
        assets.HTMLImageDescriptor = HTMLImageDescriptor;
        var PVRDescriptor = (function () {
            function PVRDescriptor(source, pixelFormat) {
                this._source = source;
                this._textureFormat = 2 /* PVR */;
                this._pixelFormat = pixelFormat;
            }
            Object.defineProperty(PVRDescriptor.prototype, "width", {
                get: function () {
                    return this._source.width;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PVRDescriptor.prototype, "height", {
                get: function () {
                    return this._source.height;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PVRDescriptor.prototype, "source", {
                get: function () {
                    return this._source;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PVRDescriptor.prototype, "textureFormat", {
                get: function () {
                    return this._textureFormat;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PVRDescriptor.prototype, "pixelFormat", {
                get: function () {
                    return this._pixelFormat;
                },
                enumerable: true,
                configurable: true
            });
            return PVRDescriptor;
        })();
        assets.PVRDescriptor = PVRDescriptor;
    })(assets = WOZLLA.assets || (WOZLLA.assets = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var utils;
    (function (utils) {
        function applyProperties(target, source) {
            for (var i in source) {
                if (typeof target[i] === 'undefined') {
                    target[i] = source[i];
                }
            }
            return target;
        }
        var contentParser = {
            'json': function (xhr) {
                return JSON.parse(xhr.responseText);
            },
            'arraybuffer': function (xhr) {
                return xhr.response;
            }
        };
        var empty = function () {
        };
        /**
         * @class WOZLLA.utils.Ajax
         */
        var Ajax = (function () {
            function Ajax() {
            }
            /**
             * send a request with options
             * @param {object} options
             * @param {boolean} options.async
             * @param {string} options.method GET/POST
             * @param {string} options.contentType text/json/xml
             * @param {string} options.responseType text/plain,text/javascript,text/css,arraybuffer
             * @param {number} [options.timeout=30000]
             * @param {function} options.success call when ajax request successfully
             * @param {function} options.error call when ajax request error
             */
            Ajax.request = function (options) {
                if (options === void 0) { options = {}; }
                var xhr;
                var timeoutId;
                options = applyProperties(options, {
                    url: '',
                    async: true,
                    method: 'GET',
                    contentType: 'text',
                    responseType: 'text/plain',
                    timeout: 30000,
                    success: empty,
                    error: empty
                });
                xhr = new XMLHttpRequest();
                xhr.responseType = options.responseType;
                xhr.onreadystatechange = function () {
                    var parser;
                    if (xhr.readyState === 4) {
                        xhr.onreadystatechange = empty;
                        clearTimeout(timeoutId);
                        parser = contentParser[options.contentType] || function () {
                            return xhr.responseText;
                        };
                        options.success(parser(xhr));
                    }
                };
                xhr.open(options.method, options.url, options.async);
                timeoutId = setTimeout(function () {
                    xhr.onreadystatechange = empty;
                    xhr.abort();
                    options.error({
                        code: Ajax.ERROR_TIMEOUT,
                        message: 'request timeout'
                    });
                }, options.timeout);
                xhr.send();
            };
            /**
             * internal ajax error code when timeout
             * @property ERROR_TIMEOUT
             * @static
             * @readonly
             */
            Ajax.ERROR_TIMEOUT = 1;
            /**
             * internal ajax error code when server error
             * @property ERROR_SERVER
             * @static
             * @readonly
             */
            Ajax.ERROR_SERVER = 2;
            return Ajax;
        })();
        utils.Ajax = Ajax;
    })(utils = WOZLLA.utils || (WOZLLA.utils = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Asset.ts"/>
/// <reference path="../utils/Ajax.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var assets;
    (function (assets) {
        function deepCopyJSON(o) {
            var copy = o, k;
            if (o && typeof o === 'object') {
                copy = Object.prototype.toString.call(o) === '[object Array]' ? [] : {};
                for (k in o) {
                    copy[k] = deepCopyJSON(o[k]);
                }
            }
            return copy;
        }
        var JSONAsset = (function (_super) {
            __extends(JSONAsset, _super);
            function JSONAsset() {
                _super.apply(this, arguments);
            }
            JSONAsset.prototype.cloneData = function () {
                if (!this._data) {
                    return this._data;
                }
                return deepCopyJSON(this._data);
            };
            JSONAsset.prototype.load = function (onSuccess, onError) {
                var _this = this;
                WOZLLA.utils.Ajax.request({
                    url: this.src,
                    contentType: 'json',
                    success: function (data) {
                        _this._data = data;
                        onSuccess();
                    },
                    error: function (error) {
                        onError(error);
                    }
                });
            };
            JSONAsset.prototype.unload = function () {
                this._data = null;
                _super.prototype.unload.call(this);
            };
            return JSONAsset;
        })(assets.Asset);
        assets.JSONAsset = JSONAsset;
    })(assets = WOZLLA.assets || (WOZLLA.assets = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var assets;
    (function (assets) {
        var proxy;
        (function (proxy) {
            var AssetProxy = (function () {
                function AssetProxy(proxyTarget) {
                    this.loading = false;
                    this.proxyTarget = proxyTarget;
                }
                AssetProxy.prototype.setAssetSrc = function (src) {
                    this.newAssetSrc = src;
                };
                AssetProxy.prototype.loadAsset = function (callback) {
                    var _this = this;
                    if (this.checkDirty()) {
                        if (this.loading)
                            return;
                        this.loading = true;
                        this.asset && this.asset.release();
                        this.asset = null;
                        this.doLoad(function (asset) {
                            if (!asset) {
                                _this.asset = null;
                                callback && callback();
                            }
                            else if (asset.src !== _this.newAssetSrc) {
                                asset.retain();
                                asset.release();
                                _this.asset = null;
                            }
                            else {
                                _this.asset = asset;
                                _this.asset.retain();
                            }
                            _this.loading = false;
                            _this.proxyTarget.onAssetLoaded(asset);
                            callback && callback();
                        });
                    }
                };
                AssetProxy.prototype.onDestroy = function () {
                    this.asset && this.asset.release();
                    this.asset = null;
                };
                AssetProxy.prototype.checkDirty = function () {
                    if (!this.asset) {
                        return !!this.newAssetSrc;
                    }
                    return this.newAssetSrc !== this.asset.src;
                };
                AssetProxy.prototype.doLoad = function (callback) {
                    callback(null);
                };
                return AssetProxy;
            })();
            proxy.AssetProxy = AssetProxy;
        })(proxy = assets.proxy || (assets.proxy = {}));
    })(assets = WOZLLA.assets || (WOZLLA.assets = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var assets;
    (function (assets) {
        var proxy;
        (function (proxy) {
            var SpriteAtlasProxy = (function (_super) {
                __extends(SpriteAtlasProxy, _super);
                function SpriteAtlasProxy() {
                    _super.apply(this, arguments);
                }
                SpriteAtlasProxy.prototype.getSprite = function (spriteName) {
                    if (this.asset) {
                        return this.asset.getSprite(spriteName);
                    }
                    return null;
                };
                SpriteAtlasProxy.prototype.doLoad = function (callback) {
                    var src = this.newAssetSrc;
                    if (!src) {
                        callback(null);
                        return;
                    }
                    assets.AssetLoader.getInstance().load(src, assets.SpriteAtlas, function () {
                        callback(assets.AssetLoader.getInstance().getAsset(src));
                    });
                };
                return SpriteAtlasProxy;
            })(proxy.AssetProxy);
            proxy.SpriteAtlasProxy = SpriteAtlasProxy;
        })(proxy = assets.proxy || (assets.proxy = {}));
    })(assets = WOZLLA.assets || (WOZLLA.assets = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var assets;
    (function (assets) {
        /**
         * an sprite is a part of a sprite atlas
         * @class WOZLLA.assets.Sprite
         * <br/>
         * see also: <br/>
         * {@link WOZLLA.assets.SpriteAtlas}<br/>
         */
        var Sprite = (function () {
            /**
             * new a sprite
             * @method constructor
             * @param spriteAtlas
             * @param frame
             * @param name
             */
            function Sprite(spriteAtlas, frame, name) {
                this._spriteAtlas = spriteAtlas;
                this._frame = frame;
                this._name = name;
            }
            Object.defineProperty(Sprite.prototype, "spriteAtlas", {
                /**
                 * get the sprite atlas of this sprite belongs to
                 * @property {WOZLLA.assets.SpriteAtlas} spriteAltas
                 * @readonly
                 */
                get: function () {
                    return this._spriteAtlas;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sprite.prototype, "frame", {
                /**
                 * get frame info
                 * @property {any} frame
                 * @readonly
                 */
                get: function () {
                    return this._frame;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sprite.prototype, "name", {
                /**
                 * get sprite name
                 * @property {string} name
                 * @readonly
                 */
                get: function () {
                    return this._name;
                },
                enumerable: true,
                configurable: true
            });
            return Sprite;
        })();
        assets.Sprite = Sprite;
    })(assets = WOZLLA.assets || (WOZLLA.assets = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Sprite.ts"/>
/// <reference path="../utils/Ajax.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var assets;
    (function (assets) {
        var imageTest = /(\.png|\.jpg)$/i;
        function isImageURL(url) {
            return imageTest.test(url);
        }
        function getFileName(url) {
            var idx = url.lastIndexOf('/');
            if (idx !== -1) {
                return url.substr(idx + 1, url.length);
            }
            return url;
        }
        /**
         * a sprite atlas contains many {@link WOZLLA.assets.Sprite}.
         * it's recommended to user {@link WOZLLA.assets.AssetLoader} to load SpriteAtlas.
         * @class WOZLLA.assets.SpriteAtlas
         * @extends WOZLLA.assets.GLTextureAsset
         * <br/>
         * see also:
         * {@link WOZLLA.assets.Sprite}
         * {@link WOZLLA.assets.AssetLoader}
         */
        var SpriteAtlas = (function (_super) {
            __extends(SpriteAtlas, _super);
            /**
             * new a SpriteAtlas
             * @method constructor
             * @param src
             */
            function SpriteAtlas(src) {
                _super.call(this, src);
                this._spriteCache = {};
            }
            Object.defineProperty(SpriteAtlas.prototype, "imageSrc", {
                /**
                 * @property {string} imageSrc
                 * @readonly
                 */
                get: function () {
                    return this._imageSrc;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteAtlas.prototype, "metaSrc", {
                /**
                 * an file url descript sprite atlas infos.
                 * @property {string} metaSrc
                 * @readonly
                 */
                get: function () {
                    return this._metaSrc;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteAtlas.prototype, "sourceImage", {
                /**
                 * @property {any} sourceImage
                 * @readonly
                 */
                get: function () {
                    return this._sourceImage;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteAtlas.prototype, "spriteData", {
                /**
                 * @property {any} spriteData
                 * @readonly
                 */
                get: function () {
                    return this._spriteData;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * get sprite by name
             * @param name
             * @returns {WOZLLA.assets.Sprite}
             */
            SpriteAtlas.prototype.getSprite = function (name) {
                var frameData, sprite;
                if (!name) {
                    return this._entireSprite;
                }
                sprite = this._spriteCache[name];
                if (sprite) {
                    return sprite;
                }
                if (!this._spriteData) {
                    return null;
                }
                frameData = this._spriteData.frames[name];
                if (frameData) {
                    if (typeof frameData.frame.width === 'undefined') {
                        frameData.frame.width = frameData.frame.w;
                        frameData.frame.height = frameData.frame.h;
                    }
                    sprite = new assets.Sprite(this, {
                        x: frameData.frame.x,
                        y: frameData.frame.y,
                        width: frameData.frame.width,
                        height: frameData.frame.height
                    }, name);
                    this._spriteCache[name] = sprite;
                    return sprite;
                }
                return null;
            };
            /**
             * load this asset
             * @param onSuccess
             * @param onError
             */
            SpriteAtlas.prototype.load = function (onSuccess, onError) {
                var _this = this;
                if (isImageURL(this.src)) {
                    this._imageSrc = this.src;
                    this._loadImage(function (error, image) {
                        if (error) {
                            onError && onError(error);
                        }
                        else {
                            _this._generateTexture(image);
                            _this._sourceImage = image;
                            _this._entireSprite = new assets.Sprite(_this, {
                                x: 0,
                                y: 0,
                                width: image.width,
                                height: image.height
                            });
                            onSuccess && onSuccess();
                        }
                    });
                }
                else {
                    this._metaSrc = this.src;
                    this._loadSpriteAtlas(function (error, image, spriteData) {
                        if (error) {
                            onError && onError(error);
                        }
                        else {
                            _this._sourceImage = image;
                            _this._generateTexture(image);
                            _this._entireSprite = new assets.Sprite(_this, {
                                x: 0,
                                y: 0,
                                width: image.width,
                                height: image.height
                            });
                            _this._spriteData = spriteData;
                            onSuccess && onSuccess();
                        }
                    });
                }
            };
            SpriteAtlas.prototype._loadImage = function (callback) {
                var _this = this;
                var image = new Image();
                image.src = this._imageSrc;
                image.onload = function () {
                    callback && callback(null, image);
                };
                image.onerror = function () {
                    callback('Fail to load image: ' + _this._imageSrc);
                };
            };
            SpriteAtlas.prototype._loadSpriteAtlas = function (callback) {
                var me = this;
                WOZLLA.utils.Ajax.request({
                    url: me._metaSrc,
                    contentType: 'json',
                    success: function (data) {
                        var imageSuffix = data.meta.image;
                        var metaFileName = getFileName(me._metaSrc);
                        me._imageSrc = me._metaSrc.replace(new RegExp(metaFileName + '$'), imageSuffix);
                        me._loadImage(function (error, image) {
                            if (error) {
                                callback && callback(error);
                            }
                            else {
                                callback && callback(null, image, data);
                            }
                        });
                    },
                    error: function (err) {
                        callback('Fail to load sprite: ' + this._metaSrc + ', ' + err.code + ':' + err.message);
                    }
                });
            };
            return SpriteAtlas;
        })(assets.GLTextureAsset);
        assets.SpriteAtlas = SpriteAtlas;
    })(assets = WOZLLA.assets || (WOZLLA.assets = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var math;
    (function (math) {
        /**
         * @class WOZLLA.math.Rectangle
         *  a utils class for rectangle, provider some math methods
         */
        var Rectangle = (function () {
            function Rectangle(x, y, width, height) {
                /**
                 * get or set x
                 * @property {number} x
                 */
                this.x = x;
                /**
                 * get or set y
                 * @property {number} y
                 */
                this.y = y;
                /**
                 * get or set width
                 * @property {number} width
                 */
                this.width = width;
                /**
                 * get or set height
                 * @property {number} height
                 */
                this.height = height;
            }
            Object.defineProperty(Rectangle.prototype, "left", {
                /**
                 * @property {number} left x
                 * @readonly
                 */
                get: function () {
                    return this.x;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rectangle.prototype, "right", {
                /**
                 * @property {number} right x+width
                 * @readonly
                 */
                get: function () {
                    return this.x + this.width;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rectangle.prototype, "top", {
                /**
                 * @property {number} top y
                 * @readonly
                 */
                get: function () {
                    return this.y;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rectangle.prototype, "bottom", {
                /**
                 * @property {number} bottom y+height
                 * @readonly
                 */
                get: function () {
                    return this.y + this.height;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * @method containsXY
             * @param x
             * @param y
             * @returns {boolean}
             */
            Rectangle.prototype.containsXY = function (x, y) {
                return this.x <= x && this.right > x && this.y <= y && this.bottom > y;
            };
            /**
             * get simple description of this object
             * @returns {string}
             */
            Rectangle.prototype.toString = function () {
                return 'Rectangle[' + this.x + ',' + this.y + ',' + this.width + ',' + this.height + ']';
            };
            return Rectangle;
        })();
        math.Rectangle = Rectangle;
    })(math = WOZLLA.math || (WOZLLA.math = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../../core/Collider.ts"/>
/// <reference path="../../math/Rectangle.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var component;
    (function (component) {
        /**
         * @class WOZLLA.component.CircleCollider
         */
        var CircleCollider = (function (_super) {
            __extends(CircleCollider, _super);
            function CircleCollider() {
                _super.apply(this, arguments);
            }
            CircleCollider.prototype.collideXY = function (localX, localY) {
                return this.region && this.region.containsXY(localX, localY);
            };
            CircleCollider.prototype.collide = function (collider) {
                return false;
            };
            return CircleCollider;
        })(WOZLLA.Collider);
        component.CircleCollider = CircleCollider;
    })(component = WOZLLA.component || (WOZLLA.component = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../../core/Collider.ts"/>
/// <reference path="../../math/Rectangle.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var component;
    (function (component) {
        /**
         * @class WOZLLA.component.MaskCollider
         */
        var MaskCollider = (function (_super) {
            __extends(MaskCollider, _super);
            function MaskCollider() {
                _super.apply(this, arguments);
            }
            MaskCollider.prototype.collideXY = function (localX, localY) {
                return true;
            };
            MaskCollider.prototype.collide = function (collider) {
                return false;
            };
            return MaskCollider;
        })(WOZLLA.Collider);
        component.MaskCollider = MaskCollider;
    })(component = WOZLLA.component || (WOZLLA.component = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../../core/Collider.ts"/>
/// <reference path="../../math/Rectangle.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var component;
    (function (component) {
        /**
         * @class WOZLLA.component.RectCollider
         */
        var RectCollider = (function (_super) {
            __extends(RectCollider, _super);
            function RectCollider() {
                _super.apply(this, arguments);
            }
            RectCollider.fromSpriteRenderer = function (spriteRenderer) {
                var rectCollider = new WOZLLA.component.RectCollider();
                var frame = spriteRenderer.sprite.frame;
                var offset = spriteRenderer.spriteOffset;
                rectCollider.region = new WOZLLA.math.Rectangle(0 - frame.width * offset.x, 0 - frame.height * offset.y, frame.width, frame.height);
                return rectCollider;
            };
            RectCollider.prototype.collideXY = function (localX, localY) {
                return this.region && this.region.containsXY(localX, localY);
            };
            RectCollider.prototype.collide = function (collider) {
                return false;
            };
            return RectCollider;
        })(WOZLLA.Collider);
        component.RectCollider = RectCollider;
    })(component = WOZLLA.component || (WOZLLA.component = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        /**
         * @class WOZLLA.renderer.RenderCommandBase
         * @abstract
         */
        var RenderCommandBase = (function () {
            function RenderCommandBase(globalZ, layer) {
                this._globalZ = globalZ;
                this._layer = layer;
            }
            Object.defineProperty(RenderCommandBase.prototype, "globalZ", {
                get: function () {
                    return this._globalZ;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RenderCommandBase.prototype, "layer", {
                get: function () {
                    return this._layer;
                },
                enumerable: true,
                configurable: true
            });
            return RenderCommandBase;
        })();
        renderer.RenderCommandBase = RenderCommandBase;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="RenderCommandBase.ts"/>
/// <reference path="IRenderer.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (_renderer) {
        /**
         * @class WOZLLA.renderer.CustomCommand
         * @extends WOZLLA.renderer.RenderCommandBase
         */
        var CustomCommand = (function (_super) {
            __extends(CustomCommand, _super);
            function CustomCommand(globalZ, layer) {
                _super.call(this, globalZ, layer);
            }
            CustomCommand.prototype.execute = function (renderer) {
                throw new Error('abstract method');
            };
            return CustomCommand;
        })(_renderer.RenderCommandBase);
        _renderer.CustomCommand = CustomCommand;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Component.ts"/>
/// <reference path="../renderer/ILayerManager.ts"/>
/// <reference path="../renderer/CustomCommand.ts"/>
var WOZLLA;
(function (WOZLLA) {
    /**
     * Base class for all mask, mask is based on webgl stencil.
     * @class WOZLLA.Mask
     * @extends WOZLLA.Component
     * @abstract
     */
    var Mask = (function (_super) {
        __extends(Mask, _super);
        function Mask() {
            _super.apply(this, arguments);
            this.reverse = false;
            this._startGlobalZ = 0;
            this._endGlobalZ = 0;
            this._maskLayer = WOZLLA.renderer.ILayerManager.DEFAULT;
        }
        /**
         * set mask range, mask range is effect on globalZ of render commmand
         * @param start
         * @param end
         * @param layer
         */
        Mask.prototype.setMaskRange = function (start, end, layer) {
            if (layer === void 0) { layer = WOZLLA.renderer.ILayerManager.DEFAULT; }
            this._startGlobalZ = start;
            this._endGlobalZ = end;
            this._maskLayer = layer;
        };
        /**
         * render this mask
         * @param renderer
         * @param flags
         */
        Mask.prototype.render = function (renderer, flags) {
            renderer.addCommand(new EnableMaskCommand(this._startGlobalZ, this._maskLayer));
            this.renderMask(renderer, flags);
            renderer.addCommand(new EndMaskCommand(this._startGlobalZ, this._maskLayer, this.reverse));
            renderer.addCommand(new DisableMaskCommand(this._endGlobalZ, this._maskLayer));
        };
        /**
         * do render mask graphics
         * @param renderer
         * @param flags
         */
        Mask.prototype.renderMask = function (renderer, flags) {
        };
        return Mask;
    })(WOZLLA.Component);
    WOZLLA.Mask = Mask;
    var EnableMaskCommand = (function (_super) {
        __extends(EnableMaskCommand, _super);
        function EnableMaskCommand(globalZ, layer) {
            _super.call(this, globalZ, layer);
        }
        EnableMaskCommand.prototype.execute = function (renderer) {
            var gl = renderer.gl;
            gl.enable(gl.STENCIL_TEST);
            gl.clear(gl.STENCIL_BUFFER_BIT);
            gl.colorMask(false, false, false, false);
            gl.stencilFunc(gl.ALWAYS, 1, 0);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        };
        return EnableMaskCommand;
    })(WOZLLA.renderer.CustomCommand);
    var EndMaskCommand = (function (_super) {
        __extends(EndMaskCommand, _super);
        function EndMaskCommand(globalZ, layer, reverse) {
            _super.call(this, globalZ, layer);
            this.reverse = reverse;
        }
        EndMaskCommand.prototype.execute = function (renderer) {
            var gl = renderer.gl;
            gl.colorMask(true, true, true, true);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
            gl.stencilFunc(this.reverse ? gl.NOTEQUAL : gl.EQUAL, 1, 0xFF);
        };
        return EndMaskCommand;
    })(WOZLLA.renderer.CustomCommand);
    var DisableMaskCommand = (function (_super) {
        __extends(DisableMaskCommand, _super);
        function DisableMaskCommand(globalZ, layer) {
            _super.call(this, globalZ, layer);
        }
        DisableMaskCommand.prototype.execute = function (renderer) {
            renderer.gl.disable(renderer.gl.STENCIL_TEST);
        };
        return DisableMaskCommand;
    })(WOZLLA.renderer.CustomCommand);
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    /**
     * Abstract base class for Renderer component
     * @class WOZLLA.Renderer
     * @abstract
     */
    var Renderer = (function (_super) {
        __extends(Renderer, _super);
        function Renderer() {
            _super.apply(this, arguments);
        }
        /**
         * render this object
         * @param renderer
         * @param flags
         */
        Renderer.prototype.render = function (renderer, flags) {
        };
        return Renderer;
    })(WOZLLA.Component);
    WOZLLA.Renderer = Renderer;
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        /**
         * @class WOZLLA.renderer.QuadType
         */
        var QuadType = (function () {
            function QuadType(info) {
                this._info = info;
            }
            Object.defineProperty(QuadType.prototype, "size", {
                get: function () {
                    return this.strade * 4;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(QuadType.prototype, "strade", {
                get: function () {
                    return this._info[0];
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(QuadType.prototype, "vertexIndex", {
                get: function () {
                    return this._info[1];
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(QuadType.prototype, "texCoordIndex", {
                get: function () {
                    return this._info[2];
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(QuadType.prototype, "alphaIndex", {
                get: function () {
                    return this._info[3];
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(QuadType.prototype, "colorIndex", {
                get: function () {
                    return this._info[4];
                },
                enumerable: true,
                configurable: true
            });
            return QuadType;
        })();
        renderer.QuadType = QuadType;
        /**
         * @class WOZLLA.renderer.Quad
         */
        var Quad = (function () {
            function Quad(count, type) {
                if (type === void 0) { type = Quad.V2T2C1A1; }
                this._count = count;
                this._type = type;
                this._storage = new Array(type.size * count);
                this._renderOffset = 0;
                this._renderCount = count;
            }
            Object.defineProperty(Quad.prototype, "storage", {
                get: function () {
                    return this._storage;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Quad.prototype, "count", {
                get: function () {
                    return this._count;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Quad.prototype, "type", {
                get: function () {
                    return this._type;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Quad.prototype, "renderOffset", {
                get: function () {
                    return this._renderOffset;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Quad.prototype, "renderCount", {
                get: function () {
                    return this._renderCount;
                },
                enumerable: true,
                configurable: true
            });
            Quad.prototype.setRenderRange = function (offset, count) {
                this._renderOffset = offset;
                this._renderCount = count;
            };
            Quad.prototype.setVertices = function (x1, y1, x2, y2, x3, y3, x4, y4, offset) {
                if (offset === void 0) { offset = 0; }
                var strade = this._type.strade;
                var size = this._type.size;
                var index = this._type.vertexIndex;
                var base = size * offset + index;
                this._storage[0 + base] = x1;
                this._storage[1 + base] = y1;
                this._storage[0 + base + strade * 1] = x2;
                this._storage[1 + base + strade * 1] = y2;
                this._storage[0 + base + strade * 2] = x3;
                this._storage[1 + base + strade * 2] = y3;
                this._storage[0 + base + strade * 3] = x4;
                this._storage[1 + base + strade * 3] = y4;
            };
            Quad.prototype.setTexCoords = function (x1, y1, x2, y2, x3, y3, x4, y4, offset) {
                if (offset === void 0) { offset = 0; }
                var strade = this._type.strade;
                var size = this._type.size;
                var index = this._type.texCoordIndex;
                var base = size * offset + index;
                this._storage[0 + base] = x1;
                this._storage[1 + base] = y1;
                this._storage[0 + base + strade * 1] = x2;
                this._storage[1 + base + strade * 1] = y2;
                this._storage[0 + base + strade * 2] = x3;
                this._storage[1 + base + strade * 2] = y3;
                this._storage[0 + base + strade * 3] = x4;
                this._storage[1 + base + strade * 3] = y4;
            };
            Quad.prototype.setAlpha = function (alpha, offset) {
                if (offset === void 0) { offset = 0; }
                var strade = this._type.strade;
                var size = this._type.size;
                var index = this._type.alphaIndex;
                var base = size * offset + index;
                this._storage[base] = alpha;
                this._storage[base + strade * 1] = alpha;
                this._storage[base + strade * 2] = alpha;
                this._storage[base + strade * 3] = alpha;
            };
            Quad.prototype.setColor = function (color, offset) {
                if (offset === void 0) { offset = 0; }
                var strade = this._type.strade;
                var size = this._type.size;
                var index = this._type.colorIndex;
                var base = size * offset + index;
                this._storage[base] = color;
                this._storage[base + strade * 1] = color;
                this._storage[base + strade * 2] = color;
                this._storage[base + strade * 3] = color;
            };
            Quad.V2T2C1A1 = new QuadType([6, 0, 2, 4, 5]);
            return Quad;
        })();
        renderer.Quad = Quad;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var utils;
    (function (utils) {
        var ObjectPool = (function () {
            function ObjectPool(minCount, factory) {
                this._minCount = minCount;
                this._factory = factory;
                this._pool = [];
                for (var i = 0; i < this._minCount; i++) {
                    this._pool.push(this._factory());
                }
            }
            ObjectPool.prototype.retain = function () {
                var object = this._pool.shift();
                if (object) {
                    return object;
                }
                return this._factory();
            };
            ObjectPool.prototype.release = function (obj) {
                if (this._pool.indexOf(obj) !== -1) {
                    return;
                }
                this._pool.push(obj);
            };
            return ObjectPool;
        })();
        utils.ObjectPool = ObjectPool;
    })(utils = WOZLLA.utils || (WOZLLA.utils = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="ITexture.ts"/>
/// <reference path="Quad.ts"/>
/// <reference path="RenderCommandBase.ts"/>
/// <reference path="ILayerManager.ts"/>
/// <reference path="../utils/ObjectPool.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        var quadCommandPool;
        /**
         * @class WOZLLA.renderer.QuadCommand
         * @extends WOZLLA.renderer.RenderCommandBase
         */
        var QuadCommand = (function (_super) {
            __extends(QuadCommand, _super);
            function QuadCommand(globalZ, layer) {
                _super.call(this, globalZ, layer);
                this.isPoolable = true;
            }
            QuadCommand.init = function (globalZ, layer, texture, materialId, quad) {
                var quadCommand = quadCommandPool.retain();
                quadCommand.initWith(globalZ, layer, texture, materialId, quad);
                return quadCommand;
            };
            Object.defineProperty(QuadCommand.prototype, "texture", {
                get: function () {
                    return this._texture;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(QuadCommand.prototype, "materialId", {
                get: function () {
                    return this._materialId;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(QuadCommand.prototype, "quad", {
                get: function () {
                    return this._quad;
                },
                enumerable: true,
                configurable: true
            });
            QuadCommand.prototype.initWith = function (globalZ, layer, texture, materialId, quad) {
                this._globalZ = globalZ;
                this._layer = layer;
                this._texture = texture;
                this._materialId = materialId;
                this._quad = quad;
            };
            QuadCommand.prototype.release = function () {
                quadCommandPool.release(this);
            };
            return QuadCommand;
        })(renderer.RenderCommandBase);
        renderer.QuadCommand = QuadCommand;
        quadCommandPool = new WOZLLA.utils.ObjectPool(200, function () {
            return new QuadCommand(0, renderer.ILayerManager.DEFAULT);
        });
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../../core/Renderer.ts"/>
/// <reference path="../../renderer/IRenderer.ts"/>
/// <reference path="../../renderer/ILayerManager.ts"/>
/// <reference path="../../renderer/QuadCommand.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var component;
    (function (component) {
        var QuadCommand = WOZLLA.renderer.QuadCommand;
        /**
         * @class WOZLLA.component.QuadRenderer
         * @abstract
         */
        var QuadRenderer = (function (_super) {
            __extends(QuadRenderer, _super);
            function QuadRenderer() {
                _super.apply(this, arguments);
                this._quadLayer = WOZLLA.renderer.ILayerManager.DEFAULT;
                this._quadMaterialId = WOZLLA.renderer.IMaterial.DEFAULT;
                this._quadGlobalZ = 0;
                this._quadAlpha = 1;
                this._quadColor = 0xFFFFFF;
                this._quadVertexDirty = true;
                this._quadAlphaDirty = true;
                this._quadColorDirty = true;
                this._textureUpdated = false;
            }
            QuadRenderer.prototype.setQuadRenderRange = function (offset, count) {
                this._quad.setRenderRange(offset, count);
            };
            QuadRenderer.prototype.setQuadGlobalZ = function (globalZ) {
                this._quadGlobalZ = globalZ;
            };
            QuadRenderer.prototype.setQuadLayer = function (layer) {
                this._quadLayer = layer;
            };
            QuadRenderer.prototype.setQuadMaterialId = function (materialId) {
                this._quadMaterialId = materialId;
            };
            QuadRenderer.prototype.setQuadAlpha = function (alpha) {
                this._quadAlpha = alpha;
                this._quadAlphaDirty = true;
            };
            QuadRenderer.prototype.setQuadColor = function (color) {
                this._quadColor = color;
                this._quadColorDirty = true;
            };
            QuadRenderer.prototype.setTexture = function (texture) {
                this._texture = texture;
                this._textureUVS = null;
                this._textureUpdated = true;
            };
            QuadRenderer.prototype.setTextureFrame = function (frame) {
                this._textureFrame = frame;
                this._textureUVS = null;
                this._textureUpdated = true;
            };
            QuadRenderer.prototype.setTextureOffset = function (offset) {
                this._textureOffset = offset;
                this._textureUpdated = true;
            };
            QuadRenderer.prototype.init = function () {
                this._initQuad();
                _super.prototype.init.call(this);
            };
            QuadRenderer.prototype.render = function (renderer, flags) {
                if (!this._texture) {
                    return;
                }
                if ((flags & WOZLLA.GameObject.MASK_TRANSFORM_DIRTY) === WOZLLA.GameObject.MASK_TRANSFORM_DIRTY) {
                    this._quadVertexDirty = true;
                }
                if (this._textureUpdated) {
                    this._updateQuad();
                }
                if (this._quadVertexDirty) {
                    this._updateQuadVertices();
                    this._quadVertexDirty = false;
                }
                if (this._quadAlphaDirty) {
                    this._updateQuadAlpha();
                }
                if (this._quadColorDirty) {
                    this._updateQuadColor();
                }
                renderer.addCommand(QuadCommand.init(this._quadGlobalZ, this._quadLayer, this._texture, this._quadMaterialId, this._quad));
            };
            QuadRenderer.prototype._initQuad = function () {
                this._quad = new WOZLLA.renderer.Quad(1);
            };
            QuadRenderer.prototype._getTextureFrame = function () {
                return this._textureFrame || {
                    x: 0,
                    y: 0,
                    width: this._texture.descriptor.width,
                    height: this._texture.descriptor.height
                };
            };
            QuadRenderer.prototype._getTextureOffset = function () {
                return this._textureOffset || { x: 0, y: 0 };
            };
            QuadRenderer.prototype._getTextureUVS = function () {
                var tw, th, frame, uvs;
                if (this._textureUVS) {
                    return this._textureUVS;
                }
                tw = this._texture.descriptor.width;
                th = this._texture.descriptor.height;
                frame = this._textureFrame || {
                    x: 0,
                    y: 0,
                    width: tw,
                    height: th
                };
                uvs = {};
                uvs.x0 = frame.x / tw;
                uvs.y0 = frame.y / th;
                uvs.x1 = (frame.x + frame.width) / tw;
                uvs.y1 = frame.y / th;
                uvs.x2 = (frame.x + frame.width) / tw;
                uvs.y2 = (frame.y + frame.height) / th;
                uvs.x3 = frame.x / tw;
                uvs.y3 = (frame.y + frame.height) / th;
                this._textureUVS = uvs;
                return uvs;
            };
            QuadRenderer.prototype._updateQuad = function (quadIndex) {
                if (quadIndex === void 0) { quadIndex = 0; }
                this._updateQuadVertices(quadIndex);
                this._updateQuadAlpha(quadIndex);
                this._updateQuadColor(quadIndex);
                this._textureUpdated = false;
            };
            QuadRenderer.prototype._updateQuadVertices = function (quadIndex) {
                if (quadIndex === void 0) { quadIndex = 0; }
                var uvs = this._getTextureUVS();
                var frame = this._getTextureFrame();
                var offset = this._getTextureOffset();
                var matrix = this._gameObject.transform.worldMatrix;
                this._updateQuadVerticesByArgs(uvs, frame, offset, matrix, quadIndex);
                this._quadVertexDirty = false;
            };
            QuadRenderer.prototype._updateQuadVerticesByArgs = function (uvs, frame, offset, matrix, quadIndex) {
                if (quadIndex === void 0) { quadIndex = 0; }
                var a = matrix.values[0];
                var c = matrix.values[1];
                var b = matrix.values[3];
                var d = matrix.values[4];
                var tx = matrix.values[6];
                var ty = matrix.values[7];
                var w1 = -offset.x * frame.width;
                var w0 = w1 + frame.width;
                var h1 = -offset.y * frame.height;
                var h0 = h1 + frame.height;
                var x1 = a * w1 + b * h1 + tx;
                var y1 = d * h1 + c * w1 + ty;
                var x2 = a * w0 + b * h1 + tx;
                var y2 = d * h1 + c * w0 + ty;
                var x3 = a * w0 + b * h0 + tx;
                var y3 = d * h0 + c * w0 + ty;
                var x4 = a * w1 + b * h0 + tx;
                var y4 = d * h0 + c * w1 + ty;
                this._quad.setVertices(x1, y1, x2, y2, x3, y3, x4, y4, quadIndex);
                this._quad.setTexCoords(uvs.x0, uvs.y0, uvs.x1, uvs.y1, uvs.x2, uvs.y2, uvs.x3, uvs.y3, quadIndex);
            };
            QuadRenderer.prototype._clearQuadVertices = function (quadIndex) {
                if (quadIndex === void 0) { quadIndex = 0; }
                this._quad.setVertices(0, 0, 0, 0, 0, 0, 0, 0);
                this._quad.setTexCoords(0, 0, 0, 0, 0, 0, 0, 0);
            };
            QuadRenderer.prototype._updateQuadAlpha = function (quadIndex) {
                if (quadIndex === void 0) { quadIndex = 0; }
                this._quad.setAlpha(this._quadAlpha, quadIndex);
                this._quadAlphaDirty = false;
            };
            QuadRenderer.prototype._updateQuadColor = function (quadIndex) {
                if (quadIndex === void 0) { quadIndex = 0; }
                this._quad.setColor(this._quadColor, quadIndex);
                this._quadColorDirty = false;
            };
            return QuadRenderer;
        })(WOZLLA.Renderer);
        component.QuadRenderer = QuadRenderer;
    })(component = WOZLLA.component || (WOZLLA.component = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../../core/Mask.ts"/>
/// <reference path="../renderer/QuadRenderer.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var component;
    (function (component) {
        /**
         * @class WOZLLA.component.RectMask
         */
        var RectMask = (function (_super) {
            __extends(RectMask, _super);
            function RectMask() {
                _super.apply(this, arguments);
                this._helperGameObject = new WOZLLA.GameObject();
            }
            Object.defineProperty(RectMask.prototype, "region", {
                get: function () {
                    return this._region;
                },
                set: function (value) {
                    this._region = value;
                    this._helperGameObject.transform.setPosition(value.x, value.y);
                    this._helperGameObject.transform.setScale(value.width, value.height);
                },
                enumerable: true,
                configurable: true
            });
            RectMask.prototype.renderMask = function (renderer, flags) {
                if (this._region) {
                    if (!this._maskQuadRenderer) {
                        this._initMaskQuadRenderer(renderer);
                    }
                    if (this._helperGameObject.transform.dirty) {
                        flags |= WOZLLA.GameObject.MASK_TRANSFORM_DIRTY;
                    }
                    if ((flags & WOZLLA.GameObject.MASK_TRANSFORM_DIRTY) == WOZLLA.GameObject.MASK_TRANSFORM_DIRTY) {
                        this._helperGameObject.transform.transform(this.transform);
                    }
                    this._maskQuadRenderer.setQuadGlobalZ(this._startGlobalZ);
                    this._maskQuadRenderer.render(renderer, flags);
                }
            };
            RectMask.prototype._initMaskQuadRenderer = function (renderer) {
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                canvas.width = 1;
                canvas.height = 1;
                context.fillStyle = '#FFFFFF';
                context.fillRect(0, 0, canvas.width, canvas.height);
                var descriptor = new WOZLLA.assets.HTMLImageDescriptor(canvas);
                var texture = renderer.textureManager.generateTexture(descriptor);
                this._maskQuadRenderer = new WOZLLA.component.QuadRenderer();
                this._maskQuadRenderer.setTexture(texture);
                this._helperGameObject.addComponent(this._maskQuadRenderer);
                this._helperGameObject.init();
            };
            return RectMask;
        })(WOZLLA.Mask);
        component.RectMask = RectMask;
    })(component = WOZLLA.component || (WOZLLA.component = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../math/Rectangle.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var component;
    (function (component) {
        var PropertyConverter = (function () {
            function PropertyConverter() {
            }
            PropertyConverter.array2rect = function (arr) {
                return new WOZLLA.math.Rectangle(arr[0], arr[1], arr[2], arr[3]);
            };
            return PropertyConverter;
        })();
        component.PropertyConverter = PropertyConverter;
    })(component = WOZLLA.component || (WOZLLA.component = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../../assets/GLTextureAsset.ts"/>
/// <reference path="QuadRenderer.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var component;
    (function (component) {
        var CanvasRenderer = (function (_super) {
            __extends(CanvasRenderer, _super);
            function CanvasRenderer() {
                _super.apply(this, arguments);
                this._canvasSize = new WOZLLA.math.Size(0, 0);
                this._graphicsDirty = true;
                this._sizeDirty = true;
            }
            Object.defineProperty(CanvasRenderer.prototype, "canvasSize", {
                get: function () {
                    return this._canvasSize;
                },
                set: function (value) {
                    this._canvasSize = value;
                    this._sizeDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CanvasRenderer.prototype, "canvasWidth", {
                get: function () {
                    return this._canvasSize.width;
                },
                set: function (value) {
                    this._canvasSize.width = value;
                    this._sizeDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CanvasRenderer.prototype, "canvasHeight", {
                get: function () {
                    return this._canvasSize.height;
                },
                set: function (value) {
                    this._canvasSize.height = value;
                    this._sizeDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            CanvasRenderer.prototype.destroy = function () {
                this.destroyCanvas();
                _super.prototype.destroy.call(this);
            };
            CanvasRenderer.prototype.draw = function (context) {
                throw new Error('abstract method');
            };
            CanvasRenderer.prototype.render = function (renderer, flags) {
                if (!this._canvas) {
                    this.initCanvas();
                }
                if (!this._canvas) {
                    return;
                }
                if (this._sizeDirty) {
                    this.updateCanvas();
                }
                if (this._graphicsDirty) {
                    this.draw(this._context);
                    this._graphicsDirty = false;
                    this.generateCanvasTexture(renderer);
                }
                if (this._glTexture) {
                    _super.prototype.render.call(this, renderer, flags);
                }
            };
            CanvasRenderer.prototype.initCanvas = function () {
                if (this._canvasSize.width <= 0 || this._canvasSize.height <= 0) {
                    return;
                }
                this._canvas = document.createElement('canvas');
                this._canvas.width = this._canvasSize.width;
                this._canvas.height = this._canvasSize.height;
                this._context = this._canvas.getContext('2d');
                this._sizeDirty = false;
                this._graphicsDirty = true;
            };
            CanvasRenderer.prototype.updateCanvas = function () {
                if (this._canvasSize.width <= 0 || this._canvasSize.height <= 0) {
                    this.destroyCanvas();
                    this._graphicsDirty = true;
                }
                this._canvas.width = this._canvasSize.width;
                this._canvas.height = this._canvasSize.height;
                this._sizeDirty = false;
                this._graphicsDirty = true;
            };
            CanvasRenderer.prototype.destroyCanvas = function () {
                this._canvas && this._canvas.dispose && this._canvas.dispose();
                this._context && this._context.dispose && this._context.dispose();
                this._canvas = this._context = null;
            };
            CanvasRenderer.prototype.generateCanvasTexture = function (renderer) {
                if (!this._glTexture) {
                    this._glTexture = renderer.textureManager.generateTexture(new WOZLLA.assets.HTMLImageDescriptor(this._canvas));
                    this.setTexture(this._glTexture);
                }
                else {
                    renderer.textureManager.updateTexture(this._glTexture);
                    this.setTexture(this._glTexture);
                }
            };
            return CanvasRenderer;
        })(component.QuadRenderer);
        component.CanvasRenderer = CanvasRenderer;
    })(component = WOZLLA.component || (WOZLLA.component = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="QuadRenderer.ts"/>
/// <reference path="../../assets/proxy/SpriteAtlasProxy.ts"/>
/// <reference path="../../assets/Sprite.ts"/>
/// <reference path="../../assets/SpriteAtlas.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var component;
    (function (component) {
        /**
         * @class WOZLLA.component.SpriteRenderer
         */
        var SpriteRenderer = (function (_super) {
            __extends(SpriteRenderer, _super);
            function SpriteRenderer() {
                _super.call(this);
                this._spriteProxy = new WOZLLA.assets.proxy.SpriteAtlasProxy(this);
            }
            Object.defineProperty(SpriteRenderer.prototype, "color", {
                get: function () {
                    return this._quadColor;
                },
                set: function (value) {
                    this.setQuadColor(value);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteRenderer.prototype, "alpha", {
                get: function () {
                    return this._quadAlpha;
                },
                set: function (value) {
                    this.setQuadAlpha(value);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteRenderer.prototype, "materialId", {
                get: function () {
                    return this._quadMaterialId;
                },
                set: function (value) {
                    this.setQuadMaterialId(value);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteRenderer.prototype, "renderLayer", {
                get: function () {
                    return this._quadLayer;
                },
                set: function (value) {
                    this.setQuadLayer(value);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteRenderer.prototype, "renderOrder", {
                get: function () {
                    return this._quadGlobalZ;
                },
                set: function (value) {
                    this.setQuadGlobalZ(value);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteRenderer.prototype, "sprite", {
                get: function () {
                    return this._sprite;
                },
                set: function (sprite) {
                    var oldSprite = this._sprite;
                    if (oldSprite === sprite)
                        return;
                    this._sprite = sprite;
                    if (!sprite) {
                        this.setTexture(null);
                        this.setTextureFrame(null);
                    }
                    else {
                        this.setTextureFrame(sprite.frame);
                        if (!oldSprite || oldSprite.spriteAtlas !== sprite.spriteAtlas) {
                            this.setTexture(sprite.spriteAtlas.glTexture);
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteRenderer.prototype, "spriteOffset", {
                get: function () {
                    return this._getTextureOffset();
                },
                set: function (value) {
                    this.setTextureOffset(value);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteRenderer.prototype, "imageSrc", {
                get: function () {
                    return this._spriteAtlasSrc;
                },
                set: function (value) {
                    this.spriteAtlasSrc = value;
                    this.spriteName = null;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteRenderer.prototype, "spriteAtlasSrc", {
                get: function () {
                    return this._spriteAtlasSrc;
                },
                set: function (value) {
                    this._spriteAtlasSrc = value;
                    this._spriteProxy.setAssetSrc(value);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpriteRenderer.prototype, "spriteName", {
                get: function () {
                    return this._spriteName;
                },
                set: function (value) {
                    this._spriteName = value;
                    this.sprite = this._spriteProxy.getSprite(value);
                },
                enumerable: true,
                configurable: true
            });
            SpriteRenderer.prototype.destroy = function () {
                this._spriteProxy.onDestroy();
                _super.prototype.destroy.call(this);
            };
            SpriteRenderer.prototype.onAssetLoaded = function (asset) {
                if (asset) {
                    this.sprite = asset.getSprite(this._spriteName);
                }
                else {
                    this.sprite = null;
                }
            };
            SpriteRenderer.prototype.loadAssets = function (callback) {
                this._spriteProxy.loadAsset(callback);
            };
            return SpriteRenderer;
        })(component.QuadRenderer);
        component.SpriteRenderer = SpriteRenderer;
        WOZLLA.Component.register(SpriteRenderer, {
            name: "SpriteRenderer",
            properties: [{
                name: 'color',
                type: 'int',
                defaultValue: 0xFFFFFF
            }, {
                name: 'alpha',
                type: 'int',
                defaultValue: 1
            }, {
                name: 'spriteAtlasSrc',
                type: 'string'
            }, {
                name: 'spriteName',
                type: 'string'
            }]
        });
    })(component = WOZLLA.component || (WOZLLA.component = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="SpriteRenderer.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var component;
    (function (component) {
        var QuadCommand = WOZLLA.renderer.QuadCommand;
        /**
         * @class WOZLLA.component.NinePatchRenderer
         */
        var NinePatchRenderer = (function (_super) {
            __extends(NinePatchRenderer, _super);
            function NinePatchRenderer() {
                _super.apply(this, arguments);
            }
            Object.defineProperty(NinePatchRenderer.prototype, "renderRegion", {
                get: function () {
                    return this._renderRegion;
                },
                set: function (value) {
                    this._renderRegion = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NinePatchRenderer.prototype, "patch", {
                get: function () {
                    return this._patch;
                },
                set: function (value) {
                    this._patch = value;
                    this._quadVertexDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            NinePatchRenderer.prototype._initQuad = function () {
                this._quad = new WOZLLA.renderer.Quad(9);
            };
            NinePatchRenderer.prototype._updateNinePatchQuads = function () {
                this._updateNinePatchQuadVertices();
                this._updateNinePatchQuadAlpha();
                this._updateNinePatchQuadColor();
                this._textureUpdated = false;
            };
            NinePatchRenderer.prototype._updateNinePatchQuadVertices = function () {
                var transform = new WOZLLA.Transform();
                var frame = this._getTextureFrame();
                var patchUVS;
                var patchOffset = { x: 0, y: 0 };
                var patch = this._patch || new WOZLLA.math.Rectangle(0, 0, frame.width, frame.height);
                var region = this._renderRegion || patch;
                function getPatchUVS(patchFrame, texture) {
                    var tw = texture.descriptor.width;
                    var th = texture.descriptor.height;
                    var patchUVS = {};
                    patchUVS.x0 = patchFrame.x / tw;
                    patchUVS.y0 = patchFrame.y / th;
                    patchUVS.x1 = (patchFrame.x + patchFrame.width) / tw;
                    patchUVS.y1 = patchFrame.y / th;
                    patchUVS.x2 = (patchFrame.x + patchFrame.width) / tw;
                    patchUVS.y2 = (patchFrame.y + patchFrame.height) / th;
                    patchUVS.x3 = patchFrame.x / tw;
                    patchUVS.y3 = (patchFrame.y + patchFrame.height) / th;
                    return patchUVS;
                }
                var patches = [{
                    // left top
                    frame: {
                        x: frame.x,
                        y: frame.y,
                        width: patch.left,
                        height: patch.top
                    },
                    pos: {
                        x: region.x,
                        y: region.y
                    },
                    size: {
                        width: 1,
                        height: 1
                    }
                }, {
                    // left center
                    frame: {
                        x: frame.x + patch.left,
                        y: frame.y,
                        width: patch.width,
                        height: patch.top
                    },
                    pos: {
                        x: region.x + patch.left,
                        y: region.y
                    },
                    size: {
                        width: (region.width - (patch.right - patch.width)) / patch.width,
                        height: 1
                    }
                }, {
                    // right top
                    frame: {
                        x: frame.x + patch.right,
                        y: frame.y,
                        width: frame.width - patch.right,
                        height: patch.top
                    },
                    pos: {
                        x: region.right,
                        y: region.y
                    },
                    size: {
                        width: 1,
                        height: 1
                    }
                }, {
                    // left middle
                    frame: {
                        x: frame.x,
                        y: frame.y + patch.top,
                        width: patch.left,
                        height: patch.height
                    },
                    pos: {
                        x: region.x,
                        y: region.y + patch.top
                    },
                    size: {
                        width: 1,
                        height: (region.height - (patch.bottom - patch.height)) / patch.height
                    }
                }, {
                    // center middle
                    frame: {
                        x: frame.x + patch.left,
                        y: frame.y + patch.top,
                        width: patch.width,
                        height: patch.height
                    },
                    pos: {
                        x: region.x + patch.left,
                        y: region.y + patch.top
                    },
                    size: {
                        width: (region.width - (patch.right - patch.width)) / patch.width,
                        height: (region.height - (patch.bottom - patch.height)) / patch.height
                    }
                }, {
                    // right middle
                    frame: {
                        x: frame.x + patch.right,
                        y: frame.y + patch.top,
                        width: frame.width - patch.right,
                        height: patch.height
                    },
                    pos: {
                        x: region.right,
                        y: region.y + patch.top
                    },
                    size: {
                        width: 1,
                        height: (region.height - (patch.bottom - patch.height)) / patch.height
                    }
                }, {
                    // left bottom
                    frame: {
                        x: frame.x,
                        y: frame.y + patch.bottom,
                        width: frame.width - patch.right,
                        height: frame.height - patch.bottom
                    },
                    pos: {
                        x: region.x,
                        y: region.bottom
                    },
                    size: {
                        width: 1,
                        height: 1
                    }
                }, {
                    // center bottom
                    frame: {
                        x: frame.x + patch.left,
                        y: frame.y + patch.bottom,
                        width: patch.width,
                        height: frame.height - patch.bottom
                    },
                    pos: {
                        x: region.x + patch.left,
                        y: region.bottom
                    },
                    size: {
                        width: (region.width - (patch.right - patch.width)) / patch.width,
                        height: 1
                    }
                }, {
                    // right bottom
                    frame: {
                        x: frame.x + patch.right,
                        y: frame.y + patch.bottom,
                        width: frame.width - patch.right,
                        height: frame.height - patch.bottom
                    },
                    pos: {
                        x: region.right,
                        y: region.bottom
                    },
                    size: {
                        width: 1,
                        height: 1
                    }
                }];
                for (var i = 0, p; i < 9; i++) {
                    p = patches[i];
                    if (p.frame.width > 0 && p.frame.height > 0) {
                        patchUVS = getPatchUVS(p.frame, this._texture);
                        transform.set(this.gameObject.transform);
                        transform.x += p.pos.x;
                        transform.y += p.pos.y;
                        transform.setScale(p.size.width, p.size.height);
                        transform.updateWorldMatrix();
                        this._updateQuadVerticesByArgs(patchUVS, p.frame, patchOffset, transform.worldMatrix, i);
                    }
                    else {
                        this._clearQuadVertices(i);
                    }
                }
                this._quadVertexDirty = false;
            };
            NinePatchRenderer.prototype._updateNinePatchQuadAlpha = function () {
                for (var i = 0; i < 9; i++) {
                    this._updateQuadAlpha(i);
                }
                this._quadAlphaDirty = false;
            };
            NinePatchRenderer.prototype._updateNinePatchQuadColor = function () {
                for (var i = 0; i < 9; i++) {
                    this._updateQuadColor(i);
                }
                this._quadColorDirty = false;
            };
            NinePatchRenderer.prototype.render = function (renderer, flags) {
                if (!this._texture) {
                    return;
                }
                if ((flags & WOZLLA.GameObject.MASK_TRANSFORM_DIRTY) === WOZLLA.GameObject.MASK_TRANSFORM_DIRTY) {
                    this._quadVertexDirty = true;
                }
                if (this._textureUpdated) {
                    this._updateNinePatchQuads();
                }
                if (this._quadVertexDirty) {
                    this._updateNinePatchQuadVertices();
                    this._quadVertexDirty = false;
                }
                if (this._quadAlphaDirty) {
                    this._updateNinePatchQuadAlpha();
                }
                if (this._quadColorDirty) {
                    this._updateNinePatchQuadColor();
                }
                renderer.addCommand(QuadCommand.init(this._quadGlobalZ, this._quadLayer, this._texture, this._quadMaterialId, this._quad));
            };
            return NinePatchRenderer;
        })(component.SpriteRenderer);
        component.NinePatchRenderer = NinePatchRenderer;
        WOZLLA.Component.register(NinePatchRenderer, {
            name: "NinePatchRenderer",
            properties: [{
                name: 'patch',
                type: 'rect',
                defaultValue: [0, 0, 0, 0],
                convert: component.PropertyConverter.array2rect
            }, {
                name: 'renderRegion',
                type: 'rect',
                defaultValue: [0, 0, 0, 0],
                convert: component.PropertyConverter.array2rect
            }, {
                group: 'SpriteRenderer',
                properties: WOZLLA.Component.getConfig('SpriteRenderer').properties
            }]
        });
    })(component = WOZLLA.component || (WOZLLA.component = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../renderer/CanvasRenderer.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var component;
    (function (component) {
        var helpCanvas = document.createElement('canvas');
        helpCanvas.width = 1;
        helpCanvas.height = 1;
        var helpContext = helpCanvas.getContext('2d');
        var TextRenderer = (function (_super) {
            __extends(TextRenderer, _super);
            function TextRenderer() {
                _super.apply(this, arguments);
                this._textDirty = true;
                this._textStyle = new TextStyle();
            }
            TextRenderer.measureText = function (style, text) {
                var measuredWidth, measuredHeight;
                var extendSize;
                helpContext.font = style.font;
                measuredWidth = Math.ceil(helpContext.measureText(text).width);
                measuredHeight = Math.ceil(helpContext.measureText("M").width * 1.2);
                if (style.shadow || style.stroke) {
                    extendSize = Math.max(style.strokeWidth, Math.abs(style.shadowOffsetX), Math.abs(style.shadowOffsetY));
                    measuredWidth += extendSize * 2;
                    measuredHeight += extendSize * 2 + 4;
                }
                measuredWidth = Math.ceil(measuredWidth);
                measuredHeight = Math.ceil(measuredHeight);
                if (measuredWidth % 2 !== 0) {
                    measuredWidth += 1;
                }
                if (measuredHeight % 2 !== 0) {
                    measuredHeight += 1;
                }
                return {
                    width: measuredWidth,
                    height: measuredHeight
                };
            };
            Object.defineProperty(TextRenderer.prototype, "text", {
                get: function () {
                    return this._text;
                },
                set: function (value) {
                    if (typeof value !== 'string') {
                        value = value + '';
                    }
                    if (value === this._text)
                        return;
                    this._text = value;
                    this._textDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextRenderer.prototype, "style", {
                get: function () {
                    return this._textStyle;
                },
                set: function (value) {
                    this._textStyle = value;
                    this._textDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextRenderer.prototype, "textWidth", {
                get: function () {
                    return this._canvasSize.width;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextRenderer.prototype, "textHeight", {
                get: function () {
                    return this._canvasSize.height;
                },
                enumerable: true,
                configurable: true
            });
            TextRenderer.prototype.render = function (renderer, flags) {
                if (this._textDirty || this._textStyle.dirty) {
                    this.measureTextSize();
                    this._textStyle.dirty = false;
                    this._textDirty = false;
                    this._graphicsDirty = true;
                }
                _super.prototype.render.call(this, renderer, flags);
            };
            TextRenderer.prototype.draw = function (context) {
                this.drawText(context, this._canvasSize.width, this._canvasSize.height);
            };
            TextRenderer.prototype.drawText = function (context, measuredWidth, measuredHeight) {
                context.save();
                context.font = this._textStyle.font;
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                if (this._textStyle.shadow && (this._textStyle.shadowOffsetX > 0 || this._textStyle.shadowOffsetY > 0)) {
                    context.fillStyle = this._textStyle.shadowColor;
                    context.fillText(this._text, measuredWidth / 2 + this._textStyle.shadowOffsetX, measuredHeight / 2 + this._textStyle.shadowOffsetY);
                }
                if (this._textStyle.stroke && this._textStyle.strokeWidth > 0) {
                    context.strokeStyle = this._textStyle.strokeColor;
                    context.lineWidth = this._textStyle.strokeWidth;
                    context.strokeText(this._text, measuredWidth / 2, measuredHeight / 2);
                }
                context.fillStyle = this._textStyle.color;
                context.fillText(this._text, measuredWidth / 2, measuredHeight / 2);
                context.restore();
            };
            TextRenderer.prototype.measureTextSize = function () {
                var measureSize;
                if (!this._text) {
                    this.canvasWidth = this.canvasHeight = 0;
                }
                else {
                    measureSize = TextRenderer.measureText(this._textStyle, this._text);
                    this.canvasWidth = measureSize.width;
                    this.canvasHeight = measureSize.height;
                }
            };
            TextRenderer.prototype.generateCanvasTexture = function (renderer) {
                var offset = { x: 0, y: 0 };
                _super.prototype.generateCanvasTexture.call(this, renderer);
                if (this._textStyle.align === TextStyle.CENTER) {
                    offset.x = 0.5;
                }
                else if (this._textStyle.align === TextStyle.END) {
                    offset.x = 1;
                }
                if (this._textStyle.baseline === TextStyle.MIDDLE) {
                    offset.y = 0.5;
                }
                else if (this._textStyle.baseline === TextStyle.BOTTOM) {
                    offset.y = 1;
                }
                this.setTextureOffset(offset);
            };
            return TextRenderer;
        })(component.CanvasRenderer);
        component.TextRenderer = TextRenderer;
        var TextStyle = (function () {
            function TextStyle() {
                this.dirty = true;
                this._font = 'normal 24px Arial';
                this._color = '#000000';
                this._shadow = false;
                this._shadowColor = '#000000';
                this._shadowOffsetX = 0;
                this._shadowOffsetY = 0;
                this._stroke = false;
                this._strokeColor = '#000000';
                this._strokeWidth = 0;
                this._align = TextStyle.START;
                this._baseline = TextStyle.TOP;
            }
            Object.defineProperty(TextStyle.prototype, "font", {
                get: function () {
                    return this._font;
                },
                set: function (value) {
                    if (value === this._font)
                        return;
                    this._font = value;
                    this.dirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextStyle.prototype, "color", {
                get: function () {
                    return this._color;
                },
                set: function (value) {
                    if (value === this._color)
                        return;
                    this._color = value;
                    this.dirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextStyle.prototype, "shadow", {
                get: function () {
                    return this._shadow;
                },
                set: function (value) {
                    if (value === this._shadow)
                        return;
                    this._shadow = value;
                    this.dirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextStyle.prototype, "shadowColor", {
                get: function () {
                    return this._shadowColor;
                },
                set: function (value) {
                    this._shadowColor = value;
                    this.dirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextStyle.prototype, "shadowOffsetX", {
                get: function () {
                    return this._shadowOffsetX;
                },
                set: function (value) {
                    if (value === this._shadowOffsetX)
                        return;
                    this._shadowOffsetX = value;
                    this.dirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextStyle.prototype, "shadowOffsetY", {
                get: function () {
                    return this._shadowOffsetY;
                },
                set: function (value) {
                    if (value === this._shadowOffsetY)
                        return;
                    this._shadowOffsetY = value;
                    this.dirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextStyle.prototype, "stroke", {
                get: function () {
                    return this._stroke;
                },
                set: function (value) {
                    if (value === this._stroke)
                        return;
                    this._stroke = value;
                    this.dirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextStyle.prototype, "strokeColor", {
                get: function () {
                    return this._strokeColor;
                },
                set: function (value) {
                    if (value === this._strokeColor)
                        return;
                    this._strokeColor = value;
                    this.dirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextStyle.prototype, "strokeWidth", {
                get: function () {
                    return this._strokeWidth;
                },
                set: function (value) {
                    if (value === this._strokeWidth)
                        return;
                    this._strokeWidth = value;
                    this.dirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextStyle.prototype, "align", {
                get: function () {
                    return this._align;
                },
                set: function (value) {
                    if (value === this._align)
                        return;
                    this._align = value;
                    this.dirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextStyle.prototype, "baseline", {
                get: function () {
                    return this._baseline;
                },
                set: function (value) {
                    if (value === this._baseline)
                        return;
                    this._baseline = value;
                    this.dirty = true;
                },
                enumerable: true,
                configurable: true
            });
            TextStyle.START = 'start';
            TextStyle.CENTER = 'center';
            TextStyle.END = 'end';
            TextStyle.TOP = 'top';
            TextStyle.MIDDLE = 'middle';
            TextStyle.BOTTOM = 'bottom';
            return TextStyle;
        })();
        component.TextStyle = TextStyle;
    })(component = WOZLLA.component || (WOZLLA.component = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="Component.ts"/>
var WOZLLA;
(function (WOZLLA) {
    /**
     * Abstract base class for all behaviours, the {@link WOZLLA.Behaviour#update} function would be call
     * by WOZLLA engine every frame when the gameObject is actived and the property enabled of this behaviour is true
     * @class WOZLLA.Behaviour
     * @extends WOZLLA.Component
     * @abstract
     */
    var Behaviour = (function (_super) {
        __extends(Behaviour, _super);
        function Behaviour() {
            _super.apply(this, arguments);
            /**
             * enabled or disabled this behaviour
             * @property {boolean} [enabled=true]
             */
            this.enabled = true;
        }
        /**
         * call by Engine every frame
         * @method update
         */
        Behaviour.prototype.update = function () {
        };
        return Behaviour;
    })(WOZLLA.Component);
    WOZLLA.Behaviour = Behaviour;
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../event/Event.ts"/>
var WOZLLA;
(function (WOZLLA) {
    /**
     * internal class
     * @class WOZLLA.CoreEvent
     * @extends WOZLLA.event.Event
     */
    var CoreEvent = (function (_super) {
        __extends(CoreEvent, _super);
        /**
         * new a CoreEvent
         * @method constructor
         * @param type
         * @param bubbles
         * @param data
         * @param canStopBubbles
         */
        function CoreEvent(type, bubbles, data, canStopBubbles) {
            if (bubbles === void 0) { bubbles = false; }
            if (data === void 0) { data = null; }
            if (canStopBubbles === void 0) { canStopBubbles = true; }
            _super.call(this, type, bubbles, data, canStopBubbles);
        }
        return CoreEvent;
    })(WOZLLA.event.Event);
    WOZLLA.CoreEvent = CoreEvent;
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var jsonx;
    (function (jsonx) {
        function emptyCallback(root, done) {
            done();
        }
        // reference: @src#asGameObject
        var JSONXBuilder = (function () {
            function JSONXBuilder() {
                this.doLoad = false;
                this.doInit = false;
            }
            JSONXBuilder.prototype.instantiateWithSrc = function (src, callback) {
                if (callback === void 0) { callback = emptyCallback; }
                this.src = src;
                this.newCallback = callback;
                return this;
            };
            JSONXBuilder.prototype.instantiateWithJSON = function (data, callback) {
                if (callback === void 0) { callback = emptyCallback; }
                this.data = data;
                this.newCallback = callback;
                return this;
            };
            JSONXBuilder.prototype.load = function (callback) {
                if (callback === void 0) { callback = emptyCallback; }
                this.doLoad = true;
                this.loadCallback = callback;
                return this;
            };
            JSONXBuilder.prototype.init = function () {
                if (this.doLoad) {
                    this.doInit = true;
                }
                else {
                    this.err = 'JSONXBuilder: init must after load';
                }
                return this;
            };
            JSONXBuilder.prototype.build = function (callback) {
                var _this = this;
                this._loadJSONData(function () {
                    if (_this._checkError(callback))
                        return;
                    _this._newGameObjectTree(function () {
                        if (_this._checkError(callback))
                            return;
                        if (!_this.doLoad) {
                            callback(_this.err, _this.root);
                            return;
                        }
                        _this.newCallback(_this.root, function () {
                            _this._loadAssets(function () {
                                if (_this._checkError(callback))
                                    return;
                                if (!_this.doInit) {
                                    callback(_this.err, _this.root);
                                    return;
                                }
                                _this._init();
                                callback(_this.err, _this.root);
                            });
                        });
                    });
                });
            };
            JSONXBuilder.prototype._checkError = function (callback) {
                if (this.err) {
                    callback(this.err, null);
                    return true;
                }
                return false;
            };
            JSONXBuilder.prototype._loadJSONData = function (callback) {
                var _this = this;
                if (this.src && !this.data) {
                    WOZLLA.utils.Ajax.request({
                        url: this.src,
                        contentType: 'json',
                        success: function (data) {
                            _this.data = data;
                            callback && callback();
                        },
                        error: function (err) {
                            _this.err = err;
                            callback && callback();
                        }
                    });
                }
                else {
                    callback && callback();
                }
            };
            JSONXBuilder.prototype._newGameObjectTree = function (callback) {
                var _this = this;
                this._newGameObject(this.data.root, function (root) {
                    _this.root = root;
                    callback && callback();
                });
            };
            JSONXBuilder.prototype._newGameObject = function (data, callback) {
                var _this = this;
                var gameObj = new WOZLLA.GameObject(data.rect);
                gameObj.id = data.id;
                gameObj.name = data.name;
                gameObj.active = data.active;
                gameObj.visible = data.visible;
                gameObj.touchable = data.touchable;
                gameObj.transform.set(data.transform);
                var components = data.components;
                if (components && components.length > 0) {
                    components.forEach(function (compData) {
                        gameObj.addComponent(_this._newComponent(compData));
                    });
                }
                var createdChildCount = 0;
                var children = data.children;
                if (!children || children.length === 0) {
                    callback(gameObj);
                    return;
                }
                children.forEach(function (childData) {
                    if (childData.reference) {
                        _this._newReferenceObject(childData, function (child) {
                            if (child) {
                                gameObj.addChild(child);
                            }
                            createdChildCount++;
                            if (createdChildCount === children.length) {
                                callback(gameObj);
                            }
                        });
                    }
                    else {
                        _this._newGameObject(childData, function (child) {
                            gameObj.addChild(child);
                            createdChildCount++;
                            if (createdChildCount === children.length) {
                                callback(gameObj);
                            }
                        });
                    }
                });
            };
            JSONXBuilder.prototype._newReferenceObject = function (data, callback) {
                var _this = this;
                var builder = new JSONXBuilder();
                builder.instantiateWithSrc(data.reference).build(function (err, root) {
                    if (err) {
                        _this.err = err;
                    }
                    else if (root) {
                        root.name = data.name;
                        root.id = data.id;
                        root.active = data.active;
                        root.visible = data.visible;
                        root.touchable = data.touchable;
                        root.transform.set(data.transform);
                    }
                    callback(root);
                });
            };
            JSONXBuilder.prototype._newComponent = function (compData) {
                var component = WOZLLA.Component.create(compData.name);
                var config = WOZLLA.Component.getConfig(compData.name);
                config.properties.forEach(function (prop) {
                    var value = compData.properties[prop.name];
                    value = typeof value === 'undefined' ? prop.defaultValue : value;
                    if (prop.convert) {
                        value = prop.convert(value);
                    }
                    component[prop.name] = value;
                });
                return component;
            };
            JSONXBuilder.prototype._loadAssets = function (callback) {
                this.root.loadAssets(callback);
            };
            JSONXBuilder.prototype._init = function () {
                this.root.init();
            };
            return JSONXBuilder;
        })();
        jsonx.JSONXBuilder = JSONXBuilder;
    })(jsonx = WOZLLA.jsonx || (WOZLLA.jsonx = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var math;
    (function (math) {
        /**
         * @class WOZLLA.math.Circle
         * a util class for circle
         */
        var Circle = (function () {
            function Circle(centerX, centerY, radius) {
                /**
                 * get or set centerX
                 * @property {number} centerX
                 */
                this.centerX = centerX;
                /**
                 * get or set centerY
                 * @property {number} centerY
                 */
                this.centerY = centerY;
                /**
                 * get or set radius
                 * @property {number} radius
                 */
                this.radius = radius;
            }
            /**
             * @method containsXY
             * @param x
             * @param y
             * @returns {boolean}
             */
            Circle.prototype.containsXY = function (x, y) {
                return Math.pow((x - this.centerX), 2) + Math.pow((y - this.centerY), 2) <= this.radius;
            };
            /**
             * get simple description of this object
             * @returns {string}
             */
            Circle.prototype.toString = function () {
                return 'Circle[' + this.centerX + ',' + this.centerY + ',' + this.radius + ']';
            };
            return Circle;
        })();
        math.Circle = Circle;
    })(math = WOZLLA.math || (WOZLLA.math = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var math;
    (function (math) {
        var MathUtils;
        (function (MathUtils) {
            function rectIntersect(a, b) {
                return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
            }
            MathUtils.rectIntersect = rectIntersect;
            function rectIntersect2(ax, ay, aw, ah, bx, by, bw, bh) {
                return ax <= bx + bw && bx <= ax + aw && ay <= by + bh && by <= ay + ah;
            }
            MathUtils.rectIntersect2 = rectIntersect2;
        })(MathUtils = math.MathUtils || (math.MathUtils = {}));
    })(math = WOZLLA.math || (WOZLLA.math = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var math;
    (function (math) {
        /**
         * @class WOZLLA.math.Size
         * a util class contains width and height properties
         */
        var Size = (function () {
            /**
             * @method constructor
             * create a new instance of Size
             * @member WOZLLA.math.Size
             * @param {number} width
             * @param {number} height
             */
            function Size(width, height) {
                /**
                 * @property {number} width
                 * get or set width of this object
                 * @member WOZLLA.math.Size
                 */
                this.width = width;
                /**
                 * @property {number} height
                 * get or set height of this object
                 * @member WOZLLA.math.Size
                 */
                this.height = height;
            }
            /**
             * get simple description of this object
             * @returns {string}
             */
            Size.prototype.toString = function () {
                return 'Size[' + this.width + ',' + this.height + ']';
            };
            return Size;
        })();
        math.Size = Size;
    })(math = WOZLLA.math || (WOZLLA.math = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        var IMaterialManager;
        (function (IMaterialManager) {
            /**
             * @property DOC
             * @readonly
             * @static
             * @member WOZLLA.renderer.IMaterialManager
             */
            IMaterialManager.DOC = 'DOC';
        })(IMaterialManager = renderer.IMaterialManager || (renderer.IMaterialManager = {}));
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        var IShaderManager;
        (function (IShaderManager) {
            /**
             * @property DOC
             * @readonly
             * @static
             * @member WOZLLA.renderer.IShaderManager
             */
            IShaderManager.DOC = 'DOC';
        })(IShaderManager = renderer.IShaderManager || (renderer.IShaderManager = {}));
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        /**
         * @enum WOZLLA.renderer.TextureFormat
         */
        (function (TextureFormat) {
            /** @property {number} [PNG] */
            TextureFormat[TextureFormat["PNG"] = 0] = "PNG";
            /** @property {number} [JPEG] */
            TextureFormat[TextureFormat["JPEG"] = 1] = "JPEG";
            /** @property {number} [PVR] */
            TextureFormat[TextureFormat["PVR"] = 2] = "PVR";
        })(renderer.TextureFormat || (renderer.TextureFormat = {}));
        var TextureFormat = renderer.TextureFormat;
        /**
         * @enum WOZLLA.renderer.PixelFormat
         */
        (function (PixelFormat) {
            /** @property {number} [RPGA8888] */
            PixelFormat[PixelFormat["RGBA8888"] = 0] = "RGBA8888";
            /** @property {number} [RGBA4444] */
            PixelFormat[PixelFormat["RGBA4444"] = 1] = "RGBA4444";
            /** @property {number} [RGB888] */
            PixelFormat[PixelFormat["RGB888"] = 2] = "RGB888";
            /** @property {number} [RGB565] */
            PixelFormat[PixelFormat["RGB565"] = 3] = "RGB565";
            /** @property {number} [PVRTC4] */
            PixelFormat[PixelFormat["PVRTC4"] = 4] = "PVRTC4";
            /** @property {number} [PVRTC2] */
            PixelFormat[PixelFormat["PVRTC2"] = 5] = "PVRTC2";
        })(renderer.PixelFormat || (renderer.PixelFormat = {}));
        var PixelFormat = renderer.PixelFormat;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        var ITextureManager;
        (function (ITextureManager) {
            /**
             * @property DOC
             * @readonly
             * @static
             * @member WOZLLA.renderer.ITextureManager
             */
            ITextureManager.DOC = 'DOC';
        })(ITextureManager = renderer.ITextureManager || (renderer.ITextureManager = {}));
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var renderer;
    (function (renderer) {
        /**
         * @class WOZLLA.renderer.WebGLExtension
         */
        var WebGLExtension = (function () {
            function WebGLExtension() {
            }
            WebGLExtension.getExtension = function (gl, extName, doThrow) {
                if (doThrow === void 0) { doThrow = true; }
                var ext = gl.getExtension(extName) || gl.getExtension(gl, WebGLExtension.VENDOR_WEBKIT + extName);
                if (ext != null) {
                    return ext;
                }
                else if (doThrow) {
                    throw new Error('Unsupported extension: ' + extName);
                }
            };
            WebGLExtension.VENDOR_WEBKIT = 'WEBKIT_';
            WebGLExtension.PVRTC = 'WEBGL_compressed_texture_pvrtc';
            WebGLExtension.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
            WebGLExtension.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;
            return WebGLExtension;
        })();
        renderer.WebGLExtension = WebGLExtension;
    })(renderer = WOZLLA.renderer || (WOZLLA.renderer = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../event/EventDispatcher.ts"/>
/// <reference path="Assert.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var utils;
    (function (utils) {
        var StateMachine = (function (_super) {
            __extends(StateMachine, _super);
            function StateMachine() {
                _super.apply(this, arguments);
                this._stateConfig = {};
            }
            StateMachine.prototype.defineState = function (name, isDefault) {
                if (isDefault === void 0) { isDefault = false; }
                WOZLLA.Assert.isUndefined(this._stateConfig[name], 'state "' + name + '" has been defined');
                this._stateConfig[name] = {
                    data: {}
                };
                if (isDefault) {
                    this._defaultState = name;
                }
            };
            StateMachine.prototype.getStateData = function (state, key) {
                WOZLLA.Assert.isNotUndefined(this._stateConfig[state], 'state "' + state + '" not defined');
                return this._stateConfig[state].data[key];
            };
            StateMachine.prototype.setStateData = function (state, key, data) {
                WOZLLA.Assert.isNotUndefined(this._stateConfig[state], 'state "' + state + '" not defined');
                this._stateConfig[state].data[key] = data;
            };
            StateMachine.prototype.defineTransition = function (fromState, toState, transition) {
                WOZLLA.Assert.isNotUndefined(this._stateConfig[fromState], 'state "' + fromState + '" not defined');
                WOZLLA.Assert.isNotUndefined(this._stateConfig[toState], 'state "' + toState + '" not defined');
                this._stateConfig[fromState][toState] = transition;
            };
            StateMachine.prototype.init = function () {
                this._currentState = this._defaultState;
                this.dispatchEvent(new WOZLLA.event.Event(StateMachine.INIT, false, new StateEventData(this._currentState)));
            };
            StateMachine.prototype.getCurrentState = function () {
                return this._currentState;
            };
            StateMachine.prototype.changeState = function (state) {
                var _this = this;
                var from, to, transition;
                WOZLLA.Assert.isNotUndefined(this._stateConfig[state]);
                from = this._currentState;
                to = state;
                transition = this._stateConfig[state][to] || EmptyTransition.getInstance();
                if (this._currentTransition) {
                    this._currentTransition.cancel();
                }
                transition.reset();
                transition.execute(from, to, function () {
                    _this._currentTransition = null;
                    _this._currentState = to;
                    _this.dispatchEvent(new WOZLLA.event.Event(StateMachine.CHANGE, false, new StateEventData(_this._currentState)));
                });
                this._currentTransition = transition;
            };
            StateMachine.INIT = 'state.init';
            StateMachine.CHANGE = 'state.change';
            return StateMachine;
        })(WOZLLA.event.EventDispatcher);
        utils.StateMachine = StateMachine;
        var StateEventData = (function () {
            function StateEventData(state) {
                this.state = state;
            }
            return StateEventData;
        })();
        utils.StateEventData = StateEventData;
        var EmptyTransition = (function () {
            function EmptyTransition() {
                this._canceled = false;
            }
            EmptyTransition.getInstance = function () {
                if (!EmptyTransition.instance) {
                    EmptyTransition.instance = new EmptyTransition();
                }
                return EmptyTransition.instance;
            };
            EmptyTransition.prototype.reset = function () {
                this._canceled = false;
            };
            EmptyTransition.prototype.cancel = function () {
                this._canceled = true;
            };
            EmptyTransition.prototype.execute = function (fromState, toState, onComplete) {
                if (this._canceled) {
                    return;
                }
                onComplete();
            };
            return EmptyTransition;
        })();
        utils.EmptyTransition = EmptyTransition;
    })(utils = WOZLLA.utils || (WOZLLA.utils = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../core/Component.ts"/>
/// <reference path="../utils/StateMachine.ts"/>
/// <reference path="../component/renderer/SpriteRenderer.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var ui;
    (function (ui) {
        var StateMachine = WOZLLA.utils.StateMachine;
        /**
         * @class WOZLLA.ui.StateWidget
         * @protected
         */
        var StateWidget = (function (_super) {
            __extends(StateWidget, _super);
            function StateWidget() {
                _super.call(this);
                this._stateMachine = new WOZLLA.utils.StateMachine();
                this.initStates();
            }
            StateWidget.prototype.init = function () {
                var _this = this;
                this._stateMachine.addListener(StateMachine.INIT, function (e) { return _this.onStateChange(e); });
                this._stateMachine.addListener(StateMachine.CHANGE, function (e) { return _this.onStateChange(e); });
                this._stateMachine.init();
                _super.prototype.init.call(this);
            };
            StateWidget.prototype.initStates = function () {
            };
            StateWidget.prototype.getStateSpriteName = function (state) {
                return this._stateMachine.getStateData(state, 'spriteName');
            };
            StateWidget.prototype.setStateSpriteName = function (state, spriteName) {
                this._stateMachine.setStateData(state, 'spriteName', spriteName);
            };
            StateWidget.prototype.onStateChange = function (e) {
                this.spriteName = this.getStateSpriteName(e.data.state);
            };
            return StateWidget;
        })(WOZLLA.component.SpriteRenderer);
        ui.StateWidget = StateWidget;
    })(ui = WOZLLA.ui || (WOZLLA.ui = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="StateWidget.ts"/>
/// <reference path="../component/renderer/SpriteRenderer.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var ui;
    (function (ui) {
        /**
         * @class WOZLLA.ui.Button
         */
        var Button = (function (_super) {
            __extends(Button, _super);
            function Button() {
                _super.apply(this, arguments);
            }
            Object.defineProperty(Button.prototype, "normalSpriteName", {
                get: function () {
                    return this.getStateSpriteName(Button.STATE_NORMAL);
                },
                set: function (spriteName) {
                    this.setStateSpriteName(Button.STATE_NORMAL, spriteName);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Button.prototype, "disabledSpriteName", {
                get: function () {
                    return this.getStateSpriteName(Button.STATE_DISABLED);
                },
                set: function (spriteName) {
                    this.setStateSpriteName(Button.STATE_DISABLED, spriteName);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Button.prototype, "pressedSpriteName", {
                get: function () {
                    return this.getStateSpriteName(Button.STATE_PRESSED);
                },
                set: function (spriteName) {
                    this.setStateSpriteName(Button.STATE_PRESSED, spriteName);
                },
                enumerable: true,
                configurable: true
            });
            Button.prototype.init = function () {
                var _this = this;
                this.gameObject.addListener('touch', function (e) { return _this.onTouch(e); });
                this.gameObject.addListener('release', function (e) { return _this.onRelease(e); });
                this.gameObject.addListener('tap', function (e) { return _this.onTap(e); });
                _super.prototype.init.call(this);
            };
            Button.prototype.destroy = function () {
                this._stateMachine.clearAllListeners();
                _super.prototype.destroy.call(this);
            };
            Button.prototype.isEnabled = function () {
                return this._stateMachine.getCurrentState() !== Button.STATE_DISABLED;
            };
            Button.prototype.setEnabled = function (enabled) {
                if (enabled === void 0) { enabled = true; }
                this._stateMachine.changeState(enabled ? Button.STATE_NORMAL : Button.STATE_DISABLED);
                this._gameObject.touchable = enabled;
            };
            Button.prototype.initStates = function () {
                this._stateMachine.defineState(Button.STATE_NORMAL, true);
                this._stateMachine.defineState(Button.STATE_DISABLED);
                this._stateMachine.defineState(Button.STATE_PRESSED);
            };
            Button.prototype.onTouch = function (e) {
                this._stateMachine.changeState(Button.STATE_PRESSED);
            };
            Button.prototype.onRelease = function (e) {
                this._stateMachine.changeState(Button.STATE_NORMAL);
            };
            Button.prototype.onTap = function (e) {
            };
            Button.STATE_NORMAL = 'normal';
            Button.STATE_DISABLED = 'disabled';
            Button.STATE_PRESSED = 'pressed';
            return Button;
        })(ui.StateWidget);
        ui.Button = Button;
    })(ui = WOZLLA.ui || (WOZLLA.ui = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="StateWidget.ts"/>
/// <reference path="../component/renderer/SpriteRenderer.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var ui;
    (function (ui) {
        /**
         * @class WOZLLA.ui.CheckBox
         */
        var CheckBox = (function (_super) {
            __extends(CheckBox, _super);
            function CheckBox() {
                _super.apply(this, arguments);
            }
            Object.defineProperty(CheckBox.prototype, "uncheckedSpriteName", {
                get: function () {
                    return this.getStateSpriteName(CheckBox.STATE_UNCHECKED);
                },
                set: function (spriteName) {
                    this.setStateSpriteName(CheckBox.STATE_UNCHECKED, spriteName);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CheckBox.prototype, "disabledSpriteName", {
                get: function () {
                    return this.getStateSpriteName(CheckBox.STATE_DISABLED);
                },
                set: function (spriteName) {
                    this.setStateSpriteName(CheckBox.STATE_DISABLED, spriteName);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CheckBox.prototype, "checkedSpriteName", {
                get: function () {
                    return this.getStateSpriteName(CheckBox.STATE_CHECKED);
                },
                set: function (spriteName) {
                    this.setStateSpriteName(CheckBox.STATE_CHECKED, spriteName);
                },
                enumerable: true,
                configurable: true
            });
            CheckBox.prototype.init = function () {
                var _this = this;
                this._gameObject.addListener('tap', function (e) { return _this.onTap(e); });
                _super.prototype.init.call(this);
            };
            CheckBox.prototype.destroy = function () {
                this._stateMachine.clearAllListeners();
                _super.prototype.destroy.call(this);
            };
            CheckBox.prototype.isEnabled = function () {
                return this._stateMachine.getCurrentState() !== CheckBox.STATE_DISABLED;
            };
            CheckBox.prototype.setEnabled = function (enabled) {
                if (enabled === void 0) { enabled = true; }
                this._stateMachine.changeState(enabled ? CheckBox.STATE_UNCHECKED : CheckBox.STATE_DISABLED);
                this._gameObject.touchable = enabled;
            };
            CheckBox.prototype.initStates = function () {
                this._stateMachine.defineState(CheckBox.STATE_UNCHECKED, true);
                this._stateMachine.defineState(CheckBox.STATE_DISABLED);
                this._stateMachine.defineState(CheckBox.STATE_CHECKED);
            };
            CheckBox.prototype.onTap = function (e) {
                if (this._stateMachine.getCurrentState() === CheckBox.STATE_CHECKED) {
                    this._stateMachine.changeState(CheckBox.STATE_UNCHECKED);
                }
                else {
                    this._stateMachine.changeState(CheckBox.STATE_CHECKED);
                }
            };
            CheckBox.STATE_UNCHECKED = 'unchecked';
            CheckBox.STATE_CHECKED = 'checked';
            CheckBox.STATE_DISABLED = 'disabled';
            return CheckBox;
        })(ui.StateWidget);
        ui.CheckBox = CheckBox;
    })(ui = WOZLLA.ui || (WOZLLA.ui = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var utils;
    (function (utils) {
        var Ease = (function () {
            function Ease() {
            }
            Ease.get = function (amount) {
                if (amount < -1) {
                    amount = -1;
                }
                if (amount > 1) {
                    amount = 1;
                }
                return function (t) {
                    if (amount == 0) {
                        return t;
                    }
                    if (amount < 0) {
                        return t * (t * -amount + 1 + amount);
                    }
                    return t * ((2 - t) * amount + (1 - amount));
                };
            };
            Ease.getPowIn = function (pow) {
                return function (t) {
                    return Math.pow(t, pow);
                };
            };
            Ease.getPowOut = function (pow) {
                return function (t) {
                    return 1 - Math.pow(1 - t, pow);
                };
            };
            Ease.getPowInOut = function (pow) {
                return function (t) {
                    if ((t *= 2) < 1)
                        return 0.5 * Math.pow(t, pow);
                    return 1 - 0.5 * Math.abs(Math.pow(2 - t, pow));
                };
            };
            Ease.sineIn = function (t) {
                return 1 - Math.cos(t * Math.PI / 2);
            };
            Ease.sineOut = function (t) {
                return Math.sin(t * Math.PI / 2);
            };
            Ease.sineInOut = function (t) {
                return -0.5 * (Math.cos(Math.PI * t) - 1);
            };
            Ease.getBackIn = function (amount) {
                return function (t) {
                    return t * t * ((amount + 1) * t - amount);
                };
            };
            Ease.getBackOut = function (amount) {
                return function (t) {
                    t = t - 1;
                    return (t * t * ((amount + 1) * t + amount) + 1);
                };
            };
            Ease.getBackInOut = function (amount) {
                amount *= 1.525;
                return function (t) {
                    if ((t *= 2) < 1)
                        return 0.5 * (t * t * ((amount + 1) * t - amount));
                    return 0.5 * ((t -= 2) * t * ((amount + 1) * t + amount) + 2);
                };
            };
            Ease.circIn = function (t) {
                return -(Math.sqrt(1 - t * t) - 1);
            };
            Ease.circOut = function (t) {
                return Math.sqrt(1 - (t) * t);
            };
            Ease.circInOut = function (t) {
                if ((t *= 2) < 1) {
                    return -0.5 * (Math.sqrt(1 - t * t) - 1);
                }
                return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
            };
            Ease.bounceIn = function (t) {
                return 1 - Ease.bounceOut(1 - t);
            };
            Ease.bounceOut = function (t) {
                if (t < 1 / 2.75) {
                    return (7.5625 * t * t);
                }
                else if (t < 2 / 2.75) {
                    return (7.5625 * (t -= 1.5 / 2.75) * t + 0.75);
                }
                else if (t < 2.5 / 2.75) {
                    return (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375);
                }
                else {
                    return (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375);
                }
            };
            Ease.bounceInOut = function (t) {
                if (t < 0.5)
                    return Ease.bounceIn(t * 2) * .5;
                return Ease.bounceOut(t * 2 - 1) * 0.5 + 0.5;
            };
            Ease.getElasticIn = function (amplitude, period) {
                var pi2 = Math.PI * 2;
                return function (t) {
                    if (t == 0 || t == 1)
                        return t;
                    var s = period / pi2 * Math.asin(1 / amplitude);
                    return -(amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * pi2 / period));
                };
            };
            Ease.getElasticOut = function (amplitude, period) {
                var pi2 = Math.PI * 2;
                return function (t) {
                    if (t == 0 || t == 1)
                        return t;
                    var s = period / pi2 * Math.asin(1 / amplitude);
                    return (amplitude * Math.pow(2, -10 * t) * Math.sin((t - s) * pi2 / period) + 1);
                };
            };
            Ease.getElasticInOut = function (amplitude, period) {
                var pi2 = Math.PI * 2;
                return function (t) {
                    var s = period / pi2 * Math.asin(1 / amplitude);
                    if ((t *= 2) < 1)
                        return -0.5 * (amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * pi2 / period));
                    return amplitude * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * pi2 / period) * 0.5 + 1;
                };
            };
            Ease.linear = function (t) {
                return t;
            };
            Ease.expoIn = function (time) {
                return time == 0 ? 0 : Math.pow(2, 10 * (time - 1)) - 0.001;
            };
            Ease.expoOut = function (time) {
                return time == 1 ? 1 : (-Math.pow(2, -10 * time) + 1);
            };
            Ease.expoInOut = function (time) {
                time /= 0.5;
                if (time < 1) {
                    time = 0.5 * Math.pow(2, 10 * (time - 1));
                }
                else {
                    time = 0.5 * (-Math.pow(2, -10 * (time - 1)) + 2);
                }
                return time;
            };
            Ease.getByKey = function (key) {
                return Ease[Ease.keyMap[key]];
            };
            Ease.quadIn = Ease.getPowIn(2);
            Ease.quadOut = Ease.getPowOut(2);
            Ease.quadInOut = Ease.getPowInOut(2);
            Ease.cubicIn = Ease.getPowIn(3);
            Ease.cubicOut = Ease.getPowOut(3);
            Ease.cubicInOut = Ease.getPowInOut(3);
            Ease.quartIn = Ease.getPowIn(4);
            Ease.quartOut = Ease.getPowOut(4);
            Ease.quartInOut = Ease.getPowInOut(4);
            Ease.quintIn = Ease.getPowIn(5);
            Ease.quintOut = Ease.getPowOut(5);
            Ease.quintInOut = Ease.getPowInOut(5);
            Ease.backIn = Ease.getBackIn(1.7);
            Ease.backOut = Ease.getBackOut(1.7);
            Ease.backInOut = Ease.getBackInOut(1.7);
            Ease.elasticIn = Ease.getElasticIn(1, 0.3);
            Ease.elasticOut = Ease.getElasticOut(1, 0.3);
            Ease.elasticInOut = Ease.getElasticInOut(1, 0.3 * 1.5);
            Ease.keyMap = {
                0: 'linear',
                1: 'sineIn',
                2: 'sineOut',
                3: 'sineInOut',
                4: 'quadIn',
                5: 'quadOut',
                6: 'quadInOut',
                7: 'cubicIn',
                8: 'cubicOut',
                9: 'cubicInOut',
                10: 'quartIn',
                11: 'quartOut',
                12: 'quartInOut',
                13: 'quintIn',
                14: 'quintOut',
                15: 'quintInOut',
                16: 'expoIn',
                17: 'expoOut',
                18: 'expoInOut',
                19: 'circIn',
                20: 'circOut',
                21: 'circInOut',
                22: 'elasticIn',
                23: 'elasticOut',
                24: 'elasticInOut',
                25: 'backIn',
                26: 'backOut',
                27: 'backInOut',
                28: 'bounceIn',
                29: 'bounceOut',
                30: 'bounceInOut'
            };
            return Ease;
        })();
        utils.Ease = Ease;
    })(utils = WOZLLA.utils || (WOZLLA.utils = {}));
})(WOZLLA || (WOZLLA = {}));
var WOZLLA;
(function (WOZLLA) {
    var DragonBones;
    (function (DragonBones) {
        var SkeletonRenderer = (function (_super) {
            __extends(SkeletonRenderer, _super);
            function SkeletonRenderer() {
                _super.apply(this, arguments);
            }
            Object.defineProperty(SkeletonRenderer.prototype, "skeletonSrc", {
                get: function () {
                    return this._skeletonSrc;
                },
                set: function (value) {
                    this._skeletonSrc = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SkeletonRenderer.prototype, "textureSrc", {
                get: function () {
                    return this._textureSrc;
                },
                set: function (value) {
                    this._textureSrc = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SkeletonRenderer.prototype, "armatureName", {
                get: function () {
                    return this._armatureName;
                },
                set: function (value) {
                    this._armatureName = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SkeletonRenderer.prototype, "armature", {
                get: function () {
                    return this._armature;
                },
                enumerable: true,
                configurable: true
            });
            SkeletonRenderer.prototype.init = function () {
                this.initArmature();
                _super.prototype.init.call(this);
            };
            SkeletonRenderer.prototype.destroy = function () {
                this._skeletonJSONAsset && this._skeletonJSONAsset.release();
                this._skeletonJSONAsset = null;
                this._wTextureAtlas && this._wTextureAtlas.release();
                this._wTextureAtlas = null;
                this._armature && this._armature.dispose();
                this._armature = null;
                this._factory && this._factory.dispose();
                if (this._container) {
                    this._container.destroy();
                    this._container.removeMe();
                    this._container = null;
                }
                _super.prototype.destroy.call(this);
            };
            SkeletonRenderer.prototype.render = function (renderer, flags) {
                this._container.visit(renderer, this.transform, flags);
            };
            SkeletonRenderer.prototype.loadAssets = function (callback) {
                var _this = this;
                var assetLoader;
                if (this._skeletonSrc && this._textureSrc && this._armatureName) {
                    assetLoader = WOZLLA.Director.getInstance().assetLoader;
                    assetLoader.load(this._skeletonSrc, WOZLLA.assets.JSONAsset, function () {
                        var jsonAsset = assetLoader.getAsset(_this._skeletonSrc);
                        if (!jsonAsset) {
                            callback();
                            return;
                        }
                        jsonAsset.retain();
                        assetLoader.load(_this._textureSrc, DragonBones.WTextureAtlas, function () {
                            var wTextureAtlas = assetLoader.getAsset(_this._textureSrc);
                            if (!wTextureAtlas) {
                                jsonAsset.release();
                                callback();
                                return;
                            }
                            wTextureAtlas.retain();
                            _this._skeletonJSONAsset = jsonAsset;
                            _this._wTextureAtlas = wTextureAtlas;
                            callback();
                        });
                    });
                }
                else {
                    callback();
                }
            };
            SkeletonRenderer.prototype.initArmature = function () {
                var skeletonData, factory, armature, container;
                if (this._skeletonJSONAsset && this._wTextureAtlas && this._armatureName) {
                    factory = new DragonBones.WFactory();
                    skeletonData = this._skeletonJSONAsset.cloneData();
                    factory.addSkeletonData(dragonBones.DataParser.parseDragonBonesData(skeletonData), skeletonData.name);
                    factory.addTextureAtlas(this._wTextureAtlas, this._wTextureAtlas.name);
                    armature = factory.buildArmature(this._armatureName);
                    container = armature.getDisplay();
                    dragonBones.WorldClock.clock.add(armature);
                    DragonBones.setupWorldClock();
                    this._container = container;
                    this._factory = factory;
                    this._armature = armature;
                }
            };
            return SkeletonRenderer;
        })(WOZLLA.Renderer);
        DragonBones.SkeletonRenderer = SkeletonRenderer;
    })(DragonBones = WOZLLA.DragonBones || (WOZLLA.DragonBones = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../../libs/DragonBones.d.ts"/>
/// <reference path="../../src/core/GameObject.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var DragonBones;
    (function (DragonBones) {
        var WSlot = (function (_super) {
            __extends(WSlot, _super);
            function WSlot() {
                _super.call(this, this);
                this._display = null;
            }
            WSlot.prototype.dispose = function () {
                if (this._display) {
                    this._display.destroy();
                    this._display.removeMe();
                }
                _super.prototype.dispose.call(this);
                this._display = null;
            };
            /** @private */
            WSlot.prototype._updateDisplay = function (value) {
                this._display = value;
            };
            //Abstract method
            /** @private */
            WSlot.prototype._getDisplayIndex = function () {
                return -1;
            };
            /** @private */
            WSlot.prototype._addDisplayToContainer = function (container, index) {
                if (index === void 0) { index = -1; }
                var gameObjContainer = container;
                if (this._display && gameObjContainer) {
                    gameObjContainer.addChild(this._display);
                }
            };
            /** @private */
            WSlot.prototype._removeDisplayFromContainer = function () {
                if (this._display && this._display.parent) {
                    this._display.parent.removeChild(this._display);
                }
            };
            /** @private */
            WSlot.prototype._updateTransform = function () {
                var trans;
                if (this._display) {
                    trans = this._display.transform;
                    trans.__local_matrix = this._globalTransformMatrix;
                    trans.dirty = true;
                }
            };
            /** @private */
            WSlot.prototype._updateDisplayVisible = function (value) {
                if (this._display && this._parent) {
                    this._display.visible = this._parent._visible && this._visible && value;
                }
            };
            /** @private */
            WSlot.prototype._updateDisplayColor = function (aOffset, rOffset, gOffset, bOffset, aMultiplier, rMultiplier, gMultiplier, bMultiplier) {
                _super.prototype._updateDisplayColor.call(this, aOffset, rOffset, gOffset, bOffset, aMultiplier, rMultiplier, gMultiplier, bMultiplier);
                if (this._display) {
                    var spriteRenderer = this._display.renderer;
                    if (spriteRenderer) {
                        spriteRenderer.alpha = aMultiplier;
                    }
                }
            };
            /** @private */
            WSlot.prototype._updateDisplayBlendMode = function (value) {
                if (this._display && value) {
                }
            };
            return WSlot;
        })(dragonBones.Slot);
        DragonBones.WSlot = WSlot;
    })(DragonBones = WOZLLA.DragonBones || (WOZLLA.DragonBones = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../../libs/DragonBones.d.ts"/>
/// <reference path="../../src/assets/SpriteAtlas.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var DragonBones;
    (function (DragonBones) {
        function getFileName(url) {
            var idx = url.lastIndexOf('/');
            if (idx !== -1) {
                return url.substr(idx + 1, url.length);
            }
            return url;
        }
        var WTextureAtlas = (function (_super) {
            __extends(WTextureAtlas, _super);
            function WTextureAtlas() {
                _super.apply(this, arguments);
            }
            WTextureAtlas.prototype.dispose = function () {
            };
            WTextureAtlas.prototype.getRegion = function (subTextureName) {
                var sprite = this.getSprite(subTextureName);
                var frame = sprite.frame;
                return new dragonBones.Rectangle(frame.x, frame.y, frame.width, frame.height);
            };
            WTextureAtlas.prototype._loadSpriteAtlas = function (callback) {
                var _this = this;
                WOZLLA.utils.Ajax.request({
                    url: this._metaSrc,
                    contentType: 'json',
                    success: function (data) {
                        var imageSuffix = data.imagePath;
                        var metaFileName = getFileName(_this._metaSrc);
                        _this._imageSrc = _this._metaSrc.replace(new RegExp(metaFileName + '$'), imageSuffix);
                        _this._loadImage(function (error, image) {
                            if (error) {
                                callback && callback(error);
                            }
                            else {
                                var textureData = _this._parseData(data);
                                _this.name = textureData.name;
                                callback && callback(null, image, textureData);
                            }
                        });
                    },
                    error: function (err) {
                        callback('Fail to load sprite: ' + _this._metaSrc + ', ' + err.code + ':' + err.message);
                    }
                });
            };
            WTextureAtlas.prototype._parseData = function (data) {
                var spriteData = {
                    name: data.name,
                    frames: {}
                };
                data.SubTexture.forEach(function (frameData) {
                    spriteData.frames[frameData.name] = { frame: frameData };
                });
                return spriteData;
            };
            return WTextureAtlas;
        })(WOZLLA.assets.SpriteAtlas);
        DragonBones.WTextureAtlas = WTextureAtlas;
    })(DragonBones = WOZLLA.DragonBones || (WOZLLA.DragonBones = {}));
})(WOZLLA || (WOZLLA = {}));
/// <reference path="../../libs/DragonBones.d.ts"/>
/// <reference path="WSlot.ts"/>
/// <reference path="WTextureAtlas.ts"/>
/// <reference path="../../src/core/Scheduler.ts"/>
/// <reference path="../../src/core/GameObject.ts"/>
/// <reference path="../../src/component/renderer/SpriteRenderer.ts"/>
var WOZLLA;
(function (WOZLLA) {
    var DragonBones;
    (function (DragonBones) {
        var clockSetup = false;
        function setupWorldClock() {
            if (clockSetup) {
                return;
            }
            clockSetup = true;
            WOZLLA.Director.getInstance().scheduler.scheduleLoop(function () {
                dragonBones.WorldClock.clock.advanceTime(1 / 60);
            });
        }
        DragonBones.setupWorldClock = setupWorldClock;
        var WFactory = (function (_super) {
            __extends(WFactory, _super);
            function WFactory() {
                _super.call(this, this);
            }
            /** @private */
            WFactory.prototype._generateArmature = function () {
                var container = new WOZLLA.GameObject();
                container.init();
                return new dragonBones.Armature(container);
            };
            /** @private */
            WFactory.prototype._generateSlot = function () {
                return new DragonBones.WSlot();
            };
            /** @private */
            WFactory.prototype._generateDisplay = function (textureAtlas, fullName, pivotX, pivotY) {
                var gameObj = new WOZLLA.GameObject();
                var spriteRenderer = new WOZLLA.component.SpriteRenderer();
                spriteRenderer.sprite = textureAtlas.getSprite(fullName);
                spriteRenderer.spriteOffset = {
                    x: pivotX / spriteRenderer.sprite.frame.width,
                    y: pivotY / spriteRenderer.sprite.frame.height
                };
                gameObj.addComponent(spriteRenderer);
                gameObj.init();
                return gameObj;
            };
            return WFactory;
        })(dragonBones.BaseFactory);
        DragonBones.WFactory = WFactory;
    })(DragonBones = WOZLLA.DragonBones || (WOZLLA.DragonBones = {}));
})(WOZLLA || (WOZLLA = {}));
