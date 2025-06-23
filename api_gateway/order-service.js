// order-service.js
const express = require("express");
const app = express();
app.use(express.json());

// In-memory store for demo
const orders = {};

// GET /orders/:id
app.get("/orders/:id", (req, res) => {
	const { id } = req.params;
	console.log("[Order Service] Headers:", req.headers);
	const caller = req.header("x-user-id") || "unknown";
	const order = orders[id];
	if (!order) {
		return res.status(404).json({ error: "Not found" });
	}
	res.json({ ...order, requestedBy: caller });
});

// POST /orders
app.post("/orders", (req, res) => {
	console.log("[Order Service] Headers:", req.headers);
	const { orderId, item } = req.body;
	if (!orderId || !item) {
		return res.status(400).json({ error: "orderId and item required" });
	}
	if (orders[orderId]) {
		return res.status(409).json({ error: "Already exists" });
	}
	orders[orderId] = { orderId, item };
	res.status(201).json({ status: "created", orderId });
});

// (Optional) health endpoint
app.get("/health", (req, res) => {
	res.json({ status: "order-service up" });
});

const PORT = 3002;
app.listen(PORT, () => {
	console.log(`Order Service listening on http://localhost:${PORT}`);
});
