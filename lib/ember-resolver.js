var path = require('path');
var Ember = require(path.join(process.cwd(), 'lib', 'ember'));
var requirejs = require(path.join(process.cwd(), 'lib', 'hack-amd-entries'));

function classFactory(klass) {
  return {
    create: function (injections) {
      if (typeof klass.extend === 'function') {
        return klass.extend(injections);
      } else {
        return klass;
      }
    }
  };
}

if (!(Object.create && !Object.create(null).hasOwnProperty)) {
  throw new Error("This browser does not support Object.create(null), please polyfil with es5-sham: http://git.io/yBU2rg");
}

function makeDictionary() {
  var cache = Object.create(null);
  cache['_dict'] = null;
  delete cache['_dict'];
  return cache;
}

var underscore = Ember.String.underscore;
var classify = Ember.String.classify;
var get = Ember.get;

function parseName(fullName) {
  /*jshint validthis:true */

  if (fullName.parsedName === true) { return fullName; }

  var prefixParts = fullName.split('@');
  var prefix;

  if (prefixParts.length === 2) {
    if (prefixParts[0].split(':')[0] === 'view') {
      prefixParts[0] = prefixParts[0].split(':')[1];
      prefixParts[1] = 'view:' + prefixParts[1];
    }

    prefix = prefixParts[0];
  }

  var nameParts = prefixParts[prefixParts.length - 1].split(":");
  var type = nameParts[0], fullNameWithoutType = nameParts[1];
  var name = fullNameWithoutType;
  var namespace = get(this, 'namespace');
  var root = namespace;

  return {
    parsedName: true,
    fullName: fullName,
    prefix: prefix || this.prefix({type: type}),
    type: type,
    fullNameWithoutType: fullNameWithoutType,
    name: name,
    root: root,
    resolveMethodName: "resolve" + classify(type)
  };
}

function chooseModuleName(moduleEntries, moduleName) {
  var underscoredModuleName = Ember.String.underscore(moduleName);

  if (moduleName !== underscoredModuleName && moduleEntries[moduleName] && moduleEntries[underscoredModuleName]) {
    throw new TypeError("Ambiguous module names: `" + moduleName + "` and `" + underscoredModuleName + "`");
  }

  if (moduleEntries[moduleName]) {
    return moduleName;
  } else if (moduleEntries[underscoredModuleName]) {
    return underscoredModuleName;
  } else {
    // workaround for dasherized partials:
    // something/something/-something => something/something/_something
    var partializedModuleName = moduleName.replace(/\/-([^\/]*)$/, '/_$1');

    if (moduleEntries[partializedModuleName]) {
      Ember.deprecate('Modules should not contain underscores. ' +
                      'Attempted to lookup "'+moduleName+'" which ' +
                      'was not found. Please rename "'+partializedModuleName+'" '+
                      'to "'+moduleName+'" instead.', false);

      return partializedModuleName;
    } else {
      return moduleName;
    }
  }
}

function resolveOther(parsedName) {
  /*jshint validthis:true */

  Ember.assert('module prefix must be defined', this.namespace.modulePrefix);

  var normalizedModuleName = this.findModuleName(parsedName);

  if (normalizedModuleName) {
    var module = require(requirejs.entries[normalizedModuleName]);

    if (module && module['default']) { module = module['default']; }

    if (module === undefined) {
      throw new Error(" Expected to find: '" + parsedName.fullName + "' within '" + normalizedModuleName + "' but got 'undefined'. Did you forget to `export default` within '" + normalizedModuleName + "'?");
    }

    if (this.shouldWrapInClassFactory(module, parsedName)) {
      module = classFactory(module);
    }

    return module;
  } else {
    return this._super(parsedName);
  }
}

