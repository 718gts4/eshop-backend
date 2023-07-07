const express = require('express');
const router = express.Router();
const {Keyword} = require('../models/keyword');

router.post('/keyword', async (req, res) => {
    console.log('req.body', req.body);
    try {
        const { keyword } = req.body.value;
        const existingKeyword = await Keyword.findOne({ keyword });

        if (existingKeyword) {
            return res.status(400).json({ message: 'Keyword already exists' });
        }

        const newKeyword = new Keyword({ keyword });
        await newKeyword.save();

        res.status(201).json({ message: 'Keyword saved successfully'});
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ message: 'Server Error '});
    }
});

router.get('/keywords', async (req, res) => {
    try {
        // Fetch all keywords from the database
        const keywords = await Keyword.find();
    
        res.json(keywords);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.delete('/keywords', async (req, res) => {
    try {
        // Delete all keywords from the database
        await Keyword.deleteMany();
    
        res.json({ message: 'All keywords have been deleted' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;