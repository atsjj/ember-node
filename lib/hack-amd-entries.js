var glob = require('glob');
var path = require('path');

var Ember = require(path.join(process.cwd(), 'lib', 'ember'));
var config = require(path.join(process.cwd(), 'config', 'environment'))('');

var requirejs = { entries: {} };

var basePath = path.join(process.cwd(), 'app');
var entries = glob.sync(path.join(basePath, '**', '*.js'));

entries.forEach(function(entry) {
  var name = entry
    .replace(basePath + '/', '')
    .replace('.js', '');

  requirejs.entries[config.modulePrefix + '/' + name] = entry;
});

module.exports = requirejs;
