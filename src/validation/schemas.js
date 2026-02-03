/**
 * Zod validation schemas for BenchSpotter
 *
 * These schemas validate user input before sending to the API.
 * Use the validate() function from ./validate.js to safely parse data.
 */

import { z } from 'zod';

// ============================================================================
// VIEW TYPES
// ============================================================================

export const viewTypes = [
  'ocean',
  'mountain',
  'urban',
  'forest',
  'lake',
  'river',
  'desert',
  'valley',
  'other',
];

export const viewTypeSchema = z.enum(viewTypes);

// ============================================================================
// COORDINATES
// ============================================================================

export const latitudeSchema = z
  .number()
  .min(-90, 'Latitude must be between -90 and 90')
  .max(90, 'Latitude must be between -90 and 90');

export const longitudeSchema = z
  .number()
  .min(-180, 'Longitude must be between -180 and 180')
  .max(180, 'Longitude must be between -180 and 180');

export const coordinatesSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

// ============================================================================
// BENCH SCHEMAS
// ============================================================================

export const benchCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  viewType: viewTypeSchema,
  accessibilityNotes: z
    .string()
    .max(500, 'Accessibility notes must be 500 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

export const benchUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .transform((val) => val.trim())
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .transform((val) => val?.trim() || null)
    .optional()
    .nullable(),
  viewType: viewTypeSchema.optional(),
  accessibilityNotes: z
    .string()
    .max(500, 'Accessibility notes must be 500 characters or less')
    .transform((val) => val?.trim() || null)
    .optional()
    .nullable(),
});

// ============================================================================
// RATING SCHEMAS
// ============================================================================

export const ratingValueSchema = z
  .number()
  .int('Rating must be a whole number')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating must be at most 5');

export const ratingSchema = z.object({
  viewRating: ratingValueSchema,
  comfortRating: ratingValueSchema,
});

// ============================================================================
// COMMENT SCHEMAS
// ============================================================================

export const commentCreateSchema = z.object({
  text: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be 1000 characters or less')
    .transform((val) => val.trim()),
  parentId: z.string().uuid('Invalid parent comment ID').optional().nullable(),
});

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be 20 characters or less')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores'
  );

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .max(100, 'Name must be 100 characters or less')
    .transform((val) => val?.trim() || null)
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(500, 'Bio must be 500 characters or less')
    .transform((val) => val?.trim() || null)
    .optional()
    .nullable(),
});

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
});

export const signInSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// SEARCH SCHEMAS
// ============================================================================

export const searchParamsSchema = z.object({
  query: z.string().max(100, 'Search query too long').optional(),
  viewType: viewTypeSchema.optional().nullable(),
  ratingFilter: z.number().min(0).max(5).optional().nullable(),
  sortBy: z.enum(['distance', 'rating', 'recent']).optional(),
  maxDistance: z.number().positive().optional().nullable(),
});
