import express from "express";
import AWS from "aws-sdk";
import { generateOrderId, setTimeOutSync } from "../utils/utils.js";
import * as orderService from "../services/orderService.js";
import { log } from "../services/common/logger.js";

const router = express.Router();
const dynamo = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });


router.post("/", async (req, res) => {
  log(`Request body - ${JSON.stringify(req.body)}`)
  const { userId, items } = req.body;
  const orderId = generateOrderId();
  let total = 0;

  try {
    // Step 1: Inventory check & reserve
    let checkInventory = await orderService.checkInventory(items)
    if (checkInventory.msg !== "Success") {
      log(`Failed- ${checkInventory.msg}`)
      return res.status(400).json({
        message: checkInventory.msg,
      });
    }
    total = checkInventory.total;
    await orderService.reserveItemsInInventory(items)

    const order = {
      orderId,
      userId,
      items,
      total,
      status: 1, // Pending
      createdAt: new Date().toISOString()
    };

    await orderService.saveOrder(order);
    log(`|orderId - ${orderId}| userId - ${userId}`)

    //Simulate Payment and save payment transaction details in one of your table
    const outcomes = ["pending", "success", "failed"];
    const randomStatus = outcomes[Math.floor(Math.random() * outcomes.length)];
    // Simulate Payments ends
    log(`Payment status -${orderId} - ${randomStatus}`)
    await orderService.processOrder(orderId, items, randomStatus)

    return res.status(200).json({
      message: "Order placed",
      orderId,
      paymentStatus: randomStatus
    });
  }
  catch (err) {
    log(`Error in /order: ${err}`);
    return res.status(500).json({ error: "Internal error while placing order" });
  }
});
export default router;