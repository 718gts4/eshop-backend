const express = require('express');
const router = express.Router();
const {Keyword} = require('../models/keyword');
const mongoose = require('mongoose');

router.post('/:id', async (req, res) => {
    const objUserId = mongoose.Types.ObjectId(req.params.id);

    let keywordObj = new Keyword({
        keyword: req.body.keyword,
        user: objUserId
    })

    const keyword = new Keyword(keywordObj);
    await keyword.save();

    if(!keyword)
    return res.status(500).send('The keyword cannot be created')

    res.send(keyword);
});

router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        // Fetch all keywords from the database
        const keywords = await Keyword.find({user: userId});
        res.status(200).json({ keywords });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.delete('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        // Delete all keywords with the specified user ID
        await Keyword.deleteMany({ user: userId });

        // Send a response indicating successful deletion
        return res.json({ message: 'All keywords for the user have been deleted' });
    } catch (error) {
        console.error('Error:', error);
        // Send an error response if an error occurs
        return res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;