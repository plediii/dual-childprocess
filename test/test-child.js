/*jslint node: true */
"use strict";

var dualapi = require('dualapi');
var assert = require('assert');
var _ = require('lodash');

var childDomain = require('../index').childDomain;

var domain = dualapi();

domain.mount({
    fouls: function (ctxt) {
        try {
        console.log('processing fouls');
        assert.equal(ctxt.body.quelqu, 'un');
        console.log('body ok');
        assert.equal(ctxt.options.gold, 'fish');
        console.log('replying...');
        return ctxt.reply({ bagel: 'jelly' }, { mind: 'new' });
        }
        catch(err) {
            console.log('caught ', err);
            throw err;
        }
    }
    , causeException: function (ctxt) {
        throw 'Crazy exception';
    }    
    , deepException: function (ctxt) {
        process.nextTick(function () {
            throw 'Deep exception';
        });
    }
    , terminate: function (ctxt) {
        return childDomain.terminate(0);
    }
});

childDomain(domain, ['parent'], ['stan']);
