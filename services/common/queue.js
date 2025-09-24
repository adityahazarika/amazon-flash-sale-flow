import AWS from "aws-sdk";
let region = process.env.AWS_REGION
const sqs = new AWS.SQS({ region: process.env.AWS_REGION });
import { log } from "./logger.js";

export async function sendToQueue(payload) {
  const params = {
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify(payload)
  };
  try {
    await sqs.sendMessage(params).promise();
    log(`Sent to SQS: ${JSON.stringify(payload)}`);
  } catch (err) {
    log(`Failed to push to SQS: ${err}`);
    throw err;
  }
}