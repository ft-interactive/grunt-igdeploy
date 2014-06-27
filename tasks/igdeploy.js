/*
 * grunt-igdeploy
 * https://github.com/ft-interactive/grunt-igdeploy
 *
 * Copyright (c) 2013 Financial Times
 */

'use strict';

var igdeploy = require('igdeploy');

module.exports = function (grunt) {
  grunt.registerMultiTask('igdeploy', 'Deploy projects to the FTI static server.', function () {
    var done = this.async();

    var options = this.options();

    igdeploy(options, done);
  });
};
