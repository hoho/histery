asyncTest('General test', function() {
    var testResult;

    $H.on(/^\/some\/(reg)\/(expr)$/, {
        go: function(sameMatch, href, rem1, rem2) {
            // This callback will be called when you do $H.go('/some/reg/expr');

            // `sameMatch` will be true if current `href` and previous one are
            // matched with the same RegExp.

            // `href` is a page address.

            // `rem1` and `rem2` are values
            // remembered by regular expression ('reg' and 'expr' in
            // our case).
            testResult.push('go1: sameMatch: ' + sameMatch + ', href: ' + href +
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

    // All callbacks are optional and you can postpone callbacks object
    // creation by passing a function as a second argument.
    $H.on(/^\/$/, function() { return {
        go: function(sameMatch, href) {
            testResult.push('go2: sameMatch: ' + sameMatch + ', href: ' + href);
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
            hash: /^baba(bebe)(?:2)?$/
        },

        {
            go: function(sameMatch, href, rem1, rem2, rem3) {
                testResult.push('go3: sameMatch: ' + sameMatch + ', href: ' + href +
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
            testResult.push('no match: sameMatch: ' + sameMatch + ', href: ' + href);
        }
    });

    // You can define leave callback for no match too.
    $H.on(null, {
        go: function(sameMatch, href) {
            testResult.push('no match go: sameMatch: ' + sameMatch + ', href: ' + href);
        },
        leave: function(sameMatch, href) {
            testResult.push('no match leave: sameMatch: ' + sameMatch + ', href: ' + href);
        }
    });

    $H.on(undefined, function(href) {
        testResult.push('done: ' + href);
    });

    testResult = [];
    $H.run();
    $H.state('page1', true);

    deepEqual(testResult, [
        'go2: sameMatch: false, href: /',
        'done: /'
    ]);

    testResult = [];
    $H.go('/test?param=pppp#bababebe');
    $H.state('page2', {page2: true});

    deepEqual(testResult, [
        'leave2: sameMatch: false, href: /',
        'go3: sameMatch: false, href: /test?param=pppp#bababebe, rem1: test, rem2: pppp, rem3: bebe',
        'done: /test?param=pppp#bababebe'
    ]);

    testResult = [];
    $H.go('/test?param=pppp#bababebe2');
    $H.state('page21', true);


    testResult = [];
    $H.go('/some/reg/expr');
    $H.state('page3_1', {page3: true});
    $H.state('page3_2', {page3: 'yes'});

    deepEqual(testResult, [
        'leave3: sameMatch: false, href: /test?param=pppp#bababebe2, rem1: test, rem2: pppp, rem3: bebe',
        'go1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr',
        'done: /some/reg/expr'
    ]);

    testResult = [];
    $H.go('/ololo/piupiu');
    $H.state('page4', true);

    deepEqual(testResult, [
        'leave1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr',
        'no match: sameMatch: false, href: /ololo/piupiu',
        'no match go: sameMatch: false, href: /ololo/piupiu',
        'done: /ololo/piupiu'
    ]);

    testResult = [];
    $H.go('/ololo/piupiu2');
    $H.state('page5', {page5: true});

    deepEqual(testResult, [
        'no match leave: sameMatch: true, href: /ololo/piupiu',
        'no match: sameMatch: true, href: /ololo/piupiu2',
        'no match go: sameMatch: true, href: /ololo/piupiu2',
        'done: /ololo/piupiu2'
    ]);

    testResult = [];
    $H.go('/');
    $H.state('page6', true);

    deepEqual(testResult, [
        'no match leave: sameMatch: false, href: /ololo/piupiu2',
        'go2: sameMatch: false, href: /',
        'done: /'
    ]);

    testResult = [];
    $H.go('/');
    $H.state('page7', true);

    deepEqual(testResult, [
        'leave2: sameMatch: true, href: /',
        'go2: sameMatch: true, href: /',
        'done: /'
    ]);

    deepEqual($H.state('page7'), true);
    ok($H.state('page6') === undefined);

    if (!window._phantom) {
        // Synchronous history.go(-1) doesn't work, so here are a bunch of
        // setTimeouts.

        testResult = [];

        function back(n) {
            window.history.go(n || -1);
            return false;
        }

        function forward(n) {
            window.history.go(n || 1);
            return false;
        }

        var PAUSE = 500;
        setTimeout(function () {
            back();

            setTimeout(function () {
                deepEqual($H.state('page6'), true);
                ok($H.state('page5') === undefined);
                ok($H.state('page7') === undefined);

                deepEqual(testResult, [
                    'leave2: sameMatch: true, href: /',
                    'go2: sameMatch: true, href: /',
                    'done: /'
                ]);
                testResult = [];

                back();

                setTimeout(function () {
                    deepEqual($H.state('page5'), {page5: true});
                    ok($H.state('page4') === undefined);
                    ok($H.state('page6') === undefined);

                    deepEqual(testResult, [
                        'leave2: sameMatch: false, href: /',
                        'no match: sameMatch: false, href: /ololo/piupiu2',
                        'no match go: sameMatch: false, href: /ololo/piupiu2',
                        'done: /ololo/piupiu2'
                    ]);
                    testResult = [];

                    back(-2);

                    setTimeout(function () {
                        deepEqual($H.state('page3_1'), {page3: true});
                        deepEqual($H.state('page3_2'), {page3: 'yes'});
                        ok($H.state('page2') === undefined);
                        ok($H.state('page4') === undefined);

                        deepEqual(testResult, [
                            'no match leave: sameMatch: false, href: /ololo/piupiu2',
                            'go1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr',
                            'done: /some/reg/expr'
                        ]);
                        testResult = [];

                        back(-3);

                        setTimeout(function () {
                            deepEqual($H.state('page1'), true);
                            ok($H.state('page3_1') === undefined);
                            ok($H.state('page2') === undefined);

                            deepEqual(testResult, [
                                'leave1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr',
                                'go2: sameMatch: false, href: /',
                                'done: /'
                            ]);
                            testResult = [];

                            forward(7);

                            setTimeout(function () {
                                deepEqual($H.state('page7'), true);
                                ok($H.state('page1') === undefined);

                                deepEqual(testResult, [
                                    'leave2: sameMatch: true, href: /',
                                    'go2: sameMatch: true, href: /',
                                    'done: /'
                                ]);

                                start();
                            }, PAUSE);
                        }, PAUSE);
                    }, PAUSE);
                }, PAUSE);
            }, PAUSE);
        }, PAUSE);
    } else {
        console.log('WARNING: History navigation is broken in PhantomJS, run tests in browser to test state');
        start();
    }
});
