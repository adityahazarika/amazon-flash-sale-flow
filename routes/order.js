import express from "express";
import AWS from "aws-sdk";
import { generateOrderId, setTimeOutSync } from "../utils/utils.js";
import * as orderService from "../services/orderService.js";

const router = express.Router();
const dynamo = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });


router.post("/", async (req, res) => {
  const { userId, items } = req.body;
  const orderId = generateOrderId();
  let total = 0;

  try {
    // Step 1: Inventory check & reserve
    let checkInventory = await orderService.checkInventory(items)
    if (checkInventory !== true) {
      return res.status(400).json({
        message: checkInventory,
      });
    }
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

    //Simulate Payment and save payment transaction details in one of your table
    const outcomes = ["success"];
    const randomStatus = outcomes[Math.floor(Math.random() * outcomes.length)];
    // Simulate Payments ends

    await orderService.processOrder(orderId, items, randomStatus)

    return res.status(200).json({
      message: "Order placed",
      orderId,
      paymentStatus: randomStatus
    });
  } 
  catch (err) {
    console.error("Error in /order:", err);
    return res.status(500).json({ error: "Internal error while placing order" });
  }
});
export default router;