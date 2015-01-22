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
            
            var waitForIndex = function (indexMsg) {
                if (_.isEqual(indexMsg.to, ['index'])) {
                    n.on('message', function(m) {
                        var to = m.to;
                        if (to[0] === 'error') {
                            to = ['error'].concat(point).concat(to.slice(1));
                        }
                        d.send(to, point.concat(m.from), JSON.parse(m.body), m.options);
                    });

                    d.mount(point.concat('::subroute'), function (ctxt) {
                        var msg = {
                            to: ctxt.params.subroute
                            , from: ctxt.from
                            , options: ctxt.options
                        };
                        if (ctxt.hasOwnProperty('body')) {
                            msg.body = JSON.stringify(ctxt.body);
                        }
                        n.send(msg);
                    });

                    n.removeListener('message', waitForIndex);
                    resolve();
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
                var body = void 0;
                var bodyStr = m.body;
                if (_.isString(bodyStr)) {
                    body = JSON.parse(bodyStr)
                }
                d.send(m.to
                       , point.concat(m.from)
                       , body
                       , m.options);
            });

            d.mount(point.concat('::subroute'), function (ctxt) {
                process.send({
                    to: ctxt.params.subroute
                    , from: ctxt.from
                    , body: JSON.stringify(ctxt.body)
                    , options: ctxt.options
                });
            });

            d.mount(['error'], function (ctxt) {
                var msg = ctxt.body.message;
                var body = ctxt.body;
                if (msg instanceof Error) {
                    body.message = msg.stack;
                }
                process.send({
                    to: ctxt.to
                    , from: ctxt.from
                    , body: JSON.stringify(ctxt.body)
                    , options: ctxt.options
                });
            });
            
            process.on('uncaughtException', function(err) {
                process.send({
                    to: ['error']
                    , from: ['uncaughtException']
                    , body: JSON.stringify(err)
                    , options: {}
                });
            });

            process.send({
                to: ['index']
                , from: []
                , body: JSON.stringify(indexRoute)
                , options: {}
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
