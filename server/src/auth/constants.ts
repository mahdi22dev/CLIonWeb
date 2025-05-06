import { env } from 'process';

console.log(
  env.SECRET ||
    'No secret provided , using hardcoded way please hide the secret in production',
);

export const jwtConstants = {
  secret:
    env.SECRET ||
    '8hmNxJefpACFBA1+Low/LIeTwDwNMlrmB0Na9Himy+0foUYsvPhBtXxC1Pjh5P9aIehbYIJsQsEyt6bx1ext7ZNdTfDY8OXhnbmMGCE2XhakOjtdbHVmfJkFkR1Dj+LDhFfMDyx5lVZVGy1Pvkj45lCXDeue8L1UD7vtUZZMWCa+/41z/LHC5sykcn6JD3TqoR3GXIeJ',
};
