const {User} = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

exports.getUsers = async (req, res) => {
    const userList = await User.find().select('-passwordHash');

    if(!userList){
        res.status(500).json({success:false});
    }
    res.status(200).send(userList);
}

exports.getUserId = async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if(!user){
        res.status(500).json({message:'The user with the given ID was not found'})
    }
    res.status(200).send(user);
}

exports.updateUser = async (req, res)=> {
    const userExist = await User.findById(req.params.id);

    const usernameExist = await User.findOne({ username: req.body.username});
    if(usernameExist)
    return res.status(400).json({
        message: '이미 등록된 유저이름입니다'
    });

    const emailExist = await User.findOne({email: req.body.email});
    if(emailExist)
    return res.status(400).json({
        message: '이미 등록된 이메일 주소입니다.'
    });

    let newPassword
    if(req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10)
    } else {
        newPassword = userExist.passwordHash;
    }
 
    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            username: req.body.username,
            email: req.body.email,
            passwordHash: newPassword,
            phone: req.body.phone,
            gender: req.body.gender,
            birthday: req.body.birthday,
            isAdmin: req.body.isAdmin,
            role: req.body.role,
            brand: req.body.brand,
            brandDescription: req.body.brandDescription,
            followers: req.body.followers,
            following: req.body.following,
            likes: req.body.likes,
            savedVideos: req.body.savedVideos,
            bookmarkProducts: req.body.bookmarkProducts,
            savedProducts: req.body.savedProducts,
            videos: req.body.videos,
            link: req.body.link,
        },
        { new: true}
    )

    if(!user)
    return res.status(400).send('사용자 정보를 업데이트할 수 없습니다')

    res.send(user);
}

exports.deleteUser = (req, res) => {
    User.findByIdAndRemove(req.params.id).then(user =>{
        if(user){
            return res.status(200).json({success:true, message:'the user is deleted'})
        } else {
            return res.status(404).json({success:false, message: "user not found"})
        }
    }).catch(err=>{
        return res.status(400).json({success: false, error: err})
    })
}

exports.register = async (req, res) => {

    const registerUser = await User.findOne({ email: req.body.email});
    if(registerUser)
    return res.status(400).json({
        message: '이미 등록된 이메일 주소입니다.'
    });

    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        role: req.body.role,
        brand: req.body.brand,
        brandDescription: req.body.brandDescription,
        bookmarkProducts: req.body.bookmarkProducts,
        followers: {},
        following: {},
        likes: {}
    })
    user = await user.save();

    if(!user)
    return res.status(400).send('회원가입에 문제가 발생했습니다. 정보를 확인해주세요.')

    res.send(user);
}

exports.login = async (req, res) => {
    const user = await User.findOne({email: req.body.email})
    const secret = process.env.secret;
    const twentyYearsInSeconds = 60 * 60 * 24 * 365 * 20;
    if(!user) {
        return res.status(400).send('The user not found');
    }

    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            {expiresIn : twentyYearsInSeconds}
        )
        const { _id, email, role, name, isAdmin, image, username, following, followers, brand, brandDescription, link, phone, gender, birthday} = user;
        res.status(200).json({
            token,
            user: { _id, email, role, name, isAdmin, image, username, following, followers, brand, brandDescription, link, phone, gender, birthday }
        })
        // res.status(200).send({user: user.email , token: token}) 
    } else {
       res.status(400).send('password is wrong!');
    }
   
}

exports.getUserCount = async (req, res) => {
    const userCount = await User.countDocuments();

    if (!userCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        userCount: userCount,
    });
}

exports.subscribeUser = async (req, res) => {
    try {
        const vendorId = req.body.vendorId;
        const userId = req.body.userId;
        const vendor = await User.findById(vendorId);
        const user = await User.findById(userId);
        const isFollowing = vendor.followers.get(userId);

        if(isFollowing){
            vendor.followers.delete(userId);
            user.following.delete(vendorId);
        } else {
            vendor.followers.set(userId, true);
            user.following.set(vendorId, true);
        }

        const updatedVendor = await User.findByIdAndUpdate(
            vendorId,
            { followers: vendor.followers},
            { new: true}
        );

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { following: user.following},
            {new: true}
        )

        res.status(200).json([updatedVendor, updatedUser]);
    } catch(err){res.status(404).json({message:err.message})}
}

exports.likeUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const user = await User.findById(id);
        const isLiked = user.likes.get(userId);

        if(isLiked){
            user.likes.delete(userId);
        } else {
            user.likes.set(userId, true);
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { likes: user.likes },
            { new: true }
        );

        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(404).json({message:err.message})
    }
}

exports.getSearchUsers = async (req, res) => {
    try {
        const { search } = req.query;
        const users = await User.find({ 
            $or: [
                {username: {$regex: search, $options: 'i'} },
                {brand: {$regex: search, $options: 'i'} }
            ], isAdmin: true})
            .select(['_id', 'name', 'brand', 'image', 'phone', 'username', 'email', 'brandDescription', 'videos', 'following', 'followers', 'likes', 'link', 'addresses']);

        res.json(users);
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({message: 'Server Error'});
    }
}

exports.addSearchWord = async (req, res) => {
    try {
        const { searchWord } = req.body;
        const { userId } = req.params;

        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({message: 'User is not found'});
        };
        user.searchWords.unshift(searchWord);
        await user.save();

        res.status(200).json({message: 'Search word added successfully'});
    } catch (error) {
        res.status(500).json({message: '서버에 문제가 발생했습니다.'})
    };
}

exports.getSearchWords = async (req, res) => {
    try {
        const { userId } = req.params;
    
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
    
        const searchWords = user.searchWords;
    
        res.status(200).json({ searchWords });
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteAllSearchWords = async (req, res) => {
    const { userId } = req.params;
  
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
    
        // Clear the searchWords array
        user.searchWords = [];
        await user.save();
    
        res.json({ message: 'Search words deleted successfully' });
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.bookmarkProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { userId } = req.body;
        
        const user = await User.findById(userId); // Use userId to find the user, not productId
        
        if (user.bookmarkProducts.includes(productId)) {
            // If the product is already bookmarked, remove it from the array
            user.bookmarkProducts = user.bookmarkProducts.filter(id => id !== productId);
        } else {
            // If the product is not bookmarked, add it to the array
            user.bookmarkProducts.push(productId);
        }
        
        const updatedUser = await user.save(); // Save the updated user
        
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}
