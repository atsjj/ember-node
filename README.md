Ember.js in Node
================

Ember running in Node, with hacky resolver and debug adapter.

## About

A recent PR ([emberjs/ember.js#9941](https://github.com/emberjs/ember.js/pull/9941))
was created that allows Ember.js to run in Node. This repository utilizes
`ember.debug.cjs.js` (renamed as `ember.js`), with some hacks applied to:

* [ember-resolver](https://github.com/stefanpenner/ember-resolver)
* [container-debug-adapter](https://github.com/stefanpenner/ember-resolver)
* [ember-load-initializers](https://github.com/stefanpenner/ember-load-initializers)

The hack involved shims the `requirejs.entries` variable; the secret sauce to
loader used by ember-cli (stefanpenner/ember-cli).

Finally, keep in mind the shippable goal was proof-of-concept. Use at your own
risk!

## Running

1. Ensure that Node.js is installed.
2. Run `node app/app.js` to see for yourself.

## Hacking

This project expects to be setup in the same way as any
[ember-cli](https://github.com/stefanpenner/ember-cli) project. Therefore, the
`app` directory should follow the same rules.

## License

ember-node is [MIT Licensed](https://github.com/atsjj/ember-node/blob/master/LICENSE).
