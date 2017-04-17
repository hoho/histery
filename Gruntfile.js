module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        eslint: {
            target: ['histery.js', 'Gruntfile.js']
        },

        uglify: {
            options: {
                preserveComments: 'some',
                report: 'gzip'
            },
            build: {
                src: 'histery.js',
                dest: 'histery.min.js'
            }
        },

        ts: {
            tests: {
                src: ['test/test*.ts'],
                outDir: 'test/build',
                options: {
                    target: 'es6',
                    verbose: true
                }
            }
        },

        qunit: {
            global: {
                options: {
                    urls: [
                        'http://localhost:3000/',
                        'http://localhost:3000/types/?hello=world#great',
                        'http://localhost:3000/dry'
                    ]
                }
            },
            amd: {
                options: {
                    urls: [
                        'http://localhost:3001/',
                        'http://localhost:3001/types/?hello=world#great',
                        'http://localhost:3001/dry'
                    ]
                }
            },
            common: {
                options: {
                    urls: [
                        'http://localhost:3002/',
                        'http://localhost:3002/types/?hello=world#great',
                        'http://localhost:3002/dry'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('testInit', function() {
        var http = require('http'),
            fs = require('fs'),
            routes = {
                '/qunit.css': 'node_modules/qunitjs/qunit/qunit.css',
                '/qunit.js': 'node_modules/qunitjs/qunit/qunit.js',
                '/histery.js': 'histery.js',
                '/histery.min.js': 'histery.min.js',
                '/test.js': 'test/build/test.js',
                '/test2.js': 'test/build/test2.js',
                '/test3.js': 'test/build/test3.js',
            };

        startServer(3000, {
            '/global.js': 'test/global.js',
            '/': 'test/index.html',
            '/types/?hello=world': 'test/index2.html',
            '/dry': 'test/index3.html'
        });
        startServer(3001, {
            '/amd.js': 'test/amd.js',
            '/': 'test/index.amd.html',
            '/types/?hello=world': 'test/index2.amd.html',
            '/dry': 'test/index3.amd.html'
        });
        startServer(3002, {
            '/commonjs.js': 'test/commonjs.js',
            '/': 'test/index.commonjs.html',
            '/types/?hello=world': 'test/index2.commonjs.html',
            '/dry': 'test/index3.commonjs.html'
        });

        function startServer(port, moreRoutes) {
            var r = Object.assign({}, routes, moreRoutes);
            http.createServer(function serve(req, res) {
                var file = r[req.url];

                if (file) {
                    fs.createReadStream(file).pipe(res);
                } else {
                    res.statusCode = 404;
                    res.end();
                }
            }).listen(port, 'localhost');

            grunt.log.writeln('Listening on port ' + port);
        }
    });

    grunt.registerTask('wait', function() {
        this.async();
    });

    grunt.registerTask('assert-version', function() {
        var assertVersion = require('assert-version'),
            error;

        error = assertVersion({
            'histery.js': '',
            'histery.d.ts': '',
            'bower.json': ''
        });

        if (error) {
            grunt.log.error(error);
            return false;
        }
    });

    grunt.registerTask('test', ['ts', 'testInit', 'qunit']);
    grunt.registerTask('serve', ['ts', 'testInit', 'wait']);
    grunt.registerTask('default', ['eslint', 'assert-version', 'uglify', 'test']);
};
