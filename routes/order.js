import express from "express";
import { generateOrderId } from "../utils/uuid.js";
import { saveOrder } from "../services/dynamo.js";
import { sendToQueue } from "../services/queue.js";

const router = express.Router();

router.post("/order", async (req, res) => {
  try {
    const { userId, items, total } = req.body;
    const orderId = generateOrderId();

    const order = {
      orderId,
      userId,
      items,
      total,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    await saveOrder(order);
    await sendToQueue({ orderId, userId });

    res.status(200).json({ message: "Order placed!", orderId });
  } catch (err) {
    console.error("Error in /order:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
