const { z } = require('zod');

// Validation schema for user registration
const registerSchema = z.object({
  body: z.object({
    // Username rules
    username: z
      .string({ required_error: 'username is required' })
      .trim()
      .min(3, 'username must be at least 3 characters')
      .max(30, 'username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'username can only contain letters, numbers, and underscores'
      ),

    // Email rules
    email: z
      .string({ required_error: 'email is required' })
      .trim()
      .toLowerCase()
      .email('email must be a valid email address'),

    // Password rules
    password: z
      .string({ required_error: 'password is required' })
      .min(8, 'password must be at least 8 characters')
      .max(128, 'password is too long')
      .regex(/[A-Z]/, 'password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'password must contain at least one number'),

    // Address rules
    address: z
      .string({ required_error: 'address is required' })
      .trim()
      .min(5, 'address must be at least 5 characters')
      .max(255, 'address is too long'),
  }),
});

// Validation schema for user login
const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'email is required' })
      .trim()
      .toLowerCase()
      .email('email must be a valid email address'),

    password: z
      .string({ required_error: 'password is required' })
      .min(1, 'password is required'),
  }),
});

// Validation schema for refreshing tokens
const refreshSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: 'refreshToken is required' })
      .min(1),
  }),
});

// Validation schema for routes with a user ID
const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('id must be a valid UUID'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  idParamSchema,
};