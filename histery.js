/*!
 * Histery.js v0.0.0+, https://github.com/hoho/histery
 * (c) 2013 Marat Abdullin, MIT license
 */
var $H = (function(window, location, undefined) {
    var history = window.history || {},
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

        isExpr = function(hrefOrExpr) {
            return hrefOrExpr instanceof RegExp;
        },

        getRouteKey = function(hrefOrExpr) {
            return (isExpr(hrefOrExpr) ? 'e' : 's') + hrefOrExpr;
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
            return l.pathname + l.search + ((l.hash.length > 1) ? l.hash : '');
        },

        callSuccessCallbacks = function(/**/callbacks, j) {
            for (key in currentCallbacks) {
                val = currentCallbacks[key];
                callbacks = val.c;
                args = val.a;
                args.unshift(undefined);

                for (j = 0; j < callbacks.length; j++) {
                    if ((tmp = callbacks[j].success)) {
                        args[0] = val.d[j];
                        tmp.apply(window, args);
                    }
                }
            }

            pendingStop = [];

            while ((tmp = pendingComplete.shift())) {
                tmp();
            }
        };

    return {
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

                i = 0;

                if (key[0] === 'e') {
                    tmp = href.replace(val.h, function() {
                        i++;
                        args = Array.prototype.slice.call((args = arguments), 0, args.length - 2);
                        return '';
                    });
                } else if (val.h === href) {
                    i = 1;
                    tmp = undefined;
                    args = [href];
                }


                if (i === 1 && !tmp) {
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

                        pendingStop.push(function(error) {
                            args.unshift(error);
                            for (j = 0; j < callbacks.length; j++) {
                                if ((callback = callbacks[j].stop)) {
                                    callback.apply(window, args);
                                }
                            }
                        });

                        pendingComplete.push(function() {
                            args.shift();
                            for (j = 0; j < callbacks.length; j++) {
                                if ((callback = callbacks[j].complete)) {
                                    callback.apply(window, args);
                                }
                            }
                        });

                        for (j = 0; j < callbacks.length; j++) {
                            if ((callback = callbacks[j].go)) {
                                waitCount++;
                                pendingGo.push([callback, args, getSuccessCallback(j)]);
                            }
                        }
                    })((currentCallbacks[++pageId] = {c: val.c, d: [], a: args}), pageId);
                }
            }

            if (!pendingStop.length) {
                $.error('No matches for "' + href + '"');
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
                    (function(callback, args, success) {
                        tmp = callback.apply(window, args);
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

        on: function(hrefOrExpr, callbacks) {
            // callbacks should look like:
            //     {go: function(href, ...) {},
            //      success: function(data, href, ...) {},
            //      stop: function(error, href, ...),
            //      complete: function(href) {}}
            if ((val = routes[(key = getRouteKey(hrefOrExpr))])) {
                val.c.push(callbacks);
            } else {
                routes[key] = {h: hrefOrExpr, c: [callbacks]};
            }

            return $H;
        },

        off: function(hrefOrExpr, callbacks) {
            if (!hrefOrExpr) {
                routes = {};
            }

            if ((val = routes[(key = getRouteKey(hrefOrExpr))])) {
                if (callbacks) {
                    val = val.c;
                    i = 0;

                    while (i < val.length) {
                        if (val[i] === callbacks) {
                            val.splice(i, 1);
                        } else {
                            i++;
                        }
                    }

                    if (val.length) {
                        return $H;
                    }
                }

                delete routes[key];
            }

            return $H;
        }
    };
})(window, location);
