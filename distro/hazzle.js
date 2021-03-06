/*!
 * hAzzle.js
 * Copyright (c) 2014 Kenny Flashlight
 * Version: 0.5.3
 * Released under the MIT License.
 *
 * Date: 2014-05-08
 *
 * Note!! hAzzle are NOT jQuery or Zepto, but loosely following their API's. Some functions will not work at all in hAzzle, and
 *        others will work differently then you think. In 94% of the cases, hAzzle will work similar to jQuery / Zepto.
 *        The main reason for this is that hAzzle are using native browser solutions where it's possible. An example is the internal 'Map()'
 *        function. It's used in closest (), and this function is 45% faster then jQuery / Zepto. But hAzzles internal map () are totally different
 *        from the aforementioned libraries.
 */
(function (window, undefined) {

    // hAzzle already defined, leave now

    if (window['hAzzle']) return;

    var

    // Use the correct document accordingly with window argument (sandbox)
        win = window,
        document = win.document || {},

        simpleRegEx = /^.[^:#\[\.,]*$/,

        /**
         * Prototype references.
         */

        ArrayProto = Array.prototype,

        /**
         * Create a reference to some core methods
         */

        push = ArrayProto.push,
        slice = ArrayProto.slice,
        concat = ArrayProto.concat,
        toString = Object.prototype.toString,

        /*
         * Unique ID
         */

        uid = {
            current: 0,
            next: function () {
                var id = ++this.current + '';
                return 'hAzzle_' + id;
            }
        },

        // Different nodeTypes we are checking against for faster speed

        nodeTypes = {},

        // Main function

        hAzzle = function (sel, ctx) {
            return new hAzzle.fn.init(sel, ctx);
        };

    /**
     * An object used to flag environments/features.
     */

    hAzzle.support = {};

    hAzzle.fn = hAzzle.prototype = {

        // Start with an empty selector

        selector: "",

        // The default length of a hAzzle object is 0

        length: 0,

        init: function (sel, ctx) {

            if (sel instanceof hAzzle) return sel;

            if (!sel) {
                return this;
            }
            if (hAzzle.isString(sel)) {

                // HTML

                if (sel[0] === "<" && sel[sel.length - 1] === ">" && sel.length >= 3) {

                    var attr;

                    // Move the parsed HTML over to the 'elems stack'

                    this.elems = hAzzle.parseHTML(
                        sel,
                        ctx && ctx.nodeType ? ctx.ownerDocument || ctx : document,
                        true
                    );

                    // Merge it with the hAzzle Object

                    hAzzle.merge(this, this.elems);

                    // Set attributes if any...:

                    if ((/^<(\w+)\s*\/?>(?:<\/\1>|)$/).test(sel) && hAzzle.isObject(ctx)) {

                        for (attr in ctx) {

                            // Properties of context are called as methods if possible

                            if (hAzzle.isFunction(this[attr])) {

                                this[attr](ctx[attr]);

                            } else {

                                // Use the fastest addClass for setting class attributes

                                if (attr === "class") {

                                    this.addClass(ctx[attr]);

                                    // ...and otherwise set as attributes 								

                                } else {

                                    this.attr(attr, ctx[attr]);

                                }
                            }
                        }
                    }

                    return this;

                } else {

                    this.elems = hAzzle.find(sel, ctx);
                }

            } else {

                // Domready

                if (hAzzle.isFunction(sel)) {

                    // Only run if this module are included

                    if (hAzzle['ready']) {

                        return hAzzle.ready(sel);

                    } else {
                        // To avoid some serious bugs, we inform about what happend
                        console.log("The DOM Ready module are not installed!!");
                        return [];
                    }
                }

                //Array

                if (sel instanceof Array) {

                    this.elems = hAzzle.unique(sel.filter(hAzzle.isElement));

                } else {

                    // Object

                    if (hAzzle.isObject(sel)) {

                        //alert( sel[0]);
                        this.context = sel[0];
                        return this.elems = [sel], this.length = 1, this[0] = sel, this;
                    }

                    // Nodelist

                    hAzzle.isNodeList(sel) ? this.elems = slice.call(sel).filter(hAzzle.isElement) : hAzzle.isElement(sel) ? this.elems = [sel] : this.elems = [];
                }
            }

            return this.loopHole();
        },

        /**
         * Setting up the "elems stack" and adding 'this[x]' and length
         * to the hAzzle object
         */

        loopHole: function () {

            var elems = this.elems,
                i = this.length = elems.length;

            while (i--) {

                this[i] = elems[i];
            }

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
         * Filter the collection to contain only items that match the CSS selector
         *
         * @param {String|nodeType|Function} sel
         * @return {Object}
         *
         */

        filter: function (sel, not) {

            // Do nothing if no selector

            if (typeof sel === 'undefined') {

                return this;
            }

            // As default not === false, for the :not() function it is set to false

            not = not || false;

            // If we are dealing with a function

            if (hAzzle.isFunction(sel)) {
                return hAzzle(hAzzle.grep(this.elems, function (elem, i) {
                    return !!sel.call(elem, i, elem) !== not;
                }));
            }

            // nodeType

            if (sel.nodeType) {
                return hAzzle(hAzzle.grep(this.elems, function (elem) {
                    return (elem === sel) !== not;
                }));
            }

            // String

            if (typeof sel === "string") {

                if (simpleRegEx.test(sel)) {

                    return hAzzle(hAzzle.find(not ? sel = ":not(" + sel + ")" : sel, null, null, this.elems));
                }

                sel = hAzzle.find(sel, null, null, this.elems);
            }

            return hAzzle(hAzzle.grep(this.elems, function (elem) {
                return (Array.prototype.indexOf.call(sel, elem) >= 0) !== not;
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
            return hAzzle.create(this.elems.reduce(function (elements, element) {
                return elements.concat(hAzzle.find(sel, element).length ? element : null);
            }, []));
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
            return hAzzle.pluck(this.elems, prop, nt);
        },

        /**
         * Sets property to value for each element in the "elems" stack
         *
         * @param {String} prop
         * @param {String} value
         * @return {Array}
         */

        put: function (prop, value, nt) {
            return hAzzle.put(this.elems, prop, value, nt);
        },

        /**
         * Get the Nth element in the "elems" stack, OR all elements
         *
         * @param {Number} num
         * @return {object}
         */

        get: function (index) {
            var elems = this.elems;
            if (elems) {
                if (index == null) {
                    return elems && this.elems.slice()
                }
                return elems[index < 0 ? elems.length + index : index]
            }
            return [];
        },

        /**
         * Returns a new array with the result of calling callback on each element of the array
         * NOTE!! Nothing to do with the jQuery / Zepto API
         */

        map: function (fn) {
            var elems = this.elems,
                i = 0,
                len = elems.length;
            for (i = len; i--;) {
                return hAzzle(fn(elems[i]));
            }
        },

        /**
         * Sort the elements in the "elems" stack
         */

        sort: function (fn) {
            return hAzzle(this.elems.sort(fn));
        },

        /**
         *  Concatenates an array to the 'elems stack'
         */

        concat: function () {
            return hAzzle(concat.apply(this.elems, slice.call(arguments).map(function (arr) {
                return arr instanceof hAzzle ? arr.elements : arr;
            })));
        },

        /**
         * Slice elements in the "elems" stack
         */

        slice: function (start, end) {
            return hAzzle(slice.call(this.elems, start, end));
        },

        /**
         * Take an element and push it onto the "elems" stack
         */

        push: function (element) {
            return hAzzle.isElement(element) ? (this.elems.push(element), this.length = this.elems.length, this.length - 1) : -1;
        },

        /**
         * Determine if the "elems" stack contains a given value
         *
         * @return {Boolean}
         */

        indexOf: function (needle) {
            return hAzzle.indexOf(this.elems, needle);
        },


        /**
         * Make the 'elems stack'  unique
         */

        unique: function () {
            return hAzzle.unique(this.elems);
        },

        /**
         * Reduce the number of elems in the "elems" stack
         *
         * I know this one is ugly as hell, but the other option - to
         * use native 'prototype reduce' are too slow. So we using an
         * modified 'shim' solution
         *
         */

        reduce: function (callback /*, initialValue*/ ) {

            var t = Object(this),
                len = t.length >>> 0,
                k = 0,
                value;
            if (arguments.length >= 2) {
                value = arguments[1];
            } else {
                while (k < len && !k in t) k++;
                if (k >= len) {
                    return false;
                }
                value = t[k++];
            }
            for (; k < len; k++) {
                if (k in t) {
                    value = callback(value, t[k], k, t);
                }
            }
            return value;
        },

        /**
         * Make the 'elems stack' compact, sorted by given selector
         */

        compact: function (a) {
            return this.filter(a, function (value) {
                return !!value;
            });
        },

        /**
         * Get the element at position specified by index from the current collection.
         *
         * +, -, / and * are all allowed to use for collecting elements.
         *
         * Example:
         *            .eq(1+2-1)  - Returnes element 2 in the collection
         *            .eq(1*2-1)  - Returnes the first element in the collection
         *
         * @param {Number} index
         * @return {Object}
         */

        eq: function (index) {

            if (index === null) {

                return hAzzle();
            }

            return hAzzle(this.get(index));

        },

        /**
         * Retrieve all the elements contained in the hAzzle set, as an array.
         *
         * Note! This function is here just to be compatible with jQuery / Zepto API.
         * The 'elems stack' are already an array, so we return only the
         * stack without any magic slicing
         *
         */

        toArray: function () {
            return this.elems;
        }

    };

    hAzzle.fn.init.prototype = hAzzle.fn;

    /**
     * Extend the contents of two objects
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

        toObject: function (list, value) {

            var obj = {};

            hAzzle.each(list, function (index, itm) {
                obj[itm] = value;
            });

            return obj;

        },

        /**
         * Convert input to currency (two decimal fixed number)
         */

        toCurrency: function (i) {
            i = parseFloat(i, 10).toFixed(2);
            return (i == 'NaN') ? '0.00' : i;
        },

        each: function (obj, callback, args) {
            var value,
                i = 0,
                length = obj.length;

            if (obj.length === +obj.length) {

                for (; i < length; i++) {
                    value = callback.call(obj[i], i, args ? args : obj[i]);

                    if (value === false) {
                        break;
                    }
                }
            } else {

                for (i in obj) {
                    value = callback.call(obj[i], i, args ? args : obj[i]);

                    if (value === false) {
                        break;
                    }
                }
            }
            return obj;
        },

        type: function (obj) {

            if (obj === null) {

                return obj + "";
            }

            return toString.call(obj);
        },

        is: function (kind, obj) {
            return hAzzle.indexOf(kind, this.type(obj)) >= 0;
        },

        /**
         * Checks if element is a NODE_ELEMENT or DOCUMENT_ELEMENT.
         */

        isElement: function (elem) {
            return elem && (nodeTypes[1](elem) || nodeTypes[9](elem));
        },

        /**
         * Checks if elements is a NodeList or HTMLCollection.
         */
        isNodeList: function (obj) {
            return obj && this.is(['nodelist', 'htmlcollection', 'htmlformcontrolscollection'], obj);
        },

        IsNaN: function (val) {
            return hAzzle.isNumber(val) && val != +val;
        },

        isUndefined: function (value) {

            return value === void 0;
        },

        isDefined: function (value) {

            return value !== void 0;
        },

        isString: function (value) {

            return typeof value === 'string';

        },
        isFunction: function (value) {

            return typeof value === 'function';
        },

        isDate: function (val) {
            return !!(val && val.getTimezoneOffset && val.setUTCFullYear);
        },

        isRegExp: function (r) {
            return !!(r && r.test && r.exec && (r.ignoreCase || r.ignoreCase === false));
        },

        isArguments: function (a) {
            return !!(a && Object.prototype.hasOwnProperty.call(a, 'callee'));
        },

        isNumber: function (value) {
            return typeof value === 'number';
        },

        isObject: function (obj) {
            return obj === Object(obj);
        },

        isNumeric: function (obj) {
            // parseFloat NaNs numeric-cast false positives (null|true|false|"")
            // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
            // subtraction forces infinities to NaN
            return !hAzzle.isArray(obj) && obj - parseFloat(obj) >= 0;
        },

        isEmptyObject: function (obj) {
            var name;
            for (name in obj) {
                return false;
            }
            return true;
        },

        /**
         * Returns true if the given string or list is null, undefined or empty (zero length).
         * If the second argument is true, the function will ignore whitespace in the string
         */

        isEmpty: function (str, ignoreWhitespace) {
            return str === null || !str.length || (ignoreWhitespace && /^\s*$/.test(str));
        },

        /**
         * Checks if an string is blank
         */

        isBlank: function (str) {

            hAzzle.trim(str).length === 0;

        },

        isArray: Array.isArray,

        isWindow: function (obj) {
            return obj && obj.document && obj.location && obj.alert && obj.setInterval;
        },

        isFile: function (obj) {
            return toString.call(obj) === '[object File]';
        },


        isBlob: function (obj) {
            return toString.call(obj) === '[object Blob]';
        },

        isDocument: function (obj) {
            return obj !== null && obj.nodeType == obj.DOCUMENT_NODE;
        },

        isNull: function (obj) {
            return obj === null;
        },

        isBoolean: function (value) {
            return (value === true) || (value === false);
        },

        error: function (msg) {
            throw new Error(msg);
        },

        /**
         * Produces a duplicate-free version of the array.
         */
        unique: function (array) {
            return array.filter(function (itm, idx) {
                return hAzzle.indexOf(array, itm) === idx;
            });

        },

        /**
         * Creates a new hAzzle instance applying a filter if necessary
         */

        create: function (elements, selector) {

            return hAzzle.isUndefined(selector) ? hAzzle(elements) : hAzzle(elements).filter(selector);
        },

        /**
         * Returns a standard or browser-prefixed methods (moz, webkit, ms, o) if found.
         */

        prefix: function (key, obj) {

            var result, upcased = key[0].toUpperCase() + key.slice(1),
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
         * Same as the 'internal' pluck method, except this one is global
         */

        pluck: function (array, prop, nt) {

            return array.map(function (elem) {

                // Filter by 'nodeType' if 'nt' are set

                if (nt && !nodeTypes[nt](elem)) {

                    return elem[prop];

                    // No nodeType to filter with, return everything

                } else {

                    return elem[prop];
                }

            });
        },

        /**
         * Check if an element contains another element
         */
        contains: function (parent, child) {
            var adown = nodeTypes[9](parent) ? parent.documentElement : parent,
                bup = child && child.parentNode;
            return parent === bup || !!(bup && nodeTypes[1](bup) && adown.contains(bup));
        },

        /**
         * Native indexOf is slow and the value is enough for us as argument.
         * Therefor we create our own
         */

        indexOf: function (array, obj) {

            for (var i = 0, itm; itm = array[i]; i += 1) {
                if (obj === itm) return i;
            }
            return !1;
        },

        /** 
         * Return current time
         */

        now: Date.now,

        /**
         * Check if an element are a specific NodeType
         *
         * @param{Number} val
         * @param{Object} elem
         * @return{Boolean}
         **/

        nodeType: function (val, elem) {
            if (nodeTypes[val]) return nodeTypes[val](elem);
            return false;
        },

        /**
         * Remove empty whitespace from beginning and end of a string
         *
         * @param{String} str
         * @return{String}
         *
         * String.prototype.trim() are only supported in IE9+ Standard mode,
         * so we need a fallback solution for that
         */

        trim: (function () {
            if (!String.prototype.trim) {
                return function (value) {
                    return value.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                };
            }
            return function (value) {
                return value.trim();
            };
        })(),

        /**
         * Check if an element exist in an array
         *
         * NOTE!!
         *
         * This one are ugly as hell, and a mad man's work.
         * I did it like this because native indexOf are
         * 'EXTREAMLY SLOW', and our hAzzle.indexOf() function does
         * not fit for the purpose.
         *
         * We are 77% faster then jQuery anyways :)
         */

        inArray: function (elem, arr, i) {

            var iOff = (function (_find, i /*opt*/ ) {
                if (typeof i === 'undefined') i = 0;
                if (i < 0) i += this.length;
                if (i < 0) i = 0;
                for (var n = this.length; i < n; i++)
                    if (i in this && this[i] === _find) {
                        return i;
                    }
                return -1;
            });
            return arr === null ? -1 : iOff.call(arr, elem, i);
        },


        /**
         *  Global ID for objects
         *  Return or compute a unique ID
         *
         * @param{Object} elem
         * @return{Object}
         */

        getUID: function (elem) {
            return elem && (elem.hAzzle_id || (elem.hAzzle_id = uid.next()));
        },

        /**
         * Set values on elements in an array
         *
         * @param{Array} array
         * @param{String} prop
         * @param{String} value
         * @return{Object}
         */

        put: function (array, prop, value, nt) {
            hAzzle.each(array, function (index) {
                if (hAzzle.isDefined(nt) && (array !== null && !hAzzle.nodeType(nt, array))) {
                    array[index][prop] = value;
                } else {
                    array[index][prop] = value;
                }
            });
            return this;
        },

        /**
         * Return the elements nodeName
         */
        nodeName: function (elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        },

        /**
         * Convert dashed to camelCase
         *
         * I know jQuery checking for Microsoft missing prefix, but we are in
         * 2014, so MS should have fixed their prefix by now.
         *
         * Angular doesn't have a check for it, so I guess it's fixed.
         * Shoot me if I'm wrong!!
         *
         *
         * @param{String} str
         * @return{String}
         */

        camelCase: function (str) {

            return str.replace(/-(.)/g, function (m, m1) {
                return m1.toUpperCase();
            });
        },

        map: function (elems, callback, arg) {
            var value,
                i = 0,
                length = elems.length,

                ret = [];

            // Go through the array, translating each of the items to their new values

            if (toString.call(elems) === "[object String]") {

                for (i in elems) {
                    value = callback(elems[i], i, arg);

                    if (value !== null) {
                        ret.push(value);
                    }
                }
            } else {

                for (; i < length; i++) {
                    value = callback(elems[i], i, arg);

                    if (value !== null) {
                        ret.push(value);
                    }
                }

                // Go through every key on the object,
            }

            // Flatten any nested arrays

            return concat.apply([], ret);
        },

        /**
         * Check if it's an XML or HTML document
         */

        isXML: function (elem) {
            return elem && (elem.ownerDocument || elem).documentElement.nodeName !== "HTML";
        },

        /*
         * Finds the elements of an array which satisfy a filter function.
         */

        grep: function (elems, callback, inv, args) {
            var ret = [],
                retVal,
                i = 0,
                length = elems.length;
            inv = !!inv;
            for (; i < length; i++) {
                if (i in elems) { // check existance
                    retVal = !!callback.call(args, elems[i], i); // set callback this
                    if (inv !== retVal) {
                        ret.push(elems[i]);
                    }
                }
            }
            return ret;
        },
        // Nothing
        noop: function () {},

        makeArray: function (arr, results) {

            var a = new Object(arr),
                ret = results || [];

            if (arr !== null) {
                if (isArraylike(a)) {
                    hAzzle.merge(ret, hAzzle.isString(arr) ? [arr] : arr);
                } else {
                    push.call(ret, arr);
                }
            }

            return ret;
        },

        // Invoke a method (with arguments) on every item in a collection.

        invoke: function (obj, method) {
            var args = slice.call(arguments, 2),
                isFunc = hAzzle.isFunction(method);
            return $.map(obj, function (value) {
                return (isFunc ? method : value[method]).apply(value, args);
            });
        },

        /**
         * Throttle through a function
         */

        throttle: function (func, wait, options) {
            var context, args, result,
                timeout = null,
                previous = 0;

            options || (options = {});

            var later = function () {
                previous = options.leading === false ? 0 : hAzzle.now();
                timeout = null;
                result = func.apply(context, args);
                context = args = null;
            };

            return function () {
                var now = hAzzle.now();
                if (!previous && options.leading === false) previous = now;
                var remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0) {
                    clearTimeout(timeout);
                    timeout = null;
                    previous = now;
                    result = func.apply(context, args);
                    context = args = null;
                } else if (!timeout && options.trailing !== false) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        }

    });

    /**
     * Add some nodeTypes
     */

    hAzzle.each(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], function (value) {
        nodeTypes[value] = function (elem) {
            return elem && elem.nodeType === value;
        };
    });

    /**
     * Populate some powerfull native functions for dealing with the 'elems stack'
     */

    hAzzle.each(['pop', 'reverse', 'shift', 'splice', 'unshift'], function () {
        var method = ArrayProto[this];
        hAzzle.fn[this] = function () {
            return method.apply(this.elems, arguments);
        };
    });

    function isArraylike(obj) {

        if (obj === null || hAzzle.isWindow(obj)) {
            return false;

        }

        var length = obj.length;

        if (obj.nodeType === 1 && length) {
            return true;
        }

        return hAzzle.isString(obj) || hAzzle.isArray(obj) || length === 0 ||
            typeof length === 'number' && length > 0 && (length - 1) in obj;
    }


    /**
     * Merge two arrays
     *
     * Note!! hAzzle.merge() are one of our Core functions and
     * need to be super fast. But there are problems cross-browser.
     * For FireFox we are using while-loop and for-loop
     * for the other browsers
     */

    // Firefox 

    if (typeof InstallTrigger !== 'undefined') {
        hAzzle.merge = function (first, second) {
            var j = 0,
                i = first.length;

            while (second[j] !== undefined) {
                first[i++] = second[j++];
            }

            first.length = i;

            return first;
        }

        // All other browsers	

    } else {

        hAzzle.merge = function (first, second) {

            var j = 0,
                i = first.length;

            if (typeof InstallTrigger !== 'undefined') {
                while (second[j] !== undefined) {
                    first[i++] = second[j++];
                }
            } else {
                var len = +second.length;
                for (; j < len; j++) {
                    first[i++] = second[j];
                }

            }

            first.length = i;

            return first;
        }
    }

    // Expose hAzzle to the global object

    window['hAzzle'] = hAzzle;

})(window);


/*!
 * DOM ready
 */

var doc = document,
    readyList = [],
    readyFired = false,
    readyEventHandlersInstalled = false;

// call this when the document is ready
// this function protects itself against being called more than once

function ready() {

    if (!readyFired) {
        // this must be set to true before we start calling callbacks
        readyFired = true;
        for (var i = 0; i < readyList.length; i++) {
            // if a callback here happens to add new ready handlers,
            // the docReady() function will see that it already fired
            // and will schedule the callback to run right after
            // this event loop finishes so all handlers will still execute
            // in order and no new ones will be added to the readyList
            // while we are processing the list

            readyList[i].fn.call(window, readyList[i].ctx);
        }
        // allow any closures held by these functions to free
        readyList = [];
    }
}

// Extend the hAzzle object

hAzzle.extend({


    ready: function (callback, context) {

        // context are are optional, but document by default

        context = context || doc;

        if (readyFired) {
            setTimeout(function () {
                callback(context);
            }, 1);
            return;
        } else {

            // add the function and context to the list

            readyList.push({
                fn: callback,
                ctx: context
            });
        }
        // if document already ready to go, schedule the ready function to run
        if (doc.readyState === "complete") {

            setTimeout(ready, 1);

        } else if (!readyEventHandlersInstalled) {

            // otherwise if we don't have event handlers installed, install them

            doc.addEventListener("DOMContentLoaded", ready, false);
            // backup is window load event
            window.addEventListener("load", ready, false);

            readyEventHandlersInstalled = true;
        }
    }
});

// Selector / Matches

// Native matchSelector polyfi;

var matches = hAzzle.prefix('matchesSelector', document.createElement('div'));

hAzzle.extend(hAzzle.fn, {

    /**
     * Find the first matched element by css selector
     *
     * @param {String|Object} selector
     * @return {Object}
     *
     */

  find: function (selector) {
        var i,
            len = this.length,
            ret = [],
            self = this;

	   // String
	   
	   if (typeof selector === "string") {
            for (i = 0; i < len; i++) {
                hAzzle.find(selector, self[i], ret);
            }
			 return hAzzle(ret);
        } else { // Object
           return hAzzle(selector).filter(function () {
                for (i = 0; i < len; i++) {
                    if (hAzzle.contains(self[i], this)) {
                        return true;
                    }
                }
            });
        }
    }
});

hAzzle.extend({

    find: function (selector, context, results, seed) {

        var match, 
		  sel,
		   bool, // Boolean for filter function
		   elem, m, nodeType,
            i = 0;

        results = results || [];
        context = context || document;

        // Same basic safeguard as Sizzle
        if (!selector || typeof selector !== "string") {

            return results;
        }

        // Early return if context is not an element or document
        if ((nodeType = context.nodeType) !== 1 && nodeType !== 9) {

            return [];
        }

        if (!seed) {

            // Shortcuts
			
            if ((match = /^(?:#([\w-]+)|\.([\w-]+)|(\w+))$/.exec(selector))) {

                // #id
                if ((sel = match[1])) {

                    elem = context.getElementById(sel);

                    if (elem && elem.parentNode) {
                        // Handle the case where IE, Opera, and Webkit return items
                        // by name instead of ID
                        if (elem.id === m) {

                            results.push(elem);
                            return results;
                        }
                    } else {

                        return results;
                    }

                    // .class	

                } else if ((sel = match[2])) {

                    push.apply(results, context.getElementsByClassName(sel));
                    return results;

                    // tag

                } else if ((sel = match[3])) {

                    push.apply(results, context.getElementsByTagName(selector));
                    return results;
                }
            } 
			
			// Everything else

            results = context.querySelectorAll(selector);

            // Seed

        } else {

            while ((elem = seed[i++])) {

				bool = matches.call(elem, selector);
            
			    if (bool) {
                    results.push(elem);
                }
            }
        }

        return hAzzle.isNodeList(results) ? slice.call(results) : hAzzle.isElement(results) ? [results] : results;
    }
});

/*!
 * Traversing.js
 */
/*!
 * Traversing.js
 */
var cached = [],

    guaranteedUnique = {
        children: true,
        contents: true,
        next: true,
        prev: true
    },

    slice = Array.prototype.slice,
    push = Array.prototype.push;

hAzzle.extend(hAzzle.fn, {

    /**
     * Get the  element that matches the selector, beginning at the current element and progressing up through the DOM tree.
     *
     * @param {String} sel
     * @return {Object}
     */

    closest: function (sel, ctx) {
        return this.map(function (elem) {
            if (hAzzle.nodeType(1, elem) && elem !== ctx && !hAzzle.isDocument(elem) && hAzzle.find(elem, null, null, typeof sel === 'object' ? hAzzle(sel) : sel)) {
                return elem;
            }
            do {
                elem = elem['parentNode'];
            } while (elem && ((sel && !hAzzle.find(sel, null, null, elem)) || !hAzzle.isElement(elem)));
            return elem;
        });
    },

    /** Determine the position of an element within the matched set of elements
     *
     * @param {string} elem
     * @param {return} Object
     */

    index: function (elem) {
        return elem ? this.indexOf(hAzzle(elem)[0]) : this.parent().children().indexOf(this[0]) || -1;
    },

    /**
     *  Pick elements by tagNames from the "elems stack"
     *
     * @param {string} tag
     * @return {Object}
     */
    tags: function (tag) {
        return this.map(function (els) {
            if (els.tagName.toLowerCase() === tag && hAzzle.nodeType(1, els)) {
                return els;
            }
        });
    },

    /**
     * Adds one element to the set of matched elements.
     *
     * @param {String} sel
     * @param {String} ctx
     * @return {Object}
     */

    add: function (sel, ctx) {
        return this.concat(hAzzle(sel, ctx).elems);
    },

    /**
     * Reduce the set of matched elements to those that have a descendant that matches the selector or DOM element.
     */
    has: function (target) {

        var targets = hAzzle(target, this),
            i = 0,
            l = targets.length;

        return this.filter(function () {
            for (; i < l; i++) {
                if (hAzzle.contains(this, targets[i])) {
                    return true;
                }
            }
        });
    },

    /**
     * Remove elements from the set of matched elements.
     *
     * @param {String} sel
     * @return {Object}
     *
     */

    not: function (sel) {
        return this.filter(sel, true);
    },

    /**
     * Check if the first element in the element collection matches the selector
     *
     * @param {String|Object} sel
     * @return {Boolean}
     */

    is: function (sel) {
        return !!sel && (
            /^[\x20\t\r\n\f]*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\([\x20\t\r\n\f]*((?:-\d)?\d*)[\x20\t\r\n\f]*\)|)(?=[^-]|$)/i.test(sel) ?
            hAzzle(sel).index(this[0]) >= 0 :
            this.filter($(sel)).length > 0);
    },

    /**
     * Get immediate parents of each element in the collection.
     * If CSS selector is given, filter results to include only ones matching the selector.
     *
     * @param {String} sel
     * @return {Object}
     */

    parent: function (sel) {
        return hAzzle.create(this.pluck('parentNode', /* NodeType 11 */ 11), sel);
    },
    /**
     * Return an sequense of elements from the 'elems stack', plucked
     * by the given numbers
     *
     * Example:
     *
     * hAzzle('p').collection([1,6, 9])
     *
     * Outputs elem 1,6, 9 from the stack
     *
     * @param {array} count
     * @return {object}
     *
     */

    collection: function (count) {

        if (!hAzzle.isArray(count)) {
            return [];
        }

        var holder = [],
            i = count.length;
        while (i--) {
            holder.push(this.elems[count[i]]);
        }

        return hAzzle(holder) || [];
    },

    /**
     * Reduce the set of matched elements to the first x in the set.
     */

    first: function (count) {

        if (count) {

            return this.slice(0, count);
        }

        if (count < 0) {

            return [];
        }
        return hAzzle(this.elems[0]);
    },

    /**
     * Reduce the set of matched elements to the last one in the set.
     */

    last: function (count) {
        var elems = this.elems;

        if (count) {
            return this.slice(Math.max(elems.length - count, 0));
        }
        return hAzzle(elems[elems.length - 1]);
    },

    // Returns everything but the first entry of the array

    tail: function (count) {
        return this.slice((count === null) ? 1 : count);
    },

    /**
     * Return the element's siblings
     * @param {String} sel
     * @return {Object}
     */

    siblings: function (sel) {

        var siblings = [];

        if (!cached[sel]) {
            this.each(function (_, elem) {
                hAzzle.each(slice.call((elem.parentNode || {}).childNodes), function (_, child) {
                    if (hAzzle.isElement(child) && hAzzle.nodeType(1, child) && child !== elem) {
                        siblings.push(child);
                    }
                });
            });
            cached[sel] = siblings;
        }

        return hAzzle.create(cached[sel], sel);
    }

});

/**
 * Extending the hAzzle object with some jQuery look-a-like functions.
 * It's like this so we can be compatible with the jQuery / Zepto API
 * regarding plugins.
 */

hAzzle.extend(hAzzle, {

    dir: function (elem, dir, until) {
        var matched = [],
            truncate = until !== undefined;

        while ((elem = elem[dir]) && !(hAzzle.nodeType(9, elem))) {
            if (hAzzle.nodeType(1, elem)) {
                if (truncate && hAzzle(elem).is(hAzzle(until))) {
                    break;
                }
                matched.push(elem);
            }
        }
        return matched;
    },

    sibling: function (n, elem) {
        var matched = [];

        for (; n; n = n.nextSibling) {
            if (hAzzle.nodeType(1, n) && n !== elem) {
                matched.push(n);
            }
        }

        return matched;
    }
});

function sibling(cur, dir) {

    while (cur = cur[dir]) {

        if (cur.nodeType === 1) {
            return cur;
        }
    }

}



hAzzle.each({
    parents: function (elem) {
        return hAzzle.dir(elem, "parentNode");
    },
    parentsUntil: function (elem, i, until) {
        return hAzzle.dir(elem, "parentNode", until);
    },
    next: function (elem) {
        return sibling(elem, "nextSibling");
    },
    nextUntil: function (elem, i, until) {
        return hAzzle.dir(elem, "nextSibling", until);
    },
    nextAll: function (elem) {
        return hAzzle.dir(elem, "nextSibling");
    },
    prev: function (elem) {
        return sibling(elem, "previousSibling");
    },
    prevAll: function (elem) {
        return hAzzle.dir(elem, "previousSibling");
    },
    prevUntil: function (elem, i, until) {
        return hAzzle.dir(elem, "previousSibling", until);
    },

    children: function (elem) {
        return hAzzle.sibling(elem.firstChild);
    },
    contents: function (elem) {
        return elem.contentDocument || hAzzle.merge([], elem.childNodes);
    }
}, function (name, fn) {
    hAzzle.fn[name] = function (until, selector) {

        var matched = hAzzle.map(this, fn, until);

        if (name.slice(-5) !== "Until") {
            selector = until;
        }

        if (selector && typeof selector === "string") {
            matched = hAzzle.find(selector, null, null, matched);
        }

        if (this.length > 1) {
            // Remove duplicates
            if (!guaranteedUnique[name]) {
                hAzzle.unique(matched);
            }

            // Reverse order for parents* and prev-derivatives
            if (/^(?:parents|prev(?:Until|All))/.test(name)) {
                matched.reverse();
            }
        }
        return $(matched);
    };
});

var // Short-hand functions we are using

    isFunction = hAzzle.isFunction,
    isUndefined = hAzzle.isUndefined,
    isDefined = hAzzle.isDefined,
    isString = hAzzle.isString,

    doc = document,

    // Boolean attributes and elements

    boolean_attr = {
        'multiple': true,
        'selected': true,
        'checked': true,
        'disabled': true,
        'readOnly': true,
        'required': true,
        'open': true
    },

    boolean_elements = {
        'input': true,
        'select': true,
        'option': true,
        'textarea': true,
        'button': true,
        'form': true,
        'details': true
    },

    // Cross-browser compatible variabels

    optSelected,
    optDisabled,
    radioValue,
    checkOn,

    // RegEx we are using

    rtagName = /<([\w:]+)/,

    cached = [],

    wrapMap = {

        'option': [1, '<select multiple="multiple">', '</select>'],

        'thead': [1, '<table>', '</table>'],
        'col': [2, '<table><colgroup>', '</colgroup></table>'],
        'tr': [2, '<table><tbody>', '</tbody></table>'],
        'td': [3, '<table><tbody><tr>', '</tr></tbody></table>'],
        '_default': [0, "", ""]
    };

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// Support check

(function () {

    var input = doc.createElement("input"),
        select = doc.createElement("select"),
        opt = select.appendChild(doc.createElement("option"));

    optSelected = opt.selected;

    select.disabled = true;
    optDisabled = !opt.disabled;

    input.type = "checkbox";

    checkOn = input.value !== "";

    input.value = "t";
    input.type = "radio";

    radioValue = input.value === "t";
}());

// insertAdjacentHTML

function iAh(elem, direction, html) {

    // I blocked as you suggested, Mehran!!
    // Now malicious strings can't be added 

    if (elem && NodeMatching(elem) && !/<(?:script|style|link)/i.test(html)) {
        elem.insertAdjacentHTML(direction, hAzzle.trim(html));
    }
}

function getBooleanAttrName(element, name) {
    // check dom last since we will most likely fail on name
    var booleanAttr = boolean_attr[name.toLowerCase()];
    // booleanAttr is here twice to minimize DOM access
    return booleanAttr && boolean_elements[element.nodeName] && booleanAttr;
}

/**
 * Check if the elem matches the current nodeType
 */

function NodeMatching(elem) {
    return hAzzle.nodeType(1, elem) || hAzzle.nodeType(9, elem) || hAzzle.nodeType(11, elem) ? true : false;
}

// Global

hAzzle.extend(hAzzle, {

    // Get the properties right

    propMap: {

        "for": "htmlFor",
        "class": "className"
    },

    Hooks: {

        'SELECT': function (elem) {

            var option,
                options = elem.options,
                index = elem.selectedIndex,
                one = elem.type === "select-one" || index < 0,
                values = one ? null : [],
                value,
                max = one ? index + 1 : options.length,
                i = index < 0 ?
                max :
                one ? index : 0;

            for (; i < max; i++) {

                option = options[i];

                if ((option.selected || i === index) && !option.disabled &&
                    (optDisabled ? !option.disabled : option.getAttribute("disabled") === null) &&
                    (!option.parentNode.disabled || !hAzzle.nodeName(option.parentNode, "optgroup"))) {

                    // Get the specific value for the option
                    value = hAzzle(option).val();

                    // We don't need an array for one selects
                    if (one) {
                        return value;
                    }

                    // Multi-Selects return an array
                    values.push(value);
                }
            }
            return values;
        },

        'OPTION': function (elem) {
            var val = hAzzle(elem).filter(function (option) {
                return option.selected && !option.disabled;
            }).pluck('value');

            return val !== null ? val : hAzzle.trim(hAzzle.getText(elem));
        },
        'TYPE': function (elem, value) {
            if (!radioValue && value === "radio" &&
                hAzzle.nodeName(elem, "input")) {

                var val = elem.value;
                elem.setAttribute("type", value);
                if (val) {
                    elem.value = val;
                }
                return value;
            }
        }
    },

    // Inspired by jQuery	

    propHooks: {
        tabIndex: {
            get: function (elem) {
                return elem.hasAttribute("tabindex") || /^(?:input|select|textarea|button)$/i.test(elem.nodeName) || elem.href ?
                    elem.tabIndex : -1;
            }
        }
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

            if (isString(elem.textContent)) return elem.textContent;
            for (elem = elem.firstChild; elem; elem = elem.nextSibling) ret += hAzzle.getText(elem);

        } else if (hAzzle.nodeType(3, elem) || hAzzle.nodeType(4, elem)) {
            return elem.nodeValue;
        }
        return ret;
    },

    /**
     * Get / set the value of a property for the first element in the set of matched elements
     *
     * @param {Object} elem
     * @param {String} name
     * @param {String/Null} value
     *
     */

    prop: function (elem, name, value) {

        var ret, hooks, notxml;

        // don't get/set properties on text, comment and attribute nodes
        if (!hAzzle.nodeType(2, elem) || hAzzle.nodeType(3, elem) || !hAzzle.nodeType(8, elem)) {

            notxml = !(hAzzle.nodeType(1, elem)) || !hAzzle.isXML(elem);

            if (notxml) {

                hooks = hAzzle.propHooks[hAzzle.propMap[name] || name];
            }

            if (isDefined(value)) {

                return hooks && "set" in hooks && isDefined((ret = hooks.set(elem, value, name))) ? ret : (elem[name] = value);

            } else {

                return hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null ? ret : elem[name];
            }
        }
    },

    /**
     * Get / set the value of an attribute for the first element in the set of matched elements
     *
     * @param {Object} elem
     * @param {String} name
     * @param {String/Null} value
     *
     */

    attr: function (elem, name, value) {

        if (!elem) {

            return;
        }

        if (!hAzzle.nodeType(2, elem) || hAzzle.nodeType(3, elem) || !hAzzle.nodeType(8, elem)) {

            if (typeof elem.getAttribute === typeof undefined) {

                return hAzzle.prop(elem, name, value);
            }

            if (isUndefined(value)) {

                // Checks if a "hook" exist for this...:

                if (hAzzle.Hooks[elem.nodeName]) {

                    return hAzzle.Hooks[elem.nodeName](elem);
                }

                // The extra argument "2" is to get the right thing for a.href in IE, see jQuery code

                // some elements (e.g. Document) don't have get attribute, so return undefined

                elem = elem.getAttribute(name, 2);

                return elem === null ? undefined : elem;
            }

            // Jquery support a value to be an function, but I don't see the point
            // in supporting this now. If someone want to implement it, go for it !!

            if (isFunction(value)) {
                console.log("Not supported!");
                return;
            }

            if (value === null) {

                hAzzle.removeAttr(elem, name);
            }


            // Value is set - no need for hooks on this one...

            if (elem.nodeName === 'SELECT') {

                var optionSet, option,
                    options = elem.options,
                    values = hAzzle.makeArray(value),
                    i = options.length;

                while (i--) {
                    option = options[i];
                    if ((option.selected = hAzzle.inArray(option.value, values) >= 0)) {
                        optionSet = true;
                    }
                }

                if (!optionSet) {
                    elem.selectedIndex = -1;
                }
                return values;

            } else {

                elem.setAttribute(name, value + "");
                return value;

            }
        }
    }
});


// Core

hAzzle.extend(hAzzle.fn, {

    /**
     * Get text for the first element in the collection
     * Set text for every element in the collection
     *
     * hAzzle('div').text() => div text
     *
     * @param {String} value
     * @param {String} dir
     * @return {Object|String}
     */

    text: function (value) {

        return hAzzle.isFunction(value) ? this.each(function (i) {
            var self = hAzzle(this);
            self.text(value.call(this, i, self.text()));
        }) : !hAzzle.isObject(value) && isDefined(value) ? this.empty().each(function (_, elem) {

            if (NodeMatching(elem)) {

                // Firefox does not support insertAdjacentText 

                if (isString(value) && isDefined(HTMLElement) && HTMLElement.prototype.insertAdjacentText) {

                    elem.insertAdjacentText('beforeEnd', value);

                } else {

                    elem.textContent = value;
                }
            }
        }) : hAzzle.getText(this);
    },

    /**
     * Get html from element.
     * Set html to element.
     *
     * @param {String} value
     * @param {String} keep
     * @return {Object|String}
     */

    html: function (value, keep) {

        var elem = this[0];

        if (isUndefined(value) && hAzzle.nodeType(1, elem)) {

            return elem.innerHTML;
        }

        // We could have used 'this' inside the loop, but faster if we don't

        if (isString(value)) {

            return this.each(function (_, elem) {

                /**
                 * 'keep' if we want to keep the existing children of the node and add some more.
                 */
                if (keep && isString(value) && hAzzle.nodeType(1, elem)) {

                    iAh(elem, 'beforeend', value || '');

                } else {


                    // See if we can take a shortcut and just use innerHTML
                    if (typeof value === "string" && !/<(?:script|style|link)/i.test(value) && !wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]) {


                        // Do some magic

                        value = cached[value] ? cached[value] : cached[value] = value.replace(/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, "<$1></$2>");

                        // Remove stored data on the object to avoid memory leaks

                        hAzzle.removeData(elem);

                        // Get rid of existing children

                        elem.textContent = '';

                        // Do innerHTML

                        elem.innerHTML = value;
                    }
                }
            });

        } else if (hAzzle.isFunction(value)) {

            this.each(function (i) {

                var self = hAzzle(this);

                self.html(value.call(this, i, self.html()));
            });

        } else {

            return this.empty().append(value);
        }
    },

    /**
     * Retrive outerHTML on an element
     *
     * We could have done this in a more
     * native way, but it can be data or events
     * stored on the cloned element
     */

    outerHTML: function () {

        var tmp;

        return (!this.length) ? this : typeof (tmp = this[0].outerHTML) === 'string' ? tmp : hAzzle('<div>').append(this.first().clone()).html();
    },

    /**
     * Get value for input/select elements
     * Set value for input/select elements
     *
     * @param {String} value
     * @return {Object|String}
     */

    val: function (value) {

        if (arguments.length) {

            return this.each(function (index, elem) {

                var val;

                if (!hAzzle.nodeType(1, elem)) {
                    return;
                }

                if (isFunction(value)) {
                    val = value.call(elem, index, hAzzle(elem).val());

                } else {

                    val = value;
                }

                if (val === null) {

                    val = "";

                } else if (typeof val === "number") {

                    val += "";

                } else if (hAzzle.isArray(val)) {

                    val = hAzzle.map(val, function (value) {

                        return value === null ? "" : value + "";
                    });
                }

                if (elem.type === 'radio' || elem.type === 'checkbox') {

                    return (elem.checked = hAzzle.inArray(hAzzle(elem).val(), value) >= 0);
                }

                if (elem.type === "select") {


                    var optionSet, option,
                        options = elem.options,
                        values = hAzzle.makeArray(value),
                        i = options.length;

                    while (i--) {
                        option = options[i];
                        if ((option.selected = hAzzle.inArray(option.value, values) >= 0)) {
                            optionSet = true;
                        }
                    }

                    // force browsers to behave consistently when non-matching value is set

                    if (!optionSet) {

                        elem.selectedIndex = -1;
                    }

                    return values;
                }

                elem.value = val;
            });

        } else {

            var elem = this[0],
                ret;

            if (!checkOn) {

                return elem.getAttribute("value") === null ? "on" : elem.value;
            }

            ret = hAzzle.Hooks[elem.tagName] ? hAzzle.Hooks[elem.tagName](elem) : elem.value;

            return typeof ret === "string" ? ret.replace(/\r\n/g, "") : ret === null ? "" : ret;

        }
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
        return hAzzle.isObject(name) ? this.each(function (index, element) {
            hAzzle.each(name, function (key, value) {
                hAzzle.attr(element, key, value);
            });
        }) : hAzzle.isUndefined(value) ? hAzzle.attr(this[0], name) : this.length === 1 ? hAzzle.attr(this[0], name, value) : this.each(function () {
            return hAzzle.attr(this, name, value);
        });
    },

    /**
     * Remove a given attribute from an element
     *
     * @param {String} value
     *
     * @return {Object}
     */

    removeAttr: function (value) {

        var name, propName, i = 0,
            attrNames = value && value.match(/\S+/g);

        return this.each(function (_, elem) {

            if (attrNames && hAzzle.nodeType(1, elem)) {

                while ((name = attrNames[i++])) {
                    propName = hAzzle.propMap[name] || name;

                    if (getBooleanAttrName(elem, name)) {

                        elem[propName] = false;
                    }

                    elem.removeAttribute(name);
                }
            }
        });
    },

    /**
     * Check if an element have an attribute
     *
     * @param{String} name
     * @return {Boolean}
     */

    hasAttr: function (name) {
        return name && isDefined(this.attr(name));
    },

    /**
     * Sets an HTML5 data attribute
     *
     * @param{String} dataAttribute
     * @param{String} dataValue
     *
     * @return {Object}
     */

    dataAttr: function (dataAttribute, dataValue) {

        if (!dataAttribute || !isString(dataAttribute)) {
            return false;
        }

        //if dataAttribute is an object, we will use it to set a data attribute for every key
        if (typeof (dataAttribute) == "object") {
            for (var key in dataAttribute) {
                this.attr('data-' + key, dataAttribute[key]);
            }

            return this;
        }

        //if a value was passed, we'll set that value for the specified dataAttribute
        else if (dataValue) {
            return this.attr('data-' + dataAttribute, dataValue);
        }

        // lastly, try to just return the requested dataAttribute's value from the element
        else {
            var value = this.attr('data-' + dataAttribute);

            // specifically checking for undefined in case "value" ends up evaluating to false

            if (isUndefined(value)) {
                return;
            }

            return value;
        }
    },

    /**
     * Read or set properties of DOM elements
     *
     * @param {String/Object}
     * @param {String/Null}
     *
     * @return {Object}
     */

    prop: function (name, value) {
        return hAzzle.isObject(name) ? this.each(function (value, element) {
            hAzzle.each(name, function (key, value) {
                hAzzle.prop(element, key, value);
            });
        }) : isUndefined(value) ? this[0] && this[0][hAzzle.propMap[name] || name] : hAzzle.prop(this[0], name, value);
    },

    /**
     * Toggle properties
     */

    toggleProp: function (property) {
        return this.each(function () {
            return this.prop(property, !this.prop(property));
        });

    },

    /*
     * Remove properties from DOM elements
     *
     * @param {String}
     *
     * @return {Object}
     */

    removeProp: function (name) {
        return this.each(function () {
            delete this[hAzzle.propMap[name] || name];
        });
    },

    /**
     * Replace each target element with the set of matched elements
     *
     * @param {String} html
     * @return {Object}
     */

    replaceAll: function (html) {

        var elems,
            ret = [],
            insert = hAzzle(html),
            last = insert.length - 1,
            i = 0;

        for (; i <= last; i++) {
            elems = i === last ? this : this.clone(true);
            hAzzle(insert[i]).replaceWith(elems);
        }

        return this;

    },

    /**
     * Replace each element in the set of matched elements with the provided new content
     *
     * @param {String} html
     * @return {Object}
     */

    replaceWith: function (html) {

        // Use the faster 'insertAdjacentHTML' if we can

        if (isString(html) && this[0].parentNode && !hAzzle.isXML(this[0])) {

            return this.before(html).remove();
        }

        // If function

        if (isFunction(html)) {
            return this.each(function (index) {
                var self = hAzzle(this),
                    old = self.html();
                self.replaceWith(html.call(this, index, old));
            });
        }

        var arg = arguments[0];
        this.manipulateDOM(arguments, function (elem) {

            arg = this.parentNode;

            if (arg) {
                arg.replaceChild(elem, this);
            }
        });

        // Force removal if there was no new content (e.g., from empty arguments)
        return arg && (arg.length || arg.nodeType) ? this : this.remove();
    }

});

/* 
 * Prepend, Append, Befor and After
 *
 *  NOTE!!!
 *
 *  If 'html' are plain text, we use the insertAdjacentHTML to inject the content.
 *	This method is faster, and now supported by all major browsers.
 *
 *	If not a pure string, we have to go the long way jQuery walked before us :)
 *
 *	K.F
 */

hAzzle.each({

    prepend: "afterbegin",
    append: "beforeend"
}, function (name, second) {

    hAzzle.fn[name] = function (html) {
        if (isString(html)) {
            return this.each(function () {
                iAh(this, second, html);
            });
        } else { // The long walk :(
            return this.manipulateDOM(arguments, function (elem) {
                if (NodeMatching(this)) {
                    var target = hAzzle.nodeName(this, "table") && hAzzle.nodeName(hAzzle.nodeType(11, elem) ? elem : elem.firstChild, "tr") ?
                        this['getElementsByTagName']("tbody")[0] ||
                        elem.appendChild(this.ownerDocument.createElement("tbody")) : this;

                    // Choose correct method	

                    if (name === 'prepend') {
                        target.insertBefore(elem, target.firstChild);
                    } else {
                        target.appendChild(elem);
                    }
                }
            });
        }
    };
});

hAzzle.each({
    appendTo: "append",
    prependTo: "prepend",
    insertBefore: "before",
    insertAfter: "after",
    replaceAll: "replaceWith"
}, function (name, original) {
    hAzzle.fn[name] = function (selector) {
        var elems,
            ret = [],
            insert = hAzzle(selector),
            last = insert.length - 1,
            i = 0;
        for (; i <= last; i++) {
            elems = i === last ? this : this.clone(true);
            hAzzle(insert[i])[original](elems);

            Array.prototype.push.apply(ret, elems.get());
        }
    };
});


/**
 * Before and After
 */

hAzzle.each({
    before: "beforebegin",
    after: "afterend"
}, function (name, second) {

    hAzzle.fn[name] = function (html) {
        if (isString(html) && !hAzzle.isXML(this[0])) {
            return this.each(function () {
                iAh(this, second, html);
            });
        }
        return this.manipulateDOM(arguments, function (elem) {
            this.parentNode && this.parentNode.insertBefore(elem, name === 'after' ? this.nextSibling : this);
        });
    };
});


// Support: IE9+
if (!optSelected) {
    hAzzle.propHooks.selected = {
        get: function (elem) {
            var parent = elem.parentNode;
            if (parent && parent.parentNode) {
                parent.parentNode.selectedIndex;
            }
            return null;
        }
    };
}

hAzzle.each([
    "tabIndex",
    "readOnly",
    "maxLength",
    "cellSpacing",
    "cellPadding",
    "rowSpan",
    "colSpan",
    "useMap",
    "frameBorder",
    "contentEditable"
], function () {
    hAzzle.propMap[this.toLowerCase()] = this;
});

// Classes
// Check if we can support classList
var csp = !!document.createElement('p').classList,

    // ONLY!! for browsers who don't support classlist

    indexOf = Array.prototype.indexOf,

    sMa, // Multiple argumens
    whitespace = /\S+/g,
    isFunction = hAzzle.isFunction;

// Check for support for multiple arguments for classList (IE doesn't have it )

csp && function () {
    var div = document.createElement('div');
    div.classList.add('a', 'b');
    sMa = /(^| )a( |$)/.test(div.className) && /(^| )b( |$)/.test(div.className);
}();

hAzzle.extend(hAzzle.fn, {

    /**
     * Add class(es) to element collection
     *
     * @param {String} value
     */

    addClass: function (value) {
        var element,
            classes = (value || '').match(whitespace) || [];
        return isFunction(value) ? this.each(function (e) {
            hAzzle(this).addClass(value.call(this, index, this.className));
        }) : this.each(function () {
            element = this;
            if (element.nodeType === 1) {
                if (csp) {

                    if (sMa) {

                        element.classList.add.apply(element.classList, classes);

                    } else {

                        value.replace(whitespace, function (name) {
                            element.classList.add(name);
                        });
                    }
                } else {
                    var name;
                    classes = ' ' + element.className + ' ',
                    value = value.trim().split(/\s+/);
                    while (name = value.shift()) {
                        if (hAzzle.inArray(classes, ' ' + name + ' ') === -1) {
                            classes += name + ' ';
                        }
                    }
                    element.className = classes.trim();
                }
                return element;
            }
        });
	},

     /**
     * Remove class(es) from element
     *
     * @param {String} value
     */

    removeClass: function (value) {

        var cls,
            element,
            classes = (value || '').match(whitespace) || [];

        // Function

        return isFunction(value) ?
            this.each(function (j) {
                hAzzle(this).removeClass(value.call(this, j, this.className));
            }) : this.each(function () {
                element = this;
                if (element.nodeType === 1 && element.className) {

                    if (!value) {
                        return element.className = '';
                    }

                    if (value === '*') {
                        element.className = '';
                    } else {
                        if (hAzzle.isRegExp(value)) {
                            value = [value];
                        } else if (csp && hAzzle.inArray(value, '*') === -1) {
                            if (sMa) {
                                element.classList.remove.apply(element.classList, classes);
                            } else {
                                var i = 0;
                                while ((cls = classes[i++])) {
                                    element.classList.remove(cls);
                                }
                            }
                            return;
                        } else {
                            value = value.trim().split(/\s+/);


                            var name;

                            classes = ' ' + element.className + ' ';

                            while (name = value.shift()) {
                                if (name.indexOf('*') !== -1) {
                                    name = new RegExp('\\s*\\b' + name.replace('*', '\\S*') + '\\b\\s*', 'g');
                                }
                                if (name instanceof RegExp) {
                                    classes = classes.replace(name, ' ');
                                } else {
                                    while (classes.indexOf(' ' + name + ' ') !== -1) {
                                        classes = classes.replace(' ' + name + ' ', ' ');
                                    }
                                }
                            }
                            element.className = classes.trim();
                        }
                        return element;
                    }
                }
            });

    },

    /**
     * Checks if an element has the given class


     *
     * @param {String} selector(s)
     * @return {Boolean} true if the element contains all classes
     */

    hasClass: function (value) {

        var i = 0,
            l = this.length;
        for (; i < l;) {
            return csp ?
                this[i].classList.contains(hAzzle.trim(value)) :
                this[i].nodeType === 1 && (" " + this[i].className + " ").replace(/[\t\r\n\f]/g, " ").indexOf(hAzzle.trim(value)) >= 0;
        }
    },


    /**
     * Replace a class in a element collection
     *
     * @param {String} clA
     * @param {String} clB
     */

    replaceClass: function (clA, clB) {
        var current, found, i;
        return this.each(function () {
            current = this.className.split(' '),
            found = false;

            for (i = current.length; i--;) {
                if (current[i] == clA) {
                    found = true;
                    current[i] = clB;
                }
            }
            if (!found) {
                return hAzzle(this).addClass(clB, this);
            }
            this.className = current.join(' ');
        });
    },

    /**
     * Toggle class(es) on element
     *
     * @param {String} value
     * @param {Boolean} state
     * @return {Boolean}
     */

    toggleClass: function (value, state) {

        var type = typeof value;

        if (typeof state === "boolean" && type === "string") {
            return state ? this.addClass(value) : this.removeClass(value);
        }

        if (isFunction(value)) {
            return this.each(function (i) {
                hAzzle(this).toggleClass(value.call(this, i, this.className, state), state);
            });
        }

        var classNames = value.match(whitespace) || [],
            cls,
            i = 0,
            self;

        return this.each(function (_, elem) {

            if (type === "string") {

                // ClassList

                self = hAzzle(elem);

                while ((cls = classNames[i++])) {

                    if (csp) {

                        if (typeof state === "boolean") {

                            // IE10+ doesn't support the toggle boolean flag.

                            if (state) {

                                return elem.classList.add(cls);

                            } else {

                                return elem.classList.remove(cls);
                            }
                        }

                        return elem.classList.toggle(cls);
                    }

                    // check each className given, space separated list

                    if (self.hasClass(cls)) {

                        self.removeClass(cls);

                    } else {

                        self.addClass(cls);
                    }
                }

                // Toggle whole class name
            } else if (type === typeof undefined || type === "boolean") {
                if (this.className) {
                    // store className if set
                    hAzzle.data(this, "__className__", this.className);
                }

                this.className = this.className || value === false ? "" : hAzzle.data(this, "__className__") || "";
            }
        });
    }
});

// CSS


// CSS
;
(function ($) {

    var doc = document,
        html = window.document.documentElement,
        background = /background/i,
        rnum = /^[\-+]?(?:\d*\.)?\d+$/i,

        cached = [],

        isFunction = $.isFunction,
        isUndefined = $.isUndefined,

        rnumsplit = /^([+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|))(.*)$/i,
        cssDirection = ["Top", "Right", "Bottom", "Left"],

        cssShow = {
            position: "absolute",
            visibility: "hidden",
            display: "block"
        },
        relNum = /^([+-])=([+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|))(.*)/i;

    $.extend($, {

        cssNumber: {
            'column-count': 1,
            'columns': 1,
            'font-weight': 1,
            'line-height': 1,
            'opacity': 1,
            'z-index': 1,
            'zoom': 1
        },

        cssHooks: {

        },

        cssNormalTransform: {
            letterSpacing: "0",
            fontWeight: "400"
        },

        cssProps: {

            "float": "cssFloat"
        },

        curCSS: function (elem, name, computed) {

            var ret;

            computed = computed || elem.ownerDocument.defaultView.getComputedStyle(elem, null);

            if (computed) {

                ret = computed.getPropertyValue(name) || computed[name];

                if (ret === "" && !$.contains(elem.ownerDocument, elem)) {

                    ret = $.style(elem, name);
                }
            }
            return isUndefined(ret) ? ret + "" : ret;
        },
        css: function (element, name, extra) {

            var computed, val;

            name = $.camelCase(name);

            // Do we have any cssHooks available?

            var hooks = $.cssHooks[name];

            // If a hook was provided get the computed value from there

            if ($.cssHooks[name] && ("get" in hooks)) {

                val = hooks['get'](element, true, extra);
            }

            if (val === undefined) {

                computed = element.ownerDocument.defaultView.getComputedStyle(element, null);

                if (computed) {

                    val = computed.getPropertyValue(name) || computed[name];
                }

                if (val === "" && !$.contains(element.ownerDocument, element)) {

                    val = $.style(elem, name);
                }
            }

            if (extra === "" || extra) {
                num = parseFloat(val);
                return extra === true || $.isNumeric(num) ? num || 0 : val;
            }


            return $.isUndefined(val) ? val + "" : val;
        },

        /**
         * CSS properties accessor for an element
         */

        style: function (element, property, value, extra) {

            value = $.cssProps[value] || ($.cssProps[property] = (value in element.style ? value : $.prefix(property)) || value);

            // Do we have any cssHooks available?

            var hooks = $.cssHooks[property];

            var ret = relNum.exec(value);

            if (ret) {

                value = $.css(elem, name);
                value = $.pixelsToUnity(value, ret[3], elem, name) + (ret[1] + 1) * ret[2];

                value = (ret[1] + 1) * ret[2] + parseFloat($.css(element, property));
            }

            // If a number was passed in, add 'px' to the (except for certain CSS properties)

            if (typeof value === 'number' && !$.cssNumber[property]) {

                value += ret && ret[3] ? ret[3] : "px";
            }

            // Check for background

            if (value === "" && background.test(property)) {

                value = "inherit";
            }

            if (!hooks || !("set" in hooks) || (value = hooks.set(element, value, extra)) !== undefined) {

                element.style[(value === null || value === ' ') ? 'remove' : 'set' + 'Property'](property, '' + value)
                return element

            }
        },

        swap: function (elem, options, callback, args) {
            var ret, name,
                old = {};

            // Remember the old values, and insert the new ones
            for (name in options) {
                old[name] = elem.style[name];
                elem.style[name] = options[name];
            }

            ret = callback.apply(elem, args || []);

            // Revert the old values
            for (name in options) {
                elem.style[name] = old[name];

            }

            return ret;
        },

        pixelsToUnity: function (px, unit, elem, prop) {

            if (unit === "" || unit === "px") return px; // Don't waste our time if there is no conversion to do.
            else if (unit === "em") return px / hAzzle.css(elem, "fontSize", ""); // "em" refers to the fontSize of the current element.
            else if (unit === "%") {

                if (/^(left$|right$|margin|padding)/.test(prop)) {
                    prop = "width";
                } else if (/^(top|bottom)$/.test(prop)) {
                    prop = "height";
                }
                elem = /^(relative|absolute|fixed)$/.test($.css(elem, "position")) ?
                    elem.offsetParent : elem.parentNode;
                if (elem) {
                    prop = $.css(elem, prop, true);
                    if (prop !== 0) {
                        return px / prop * 100;
                    }
                }
                return 0;
            }

            if (isUndefined($.pixelsToUnity.units)) {
                var units = $.pixelsToUnity.units = {},
                    div = doc.createElement("div");
                div.style.width = "100cm";
                docbody.appendChild(div); // If we don't link the <div> to something, the offsetWidth attribute will be not set correctly.
                units.mm = div.offsetWidth / 1000;
                docbody.removeChild(div);
                units.cm = units.mm * 10;
                units.inn = units.cm * 2.54;
                units.pt = units.inn * 1 / 72;
                units.pc = units.pt * 12;
            }
            // If the unity specified is not recognized we return the value.
            unit = $.pixelsToUnity.units[unit];
            return unit ? px / unit : px;
        },

        setOffset: function (elem, coordinates, i) {
            var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
                position = $.css(elem, "position"),
                curElem = $(elem),
                props = {};

            // Set position first, in-case top/left are set even on static elem

            if (position === "static") {
                elem.style.position = "relative";
            }

            curOffset = curElem.offset();
            curCSSTop = $.css(elem, "top");
            curCSSLeft = $.css(elem, "left");
            calculatePosition = (position === "absolute" || position === "fixed") &&
                (curCSSTop + curCSSLeft).indexOf("auto") > -1;

            // Need to be able to calculate position if either top or left is auto and position is either absolute or fixed
            if (calculatePosition) {
                curPosition = curElem.position();
                curTop = curPosition.top;
                curLeft = curPosition.left;

            } else {

                curTop = parseFloat(curCSSTop) || 0;
                curLeft = parseFloat(curCSSLeft) || 0;
            }

            if (isFunction(coordinates)) {

                coordinates = coordinates.call(elem, i, curOffset);
            }

            if (!$.isNull(coordinates.top)) {

                props.top = (coordinates.top - curOffset.top) + curTop;
            }
            if (!$.isNull(coordinates.left)) {

                props.left = (coordinates.left - curOffset.left) + curLeft;
            }

            if ("using" in coordinates) {

                coordinates.using.call(elem, props);

            } else {

                curElem.css(props);
            }
        }

    });

    $.extend($.fn, {

        css: function (property, value) {

            if (value == null) {
                if (typeof property == 'string') {
                    return this.elems[0] && $.css(this.elems[0], property)
                }

                for (var key in property) {


                    this.each(function () {
                        $.style(this, key, property[key]);
                    });
                }
                return this;
            }
            return this.each(function (i, element) {
                $.style(element, property, value)
            })
        },

        /**
         * Calculates offset of the current element
         * @param{coordinates}
         * @return object with left, top, bottom, right, width and height properties
         */

        offset: function (coordinates) {

            if (arguments.length) {
                return coordinates === undefined ?
                    this :
                    this.each(function (i) {
                        $.setOffset(this, coordinates, i);
                    });
            }

            var elem = this[0],
                _win,
                clientTop = html.clientTop,
                clientLeft = html.clientLeft,
                doc = elem && elem.ownerDocument;

            if (!doc) {

                return;
            }

            _win = $.isWindow(doc) ? doc : $.nodeType(9, doc) && doc.defaultView;

            var scrollTop = _win.pageYOffset || html.scrollTop,
                scrollLeft = _win.pageXOffset || html.scrollLeft,
                boundingRect = {
                    top: 0,
                    left: 0
                };

            if (elem && elem.ownerDocument) {

                // Make sure it's not a disconnected DOM node

                if (!$.contains(html, elem)) {
                    return boundingRect;
                }

                if (typeof elem.getBoundingClientRect !== typeof undefined) {
                    boundingRect = elem.getBoundingClientRect();
                }

                return {
                    top: boundingRect.top + scrollTop - clientTop,
                    left: boundingRect.left + scrollLeft - clientLeft,
                    right: boundingRect.right + scrollLeft - clientLeft,
                    bottom: boundingRect.bottom + scrollTop - clientTop,
                    width: boundingRect.right - boundingRect.left,
                    height: boundingRect.bottom - boundingRect.top
                };
            }
        },

        position: function () {

            if (!this[0]) return null;

            var offsetParent, offset,
                elem = this[0],
                parentOffset = {
                    top: 0,
                    left: 0
                };

            if ($.css(elem, "position") === "fixed") {

                offset = elem.getBoundingClientRect();

            } else {

                // Get *real* offsetParent

                offsetParent = this.offsetParent();

                // Get correct offsets
                offset = this.offset();

                if (!$.nodeName(offsetParent[0], "html")) {
                    parentOffset = offsetParent.offset();
                }

                // Subtract element margins

                parentOffset.top += $.css(offsetParent[0], "borderTopWidth", true);
                parentOffset.left += $.css(offsetParent[0], "borderLeftWidth", true);
            }

            // Subtract parent offsets and element margins
            return {
                top: offset.top - parentOffset.top - $.css(elem, "marginTop", true),
                left: offset.left - parentOffset.left - $.css(elem, "marginLeft", true)
            };
        },

        /**  
         * Get the closest ancestor element that is positioned.
         */

        offsetParent: function () {
            return this.map(function (elem) {
                var op = elem.offsetParent || doc.documentElement;
                while (op && (!$.nodeName(op, "html") && $.css(op, "position") === "static")) {
                    op = op.offsetParent || doc.documentElement;
                }
                return op;
            });
        }
    });



    $.each({
        "Height": "height",
        "Width": "width"
    }, function (name, type) {

        $.fn["inner" + name] = function () {

            var elem = this[0];
            return elem ?
                elem.style ?
                parseFloat($.css(elem, type, "padding")) :
                this[type]() :
                null;

        };
        $.fn["outer" + name] = function (margin) {

            var elem = this[0];
            return elem ?
                elem.style ?
                parseFloat($.css(elem, type, margin ? "margin" : "border")) :
                this[type]() :
                null;
        };
        $.fn[type] = function (size) {
            var el = this[0];
            if (!el) return size === null ? null : this;
            if (isFunction(size))
                return this.each(function (i) {
                    var self = $(this);
                    self[type](size.call(this, i, self[type]()));
                });
            if ($.isWindow(el)) {
                return el.document.documentElement["client" + name];
            } else if ($.nodeType(9, el)) {
                return Math.max(
                    el.documentElement["client" + name],
                    el.body["scroll" + name], el.documentElement["scroll" + name],
                    el.body["offset" + name], el.documentElement["offset" + name]);
            } else if (isUndefined(size)) {
                var orig = $.css(el, type),
                    ret = parseFloat(orig);
                return $.IsNaN(ret) ? orig : ret;
            } else return this.css(type, $.isString(size) ? size : size + "px");
        };
    });



    function getWH(elem, name, extra) {

        var val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
            valueIsBorderBox = true,
            isBorderBox = $.support.boxSizing && $.css(elem, "boxSizing") === "border-box";

        if (val <= 0) {
            // Fall back to computed then uncomputed css if necessary
            val = $.curCSS(elem, name);
            if (val < 0 || val === null) {
                val = elem.style[name];
            }

            // Computed unit is not pixels. Stop here and return.
            if (rnumnonpx.test(val)) {
                return val;
            }

            // we need the check for style in case a browser which returns unreliable values
            // for getComputedStyle silently falls back to the reliable elem.style
            valueIsBorderBox = isBorderBox && ($.support.boxSizingReliable || val === elem.style[name]);

            // Normalize "", auto, and prepare for extra
            val = parseFloat(val) || 0;
        }

        // use the active box-sizing model to add/subtract irrelevant styles
        return (val +
            augmentWidthOrHeight(
                elem,
                name,
                extra || (isBorderBox ? "border" : "content"),
                valueIsBorderBox
            )
        ) + "px";
    }

    function augmentWidthOrHeight(elem, name, extra, isBorderBox) {

        var i = extra === (isBorderBox ? "border" : "content") ? 4 : name === "width" ? 1 : 0,
            val = 0;

        for (; i < 4; i += 2) {

            if (extra === "margin") {
                val += $.css(elem, extra + cssDirection[i], true);
            }
            if (isBorderBox) {
                // border-box includes padding, so remove it if we want content
                if (extra === "content") {
                    val -= parseFloat($.curCSS(elem, "padding" + cssDirection[i])) || 0;
                }

                if (extra !== "margin") {
                    val -= parseFloat($.curCSS(elem, "border" + cssDirection[i] + "Width")) || 0;
                }
            } else {
                // at this point, extra isnt content, so add padding
                val += parseFloat($.curCSS(elem, "padding" + cssDirection[i])) || 0;

                // at this point, extra isnt content nor padding, so add border
                if (extra !== "padding") {
                    val += parseFloat($.curCSS(elem, "border" + cssDirection[i] + "Width")) || 0;
                }
            }
        }

        return val;
    }

    /**
     * Process scrollTop and scrollLeft
     */
    $.each({
        'scrollTop': 'pageYOffset',
        'scrollLeft': 'pageXOffset'
    }, function (name, dir) {
        $.fn[name] = function (val) {
            var elem = this[0],
                win = $.isWindow(elem) ? elem : $.nodeType(9, elem) && elem.defaultView;

            if (isUndefined(val)) return val ? val[dir] : elem[name];
            win ? win.scrollTo(window[name]) : elem[name] = val;
        };
    });


    /**
     * CSS hooks - margin and padding
     */

    $.each(["margin", "padding"], function (i, hook) {
        $.cssHooks[hook] = {
            get: function (elem, computed, extra) {
                return $.map(cssDirection, function (dir) {
                    return $.css(elem, hook + dir);
                }).join(" ");
            },
            set: function (elem, value) {
                var parts = value.split(/\s/),
                    values = {
                        "Top": parts[0],
                        "Right": parts[1] || parts[0],
                        "Bottom": parts[2] || parts[0],
                        "Left": parts[3] || parts[1] || parts[0]
                    };
                $.each(cssDirection, function (i, dir) {
                    elem.style[hook + dir] = values[dir];
                });
            }
        };
    });

    $.each(["height", "width"], function (i, name) {
        $.cssHooks[name] = {
            get: function (elem, computed, extra) {
                return (cached[elem] ? cached[elem] : cached[elem] = /^(none|table(?!-c[ea]).+)/.test($.css(elem, "display"))) && elem.offsetWidth === 0 ?
                    $.swap(elem, cssShow, function () {
                        return getWH(elem, name, extra);
                    }) :
                    getWH(elem, name, extra);
            },
            set: function (elem, value, extra) {
                var styles = extra && getStyles(elem);
                return setPositiveNumber(elem, value, extra ?
                    augmentWidthOrHeight(
                        elem,
                        name,
                        extra,
                        $.css(elem, "boxSizing", false, styles) === "border-box",
                        styles
                    ) : 0
                );
            }
        };
    });

    function setPositiveNumber(elem, value, subtract) {
        var matches = rnumsplit.exec(value);
        return matches ?
            Math.max(0, matches[1] - (subtract || 0)) + (matches[2] || "px") :
            value;
    }

})(hAzzle);

// Removeable

;
(function ($) {

    /**
     * Remove all child nodes of the set of matched elements from the DOM.
     *
     * - It first remove all data stored on the object
     * - Then it remove all event listeners attached on the object
     * - In the end, it removes all HTML on the elems in the elems stack.
     *
     * @return {Object}
     */

    $.fn.empty = function () {

        var elem,
            i = 0;

        for (;
            (elem = this[i]) != null; i++) {
            if ($.nodeType(1, elem)) {
                $.removeData(elem);
                $.Events.off(elem);
                elem.textContent = "";
            }
        }
        return this;
    },

    /**
     *  Remove an element from the DOM
     */
    $.fn.remove = function () {

        // Discard any data on the element

        return this.removeData().each(function (_, elem) {

            // Locate all nodes that belong to this element
            // and add them to the "elems stack"

            var elements = $(elem).find('*');
            elements = elements.add(elem);

            $.Events.off(elem);

            var parent = elem.parentNode;

            if (parent) {

                // Remove all children

                this.parentNode.removeChild(elem);

            }

        })
        return false;
    };

})(hAzzle);



// Data

/** 
 * Data
 */

var isUndefined = hAzzle.isUndefined,
    nodeType = hAzzle.nodeType,
    html5Json = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/;

// Extend the hAzzle object

hAzzle.extend({

    _data: {},

    /**
     * Check if an element contains data
     *
     * @param{String/Object} elem
     * @param{String} key
     * @return {Object}
     */

    hasData: function (elem) {

        if (elem.nodeType) {
            if (hAzzle._data[hAzzle.getUID(elem)]) {

                return true;

            } else {

                return false;
            }
        }
    },

    /**
     * Remove data from an element
     *
     * @param {String/Object} elem
     * @param {String} key
     * @return {Object}
     */

    removeData: function (elem, key) {

        if (nodeType(1, elem) || nodeType(9, elem) || !(+elem.nodeType)) {

            if (!elem instanceof hAzzle) {
                elem = hAzzle(elem);
            }

            var id = hAzzle.getUID(elem);

            // Nothing to do if there are no data stored on the elem itself

            if (hAzzle._data[id]) {

                if (isUndefined(key) && nodeType(1, elem)) {

                    hAzzle._data[id] = {};

                } else {

                    if (hAzzle._data[id]) {
                        delete hAzzle._data[id][key];
                    } else {
                        hAzzle._data[id] = null;
                    }
                }

            }
        }
    },

    data: function (elem, key, value) {

        if (nodeType(1, elem) || nodeType(9, elem) || !(+elem.nodeType)) {

            var id = hAzzle._data[hAzzle.getUID(elem)];

            // Create and unique ID for this elem

            if (!id && elem.nodeType) {
                var pid = hAzzle.getUID(elem);
                id = hAzzle._data[pid] = {};
            }

            // Return all data on saved on the element

            if (isUndefined(key)) {

                return id;
            }

            if (isUndefined(value)) {

                return id[key];
            }

            if (!isUndefined(value)) {

                // Set and return the value

                id[key] = value;

                return id[key];
            }
        }
    }
});

hAzzle.extend(hAzzle.fn, {

    /**
     * Remove attributes from element collection
     *
     * @param {String} key
     *
     * @return {Object}
     */

    removeData: function (key) {
        return this.each(function () {
            hAzzle.removeData(this, key);
        });
    },

    /**
     * Getter/setter of a data entry value on the hAzzle Object. Tries to read the appropriate
     * HTML5 data-* attribute if it exists
     * @param  {String|Object|Array}  key(s)
     * @param  {Object}               value
     * @return {Object|String }
     */

    data: function (key, value) {
        var len = arguments.length,
            keyType = typeof key;

        // If no arguments, try to get the data from the HTML5 data- attribute

        if (!len) {

            var data = hAzzle.data(this[0]),
                elem = this[0];

            if (nodeType(1, elem) && !hAzzle.data(elem, "parsedAttrs")) {

                var attr = elem.attributes,
                    name,
                    i = 0,
                    l = attr.length;

                for (; i < l; i++) {

                    name = attr[i].name;

                    if (name.indexOf("data-") === 0) {

                        name = hAzzle.camelCase(name.substr(5));

                        data = data[name];

                        // Try to fetch data from the HTML5 data- attribute

                        if (isUndefined(data) && nodeType(1, elem)) {

                            var name = "data-" + key.replace(/([A-Z])/g, "-$1").toLowerCase();

                            data = elem.getAttribute(name);

                            if (typeof data === "string") {
                                try {
                                    data = data === "true" ? true :
                                        data === "false" ? false :
                                        data === "null" ? null : +data + "" === data ? +data :
                                        html5Json.test(data) ? JSON.parse(data + "") : data;
                                } catch (e) {}

                                // Make sure we set the data so it isn't changed later

                                hAzzle.data(elem, key, data);

                            } else {
                                data = undefined;
                            }
                        }
                        return data;
                    }
                }

                hAzzle.data(elem, "parsedAttrs", true);
            }

            // 'key' defined, but no 'data'.

        } else if (len === 1) {

            if (this.length === 1) {

                return hAzzle.data(this.elems[0], key);

            } else {

                // Sets multiple values

                return this.elems.map(function (el) {

                    return hAzzle.data(el, key);

                });
            }

        } else if (len === 2) {

            return hAzzle.data(this[0], key, value);
        }

        hAzzle.error("Something went wrong!");
    }

});

// Events

    var root = document.documentElement || {},
        isString = hAzzle.isString,
        isFunction = hAzzle.isFunction,

        // Cached handlers

        container = {},

        specialsplit = /\s*,\s*|\s+/,
        rkeyEvent = /^key/, // key
        rmouseEvent = /^(?:mouse|pointer|contextmenu)|click/, // mouse
        ns = /[^\.]*(?=\..*)\.|.*/, // Namespace regEx
        names = /\..*/,

        // Event and handlers we have fixed

        treated = {},

        // Some prototype references we need


        substr = String.prototype.substr,
        slice = Array.prototype.slice,
        concat = Array.prototype.concat,
        toString = Object.prototype.toString,

        threatment = {

            // Don't do events on disabeled nodes

            disabeled: function (el, type) {
                if (el.disabeled && type === "click") return true;
            },

            // Don't do events on text and comment nodes 

            nodeType: function (el) {
                if (hAzzle.nodeType(3, el) || hAzzle.nodeType(8, el)) return true;
            }
        },

        special = {
            pointerenter: {
                fix: "pointerover",
                condition: checkPointer
            },

            pointerleave: {
                fix: "pointerout",
                condition: checkPointer
            },
            mouseenter: {
                fix: 'mouseover',
                condition: checkMouse
            },
            mouseleave: {
                fix: 'mouseout',
                condition: checkMouse
            },
            mousewheel: {
                fix: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel'
            }
        },

        // Includes some event props shared by different events

        commonProps = "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" ");

    // Check mouse

    function checkMouse(evt) {
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

    /**
     * FIX ME!!  I don't have a pointer device so can't fix this. Maybe in the future.
     * But need to run a check about this condition here.
     */

    function checkPointer(evt) {
        return evt;
    }

    hAzzle.extend({

        // Event hooks

        eventHooks: {

            // Mouse and key props are borrowed from jQuery

            keys: function (evt, original) {
                original.keyCode = evt.keyCode || evt.which;
                return commonProps.concat(["char", "charCode", "key", "keyCode"]);

            },
            mouse: function (evt, original) {

                original.rightClick = evt.which === 3 || evt.button === 2;

                original.pos = {
                    x: 0,
                    y: 0
                };

                // Calculate pageX/Y if missing and clientX/Y available

                if (evt.pageX || evt.pageY) {
                    original.clientX = evt.pageX;
                    original.clientY = evt.pageY;
                } else if (evt.clientX || evt.clientY) {
                    original.clientX = evt.clientX + doc.body.scrollLeft + root.scrollLeft;
                    original.clientY = evt.clientY + doc.body.scrollTop + root.scrollTop;
                }

                return commonProps.concat("button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "));
            }
        },

        Kernel: function (element, type, handler, original, namespaces, args) {

            var _special = special[type],
                evt = this;

            // Only load the event once upon unload

            if (type === 'unload') {

                handler = hAzzle.Events.once(hAzzle.Events.removeListener, element, type, handler, original);
            }

            if (_special) {
                if (_special.condition) {
                    handler = hAzzle.Events.wrappedHandler(element, handler, _special.condition, args);
                }

                type = _special.fix || type;
            }

            evt.element = element;
            evt.type = type;
            evt.original = original;
            evt.namespaces = namespaces;
            evt.eventType = type;
            evt.target = element;
            evt.handler = hAzzle.Events.wrappedHandler(element, handler, null, args);
        }
    });


    hAzzle.Kernel.prototype = {

        inNamespaces: function (checkNamespaces) {

            var i, j, c = 0;

            if (!checkNamespaces) {

                return true;
            }

            if (!this.namespaces) {

                return false;
            }
            
			i = checkNamespaces.length;
            
			while (i--) {
                for (j = this.namespaces.length; j--;) {
                    if (checkNamespaces[i] == this.namespaces[j]) c++;
                }
            }
            return checkNamespaces.length === c;
        },

        matches: function (checkElement, checkOriginal, checkHandler) {
            return this.element === checkElement &&
                (!checkOriginal || this.original === checkOriginal) &&
                (!checkHandler || this.handler === checkHandler);
        }
    };

    hAzzle.extend(hAzzle.fn, {

        /**
         * Bind a DOM event to element
         *
         * @param {String|Array|Object} events
         * @param {Function|String} selector
		 * @param {Function} fn
         * @param {Boolean} one
         * @return {Object}
         */

        on: function (events, selector, fn, /*INTERNAL*/ one) {
            return this.each(function () {
                    hAzzle.Events.add(this, events, selector, fn, one);
                });
        },

        /**
         * Bind a DOM event but fire once before being removed
         *
         * @param {String|Array|Object} events
         * @param {Function|String} selector
         * @param {Function} fn
         * @return {Object}
         **/

        one: function (types, selector, fn) {
            return this.on(types, selector, fn, 1);
        },

        /**
         * Unbind an event from the element
         *
         * @param {String} events
         * @param {Function} fn
         * @return {Object}
         */

        off: function (events, fn) {
            return this.each(function () {
                    hAzzle.Events.off(this, events, fn)

                });
        },

        /**
         * Triggers an event of specific type with optional extra arguments
         *
         * @param {Object|String} type
         * @param {Object|String} args
         * @return {Object}
         */

        trigger: function (type, args) {

            var el = this[0];

            var types = type.split(specialsplit),
                i = types.length,
				j, l, call, evt, names, handlers;

            if (threatment['disabeled'](el, type) || threatment['nodeType'](el)) return false;

            while (i--) {
                type = types[i].replace(names, '');
                if (names = types[i].replace(ns, '')) names = names.split('.');
                if (!names && !args) {
                    var HTMLEvt = doc.createEvent('HTMLEvents');
                    HTMLEvt['initEvent'](type, true, true, win, 1);
                    el.dispatchEvent(HTMLEvt);

                } else {

                    handlers = hAzzle.Events.getHandler(el, type, null, false);
                    evt = new Event(null, el);
                    evt.type = type;
                    call = args ? 'apply' : 'call';
                    args = args ? [evt].concat(args) : evt;
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

    // hAzzle.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
    // http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html

    function Event(evt, element) {

        if (!arguments.length) return;

        evt = evt || ((element.ownerDocument || element.document || element).parentWindow || win).evt;

        this.originalEvent = evt;

        if (!evt) return;

        var type = evt.type,
            target = evt.target,
            i, p, props, fixHook;

        this.target = target && hAzzle.nodeType(3, target) ? target.parentNode : target;

        fixHook = treated[type];

        if (!fixHook) {

            treated[type] = fixHook = rmouseEvent.test(type) ? hAzzle.eventHooks['mouse'] :
                rkeyEvent.test(type) ? hAzzle.eventHooks['keys'] :
                function () {
                    return commonProps;
            };
        }

        props = fixHook(evt, this, type);

        for (i = props.length; i--;) {
            if (!((p = props[i]) in this) && p in evt) this[p] = evt[p];
        }
    }


Event.prototype = {

        preventDefault: function () {

            var e = this.originalEvent;

            if (e && e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
        },
		
        stopPropagation: function () {

            var e = this.originalEvent;

            if (e && e.stopPropagation) {
                e.stopPropagation();
            } else {
                e.cancelBubble = true;
            }
        },
		
        stop: function () {
			var e = this;
            e.preventDefault();
            e.stopPropagation();
            e.stopped = true;
        },
		
        stopImmediatePropagation: function () {

            var e = this.originalEvent;

            this.isImmediatePropagationStopped = function () {
                return true;
            };

            if (e && e.stopImmediatePropagation) {
                e.stopImmediatePropagation();
            }
        },
        isImmediatePropagationStopped: function () {
            return this.originalEvent.isImmediatePropagationStopped && this.originalEvent.isImmediatePropagationStopped();
        },
        clone: function (currentTarget) {
            var ne = new Event(this, this.element);
            ne.currentTarget = currentTarget;
            return ne;
        }
    };

    hAzzle.Events = {

        // Add event listener

        add: function (el, events, selector, fn, one) {

            var originalFn, type, types, i, args, entry, first;

            // Dont' allow click on disabeled elements, or events on text and comment nodes

            if (threatment['disabeled'](el, events) || threatment['nodeType'](el)) return false;

            // Types can be a map of types/handlers
            // TODO!! This is not working on delegated events, have to fix this ASAP !!

            if (hAzzle.isUndefined(selector) && hAzzle.isObject(events))

                for (type in events) {

                if (events.hasOwnProperty(type)) {
                    hAzzle.Events.add.call(this, el, type, events[type]);
                }

            } else {

                // Delegated event

                if (!isFunction(selector)) {
                    originalFn = fn;
                    args = slice.call(arguments, 4);
                    fn = hAzzle.Events.delegate(selector, originalFn);

                } else {
                    args = slice.call(arguments, 3);
                    fn = originalFn = selector;
                }

                // One

                if (one === 1) {

                    // Make a unique handlet that get removed after first time it's triggered
                    fn = hAzzle.Events.once(hAzzle.Events.off, el, events, fn, originalFn);
                }

                // Handle multiple events separated by a space

                types = events.split(specialsplit);
                i = types.length;
                while (i--) {
                    first = hAzzle.Events.putHandler(entry = new hAzzle.Kernel(
                        el, types[i].replace(names, '') // event type
                        , fn, originalFn, types[i].replace(ns, '').split('.') // namespaces
                        , args, false
                    ));

                    // Add root listener only if we're the first

                    if (first) {

                        el.addEventListener(entry.eventType, hAzzle.Events.rootListener, false);

                    }
                }
                return el;
            }
        },

        // Remove event listener

        off: function (el, typeSpec, fn) {

            var isTypeStr = isString(typeSpec),
                type, namespaces, i;

            if (isTypeStr && hAzzle.indexOf(typeSpec, ' ') > 0) {

                typeSpec = typeSpec.split(typeSpec);

                for (i = typeSpec.length; i--;)
                    hAzzle.Events.off(el, typeSpec[i], fn);
                return el;
            }

            type = isTypeStr && typeSpec.replace(names, '');

            if (type && special[type]) type = special[type].fix;

            if (!typeSpec || isTypeStr) {

                // Namespace

                if (namespaces = isTypeStr && typeSpec.replace(ns, '')) namespaces = namespaces.split('.');

                // Remove the listener

                hAzzle.Events.removeListener(el, type, fn, namespaces);

            } else if (isFunction(typeSpec)) {

                hAzzle.Events.removeListener(el, null, typeSpec);

            } else {

                if (typeSpec) {

                    for (var k in typeSpec) {

                        if (typeSpec.hasOwnProperty(k)) hAzzle.Events.off(el, k, typeSpec[k]);
                    }
                }
            }

            return el;
        },

        /**
         * Set up a delegate helper using the given selector, wrap the handler function
         * We are using the "find" function to search through the 'elems stack' to find
         * the selector
         */

        delegate: function (selector, fn) {
            function findTarget(target, root) {
                var i, 
				    array = $(root).find(selector);

                for (; target && target !== root; target = target.parentNode) {

                    if (array !== null) {

                        // No need to run a expensive loop if the array length are 1						

                        if (array.length === 1) {

                            if (array[0] === target) return target;

                        } else {

                            for (i = array.length; i--;) {
                                if (array[i] === target) return target;
                            }
                        }
                    }
                }
            }

            function handler(e) {
                if (e.target.disabled !== true) {
                    var m = findTarget(e.target, this);
                    if (m) {
                        fn.apply(m, arguments);
                    }
                }
            }

            handler.__handlers = {
                ft: findTarget,
                selector: selector
            };
            return handler;
        },

        /**
         * Remove the event listener
         */

        removeListener: function (element, type, handler, ns) {

            type = type && type.replace(names, '');

            type = hAzzle.Events.getHandler(element, type, null, false);

            var removed = {};

            // No point to continue if no event attached on the element

            if (type) {

                var i = 0,
                    l = type.length;

                for (; i < l; i++) {
                    if ((!handler || type[i].original === handler) && type[i].inNamespaces(ns)) {
                        hAzzle.Events.delHandler(type[i]);
                        if (!removed[type[i].eventType])
                            removed[type[i].eventType] = {
                                t: type[i].eventType,
                                c: type[i].type
                            };
                    }
                }

                for (i in removed) {
                    if (!hAzzle.Events.hasHandler(element, removed[i].t, null, false)) {
                        element.removeEventListener(removed[i].t, hAzzle.Events.rootListener, false);
                    }
                }
            }
        },

        once: function (rm, element, type, handler, callback) {
            return function () {
                handler.apply(this, arguments);
                rm(element, type, callback);
            };
        },

        rootListener: function (evt, type) {
            var listeners = hAzzle.Events.getHandler(this, type || evt.type, null, false),
                l = listeners.length,
                i = 0;

            evt = new Event(evt, this, true);

            for (; i < l && !evt.isImmediatePropagationStopped(); i++) {

                if (!listeners[i].removed) listeners[i].handler.call(this, evt);
            }
        },

        wrappedHandler: function (element, fn, condition, args) {

            function call(evt, eargs) {

                return fn.apply(element, args ? slice.call(eargs).concat(args) : eargs);
            }

            function findTarget(evt, eventElement) {

                return fn.__handlers ? fn.__handlers.ft(evt.target, element) : eventElement;
            }

            var handler = condition ? function (evt) {

                var target = findTarget(evt, this); // delegated event

                if (condition.apply(target, arguments)) {
                    if (evt) evt.currentTarget = target;
                    return call(evt, arguments);
                }
            } : function (evt) {
                if (fn.__handlers) evt = evt.clone(findTarget(evt));
                return call(evt, arguments);
            };

            handler.__handlers = fn.__handlers;
            return handler;
        },

        findIt: function (element, type, original, handler, root, fn) {

            if (!type || type === '*') {

                for (var t in container) {

                    if (t.charAt(0) === root ? 'r' : '#') {
                        hAzzle.Events.findIt(element, t.substr(1), original, handler, root, fn);
                    }
                }

            } else {

                var i = 0,
                    l,
                    list = container[root ? 'r' : '#' + type];


                if (!list) {

                    return;
                }

                for (l = list.length; i < l; i++) {

                    if ((element === '*' || list[i].matches(element, original, handler)) && !fn(list[i], list, i, type)) return;
                }
            }
        },

        hasHandler: function (element, type, original, root) {

            if (root = container[(root ? "r" : "#") + type])
                for (type = root.length; type--;)
                    if (!root[type].root && root[type].matches(element, original, null)) return true;
            return false;
        },
        getHandler: function (element, type, original, root) {

            var entries = [];

            hAzzle.Events.findIt(element, type, original, null, root, function (entry) {
                entries.push(entry);
            });
            return entries;
        },
        putHandler: function (entry) {
            var has = !entry.root && !this.hasHandler(entry.element, entry.type, null, false),
                key = (entry.root ? 'r' : '#') + entry.type;
            (container[key] || (container[key] = [])).push(entry);
            return has;
        },
        // Find handlers for event delegation
        delHandler: function (entry) {
            hAzzle.Events.findIt(entry.element, entry.type, null, entry.handler, entry.root, function (entry, list, i) {
                list.splice(i, 1);
                entry.removed = true;
                if (list.length === 0) delete container[(entry.root ? 'r' : '#') + entry.type];
                return false;
            });
        }
    };

    // Shortcut methods for 'on'

    hAzzle.each("hover;blur; focus;focusin;focusout;load;resize;scroll;unload;click;dblclick;mousedown;mouseup;mousemove;mouseover;mouseout;mouseenter;mouseleave;change;select;submit;keydown;keypress;keyup;error;contextmenu".split(";"), function () {

        var name = this;

        // Handle event binding

        hAzzle.fn[name] = function (data, fn) {

            //events, fn, delfn, one

            if (arguments.length > 0) {

                this.on(name, data, fn);

            }
        };
    });


// Localestorage

;
(function ($) {

    var isObject = $.isObject,
        isString = $.isString,
        win = window,
        doc = document,

        // Common 5MB localStorage

        defaultSize = 5242880;

    // Inital check to see if localStorage is supported in the browser

    (function () {
        var supported = false;

        // Derived from Modernizer (http://github.com/Modernizr/Modernizr)

        try {
            localStorage.setItem('hAzzle', 'hAzzle');
            localStorage.removeItem('hAzzle');
            supported = true;
        } catch (e) {
            supported = false;
        }

        /**
         *  Implements localStorage if not supported
         *
         * NOTE !! We are going to remove this 'shim' in the future. Just now Opera Mini and IE Mobile 9 and older are not supporting this one.
         *
         * From https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Storage?redirectlocale=en-US&redirectslug=DOM%2FStorage
         */

        if (!supported) {
            win.localStorage = {
                getItem: function (sKey) {
                    if (!sKey || !this.hasOwnProperty(sKey)) {
                        return null;
                    }
                    return unescape(doc.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") +
                        "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
                },

                key: function (nKeyId) {
                    return unescape(doc.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
                },

                setItem: function (sKey, sValue) {
                    if (!sKey) {
                        return;
                    }
                    doc.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
                    this.length = doc.cookie.match(/\=/g).length;
                },

                length: 0,

                removeItem: function (sKey) {
                    if (!sKey || !this.hasOwnProperty(sKey)) {
                        return;
                    }
                    doc.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
                    this.length--;
                },

                // Really bad name, but not my idea :)

                hasOwnProperty: function (sKey) {
                    return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(doc.cookie);
                }
            };

            win.localStorage.length = (doc.cookie.match(/\=/g) || win.localStorage).length;
        }
    })();

    $.extend({

        /**
         * Convert bytes to human readable KB / MB / GB
         */

        bytesToSize: function (bytes) {
            var k = 1000,
                sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

            if (bytes === 0) {

                return '0 Bytes';
            }
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
            return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
        },

        /**
         * Removes all key / value pairs from localStorage
         */

        clearStorage: function () {
            localStorage.clear();
        },

        /**
         * Returns an array of keys currently stored in localStorage.
         */

        storageContains: function (key) {

            if (key && isString(key)) {
                return $.indexOf(this.getStorageKeys(), key) !== -1;
            }
        },

        /**
         * Returns an array of keys currently stored in localStorage.
         */

        getStorageKeys: function () {

            var result = [],
                i = 0;

            for (i = localStorage.length; i--;) {
                result.push(localStorage.key(i));
            }

            return result;
        },

        /**
         * Returns an approximation of how much space is left in localStorage
         */

        getRemainingStorageSpace: function () {
            return this.bytesToSize(defaultSize - this.getStorageSize(true));
        },

        /**
         * Returns the size of the total contents in localStorage.
         *
         */

        getStorageSize: function ( /*INTERNAL*/ pure) {

            if (pure) {

                return JSON.stringify(localStorage).length;

            } else { // Human readable

                return this.bytesToSize(JSON.stringify(localStorage).length);
            }
        },

        /**
         *  Returns true if localStorage has no key/value pairs
         */

        isStorageEmpty: function () {
            return this.getStorageKeys().length === 0;
        },

        /**
         * Removes the specified key/value pair
         */

        removeStorage: function (key) {

            if (!key) {

                return;
            }

            if (isString(key)) {

                localStorage.removeItem(key);

            } else if ($.isArray(key)) {

                var i = key.length;

                while (i--) {

                    if (isString(key[i])) {

                        localStorage.removeItem(key[i]);
                    }
                }
            }
        },

        /**
         * Returns the proper-type value of a specified key
         */
        getStorage: function (key, defaultValue) {

            if (key && isString(key)) {

                var value = localStorage.getItem(key).toLowerCase(), // retrieve value
                    number = parseFloat(value); // to allow for number checking

                if (value === null) {

                    // Returns default value if key is not set, otherwise returns null
                    return arguments.length === 2 ? defaultValue : null;
                }

                if (!$.IsNaN(number)) {

                    return number; // value was of type number
                }

                if (value === 'true' || value === 'false') {
                    return value === 'true'; //value was of type boolean
                }

                try {
                    value = JSON.parse(value + "");
                    return value;

                } catch (e) {

                    return value;
                }
            }

        },

        /**
         * Stores a given object in localStorage, allowing access to individual object properties
         **/

        setStorage: function (key, value) {

            if (arguments.length === 1) {

                this.store(key);

            } else if (key && isString(key)) {

                if (isObject(value)) {

                    value = JSON.stringify(value);
                }

                localStorage.setItem(key, value);
            }
        },

        /**
         * Saves a given object in localStorage, allowing access to individual object properties
         **/

        saveStorage: function (value) {
            var property;

            if (value && isObject(value) && !(value instanceof Array)) {
                for (property in value) {
                    localStorage.setItem(property, value[property]);
                }
            }
        },

        /**
         * Returns an object representation of the current state of localStorage
         *
         */

        StorageToObject: function () {

            var o = {},
                keys = this.getStorageKeys(),
                i = keys.length;

            while (i--) {
                o[keys[i]] = this.getStorage(keys[i]);
            }

            return o;
        }

    });

})(hAzzle);

/*!
 * HTML
 */

var concat = Array.prototype.concat,

    doc = document,
    cached = [],
    isFunction = hAzzle.isFunction,

    xhtmlRegEx = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
    tagNameRegEx = /<([\w:]+)/,
    htmlRegEx = /<|&#?\w+;/,
    // checked="checked" or checked
    checkedRegEx = /checked\s*(?:[^=]|=\s*.checked.)/i,
    rscriptType = /^$|\/(?:java|ecma)script/i,
    rscriptTypeMasked = /^true\/(.*)/,
    rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,
    singleRegEx = (/^<(\w+)\s*\/?>(?:<\/\1>|)$/);


(function () {
    var fragment = doc.createDocumentFragment(),
        div = fragment.appendChild(doc.createElement("div")),
        input = doc.createElement("input");

    input.setAttribute("type", "radio");
    input.setAttribute("checked", "checked");
    input.setAttribute("name", "t");

    div.appendChild(input);

    hAzzle.support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;

    div.innerHTML = "<textarea>x</textarea>";
    hAzzle.support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
})();

/**
 * Disable "script" tags
 **/

function disableScript(elem) {
    elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
    return elem;
}

/**
 * Restore "script" tags
 **/


function restoreScript(elem) {
    var m = rscriptTypeMasked.exec(elem.type);
    m ? elem.type = m[1] : elem.removeAttribute("type");
    return elem;
}


hAzzle.extend({

    parseHTML: function (data, context, keepScripts) {

        if (!data || typeof data !== "string") {
            return null;
        }
        if (typeof context === "boolean") {
            keepScripts = context;
            context = false;
        }

        // Prevent XSS attack

        context = context || (isFunction(doc.implementation.createHTMLDocument) ? doc.implementation.createHTMLDocument() : document);

        var parsed = singleRegEx.exec(data),
            scripts = !keepScripts && [];

        // Single tag

        if (parsed) {

            return [context.createElement(parsed[1])];
        }

        parsed = hAzzle.buildFragment([data], context, scripts);

        if (scripts && scripts.length) {

            hAzzle(scripts).remove();
        }

        return hAzzle.merge([], parsed.childNodes);

    },

    buildFragment: function (elems, context, scripts, selection) {

        var elem, tmp, tag, wrap, contains, j,
            fragment = context.createDocumentFragment(),
            nodes = [],
            i = 0,
            l = elems.length;

        while (l--) {

            elem = elems[l];

            if (elem || elem === 0) {

                // Add nodes directly
                if (typeof elem === "object") {
                    // Support: QtWebKit
                    // hAzzle.merge because push.apply(_, arraylike) throws
                    hAzzle.merge(nodes, elem.nodeType ? [elem] : elem);

                    // Convert non-html into a text node
                } else if (!htmlRegEx.test(elem)) {

                    nodes.push(context.createTextNode(elem));

                    // Convert html into DOM nodes
                } else {

                    tmp = tmp || fragment.appendChild(context.createElement("div"));

                    // Deserialize a standard representation
                    tag = (tagNameRegEx.exec(elem) || ["", ""])[1].toLowerCase();
                    wrap = wrapMap[tag] || wrapMap._default;
                    tmp.innerHTML = wrap[1] + elem.replace(xhtmlRegEx, "<$1></$2>") + wrap[2];

                    // Descend through wrappers to the right content
                    j = wrap[0];
                    while (j--) {
                        tmp = tmp.lastChild;
                    }

                    hAzzle.merge(nodes, tmp.childNodes);

                    // Remember the top-level container
                    tmp = fragment.firstChild;
                    tmp.textContent = "";
                }
            }
        }

        // Remove wrapper from fragment
        fragment.textContent = "";

        i = 0;

        while ((elem = nodes[i++])) {

            if (selection && hAzzle.inArray(elem, selection) !== -1) {
                continue;
            }

            contains = hAzzle.contains(elem.ownerDocument, elem);

            // Append to fragment
            tmp = getAll(fragment.appendChild(elem), "script");

            // Preserve script evaluation history
            if (contains) {
                setGlobalEval(tmp);
            }

            // Capture executables
            if (scripts) {
                j = 0;
                while ((elem = tmp[j++])) {
                    if (rscriptType.test(elem.type || "")) {
                        scripts.push(elem);
                    }
                }
            }
        }

        return fragment;
    }
});


hAzzle.extend(hAzzle.fn, {


    manipulateDOM: function (args, callback) {

        // Flatten any nested arrays

        args = concat.apply([], args);

        var fragment, first, scripts, hasScripts, node, doc,
            i = 0,
            l = this.length,
            set = this,
            iNoClone = l - 1,
            value = args[0],
            isFunction = hAzzle.isFunction(value);

        // We can't cloneNode fragments that contain checked, in WebKit
        if (isFunction ||
            (l > 1 && typeof value === "string" &&
                !hAzzle.support.checkClone && checkedRegEx.test(value))) {
            return this.each(function (index) {
                var self = set.eq(index);
                if (isFunction) {
                    args[0] = value.call(this, index, self.html());
                }
                self.manipulateDOM(args, callback);
            });
        }

        if (l) {

            fragment = hAzzle.buildFragment(args, this[0].ownerDocument, false, this);

            first = fragment.firstChild;

            if (fragment.childNodes.length === 1) {
                fragment = first;
            }


            if (first) {
                scripts = hAzzle.map(getAll(fragment, "script"), disableScript);
                hasScripts = scripts.length;

                for (; i < l; i++) {
                    node = fragment;

                    if (i !== iNoClone) {
                        node = hAzzle.clone(node, true, true);

                        // Keep references to cloned scripts for later restoration
                        if (hasScripts) {

                            hAzzle.merge(scripts, getAll(node, "script"));
                        }
                    }

                    callback.call(this[i], node, i);
                }

            }
        }

        return this;
    }
});

// Mark scripts as having already been evaluated

function setGlobalEval(elems, refElements) {
    var i = 0,
        l = elems.length;

    for (; i < l; i++) {
        hAzzle.data(
            elems[i], "globalEval", !refElements || hAzzle.data(refElements[i], "globalEval")
        );
    }
}

function getAll(context, tag) {
    var ret = context.getElementsByTagName ? context.getElementsByTagName(tag || "*") :
        context.querySelectorAll ? context.querySelectorAll(tag || "*") : [];

    return tag === undefined || tag && hAzzle.nodeName(context, tag) ?
        hAzzle.merge([context], ret) :
        ret;
}



// Colors
;
(function ($) {

    var props = "backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor borderColor boxShadowColor color textShadowColor columnRuleColor outlineColor textDecorationColor textEmphasisColor".split(' ');

    $.extend($, {

        /**
         * hAzzle color names
         *
         * NOTE!! Only the most used RGB colors are listed, if you need more, you have to
         * create a plug-in for it.
         *
         */

        colornames: {
            aliceblue: {
                r: 240,
                g: 248,
                b: 255
            },
            antiquewhite: {
                r: 250,
                g: 235,
                b: 215
            },
            aqua: {
                r: 0,
                g: 255,
                b: 255
            },
            aquamarine: {
                r: 127,
                g: 255,
                b: 212
            },
            azure: {
                r: 240,
                g: 255,
                b: 255
            },
            beige: {
                r: 245,
                g: 245,
                b: 220
            },
            bisque: {
                r: 255,
                g: 228,
                b: 196
            },
            black: {
                r: 0,
                g: 0,
                b: 0
            },
            blue: {
                r: 0,
                g: 0,
                b: 255
            },
            blueviolet: {
                r: 138,
                g: 43,
                b: 226
            },
            brown: {
                r: 165,
                g: 42,
                b: 42
            },
            burlywood: {
                r: 222,
                g: 184,
                b: 135
            },
            cadetblue: {
                r: 95,
                g: 158,
                b: 160
            },
            coral: {
                r: 255,
                g: 127,
                b: 80
            },
            crimson: {
                r: 220,
                g: 20,
                b: 60
            },
            cyan: {
                r: 0,
                g: 255,
                b: 255
            },
            darkblue: {
                r: 0,
                g: 0,
                b: 139
            },
            darkcyan: {
                r: 0,
                g: 139,
                b: 139
            },
            darkgray: {
                r: 169,
                g: 169,
                b: 169
            },
            darkgreen: {
                r: 0,
                g: 100,
                b: 0
            },
            darkgrey: {
                r: 169,
                g: 169,
                b: 169
            },
            darkmagenta: {
                r: 139,
                g: 0,
                b: 139
            },
            darkolivegreen: {
                r: 85,
                g: 107,
                b: 47
            },
            darkred: {
                r: 139,
                g: 0,
                b: 0
            },
            darksalmon: {
                r: 233,
                g: 150,
                b: 122
            },
            darkseagreen: {
                r: 143,
                g: 188,
                b: 143
            },
            darkviolet: {
                r: 148,
                g: 0,
                b: 211
            },

            gold: {
                r: 255,
                g: 215,
                b: 0
            },
            goldenrod: {
                r: 218,
                g: 165,
                b: 32
            },
            green: {
                r: 0,
                g: 128,
                b: 0
            },
            greenyellow: {
                r: 173,
                g: 255,
                b: 47
            },
            grey: {
                r: 128,
                g: 128,
                b: 128
            },
            indianred: {
                r: 205,
                g: 92,
                b: 92
            },
            indigo: {
                r: 75,
                g: 0,
                b: 130
            },
            ivory: {
                r: 255,
                g: 255,
                b: 240
            },
            lavender: {
                r: 230,
                g: 230,
                b: 250
            },
            lightblue: {
                r: 173,
                g: 216,
                b: 230
            },
            lightcoral: {
                r: 240,
                g: 128,
                b: 128
            },
            lightcyan: {
                r: 224,
                g: 255,
                b: 255
            },
            lightgray: {
                r: 211,
                g: 211,
                b: 211
            },
            lightgreen: {
                r: 144,
                g: 238,
                b: 144
            },
            lightgrey: {
                r: 211,
                g: 211,
                b: 211
            },
            lightpink: {
                r: 255,
                g: 182,
                b: 193
            },
            lightyellow: {
                r: 255,
                g: 255,
                b: 224
            },
            lime: {
                r: 0,
                g: 255,
                b: 0
            },
            limegreen: {
                r: 50,
                g: 205,
                b: 50
            },
            linen: {
                r: 250,
                g: 240,
                b: 230
            },
            magenta: {
                r: 255,
                g: 0,
                b: 255
            },
            maroon: {
                r: 128,
                g: 0,
                b: 0
            },
            midnightblue: {
                r: 25,
                g: 25,
                b: 112
            },
            moccasin: {
                r: 255,
                g: 228,
                b: 181
            },
            olive: {
                r: 128,
                g: 128,
                b: 0
            },
            olivedrab: {
                r: 107,
                g: 142,
                b: 35
            },
            orange: {
                r: 255,
                g: 165,
                b: 0
            },
            orangered: {
                r: 255,
                g: 69,
                b: 0
            },
            orchid: {
                r: 218,
                g: 112,
                b: 214
            },
            peru: {
                r: 205,
                g: 133,
                b: 63
            },
            pink: {
                r: 255,
                g: 192,
                b: 203
            },
            plum: {
                r: 221,
                g: 160,
                b: 221
            },
            purple: {
                r: 128,
                g: 0,
                b: 128
            },
            red: {
                r: 255,
                g: 0,
                b: 0
            },
            salmon: {
                r: 250,
                g: 128,
                b: 114
            },
            sandybrown: {
                r: 244,
                g: 164,
                b: 96
            },
            sienna: {
                r: 160,
                g: 82,
                b: 45
            },
            silver: {
                r: 192,
                g: 192,
                b: 192
            },
            skyblue: {
                r: 135,
                g: 206,
                b: 235
            },
            snow: {
                r: 255,
                g: 250,
                b: 250
            },
            tomato: {
                r: 255,
                g: 99,
                b: 71
            },
            turquoise: {
                r: 64,
                g: 224,
                b: 208
            },
            violet: {
                r: 238,
                g: 130,
                b: 238
            },
            wheat: {
                r: 245,
                g: 222,
                b: 179
            },
            white: {
                r: 255,
                g: 255,
                b: 255
            },
            whitesmoke: {
                r: 245,
                g: 245,
                b: 245
            },
            yellow: {
                r: 255,
                g: 255,
                b: 0
            },
            yellowgreen: {
                r: 154,
                g: 205,
                b: 50
            },
            transparent: {
                r: -1,
                g: -1,
                b: -1
            }

        },

        color: {
            normalize: function (input) {
                var color, alpha,
                    result, name, i, l,
                    rhex = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
                    rhexshort = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
                    rrgb = /rgb(?:a)?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(0*\.?\d+)\s*)?\)/,
                    rrgbpercent = /rgb(?:a)?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(0*\.?\d+)\s*)?\)/,
                    rhsl = /hsl(?:a)?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(0*\.?\d+)\s*)?\)/;

                // Handle color: #rrggbb
                if (result = rhex.exec(input)) {
                    color = {
                        r: parseInt(result[1], 16),
                        g: parseInt(result[2], 16),
                        b: parseInt(result[3], 16),
                        source: result[0]
                    };
                }
                // Handle color: #rgb
                else if (result = rhexshort.exec(input)) {
                    color = {
                        r: parseInt(result[1] + result[1], 16),
                        g: parseInt(result[2] + result[2], 16),
                        b: parseInt(result[3] + result[3], 16),
                        source: result[0]
                    };
                }
                // Handle color: rgb[a](r, g, b [, a])
                else if (result = rrgb.exec(input)) {
                    color = {
                        r: parseInt(result[1], 10),
                        g: parseInt(result[2], 10),
                        b: parseInt(result[3], 10),
                        alpha: parseFloat(result[4], 10),
                        source: result[0]
                    };
                }
                // Handle color: rgb[a](r%, g%, b% [, a])
                else if (result = rrgbpercent.exec(input)) {
                    color = {
                        r: parseInt(result[1] * 2.55, 10),
                        g: parseInt(result[2] * 2.55, 10),
                        b: parseInt(result[3] * 2.55, 10),
                        alpha: parseFloat(result[4], 10),
                        source: result[0]
                    };
                }
                // Handle color: hsl[a](h%, s%, l% [, a])
                else if (result = rhsl.exec(input)) {
                    color = $.color.hsl_to_rgb(
                        parseFloat(result[1], 10) / 100,
                        parseFloat(result[2], 10) / 100,
                        parseFloat(result[3], 10) / 100
                    );
                    color.alpha = parseFloat(result[4], 10);
                    color.source = result[0];
                }
                // Handle color: name
                else {
                    result = input.split(' ');

                    i = 0,
                    l = result.length;

                    for (; i < l; i++) {

                        name = result[i];

                        if ($.colornames[name]) {
                            break;
                        }
                    }

                    if (!$.colornames[name]) {
                        name = 'transparent';
                    }

                    color = $.colornames[name];
                    color.source = name;
                }

                if (!color.alpha && color.alpha !== 0) {
                    delete color.alpha;
                }

                return color;
            },

            hsl_to_rgb: function (h, s, l, a) {
                var r, g, b, m1, m2;

                if (s === 0) {
                    r = g = b = l;
                } else {
                    if (l <= 0.5) {
                        m2 = l * (s + 1);
                    } else {
                        m2 = (l + s) - (l * s);
                    }

                    m1 = (l * 2) - m2;
                    r = parseInt(255 * $.color.hue2rgb(m1, m2, h + (1 / 3)), 10);
                    g = parseInt(255 * $.color.hue2rgb(m1, m2, h), 10);
                    b = parseInt(255 * $.color.hue2rgb(m1, m2, h - (1 / 3)), 10);
                }

                return {
                    r: r,
                    g: g,
                    b: b,
                    alpha: a
                };
            },

            // hsla conversions adapted from:
            // https://code.google.com/p/maashaack/source/browse/packages/graphics/trunk/src/graphics/colors/HUE2RGB.as?r=5021			

            hue2rgb: function (p, q, h) {

                if (h < 0) {

                    h++;
                }

                if (h > 1) {

                    h--;
                }

                if ((h * 6) < 1) {
                    return p + ((q - p) * h * 6);
                } else if ((h * 2) < 1) {
                    return q;
                } else if ((h * 3) < 2) {
                    return p + ((q - p) * ((2 / 3) - h) * 6);
                } else {
                    return p;
                }
            }
        }
    });

    $.each(props, function (i, hook) {

        $.cssHooks[hook] = {
            set: function (elem, value) {

                value = $.color.normalize(value);

                if (!value.alpha) {
                    value.alpha = 1;
                }

                elem.style[hook] = 'rgba(' + value.r + ',' + value.g + ',' + value.b + ',' + value.alpha + ')';
            }
        };
    });

    $.cssHooks.borderColor = {
        expand: function (value) {
            var expanded = {};

            $.each(["Top", "Right", "Bottom", "Left"], function (i, part) {
                expanded["border" + part + "Color"] = value;
            });
            return expanded;
        }
    };

})(hAzzle);

// Parsing

;
(function ($) {

    $.extend($, {

        /**
         * Cross-browser JSON parsing
         *
         * @param {String} data
         */

        parseJSON: function (data) {
            return typeof data === "string" ? JSON.parse(data + "") : data;
        },

        parseXML: function (data) {
            var xml, tmp;
            if (!data || !$.isString(data)) {

                return null;
            }

            // Support: IE9
            try {
                tmp = new DOMParser();
                xml = tmp.parseFromString(data, "text/xml");
            } catch (e) {
                xml = undefined;
            }

            if (!xml || xml.getElementsByTagName("parsererror").length) {
                return new Error("Invalid XML: " + data);
            }
            return xml;
        }

    });

})(hAzzle);

// Show | Hide | Toggle


;
(function ($) {

    /**
     * Show | hide | toggle
     *
     * Need to be moved over to the animation engine when it's finished, and used there
     *
     */

    var elemdisplay = {},
        docbody = document.body,
        doc = document;

    function actualDisplay(name, doc) {

        var style,
            win = window,
            elem = doc.createElement(name);

        // Vanila solution is the best choise here

        docbody.appendChild(elem);

        display = win.getDefaultComputedStyle && (style = win.getDefaultComputedStyle(elem[0])) ? style.display : $.css(elem[0], "display");
        docbody.removeChild(elem);
        return display;
    }


    // Try to determine the default display value of an element
    function defaultDisplay(nodeName) {
        var display = elemdisplay[nodeName];

        if (!display) {
            display = actualDisplay(nodeName, doc);

            // If the simple way fails, read from inside an iframe
            if (display === "none" || !display) {

                // Use the already-created iframe if possible

                var iframe = iframe || doc.documentElement.appendChild("<iframe frameborder='0' width='0' height='0'/>");

                // Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
                doc = iframe[0].contentDocument;

                // Support: IE
                doc.write();
                doc.close();

                display = actualDisplay(nodeName, doc);

                doc.documentElement.removeChild(iframe);
            }

            // Store the correct default display
            elemdisplay[nodeName] = display;
        }

        return display;
    }

    /**
     * Check if an element is hidden
     *  @return {Boolean}
     */

    function isHidden(elem, el) {
        elem = el || elem;
        return elem.style.display === "none";
    }

    /**
     * Show an element
     *
     * @param {Object} elem
     * @return Object}
     *
     *
     * FIXME!! Need a lot of tests and fixes to work correctly everywhere
     *
     */

    function show(elem) {

        var style = elem.style;

        if (style.display === "none") {

            style.display = "";

        }

        if ((style.display === "" && $.curCSS(elem, "display") === "none") || !$.contains(elem.ownerDocument.documentElement, elem)) {
            $.data(elem, 'display', defaultDisplay(elem.nodeName));
        }
    }

    /**
     * Hide an element
     *
     * @param {Object} elem
     * @return Object}
     */

    function hide(elem) {
        if (!isHidden(elem)) {
            var display = $.css(elem, 'display');
            if (display !== 'none') {
                $.data(elem, 'display', display);
            }

            // Hide the element
            $.style(elem, 'display', 'none');
        }
    }


    $.extend($.fn, {

        /**
         * Show elements in collection
         *
         * @return {Object}
         */

        show: function () {
            return this.each(function () {
                show(this);
            });
        },

        /**

     * Hide elements in collection
     *
     * @return {Object}
     */

        hide: function () {
            return this.each(function () {
                hide(this);
            });
        },

        /**
         * Toggle show/hide.
         * @return {Object}
         */

        toggle: function (state) {

            var elem;

            if (typeof state === "boolean") {
                return state ? this.show() : this.hide();
            }

            return this.each(function () {
                elem = this;
                if (isHidden(elem)) {

                    show(elem);

                } else {

                    hide(elem);

                }
            });
        }

    });

})(hAzzle);



/*!
 * Wrap
 */
;
(function ($) {

    $.extend($.fn, {

        /**
         * Wrap html string with a `div` or wrap special tags with their containers.
         *
         * @param {String} html
         * @return {Object}
         */

        wrap: function (html) {

            return this.each(function (i) {
                $(this).wrapAll($.isFunction(html) ? html.call(this, i) : html);
            });
        },

        /**
         *  Wrap an HTML structure around the content of each element in the set of matched elements.
         *
         * @param {String} html
         * @return {Object}
         *
         */

        wrapAll: function (html) {

            if (this[0]) {
                $(this[0]).before(html = $(html));
                var children;
                // drill down to the inmost element
                while ((children = html.children()).length) html = children.first();
                $(html).append(this);
            }
            return this;
        },

        wrapInner: function (html) {
            if ($.isFunction(html)) {
                return this.each(function (i) {
                    $(this).wrapInner(html.call(this, i));
                });
            }

            return this.each(function () {
                var self = $(this),
                    contents = self.contents();

                if (contents.length) {
                    contents.wrapAll(html);

                } else {
                    self.append(html);
                }
            });

        },

        /**
         *  Wrap an HTML structure around the content of each element in the set of matched elements.
         *
         * @param {String} html
         * @return {Object}
         *
         */

        unwrap: function () {
            this.parent().each(function () {
                if (!$.nodeName(this, "body")) {
                    hAzzle(this).replaceWith(hAzzle(this).children());
                }
            });
            return this;
        }
    });

})(hAzzle);

// Ajax


;
(function ($) {

    // Ajax
    var win = window,
        doc = document,
        byTag = 'getElementsByTagName',
        xmlHttpRequest = 'XMLHttpRequest',
        crElm = 'createElement',
        own = 'hasOwnProperty',
        head = doc.head || doc[byTag]('head')[0],
        uniqid = 0,
        lastValue, // data stored by the most recent JSONP callback
        nav = navigator,
        isIE10 = $.indexOf(nav.userAgent, 'MSIE 10.0') !== -1,

        defaultHeaders = {
            contentType: "application/x-www-form-urlencoded; charset=UTF-8", // Force UTF-8
            requestedWith: xmlHttpRequest,
            accepts: {
                '*': "*/".concat("*"),
                'text': 'text/plain',
                'html': 'text/html',
                'xml': 'application/xml, text/xml',
                'json': 'application/json, text/javascript',
                'js': 'application/javascript, text/javascript'
            }
        };

    /**
     * Convert to query string
     *
     * @param {Object} obj
     *
     * @return {String}
     *
     * - Taken from jQuery and optimized it for speed
     *
     */

    function ctqs(o, trad) {

        var prefix, i,
            traditional = trad || false,
            s = [],
            enc = encodeURIComponent,
            add = function (key, value) {
                // If value is a function, invoke it and return its value
                value = ($.isFunction(value)) ? value() : (value === null ? '' : value);
                s[s.length] = enc(key) + '=' + enc(value);
            };
        // If an array was passed in, assume that it is an array of form elements.
        if ($.isArray(o))
            for (i = 0; o && i < o.length; i++) add(o[i].name, o[i].value);
        else {
            for (prefix in o) {
                buildParams(prefix, o[prefix], traditional, add, o);
            }
        }
        return s.join('&').replace(/%20/g, '+');
    }

    /**
     * Build params
     */

    function buildParams(prefix, obj, traditional, add, o) {
        var name, i, v, rbracket = /\[\]$/;

        if ($.isArray(obj)) {
            for (i = 0; obj && i < obj.length; i++) {
                v = obj[i];
                if (traditional || rbracket.test(prefix)) {
                    // Treat each array item as a scalar.
                    add(prefix, v);
                } else buildParams(prefix + '[' + ($.isObject(v) ? i : '') + ']', v, traditional, add);
            }
        } else if (obj && obj.toString() === '[object Object]') {
            // Serialize object item.
            for (name in obj) {
                if (o[own](prefix)) buildParams(prefix + '[' + name + ']', obj[name], traditional, add);
            }

        } else add(prefix, obj);
    }

    /**
     *  Url append
     *
     * @param {String} url
     * @param {String} query
     * @return {String}
     */

    function appendQuery(url, query) {
        return (url + '&' + query).replace(/[&?]+/, '?')
    }

    /**
     * General jsonP callback
     *
     * @param {String} url
     * @param {String} s
     *
     * @return {String}
     **/

    function generalCallback(data) {
        lastValue = data;
    }

    /**
     * jsonP
     *
     * @param {Object} o
     * @param {Function} fn
     * @param {String} url
     *
     * @return {Object}
     **/

    function handleJsonp(o, fn, url) {

        var reqId = uniqid++,
            cbkey = o.jsonp || 'callback'; // the 'callback' key

        o = o.jsonpCallback || 'hAzzel_' + $.now(); // the 'callback' value

        var cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)'),
            match = url.match(cbreg),
            script = doc[crElm]('script'),
            loaded = 0;

        if (match) {
            if (match[3] === '?') url = url.replace(cbreg, '$1=' + o); // wildcard callback func name
            else o = match[3]; // provided callback func name
        } else url = appendQuery(url, cbkey + '=' + o); // no callback details, add 'em


        win[o] = generalCallback;

        script.type = 'text/javascript';
        script.src = url;
        script.async = true;


        $.isDefined(script.onreadystatechange) && !isIE10 && (script.event = "onclick", script.htmlFor = script.id = "_hAzzel_" + reqId);

        script.onload = script.onreadystatechange = function () {

            if (script.readyState && script.readyState !== 'complete' && script.readyState !== 'loaded' || loaded) {
                return false;
            }
            script.onload = script.onreadystatechange = null;
            if (script.onclick) script.onclick();
            // Call the user callback with the last value stored and clean up values and scripts.
            fn(lastValue);
            lastValue = undefined;
            head.removeChild(script);
            loaded = 1;
        };

        // Add the script to the DOM head
        head.appendChild(script);

        // Enable JSONP timeout
        return {
            abort: function () {
                script.onload = script.onreadystatechange = null;
                lastValue = undefined;
                head.removeChild(script);
                loaded = 1;
            }
        };
    }

    // Extend the hAzzle object

    $.extend({

        ajaxSettings: {

            // Default type of request
            type: 'GET',
            // Callback that is executed before request
            beforeSend: $.noop(),
            // Callback that is executed if the request succeeds
            success: $.noop(),
            // Callback that is executed the the server drops error
            error: $.noop(),
            // Callback that is executed on request complete (both: error and success)
            complete: $.noop(),
            // Default timeout
            timeout: 0,
            // async
            async: true,

            contentType: "application/x-www-form-urlencoded; charset=UTF-8"

        },

        /**
         * Ajax method to create ajax request with XMLHTTPRequest
         *
         * @param {Object|Function} opt
         * @param {function|callback} fn
         * @return {Object}
         */

        ajax: function (opt, fn) {

            var key, h, err;

            opt = $.extend({}, opt || {});

            for (key in $.ajaxSettings) {

                if (opt[key] === undefined) {

                    opt[key] = $.ajaxSettings[key];

                }

            }
            fn = fn || function () {};

            var xhr,
                xDomainRequest = 'XDomainRequest',
                error = 'error',
                headers = opt.headers || {},
                type = (opt.type || 'GET').toLowerCase(),
                url = $.isString(opt) ? opt : opt.url; // URL or options with URL inside. 

            var dataType = (opt.dataType) ? opt.dataType.toLowerCase() : '',
                abortTimeout = null,
                processData = opt.processData || true, // Set to true as default
                data = (processData !== false && opt.data && !$.isString(opt.data)) ? ctqs(opt.data) : (opt.data || null),
                sendWait = false;

            // If no url, stop here and return.

            if (!url) return false;

            // If jsonp or GET, append the query string to end of URL

            if ((dataType === 'jsonp' || type.toLowerCase() === 'get') && data) url = appendQuery(url, data), data = null;

            // If jsonp, we stop it here 

            if (dataType === 'jsonp' && /(=)\?(?=&|$)|\?\?/.test(url)) return handleJsonp(opt, fn, url);

            if (opt.crossOrigin === true) {
                var _xhr = win.XMLHttpRequest ? new XMLHttpRequest() : null;
                if (_xhr && 'withCredentials' in _xhr) xhr = _xhr;
                else if (win.xDomainRequest) xhr = new xDomainRequest();
                else throw "Browser does not support cross-origin requests";
            } else {
                xhr = new XMLHttpRequest()
            }

            xhr.open(type, url, opt.async === false ? false : true);

            // Set headers

            headers.Accept = headers.Accept || defaultHeaders.accepts[type] || defaultHeaders.accepts['*'];

            if (!opt.crossOrigin && !headers.requestedWith) headers.requestedWith = defaultHeaders.requestedWith;

            if (opt.contentType || opt.data && dataType.toLowerCase() !== 'get') xhr.setRequestHeader('Content-Type', (opt.contentType || 'application/x-www-form-urlencoded'));

            // Set headers

            for (h in headers) {

                headers.hasOwnProperty(h) && 'setRequestHeader' in xhr && xhr.setRequestHeader(h, headers[h]);

            }
            // Set credentials

            if ($.isDefined(opt.withCredentials) && $.isDefined(xhr.withCredentials)) {
                xhr.withCredentials = !!opt.withCredentials;
            }

            if (opt.timeout > 0) {
                abortTimeout = setTimeout(function () {
                    xhr.abort(); // Or should we use self.abort() ??
                }, opt.timeout);
            }

            if (win[xDomainRequest] && xhr instanceof win.xDomainRequest) {

                xhr.onload = fn;
                xhr.onerror = err;
                xhr.onprogress = function () {};
                sendWait = true;

            } else {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {

                        // Determine if successful

                        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                            var res;
                            if (xhr) {

                                // json

                                if ((dataType === 'json' || false) && (res = JSON.parse(xhr.responseText)) === null) res = xhr.responseText;

                                // xml

                                if (dataType === 'xml') {

                                    res = xhr.responseXML && xhr.responseXML.parseError && xhr.responseXML.parseError.errorCode && xhr.responseXML.parseError.reason ? null : xhr.responseXML;

                                } else {

                                    res = res || xhr.responseText;
                                }
                            }
                            if (!res && data) res = data;
                            if (opt.success) opt.success(res);
                        } else if (opt.error !== undefined) {

                            if (abortTimeout !== null) clearTimeout(abortTimeout);
                            opt.error(error, opt, xhr);
                        }
                    }
                };
            }

            // Before open

            if (opt.before) opt.before(xhr);

            if (sendWait) {
                setTimeout(function () {

                    xhr.send(data);
                }, 200);
            } else xhr.send(data);

            return xhr;
        }
    });

    $.each(["get", "post"], function (i, method) {

        $[method] = function (url, data, callback, type) {
            // shift arguments if data argument was omitted
            if ($.isFunction(data)) {
                type = type || callback;
                callback = data;
                data = undefined;
            }

            return $.ajax({
                url: url,
                type: method,
                dataType: type,
                data: data,
                success: callback
            });
        };
    });

})(hAzzle);


// Clone


;(function ($) {

    var rcheckableType = (/^(?:checkbox|radio)$/i);

    function fixInput(src, dest) {
        var nodeName = dest.nodeName.toLowerCase();
        if ("input" === nodeName && rcheckableType.test(src.type)) dest.checked = src.checked;
        else if ("input" === nodeName || "textarea" === nodeName) dest.defaultValue = src.defaultValue;
    };

    $.extend({

        clone: function (elem, deep) {

            var handlers = $.Events.getHandler(elem, '', null, false),
                l = handlers.length,
                i = 0,
                args, hDlr;

            // Get the data before we clone

            storage = $(elem).data();

            // Clone the elem

            clone = elem.cloneNode(deep || true);

            // Copy the events from the original to the clone

            for (; i < l; i++) {
                if (handlers[i].original) {
                    args = [clone, handlers[i].type];
                    if (hDlr = handlers[i].handler.__handler) args.push(hDlr.selector);
                    args.push(handlers[i].original);
                    $.Events.add.apply(null, args);
                }
            }

            // Copy data from the original to the clone

            if (storage) {
                $.each(storage, function (key, value) {
                    $.data(clone, key, value);
                });
            }
            // Preserve the rest 

            if (!$.support.noCloneChecked && ($.nodeType(1, elem) || $.nodeType(11, elem)) && !$.isXML(elem)) {

                destElements = $.getChildren(clone);
                srcElements = $.getChildren(elem);

                for (i = 0, l = srcElements.length; i < l; i++) {
                    fixInput(srcElements[i], destElements[i]);
                }
            }

            // Preserve script evaluation history

            destElements = getAll(clone, "script");

            if (destElements.length > 0) {

                $.Evaluated(destElements, !$.contains(elem.ownerDocument, elem) && $.getChildren(elem, "script"));
            }

            // Return the cloned set

            return clone;
        }
    });

    $.extend($.fn, {
        clone: function (deep) {
            return this.map(function (elem) {
                return $.clone(elem, deep);
            });
        }
    });


})(hAzzle);