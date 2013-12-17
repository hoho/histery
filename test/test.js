asyncTest('General test', function() {
    var testResult;

    $H.on(/^\/some\/(reg)\/(expr)$/, {
        go: function(sameMatch, href, rem1, rem2) {
            // This callback will be called when you do $H.go('/some/reg/expr');
            // You should return promise or some data. Or false in case of
            // error.

            // `sameMatch` will be true if current `href` and previous one are
            // matched with the same RegExp.

            // `href` is a page address.

            // `rem1` and `rem2` are values
            // remembered by regular expression ('reg' and 'expr' in
            // our case).

            var ret = $.Deferred();
            window.setTimeout(function() {
                ret.resolve('hello ' + rem1 + ' ' + rem2);
            }, 100);

            testResult.push('go1: sameMatch: ' + sameMatch + ', href: ' + href +
                ', rem1: ' + rem1 + ', rem2: ' + rem2);

            return ret.promise();
        },

        success: function(data, sameMatch, href, rem1, rem2) {
            // This callback will be called when all the matched go() callbacks
            // succeeded.
            // `data` is the returned result of go() callback.
            testResult.push('success1: data: ' + data + ', sameMatch: ' + sameMatch +
                ', href: ' + href + ', rem1: ' + rem1 + ', rem2: ' + rem2);
        },

        stop: function(sameMatch, href, rem1, rem2) {
            // This callback will be called called if you do $H.stop() or
            // another $H.go() before the current go() promises are
            // resolved.
            testResult.push('stop1: sameMatch: ' + sameMatch + ', href: ' + href +
                ', rem1: ' + rem1 + ', rem2: ' + rem2);
        },

        error: function(sameMatch, href, rem1, rem2) {
            // This callback will be called if the promise from go() callback is
            // rejected or if go() callback returned false.
            testResult.push('error1: sameMatch: ' + sameMatch + ', href: ' + href +
                ', rem1: ' + rem1 + ', rem2: ' + rem2);
        },

        complete: function(sameMatch, href, rem1, rem2) {
            // This callback will be called in the end (no matter successful or
            // not).
            testResult.push('complete1: sameMatch: ' + sameMatch + ', href: ' + href +
                ', rem1: ' + rem1 + ', rem2: ' + rem2);
        },

        leave: function(sameMatch, href, rem1, rem2) {
            // This callback will be called when user is leaving this page (i.e.
            // $H.go() for another page is called).

            // `sameMatch` in leave callback means that the page we're leaving and
            // the new page we're going to are matched with the same RegExp.

            testResult.push('leave1: sameMatch: ' + sameMatch + ', href: ' + href +
                ', rem1: ' + rem1 + ', rem2: ' + rem2);
        }
    });

    // All the callbacks are optional and you can postpone callbacks object
    // creation by passing a function as a second argument.
    $H.on(/^\/$/, function() { return {
        go: function(sameMatch, href) {
            testResult.push('go2: sameMatch: ' + sameMatch + ', href: ' + href);

            return {hello: 'world'};
        },

        success: function(data, sameMatch, href) {
            testResult.push('success2: data: ' + JSON.stringify(data) +
                ', sameMatch: ' + sameMatch + ', href: ' + href);
        },

        leave: function(sameMatch, href) {
            testResult.push('leave2: sameMatch: ' + sameMatch + ', href: ' + href);
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
            go: function(sameMatch, href, rem1, rem2, rem3) {
                testResult.push('go3: sameMatch: ' + sameMatch + ', href: ' + href +
                    ', rem1: ' + rem1 + ', rem2: ' + rem2 + ', rem3: ' + rem3);
                return false;
            },

            stop: function(sameMatch, href, rem1, rem2, rem3) {
                testResult.push('stop3: sameMatch: ' + sameMatch + ', href: ' + href +
                    ', rem1: ' + rem1 + ', rem2: ' + rem2 + ', rem3: ' + rem3);
            },

            error: function(sameMatch, href, rem1, rem2, rem3) {
                testResult.push('error3: sameMatch: ' + sameMatch + ', href: ' + href +
                    ', rem1: ' + rem1 + ', rem2: ' + rem2 + ', rem3: ' + rem3);
            },

            leave: function(sameMatch, href, rem1, rem2, rem3) {
                testResult.push('leave3: sameMatch: ' + sameMatch + ', href: ' + href +
                    ', rem1: ' + rem1 + ', rem2: ' + rem2 + ', rem3: ' + rem3);
            }
        }
    );

    $H.on(null, {
        go: function(sameMatch, href) {
            // This callback is called when there are no matches.
            testResult.push('No match: sameMatch: ' + sameMatch + ', href: ' + href);
        }
    });

    // You can define leave callback for no match too.
    $H.on(null, {
        go: function(sameMatch, href) {
            testResult.push('No match go: sameMatch: ' + sameMatch + ', href: ' + href);
        },
        leave: function(sameMatch, href) {
            testResult.push('No match leave: sameMatch: ' + sameMatch + ', href: ' + href);
        }
    });

    testResult = [];
    $H.run();

    deepEqual(testResult, [
        'go2: sameMatch: false, href: /',
        'success2: data: {"hello":"world"}, sameMatch: false, href: /'
    ]);

    testResult = [];
    $H.go('/test?param=pppp#bababebe');

    deepEqual(testResult, [
        'leave2: sameMatch: false, href: /',
        'go3: sameMatch: false, href: /test?param=pppp#bababebe, rem1: test, rem2: pppp, rem3: bebe',
        'error3: sameMatch: false, href: /test?param=pppp#bababebe, rem1: test, rem2: pppp, rem3: bebe'
    ]);

    testResult = [];
    $H.go('/some/reg/expr');

    deepEqual(testResult, [
        'leave3: sameMatch: false, href: /test?param=pppp#bababebe, rem1: test, rem2: pppp, rem3: bebe',
        'go1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr'
    ]);

    testResult = [];

    window.setTimeout(function() {
        deepEqual(testResult, [
            'success1: data: hello reg expr, sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr',
            'complete1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr'
        ]);

        testResult = [];
        $H.go('/ololo/piupiu');

        deepEqual(testResult, [
            'leave1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr',
            'No match: sameMatch: false, href: /ololo/piupiu',
            'No match go: sameMatch: false, href: /ololo/piupiu'
        ]);

        testResult = [];
        $H.go('/ololo/piupiu2');

        deepEqual(testResult, [
            'No match leave: sameMatch: true, href: /ololo/piupiu',
            'No match: sameMatch: true, href: /ololo/piupiu2',
            'No match go: sameMatch: true, href: /ololo/piupiu2'
        ]);

        testResult = [];
        $H.go('/');

        deepEqual(testResult, [
            'No match leave: sameMatch: false, href: /ololo/piupiu2',
            'go2: sameMatch: false, href: /',
            'success2: data: {"hello":"world"}, sameMatch: false, href: /'
        ]);

        testResult = [];
        $H.go('/');

        deepEqual(testResult, [
            'leave2: sameMatch: true, href: /',
            'go2: sameMatch: true, href: /',
            'success2: data: {"hello":"world"}, sameMatch: true, href: /'
        ]);

        start();
    }, 300);
});
