import { RequestOptionsArgs } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { HttpWrapper } from '@briisk/http-wrapper';

const serializer = require('jsonapi-serializer').Serializer;
const deserializer = require('jsonapi-serializer').Deserializer;
const inflector = require('inflected');

export class JSONAPIRequest {
  static createPagination(data: any, pageCount: number, links: any) {
    return new JSONAPIRequest(data, { pageCount }, links);
  }

  constructor(
    public data: any,
    public meta?: any,
    public links?: any
  ) {}
}

export class JSONAPIError {
    constructor(
        public status: string,
        public errors: string[]
    ) {}
}

export class JSONAPIObject {
  public attrs: string[];

  constructor(public data: any, public name: string, attrs?: string[], public relations: any = {},
              public meta?: any) {
    this.setAttributes(attrs, data);
  }

  private setAttributes(attrs: string[], data: any) {
    if (!attrs) {
      this.makeAttributesFromData(data);
    } else {
      this.attrs = attrs;
    }
  }

  private makeAttributesFromData(data: any) {
    if (typeof data === 'object' && !!data) {
      if (!!data.length) {
        this.attrs = Object.keys(data[0]);
        this.createRelations(data[0]);
      } else {
        this.attrs = Object.keys(data);
        this.createRelations(data);
      }
    }
  }

  private createRelations(data: any) {
    Object.keys(data)
      .filter((key) => data.hasOwnProperty(key) && typeof data[key] === 'object' && !!data[key])
      .filter((key) => !this.relations[key])
      .forEach((key) => {
        this.relations[key] = {
          attributes: Object.keys(!!data[key].length ? data[key][0] : data[key]),
          ref: (parent, relationObject) => relationObject.id
        };
      });
  }
}

@Injectable()
export class JSONAPI {
  private requestInterceptors: Array<(request: JSONAPIRequest) => any> = [];
  private errorInterceptors: Array<(request: JSONAPIError) => any> = [];

  constructor(protected httpWrapper: HttpWrapper) {}

  public get(
    url: string, relationshipsObject: any = {}, options?: RequestOptionsArgs
  ): Observable<any> {
    return this.deserialize(
      this.httpWrapper.get(url, options),
      relationshipsObject
    );
  }

  public post(
    url: string, obj: JSONAPIObject, relationshipsObject: any = {}, options?: RequestOptionsArgs
  ): Observable<any> {
    return this.deserialize(
      this.httpWrapper.post(url, this.serialize(obj), options),
      relationshipsObject
    );
  }

  public put(
    url: string, obj: JSONAPIObject, relationshipsObject: any = {}, options?: RequestOptionsArgs
  ): Observable<any> {
    return this.deserialize(
      this.httpWrapper.put(url, this.serialize(obj), options),
      relationshipsObject
    );
  }

  public patch(
    url: string, obj: JSONAPIObject, relationshipsObject: any = {}, options?: RequestOptionsArgs
  ): Observable<any> {
    return this.deserialize(
      this.httpWrapper.patch(url, this.serialize(obj), options),
      relationshipsObject
    );
  }

  public delete(
    url: string, relationshipsObject: any = {}, options?: RequestOptionsArgs
  ): Observable<any> {
    return this.deserialize(
      this.httpWrapper.delete(url, options),
      relationshipsObject
    );
  }

  addRequestInterceptor(fn: (request: JSONAPIRequest) => any): void {
    this.requestInterceptors.push(fn);
  }

  addErrorInterceptor(fn: (request: JSONAPIError) => any): void {
    this.errorInterceptors.push(fn);
  }

  private serialize(obj: JSONAPIObject): any {
    const opts = Object.assign({
      attributes: obj.attrs,
      meta: obj.meta
    }, obj.relations);
    const dataSerializer = new serializer(obj.name, opts);

    return dataSerializer.serialize(obj.data);
  }

  private camelize(obj: any): any {
    if (!!obj && typeof obj === 'object') {
      Object.keys(obj)
        .filter((key) => obj.hasOwnProperty(key))
        .map((key) => {
          return {
            newKey: inflector.camelize(inflector.underscore(key), false),
            oldKey: key
          };
        })
        .filter((keys) => keys.newKey !== keys.oldKey)
        .forEach((keys) => {
          obj[keys.newKey] = obj[keys.oldKey];
          delete obj[keys.oldKey];
        });
    }
    return obj;
  }

  private deserialize(http: Observable<any>, relationshipsObject: any): Observable<JSONAPIRequest | JSONAPIError> {
    const deserializeObject = Object.assign({
      keyForAttribute: 'camelCase'
    }, relationshipsObject);

    return Observable.create((observer: Observer<JSONAPIRequest | JSONAPIError>) => {
      const httpSubscription = http
        .subscribe((data) => {
          if (typeof data.json === 'function') {
            observer.next(data);
            observer.complete();
          } else {
            new deserializer(deserializeObject).deserialize(data, (err, deserialized) => {
              if (!!err) {
                observer.error(err);
              } else {
                const rawRequest: JSONAPIRequest = {
                  data: deserialized,
                  meta: this.camelize(data.meta),
                  links: this.camelize(data.links)
                };
                const interceptedRequest = this.requestInterceptors.reduce((acc, curr) => curr(acc), rawRequest);
                observer.next(interceptedRequest);
                observer.complete();
              }
            });
          }
        }, (error) => {
          const rawError: JSONAPIError = {
            status: error.status,
            errors: JSON.parse(error._body).errors,
          };
          const interceptedError = this.errorInterceptors.reduce((acc, curr) => curr(acc), rawError);
          observer.error(interceptedError);
        });

      return () => {
        httpSubscription.unsubscribe();
      };
    });
  }
}
