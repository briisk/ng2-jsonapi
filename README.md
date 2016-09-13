Workspace build status:

[![Build Status](https://semaphoreci.com/api/v1/briisk-co/ng2-jsonapi/branches/master/badge.svg)](https://semaphoreci.com/briisk-co/ng2-jsonapi)

Implementation of JSON API for Angular 2

# Usage:

```
    npm install --save @briisk/ng2-jsonapi
```

```
    import { JSONAPIModule } from '@briisk/ng2-jsonapi';

    @NgModule({
        imports: [ JSONAPIModule ],
        declarations: [ AppComponent ],
        bootstrap: [ AppComponent ]
    })
    export class AppModule {}
```

```
export class AppComponent {

  constructor(private jsonapi: JSONAPI) {
    this.jsonapi.get('someUrl').subscribe((request) => {
        console.log(request);
    });

    const data = {
        some: 'data'
    }
    const payload = new JSONAPIObject(data, 'collectionName', ['some']);
    this.jsonapi.post('someUrl', payload).subscribe((request) => {
        console.log(request);
    });
  }
}
```

# Development:

## Requirements:

* NodeJS version > 5.9.0

## How to install:
```
git clone --recursive https://github.com/briisk/ng2-jsonapi
npm run copy-config
npm install
```

## Updating submodules:
```
git submodule update --init --recursive
```

## Run application in development mode:
```
npm run server
```

## Run linters:
```
npm run lint
```

## Run unit tests in watch mode:
```
npm run watch:test
```

## Run e2e tests
```
npm run e2e
```

## Production build:
```
npm run build:prod
```
