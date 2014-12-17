var path = require('path');
var containerDebugAdapter = require(path.join(process.cwd(), 'lib', 'ember-container-debug-adapter'));

module.exports = {
  name: "containerDebugAdapter",

  initialize: function(container, application) {
    application.register('container-debug-adapter:main', containerDebugAdapter);
  }
};
