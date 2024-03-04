const {
    getOrders,
    getOrder,
    postOrder,
    updateOrder,
    deleteOrder,
    getOrdersCount,
    getUserOrders,
    getOrderItems,
    toggleOrderStatus,
    updateDisplayOrder,
    getOrderItemCountsBySeller,
    updateOrderItemToCanceled,
    getTotalSalesForSeller,
    flexibleUpdate,
    updateStatus,
    updateVendorNote,
} = require("../controllers/order");

const express = require("express");
const router = express.Router();
const { requireSignin } = require("../common-middleware");

router.get(`/`, getOrders);
router.get(`/:id`, getOrder);
router.get(`/get/adminorders/:sellerId`, getOrderItems, requireSignin);
router.post("/", postOrder);
router.put("/:id", updateOrder);
router.delete(`/:id`, deleteOrder);
router.get(`/get/count`, getOrdersCount);
router.get(`/get/userorders/:userid`, getUserOrders, requireSignin);
router.put(
    "/toggle-order-status/:orderItemId/:orderStatusIndex",
    toggleOrderStatus,
    requireSignin
);
router.put(`/updateDisplay/:orderId`, updateDisplayOrder);
router.get("/orderitems/countbyseller", getOrderItemCountsBySeller);
router.put("/orderitems/:orderItemId/cancel", updateOrderItemToCanceled);
router.get(`/seller/:sellerId/totalSales`, getTotalSalesForSeller);
router.put("/flexibleupdate", flexibleUpdate);
router.patch("/updateStatus", updateStatus);
router.patch("/updateVendorNote", updateVendorNote);
module.exports = router;
