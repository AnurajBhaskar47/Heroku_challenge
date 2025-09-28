/**
 * Frontend security utilities for chat input validation
 */

export class ChatInputValidator {
    // Basic patterns to catch obvious injection attempts on frontend
    static SUSPICIOUS_PATTERNS = [
        /(?:ignore|forget|disregard)\s+(?:previous|above|all)\s+(?:instructions?|prompts?|rules?)/i,
        /(?:system|admin|root|developer)\s+(?:prompt|instruction|command|override)/i,
        /act\s+as\s+(?:admin|root|system|developer|hacker)/i,
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/i,
        /on(?:load|click|error|focus|blur)\s*=/i,
        /(?:union|select|insert|update|delete|drop)\s+(?:select|from|where|table)/i,
    ];

    static MAX_MESSAGE_LENGTH = 2000;
    static MAX_SPECIAL_CHAR_RATIO = 0.3;

    /**
     * Validate user input on the frontend
     * @param {string} message - User input message
     * @returns {Object} - {isValid: boolean, error: string}
     */
    static validateInput(message) {
        if (!message || typeof message !== 'string') {
            return { isValid: false, error: 'Please enter a valid message.' };
        }

        // Length check
        if (message.length > this.MAX_MESSAGE_LENGTH) {
            return { 
                isValid: false, 
                error: `Message too long. Please keep it under ${this.MAX_MESSAGE_LENGTH} characters.` 
            };
        }

        // Empty or whitespace only
        if (message.trim().length === 0) {
            return { isValid: false, error: 'Please enter a message.' };
        }

        // Check for suspicious patterns
        for (const pattern of this.SUSPICIOUS_PATTERNS) {
            if (pattern.test(message)) {
                return { 
                    isValid: false, 
                    error: 'Please ask questions related to your studies and coursework.' 
                };
            }
        }

        // Check special character ratio
        const specialChars = message.match(/[^\w\s]/g) || [];
        const specialCharRatio = specialChars.length / message.length;
        
        if (specialCharRatio > this.MAX_SPECIAL_CHAR_RATIO) {
            return { 
                isValid: false, 
                error: 'Please use plain text for your questions.' 
            };
        }

        return { isValid: true, error: null };
    }

    /**
     * Sanitize user input before sending
     * @param {string} message - User input message
     * @returns {string} - Sanitized message
     */
    static sanitizeInput(message) {
        if (!message || typeof message !== 'string') {
            return '';
        }

        // Remove potentially dangerous HTML tags
        let sanitized = message.replace(/<[^>]*>/g, '');
        
        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, ' ').trim();
        
        // Limit length
        sanitized = sanitized.substring(0, this.MAX_MESSAGE_LENGTH);
        
        return sanitized;
    }

    /**
     * Check if message is educational/academic in nature
     * @param {string} message - User input message
     * @returns {boolean} - True if appears educational
     */
    static isEducationalContent(message) {
        const educationalKeywords = [
            'study', 'learn', 'education', 'academic', 'course', 'assignment',
            'quiz', 'exam', 'homework', 'research', 'topic', 'subject',
            'mathematics', 'science', 'history', 'literature', 'programming',
            'algorithm', 'data structure', 'computer science', 'physics',
            'chemistry', 'biology', 'engineering', 'statistics', 'question',
            'help', 'explain', 'understand', 'solve', 'calculate', 'analyze'
        ];

        const messageLower = message.toLowerCase();
        return educationalKeywords.some(keyword => messageLower.includes(keyword));
    }
}

/**
 * Rate limiter for frontend (basic implementation)
 */
export class FrontendRateLimiter {
    static requests = [];
    static MAX_REQUESTS = 20; // Lower than backend limit
    static WINDOW_MINUTES = 60;

    /**
     * Check if user can send another message
     * @returns {Object} - {allowed: boolean, waitTime: number}
     */
    static checkLimit() {
        const now = Date.now();
        const windowStart = now - (this.WINDOW_MINUTES * 60 * 1000);

        // Clean old requests
        this.requests = this.requests.filter(time => time > windowStart);

        if (this.requests.length >= this.MAX_REQUESTS) {
            const oldestRequest = Math.min(...this.requests);
            const waitTime = Math.ceil((oldestRequest + (this.WINDOW_MINUTES * 60 * 1000) - now) / 1000);
            return { allowed: false, waitTime };
        }

        // Add current request
        this.requests.push(now);
        return { allowed: true, waitTime: 0 };
    }
}
