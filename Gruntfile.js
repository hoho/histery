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
                    urls: ['http://localhost:3000/']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    var webserver;

    grunt.registerTask('testInit', function() {
        var express = require('express');
        webserver = express();
        webserver.get('/histery.js', function(req, res) { res.sendfile('histery.js'); });
        webserver.get('/qunit.css', function(req, res) { res.sendfile('node_modules/qunitjs/qunit/qunit.css'); });
        webserver.get('/qunit.js', function(req, res) { res.sendfile('node_modules/qunitjs/qunit/qunit.js'); });
        webserver.get('/jquery.js', function(req, res) { res.sendfile('node_modules/jquery-browser/lib/jquery.js'); });
        webserver.get('/test.js', function(req, res) { res.sendfile('test/test.js'); });
        webserver.get('/', function(req, res) { res.sendfile('test/index.html'); });
        webserver = webserver.listen(3000);
        grunt.log.writeln('Listening on port 3000');
    });
    grunt.registerTask('testCleanup', function() {
        grunt.log.writeln('Shutting down server on port 3000');
        webserver.close();
    });
    grunt.registerTask('test', ['testInit', 'qunit', 'testCleanup']);

    grunt.registerTask('default', ['jshint', 'uglify', 'test']);
};
