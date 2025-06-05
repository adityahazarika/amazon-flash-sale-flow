import AWS from "aws-sdk";

const dynamo = new AWS.DynamoDB.DocumentClient();

export const saveOrder = async (order) => {
  const params = {
    TableName: "orders",
    Item: order,
  };
  return dynamo.put(params).promise();
};
