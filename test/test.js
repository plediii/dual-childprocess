/*jslint node: true */
"use strict";

var assert = require('assert');
var childModule = __dirname + '/test-child.js';
var dualapi = require('dualapi');
var fork = require('../index').fork;

describe('dual childprocess', function () {
    
    var d, childRoute;
    beforeEach(function (done) {
        d = dualapi();
        childRoute = ['whips'];
        fork(d, childRoute, childModule)
            .then(function () {
                done();
            });
    });

    afterEach(function (done) {
        d.mount(['disconnect'].concat(childRoute), function (ctxt) {
            assert.equal(0, ctxt.body);
            done();
        });
        d.send(childRoute.concat('terminate'));
    });

    describe('when child throws exception', function () {

        it('should trigger error on parent domain', function (done) {
            d.on(['error'], function (ctxt) {
                done();
            });
            d.send(childRoute.concat('causeException'));
        });

        it('should trigger error with subroute below child point ', function (done) {
            d.on(['error'].concat(childRoute).concat('**'), function () {
                done();
            });
            d.send(childRoute.concat('causeException'));
        });

        it('should trigger error with specific subroute from child ', function (done) {
            d.on(['error'].concat(childRoute).concat('causeException'), function () {
                done();
            });
            d.send(childRoute.concat('causeException'));
        });

        it('should trigger error on parent domain with original exception body', function (done) {
            d.on(['error'], function (ctxt) {
                assert.equal(ctxt.body.message, 'Crazy exception');
                done();
            });
            d.send(childRoute.concat('causeException'));
        });

        it('should trigger error on parent domain even when not in dual domain', function (done) {
            d.on(['error'], function () {
                done();
            });
            d.send(childRoute.concat('deepException'));
        });

    });

    describe('sending to child subroute', function () {

        it('should allow sending to child subroutes', function (done) {
            d.get(childRoute.concat('fouls'), { quelqu: 'un' }, { gold: 'fish' })
                .then(function (ctxt) {
                    done();
                });
            d.mount(['error'], function (ctxt) {
                console.log(ctxt.body);
                done(ctxt.to.join('/') + ' -> ' + JSON.stringify(ctxt.body));
            });
        });


        // it('should receive messages from client hosts', function (done) {
        //     d.get(childRoute.concat('fouls'))
        //     .then(function (ctxt) {
        //         done();
        //     });
        // });



        it('should send an error if it fails to boot', function () {

        });

        it('should send an error if a host throws exception', function () {

        });

    });

});
