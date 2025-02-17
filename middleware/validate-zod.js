const validateRequest = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ 
            errors: error.errors.map(e => e.message),
            message: '유효하지 않은 입력입니다'
        });
    }
};

exports.validateRequest = validateRequest;
