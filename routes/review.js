const { postReview } = require("../controllers/review");
const express = require("express");
const router = express.Router();

router.post(`/review`, postReview);

module.exports = router;
