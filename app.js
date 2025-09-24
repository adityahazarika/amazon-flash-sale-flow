import './env.js'
import express from "express";
import orderRoutes from "./routes/order.js";
import paymentRoutes from "./routes/payment.js";
import { log } from "./services/common/logger.js";

const app = express();
app.use(express.json());
app.use("/order", orderRoutes);
app.use("/payment", paymentRoutes);

app.use((err, req, res, next) => {
  log(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});