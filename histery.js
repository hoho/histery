/*!
 * Histery.js v0.8.0, https://github.com/hoho/histery
 * (c) 2013-2017 Marat Abdullin, MIT license
 */
(function(factory, e, undef) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        e = factory(require, exports);
        if (e !== undef) { module.exports = e; }
    } else if (typeof define === 'function' && define.amd) {
        define('histery', ['require', 'exports'], factory);
    } else {
        factory(undef, ((e = {})));
        this.$H = e.$H;
    }
})(function(require, exports) {
    'use strict';

    var $H,
        undef = void 0,
        history = window.history || {},
        routes = [],
        rewrites = {},
        dones = [],
        pendingLeave = [],
        route,
        initialized,
        nopush,
        curState,
        curHref,
        objConstructor = {}.constructor;

    exports.$H = $H = {
        state: function(key, value) {
            if (value === undef) {
                return curState[key];
            }

            if (value === null) {
                delete curState[key];
            } else {
                curState[key] = value;
            }

            if (history.replaceState) {
                history.replaceState(curState, null);
            }
        },

        run: function() {
            var event = document.createEvent('HTMLEvents'),
                handler = function(e) {
                    if (e.type === 'popstate' || curHref !== location.href) {
                        nopush = true;
                        curState = history.state || {};
                        $H.go();
                    }

                    curHref = e.type === 'popstate' ? location.href : undef;
                };

            addEventListener('popstate', handler);
            addEventListener('hashchange', handler);

            event.initEvent('popstate', true, true);
            dispatchEvent(event);

            return $H;
        },

        go: function(href, dry, replace) {
            var i,
                r,
                args,
                pendingGo = [],
                hasMatch = false,
                newMatches = {},
                tmpGo = [],
                tmpLeave = [],
                ret;

            href = getFullURI(href);

            for (r = 0; r < routes.length; r++) {
                route = routes[r];

                if (!((i = route.h)) || ((args = matchURI(rewrites[href] || href, i)))) {
                    if (i) {
                        newMatches[r] = hasMatch = true;
                    } else {
                        args = [href];
                    }

                    filterCallbacks(route, args, route.c);
                }
            }

            pushFilteredCallbacks(hasMatch, tmpGo, pendingGo);

            ret = pendingGo.length > 0;

            if (!dry) {
                for (i = 0; i < routes.length; i++) {
                    route = routes[i];
                    route.cur = (hasMatch && newMatches[i]) || (!hasMatch && !route.h) ? route.cur : null;
                }

                callCallbacks(pendingLeave);

                pushFilteredCallbacks(hasMatch, tmpLeave, pendingLeave);

                if (initialized) {
                    if (history.pushState && pendingGo.length) {
                        if (!nopush) {
                            history[replace ? 'replaceState' : 'pushState']((curState = {}), null, href);
                        }
                    } else {
                        location.href = href;
                    }
                }

                initialized = true;
                nopush = false;

                callCallbacks(pendingGo);

                for (i = 0; i < dones.length; i++) {
                    dones[i](href);
                }
            }

            return ret;

            function filterCallbacks(route, args, callbacks) {
                args.unshift(undef);
                args[0] = compareArgs(route.cur, args);
                if (!dry) { route.cur = args; }

                var isMatch = !!i;

                if (isFunction(callbacks)) {
                    callbacks = callbacks();
                }

                if (callbacks.go) {
                    tmpGo.push([
                        isMatch,
                        function() {
                            callbacks.go.apply(callbacks, args);
                        }
                    ]);
                }

                if (callbacks.leave) {
                    // First argument of the leave callback is
                    // `sameMatch`. It is true when the same
                    // route matched the new href and the href
                    // we're leaving).
                    tmpLeave.push([
                        isMatch,
                        function() {
                            args[0] = compareArgs(route.cur, args);
                            callbacks.leave.apply(callbacks, args);
                        }
                    ]);
                }
            }
        },

        on: function(hrefObj, callbacks) {
            // callbacks should look like:
            //     {go: function(href, ...) {},
            //      leave: function(href) {}}
            // hrefObj could be undefined, null, or {pathname, search, hash}.

            if (hrefObj === undef) {
                dones.push(callbacks);
            } else {
                if (isString(hrefObj) && isString(callbacks)) {
                    // It's a rewrite.
                    rewrites[getFullURI(hrefObj)] = getFullURI(callbacks);
                } else {
                    routes.push({h: hrefObj, c: callbacks, cur: null});
                }
            }

            return $H;
        },

        off: function(hrefObj, callbacks) {
            var i,
                r;

            if (isString(hrefObj) && isString(callbacks) && rewrites[(i = getFullURI(hrefObj))] === getFullURI(callbacks)) {
                delete rewrites[i];
            } else if (hrefObj === undef) {
                for (i = dones.length; i--;) {
                    if (dones[i] === callbacks) {
                        dones.splice(i, 1);
                    }
                }
            } else {
                if (!hrefObj && !callbacks) {
                    routes = [];
                }

                for (i = routes.length; i--;) {
                    r = routes[i];

                    if (r.h === hrefObj && (!callbacks || r.c === callbacks)) {
                        routes.splice(i, 1);
                    }
                }
            }

            return $H;
        },

        eq: function eq(a, b) {
            var ak,
                bk,
                k;

            if (isPlainObject(a) && isPlainObject(b)) {
                ak = [];
                bk = [];

                for (k in a) {
                    if (!(k in b)) {
                        return false;
                    }
                    ak.push(k);
                }

                for (k in b) {
                    if (!(k in a)) {
                        return false;
                    }
                    bk.push(k);
                }

                if (ak.length === bk.length) {
                    for (k = 0; k < ak.length; k++) {
                        if (!eq(a[ak[k]], b[ak[k]])) {
                            return false;
                        }
                    }
                } else {
                    return false;
                }

                return true;
            } else if ((a instanceof Array) && (b instanceof Array) && (a.length === b.length)) {
                for (k = a.length; k--;) {
                    if (!eq(a[k], b[k])) {
                        return false;
                    }
                }

                return true;
            } else {
                return a === b;
            }
        }
    };


    function isFunction(val) {
        return typeof val === 'function';
    }

    function isString(val) {
        return typeof val === 'string';
    }

    function isPlainObject(val) {
        // XXX: This version of isPlainObject doesn't work for objects from
        //      other windows and iframes.
        return val && (val.constructor === objConstructor);
    }

    function getFullURI(href/**/, l) {
        l = location;
        if (href) {
            l = document.createElement('a');
            l.href = href;
        }
        l = l.pathname + l.search + ((l.hash.length > 1) ? l.hash : '');
        // IE doesn't supply <a> tag pathname with leading slash.
        return l[0] === '/' ? l : ('/' + l);
    }

    function matchURIPart(part, matcher/**/, m, tmp, ret) {
        if (matcher instanceof RegExp) {
            m = 0;
            tmp = part.replace(matcher, function() {
                m++;
                ret = Array.prototype.slice.call((ret = arguments), 1, ret.length - 2);
                return '';
            });
        } else if (isFunction(matcher)) {
            m = 1;
            ret = matcher(part);
        } else if (part === matcher) {
            m = 1;
            ret = [];
        }

        if (m === 1 && !tmp) {
            return ret;
        }
    }

    function matchURI(href, hrefObj/**/, pathname, search, hash) {
        href.replace(/^([^?#]+)(?:\?([^#]*))?(?:#(.*))?$/, function(_, p, s, h) {
            pathname = p || '';
            search = s || '';
            hash = h || '';
        });

        if (pathname) {
            if (isPlainObject(hrefObj)) {
                pathname = hrefObj.pathname ? matchURIPart(pathname, hrefObj.pathname) : [];
                search = hrefObj.search ? matchURIPart(search, hrefObj.search) : [];
                hash = hrefObj.hash ? matchURIPart(hash, hrefObj.hash) : [];
            } else {
                pathname = matchURIPart(pathname, hrefObj);
                search = hash = [];
            }

            if (pathname && search && hash) {
                return [href].concat(pathname, search, hash);
            }
        }
    }

    function pushFilteredCallbacks(hasMatch, arr, ret/**/, i, tmp) {
        for (i = 0; i < arr.length; i++) {
            tmp = arr[i];

            if (tmp[0] === hasMatch) {
                ret.push(tmp[1]);
            }
        }
    }

    function callCallbacks(arr/**/, callback) {
        while ((callback = arr.shift())) {
            callback();
        }
    }

    function compareArgs(args1, args2/**/, i, ret) {
        args1 = args1 || [];
        args2 = args2 || [];

        if (args1.length !== args2.length) {
            ret = false;
        } else {
            ret = true;
            for (i = 2; i < args1.length; i++) {
                if (!$H.eq(args1[i], args2[i])) {
                    ret = false;
                    break;
                }
            }
        }
        return ret;
    }
});
