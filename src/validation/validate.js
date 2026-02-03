/**
 * Validation utility functions
 *
 * Provides safe parsing of data against Zod schemas with
 * user-friendly error messages.
 */

/**
 * Safely validate data against a Zod schema
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {unknown} data - The data to validate
 * @returns {{ success: true, data: T } | { success: false, errors: string[] }}
 *
 * @example
 * const result = validate(benchCreateSchema, formData);
 * if (!result.success) {
 *   Alert.alert('Validation Error', result.errors.join('\n'));
 *   return;
 * }
 * // result.data is now typed and validated
 * await api.benches.create(result.data);
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Extract user-friendly error messages
    const errors = result.error.errors.map((err) => {
      // Include the field path for nested errors
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${path}${err.message}`;
    });

    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Validate data and throw an error if validation fails
 * Use this in API service methods where you want to throw on invalid data.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {unknown} data - The data to validate
 * @returns {T} The validated and transformed data
 * @throws {Error} If validation fails
 *
 * @example
 * async function createBench(data) {
 *   const validData = validateOrThrow(benchCreateSchema, data);
 *   // validData is guaranteed to be valid
 *   return await supabase.from('benches').insert(validData);
 * }
 */
export function validateOrThrow(schema, data) {
  const result = validate(schema, data);

  if (!result.success) {
    throw new Error(`Validation failed: ${result.errors.join(', ')}`);
  }

  return result.data;
}

/**
 * Check if a value is valid according to a schema (without transformations)
 * Useful for quick validation checks without needing the transformed data.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {unknown} data - The data to validate
 * @returns {boolean} Whether the data is valid
 *
 * @example
 * if (!isValid(emailSchema, email)) {
 *   setEmailError('Invalid email address');
 * }
 */
export function isValid(schema, data) {
  return schema.safeParse(data).success;
}

/**
 * Get the first validation error message for a value
 * Useful for inline form validation.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {unknown} data - The data to validate
 * @returns {string | null} The first error message, or null if valid
 *
 * @example
 * const error = getValidationError(usernameSchema, username);
 * if (error) {
 *   setUsernameError(error);
 * }
 */
export function getValidationError(schema, data) {
  const result = schema.safeParse(data);

  if (result.success) {
    return null;
  }

  return result.error.errors[0]?.message || 'Invalid value';
}
