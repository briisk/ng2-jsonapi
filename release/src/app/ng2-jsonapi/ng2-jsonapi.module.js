import { HttpWrapper } from '@briisk/http-wrapper';
import { JSONAPI } from './ng2-jsonapi';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
var JSONAPIModule = (function () {
    function JSONAPIModule() {
    }
    return JSONAPIModule;
}());
export { JSONAPIModule };
JSONAPIModule.decorators = [
    { type: NgModule, args: [{
                imports: [HttpModule],
                declarations: [],
                providers: [HttpWrapper, JSONAPI],
            },] },
];
/** @nocollapse */
JSONAPIModule.ctorParameters = function () { return []; };
//# sourceMappingURL=ng2-jsonapi.module.js.map