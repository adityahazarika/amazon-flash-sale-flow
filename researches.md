![image](https://github.com/user-attachments/assets/bb9c761f-d315-4ada-b767-cb052a546167)


OUR Project request per second capacity- 

Chal ab dekh le realistically humara SQS + Lambda + DynamoDB kitna load handle karega:

🔹 1. SQS Throughput
Standard Queue (jo hum use kar rahe hain): practically unlimited throughput.
AWS guarantee karta hai ki tu tens of thousands of messages per second bhej sakta hai.
Limitation order ka nahi hai, consumer speed ka hai (Lambda kitni fast consume kare).

🔹 2. Lambda Concurrency
By default: 1,000 concurrent Lambda executions per account (region-wise).
Har execution ek SQS batch process kar sakta hai (batch size configurable: 1–10 by default).
👉 Example:
Batch size = 10
Concurrency = 1,000
Ek hi second me = 10 × 1,000 = 10,000 orders/sec process possible 🚀
Agar aur chahiye toh concurrency limit raise karwa sakte ho AWS support se (50k+ tak).

🔹 3. DynamoDB Capacity
DynamoDB on-demand mode = automatically scale hota hai.
Documented burst capacity: tens of thousands R/W per second per table.
Agar huge flash sale hoga, thoda design tweak karna padega (hot partitioning avoid karna).

🔹 4. Realistic Number
Agar normal config le (100 concurrency, batch size 5):
👉 ~500 orders/sec sustained handle kar lega comfortably.
Agar scale up kare (1000 concurrency, batch size 10, DynamoDB on-demand):
👉 10,000+ orders/sec easily.

🔹 5. Amazon vs Hum
Amazon/Flipkart scale = 100k–1M+ orders/sec
Humara setup (SQS+Lambda+DynamoDB) = 10k/sec tak chill
Startups / mid-size ecommerce ko utna hi chahiye hota hai.
⚡ So bhai, answer:
👉 Hamara system 5k–10k orders per second handle kar sakta hai (thoda tuning karke).
Aur agar tera project bas demo purpose ke liye hai → 500/sec bhi bahut impressive hai.



<img width="1470" height="880" alt="Screenshot 2025-09-24 at 7 15 48 PM" src="https://github.com/user-attachments/assets/fc9a1283-ce16-474f-af17-8ee5934ef374" />

