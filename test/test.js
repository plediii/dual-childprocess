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
        console.log('starting child', childRoute);
        fork(d, childRoute, childModule)
            .then(function () {
                done();
            });
    });

    afterEach(function () {
        console.log('terminating client.');
        
    });

    it('should trigger error on parent domain when exceptions', function (done) {
        d.on(['error'], function () {
            done();
        });
        d.send(childRoute.concat('causeException'));
    });


    it('should allow sending to child subroutes', function (done) {
        console.log('going to send to ', childRoute);
        d.get(childRoute.concat('fouls'), { quelqu: 'un' }, { gold: 'fish' })
            .then(function (ctxt) {
                console.log('fouls response: ', ctxt);
                done();
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
