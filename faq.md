1. Why to use SQS - 


Long Answer — Compare karo:

Scenario	❌ Without SQS	✅ With SQS
Order placement time	Slow — backend waits for all steps	Fast — payment done, baaki background me
Payment success ke baad	Lambda call karni padegi inline	Queue me message push → Lambda triggers
Order processing logic	Tightly coupled in same request	Decoupled — worker (Lambda) handles it
Failures / retries	Manual try-catch needed	SQS auto-retry & DLQ possible
Spikes (e.g., Flash sale)	System overload	Queue absorbs burst, Lambda scales
Lambda concurrency	N/A	Auto scaling possible
Microservices ke beech data	Hard to sync	Message queue = common medium
💡 Ek Example soch:

🛒 Amazon Flash Sale:
1 lakh log ek saath order karte hain
Agar tu har order ke saath backend me:
inventory adjust
invoice generate
email send
stock update
analytics log
Sab sync karega toh backend mar jaega.

Isliye:

Frontend: bas payment confirm → send to SQS
Baaki sab background me Lambda worker handle kare
