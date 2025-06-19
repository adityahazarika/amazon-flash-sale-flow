1. Why to use SQS - 


![image](https://github.com/user-attachments/assets/07a7b686-bcde-47c0-9d4d-91377d1446e9)


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
