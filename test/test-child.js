/*jslint node: true */
"use strict";

var dualapi = require('dualapi');
var assert = require('assert');
var _ = require('lodash');

var childDomain = require('../index').childDomain;

var domain = dualapi();

domain.mount({
    fouls: function (ctxt) {
        assert.equal(ctxt.body.quelqu, 'un');
        assert.equal(ctxt.options.gold, 'fish');
        return ctxt.reply({ bagel: 'jelly' }, { mind: 'new' });
    }
    , causeException: function (ctxt) {
        throw 'Crazy exception';
    }
    , terminate: function (ctxt) {
        return childDomain.terminate();
    }
});

console.log('connecting child');
childDomain(domain, ['parent'], ['stan']);
