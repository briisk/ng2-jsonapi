import { HttpWrapper } from '@briisk/http-wrapper';
import { JSONAPI } from './ng2-jsonapi';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';

@NgModule({
  imports: [ HttpModule ],
  declarations: [  ],
  providers: [ HttpWrapper, JSONAPI ],
})
export class JSONAPIModule {}
