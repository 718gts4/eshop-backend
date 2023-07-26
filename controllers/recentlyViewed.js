const {RecentlyViewed} = require('../models/recentlyViewed');
const slugify = require('slugify');


exports.getRecentlyViewed = async (req, res) => {
    const recentlyViewedList = await RecentlyViewed.find();

    if(!recentlyViewedList){
        res.status(500).json({success:false})
    }
    res.status(200).send(recentlyViewedList);
}

exports.saveRecentlyViewed = async (req, res) => {
    const { userId, productId } = req.body;
    console.log('check req body', req.body);
    let recentlyViewed = new RecentlyViewed({ user:userId, product:productId });

    recentlyViewed = await recentlyViewed.save();
    
    if(!recentlyViewed)
    return res.status(404).send('상품을 저장할 수 없습니다.')

    res.send(recentlyViewed);
}
