// Simple rate limiting middleware
const requests = {};

const rateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  return (req, res, next) => {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    const ip = req.ip;
    const now = Date.now();
    
    if (!requests[ip]) {
      requests[ip] = [];
    }
    
    // Remove old requests outside the window
    requests[ip] = requests[ip].filter(time => now - time < windowMs);
    
    if (requests[ip].length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
    
    requests[ip].push(now);
    next();
  };
};

// Development-friendly limits (much higher for development)
// Production limits should be adjusted based on actual needs
export const authLimiter = rateLimiter(60 * 60 * 1000, 1000); // 1000 requests per hour for auth (development friendly)
export const apiLimiter = rateLimiter(60 * 60 * 1000, 5000); // 5000 requests per hour for general API
