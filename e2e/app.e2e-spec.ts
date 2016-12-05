import { Ng2JsonapiPage } from './app.po';

describe('ng2-jsonapi App', function() {
  let page: Ng2JsonapiPage;

  beforeEach(() => {
    page = new Ng2JsonapiPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
