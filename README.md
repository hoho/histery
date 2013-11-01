Histery.js
==========

Single page app history handler

## How to use (ugly examples)

    $H.on(/^\/some\/(reg)\/(expr)$/, {
        go: function(href, rem1, rem2) {
            // This callback is called when you do $H.go('/some/reg/expr');
            // You should return promise or some data. Or false in case of
            // error.
            // `href` is a page address. `rem1` and `rem2` are values
            // remembered by regular expression ('reg' and 'expr' in
            // our case).
            var ret = $.Deferred();
            window.setTimeout(function() {
                ret.resolve('hello ' + rem1 + ' ' + rem2);
            }, 1000);
            return ret.promise();
        },

        success: function(data, href, rem1, rem2) {
            // This callback is called when all the matched go() callbacks
            // succeeded.
            // `data` is the returned result of go() callback.
            console.log(data, href, rem1, rem2);
        },

        stop: function(error, href, rem1, rem2) {
            // This callback is called if the promise from go() callback is
            // rejected or if go() callback returned false. In this case
            // `error` will be true.
            // Or this callback will be called if you do $H.stop() or
            // another $H.go() before the current go() promises are
            // resolved. In this case `error` will be false.
        },

        complete: function(href, rem1, rem2) {
            // This callback is called in the end (no matter successful or
            // not).
        }
    });

    // All the callbacks are optional and you can postpone callbacks object
    // creation by passing a function as a second argument.
    $H.on(/^\/$/, function() { return {
        go: function(href) {
            return {hello: 'world'};
        },

        success: function(data, href) {
            console.log(JSON.stringify(data), href);
        }
    }});

    // By default only pathname is matched, but you can match querystring
    // and hash too.
    $H.on(
        {
            pathname: /^\/(test)$/,
            search: /^param=(pppp)$/,
            hash: /^baba(bebe)$/
        },

        {
            go: function(href, rem1, rem2, rem3) {
                console.log(href, rem1, rem2, rem3);
                return false;
            },

            stop: function(error, href, rem1, rem2, rem3) {
                console.log(error, href, rem1, rem2, rem3);
            }
        }
    );

    $H.noMatch(function(href) {
        // This callback is called when there are no matches.
        console.log('No match:', href);
    });

    // Then we need to start. Suppose my location is /.
    $H.run();
    > {"hello":"world"} /

    $H.go('/test?param=pppp#bababebe');
    > /test?param=pppp#bababebe test pppp bebe
    > true "/test?param=pppp#bababebe" "test" "pppp" "bebe"

    $H.go('/some/reg/expr');
    > hello reg expr /some/reg/expr reg expr

    $H.go('/ololo/piupiu');
    > No match: /ololo/piupiu
