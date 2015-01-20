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
                        console.log('got client message ', m);
                        d.send(m.to, point.concat(m.from));
                    });

                    d.mount(point.concat('::subroute'), function (ctxt) {
                        console.log('sending child message ', ctxt.to);
                        n.send({
                            to: ctxt.params.subroute
                            , from: ctxt.from
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
                console.log('got parent message ', m);
                d.send(m.to
                       , point.concat(m.from));
            });

            d.mount(point.concat('::subroute'), function (ctxt) {
                console.log('sending parent message ', ctxt);
                process.send({
                    to: ctxt.params.subroute
                    , from: ctxt.from
                });
            });
            
            console.log('sending index');
            process.send({
                to: ['index']
                , from: []
                , body: indexRoute
                , options: {}
            });
        }
    }
};

