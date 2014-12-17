var path = require('path');
var Ember = require(path.join(process.cwd(), 'lib', 'ember'));

module.exports = Ember.Route.extend({
  model: function() {
    console.log('hello from index route!');
  }
});
