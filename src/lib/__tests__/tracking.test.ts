import { CALENDLY_URLS, CALENDLY_BASE } from '../tracking';

describe('CALENDLY_URLS', () => {
  it('all URLs start with base', () => {
    Object.values(CALENDLY_URLS).forEach(url => {
      expect(url).toContain(CALENDLY_BASE);
    });
  });

  it('all URLs contain utm_source=portfolio', () => {
    Object.values(CALENDLY_URLS).forEach(url => {
      expect(url).toContain('utm_source=portfolio');
    });
  });

  it('all URLs contain utm_campaign', () => {
    Object.values(CALENDLY_URLS).forEach(url => {
      expect(url).toContain('utm_campaign=');
    });
  });

  it('hero and footer have distinct utm_medium', () => {
    expect(CALENDLY_URLS.hero).toContain('utm_medium=hero');
    expect(CALENDLY_URLS.footer).toContain('utm_medium=footer');
  });
});
