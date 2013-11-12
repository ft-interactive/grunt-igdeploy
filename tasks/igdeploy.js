/*
 * grunt-igdeploy
 * https://github.com/ft-interactive/grunt-igdeploy
 *
 * Copyright (c) 2013 Financial Times
 */

'use strict';

module.exports = function (grunt) {

  // Load dependencies
  var extend = require('extend'),
      path = require('path'),
      fs = require('fs'),
      Connection = require('ssh2'),
      async = require('async'),
      chalk = require('chalk'),
      _ = require('underscore');

  // Shortcuts for convenience
  var log = grunt.log.ok;
  var cyan = chalk.cyan;

  // Function to find the closest file with the given name on the local filesystem - looking
  // first in the current directory, then in the parent, etc.
  var findClosestFile = function (name) {
    var dir, filePath, stats;
    if (typeof name !== 'string' || !name.length)
      throw new Error('Not understood: ' + name);
    
    while (dir !== (dir = path.dirname(dir))) {
      filePath = path.join(dir, name);
      if (fs.existsSync(filePath)) {
        stats = fs.statSync(filePath);
        // console.log(filePath);
        if (stats.isFile(filePath))
          return filePath;
      }
    }
    return null;
  };

  // The igdeploy task
  grunt.registerTask('igdeploy', 'Deploy projects to the FTI static server.', function (target) {

    var done = this.async();

    // Build options object
    var options = this.options({
      port: 22,
      targetRoot: ''
    });

    // Verify that one of the targets is selected
    if (!options.targets[target]) {
      grunt.log.warn('Deploy target "' + target + '" not found in config.');
      grunt.log.warn('Available deploy targets: ' + _.keys(options.targets).join(', '));
      grunt.log.fatal('Cannot continue.');
    }

    // Find the closest .igdeploy file and merge it into the options
    var extraConfigPath = findClosestFile('.igdeploy');
    if (extraConfigPath) {
      log('Using additional config from ' + extraConfigPath); // TODO: specify which actual file, if not the local one.
      extend(true, options, grunt.file.readJSON(extraConfigPath));
    }

    // console.log('options', options);

    function briefName(name) {
      // Return a 'brief' version of a remote filename, for logging purposes.
      if (options.targetRoot && name.substring(0,options.targetRoot.length) === options.targetRoot)
        return name.substring(options.targetRoot.length + 1);
      return name;
    }

    // Connect to server!
    var c = new Connection();
    c.on('connect', function () {
      log('Connected to ' + options.server);
    });

    c.on('end', function () {
      log('Disconnected');
      done();
    });

    c.on('banner', function (message) {
      grunt.log.writeln(message);
    });

    c.on('keyboard-interactive', function (name, instructions, instructionsLang, prompts, finish) {
      if (prompts) {
        for (var i = prompts.length - 1; i >= 0; i--) {
          if (prompts[i].prompt === 'Password: ') {
            log('Signing in as ' + options.username);
            finish([options.password]);
            return;
          }
        }
      }
      finish();
    });

    c.on('ready', function () {
      log('Authenticated');

      // Upload all files
      // log('options', options);

      var remoteDir = options.targets[target][0] === '/' ? options.targets[target] : path.join(options.targetRoot, options.targets[target]),
          remoteDirTempOld = remoteDir + '_IGDEPLOY_OLD',
          remoteDirTempNew = remoteDir + '_IGDEPLOY_NEW',
          remoteDirBasename = path.basename(remoteDir),
          remoteDirTempOldBasename = path.basename(remoteDirTempOld),
          remoteDirTempNewBasename = path.basename(remoteDirTempNew);

      c.sftp(function (err, sftp) {
        if (err) throw err;

        log(chalk.yellow('SFTP starting'));

        // Helpers
        var uploadDirectory = function (localDirName, remoteDirName, callback) {
          // log(cyan('UPLOADING DIRECTORY'), localDirName, cyan('-->'), remoteDirName);

          // Ensure it doesn't already exist
          sftp.stat(remoteDirName, function (err, stats) {
            if (!err) {
              grunt.log.warn(chalk.red('Problem'), 'Something already exists at ' + remoteDirName);
              grunt.log.warn('Please delete it.');
              grunt.fail.fatal('Cannot continue if file already exists.');
            }
            else {
              remoteMkdirp(remoteDirName, function () {
                log(cyan('Created'), briefName(remoteDirName));

                // Now we need to asynchronously upload everything!
                var allLocalFiles = fs.readdirSync(localDirName);

                async.eachSeries(allLocalFiles, function (item, cb) {
                  // console.log('ITEM: ', item);
                  var from = path.join(localDirName, item),
                      to = path.join(remoteDirName, item);

                  // First check it's actually a file
                  var stats = fs.statSync(from);
                  if (stats.isFile()) {
                    sftp.fastPut(from, to, function (err) {
                      if (err)
                        cb(err);
                      else {
                        log(cyan('Uploaded'), item);
                        cb(null);
                      }
                    });
                  }
                  else if (stats.isDirectory()) {
                    // log('RECURSING uploadDirectory', from, to);
                    uploadDirectory(from, to, cb);
                  }
                  else {
                    console.log('Unknown object', stats);
                    throw new Error('Neither file nor directory: ' + from);
                  }
                }, function (err) {
                  if (err) {
                    grunt.log.warn(chalk.red('Problem'));
                    throw err;
                  }
                  callback();
                });
              });
            }
          });
        };

        var remoteMkdirp = function (dir, callback) {
          var pathParts = dir.split('/');
          if (pathParts[0] !== '')
            throw new Error('Should never happen!');
          pathParts.shift();
          // console.log('pathParts', pathParts);

          var currentDir = '/';
          function next() {
            var nextPart = pathParts.shift();
            // console.log('NEXT PART', nextPart);

            if (nextPart) {
              currentDir = path.join(currentDir, nextPart);
              // console.log(cyan('Verifying exists'), currentDir);

              sftp.stat(currentDir, function (err, stats) {
                if (err) {
                  // console.log('...' + chalk.green('no.'), 'Creating...');
                  sftp.mkdir(currentDir, {mode: '775'}, function (err) {
                    if (err) throw err;
                    // console.log('...done creating!');
                    next();
                  });
                }
                else if (stats.isDirectory()) {
                  // console.log('...' + chalk.green('yes.'));
                  next();
                }
                else {
                  console.dir(stats);
                  grunt.fatal('Something (not a directory) already exists at: ' + currentDir);
                }
              });
            }
            else {
              // log(cyan('mkdirp'), dir);
              callback();
            }
          }
          next();
        };

        var mvRemoteDirectory = function (oldPath, newPath, opts, callback) {
          if (typeof opts === 'function' && !callback) {
            callback = opts;
            opts = {};
          }
          
          sftp.rename(oldPath, newPath, function (err) {
            if (err) {
              if (opts.strict === true)
                throw err;
              else
                callback(false);
            }
            else {
              log(cyan('Renamed'), briefName(oldPath), cyan('--->'), briefName(newPath));
              callback(true);
            }
          });
        };

        // var deleteRemoteDirectory = function (dir, callback) {

        // };

        function closeUpSFTP() {
          log('Closing SFTP');
          sftp.end();
          // c.end();
        }
        // End helpers

        sftp.on('close', function () {
          log(chalk.yellow('SFTP session closed'));
          c.end();
        });

        uploadDirectory(options.src, remoteDirTempNew, function () {
          log(cyan('All files uploaded!'));

          mvRemoteDirectory(remoteDir, remoteDirTempOld, {strict: false}, function (movedOldOne) {

            mvRemoteDirectory(remoteDirTempNew, remoteDir, function () {

              if (movedOldOne) {
                log('ATTEMPTING TO DELETE DIRECTORY...', remoteDirTempOld);

                c.exec('rm -rf "' + remoteDirTempOld + '"', function (err, stream) {
                  if (err) throw err;

                  log(cyan('Deleted'), remoteDirTempOldBasename);
                  // console.log('stream', stream);
                  closeUpSFTP();
                });
              }
              else {
                closeUpSFTP(); // ENDS
              }
            });
          });
        });
      });
    });

    // Start the connection
    c.connect({
      host: options.server,
      port: options.port,
      username: options.username,
      password: options.password,
      tryKeyboard: true
    });
  });
};
