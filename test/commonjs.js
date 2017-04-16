var _histery;

function getHistery() {
    return _histery;
}

window.module = {exports: {}};
window.exports = module.exports;
window.require = function() { throw new Error('Should not be called'); };

function commonjsGetModuleAndRunTests() {
    var _globalHistery = window.$H;

    QUnit.test('CommonJS definition', function(assert) {
        assert.ok(_globalHistery === undefined);
        assert.ok(!!exports.$H);
    });

    _histery = exports.$H;

    runTests();
}
