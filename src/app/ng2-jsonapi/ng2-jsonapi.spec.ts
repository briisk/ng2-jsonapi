import { HttpWrapper } from '@briisk/http-wrapper';
import { JSONAPI, JSONAPIObject } from './ng2-jsonapi';
import { BaseRequestOptions, Http, Response, ResponseOptions, HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { TestBed, inject } from '@angular/core/testing';

describe('Service: JSONAPI', () => {
  let service: JSONAPI;
  let mockbackend: MockBackend;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ JSONAPI, HttpWrapper, MockBackend, BaseRequestOptions,
        { provide: Http,
          useFactory: (backend, options) => new Http(backend, options),
          deps: [MockBackend, BaseRequestOptions]
        }
      ],
      imports: [ HttpModule ]
    });
  });

  beforeEach(inject([MockBackend, JSONAPI], (_mockbackend, _service) => {
    mockbackend = _mockbackend;
    service = _service;
  }));

  it('should be true', () => {
    expect(service).toBeTruthy();
  });

  let url;
  let responseData;
  let expectedResponse;
  let requestData;
  let expectedRequest;

  beforeEach(() => {
    url = 'someUrl' + Math.ceil(Math.random() * 10000);

    const meta = 'secret' + Math.ceil(Math.random() * 10000);
    const links = {
      next: 'next' + Math.ceil(Math.random() * 10000),
      prev: 'prev' + Math.ceil(Math.random() * 10000),
    };
    const userOne =  {
      firstName: 'Sandro' + Math.ceil(Math.random() * 10000),
      lastName: 'Munda' + Math.ceil(Math.random() * 10000),
      id: Math.ceil(Math.random() * 10000) + '',
    };
    const userTwo =  {
      firstName: 'John' + Math.ceil(Math.random() * 10000),
      lastName: 'Doe' + Math.ceil(Math.random() * 10000),
      id: Math.ceil(Math.random() * 10000) + '',
    };

    responseData = {
      data: [{
        type: 'users',
        id: userOne.id,
        attributes: {
          'first-name': userOne.firstName,
          'last-name': userOne.lastName
        }
      }, {
        type: 'users',
        id: userTwo.id,
        attributes: {
          'first-name': userTwo.firstName,
          'last-name': userTwo.lastName
        }
      }],
      meta: {
        'meta-data': meta
      },
      links: links
    };
    expectedResponse = {
      data: [
        userOne,
        userTwo
      ],
      meta: {
        metaData: meta
      },
      links: links
    };

    requestData = new JSONAPIObject([ userOne, userTwo ], 'users');
    expectedRequest = {
      data: [{
        type: 'users',
        id: userOne.id,
        attributes: {
          'first-name': userOne.firstName,
          'last-name': userOne.lastName,
          id: userOne.id,
        },
        relationships: {}
      }, {
        type: 'users',
        id: userTwo.id,
        attributes: {
          'first-name': userTwo.firstName,
          'last-name': userTwo.lastName,
          id: userTwo.id,
        },
        relationships: {}
      }],
    };
  });

  function mockBackendHandler(assertions) {
    mockbackend.connections
      .subscribe((connection) => {
        assertions(connection.request);
        const response = new ResponseOptions({ body: JSON.stringify(responseData) });
        connection.mockRespond(new Response(response));
      });
  }

  describe('get method with error', () => {
    it('call proper url and return error', (done) => {
      const errorData = {
        errors: [
          {
            status: '422',
            source: { 'pointer': '/data/attributes/first-name' },
            title: 'Invalid Attribute',
            detail: 'First name must contain at least three characters.'
          }
        ]
      };
      mockbackend.connections
        .subscribe((connection) => {
          expect(connection.request.url).toBe(url);
          const response = new ResponseOptions({ body: JSON.stringify(errorData), status: 401 });
          connection.mockError(new Response(response));
        });

      service.get(url).subscribe(() => {
      }, (err) => {
        expect(err.errors).toEqual(errorData.errors);
        done();
      });
    });
  });

  describe('get method', () => {
    it('call proper url and return proper data', (done) => {
      mockBackendHandler((request) => {
        expect(request.url).toBe(url);
      });

      service.get(url).subscribe((resp) => {
        expect(resp).toEqual(expectedResponse);
        done();
      });
    });
  });

  describe('post method', () => {
    it('call proper url and return proper data', (done) => {
      mockBackendHandler((request) => {
        expect(request.url).toBe(url);
        expect(JSON.parse(request.text())).toEqual(expectedRequest);
      });

      service.post(url, requestData).subscribe((resp) => {
        expect(resp).toEqual(expectedResponse);
        done();
      });
    });
  });

  describe('put method', () => {
    it('call proper url and return proper data', (done) => {
      mockBackendHandler((request) => {
        expect(request.url).toBe(url);
        expect(JSON.parse(request.text())).toEqual(expectedRequest);
      });

      service.put(url, requestData).subscribe((resp) => {
        expect(resp).toEqual(expectedResponse);
        done();
      });
    });
  });

  describe('patch method', () => {
    it('call proper url and return proper data', (done) => {
      mockBackendHandler((request) => {
        expect(request.url).toBe(url);
        expect(JSON.parse(request.text())).toEqual(expectedRequest);
      });

      service.patch(url, requestData).subscribe((resp) => {
        expect(resp).toEqual(expectedResponse);
        done();
      });
    });
  });

  describe('delete method', () => {
    it('call proper url and return proper data', (done) => {
      mockBackendHandler((request) => {
        expect(request.url).toBe(url);
      });

      service.delete(url).subscribe((resp) => {
        expect(resp).toEqual(expectedResponse);
        done();
      });
    });
  });

  describe('Relationships', () => {
    it('should deserialize data with relationships', (done) => {
      requestData = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            'first-name': 'Sandro',
            'last-name': 'Munda'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: {
            'first-name': 'Lawrence',
            'last-name': 'Bennett'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
            }
          }
        }]
      };

      expectedResponse = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: {
          id: '54735722e16620ba1eee36af',
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        }
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        address: {
          id: '54735697e16624ba1eee36bf',
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        }
      }];

      const relationshipsObject = {
        addresses: {
          valueForRelationship: function (relationship) {
            return {
              id: relationship.id,
              addressLine1: '406 Madison Court',
              zipCode: '49426',
              country: 'USA'
            };
          }
        }
      };

      mockbackend.connections
        .subscribe((connection) => {
          expect(connection.request.url).toBe(url);
          const response = new ResponseOptions({ body: JSON.stringify(requestData)});
          connection.mockRespond(new Response(response));
        });

      service.get(url, relationshipsObject).subscribe((resp) => {
        expect(resp.data).toEqual(expectedResponse);
        done();
      });
    });

    it('should deserialize data with relationships and included', (done) => {
      requestData = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            'first-name': 'Sandro',
            'last-name': 'Munda'
          },
          relationships: {
            'my-address': {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: {
            'first-name': 'Lawrence',
            'last-name': 'Bennett'
          },
          relationships: {
            'my-address': {
              data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
            }
          }
        }],
        included: [{
          type: 'addresses',
          id: '54735722e16620ba1eee36af',
          attributes: {
            'address-line1': '406 Madison Court',
            'zip-code': '49426',
            country: 'USA'
          }
        }, {
          type: 'addresses',
          id: '54735697e16624ba1eee36bf',
          attributes: {
            'address-line1': '361 Shady Lane',
            'zip-code': '23185',
            country: 'USA'
          }
        }]
      };

      expectedResponse = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        myAddress: {
          id: '54735722e16620ba1eee36af',
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        }
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        myAddress: {
          id: '54735697e16624ba1eee36bf',
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }
      }];

      mockbackend.connections
        .subscribe((connection) => {
          expect(connection.request.url).toBe(url);
          const response = new ResponseOptions({ body: JSON.stringify(requestData)});
          connection.mockRespond(new Response(response));
        });

      service.get(url).subscribe((resp) => {
        expect(resp.data[1]).toEqual(expectedResponse[1]);
        done();
      });
    });

    it('should serialize data with relationships', (done) => {
      const name = 'users';
      const obj = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{ createdAt: '2015-08-04T06:09:24.864Z', id: 45 }],
        address: { zipCode: 42912, id: 123 }
      };

      requestData = new JSONAPIObject(obj, name);

      expectedRequest = {
        included: [{
          type: 'books',
          id: 45,
          attributes: {
            'created-at': '2015-08-04T06:09:24.864Z',
            id: 45
          }
        }, {
          type: 'addresses',
          id: 123,
          attributes: {
            'zip-code': 42912,
            'id': 123
          }
        }],
        data: {
          type: 'users',
          id: '1',
          attributes: {
            id: '1',
            'first-name': 'Sandro',
            'last-name': 'Munda'
          },
          relationships: {
            books: {
              data: [{
                type: 'books',
                id: 45
              }]
            },
            address: {
              data: {
                type: 'addresses',
                id: 123
              }
            }
          }
        }
      };

      mockBackendHandler((request) => {
        expect(request.url).toBe(url);
        expect(JSON.parse(request.text())).toEqual(expectedRequest);
      });

      service.post(url, requestData).subscribe((resp) => {
        expect(resp).toEqual(expectedResponse);
        done();
      });
    });

    it('should serialize data with custom relationships', (done) => {
      const name = 'users';
      const obj = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{ createdAt: '2015-08-04T06:09:24.864Z', id: 45 }],
        address: { zipCode: 42912, street: 'streetName', id: 123 }
      };

      requestData = new JSONAPIObject(obj, name, ['firstName', 'address'], {
        address: {
          ref: (_, address) => address.id,
          attributes: ['zipCode']
        }
      });

      expectedRequest = {
        included: [{
          type: 'addresses',
          id: 123,
          attributes: {
            'zip-code': 42912
          }
        }],
        data: {
          type: 'users',
          id: '1',
          attributes: {
            'first-name': 'Sandro'
          },
          relationships: {
            address: {
              data: {
                type: 'addresses',
                id: 123
              }
            }
          }
        }
      };

      mockBackendHandler((request) => {
        expect(request.url).toBe(url);
        expect(JSON.parse(request.text())).toEqual(expectedRequest);
      });

      service.post(url, requestData).subscribe((resp) => {
        expect(resp).toEqual(expectedResponse);
        done();
      });
    });
  });
});

