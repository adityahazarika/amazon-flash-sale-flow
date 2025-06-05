import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const sqs = new AWS.SQS({ region: process.env.AWS_REGION });

export const sendToQueue = async (payload) => {
  const params = {
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify(payload),
  };
  return sqs.sendMessage(params).promise();
};
