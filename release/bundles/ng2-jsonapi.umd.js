(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@briisk/http-wrapper'), require('@angular/core'), require('rxjs'), require('@angular/http')) :
	typeof define === 'function' && define.amd ? define(['exports', '@briisk/http-wrapper', '@angular/core', 'rxjs', '@angular/http'], factory) :
	(factory((global.briisk = global.briisk || {}, global.briisk['ng2-jsonapi'] = {}),global.httpWrapper,global.ng.core,global.rxjs,global.http));
}(this, (function (exports,httpWrapper,core,rxjs,http) { 'use strict';

var serializer = require('jsonapi-serializer').Serializer;
var deserializer = require('jsonapi-serializer').Deserializer;
var inflector = require('inflected');
var JSONAPIRequest = (function () {
    function JSONAPIRequest(data, meta, links) {
        this.data = data;
        this.meta = meta;
        this.links = links;
    }
    JSONAPIRequest.createPagination = function (data, pageCount, links) {
        return new JSONAPIRequest(data, { pageCount: pageCount }, links);
    };
    return JSONAPIRequest;
}());
var JSONAPIError = (function () {
    function JSONAPIError(status, errors) {
        this.status = status;
        this.errors = errors;
    }
    return JSONAPIError;
}());
var JSONAPIObject = (function () {
    function JSONAPIObject(data, name, attrs, relations, meta) {
        if (relations === void 0) { relations = {}; }
        this.data = data;
        this.name = name;
        this.relations = relations;
        this.meta = meta;
        this.setAttributes(attrs, data);
    }
    JSONAPIObject.prototype.setAttributes = function (attrs, data) {
        if (!attrs) {
            this.makeAttributesFromData(data);
        }
        else {
            this.attrs = attrs;
        }
    };
    JSONAPIObject.prototype.makeAttributesFromData = function (data) {
        if (typeof data === 'object' && !!data) {
            if (!!data.length) {
                this.attrs = Object.keys(data[0]);
                this.createRelations(data[0]);
            }
            else {
                this.attrs = Object.keys(data);
                this.createRelations(data);
            }
        }
    };
    JSONAPIObject.prototype.createRelations = function (data) {
        var _this = this;
        Object.keys(data)
            .filter(function (key) { return data.hasOwnProperty(key) && typeof data[key] === 'object' && !!data[key]; })
            .filter(function (key) { return !_this.relations[key]; })
            .forEach(function (key) {
            _this.relations[key] = {
                attributes: Object.keys(!!data[key].length ? data[key][0] : data[key]),
                ref: function (_, relationObject) { return relationObject.id; }
            };
        });
    };
    return JSONAPIObject;
}());
var JSONAPI = (function () {
    function JSONAPI(httpWrapper$$1) {
        this.httpWrapper = httpWrapper$$1;
        this.requestInterceptors = [];
        this.errorInterceptors = [];
    }
    JSONAPI.prototype.get = function (url, relationshipsObject, options) {
        if (relationshipsObject === void 0) { relationshipsObject = {}; }
        return this.deserialize(this.httpWrapper.get(url, options), relationshipsObject);
    };
    JSONAPI.prototype.post = function (url, obj, relationshipsObject, options) {
        if (relationshipsObject === void 0) { relationshipsObject = {}; }
        return this.deserialize(this.httpWrapper.post(url, this.serialize(obj), options), relationshipsObject);
    };
    JSONAPI.prototype.put = function (url, obj, relationshipsObject, options) {
        if (relationshipsObject === void 0) { relationshipsObject = {}; }
        return this.deserialize(this.httpWrapper.put(url, this.serialize(obj), options), relationshipsObject);
    };
    JSONAPI.prototype.patch = function (url, obj, relationshipsObject, options) {
        if (relationshipsObject === void 0) { relationshipsObject = {}; }
        return this.deserialize(this.httpWrapper.patch(url, this.serialize(obj), options), relationshipsObject);
    };
    JSONAPI.prototype.delete = function (url, relationshipsObject, options) {
        if (relationshipsObject === void 0) { relationshipsObject = {}; }
        return this.deserialize(this.httpWrapper.delete(url, options), relationshipsObject);
    };
    JSONAPI.prototype.addRequestInterceptor = function (fn) {
        this.requestInterceptors.push(fn);
    };
    JSONAPI.prototype.addErrorInterceptor = function (fn) {
        this.errorInterceptors.push(fn);
    };
    JSONAPI.prototype.serialize = function (obj) {
        var opts = Object.assign({
            attributes: obj.attrs,
            meta: obj.meta
        }, obj.relations);
        var dataSerializer = new serializer(obj.name, opts);
        return dataSerializer.serialize(obj.data);
    };
    JSONAPI.prototype.camelize = function (obj) {
        if (!!obj && typeof obj === 'object') {
            Object.keys(obj)
                .filter(function (key) { return obj.hasOwnProperty(key); })
                .map(function (key) {
                return {
                    newKey: inflector.camelize(inflector.underscore(key), false),
                    oldKey: key
                };
            })
                .filter(function (keys) { return keys.newKey !== keys.oldKey; })
                .forEach(function (keys) {
                obj[keys.newKey] = obj[keys.oldKey];
                delete obj[keys.oldKey];
            });
        }
        return obj;
    };
    JSONAPI.prototype.deserialize = function (http$$1, relationshipsObject) {
        var _this = this;
        var deserializeObject = Object.assign({
            keyForAttribute: 'camelCase'
        }, relationshipsObject);
        return rxjs.Observable.create(function (observer) {
            var httpSubscription = http$$1
                .subscribe(function (data) {
                if (typeof data.json === 'function') {
                    observer.next(data);
                    observer.complete();
                }
                else {
                    new deserializer(deserializeObject).deserialize(data, function (err, deserialized) {
                        if (!!err) {
                            observer.error(err);
                        }
                        else {
                            var rawRequest = {
                                data: deserialized,
                                meta: _this.camelize(data.meta),
                                links: _this.camelize(data.links)
                            };
                            var interceptedRequest = _this.requestInterceptors.reduce(function (acc, curr) { return curr(acc); }, rawRequest);
                            observer.next(interceptedRequest);
                            observer.complete();
                        }
                    });
                }
            }, function (error) {
                var rawError = {
                    status: error.status,
                    errors: JSON.parse(error._body).errors,
                };
                var interceptedError = _this.errorInterceptors.reduce(function (acc, curr) { return curr(acc); }, rawError);
                observer.error(interceptedError);
            });
            return function () {
                httpSubscription.unsubscribe();
            };
        });
    };
    return JSONAPI;
}());
JSONAPI.decorators = [
    { type: core.Injectable },
];
/** @nocollapse */
JSONAPI.ctorParameters = function () { return [
    { type: httpWrapper.HttpWrapper, },
]; };

var JSONAPIModule = (function () {
    function JSONAPIModule() {
    }
    return JSONAPIModule;
}());
JSONAPIModule.decorators = [
    { type: core.NgModule, args: [{
                imports: [http.HttpModule],
                declarations: [],
                providers: [httpWrapper.HttpWrapper, JSONAPI],
            },] },
];
/** @nocollapse */
JSONAPIModule.ctorParameters = function () { return []; };

exports.JSONAPIModule = JSONAPIModule;
exports.JSONAPI = JSONAPI;
exports.JSONAPIRequest = JSONAPIRequest;
exports.JSONAPIError = JSONAPIError;
exports.JSONAPIObject = JSONAPIObject;

Object.defineProperty(exports, '__esModule', { value: true });

})));
