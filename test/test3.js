test('Dry test', function() {
    var testResult = [],
        go = {go: function() { testResult.push(Array.prototype.slice.call(arguments, 0)); }},
        goRet;


    $H.on('/(dry)', go);
    $H.on(/^\/(dry2)$/, go);
    $H.on(/^\/(dry3)$/, go);
    $H.on(
        function(pathname) {
            testResult.push('Pathname: ' + pathname);
            return pathname === '/dry4';
        },
        go
    );
    $H.on('/rewrite/test', '/dry3'); // rewrite
    $H.run();

    goRet = $H.go('/dry2', true);
    deepEqual(goRet, true);
    deepEqual(location.pathname, '/dry');

    goRet = $H.go('/dry100500', true);
    deepEqual(goRet, false);
    deepEqual(location.pathname, '/dry');

    goRet = $H.go('/dry3', true);
    deepEqual(goRet, true);
    deepEqual(location.pathname, '/dry');

    goRet = $H.go('/dry4', true);
    deepEqual(goRet, true);
    deepEqual(location.pathname, '/dry');

    deepEqual(testResult, [
        'Pathname: /dry',
        'Pathname: /dry2',
        'Pathname: /dry100500',
        'Pathname: /dry3',
        'Pathname: /dry4'
    ]);
    testResult = [];

    goRet = $H.go('/dry2');
    deepEqual(goRet, true);
    deepEqual(location.pathname, '/dry2');

    goRet = $H.go('/dry3', true);
    deepEqual(goRet, true);
    deepEqual(location.pathname, '/dry2');

    goRet = $H.go('/dry2');
    deepEqual(goRet, true);
    deepEqual(location.pathname, '/dry2');

    goRet = $H.go('/dry3');
    deepEqual(goRet, true);
    deepEqual(location.pathname, '/dry3');

    goRet = $H.go('/dry4');
    deepEqual(goRet, true);
    deepEqual(location.pathname, '/dry4');

    deepEqual(testResult, [
        'Pathname: /dry2',
        [false, '/dry2', 'dry2'],
        'Pathname: /dry3',
        'Pathname: /dry2',
        [true, '/dry2', 'dry2'],
        'Pathname: /dry3',
        [false, '/dry3', 'dry3'],
        'Pathname: /dry4',
        [false, '/dry4', true]
    ]);
    testResult = [];

    goRet = $H.go('/rewrite/test');
    deepEqual(goRet, true);
    deepEqual(location.pathname, '/rewrite/test');

    goRet = $H.go('/rewrite/test');
    deepEqual(goRet, true);
    deepEqual(location.pathname, '/rewrite/test');

    goRet = $H.go('/dry3');
    deepEqual(goRet, true);
    deepEqual(location.pathname, '/dry3');

    deepEqual(testResult, [
        'Pathname: /dry3',
        [false, '/dry3', 'dry3'],
        'Pathname: /dry3',
        [true, '/dry3', 'dry3'],
        'Pathname: /dry3',
        [true, '/dry3', 'dry3']
    ]);
});
