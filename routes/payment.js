import express from "express";
import * as orderService from "../services/orderService.js";

const router = express.Router();

router.post("/webhook", async (req, res) => {
    let status = "pending";

    if (req.body.status == "TXN_SUCCESS") {
        status = "success"
    }
    if (req.body.status == "TXN_FAILED") {
        status = "failed"
    }
    let order = await orderService.fetchOrderById(req.body.orderId);
    await orderService.processOrder(req.body.orderId, order.Item.items, status);

    return res.status(200).json({
        message: "Success",
        orderId:req.body.orderId
    });
})

export default router;