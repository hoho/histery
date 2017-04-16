var _histery;

function getHistery() {
    return _histery;
}

function amdGetModuleAndRunTests() {
    // QUnit itself supports AMD, so defining `define` and
    // loading concat.js only after QUnit is loaded.
    window.define = function define(id, deps, factory) {
        var _currentHistery = _histery;
        var _currentDeps = deps;
        var e = {};
        factory(undefined, e);
        _histery = e.$H;

        QUnit.test('AMD definition', function(assert) {
            assert.ok(_currentHistery === undefined);
            assert.deepEqual(id, 'histery');
            assert.deepEqual(_currentDeps, ['require', 'exports']);
            assert.ok(window.$C === undefined);
        });
    }
    define.amd = true;

    var s = document.createElement('script');
    s.src = '/histery.min.js';
    s.onload = runTests;
    document.body.appendChild(s);
}
