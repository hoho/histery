/*!
 * Histery.js v0.0.1+, https://github.com/hoho/histery
 * (c) 2013 Marat Abdullin, MIT license
 */
(function(window, location, undefined) {
    var $H,
        history = window.history || {},
        routes = {},
        pendingGo,
        pendingStop = [],
        pendingComplete = [],
        key,
        val,
        i,
        args,
        tmp,
        initialized,
        nopush,
        pageId = 0,
        waitCount,
        currentCallbacks,
        processed,
        noMatchCallbacks = [],

        isExpr = function(hrefObj) {
            return hrefObj instanceof RegExp;
        },

        getRouteKey = function(hrefObj) {
            return hrefObj && (
                $.isPlainObject(hrefObj) ?
                    'm' + hrefObj.pathname + '|' + hrefObj.search + '|' + hrefObj.hash :
                    ((isExpr(hrefObj) ? 'e' : 's') + hrefObj)
            );
        },

        stop = function(error) {
            waitCount = 0;
            currentCallbacks = {};
            while ((tmp = pendingStop.shift())) {
                tmp(error);
            }

            while ((tmp = pendingComplete.shift())) {
                tmp();
            }

            return $H;
        },

        getFullURI = function(href/**/, l) {
            l = location;
            if (href) {
                l = document.createElement('a');
                l.href = href;
            }
            l = l.pathname + l.search + ((l.hash.length > 1) ? l.hash : '');
            return l[0] === '/' ? l : ('/' + l);
        },

        matchURIPart = function(part, matcher/**/, m, tmp, ret) {
            if (isExpr(matcher)) {
                m = 0;
                tmp = part.replace(matcher, function() {
                    m++;
                    ret = Array.prototype.slice.call((ret = arguments), 1, ret.length - 2);
                    return '';
                });
            } else if (part === matcher) {
                m = 1;
                ret = [];
            }

            if (m === 1 && !tmp) {
                return ret;
            }
        },

        matchURI = function(isObject, href, hrefObj/**/, pathname, search, hash) {
            href.replace(/^([^?#]+)(?:\?([^#]*))?(?:#(.*))?$/, function(_, p, s, h) {
                pathname = p;
                search = s;
                hash = h;
            });

            if (pathname) {
                if (isObject) {
                    pathname = matchURIPart(pathname, hrefObj.pathname);
                    search = hrefObj.search && search ? matchURIPart(search, hrefObj.search) : [];
                    hash = hrefObj.hash && hash ? matchURIPart(hash, hrefObj.hash) : [];
                } else {
                    pathname = matchURIPart(pathname, hrefObj);
                    search = hash = [];
                }

                if (pathname && search && hash) {
                    return [href].concat(pathname, search, hash);
                }
            }
        },

        removeArrayItem = function(arr, item/**/, i) {
            i = 0;
            while (i < arr.length) {
                if (arr[i] === item) {
                    arr.splice(i, 1);
                } else {
                    i++;
                }
            }
        },

        callSuccessCallbacks = function() {
            var callbacks,
                j;

            for (key in currentCallbacks) {
                val = currentCallbacks[key];
                callbacks = val.c;
                args = val.a;
                args.unshift(undefined);

                for (j = 0; j < callbacks.length; j++) {
                    if ((tmp = callbacks[j].success)) {
                        args[0] = val.d[j];
                        tmp.apply(callbacks[j], args);
                    }
                }
            }

            pendingStop = [];

            while ((tmp = pendingComplete.shift())) {
                tmp();
            }
        };

    window.$H = $H = {
        run: function() {
            $(window)
                .on('popstate hashchange',
                    function() {
                        if (!processed) {
                            processed = nopush = true;
                            $H.go();
                            window.setTimeout(function() {
                                processed = undefined;
                            }, 0);
                        }
                    })
                .trigger('popstate');

            return $H;
        },

        stop: stop,

        go: function(href) {
            stop();

            href = getFullURI(href);

            pendingGo = [];

            for (key in routes) {
                val = routes[key];

                if ((args = matchURI(key[0] === 'm', href, val.h))) {
                    (function(meta, curPageId) {
                        var j,
                            callbacks = meta.c,
                            callback,
                            args = meta.a,
                            getSuccessCallback = function(callbackIndex) {
                                return function(data, error) {
                                    if (waitCount > 0 && meta === currentCallbacks[curPageId]) {
                                        if (error) {
                                            waitCount = 0;
                                            pendingGo = [];
                                            stop(error);
                                        } else {
                                            meta.d[callbackIndex] = data;
                                            if (--waitCount === 0) {
                                                callSuccessCallbacks();
                                            }
                                        }
                                    }
                                }
                            };

                        if ($.isFunction(callbacks)) {
                            callbacks = callbacks();
                        }

                        pendingStop.push(function(error) {
                            args.unshift(error);
                            for (j = 0; j < callbacks.length; j++) {
                                if ((callback = callbacks[j].stop)) {
                                    callback.apply(callbacks[j], args);
                                }
                            }
                        });

                        pendingComplete.push(function() {
                            args.shift();
                            for (j = 0; j < callbacks.length; j++) {
                                if ((callback = callbacks[j].complete)) {
                                    callback.apply(callbacks[j], args);
                                }
                            }
                        });

                        for (j = 0; j < callbacks.length; j++) {
                            if ((callback = callbacks[j].go)) {
                                waitCount++;
                                pendingGo.push([callback, args, getSuccessCallback(j), callbacks[j]]);
                            }
                        }
                    })((currentCallbacks[++pageId] = {c: val.c, d: [], a: args}), pageId);
                }
            }

            if (!pendingStop.length) {
                for (i = 0; i < noMatchCallbacks.length; i++) {
                    noMatchCallbacks[i](href);
                }
                return $H;
            }

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

            if (waitCount) {
                while ((tmp = pendingGo.shift())) {
                    (function(callback, args, success, context) {
                        tmp = callback.apply(context, args);
                        if (tmp && tmp.promise) {
                            tmp.then(
                                function(data) { success(data); },
                                function() { success(undefined, true); }
                            );
                        } else if (tmp) {
                            success(tmp);
                        } else {
                            success(undefined, true);
                        }
                    }).apply(window, tmp);
                }
            } else {
                callSuccessCallbacks();
            }

            return $H;
        },

        on: function(hrefObj, callbacks) {
            // callbacks should look like:
            //     {go: function(href, ...) {},
            //      success: function(data, href, ...) {},
            //      stop: function(error, href, ...),
            //      complete: function(href) {}}
            if ((val = routes[(key = getRouteKey(hrefObj))])) {
                val.c.push(callbacks);
            } else if (key) {
                routes[key] = {h: hrefObj, c: [callbacks]};
            }

            return $H;
        },

        off: function(hrefObj, callbacks) {
            if (!hrefObj) {
                routes = {};
            }

            if ((val = routes[(key = getRouteKey(hrefObj))])) {
                if (callbacks) {
                    val = val.c;

                    removeArrayItem(val, callbacks);

                    if (val.length) {
                        return $H;
                    }
                }

                delete routes[key];
            }

            return $H;
        },

        noMatch: function(callback, remove) {
            if (remove) {
                removeArrayItem(noMatchCallbacks, callback);
            } else {
                noMatchCallbacks.push(callback);
            }
            return $H;
        }
    };
})(window, location);
