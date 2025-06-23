// user-service.js
import express from "express";
const app = express();
app.use(express.json());

// GET /users/:id
app.get("/users/:id", (req, res) => {
	const { id } = req.params;
	// Read X-User-ID injected by gateway
	const caller = req.header("x-user-id") || "unknown";
	// Return dummy data
	res.json({
		userId: id,
		name: `User${id}`,
		requestedBy: caller,
	});
});

const PORT = 3001;
app.listen(PORT, () => {
	console.log(`User Service listening on http://localhost:${PORT}`);
});
