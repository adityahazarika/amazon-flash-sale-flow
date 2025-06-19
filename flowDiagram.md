```
[1] Frontend (React / Postman)
         |
         | POST /order (productId, userId)
         v
[2] Backend (Node.js + Express)
         |
         |---> Check & Lock Inventory (DynamoDB)
         |
         |---> Save Order with status = 1 (Pending)
         |
         |---> Simulate Payment (can be delayed)
                    |
                    ├── "Success" within 30 mins → Push to [3] SQS Queue
                    |
                    ├── "Failed" → Mark order as status = 5 (Payment Failed)
                    |
                    └── "Pending" → Wait for timeout monitor (Step 6)

[3] AWS SQS Queue
         |
         v
[4] AWS Lambda (Order Processor)
         |
         ├── Update orderStatus = 2 (Processing)
         └── After processing → orderStatus = 3 (Completed)

[5] DynamoDB Tables
   ├── Inventory Table (productId, stockCount)
   └── Orders Table (orderId, userId, orderStatus, paymentStatus, timestamps)

[6] ⏰ Cron Job / AWS Lambda (Every 5 min)
         |
         └── Find 'pending' orders > 30 mins
                 └── Mark as status = 4 (Rejected due to timeout)
                 └── Restore inventory

[7] Payment Gateway Webhook / Callback
         |
         └── On Payment Success:
              ├── Fetch related order
              ├── If orderStatus = 1 (pending) → push to SQS
              ├── If orderStatus = 4 (timed out) → initiate refund
              └── If already processed → ignore or notify
         --- On Payment failed:
            ----  Mark it as failed and restore inventory

[8] Optional APIs
   - GET /order/:id/status → check current status
   - POST /refund/:orderId → manual refund trigger (optional)

```

Notes - if after 30 mins system marks it failed but still after 1 hr the payment gets confirmed toh hum uss payment se related order status dekhenge, if orderStatus is 4(rejected due to payment timeout) then hum uss user ko utna amount refund kar tenge.
