import express from "express";
import AWS from "aws-sdk";
import { generateOrderId, setTimeOutSync } from "../utils/utils.js";
import { saveOrder } from "../services/dynamo.js";
import * as queue from "../services/queue.js";

const router = express.Router();
const dynamo = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });


router.post("/order", async (req, res) => {
  const { userId, items } = req.body;
  const orderId = generateOrderId();
  let total = 0;

  try {
    // Step 1: Inventory check & reserve
    for (const item of items) {
      const result = await dynamo.get({
        TableName: "inventory",
        Key: { productId: item.productId }
      }).promise();

      const stock = result?.Item?.quantity ?? 0;
      const price = result?.Item?.price ?? 0;

      if (stock < item.qty) {
        return res.status(400).json({
          message: `Product ${item.productId} is out of stock`,
        });
      }

      // Update total
      total += price * item.qty;

      // Reserve quantity (deduct from quantity, add to reserved)
      await dynamo.update({
        TableName: "inventory",
        Key: { productId: item.productId },
        UpdateExpression: "SET quantity = quantity - :q, reserved = if_not_exists(reserved, :zero) + :q",
        ConditionExpression: "quantity >= :q",
        ExpressionAttributeValues: {
          ":q": item.qty,
          ":zero": 0
        }
      }).promise();
    }

    // Step 2: Create order with status = 1 (Pending)
    const order = {
      orderId,
      userId,
      items,
      total,
      status: 1, // Pending
      createdAt: new Date().toISOString()
    };

    await saveOrder(order);

    // Step 3: Simulate Payment
    const outcomes = ["pending"];
    const randomStatus = outcomes[Math.floor(Math.random() * outcomes.length)];

    // await setTimeOutSync(5000)

    // Step 4: Handle Payment Result
    if (randomStatus === "success") {
      // Deduct from reserved
      for (const item of items) {
        await dynamo.update({
          TableName: "inventory",
          Key: { productId: item.productId },
          UpdateExpression: "SET reserved = reserved - :q",
          ExpressionAttributeValues: {
            ":q": item.qty
          }
        }).promise();
      }

      // Update order status = 2 (Processing)
      await dynamo.update({
        TableName: "orders",
        Key: { orderId },
        UpdateExpression: "SET #status = :s",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":s": 2 }
      }).promise();

      queue.sendToQueue({ orderId })
    }

    else if (randomStatus === "failed") {
      // Rollback reservation
      for (const item of items) {
        await dynamo.update({
          TableName: "inventory",
          Key: { productId: item.productId },
          UpdateExpression: "SET quantity = quantity + :q, reserved = reserved - :q",
          ExpressionAttributeValues: {
            ":q": item.qty
          }
        }).promise();
      }

      // Update order status = 5 (Failed)
      await dynamo.update({
        TableName: "orders",
        Key: { orderId },
        UpdateExpression: "SET #status = :s",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":s": 5 }
      }).promise();
    }

    // If pending → do nothing now, cron will handle
    return res.status(200).json({
      message: "Order placed",
      orderId,
      paymentStatus: randomStatus
    });
  } catch (err) {
    console.error("❌ Error in /order:", err);
    return res.status(500).json({ error: "Internal error placing order" });
  }
});

export default router;
