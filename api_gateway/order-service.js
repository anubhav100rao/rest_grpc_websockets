// order-service.js
import express from "express";
const app = express();
app.use(express.json());

// Simple in-memory orders
const orders = {};

// GET /orders/:id
app.get("/orders/:id", (req, res) => {
	const { id } = req.params;
	const order = orders[id];
	if (!order) return res.status(404).json({ error: "Not found" });
	// Read X-User-ID injected by gateway
	const caller = req.header("x-user-id") || "unknown";
	res.json({ ...order, requestedBy: caller });
});

// POST /orders
app.post("/orders", (req, res) => {
	const { orderId, item } = req.body;
	if (!orderId || !item) {
		return res.status(400).json({ error: "orderId and item required" });
	}
	orders[orderId] = { orderId, item };
	res.status(201).json({ status: "created", orderId });
});

const PORT = 3002;
app.listen(PORT, () => {
	console.log(`Order Service listening on http://localhost:${PORT}`);
});
