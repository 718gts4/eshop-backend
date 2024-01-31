const express = require("express");
const router = express.Router();
const { addClient } = require("../controllers/client");

// Route to handle adding a user to the clients array
router.post("/vendors/:vendorId/add-client", addClient);

module.exports = router;
