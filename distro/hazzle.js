/*!
 * hAzzle.js
 * Copyright (c) 2014 Kenny Flashlight
 * Version: 0.1.5
 * Released under the MIT License.
 *
 * Date: 2014-03-31
 */
(function (window, undefined) {

    // hAzzle already defined, leave now

    if (window['hAzzle']) return;

    var
    doc = window.document,
        byClass = 'getElementsByClassName',
        byTag = 'getElementsByTagName',
        byId = 'getElementById',
        byAll = 'querySelectorAll',
        addEvent = 'addEventListener',
        removeEvent = 'removeEventListener',
        nodeType = 'nodeType',
        own = 'hasOwnProperty',
        call = 'call',
        root = doc.documentElement || {},

        /**
         * Prototype references.
         */

        ArrayProto = Array.prototype,
        ObjProto = Object.prototype,

        /**
         * Create reference for speeding up the access to the prototype.
         */

        slice = ArrayProto.slice,
        splice = ArrayProto.splice,
        concat = ArrayProto.concat,
        indexOf = ArrayProto.indexOf,
        toString = ObjProto.toString,

        getTime = (Date.now || function () {
            return new Date().getTime();
        }),

        nativeKeys = Object.keys || function (obj) {
            if (obj !== Object(obj)) throw "Syntax error, unrecognized expression: Invalid object";
            var keys = [];
            for (var key in obj)
                if (own[call](obj, key)) keys.push(key);
            return keys;
        },

        uid = {
            current: 0,
            next: function () {
                return ++this.current;
            }
        },

        // Cache functions for functions and params

        cached = [],

        // Selector caching

        cache = [],

        // RegExp we are using

        expr = {

            // Events

            namespaceRegex: /[^\.]*(?=\..*)\.|.*/,
            nameRegex: /\..*/,

            specialSplit: /\s*,\s*|\s+/,

            // HTML manipulation

            operators: /[>+]/g,
            multiplier: /\*(\d+)$/,
            id: /#[\w-$]+/g,
            tagname: /^\w+/,
            classname: /\.[\w-$]+/g,
            attributes: /\[([^\]]+)\]/g,
            values: /([\w-]+)(\s*=\s*(['"]?)([^,\]]+)(\3))?/g,
            numbering: /[$]+/g,
            text: /\{(.+)\}/,

            // HTML5 booleans

            booleans: /^(checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped|noresize|declare|nohref|noshade|truespeed|inert|formnovalidate|allowfullscreen|declare|seamless|sortable|typemustmatch)$/i,
            scriptstylelink: /<(?:script|style|link)/i,
            htmlTags: /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
            rtagName: /<([\w:]+)/,

            idClassTagNameExp: /^(?:#([\w-]+)|\.([\w-]+)|(\w+))$/,
            tagNameAndOrIdAndOrClassExp: /^(\w+)(?:#([\w-]+)|)(?:\.([\w-]+)|)$/
        },

        propertyFix = {
            "for": "htmlFor",
            "class": "className"
        },

        // Borrowed from jQuery

        wrapMap = {

            option: [1, "<select multiple='multiple'>", "</select>"],
            thead: [1, "<table>", "</table>"],
            col: [2, "<table><colgroup>", "</colgroup></table>"],
            tr: [2, "<table><tbody>", "</tbody></table>"],
            td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],

            _default: [0, "", ""]
        },
        // Different nodeTypes we are checking against for faster speed

        nodeTypes = {
            '1': function (elem) {
                if (elem["nodeType"] === 1) return true; // Element
            },
            '2': function (elem) {
                if (elem["nodeType"] === 2) return true; // Attr
            },

            '3': function (elem) {
                if (elem["nodeType"] === 3) return true; // Text
            },
            '4': function (elem) {
                if (elem["nodeType"] === 4) return true; // 
            },
            '6': function (elem) {
                if (elem["nodeType"] === 6) return true; // Entity
            },
            '9': function (elem) {
                if (elem["nodeType"] === 9) return true; // Document
            },
            '11': function (elem) {
                if (elem["nodeType"] === 11) return true; // Documentfragment
            }
        },

        // Dummy div we are using in different functions

        ghost = doc.createElement('div'),

        // Main function

        hAzzle = function (sel, ctx) {
            return new hAzzle.fn.init(sel, ctx);
        };

    /**
     * An object used to flag environments/features.
     */

    var support = hAzzle.support = {};

    (function () {



        /**
         * Detect querySelectorAll support.
         */

        support.byAll = !! doc[byAll];

        /**
         * Detect classList support.
         */

        support.classList = !! doc.createElement('p').classList;

    }());

    hAzzle.fn = hAzzle.prototype = {

        // Default length allways 0

        length: 0,

        toArray: function () {

            return slice.call(this);

        },

        init: function (sel, ctx) {

            var elems, i;

            if (sel instanceof hAzzle) {
                return sel;
            }

            if (hAzzle.isString(sel)) {

                if (cache[sel] && !ctx) {

                    this.elems = elems = cache[sel];
                    this.length = elems.length;

                    for (i = elems.length; i--;) {

                        this[i] = elems[i];
                    }

                    return this;
                }

                this.elems = cache[sel] = hAzzle.select(sel, ctx);

                // Function - Document ready

            } else if (hAzzle.isFunction(sel)) {

                return hAzzle.ready(sel);

                // Array

            } else if (sel instanceof Array) {

                this.elems = hAzzle.unique(sel.filter(hAzzle.isElement));

                // Object

            } else if (hAzzle.isObject(sel)) {

                this.elems = sel;
                this.length = 1;
                this[0] = sel;

                return this;

            } else if (hAzzle.isNodeList(sel)) {

                this.elems = slice.call(sel).filter(hAzzle.isElement);

                // nodeType

            } else if (hAzzle.isElement(sel)) {

                this.elems = [sel];

            } else {

                this.elems = [];
            }

            elems = this.elems;

            this.length = elems.length;

            for (i = elems.length; i--;) {

                this[i] = elems[i];
            }

            // Prevent memory leaks

            sel = ctx = i = elems = null;

            // Return the hAzzle object

            return this;
        },

        /**
         * Run callback for each element in the collection
         *
         * @param {Function} callback
         * @return {Object}
         */

        each: function (callback, args) {
            return hAzzle.each(this, callback, args);
        },

        /**
         * Filter element collection
         *
         * @param {String|Function} sel
         * @return {Object}
         */

        find: function (sel) {
            if (sel) {
                var elements;
                if (this.length === 1) {
                    elements = hAzzle(this.elems[0], sel);
                } else {
                    elements = this.elems.reduce(function (elements, element) {
                        return elements.concat(hAzzle.select(sel, element));
                    }, []);
                }
                return hAzzle.create(elements);
            }
            return this;
        },

        /**
         * Filter the collection to contain only items that match the CSS selector
         */

        filter: function (sel, inverse) {
            if (hAzzle.isFunction(sel)) {
                var fn = sel;
                return hAzzle.create(this.elems.filter(function (element, index) {
                    return fn.call(element, element, index) !== (inverse || false);

                }));
            }
            if (sel && sel[0] === '!') {
                sel = sel.substr(1);
                inverse = true;
            }
            return hAzzle.create(this.elems.filter(function (element) {
                return hAzzle.matches(element, sel) !== (inverse || false);
            }));
        },


        /**
         * Check to see if a DOM element is a descendant of another DOM element.
         *
         * @param {String} sel
         *
         * @return {Boolean}
         */
        contains: function (sel) {
            var matches;
            return hAzzle.create(this.elems.reduce(function (elements, element) {
                matches = hAzzle.select(sel, element);
                return elements.concat(matches.length ? element : null);
            }, []));
        },

        /**
         * Get elements in list but not with this selector
         *
         * @param {String} sel
         * @return {Object}
         *
         * @speed:  89% faster then jQuery and Zepto
         */

        not: function (sel) {
            return cached[sel] ? cached[sel] : cached[sel] = this.filter(sel || [], true);
        },

        /**
         * Check if the first element in the element collection matches the selector
         *
         * @param {String|Object} sel
         * @return {Boolean}
         *
         * @speed:  91% faster then jQuery and Zepto
         */

        is: function (sel) {
            return cached[sel] ? cached[sel] : cached[sel] = this.length > 0 && this.filter(sel || []).length > 0;
        },

        /**
         * Fetch property from the "elems" stack
         *
         * @param {String} prop
         * @param {Number|Null} nt
         * @return {Array}
         *
         * 'nt' are used if we need to exclude certain nodeTypes.
         *
         * Example: pluck('parentNode'), selector, 11)
         *
         * In the example above, the parentNode will only be returned if
         *  nodeType !== 11
         *
         */

        pluck: function (prop, nt) {
            if (!cached[prop]) {
                if (nt && hAzzle.isNumber(nt)) {
                    if (!nodeTypes[nt]) cached[prop] = hAzzle.pluck(this.elems, prop);
                } else cached[prop] = hAzzle.pluck(this.elems, prop);
                cached[prop] = hAzzle.pluck(this.elems, prop);
            }
            return cached[prop] || [];
        },

        /**
         * Put a element on the "elems" stack
         *
         * @param {String} prop
         * @param {String} value
         * @return {Array}
         */

        put: function (prop, value) {
            hAzzle.put(this.elems, prop, value);
            return this;
        },

        /**
         * Get the Nth element in the matched element set
         *
         * @param {Number} num
         * @return {object}
         */

        get: function (num) {
            return cached[num] ? cached[num] : cached[num] = null === num ? this.elems.slice() : this.elems[0 > num ? this.elems.length + num : num];
        },

        /**
         * Map the elements in the "elems" stack
         */
        map: function (fn) {
            return cached[fn] ? cached[fn] : cached[fn] = hAzzle(this.elems.map(fn));
        },

        /**
         * Sort the elements in the "elems" stack
         */

        sort: function (elm) {
            return cached[elm] ? cached[elm] : cached[elm] = hAzzle(this.elems.sort(elm));
        },

        /**
         *  Concatenate two elements lists
         */
        concat: function () {
            var args = slice.call(arguments).map(function (arr) {
                return arr instanceof hAzzle ? arr.elements : arr;
            });

            return hAzzle(concat.apply(this.elems, args));
        },

        /**
         * Slice elements in the "elems" stack
         */

        slice: function (start, end) {

            return cached[start] ? cached[start] : cached[start] = hAzzle(slice.call(this.elems, start, end));
        },

        splice: function (start, end) {
            return cached[start] ? cached[start] : cached[start] = hAzzle(splice.call(this.elems, start, end));
        },

        /**
         * Take an element and push it onto the "elems" stack
         */

        push: function (itm) {
            return hAzzle.isElement(itm) ? (this.elems.push(itm), this.length = this.elems.length, this.length - 1) : -1;
        },

        /**
         * Determine if the "elems" stack contains a given value
         *
         * @return {Boolean}
         */

        indexOf: function (needle) {
            if (!cached[needle]) {
                cached[needle] = this.elems.indexOf(needle);
            }
            return cached[needle];
        },

        /**
         * Reduce the number of elems in the "elems" stack
         */

        reduce: function (a, b, c, d) {
            if (!cached[a]) {
                cached[a] = this.elems.reduce(a, b, c, d);
            }
            return cached[a];
        },

        /**
         * Reduce to right, the number of elems in the "elems" stack
         */

        reduceRight: function (a, b, c, d) {
            if (!cached[a]) {
                cached[a] = this.elems.reduceRight(a, b, c, d);
            }
            return cached[a];
        },



        /**
         * Iterate through elements in the collection
         */

        iterate: function (method, ctx) {
            return function (a, b, c, d) {
                return this.each(function (element) {
                    method.call(ctx, element, a, b, c, d);
                });
            };
        },

        /**
         * Get the element at position specified by index from the current collection.
         *
         * @param {Number} index
         * @return {Object}
         */
        eq: function (index) {
            return index === null ? hAzzle() : hAzzle(this.get(index));
        }
    };

    hAzzle.fn.init.prototype = hAzzle.fn;


    /**
     * Extend `hAzzle` with arguments, if the arguments length is one, the extend target is `hAzzle`
     */

    hAzzle.extend = hAzzle.fn.extend = function () {
        var target = arguments[0] || {};

        if (typeof target !== 'object' && typeof target !== 'function') {
            target = {};
        }

        if (arguments.length === 1) target = this;

        var slarg = slice.call(arguments),
            value;

        for (var i = slarg.length; i--;) {
            value = slarg[i];
            for (var key in value) {
                if (target[key] !== value[key]) target[key] = value[key];
            }
        }

        return target;
    };


    hAzzle.extend({

        each: function (obj, callback) {
            var i = 0,
                length = obj.length;

            if (obj.length === +obj.length) {

                for (; i < length;) {
                    if (callback.call(obj[i], i, obj[i++]) === false) {
                        break;
                    }
                }

            } else {

                // Use object.keys if the browser supports it

                var keys = nativeKeys(obj);

                for (i = keys.length; i--;) {
                    if (callback.call(obj[keys], name, obj[keys]) === false) {
                        break;
                    }
                }
            }

            return obj;
        },

        type: function (obj) {
            var ref = toString.call(obj).match(/\s(\w+)\]$/);
            return ref && ref[1].toLowerCase();
        },

        is: function (kind, obj) {
            return hAzzle.indexOf(kind, hAzzle.type(obj)) >= 0;
        },

        isElement: function (elem) {
            return elem && (nodeTypes[1](elem) || nodeTypes[9](elem));
        },

        isNodeList: function (obj) {
            return obj && hAzzle.is(['nodelist', 'htmlcollection', 'htmlformcontrolscollection'], obj);
        },

        IsNaN: function (val) {
            return !(0 >= val) && !(0 < val);
        },

        isUndefined: function (value) {
            return typeof value === 'undefined';
        },

        isDefined: function (value) {
            return typeof value !== 'undefined';
        },

        isObject: function (value) {
            return value !== null && typeof value == 'object';
        },

        isString: function (value) {
            return typeof value === 'string';
        },

        isNumeric: function (obj) {
            return !hAzzle.IsNaN(parseFloat(obj)) && isFinite(obj);
        },
        isEmptyObject: function (obj) {
            var name;
            for (name in obj) {
                return false;
            }
            return true;
        },

        isFunction: function (value) {
            return typeof value === 'function';
        },

        isArray: Array.isArray,

        isArrayLike: function (elem) {
            if (elem === null || hAzzle.isWindow(elem)) return false;
        },

        isWindow: function (obj) {
            return obj !== null && obj === obj.window;
        },

        isPlainObject: function (obj) {
            return hAzzle.isObject(obj) && !hAzzle.isWindow(obj) && Object.getPrototypeOf(obj) === ObjProto;
        },
        isBoolean: function (str) {
            return typeof str === 'boolean';
        },

        unique: function (array) {
            return array.filter(function (item, idx) {
                return hAzzle.indexOf(array, item) === idx;
            });
        },

        /**
         * Creates a new hAzzle instance applying a filter if necessary
         */

        create: function (elements, sel) {
            return hAzzle.isUndefined(sel) ? hAzzle(elements) : hAzzle(elements).filter(sel);
        },

        /**
         * Get correct CSS browser prefix
         */

        prefix: function (key, obj) {
            var result, upcased = key[0].toUpperCase() + key.substring(1),
                prefix,
                prefixes = ['moz', 'webkit', 'ms', 'o'];

            obj = obj || window;

            if (result = obj[key]) {
                return result;
            }

            while (prefix = prefixes.shift()) {
                if (result = obj[prefix + upcased]) {
                    break;
                }
            }
            return result;
        },


        /** 
         * Returns a predicate for checking whether an object has a given set of `key:value` pairs.
         */

        matches: function (element, sel) {

            var matchesSelector, match;

            if (!element || !hAzzle.isElement(element) || !sel) {
                return false;
            }

            if (sel['nodeType']) {
                return element === sel;
            }

            if (sel instanceof hAzzle) {
                return sel.elements.some(function (sel) {
                    return hAzzle.matches(element, sel);
                });
            }

            if (element === doc) {
                return false;
            }
            matchesSelector = hAzzle.prefix('matchesSelector', ghost);

            if (matchesSelector) {
                return matchesSelector.call(element, sel);
            }

            // Fall back to performing a selector:

            if (!element.parentNode) {
                ghost.appendChild(element);
            }

            match = hAzzle.indexOf(hAzzle.select(sel, element.parentNode), element) >= 0;

            if (element.parentNode === ghost) {
                ghost.removeChild(element);
            }
            return match;
        },

        /**
         * Same as the 'internal' pluck method, except this one is global
         */

        pluck: function (array, property, nt) {
            return array.map(function (item) {
                if (nt) {
                    if (!nodeTypes[nt]) return item[property];
                } else return item[property];
            });
        },

        /**
         * Determine if the element contains the klass.
         * Uses the `classList` api if it's supported.
         * https://developer.mozilla.org/en-US/docs/Web/API/Element.classList
         *
         * @param {Object} el
         * @param {String} klass
         *
         * @return {Array}
         */

        containsClass: function (el, klass) {
            if (support.classList) {
                return el.classList.contains(klass);
            } else {
                return hAzzle.contains(('' + el.className).split(' '), klass);
            }
        },

        /**
         * Normalize context.
         *
         * @param {String|Array} ctx
         *
         * @return {Object}
         */

        normalizeCtx: function (ctx) {
            if (!ctx) return doc;
            if (typeof ctx === 'string') return hAzzle.select(ctx)[0];
            if (!ctx[nodeType] && ctx instanceof Array) return ctx[0];
            if (ctx[nodeType]) return ctx;
        },

        /**
         * Find elements by selectors.
         *
         * @param {String} sel
         * @param {Object} ctx
         * @return {Object}
         */

        select: function (sel, ctx) {

            var m, els = [];

            // Get the right context to use.

            ctx = hAzzle.normalizeCtx(ctx);

            if (m = expr['idClassTagNameExp'].exec(sel)) {
                if ((sel = m[1])) {
                    els = ((els = ctx[byId](sel))) ? [els] : [];
                } else if ((sel = m[2])) {
                    els = ctx[byClass](sel);
                } else if ((sel = m[3])) {
                    els = ctx[byTag](sel);
                }
            } else if (m = expr['tagNameAndOrIdAndOrClassExp'].exec(sel)) {
                var result = ctx[byTag](m[1]),
                    id = m[2],
                    className = m[3];
                hAzzle.each(result, function (index, el) {
                    if (el.id === id || hAzzle.containsClass(el, className)) els.push(el);
                });
            } else { // QuerySelectorAll
                els = ctx[byAll](sel);
            }

            return hAzzle.isNodeList(els) ? slice.call(els) : hAzzle.isElement(els) ? [els] : els;

        },


        /**
         * Check if an element contains another element
         */

        contains: function (obj, target) {
            if (target) {
                while ((target = target.parentNode)) {
                    if (target === obj) {
                        return true;
                    }
                }
            }
            return false;
        },
        /**
         * Native indexOf is slow and the value is enough for us as argument.
         * Therefor we create our own
         */

        indexOf: function (array, obj) {
            for (var i = 0, len; len = array[i]; i += 1) {
                if (obj === len) return i;
            }
            return !1;
        },
        nodeName: function (elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();

        },

        /** 
         * Return current time
         */

        now: function () {
            return getTime();
        },

        /**
         * Check if an element are a specific NodeType
         *
         * @param{Number} val
         * @param{Object} elem
         * @return{Boolean}
         **/

        nodeType: function (val, elem) {
            if (nodeTypes[val]) return nodeTypes[val](elem);
        },

        /**
         * Remove empty whitespace from beginning and end of a string
         *
         * @param{String} str
         * @return{String}
         */

        trim: function (str) {

            return String.prototype.trim ? str.trim() : str.replace(/^\s*/, "").replace(/\s*$/, "");
        },

        noop: function () {

        },

        inArray: function (elem, arr, i) {

            return arr === null ? -1 : indexOf.call(arr, elem, i);
        },

        /**
         * Get / set an elements ID
         *
         * @param{Object} elem
         * @return{Object}
         */

        getUID: function (elem) {
            return elem.hAzzle_id || (elem.hAzzle_id = uid.next());
        },

        nextUID: function (elem) {
            return elem.hAzzle_id = uid.next();
        },

        /**
         * Set values on elements in an array
         *

         * @param{Array} array
         * @param{String} prop
         * @param{String} value
         * @return{Object}
         */


        put: function (array, prop, value) {
            return hAzzle.each(array, function (index) {
                array[index][prop] = value;
            });
        }
    });

    // **************************************************************
    // DOM READY (module)
    // **************************************************************


    var fns = [],
        args = [],
        call = 'call',
        isReady = false,
        errorHandler = null;

    /**
     * Prepare a ready handler
     * @private
     * @param {function} fn
     */

    function prepareDOM(fn) {

        try {
            // Call function
            fn.apply(this, args);
        } catch (e) {
            // Error occured while executing function
            if (null !== errorHandler) errorHandler[call](this, fn);
        }
    }

    /**
     * Call all ready handlers
     */

    function run() {

        isReady = true;

        for (var x = 0, len = fns.length; x < len; x = x + 1) prepareDOM(fns[x]);
        fns = [];
    }

    hAzzle.extend({

        ready: function (fn) {

            // Let the event live only once and then die...

            document.addEventListener('DOMContentLoaded', function () {
                run();
            }, true);

            if (isReady) prepareDOM(fn);
            else fns[fns.length] = fn;
        }

    });


    // **************************************************************
    // DOM TRAVERSING
    // **************************************************************

    hAzzle.extend({

        /**
         * Walks the DOM tree using `method`, returns when an element node is found
         */

        getClosestNode: function (element, method, sel) {
            if (!element || element === null) return;
            do {
                element = element[method];
            } while (element && ((sel && !hAzzle.matches(sel, element)) || !hAzzle.isElement(element)));
            return element;
        }
    });
    // Extend hAzzle

    hAzzle.fn.extend({

        /**
         * Fetch property from elements
         *
         * @param {String} prop
         * @return {Array}
         */

        pluckNode: function (prop) {
            if (!prop) return;
            return this.map(function (element) {
                return hAzzle.getClosestNode(element, prop);
            });
        },

        /**
         * Get the first element that matches the selector, beginning at the current element and progressing up through the DOM tree.
         *
         * @param {String} sel
         * @return {Object}
         *
         * @speed: 99% faster then jQuery and Zepto
         */

        closest: function (sel) {
            if (!sel) return;
            return cached[sel] ? cached[sel] : cached[sel] = this.map(function (element) {
                return hAzzle.matches(element, sel) ? element : hAzzle.getClosestNode(element, "parentNode", sel);
            });
        },

        /** Determine the position of an element within the matched set of elements
         *
         * @param {string} elem
         * @param {return} Object
         *
         * @speed:  83% faster then jQuery and Zepto
         */

        index: function (elem) {
            if (!elem) return;
            return cached[elem] ? cached[elem] : cached[elem] = elem ? this.indexOf(hAzzle(elem).elems[0]) : this.parent().children().indexOf(this.elems[0]) || -1;
        },

        /**
         * Add elements to the set of matched elements.
         *
         * @param {String} sel
         * @param {String} ctx
         * @return {Object}
         *
         * @speed: 41% faster then jQuery and Zepto
         *
         */

        add: function (sel, ctx) {
            var elements = sel;
            if (hAzzle.isString(sel)) {
                elements = cached[sel] ? cached[sel] : cached[sel] = hAzzle(sel, ctx).elems;
            }
            return this.concat(elements);
        },

        /**
         * Get immediate parents of each element in the collection.
         * If CSS selector is given, filter results to include only ones matching the selector.
         *
         * @param {String} sel
         * @return {Object}
         *
         * @speed: 98%% faster then jQuery and Zepto
         */

        parent: function (sel) {
            if (!sel) return;
            return cached[sel] ? cached[sel] : cached[sel] = hAzzle.create(this.pluck('parentNode'), sel, /* NodeType 11 */ 11);
        },

        /**
         *  Get the ancestors of each element in the current set of matched elements
         *
         * @param {String} sel
         * @return {Object}
         */

        parents: function (sel) {
            var ancestors = [],
                elements = this.elems,
                fn = function (element) {
                    if ((element = element.parentNode) && element !== doc && ancestors.indexOf(element) < 0) {
                        ancestors.push(element);
                        return element;
                    }
                };

            while (elements.length > 0 && elements[0] !== undefined) {
                elements = elements.map(fn);
            }
            return hAzzle.create(ancestors, sel);
        },


        /**
         * Get all decending elements of a given element
         * If selector is given, filter the results to only include ones matching the CSS selector.
         *
         * @param {String} sel
         * @return {Object}
         */

        children: function (sel) {
            if (!sel) return;
            return cached[sel] ? cached[sel] : cached[sel] = hAzzle.create(this.elems.reduce(function (elements, element) {
                var childrens = slice.call(element.children);
                return elements.concat(childrens);
            }, []), sel);

        },

        /**
         *  Return the element's next sibling
         * @return {Object}
         *
         * @speed:  98% faster then jQuery and Zepto
         */

        next: function () {
            return hAzzle.create(this.pluckNode('nextSibling'));
        },

        /**
         *  Return the element's previous sibling
         * @return {Object}
         *
         * @speed:  98% faster then jQuery and Zepto
         */

        prev: function () {
            return hAzzle.create(this.pluckNode('previousSibling'));
        },

        /**
         * Reduce the set of matched elements to the first in the set.
         *
         * @speed:  98% faster then jQuery and Zepto
         */

        first: function () {
            return hAzzle.create(this.get(0));
        },

        /**
         * Reduce the set of matched elements to the last one in the set.
         *
         * @speed:  98% faster then jQuery and Zepto
         */

        last: function () {
            return hAzzle.create(this.get(-1));
        },

        /**
         * Return the element's siblings
         * @param {String} sel
         * @return {Object}
         *
         * @speed:  98% faster then jQuery and Zepto
         */

        siblings: function (sel) {
            if (!sel) return;
            var siblings = [],
                children,
                i,
                len;

            if (!cached[sel]) {
                this.each(function (index, element) {
                    children = slice.call(element.parentNode.childNodes); // DO NOT CACHE HERE!!
                    for (i = 0, len = children.length; i < len; i++) {
                        if (hAzzle.isElement(children[i]) && children[i] !== element) {
                            siblings.push(children[i]);
                        }
                    }
                });
                cached[sel] = siblings;
            }
            return hAzzle.create(cached[sel], sel);
        }

    });

    // **************************************************************
    // DOM TRAVERSING
    // **************************************************************

    var data = {};

    /**
     * Store data on an element
     */

    function set(element, key, value) {
        var id = hAzzle.getUID(element),
            obj = data[id] || (data[id] = {});
        obj[key] = value;
    }

    /**
     * Get data from an element
     */

    function get(element, key) {
        var obj = data[hAzzle.getUID(element)];
        if (key == null) {
            return obj;
        }
        return obj && obj[key];
    }

    /**
     * Check if an element contains any data
     */

    function has(element, key) {
        var obj = data[hAzzle.getUID(element)];
        if (key == null) {
            return false;
        }
        if (obj && obj[key]) return true;
    }

    /**
     * Remove data from an element
     */

    function remove(element, key) {
        var obj = data[hAzzle.getUID(element)];

        if (!key) {

            /* FIX ME !!
  
     If no key, need to find all data on the element, and reomve data without knowing the key 
    */

            return false;
        }
        delete obj[key];

    }

    hAzzle.extend({

        /**
         * Check if an element contains data
         *
         * @param{String/Object} elem
         * @param{String} key
         */
        hasData: function (elem, key) {

            if (elem instanceof hAzzle) {
                if (has(elem, key)) return true;
            } else if (has(hAzzle(elem)[0], key)) return true;
            return false;
        },

        /**
         * Remove data from an element
         */
        removeData: function (elem, key) {
            if (elem instanceof hAzzle) {
                if (remove(elem, key)) return true;
            } else if (remove(hAzzle(elem)[0], key)) return true;
            return false;
        }
    });

    hAzzle.fn.extend({

        /**
         * Remove attributes from element collection
         *
         * @param {String} key
         *
         * @return {Object}
         */

        removeData: function (key) {
            this.each(function (index, element) {
                remove(element, key);
            })
            return this;
        },

        /**
         * Store random data on the hAzzle Object
         *
         * @param {String} obj
         * @param {String|Object} value
         *
         * @return {Object|String}
         *
         *
         * IN THE FUTURE:
         * =============
         *
         * Add option for saving and restoring data with objects
         *
         */

        data: function (key, value) {
            return hAzzle.isDefined(value) ? (this.each(function (index, element) {
                // Sets multiple values
                set(element, key, value);
            }), this) : this.elems.length === 1 ? get(this.elems[0], key) : this.elems.map(function (value) {
                // Get data from an single element in the "elems" stack
                return get(value, key);
            })
        }

    });


    // **************************************************************
    // DOM MANIPULATION
    // **************************************************************

    function NodeMatching(elem) {
        return hAzzle.nodeType(1, elem) || hAzzle.nodeType(9, elem) || hAzzle.nodeType(11, elem) ? true : false;
    }


    // Global

    hAzzle.extend({

        /**
         * Get attributes
         */

        getAttr: function (element, name) {
            if (name === 'value' && element.nodeName.toLowerCase() == 'input') {
                return hAzzle.getValue(element);
            }
            return element.getAttribute(name);
        },

        /**
         * Remove attributes
         */

        removeAttr: function (elem, value) {
            var name, propName,
                i = 0,
                attrNames = value && value.match((/\S+/g));

            if (attrNames && hAzzle.nodeType(1, elem)) {
                while ((name = attrNames[i++])) {
                    propName = propertyFix[name] || name;
                    if (expr['booleans'].test(name)) {
                        elem[propName] = false;
                    }

                    elem.removeAttribute(name);
                }
            }
        },

        getValue: function (elem) {

            // HTML Option

            if (elem.multiple) {
                return hAzzle(elem).find('option').filter(function (option) {
                    return option.selected && !option.disabled;
                }).pluck('value');
            }

            // Return normal value

            return elem.value;
        },

        /**
         * Get text
         */

        getText: function (elem) {
            var node, ret = "",
                i = 0;

            if (!elem.nodeType) {
                // If no nodeType, this is expected to be an array
                for (; node = elem[i++];) ret += hAzzle.getText(node);

            } else if (NodeMatching(elem)) {

                if (hAzzle.isString(elem.textContent)) return elem.textContent;
                for (elem = elem.firstChild; elem; elem = elem.nextSibling) ret += hAzzle.getText(elem);

            } else if (hAzzle.nodeType(3, elem) || hAzzle.nodeType(4, elem)) {
                return elem.nodeValue;
            }
            return ret;
        }

    });

    // Core

    hAzzle.fn.extend({

        /**
         * Get text for the first element in the collection
         * Set text for every element in the collection
         *
         * hAzzle('div').text() => div text
         *
         * @param {String} value
         * @return {Object|String}
         */

        text: function (value) {
            return hAzzle.isUndefined(value) ?
                hAzzle.getText(this) :
                this.empty().each(function () {
                    if (NodeMatching(this)) {
                        this.textContent = value;
                    }
                });
        },

        /**
         * Get html from element.
         * Set html to element.
         *
         * @param {Object|String} st
         * @return {Object|String}
         */

        html: function (value) {

            if (hAzzle.isUndefined(value) && hAzzle.nodeType(11, this[0])) {
                return this[0].innerHTML;
            }

            if (hAzzle.isString(value) && !expr['scriptstylelink'].test(value) && !wrapMap[(expr['rtagName'].exec(value) || ["", ""])[1].toLowerCase()]) {

                value = value.replace(expr['htmlTags'], "<$1></$2>");

                return this.each(function (index, elem) {
                    if (hAzzle.nodeType(1, elem)) {
                        elem.innerHTML = value || "";
                    }
                    elem = 0;
                });
            }

            // Return innerHTML only from the first elem in the collection

            return this[0] && this[0].innerHTML;
        },

        /**
         * Remove all childNodes from an element
         *
         * @return {Object}
         */

        empty: function () {

            var children;

            /* We have to loop through all elemets in the collection, and remove
      all children to prevent memory leaks */

            this.each(function (index, elem) {

                children = elem[byTag]('*');

                // Remove all the "ugly" children we want to remove

                for (var i = children.length; i--;) {

                    children[i].remove();
                }

            });

            // Get rid of the textcontext on the parents	
            // Firefox support 'textContent' or not??

            return this.put('textContent', '');
        },


        /**
         * Create a deep copy of the element and it's children
         *
         * TODO!!
         *
         *  - Use documentfrag
         *  - Clone data
         *  - Clone events
         */

        clone: function () {
            return this.map(function (index, element) {
                return element.cloneNode(true);
            });
        },

        /**
         *  Remove an element from the DOM
         *
         * TODO!!
         *
         *  - Remove events
         *  - Remove data
         */

        remove: function () {
            return this.each(function (index, element) {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        },


        /**
         * Get value for input/select elements
         * Set value for input/select elements
         *
         * @param {String} value
         * @return {Object|String}
         */
        val: function (value) {

            if (!value) {
                return elem && hAzzle.getValue(this[0]);
            }

            return this.each(function (index, element) {
                var val;

                if (!hAzzle.nodeType(1, element)) {
                    return;
                }

                if (hAzzle.isFunction(value)) {
                    val = value.call(this, index, hAzzle(this).val());
                } else {
                    val = value;
                }

                if (val === null) {

                    val = "";

                } else if (typeof val === "number") {
                    val += "";
                }

                element.value = val;
            });
        },

        /**
         * Get attribute from element
         * Set attribute to element collection
         *
         * @param {String} name
         * @param {String|Object} value
         *
         * @return {Object|String}
         */

        attr: function (name, value) {

            if (typeof name === 'object') {
                return this.each(function (index, element) {

                    if (hAzzle.nodeType(3, element) || hAzzle.nodeType(8, element) || hAzzle.nodeType(2, element)) {
                        return;
                    }
                    hAzzle.each(name, function (value, key) {
                        element.setAttribute(key, value + "");
                    });
                });
            }
            return typeof value === 'undefined' ? this[0] && hAzzle.getAttr(this[0], name) : this.each(function (index, element) {

                if (hAzzle.nodeType(3, element) || hAzzle.nodeType(8, element) || hAzzle.nodeType(2, element)) {
                    return;
                }

                element.setAttribute(name, value + "");
            });
        },

        /**
         * Remove a given attribute from an element
         *
         * @param {String} value
         *
         * @return {Object}
         */

        removeAttr: function (elem, value) {
            if (!value) return;
            return this.each(function (index, element) {
                hAzzle.removeAttr(element, value);
            });
        },

        prop: function (name, value) {
            if (hAzzle.isObject(name)) {
                return this.each(function (index, element) {

                    if (hAzzle.nodeType(3, element) || hAzzle.nodeType(8, element) || hAzzle.nodeType(2, element)) {
                        return;
                    }
                    hAzzle.each(name, function (value, key) {
                        element[key] = value;
                    });
                });
            }
            if (hAzzle.isUndefined(value)) {

                return this[0] && this[0][name];
            } else {

                if (!hAzzle.nodeType(3, this[0]) || !hAzzle.nodeType(8, this[0]) || !hAzzle.nodeType(2, this[0])) {
                    return this.put(name, value);
                }
            }
        },

        /**
         * Append node to one or more elements.
         *
         * @param {Object|String} html
         * @return {Object}
         */
        append: function (html) {
            return this.each(function (index, elem) {
                if (hAzzle.isString(html)) {
                    elem.insertAdjacentHTML('beforeend', html)
                } else {
                    if (hAzzle.nodeType(1, elem) || hAzzle.nodeType(11, elem) || hAzzle.nodeType(9, elem)) {
                        elem.appendChild(html)
                    }
                }
            });
        },

        /**
         * Prepend node to element.
         *
         * @param {Object|String} html
         * @return {Object}
         */

        prepend: function (html) {
            var first;
            return this.each(function (index, elem) {
                if (hAzzle.isString(html)) {
                    elem.insertAdjacentHTML('afterbegin', html)
                } else if (first = elem.childNodes[0]) {
                    elem.insertBefore(html, first)
                } else {
                    if (hAzzle.nodeType(1, elem) || hAzzle.nodeType(11, elem) || hAzzle.nodeType(9, elem)) {
                        elem.appendChild(html)
                    }
                }
            });
        },

        /**
         * Add node after element.
         *
         * @param {Object|String} html
         * @return {Object}
         */

        after: function (html) {
            var next
            return this.each(function (index, elem) {
                if (hAzzle.isString(html)) {
                    elem.insertAdjacentHTML('afterend', html)
                } else if (next = hAzzle.getClosestNode(elem, 'nextSibling')) {
                    if (elem.parentNode) elem.parentNode.insertBefore(html, next)
                } else {
                    if (elem.parentNode) elem.parentNode.appendChild(html)
                }
            });
        },

        /**
         * Add node before element.
         *
         * @param {Object|String} html
         * @return {Object}
         */

        before: function (html) {
            return this.each(function (index, elem) {
                if (hAzzle.isString(html)) {
                    elem.insertAdjacentHTML('beforebegin', html)
                } else {
                    if (elem.parentNode) elem.parentNode.insertBefore(html, elem)
                }
            });
        }
    });


    // **************************************************************
    // HTML
    // **************************************************************

    function toHTML() {
        var div = document.createElement('div');
        div.appendChild(this.cloneNode(true));
        return div.innerHTML;
    }

    // Pads number `n` with `ln` zeroes.
    function pad(n, ln) {
        n = n.toString();
        while (n.length < ln) n = '0' + n;
        return n;
    }

    /** Replaces ocurrences of '$' with the equivalent padded index.
     * `$$ == 01`, `$$$$ == 0001`
     */

    function numbered(value, n) {
        return value.replace(expr['numbering'], function (m) {
            return pad(n + 1, m.length);
        });
    }

    var call = Function.prototype.call,
        trim = String.prototype.trim;


    hAzzle.extend({

        /**
         * Create a DOM element.
         *
         * @param{Number} index
         * @param{String} tag
         * @param{String} id
         * @param{String} className
         * @param{String} text
         * @param{Object} attrs
         *
         * @return{Object}
         */

        createDOMElem: function (index, tag, id, className, text, attrs) {

            var element = document.createElement(tag);

            if (id) element.id = numbered(id, index);
            if (className) element.className = numbered(className, index);
            if (text) element.appendChild(document.createTextNode(text));

            if (attrs)

                for (var key in attrs) {
                    if (!attrs.hasOwnProperty(key)) continue;
                    element.setAttribute(key, numbered(attrs[key], index));
                }

            return element;
        },

        parseHTML: function (str, data) {

            var parts = cached[str] ? cached[str] : cached[str] = str.split(expr['operators']).map(call, trim),

                // Avoid DOM insertion too many times, so we cache
                tree = cached[data] ? cached[data] : cached[data] = document.createDocumentFragment(),
                match,
                parents = [tree];

            // Go over the abbreviations one level at a time, and process
            // corresponding element values

            hAzzle.each(parts, function (i, original) {

                var part = original,
                    op = (expr['operators'].exec(str) || [])[0],
                    count = 1,
                    tag, id, classes, text, attrs = {};

                // #### Attributes
                // Attributes are parsed first then removed so that it takes precedence
                // over IDs and classNames for the `#.` characters.

                if (match = part.match(expr['attributes'])) {

                    var matched = match[match.length - 1];

                    while (match = expr['values'].exec(matched)) {
                        attrs[match[1]] = (match[4] || '').replace(/['"]/g, '').trim();
                    }

                    part = part.replace(expr['attributes'], '');
                }

                // #### Multipliers
                if (match = part.match(expr['multiplier'])) {
                    var times = +match[1];
                    if (times > 0) count = times;
                }

                // #### IDs
                if (match = part.match(expr['id'])) {
                    id = match[match.length - 1].slice(1);
                }

                // #### Tag names
                if (match = part.match(expr['tagname'])) {
                    tag = match[0];
                } else {
                    tag = 'div';
                }

                // #### Class names
                if (match = part.match(expr['classname'])) {
                    classes = match.map(function (c) {
                        return c.slice(1);
                    }).join(' ');
                }

                // #### Text
                if (match = part.match(expr['text'])) {
                    text = match[1];
                    if (data) {
                        text = text.replace(/\$(\w+)/g, function (m, key) {
                            return data[key];
                        });
                    }
                }

                // Insert `count` copies of the element per parent. If the current operator
                // is `+` we mark the elements to remove it from `parents` in the next iteration.


                hAzzle.each(slice.call(parents, 0), function (parentIndex, parent) {

                    for (var index = 0; index < count; index++) {
                        // Use parentIndex if this element has a count of 1
                        var _index = count > 1 ? index : parentIndex;

                        var element = hAzzle.createDOMElem(_index, tag, id, classes, text, attrs);

                        if (op === '+') element._sibling = true;

                        parent.appendChild(element);
                    }
                });

                // If the next operator is '>' replace `parents` with their childNodes for the next iteration.
                if (op === '>') {
                    parents = parents.reduce(function (p, c, i, a) {
                        return p.concat(slice.call(c.childNodes, 0).filter(function (el) {
                            return el.nodeType === 1 && !el._sibling;
                        }));
                    }, []);
                }
            });

            // Augment the documentFragment with the `toHTML` method.

            tree.toHTML = toHTML;

            return tree;
        }
    });


    // **************************************************************
    //  CLASS MANIPULATION
    // **************************************************************

    hAzzle.extend({


        /**
         * Internal remove class function. Uses Classlist for better performance if supported by browser
         *
         * @param {string} class
         * @param {string} el
         */

        removeClass: function (classes, el) {
            if (classList) {
                hAzzle.each(classes.split(expr['specialSplit']), function (classes) {
                    el.classList.remove(classes);
                })
            } else {

                var current = el.className.split(expr['specialSplit']);
                var newClasses = [];
                for (var i = 0, len = current.length; i < len; i++) {
                    if (current[i] !== className) newClasses.push(current[i]);
                }
                el.className = newClasses.join(' ');
            }

        },

        /**
         * Internal addClass function. Uses Classlist for better performance if supported by browser
         *
         * @param {string} class
         * @param {string} el
         */

        addClass: function (classes, el) {
            if (!classes) return;
            classList ? hAzzle.each(classes.split(expr['specialSplit']), function (cls) {
                el.classList.add(trim(cls));
            }) :
                hAzzle.hasClass(className, el) || (el.className += (el.className ? " " : "") + className);
        },

        hasClass: function (className, el) {
            if (!className) return;
            return support.classList ? el.classList.contains(className) : RegExp("(^|\\s)" + " " + className + " " + "(\\s|$)").test(el.className);
        },

        toggleClass: function (className, el) {
            if (!className) return;
            if (classList) el.classList.toggle(className);
            else {

                var classes = el.className.split(' '),
                    existingIndex = -1;
                for (var i = classes.length; i--;) {
                    if (classes[i] === className)
                        existingIndex = i;
                }

                if (existingIndex >= 0)
                    classes.splice(existingIndex, 1);
                else
                    classes.push(className);

                el.className = classes.join(' ');


            }
        }

    });


    hAzzle.fn.extend({
        /**
         * Add classes to element collection
         * Multiple classnames can be with spaces or comma or both
         *
         * Example:
         *
         *		    addClass("I like to develop javascript")
         *			addClass("I, like, to, develop, javascript")
         *		    addClass("I like, to develop, javascript")
         *
         *	will all set the same class names.
         *
         * @param {String} classes
         */

        addClass: function (className) {
            if (!className) return;
            return this.each(function (index, elem) {
                hAzzle.addClass(hAzzle.trim(className), elem);
            });
        },

        /**
         * Remove classes from element collection
         *
         * @param {String} className
         */

        removeClass: function (className) {
            if (!className) return;
            return this.each(function (index, elem) {
                hAzzle.removeClass(hAzzle.trim(className), elem);
            });
        },

        /**
         * Checks if an element has the given class
         *
         * @param {String} className
         * @return {Boolean}
         */

        hasClass: function (className) {
            if (!className) return;
            return this.each(function (index, elem) {
                hAzzle.hasClass(hAzzle.trim(className), elem);
            });
        },

        /**
         * Replace a class in a element collection
         *
         * @param {String} className
         */

        replaceClass: function () {},

        /**
         * Check if an class has a class matching 'pattern'
         * @param {String} pattern
         * @return {String}
         */

        matchClass: function (Pattern) {

            return this.each(function (index, elem) {
                for (var el = elem.className.replace(/^\s+|\s+$/g, "").split(" "), clas, i = 0, n = el.length; i < n; i++)
                    if (clas = el[i], -1 !== hAzzle.indexOf(clas, pattern)) return clas;
                return "";
            });
        },

        /**
         * Add class 'clas' to 'element', and remove after 'duration' milliseconds
         * @param {String} clas
         * @param {Number} duration
         */

        tempClass: function (clas, duration) {
            return this.each(function (index, elem) {
                hAzzle.addClass(hAzzle.trim(clas), elem);
                setTimeout((function () {
                    hAzzle.removeClass(clas, el);
                }), duration);
            });
        },

        /**
         * Retrive all classes that belong to one element
         */

        allClass: function () {
            if (classList) {
                return this[0].classList;
            }
            throw "Syntax error, missing classList support in your browser";
        },

        /**
         * Returning the list of classes as a string
         */

        strClass: function () {
            if (classList) {
                return el.classList.toString();
            }
            throw "Syntax error, missing classList support in your browser";
        },

        /**
         * Checks if an element has the given class
         *
         * @param {String} className
         * @return {Boolean}
         */
        toggleClass: function (className, state) {

            return this.each(function (index, elem) {

                if (hAzzle.isBoolean(state) && hAzzle.isString(type)) {
                    return state ? hAzzle.addClass(className, elem) : hAzzle.removeClass(className, elem);
                }
                hAzzle.toggleClass(className, elem);

            });


        }

    });

    // **************************************************************
    // EVENT HANDLING
    // **************************************************************

    function check(evt) {
        if (evt = evt.relatedTarget) {
            var ac;
            if (ac = evt !== this)
                if (ac = "xul" !== evt.prefix)
                    if (ac = !/document/.test(this.toString())) {
                        a: {
                            for (; evt = evt.parentNode;)
                                if (evt === this) {
                                    evt = 1;
                                    break a;
                                }
                            evt = 0;
                        }
                        ac = !evt;
                    }
            evt = ac;
        } else evt = null === evt;
        return evt;
    }
    var specialThreatment = {

        disabeled: function (el, type) {
            if (el.disabeled && type === "click") return true;
        },
        nodeType: function (el) { // Don't do events on text and comment nodes 
            if (el.nodeType === 3 || el.nodeType === 8) return true;
        }
    },

        customEvents = {
            mouseenter: {
                base: 'mouseover',
                condition: check
            },
            mouseleave: {
                base: 'mouseout',
                condition: check
            },
            mousewheel: {
                base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel'
            }
        },

        // Includes some event props shared by different events

        commonProps = ["altKey", "bubbles", "cancelable", "ctrlKey", "currentTarget", "eventPhase", "metaKey", "relatedTarget", "shiftKey", "target", "timeStamp", "view", "which"],

        // some event types need special handling and some need special properties, do that all here

        typeFixers = [{ // key events
            reg: /^key/,
            fix: function (event, newEvent) {
                newEvent.keyCode = event.keyCode || event.which;
                return commonProps.concat(["char", "charCode", "key", "keyCode"]);
            }
        }, { // mouse events
            reg: /^(?:mouse|contextmenu)|click/,
            fix: function (event, newEvent) {

                newEvent.rightClick = event.which === 3 || event.button === 2;

                newEvent.pos = {
                    x: 0,
                    y: 0
                };

                // Calculate pageX/Y if missing and clientX/Y available

                if (event.pageX || event.pageY) {
                    newEvent.clientX = event.pageX;
                    newEvent.clientY = event.pageY;
                } else if (event.clientX || event.clientY) {
                    newEvent.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft;
                    newEvent.clientY = event.clientY + doc.body.scrollTop + root.scrollTop;
                }

                return commonProps.concat(["button", "buttons", "clientX", "clientY", "offsetX", "offsetY", "pageX", "pageY", "screenX", "screenY", "toElement"]);
            }
        }, { // mouse wheel events
            reg: /mouse.*(wheel|scroll)/i,
            fix: function () {
                return ["button", "buttons", "clientX", "clientY", "offsetX", "offsetY", "pageX", "pageY", "screenX", "screenY", "toElement", "wheelDelta", "wheelDeltaX", "wheelDeltaY", "wheelDeltaZ", "axis"];
            }
        }, { // TextEvent
            reg: /^text/i,
            fix: function () {
                return commonProps.concat(["data"]);
            }
        }, { // touch and gesture events
            reg: /^touch|^gesture/i,
            fix: function () {
                return commonProps.concat(["touches", "targetTouches", "changedTouches", "scale", "rotation"]);
            }
        }, { // message events
            reg: /^message$/i,
            fix: function () {
                return commonProps.concat(["data", "origin", "source"]);
            }
        }, { // popstate events
            reg: /^popstate$/i,
            fix: function () {
                return commonProps.concat(["state"]);
            }
        }, { // everything else
            reg: /.*/,
            fix: function () {
                return commonProps;
            }
        }]

        ,
        typeFixerMap = {} // used to map event types to fixer functions (above), a basic cache mechanism

        , Event = function (event, element) {

            if (!arguments.length) return;

            event = event || ((element.ownerDocument || element.document || element).parentWindow || win).event;

            this.originalEvent = event;

            if (!event) return;

            var type = event.type,
                target = event.target,
                i, l, p, props, fixer;

            this.target = target && target.nodeType === 3 ? target.parentNode : target;

            fixer = typeFixerMap[type];

            if (!fixer) { // haven't encountered this event type before, map a fixer function for it
                for (i = 0, l = typeFixers.length; i < l; i++) {
                    if (typeFixers[i].reg.test(type)) { // guaranteed to match at least one, last is .*
                        typeFixerMap[type] = fixer = typeFixers[i].fix;
                        break;
                    }
                }
            }

            props = fixer(event, this, type);

            for (i = props.length; i--;) {
                if (!((p = props[i]) in this) && p in event) this[p] = event[p];
            }
        };

    Event.prototype = {

        preventDefault: function () {
            if (this.originalEvent.preventDefault) this.originalEvent.preventDefault();
            else this.originalEvent.returnValue = false;
        },
        stopPropagation: function () {
            if (this.originalEvent.stopPropagation) this.originalEvent.stopPropagation();
            else this.originalEvent.cancelBubble = true;
        },
        stop: function () {
            this.preventDefault();
            this.stopPropagation();
            this.stopped = true;
        },
        stopImmediatePropagation: function () {
            if (this.originalEvent.stopImmediatePropagation) this.originalEvent.stopImmediatePropagation();
            this.isImmediatePropagationStopped = function () {
                return true;
            };
        },
        isImmediatePropagationStopped: function () {
            return this.originalEvent.isImmediatePropagationStopped && this.originalEvent.isImmediatePropagationStopped();
        }
    };

    function wrappedHandler(element, fn, condition, args) {
        var call = function (event, eargs) {
            return fn.apply(element, args ? slice.call(eargs).concat(args) : eargs);
        }, findTarget = function (event, eventElement) {
                return fn._RachelleDel ? fn._RachelleDel.ft(event.target, element) : eventElement;
            }, handler = condition ? function (event) {
                var target = findTarget(event, this); // delegated event
                if (condition.apply(target, arguments)) {
                    if (event) event.currentTarget = target;
                    return call(event, arguments);
                }
            } : function (event) {
                return call(event, arguments);
            };
        handler._RachelleDel = fn._RachelleDel;
        return handler;
    }

    function Access(element, type, handler, original, namespaces, args) {

        if (!(this instanceof Access)) return false;

        var customType = customEvents[type];

        if (type === 'unload') handler = once(removeListener, element, type, handler, original);

        if (customType) {
            if (customType.condition) {
                handler = wrappedHandler(element, handler, customType.condition, args);
            }

            type = customType.base || type;
        }

        this.element = element;
        this.type = type;
        this.original = original;
        this.namespaces = namespaces;
        this.eventType = type;
        this.target = element;
        this.handler = wrappedHandler(element, handler, null, args);
    }

    // given a list of namespaces, is our entry in any of them?

    Access.prototype = {

        inNamespaces: function (checkNamespaces) {
            var i, j, c = 0;
            if (!checkNamespaces) return true;
            if (!this.namespaces) return false;
            for (i = checkNamespaces.length; i--;) {
                for (j = this.namespaces.length; j--;) {
                    if (checkNamespaces[i] == this.namespaces[j]) c++;
                }
            }
            return checkNamespaces.length === c;
        },

        // match by element, original fn (opt), handler fn (opt)
        matches: function (checkElement, checkOriginal, checkHandler) {
            return this.element === checkElement &&
                (!checkOriginal || this.original === checkOriginal) &&
                (!checkHandler || this.handler === checkHandler);
        }
    };



    var registry = (function () {

        var map = {};

        function forAll(element, type, original, handler, root, fn) {
            var pfx = root ? 'r' : '$';
            if (!type || type === '*') {
                // search the whole registry
                for (var t in map) {
                    if (t.charAt(0) === pfx) {
                        forAll(element, t.substr(1), original, handler, root, fn);
                    }
                }
            } else {
                var i = 0,
                    l, list = map[pfx + type],
                    all = element === '*';
                if (!list) return;
                for (l = list.length; i < l; i++) {
                    if ((all || list[i].matches(element, original, handler)) && !fn(list[i], list, i, type)) return;
                }
            }
        }
        return {
            has: function (element, type, original, root) {
                if (root = map[(root ? "r" : "$") + type])
                    for (type = root.length; type--;)
                        if (!root[type].root && root[type].matches(element, original, null)) return true;
                return false;
            },
            get: function (element, type, original, root) {
                var entries = [];
                forAll(element, type, original, null, root, function (entry) {
                    entries.push(entry);
                });
                return entries;
            },
            put: function (entry) {
                var has = !entry.root && !this.has(entry.element, entry.type, null, false),
                    key = (entry.root ? 'r' : '$') + entry.type;
                (map[key] || (map[key] = [])).push(entry);
                return has;
            },
            del: function (entry) {
                forAll(entry.element, entry.type, null, entry.handler, entry.root, function (entry, list, i) {
                    list.splice(i, 1);
                    entry.removed = true;
                    if (list.length === 0) delete map[(entry.root ? 'r' : '$') + entry.type];
                    return false;
                });
            }
        };
    }());

    // we attach this listener to each DOM event that we need to listen to, only once
    // per event type per DOM element
    function subHandler(event, type) {
        var listeners = registry.get(this, type || event.type, null, false),
            l = listeners.length,
            i = 0;

        event = new Event(event, this, true);
        if (type) event.type = type;

        // iterate through all handlers registered for this type, calling them unless they have
        // been removed by a previous handler or stopImmediatePropagation() has been called
        for (; i < l && !event.isImmediatePropagationStopped(); i++) {
            if (!listeners[i].removed) listeners[i].handler.call(this, event);
        }
    }

    function once(rm, element, type, fn, originalFn) {
        return function () {
            fn.apply(this, arguments);
            rm(element, type, originalFn);
        };
    }


    /**
     *   Remove event listener
     **/
    function removeListener(el, events, handler, namespaces) {

        events = events && events.replace(expr['nameRegex'], "");

        var handlers = registry.get(el, events, null, false),
            i = 0,
            l;

        events = {};

        // Namespace

        for (l = handlers.length; i < l; i++) handler && handlers[i].original !== handler || !handlers[i].inNamespaces(namespaces) || (registry.del(handlers[i]), events[handlers[i].eventType] || (events[handlers[i].eventType] = {
            t: handlers[i].eventType,
            c: handlers[i].type
        }));

        // For improved speed we are using object keys with fallback to for / in loop

        handler = nativeKeys(events);

        for (namespaces = handler.length; namespaces--;)
            if (!registry.has(el, events[handler[namespaces]].t, null, false) && el[removeEvent]) el[removeEvent](events[handler[namespaces]].t, subHandler, false);
    }



    // set up a delegate helper using the given selector, wrap the handler function
    function delegate(selector, fn) {

        function findTarget(target, root) {
            var i, array = hAzzle.isString(selector) ? hAzzle.select(selector, root) : selector;
            for (; target && target !== root; target = target.parentNode) {
                for (i = array.length; i--;) {
                    if (array[i] === target) return target;
                }
            }
        }

        function handler(e) {
            if (e.target.disabled !== true) {
                var match = findTarget(e.target, this);
                if (match) fn.apply(match, arguments);
            }
        }

        handler._RachelleDel = {
            ft: findTarget // attach it here for customEvents to use too
            ,
            selector: selector
        };
        return handler;
    }

    /**
     * off(element[, eventType(s)[, handler ]])
     */

    function off(el, typeSpec, fn) {
        var isTypeStr = hAzzle.isString(typeSpec),
            type, namespaces, i;

        if (isTypeStr && typeSpec.indexOf(' ') > 0) {

            // off(el, 't1 t2 t3', fn) or off(el, 't1 t2 t3')

            typeSpec = typeSpec.split(typeSpec);

            for (i = typeSpec.length; i--;)
                off(el, typeSpec[i], fn);
            return el;
        }

        type = isTypeStr && typeSpec.replace(expr['nameRegex'], '');

        if (type && customEvents[type]) type = customEvents[type].base;

        if (!typeSpec || isTypeStr) {
            // off(el) or off(el, t1.ns) or off(el, .ns) or off(el, .ns1.ns2.ns3)
            if (namespaces = isTypeStr && typeSpec.replace(expr['namespaceRegex'], '')) namespaces = namespaces.split('.');
            removeListener(el, type, fn, namespaces);
        } else if (hAzzle.isFunction(typeSpec)) {
            // off(el, fn);
            removeListener(el, null, typeSpec);
        } else {

            // off(el, { t1: fn1, t2, fn2 })
            for (var te = nativeKeys(typeSpec), ii = te.length; ii--;) {
                off(el, te[ii], typeSpec[te[ii]]);
            }
        }

        return el;
    }

    /**
     * on(el, eventType(s)[, selector], handler[, args ])
     */


    function on(el, events, selector, fn, /* INTERNAL */ one) {
        var originalFn, type, types, i, args, entry, first;

        // Dont' allow click on disabeled elements, or events on text and comment nodes

        if ((el.disabeled && specialThreatment[disabeled](el, type)) || specialThreatment.nodeType(el)) return false;

        if (selector === undefined && typeof events === 'object')
            for (type = nativeKeys(events), i = type.length; i--;) on.call(this, el, type[i], events[type[i]]);
        else {

            // Delegated event

            if (!hAzzle.isFunction(selector)) {
                originalFn = fn;
                args = slice.call(arguments, 4);
                fn = delegate(selector, originalFn);
            } else {
                args = slice.call(arguments, 3);
                fn = originalFn = selector;
            }

            types = events.split(' ');

            // One

            if (one) fn = once(off, el, events, fn, originalFn);

            for (i = types.length; i--;) {
                first = registry.put(entry = new Access(
                    el, types[i].replace(expr['nameRegex'], '') // event type
                    , fn, originalFn, types[i].replace(expr['namespaceRegex'], '').split('.') // namespaces
                    , args, false
                ));

                // First event of this type on this el, add root listener

                if (first) el[addEvent](entry.eventType, subHandler, false);
            }
            return el;
        }
    }



    hAzzle.fn.extend({

        /**
         * Add event to element
         *
         * @param {String} events
         * @param {String} selector
         * @param {Function} callback
         * @return {Object}
         */

        on: function (events, selector, fn, /* INTERNAL */ one) {
            var el;
            return this.each(function () {
                el = this;
                var originalFn, type, types, i, args, entry, first;

                // Dont' allow click on disabeled elements, or events on text and comment nodes

                if ((el.disabeled && specialThreatment[disabeled](el, type)) || specialThreatment.nodeType(el)) return false;

                if (selector === undefined && typeof events === 'object')
                    for (type = nativeKeys(events), i = type.length; i--;) on.call(this, el, type[i], events[type[i]]);
                else {

                    // Delegated event

                    if (!hAzzle.isFunction(selector)) {
                        originalFn = fn;
                        args = slice.call(arguments, 4);
                        fn = delegate(selector, originalFn);
                    } else {
                        args = slice.call(arguments, 3);
                        fn = originalFn = selector;
                    }

                    types = events.split(' ');

                    // One

                    if (one) fn = once(off, el, events, fn, originalFn);

                    for (i = types.length; i--;) {
                        first = registry.put(entry = new Access(
                            el, types[i].replace(expr['nameRegex'], '') // event type
                            , fn, originalFn, types[i].replace(expr['namespaceRegex'], '').split('.') // namespaces
                            , args, false
                        ));

                        // First event of this type on this el, add root listener

                        if (first) el[addEvent](entry.eventType, subHandler, false);
                    }
                    return el;
                }

            });
        },

        /**
         * Same as on() but the event will "die" after the first time it's triggered
         **/

        one: function (events, fn, delfn) {
            return this.on(events, fn, delfn, true);
        },

        /**
         * Remove event from element
         *
         * @param {String} events
         * @param {String} selector
         * @param {Function} callback
         * @return {Object}
         */

        off: function (events, fn) {
            return this.each(function () {
                off(this, events, fn);
            });
        }

    });


    hAzzle.extend({

        /**
         * Trigger specific event for element collection
         *
         * @param {Object|String} type
         * @return {Object}
         */

        trigger: function (el, type, args) {

            if (hAzzle.isString(el)) el = hAzzle.select(el)[0];
            else el = el[0];

            var types = type.split(' '),
                i, j, l, call, event, names, handlers;

            if ((el.disabeled && specialThreatment[disabeled](el, type)) || specialThreatment.nodeType(el)) return false;

            for (i = types.length; i--;) {
                type = types[i].replace(expr['nameRegex'], '');
                if (names = types[i].replace(expr['namespaceRegex'], '')) names = names.split('.');
                if (!names && !args) {
                    var HTMLEvt = doc.createEvent('HTMLEvents');
                    HTMLEvt['initEvent'](type, true, true, win, 1);
                    el.dispatchEvent(HTMLEvt);

                } else {
                    handlers = registry.get(el, type, null, false);
                    event = new Event(null, el);
                    event.type = type;
                    call = args ? 'apply' : 'call';
                    args = args ? [event].concat(args) : event;
                    for (j = 0, l = handlers.length; j < l; j++) {
                        if (handlers[j].inNamespaces(names)) {
                            handlers[j].handler[call](el, args);
                        }
                    }
                }
            }
            return el;
        }
    });

    // **************************************************************
    // CSS
    // **************************************************************

    /* TODO!!  A lot to change here, will fix it later on ! */
	
    var cssNumber = 'fill-opacity font-weight line-height opacity orphans widows z-index zoom'.split(' ');

    hAzzle.fn.extend({

        css: function (name, value) {

            if (hAzzle.isDefined(value)) {
                return this.each(function () {

                    if (typeof value == 'number' && cssNumber.indexOf(name) === -1) {
                        value += 'px';
                    }

                    var action = (value === null || value === '') ? 'remove' : 'set';

                    this.style[action + 'Property'](name, '' + value);
                });
            }
            return this[0].style.getPropertyValue(name) || window.getComputedStyle(this[0], null).getPropertyValue(name);

        }
    });



    window['hAzzle'] = hAzzle;

})(window);