function errorHandler(err, req, res, next) {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Development logging - detailed but only in dev
    if (isDevelopment) {
        console.error('Error handler caught:', {
            name: err.name,
            message: err.message,
            path: req.path,
            method: req.method,
            stack: err.stack
        });
    } else {
        // Production logging - minimal info, no sensitive data
        console.error('Error:', {
            type: err.name,
            path: req.path,
            method: req.method
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: "Validation failed",
            details: isDevelopment ? err.message : undefined
        });
    }

    if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
        return res.status(400).json({
            message: "Invalid request format",
            details: isDevelopment ? err.message : undefined
        });
    }

    // Default 500 error - minimal info in production
    return res.status(500).json({
        message: 'Internal server error',
        details: isDevelopment ? err.message : undefined
    });
}

module.exports = errorHandler;
