/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

var mediator = require('mediator-js');
var _mediatorInstance = null;

var UnchartedMediator = /* istanbul ignore next:Wrapper function */ function UnchartedMediator(m) {
    var t = this;
    var _mediator;
    var init = function (Mediator) {
        // make library available globally
        _mediator = new Mediator();
    };
    t.publish = function () {
        return _mediator.publish.apply(_mediator, arguments);
    };
    // options include: predicate: function(args), priority: [0|1|..], calls: [1,2..]
    t.subscribe = function (channel, callback, options, context) {
        return _mediator.subscribe(channel, callback, options, context);
    };
    t.remove = function (channel, cb) {
        return _mediator.remove(channel, cb);
    };
    init(m);
    return t;
};

module.exports = /* istanbul ignore next */ (function () {
    if (!_mediatorInstance) {
        // NOTE: In Webpack (AMD), the Mediator constructor is on the top-level of the require
        _mediatorInstance = new UnchartedMediator(mediator.Mediator || mediator);
    }
    return _mediatorInstance;
}());

module.exports.registerGlobal = /* istanbul ignore next */ function () {
    if (!global._uncharted) global._uncharted = {};
    global._uncharted.Mediator = module.exports;
};
