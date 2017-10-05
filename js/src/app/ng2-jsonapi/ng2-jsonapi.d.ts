import { RequestOptionsArgs } from '@angular/http';
import { Observable } from 'rxjs';
import { HttpWrapper } from '@briisk/http-wrapper';
export declare class JSONAPIRequest {
    data: any;
    meta: any;
    links: any;
    static createPagination(data: any, pageCount: number, links: any): JSONAPIRequest;
    constructor(data: any, meta?: any, links?: any);
}
export declare class JSONAPIError {
    status: string;
    errors: string[];
    constructor(status: string, errors: string[]);
}
export declare class JSONAPIObject {
    data: any;
    name: string;
    relations: any;
    meta: any;
    attrs: string[];
    constructor(data: any, name: string, attrs?: string[], relations?: any, meta?: any);
    private setAttributes(attrs, data);
    private makeAttributesFromData(data);
    private createRelations(data);
}
export declare class JSONAPI {
    protected httpWrapper: HttpWrapper;
    private requestInterceptors;
    private errorInterceptors;
    constructor(httpWrapper: HttpWrapper);
    get(url: string, relationshipsObject?: any, options?: RequestOptionsArgs): Observable<any>;
    post(url: string, obj: JSONAPIObject, relationshipsObject?: any, options?: RequestOptionsArgs): Observable<any>;
    put(url: string, obj: JSONAPIObject, relationshipsObject?: any, options?: RequestOptionsArgs): Observable<any>;
    patch(url: string, obj: JSONAPIObject, relationshipsObject?: any, options?: RequestOptionsArgs): Observable<any>;
    delete(url: string, relationshipsObject?: any, options?: RequestOptionsArgs): Observable<any>;
    addRequestInterceptor(fn: (request: JSONAPIRequest) => any): void;
    addErrorInterceptor(fn: (request: JSONAPIError) => any): void;
    private serialize(obj);
    private camelize(obj);
    private deserialize(http, relationshipsObject);
}
