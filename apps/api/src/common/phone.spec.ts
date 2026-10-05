import { normalizePkMobile } from './phone';

describe('normalizePkMobile', () => {
  it.each([
    ['03001234567', '+923001234567'],
    ['0300-1234567', '+923001234567'],
    ['+92 300 1234567', '+923001234567'],
    ['923001234567', '+923001234567'],
    ['00923001234567', '+923001234567'],
    ['3001234567', '+923001234567'],
  ])('normalises %s', (input, expected) => {
    expect(normalizePkMobile(input)).toBe(expected);
  });

  it.each(['', 'abc', '0300123456', '02101234567', '+14155550123', '030012345678'])(
    'rejects %p',
    (input) => {
      expect(normalizePkMobile(input)).toBeNull();
    },
  );
});
