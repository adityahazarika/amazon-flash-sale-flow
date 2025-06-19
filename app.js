import './env.js'
import express from "express";
import orderRoutes from "./routes/order.js";

const app = express();
app.use(express.json());
app.use("/", orderRoutes);

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});