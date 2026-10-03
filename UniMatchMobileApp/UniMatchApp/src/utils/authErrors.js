
export const getFriendlyAuthError = (message = '') => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('email not confirmed')) {
    return 'Please verify your email before signing in.';
  }

  if (
    lowerMessage.includes('invalid login credentials') ||
    lowerMessage.includes('invalid credentials')
  ) {
    return 'Invalid email or password. Please try again.';
  }

  return message || 'Something went wrong. Please try again.';
};