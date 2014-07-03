# Histery [![Build Status](https://travis-ci.org/hoho/histery.svg?branch=master)](https://travis-ci.org/hoho/histery)

Single page app history handler.

## How to use

```js
$H.on(/^\/some\/(reg)\/(expr)$/, {
    go: function(sameMatch, href, rem1, rem2) {
        // This callback will be called when you do $H.go('/some/reg/expr');

        // `sameMatch` will be true if current `href` and previous one are
        // matched with the same RegExp and have the same remembered args.

        // `href` is a page address.

        // `rem1` and `rem2` are values
        // remembered by regular expression ('reg' and 'expr' in
        // our case).

        console.log('go1: sameMatch: ' + sameMatch + ', href: ' + href +
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
        },

        leave: function(sameMatch, href, rem1, rem2, rem3) {
            console.log('leave3: sameMatch: ' + sameMatch + ', href: ' + href +
                        ', rem1: ' + rem1 + ', rem2: ' + rem2 + ', rem3: ' + rem3);
        }
    }
);

$H.on(null, {
    go: function(sameMatch, href) {
        // This callback is called when there are no matches.
        console.log('No match: sameMatch: ' + sameMatch + ', href: ' + href);
    }
});

// You can define leave callback for no match too.
$H.on(null, {
    go: function(sameMatch, href) {
        console.log('No match go: sameMatch: ' + sameMatch + ', href: ' + href);
    },

    leave: function(sameMatch, href) {
        console.log('No match leave: sameMatch: ' + sameMatch + ', href: ' + href);
    }
});

// Then we need to start. Suppose my location is /.
$H.run();
> go2: sameMatch: false, href: /

$H.go('/test?param=pppp#bababebe');
> leave2: sameMatch: false, href: /
> go3: sameMatch: false, href: /test?param=pppp#bababebe, rem1: test, rem2: pppp, rem3: bebe

$H.go('/some/reg/expr');
> leave3: sameMatch: false, href: /test?param=pppp#bababebe, rem1: test, rem2: pppp, rem3: bebe
> go1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr

$H.go('/ololo/piupiu');
> leave1: sameMatch: false, href: /some/reg/expr, rem1: reg, rem2: expr
> No match: sameMatch: false, href: /ololo/piupiu
> No match go: sameMatch: false, href: /ololo/piupiu

$H.go('/ololo/piupiu2');
> No match leave: sameMatch: true, href: /ololo/piupiu
> No match: sameMatch: true, href: /ololo/piupiu2
> No match go: sameMatch: true, href: /ololo/piupiu2

$H.go('/');
> No match leave: sameMatch: false, href: /ololo/piupiu2
> go2: sameMatch: false, href: /

$H.go('/');
> leave2: sameMatch: true, href: /
> go2: sameMatch: true, href: /
```
