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
                    urls: ['http://localhost:3000/', 'http://localhost:3000/types/?hello=world#great']
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
                '/types/?hello=world': 'test/index2.html'
            };

        http.createServer(function serve(req, res) {
            fs.createReadStream(routes[req.url]).pipe(res);
        }).listen(3000, 'localhost');

        grunt.log.writeln('Listening on port 3000');
    });

    grunt.registerTask('test', ['testInit', 'qunit']);

    grunt.registerTask('default', ['jshint', 'uglify', 'test']);
};
