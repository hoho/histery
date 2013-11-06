/*!
 * Histery.js v0.1.0, https://github.com/hoho/histery
 * (c) 2013 Marat Abdullin, MIT license
 */
(function(window, location, undefined) {
    var $H,
        history = window.history || {},
        routes = {},
        pendingGo,
        pendingStop = [],
        pendingError = [],
        pendingSuccess = [],
        pendingComplete = [],
        key,
        val,
        tmp,
        initialized,
        nopush,
        pageId = 0,
        waitCount,
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

        callCallbacks = function(arr/**/, callback) {
            while ((callback = arr.shift())) {
                callback();
            }
        },

        success = function() {
            callCallbacks(pendingSuccess);
            callCallbacks(pendingComplete);
            pendingStop = [];
            pendingError = [];
        },

        stop = function(error) {
            waitCount = 0;

            if (error) {
                callCallbacks(pendingError);
                pendingStop = [];
            } else {
                callCallbacks(pendingStop);
                pendingError = [];
            }

            callCallbacks(pendingComplete);
            pendingSuccess = [];

            return $H;
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

        stop: function() {
            stop();
        },

        go: function(href) {
            var hasMatch,
                i,
                args;

            stop();

            href = getFullURI(href);

            pendingGo = [];

            for (key in routes) {
                val = routes[key];

                if ((args = matchURI(key[0] === 'm', href, val.h))) {
                    hasMatch = true;

                    (function(args, callbacks, curPageId) {
                        var args2 = args.slice(0);

                        args.unshift(undefined);

                        for (i = 0; i < callbacks.length; i++) {
                            if ($.isFunction((tmp = callbacks[i]))) {
                                tmp = tmp();
                            }

                            (function(cb) {
                                var pushCallback = function(arr, callback) {
                                    if (callback) {
                                        arr.push(function() {
                                            if (curPageId === pageId) {
                                                callback.apply(cb, args2);
                                            }
                                        });
                                    }
                                };

                                if (cb.go) {
                                    waitCount++;

                                    (function() {
                                        var data;

                                        pendingGo.push(function() {
                                            data = cb.go.apply(cb, args2);

                                            if (data && data.promise && data.then) {
                                                data.then(
                                                    function(d) {
                                                        if (curPageId === pageId) {
                                                            data = d;
                                                            if (--waitCount === 0) {
                                                                success();
                                                            }
                                                        }
                                                    },

                                                    function() {
                                                        if (curPageId === pageId) {
                                                            stop(true);
                                                        }
                                                    }
                                                );
                                            } else if (data) {
                                                if (--waitCount === 0) {
                                                    success();
                                                }
                                            } else {
                                                stop(true);
                                            }
                                        });

                                        if (cb.success) {
                                            pendingSuccess.push(function() {
                                                if (curPageId === pageId) {
                                                    args[0] = data;
                                                    cb.success.apply(cb, args);
                                                }
                                            });
                                        }
                                    })();
                                } else if (cb.success) {
                                    pendingSuccess.push(function() {
                                        if (curPageId === pageId) {
                                            args[0] = undefined;
                                            cb.success.apply(cb, args);
                                        }
                                    });
                                }

                                pushCallback(pendingStop, cb.stop);
                                pushCallback(pendingError, cb.error);
                                pushCallback(pendingComplete, cb.complete);
                            })(tmp);
                        }
                    })(args, val.c, ++pageId);
                }
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

            if (!hasMatch) {
                for (i = 0; i < noMatchCallbacks.length; i++) {
                    noMatchCallbacks[i](href);
                }

                return $H;
            }

            if (waitCount) {
                callCallbacks(pendingGo);
            } else {
                success();
            }

            return $H;
        },

        on: function(hrefObj, callbacks) {
            // callbacks should look like:
            //     {go: function(href, ...) {},
            //      success: function(data, href, ...) {},
            //      stop: function(href, ...),
            //      error: function(href, ...),
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
