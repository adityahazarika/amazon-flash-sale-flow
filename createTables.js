// createTables.js
import {
  DynamoDBClient,
  CreateTableCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "ap-south-1" }); // change region if needed

const ordersTableParams = {
  TableName: "orders",
  AttributeDefinitions: [
    { AttributeName: "orderId", AttributeType: "S" }
  ],
  KeySchema: [
    { AttributeName: "orderId", KeyType: "HASH" }
  ],
  BillingMode: "PAY_PER_REQUEST" // On-demand pricing (Free Tier-friendly)
};

const inventoryTableParams = {
  TableName: "inventory",
  AttributeDefinitions: [
    { AttributeName: "productId", AttributeType: "S" }
  ],
  KeySchema: [
    { AttributeName: "productId", KeyType: "HASH" }
  ],
  BillingMode: "PAY_PER_REQUEST"
};

async function createTable(params) {
  try {
    const data = await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${params.TableName}`);
  } catch (err) {
    if (err.name === "ResourceInUseException") {
      console.log(`⚠️ Table already exists: ${params.TableName}`);
    } else {
      console.error(`❌ Error creating table ${params.TableName}:`, err);
    }
  }
}

async function run() {
  await createTable(ordersTableParams);
  await createTable(inventoryTableParams);
}

run();
