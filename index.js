/*jslint node: true */
"use strict";

var dualapi = require('dualapi');
var Promise = require('bluebird');
var cp = require('child_process');
var _ = require('lodash');

module.exports = {
    fork: function (d, point, modulePath) {
        return new Promise(function (resolve, reject) {
            var n = cp.fork(modulePath);
            
            var waitForIndex = function (m) {
                if (_.isEqual(m.to, ['index'])) {
                    n.removeListener('message', waitForIndex);
                    resolve();

                    n.on('message', function(m) {
                        var to = m.to;
                        if (to[0] === 'error') {
                            to = ['error'].concat(point).concat(to.slice(1));
                        }
                        console.log('child message: ', m);
                        d.send(to, point.concat(m.from), JSON.parse(m.body), m.options);
                    });

                    d.mount(point.concat('::subroute'), function (ctxt) {
                        console.log('parent sending to child ', ctxt);
                        var msg = {
                            to: ctxt.params.subroute
                            , from: ctxt.from
                        };
                        if (ctxt.hasOwnProperty('body')) {
                            msg.body = JSON.stringify(ctxt.body);
                        }
                        n.send(msg);
                    });
                }
            };
            n.on('message', waitForIndex);
            n.on('exit', function (code) {
                d.send(['disconnect'].concat(point), point, code);
            });
        });

    }
    , childDomain: function (d, point, indexRoute) {
        if (_.isFunction(process.send)) {
            process.on('message', function (m) {
                console.log(' message from parent to parse: ', m);
                d.send(m.to
                       , point.concat(m.from)
                       , JSON.parse(m.body)
                       , m.options);
            });

            d.mount(point.concat('::subroute'), function (ctxt) {
                console.log('message to parent to send ', ctxt);
                process.send({
                    to: ctxt.params.subroute
                    , from: ctxt.from
                    , body: JSON.stringify(m.body)
                    , options: m.options
                });
            });
            d.mount(['error'], function (ctxt) {
                console.log('child error ', ctxt);
                process.send({
                    to: ctxt.to
                    , from: ctxt.from
                    , body: JSON.stringify(ctxt.body)
                    , options: ctxt.options
                });
            });
            
            process.send({
                to: ['index']
                , from: []
                , body: JSON.stringify(indexRoute)
                , options: {}
            });

            process.on('uncaughtException', function(err) {
                console.log('uncaught exception: ', typeof err, err);
                console.log(err.stack);
                console.log('stringified uncaught exception: ', JSON.stringify(err));
                process.send({
                    to: ['error']
                    , from: ['uncaughtException']
                    , body: JSON.stringify(err)
                    , options: {}
                });
            });

        }
    }
};

module.exports.childDomain.terminate = function (code) {
    if (code !== 0) {
        code = code || 1;
    }
    process.exit(code);
};
