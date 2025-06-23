// user-service.js
const express = require("express");
const app = express();
app.use(express.json());

// GET /users/:id
app.get("/users/:id", (req, res) => {
	const { id } = req.params;
	// Log headers to verify injection
	console.log("[User Service] Headers:", req.headers);
	const caller = req.header("x-user-id") || "unknown";
	res.json({
		userId: id,
		name: `User${id}`,
		requestedBy: caller,
	});
});

// (Optional) health endpoint
app.get("/health", (req, res) => {
	res.json({ status: "user-service up" });
});

const PORT = 3001;
app.listen(PORT, () => {
	console.log(`User Service listening on http://localhost:${PORT}`);
});
