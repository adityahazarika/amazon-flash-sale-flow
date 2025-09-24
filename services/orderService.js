import AWS from "aws-sdk";
import * as queue from "./common/queue.js";
import { log } from "./common/logger.js";

const dynamo = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

export const fetchOrderById = async (orderId) => {
    try {
        return await dynamo.get({
            TableName: "orders",
            Key: { orderId: orderId }
        }).promise();
    }
    catch (err) {
        throw err
    }
}

export const saveOrder = async (order) => {
    try {
        const params = {
            TableName: "orders",
            Item: order,
        };
        return dynamo.put(params).promise();
    }
    catch (err) {
        throw err
    }
};

export async function checkInventory(items) {
    try {
        let total = 0
        let itemIds = {
            RequestItems: {
                inventory: {
                    Keys: items.map(data => ({ productId: data.productId }))
                }
            }
        }
        const result = await dynamo.batchGet(itemIds).promise();

        for (let i = 0; i < result.Responses.inventory.length; i++) {
            let cartItem = items.find((data) => data.productId == result.Responses.inventory[i].productId);

            if (result.Responses.inventory[i].quantity < cartItem.qty) {
                return {
                    "msg": `Product ${cartItem.productId} is out of stock`
                }
            }
            total = total + (result.Responses.inventory[i].price * cartItem.qty)
        }
        return {
            "msg": "Success",
            "total": total
        }
    }
    catch (err) {
        throw err
    }
}

export async function reserveItemsInInventory(items) {
    try {
        let updatedInventoryList = items.map((data) => ({
            Update: {
                TableName: "inventory",
                Key: { productId: data.productId },
                UpdateExpression: "SET reserved = reserved + :q, quantity = quantity - :q",
                ConditionExpression: "quantity >= :q",
                ExpressionAttributeValues: {
                    ":q": data.qty
                }
            }
        }))

        return await dynamo.transactWrite({
            TransactItems: updatedInventoryList
        }).promise();
    } catch (err) {
        throw err
    }
}

export async function processOrder(orderId, items, status) {
    try {
        if (status === "success") {
            // Deduct from reserved
            let updatedInventoryList = items.map((data) => ({
                Update: {
                    TableName: "inventory",
                    Key: { productId: data.productId },
                    UpdateExpression: "SET reserved = reserved - :q",
                    ExpressionAttributeValues: {
                        ":q": data.qty
                    }
                }
            }))

            await dynamo.transactWrite({
                TransactItems: updatedInventoryList
            }).promise();

            // Update order status = 2 (Processing)
            await dynamo.update({
                TableName: "orders",
                Key: { orderId },
                UpdateExpression: "SET #status = :s",
                ExpressionAttributeNames: { "#status": "status" },
                ExpressionAttributeValues: { ":s": 2 }
            }).promise();

            await queue.sendToQueue({ orderId })
            log(`${orderId} - Order Success`)
        }

        else if (status === "failed") {
            // Rollback reservation
            let updatedInventoryList = items.map((data) => ({
                Update: {
                    TableName: "inventory",
                    Key: { productId: data.productId },
                    UpdateExpression: "SET quantity = quantity + :q, reserved = reserved - :q",
                    ExpressionAttributeValues: {
                        ":q": data.qty
                    }
                }
            }))

            await dynamo.transactWrite({
                TransactItems: updatedInventoryList
            }).promise();

            // Update order status = 5 (Failed)
            await dynamo.update({
                TableName: "orders",
                Key: { orderId },
                UpdateExpression: "SET #status = :s",
                ExpressionAttributeNames: { "#status": "status" },
                ExpressionAttributeValues: { ":s": 5 }
            }).promise();
            log(`${orderId} - Order Failed`)
        } else {
            // If pending → do nothing now, cron will handle
            log(`${orderId} - Order Pending`)
        }
    }
    catch (err) {
        throw err
    }
}