exports.sendError = (res, error, status = 401) => {
    res.status(status).json({success: false, error});
}

exports.transformUserForClient = (user) => {
    if (!user) return null;
    
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        username: user.username
    };
}
