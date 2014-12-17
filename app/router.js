var path = require('path');
var Ember = require(path.join(process.cwd(), 'lib', 'ember'));

var Router = Ember.Router.extend({
  location: 'none'
});

Router.map(function() {
});

module.exports = Router;
