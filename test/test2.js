test('Types test', function() {
    var testResult = [],
        go = {go: function() { testResult.push(Array.prototype.slice.call(arguments, 0)); }};


    $H.on('/types/', go);

    $H.on(/^\/t(y)p(e)s\/$/, go);

    $H.on(
        function(pathname) {
            testResult.push('Pathname: ' + pathname);
            return ['a', 1];
        },
        go
    );

    $H.on(
        {
            pathname: '/types/',
            search: 'hello=world',
            hash: 'great'
        },
        go
    );

    $H.on(
        {
            pathname: /^\/(t)ype(s)\/$/,
            search: /^hello=(world)$/,
            hash: /^gre(at)$/
        },
        go
    );

    $H.on(
        {
            pathname: function(pathname) { return [pathname, 1, 2]; },
            search: function(search) { return {s: search, 3: 4}; },
            hash: function(hash) { return [hash, 5, [66, 77, {deep: 88}]]; }
        },
        go
    );

    $H.on(
        {
            pathname: function(pathname) { return true; },
            search: function(search) { return false; }
        },
        go
    );

    $H.run();

    deepEqual(testResult, [
        'Pathname: /types/',
        [false, '/types/?hello=world#great'],
        [false, '/types/?hello=world#great', 'y', 'e'],
        [false, '/types/?hello=world#great', 'a', 1],
        [false, '/types/?hello=world#great'],
        [false, '/types/?hello=world#great', 't', 's', 'world', 'at'],
        [false, '/types/?hello=world#great', '/types/', 1, 2, {'3': 4, 's': 'hello=world'}, 'great', 5, [66, 77, {deep: 88}]]
    ]);

    testResult = [];

    $H.off('/types/', go);

    $H.go('/types/');

    deepEqual(testResult, [
        'Pathname: /types/',
        [true, '/types/', 'y', 'e'],
        [true, '/types/', 'a', 1],
        [false, '/types/', '/types/', 1, 2, {'3': 4, 's': ''}, '', 5, [66, 77, {deep: 88}]]
    ]);

    testResult = [];

    $H.go('/types/');

    deepEqual(testResult, [
        'Pathname: /types/',
        [true, '/types/', 'y', 'e'],
        [true, '/types/', 'a', 1],
        [true, '/types/', '/types/', 1, 2, {'3': 4, 's': ''}, '', 5, [66, 77, {deep: 88}]]
    ]);
});
