var path = require('path');
var Ember = require(path.join(process.cwd(), 'lib', 'ember'));
var requirejs = require(path.join(process.cwd(), 'lib', 'hack-amd-entries'));

module.exports = function(app, prefix) {
  var initializersRegExp = new RegExp('^' + prefix + '/initializers');

  Ember.keys(requirejs.entries).filter(function(key) {
    return initializersRegExp.test(key);
  }).forEach(function(moduleName) {
    var module = require(requirejs.entries[moduleName]);
    if (!module) { throw new Error(moduleName + ' must export an initializer.'); }

    var initializer = module;
    if (!initializer.name) {
      var initializerName = moduleName.match(/[^\/]+\/?$/)[0];
      initializer.name = initializerName;
    }

    app.initializer(initializer);
  });
}
