"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require("@angular/core");
var rxjs_1 = require("rxjs");
var http_wrapper_1 = require("@briisk/http-wrapper");
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
exports.JSONAPIRequest = JSONAPIRequest;
var JSONAPIError = (function () {
    function JSONAPIError(status, errors) {
        this.status = status;
        this.errors = errors;
    }
    return JSONAPIError;
}());
exports.JSONAPIError = JSONAPIError;
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
exports.JSONAPIObject = JSONAPIObject;
var JSONAPI = (function () {
    function JSONAPI(httpWrapper) {
        this.httpWrapper = httpWrapper;
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
    JSONAPI.prototype.deserialize = function (http, relationshipsObject) {
        var _this = this;
        var deserializeObject = Object.assign({
            keyForAttribute: 'camelCase'
        }, relationshipsObject);
        return rxjs_1.Observable.create(function (observer) {
            var httpSubscription = http
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
JSONAPI = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [http_wrapper_1.HttpWrapper])
], JSONAPI);
exports.JSONAPI = JSONAPI;
//# sourceMappingURL=/Users/dako/briisk/ng2/ng2-jsonapi/src/app/ng2-jsonapi/ng2-jsonapi.js.map