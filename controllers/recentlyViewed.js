const { RecentlyViewed } = require("../models/recentlyViewed");
const slugify = require("slugify");
const mongoose = require("mongoose");

exports.getRecentlyViewed = async (req, res) => {
    const userId = mongoose.Types.ObjectId(req.params.id);
    const recentlyViewedList = await RecentlyViewed.find({ user: userId })
        .populate("product")
        .sort({ dateCreated: -1 });

    if (!recentlyViewedList) {
        res.status(500).json({ success: false });
    }
    res.status(200).send(recentlyViewedList);
};

exports.saveRecentlyViewed = async (req, res) => {
    const { userId, productId } = req.body;
    const existingViewedItem = await RecentlyViewed.findOne({
        user: userId,
        product: productId,
    });
    if (existingViewedItem) {
        return res.status(400).send("이미 저장된 상품입니다.");
    }

    let recentlyViewed = new RecentlyViewed({
        user: userId,
        product: productId,
    });

    recentlyViewed = await recentlyViewed.save();

    if (!recentlyViewed)
        return res.status(404).send("상품을 저장할 수 없습니다2.");

    res.send(recentlyViewed);
};

exports.deleteRecentlyViewed = async (req, res) => {
    try {
        const recentlyViewed = await RecentlyViewed.findById(req.params.id);
        if (!recentlyViewed) {
            return res.status(404).json({ error: "Product not found" });
        }

        await recentlyViewed.remove();
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
