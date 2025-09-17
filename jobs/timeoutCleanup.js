import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

const ORDER_TIMEOUT_MINUTES = 2;

export const handler = async (event) => {
  console.log("🔔 Lambda Triggered by:", JSON.stringify(event));

  const now = new Date();
  const cutoffTime = new Date(now.getTime() - ORDER_TIMEOUT_MINUTES * 60000).toISOString();

  try {
    // Step 1: Scan all expired pending orders
    const scanResult = await docClient.send(new ScanCommand({
      TableName: "orders",
      FilterExpression: "#status = :pending AND createdAt < :cutoff",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":pending": 1,
        ":cutoff": cutoffTime
      }
    }));

    const expiredOrders = scanResult.Items || [];
    console.log(`⏳ Found ${expiredOrders.length} expired orders`);

    for (const order of expiredOrders) {
      // Step 2: Mark order as rejected
      await docClient.send(new UpdateCommand({
        TableName: "orders",
        Key: { orderId: order.orderId },
        UpdateExpression: "SET #status = :rejected",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":rejected": 4 }
      }));

      // Step 3: Restore inventory
      for (const item of order.items) {
        await docClient.send(new UpdateCommand({
          TableName: "inventory",
          Key: { productId: item.productId },
          UpdateExpression: "SET quantity = quantity + :q, reserved = reserved - :q",
          ExpressionAttributeValues: { ":q": item.qty }
        }));
      }

      console.log(`🔁 Order ${order.orderId} rejected & inventory restored`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Timeout cleanup done", count: expiredOrders.length })
    };

  } catch (err) {
    console.error("❌ Error in cleanup job:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};