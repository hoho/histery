/*!
 * Histery.js v0.5.2, https://github.com/hoho/histery
 * (c) 2013 Marat Abdullin, MIT license
 */
(function(window, location, undefined) {
    var $H,
        history = window.history || {},
        routes = [],
        noMatchCount = 0,
        pendingStop = [],
        pendingError = [],
        pendingSuccess = [],
        pendingComplete = [],
        pendingLeave = [],
        route,
        initialized,
        nopush,
        pageId = 0,
        waitCount,
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
            var i,
                r,
                args,
                pendingGo = [],
                hasMatch = false,
                newMatches = {},
                tmpGo = [],
                tmpStop = [],
                tmpError = [],
                tmpSuccess = [],
                tmpComplete = [],
                tmpLeave = [],
                waitCountNoMatch = 0;

            stop();

            href = getFullURI(href);

            pageId++;

            for (r = 0; r < routes.length; r++) {
                route = routes[r];

                if (!route.h || ((args = matchURI(href, route.h)))) {
                    if (route.h) {
                        newMatches[r] = hasMatch = true;
                    } else {
                        args = [href];
                    }

                    (function(args, callbacks, curPageId) {
                        args.unshift(route.cur);

                        var curVal = route,
                            isMatch = !!route.h,
                            successArgs = args.slice(0);

                        // Success callback is one argument longer (to pass the
                        // data).
                        successArgs.unshift(undefined);

                        if (isFunction(callbacks)) {
                            callbacks = callbacks();
                        }

                        (function(cb) {
                            var pushCallback = function(arr, callback) {
                                if (callback) {
                                    arr.push([
                                        isMatch,
                                        function() {
                                            if (curPageId === pageId) {
                                                callback.apply(cb, args);
                                            }
                                        }
                                    ]);
                                }
                            };

                            if (cb.go) {
                                if (isMatch) {
                                    waitCount++;
                                } else {
                                    waitCountNoMatch++;
                                }

                                (function() {
                                    var data;

                                    tmpGo.push([
                                        isMatch,
                                        function() {
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
                                            } else if (data || data === undefined) {
                                                if (--waitCount === 0) {
                                                    success();
                                                }
                                            } else {
                                                stop(true);
                                            }
                                        }
                                    ]);

                                    if (cb.success) {
                                        tmpSuccess.push([
                                            isMatch,
                                            function() {
                                                if (curPageId === pageId) {
                                                    successArgs[0] = data;
                                                    cb.success.apply(cb, successArgs);
                                                }
                                            }
                                        ]);
                                    }
                                })();
                            } else if (cb.success) {
                                tmpSuccess.push([
                                    isMatch,
                                    function() {
                                        if (curPageId === pageId) {
                                            successArgs[0] = undefined;
                                            cb.success.apply(cb, successArgs);
                                        }
                                    }
                                ]);
                            }

                            pushCallback(tmpStop, cb.stop);
                            pushCallback(tmpError, cb.error);
                            pushCallback(tmpComplete, cb.complete);

                            if (cb.leave) {
                                // First argument of leave callback is
                                // `sameMatch`. It is true when the same
                                // route matched new href and href we're
                                // leaving).
                                tmpLeave.push([
                                    isMatch,
                                    function() {
                                        args[0] = curVal.cur;
                                        cb.leave.apply(cb, args);
                                    }
                                ]);
                            }
                        })(callbacks);
                    })(args, route.c, pageId);
                }
            }

            pushFilteredCallbacks(hasMatch, tmpGo, pendingGo);
            pushFilteredCallbacks(hasMatch, tmpStop, pendingStop);
            pushFilteredCallbacks(hasMatch, tmpError, pendingError);
            pushFilteredCallbacks(hasMatch, tmpSuccess, pendingSuccess);
            pushFilteredCallbacks(hasMatch, tmpComplete, pendingComplete);

            for (i = 0; i < routes.length; i++) {
                route = routes[i];
                route.cur = (hasMatch && newMatches[i]) || (!hasMatch && !route.h);
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

            if (hasMatch || noMatchCount) {
                if (!hasMatch) {
                    waitCount = waitCountNoMatch;
                }

                if (waitCount) {
                    callCallbacks(pendingGo);
                } else {
                    success();
                }
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
            routes.push({h: hrefObj, c: callbacks, cur: false});

            if (!hrefObj) {
                noMatchCount++;
            }

            return $H;
        },

        off: function(hrefObj, callbacks) {
            if (!hrefObj && !callbacks) {
                routes = [];
            }

            var i = routes.length - 1,
                r;

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

            return $H;
        }
    };
})(window, location);
