module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: {
                src: ['histery.js', 'Gruntfile.js'],
                options: {
                    jshintrc: '.jshintrc'
                }
            }
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

        qunit: {
            all: {
                options: {
                    urls: [
                        'http://localhost:3000/',
                        'http://localhost:3000/types/?hello=world#great',
                        'http://localhost:3000/dry'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('testInit', function() {
        var http = require('http'),
            fs = require('fs'),
            routes = {
                '/': 'test/index.html',
                '/qunit.css': 'node_modules/qunitjs/qunit/qunit.css',
                '/qunit.js': 'node_modules/qunitjs/qunit/qunit.js',
                '/histery.js': 'histery.js',
                '/test.js': 'test/test.js',
                '/test2.js': 'test/test2.js',
                '/test3.js': 'test/test3.js',
                '/types/?hello=world': 'test/index2.html',
                '/dry': 'test/index3.html'
            };

        http.createServer(function serve(req, res) {
            var file = routes[req.url];

            if (file) {
                fs.createReadStream(file).pipe(res);
            } else {
                res.statusCode = 404;
                res.end();
            }
        }).listen(3000, 'localhost');

        grunt.log.writeln('Listening on port 3000');
    });

    grunt.registerTask('wait', function() {
        this.async();
    });

    grunt.registerTask('test', ['testInit', 'qunit']);
    grunt.registerTask('serve', ['testInit', 'wait']);
    grunt.registerTask('default', ['jshint', 'uglify', 'test']);
};
