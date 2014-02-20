/*!
 * Histery.js v0.6.0, https://github.com/hoho/histery
 * (c) 2013 Marat Abdullin, MIT license
 */
(function(window, location, document, undefined) {
    var $H,
        history = window.history || {},
        routes = [],
        dones = [],
        noMatchCount = 0,
        pendingLeave = [],
        route,
        initialized,
        nopush,
        processed,
        processedTimer,

        objConstructor = {}.constructor,

        isFunction = function(val) {
            return typeof val === 'function';
        },

        isPlainObject = function(val) {
            // XXX: This version of isPlainObject doesn't work for objects from
            //      other windows and iframes.
            return val && (val.constructor === objConstructor);
        },

        getFullURI = function(href/**/, l) {
            l = location;
            if (href) {
                l = document.createElement('a');
                l.href = href;
            }
            l = l.pathname + l.search + ((l.hash.length > 1) ? l.hash : '');
            // IE doesn't supply <a> tag pathname with leading slash.
            return l[0] === '/' ? l : ('/' + l);
        },

        matchURIPart = function(part, matcher/**/, m, tmp, ret) {
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

                if (ret && !(ret instanceof Array)) {
                    ret = [ret];
                }
            } else if (part === matcher) {
                m = 1;
                ret = [];
            }

            if (m === 1 && !tmp) {
                return ret;
            }
        },

        matchURI = function(href, hrefObj/**/, pathname, search, hash) {
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
        },

        pushFilteredCallbacks = function(hasMatch, arr, ret/**/, i, tmp) {
            for (i = 0; i < arr.length; i++) {
                tmp = arr[i];

                if (tmp[0] === hasMatch) {
                    ret.push(tmp[1]);
                }
            }
        },

        callCallbacks = function(arr/**/, callback) {
            while ((callback = arr.shift())) {
                callback();
            }
        },

        equal = function(a, b) {
            if (isPlainObject(a) && isPlainObject(b)) {
                var ak = [],
                    bk = [],
                    k;

                for (k in a) {
                    if (!(k in b)) { return false; }
                    ak.push(k);
                }

                for (k in b) {
                    if (!(k in a)) { return false; }
                    bk.push(k);
                }

                if (ak.length === bk.length) {
                    for (k = 0; k < ak.length; k++) {
                        if (!equal(a[ak[k]], b[ak[k]])) {
                            return false;
                        }
                    }
                } else {
                    return false;
                }

                return true;
            } else {
                return a === b;
            }
        },

        compareArgs = function(args1, args2/**/, i, ret) {
            args1 = args1 || [];
            args2 = args2 || [];

            if (args1.length !== args2.length) {
                ret = false;
            } else {
                ret = true;
                for (i = 2; i < args1.length; i++) {
                    if (!equal(args1[i], args2[i])) {
                        ret = false;
                        break;
                    }
                }
            }
            return ret;
        };

    window.$H = $H = {
        run: function() {
            var event = document.createEvent('HTMLEvents'),

                handler = function() {
                    // TODO: Think more about how to skip redundant
                    //       handlers.
                    if (!processed || processed !== location.href) {
                        if (processedTimer) {
                            window.clearTimeout(processedTimer);
                        }
                        processed = location.href;
                        nopush = true;
                        $H.go();
                        processedTimer = window.setTimeout(function() {
                            processedTimer = undefined;
                            processed = undefined;
                        }, 500);
                    }
                };

            window.addEventListener('popstate', handler);
            window.addEventListener('hashchange', handler);

            event.initEvent('popstate', true, false);
            window.dispatchEvent(event);

            return $H;
        },

        go: function(href) {
            var i,
                r,
                args,
                pendingGo = [],
                hasMatch = false,
                newMatches = {},
                tmpGo = [],
                tmpLeave = [];

            href = getFullURI(href);

            for (r = 0; r < routes.length; r++) {
                route = routes[r];

                if (!route.h || ((args = matchURI(href, route.h)))) {
                    if (route.h) {
                        newMatches[r] = hasMatch = true;
                    } else {
                        args = [href];
                    }

                    (function(args, callbacks) {
                        args.unshift(undefined);
                        args[0] = compareArgs(route.cur, args);
                        route.cur = args;

                        var curVal = route,
                            isMatch = !!route.h;

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
                            // First argument of leave callback is
                            // `sameMatch`. It is true when the same
                            // route matched new href and href we're
                            // leaving).
                            tmpLeave.push([
                                isMatch,
                                function() {
                                    args[0] = compareArgs(curVal.cur, args);
                                    callbacks.leave.apply(callbacks, args);
                                }
                            ]);
                        }
                    })(args, route.c);
                }
            }

            pushFilteredCallbacks(hasMatch, tmpGo, pendingGo);

            for (i = 0; i < routes.length; i++) {
                route = routes[i];
                route.cur = (hasMatch && newMatches[i]) || (!hasMatch && !route.h) ? route.cur : null;
            }

            callCallbacks(pendingLeave);

            pushFilteredCallbacks(hasMatch, tmpLeave, pendingLeave);

            if (initialized) {
                if (history.pushState) {
                    if (!nopush) {
                        history.pushState(null, null, href);
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

            return $H;
        },

        on: function(hrefObj, callbacks) {
            // callbacks should look like:
            //     {go: function(href, ...) {},
            //      leave: function(href) {}}
            // hrefObj could be undefined, null, or {pathname, search, hash}.

            if (hrefObj === undefined) {
                dones.push(callbacks);
            } else {
                routes.push({h: hrefObj, c: callbacks, cur: null});

                if (!hrefObj) {
                    noMatchCount++;
                }
            }

            return $H;
        },

        off: function(hrefObj, callbacks) {
            var i,
                r;

            if (hrefObj === undefined) {
                i = dones.length - 1;
                while (i >= 0) {
                    if (dones[i] === callbacks) {
                        dones.splice(i, 1);
                    }

                    i--;
                }
            } else {
                if (!hrefObj && !callbacks) {
                    routes = [];
                }

                i = routes.length - 1;

                while (i >= 0) {
                    r = routes[i];

                    if (r.h === hrefObj && (!callbacks || r.c === callbacks)) {
                        routes.splice(i, 1);

                        if (!r.h) {
                            noMatchCount--;
                        }
                    }

                    i--;
                }
            }

            return $H;
        }
    };
})(window, location, document);
