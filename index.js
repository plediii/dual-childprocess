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
                        d.send(to, point.concat(m.from), m.body, m.options);
                    });

                    d.mount(point.concat('::subroute'), function (ctxt) {
                        n.send({
                            to: ctxt.params.subroute
                            , from: ctxt.from
                            , body: ctxt.body
                        });
                    });
                }
            };
            n.on('message', waitForIndex);
        });

    }
    , childDomain: function (d, point, indexRoute) {
        if (_.isFunction(process.send)) {
            process.on('message', function (m) {
                d.send(m.to
                       , point.concat(m.from));
            });

            d.mount(point.concat('::subroute'), function (ctxt) {
                process.send({
                    to: ctxt.params.subroute
                    , from: ctxt.from
                });
            });
            d.mount(['error'], function (ctxt) {
                process.send({
                    to: ctxt.to
                    , from: ctxt.from
                    , body: ctxt.body
                    , options: ctxt.options
                });
            });
            
            process.send({
                to: ['index']
                , from: []
                , body: indexRoute
                , options: {}
            });

            process.on('uncaughtException', function(err) {
                process.send({
                    to: ['error']
                    , from: ['uncaughtException']
                    , body: err
                    , options: {}
                });
            });

        }
    }
};

