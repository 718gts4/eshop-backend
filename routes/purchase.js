const { postPurchase } = require("../controllers/purchase");
const express = require("express");
const router = express.Router();
const { requireSignin } = require("../common-middleware");

router.post("/", postPurchase);

module.exports = router;