describe('JSONAPIObject', () => {
  it('should create proper object (without attrs)', () => {
    const name = 'users';
    const obj = {
      some: 'data',
      and: 123
    };
    expect(JSON.stringify(new JSONAPIObject(obj, name))).toEqual(JSON.stringify({
      data: obj,
      name: name,
      relations: {},
      attrs: Object.keys(obj),
    }));
  });

  it('should create proper object (with selected attrs)', () => {
    const name = 'users';
    const obj = {
      some: 'data',
      and: 123
    };
    const attrs = ['some'];
    expect(JSON.stringify(new JSONAPIObject(obj, name, attrs))).toEqual(JSON.stringify({
      data: obj,
      name: name,
      relations: {},
      attrs: attrs,
    }));
  });

  it('should create proper object (from array)', () => {
    const name = 'users';
    const obj = [{
      some: 'data',
      and: 123
    }, {
      someOther: 'data1',
      andOther: 1233
    }];

    expect(JSON.stringify(new JSONAPIObject(obj, name))).toEqual(JSON.stringify({
      data: obj,
      name: name,
      relations: {},
      attrs: Object.keys(obj[0]),
    }));
  });

  it('should create proper object with reliationships', () => {
    const name = 'users';
    const obj = {
      id: '1',
      firstName: 'Sandro',
      lastName: 'Munda',
      books: [{ createdAt: '2015-08-04T06:09:24.864Z', id: 45 }],
      address: { zipCode: 42912, id: 123 }
    };

    expect(JSON.stringify(new JSONAPIObject(obj, name))).toEqual(JSON.stringify({
      data: obj,
      name: name,
      relations: {
        books: {
          attributes: Object.keys(obj.books[0])
        },
        address: {
          attributes: Object.keys(obj.address)
        }
      },
      attrs: Object.keys(obj)
    }));
  });

  it('should create proper object with reliationships (from array)', () => {
    const name = 'users';
    const obj = [{
      id: '1',
      firstName: 'Sandro',
      lastName: 'Munda',
      books: [{ createdAt: '2015-08-04T06:09:24.864Z', id: 45 }],
      address: { zipCode: 42912, id: 123 }
    }];

    expect(JSON.stringify(new JSONAPIObject(obj, name))).toEqual(JSON.stringify({
      data: obj,
      name: name,
      relations: {
        books: {
          attributes: Object.keys(obj[0].books[0])
        },
        address: {
          attributes: Object.keys(obj[0].address)
        }
      },
      attrs: Object.keys(obj[0])
    }));
  });
});
