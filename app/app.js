var path = require('path');

var Ember = require(path.join(process.cwd(), 'lib', 'ember'));
var Resolver = require(path.join(process.cwd(), 'lib', 'ember-resolver'));

var config = require(path.join(process.cwd(), 'config', 'environment'))('development');
var loadInitializers = require(path.join(process.cwd(), 'lib', 'ember-load-initializers'));

global.window = { EmberENV: config.EmberENV };

var App = Ember.Application.create(Ember.merge({
  modulePrefix: config.modulePrefix,
  Resolver: Resolver
}, config.APP));

loadInitializers(App, config.modulePrefix);

module.exports = App;
