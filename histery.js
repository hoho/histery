/*!
 * Histery.js v0.0.0, https://github.com/hoho/histery
 * (c) 2013 Marat Abdullin, MIT license
 */
var $H = (function(window, location, undefined) {
    var history = window.history || {},
        routes = {},
        pending = [],
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
        goesToRun,

        isExpr = function(hrefOrExpr) {
            return hrefOrExpr instanceof RegExp;
        },

        getRouteKey = function(hrefOrExpr) {
            return (isExpr(hrefOrExpr) ? 'e' : 's') + hrefOrExpr;
        },

        stop = function(error) {
            waitCount = 0;
            currentCallbacks = {};
            while ((tmp = pending.shift())) {
                tmp(error);
            }
        },

        getCurrentURI = function() {
            return location.pathname + location.search + ((location.hash.length > 1) ? location.hash : '');
        },

        callDoneCallbacks = function(/**/callbacks, j) {
            for (key in currentCallbacks) {
                val = currentCallbacks[key];
                callbacks = val.c;
                args = val.a;

                for (j = 0; j < callbacks.length; j++) {
                    if ((tmp = callbacks[j].done)) {
                        args[0] = val.d[j];
                        tmp.apply(window, args);
                    }
                }
            }
            pending = [];
        };

    return {
        run: function() {
            $H.go(getCurrentURI());
            $(window).on('popstate', function(e) {
                e = e.originalEvent;
                e = e && e.state;
                if (e && e.js) {
                    nopush = true;
                    $H.go(getCurrentURI());
                }
            });
        },

        stop: stop,

        go: function(href) {
            stop();

            if (initialized) {
                if (history.pushState) {
                    if (!nopush) {
                        history.pushState({js: true}, null, href);
                        href = getCurrentURI();
                    }
                    nopush = false;
                } else {
                    location.href = href;
                }
            } else {
                if (history.replaceState) {
                    history.replaceState({js: true}, null, getCurrentURI());
                }
                initialized = true;
            }

            goesToRun = [];

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

                args.unshift(undefined);

                if (i === 1 && !tmp) {
                    (function(meta, curPageId) {
                        var j,
                            callbacks = meta.c,
                            callback,
                            args = meta.a,
                            getDoneCallback = function(callbackIndex) {
                                return function(data, error) {
                                    if (waitCount > 0) {
                                        if (error) {
                                            waitCount = 0;
                                            stop(error);
                                        } else {
                                            meta.d[callbackIndex] = data;
                                            if (meta === currentCallbacks[curPageId] && --waitCount === 0) {
                                                callDoneCallbacks();
                                            }
                                        }
                                    }
                                }
                            };

                        pending.push(function(error) {
                            args[0] = error;
                            for (j = 0; j < callbacks.length; j++) {
                                if ((callback = callbacks[j].stop)) {
                                    callback.apply(window, args);
                                }
                            }
                        });

                        for (j = 0; j < callbacks.length; j++) {
                            if ((callback = callbacks[j].go)) {
                                waitCount++;
                                goesToRun.push([callback, getDoneCallback(j)]);
                            }
                        }
                    })((currentCallbacks[++pageId] = {c: val.c, d: [], a: args}), pageId);
                }
            }

            if (waitCount) {
                for (i = 0; i < goesToRun.length; i++) {
                    tmp = goesToRun[i];
                    args[0] = tmp[1];
                    tmp[0].apply(window, args);
                }
            } else {
                callDoneCallbacks();
            }

        },

        on: function(hrefOrExpr, callbacks) {
            // callbacks should look like:
            //     {go: function(doneCallback, href, ...) {},
            //      done: function(data, href, ...) {},
            //      stop: function(error, href, ...)}
            if ((val = routes[(key = getRouteKey(hrefOrExpr))])) {
                val.c.push(callbacks);
            } else {
                routes[key] = {h: hrefOrExpr, c: [callbacks]};
            }
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
                        return;
                    }
                }

                delete routes[key];
            }
        }
    };
})(window, location);
