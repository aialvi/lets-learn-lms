export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'development-only-change-before-deploying',
  expiresIn: '1d' as const, // Extend token expiration time
};
