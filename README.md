Histery.js
==========

Single page app history handler.

Requires jQuery (for event binding, typechecking and promises).

## How to use

```js
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
        }, 1000);

        console.log('go1: sameMatch: ' + sameMatch + ', href: ' + href +
                    ', rem1: ' + rem1 + ', rem2: ' + rem2);

        return ret.promise();
    },

    success: function(data, sameMatch, href, rem1, rem2) {
        // This callback will be called when all the matched go() callbacks
        // succeeded.
        // `data` is the returned result of go() callback.
        console.log('success1: data: ' + data + ', sameMatch: ' + sameMatch +
                    ', href: ' + href + ', rem1: ' + rem1 + ', rem2: ' + rem2);
    },

    stop: function(sameMatch, href, rem1, rem2) {
        // This callback will be called called if you do $H.stop() or
        // another $H.go() before the current go() promises are
        // resolved.
        console.log('stop1: sameMatch: ' + sameMatch + ', href: ' + href +
                    ', rem1: ' + rem1 + ', rem2: ' + rem2);
    },

    error: function(sameMatch, href, rem1, rem2) {
        // This callback will be called if the promise from go() callback is
        // rejected or if go() callback returned false.
        console.log('error1: sameMatch: ' + sameMatch + ', href: ' + href +
                    ', rem1: ' + rem1 + ', rem2: ' + rem2);
    },

    complete: function(sameMatch, href, rem1, rem2) {
        // This callback will be called in the end (no matter successful or
        // not).
        console.log('complete1: sameMatch: ' + sameMatch + ', href: ' + href +
                    ', rem1: ' + rem1 + ', rem2: ' + rem2);
    },

    leave: function(sameMatch, href, rem1, rem2) {
        // This callback will be called when user is leaving this page (i.e.
        // $H.go() for another page is called).

        // `sameMatch` in leave callback means that the page we're leaving and
        // the new page we're going to are matched with the same RegExp.

        console.log('leave1: sameMatch: ' + sameMatch + ', href: ' + href +
                    ', rem1: ' + rem1 + ', rem2: ' + rem2);
    }
});

// All the callbacks are optional and you can postpone callbacks object
// creation by passing a function as a second argument.
$H.on(/^\/$/, function() { return {
    go: function(sameMatch, href) {
        console.log('go2: sameMatch: ' + sameMatch + ', href: ' + href);

        return {hello: 'world'};
    },

    success: function(data, sameMatch, href) {
        console.log('success2: data: ' + JSON.stringify(data) +
                    ', sameMatch: ' + sameMatch + ', href: ' + href);
    },

    leave: function(sameMatch, href) {
        console.log('leave2: sameMatch: ' + sameMatch + ', href: ' + href);
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
            console.log('go3: sameMatch: ' + sameMatch + ', href: ' + href +
                        ', rem1: ' + rem1 + ', rem2: ' + rem2 + ', rem3: ' + rem3);
            return false;
        },

        stop: function(sameMatch, href, rem1, rem2, rem3) {
            console.log('stop3: sameMatch: ' + sameMatch + ', href: ' + href +
                        ', rem1: ' + rem1 + ', rem2: ' + rem2 + ', rem3: ' + rem3);
        },

        error: function(sameMatch, href, rem1, rem2, rem3) {
            console.log('error3: sameMatch: ' + sameMatch + ', href: ' + href +
                        ', rem1: ' + rem1 + ', rem2: ' + rem2 + ', rem3: ' + rem3);
        },

        leave: function(sameMatch, href, rem1, rem2, rem3) {
            console.log('leave3: sameMatch: ' + sameMatch + ', href: ' + href +
                        ', rem1: ' + rem1 + ', rem2: ' + rem2 + ', rem3: ' + rem3);
        }
    }
);

$H.noMatch(function(href) {
    // This callback is called when there are no matches.
    console.log('No match:', href);
});

// Then we need to start. Suppose my location is /.
$H.run();
> go2: sameMatch: false, href: /
> success2: data: {"hello":"world"}, sameMatch: false, href: /

$H.go('/test?param=pppp#bababebe');
> leave2: sameMatch: false, href: /
> go3: sameMatch: false, href: /test?param=pppp#bababebe, rem1: test, rem2: pppp, rem3: bebe
> error3: sameMatch: false, href: /test?param=pppp#bababebe, rem1: test, rem2: pppp, rem3: bebe

$H.go('/some/reg/expr');
> leave3: sameMatch: false, href: /test?param=pppp#bababebe, rem1: test, rem2: pppp, rem3: bebe
> go1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr

> success1: data: hello reg expr, sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr
> complete1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr

$H.go('/ololo/piupiu');
> leave1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr
> No match: /ololo/piupiu

$H.go('/');
> go2: sameMatch: false, href: /
> success2: data: {"hello":"world"}, sameMatch: false, href: /

$H.go('/');
> leave2: sameMatch: true, href: /
> go2: sameMatch: true, href: /
> success2: data: {"hello":"world"}, sameMatch: true, href: /
```
