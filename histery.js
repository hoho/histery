/*!
 * Histery.js v0.3.0, https://github.com/hoho/histery
 * (c) 2013 Marat Abdullin, MIT license
 */
(function(window, location, undefined) {
    var $H,
        history = window.history || {},
        routes = {},
        pendingStop = [],
        pendingError = [],
        pendingSuccess = [],
        pendingComplete = [],
        pendingLeave = [],
        key,
        val,
        tmp,
        initialized,
        nopush,
        pageId = 0,
        waitCount,
        processed,
        processedTimer,
        noMatchCallbacks = [],
        currentMatches = {},
        prevIsNoMatch = false,

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
                    })
                .trigger('popstate');

            return $H;
        },

        stop: function() {
            return stop();
        },

        go: function(href) {
            var hasMatch,
                i,
                key,
                args,
                pendingGo = [],
                newMatches = {},
                newLeave = [];

            stop();

            href = getFullURI(href);

            pageId++;

            for (key in routes) {
                val = routes[key];

                if ((args = matchURI(key[0] === 'm', href, val.h))) {
                    newMatches[key] = hasMatch = true;

                    (function(args, callbacks, curPageId) {
                        args.unshift(key in currentMatches);

                        var curKey = key,
                            successArgs = args.slice(0);

                        // Success callback is one argument longer (to pass the
                        // data).
                        successArgs.unshift(undefined);

                        for (i = 0; i < callbacks.length; i++) {
                            if ($.isFunction((tmp = callbacks[i]))) {
                                tmp = tmp();
                            }

                            (function(cb) {
                                var pushCallback = function(arr, callback) {
                                    if (callback) {
                                        arr.push(function() {
                                            if (curPageId === pageId) {
                                                callback.apply(cb, args);
                                            }
                                        });
                                    }
                                };

                                if (cb.go) {
                                    waitCount++;

                                    (function() {
                                        var data;

                                        pendingGo.push(function() {
                                            data = cb.go.apply(cb, args);

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
                                                    successArgs[0] = data;
                                                    cb.success.apply(cb, successArgs);
                                                }
                                            });
                                        }
                                    })();
                                } else if (cb.success) {
                                    pendingSuccess.push(function() {
                                        if (curPageId === pageId) {
                                            successArgs[0] = undefined;
                                            cb.success.apply(cb, successArgs);
                                        }
                                    });
                                }

                                pushCallback(pendingStop, cb.stop);
                                pushCallback(pendingError, cb.error);
                                pushCallback(pendingComplete, cb.complete);

                                if (cb.leave) {
                                    // First argument of leave callback is
                                    // `sameMatch`. It is true when the same
                                    // route matched new href and href we're
                                    // leaving).
                                    newLeave.push(function() {
                                        args[0] = curKey in currentMatches;
                                        cb.leave.apply(cb, args);
                                    });
                                }
                            })(tmp);
                        }
                    })(args, val.c, pageId);
                }
            }

            currentMatches = newMatches;

            if (hasMatch) { prevIsNoMatch = false; }

            callCallbacks(pendingLeave);
            pendingLeave = newLeave;

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
                    // Reuse `key` variable here.
                    key = noMatchCallbacks[i];

                    if ($.isPlainObject(key)) {
                        key.go && key.go(prevIsNoMatch, href);

                        (function(cb) {
                            if (cb) {
                                pendingLeave.push(function() {
                                    cb(prevIsNoMatch, href);
                                });
                            }
                        })(key.leave);
                    } else {
                        noMatchCallbacks[i](prevIsNoMatch, href);
                    }
                }

                prevIsNoMatch = true;

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
            //      stop: function(href, ...) {},
            //      error: function(href, ...) {},
            //      complete: function(href) {},
            //      leave: function(href) {}}
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
