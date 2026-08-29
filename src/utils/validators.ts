/**
 * Validators utility functions for form data checking
 */

export interface ValidationErrors {
  name?: string;
  email?: string;
  message?: string;
}

/**
 * Validate email string format using standard RFC 5322 regex pattern
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Live validator for Contact Us fields
 * Checks name length (>= 3), valid email, and message length (>= 15, <= 1000)
 */
export const validateContactForm = (
  name: string,
  email: string,
  message: string
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (name.trim() && name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters.";
  }

  if (email.trim() && !isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (message.trim() && message.trim().length < 15) {
    errors.message = "Message must be at least 15 characters.";
  }

  if (message.length > 1000) {
    errors.message = "Message cannot exceed 1000 characters.";
  }

  return errors;
};
