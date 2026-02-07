/**
 * Generates a short, clean, meaningful title from a message
 * Max 15 characters, sidebar-friendly
 */
export const generateConversationTitle = (message: string): string => {
  const MAX_LENGTH = 15;
  
  // Clean the message
  const cleaned = message.trim().replace(/\s+/g, ' ');
  
  // If empty or just whitespace, use fallback
  if (!cleaned) {
    return "New Chat";
  }
  
  // Common greetings that should use fallback
  const greetings = ['hi', 'hello', 'hey', 'hii', 'hiii', 'yo', 'sup', 'hola', 'howdy'];
  if (greetings.includes(cleaned.toLowerCase())) {
    return "New Chat";
  }
  
  // Extract key phrases/topics
  const title = extractTitle(cleaned);
  
  // Ensure max length
  if (title.length <= MAX_LENGTH) {
    return title;
  }
  
  // Truncate intelligently at word boundary
  const truncated = title.substring(0, MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > MAX_LENGTH * 0.5) {
    return truncated.substring(0, lastSpace);
  }
  
  return truncated;
};

/**
 * Extract a meaningful title from the message
 */
const extractTitle = (message: string): string => {
  // Remove common prefixes
  const prefixes = [
    /^(please|pls|can you|could you|i want to|i need to|help me|generate|create|make|write|build|design)\s+/i,
  ];
  
  let processed = message;
  for (const prefix of prefixes) {
    processed = processed.replace(prefix, '');
  }
  
  // Remove trailing punctuation
  processed = processed.replace(/[.!?]+$/, '');
  
  // Capitalize first letter of each significant word
  const words = processed.split(' ');
  const titleCased = words.map((word, index) => {
    // Skip small words unless first word
    const smallWords = ['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'and', 'or', 'but'];
    if (index > 0 && smallWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
  
  // If result is too short or empty, use fallback
  if (titleCased.length < 3) {
    return "General Question";
  }
  
  return titleCased;
};