module.exports = Ember.DefaultResolver.extend({
  resolveOther: resolveOther,
  resolveTemplate: resolveOther,
  pluralizedTypes: null,

  makeToString: function(factory, fullName) {
    return '' + this.namespace.modulePrefix + '@' + fullName + ':';
  },
  parseName: parseName,
  shouldWrapInClassFactory: function(module, parsedName){
    return false;
  },
  init: function() {
    this._super();
    this._normalizeCache = makeDictionary();

    this.pluralizedTypes = this.pluralizedTypes || makeDictionary();

    if (!this.pluralizedTypes.config) {
      this.pluralizedTypes.config = 'config';
    }
  },
  normalize: function(fullName) {
    return this._normalizeCache[fullName] || (this._normalizeCache[fullName] = this._normalize(fullName));
  },
  _normalize: function(fullName) {
    // replace `.` with `/` in order to make nested controllers work in the following cases
    // 1. `needs: ['posts/post']`
    // 2. `{{render "posts/post"}}`
    // 3. `this.render('posts/post')` from Route
    var split = fullName.split(':');
    if (split.length > 1) {
      return split[0] + ':' + Ember.String.dasherize(split[1].replace(/\./g, '/'));
    } else {
      return fullName;
    }
  },

  pluralize: function(type) {
    return this.pluralizedTypes[type] || (this.pluralizedTypes[type] = type + 's');
  },

  podBasedLookupWithPrefix: function(podPrefix, parsedName) {
    var fullNameWithoutType = parsedName.fullNameWithoutType;

    if (parsedName.type === 'template') {
      fullNameWithoutType = fullNameWithoutType.replace(/^components\//, '');
    }

      return podPrefix + '/' + fullNameWithoutType + '/' + parsedName.type;
  },

  podBasedModuleName: function(parsedName) {
    var podPrefix = this.namespace.podModulePrefix || this.namespace.modulePrefix;

    return this.podBasedLookupWithPrefix(podPrefix, parsedName);
  },

  podBasedComponentsInSubdir: function(parsedName) {
    var podPrefix = this.namespace.podModulePrefix || this.namespace.modulePrefix;
    podPrefix = podPrefix + '/components';

    if (parsedName.type === 'component' || parsedName.fullNameWithoutType.match(/^components/)) {
      return this.podBasedLookupWithPrefix(podPrefix, parsedName);
    }
  },

  mainModuleName: function(parsedName) {
    // if router:main or adapter:main look for a module with just the type first
    var tmpModuleName = parsedName.prefix + '/' + parsedName.type;

    if (parsedName.fullNameWithoutType === 'main') {
      return tmpModuleName;
    }
  },

  defaultModuleName: function(parsedName) {
    return parsedName.prefix + '/' +  this.pluralize(parsedName.type) + '/' + parsedName.fullNameWithoutType;
  },

  prefix: function(parsedName) {
    var tmpPrefix = this.namespace.modulePrefix;

    if (this.namespace[parsedName.type + 'Prefix']) {
      tmpPrefix = this.namespace[parsedName.type + 'Prefix'];
    }

    return tmpPrefix;
  },

  /**

    A listing of functions to test for moduleName's based on the provided
    `parsedName`. This allows easy customization of additional module based
    lookup patterns.

    @property moduleNameLookupPatterns
    @returns {Ember.Array}
  */
  moduleNameLookupPatterns: Ember.computed(function(){
    return Ember.A([
      this.podBasedModuleName,
      this.podBasedComponentsInSubdir,
      this.mainModuleName,
      this.defaultModuleName
    ]);
  }),

  findModuleName: function(parsedName, loggingDisabled){
    var self = this;
    var moduleName;

    this.get('moduleNameLookupPatterns').find(function(item) {
      var moduleEntries = requirejs.entries;
      var tmpModuleName = item.call(self, parsedName);

      // allow treat all dashed and all underscored as the same thing
      // supports components with dashes and other stuff with underscores.
      if (tmpModuleName) {
        tmpModuleName = chooseModuleName(moduleEntries, tmpModuleName);
      }

      if (tmpModuleName && moduleEntries[tmpModuleName]) {
        if (!loggingDisabled) {
          self._logLookup(true, parsedName, tmpModuleName);
        }

        moduleName = tmpModuleName;
      }

      if (!loggingDisabled) {
        self._logLookup(moduleName, parsedName, tmpModuleName);
      }

      return moduleName;
    });

    return moduleName;
  },

  // used by Ember.DefaultResolver.prototype._logLookup
  lookupDescription: function(fullName) {
    var parsedName = this.parseName(fullName);

    var moduleName = this.findModuleName(parsedName, true);

    return moduleName;
  },

  // only needed until 1.6.0-beta.2 can be required
  _logLookup: function(found, parsedName, description) {
    if (!Ember.ENV.LOG_MODULE_RESOLVER && !parsedName.root.LOG_RESOLVER) {
      return;
    }

    var symbol, padding;

    if (found) { symbol = '[✓]'; }
    else       { symbol = '[ ]'; }

    if (parsedName.fullName.length > 60) {
      padding = '.';
    } else {
      padding = new Array(60 - parsedName.fullName.length).join('.');
    }

    if (!description) {
      description = this.lookupDescription(parsedName);
    }

    Ember.Logger.info(symbol, parsedName.fullName, padding, description);
  }
});
