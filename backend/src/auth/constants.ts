export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'development-only-change-before-deploying',
  expiresIn: '1d', // Extend token expiration time
};
