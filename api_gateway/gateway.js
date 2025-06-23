// gateway.js
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

// Configuration
const JWT_SECRET = "mysecretkey"; // for demo; in prod use env var
const USER_SERVICE_URL = "http://localhost:3001";
const ORDER_SERVICE_URL = "http://localhost:3002";

// 1. Rate limiting: max 5 requests per minute per IP
const limiter = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	handler: (_, res) => {
		res.status(429).json({ error: "Too many requests - try again later" });
	},
});
app.use(limiter);

// 2. JWT auth middleware
function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith("Bearer ")) {
		return res
			.status(401)
			.json({ error: "Missing or invalid Authorization header" });
	}
	const token = authHeader.split(" ")[1];
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		// Attach to req
		req.user = payload;
		next();
	} catch (err) {
		return res.status(401).json({ error: "Invalid token" });
	}
}
app.use(authMiddleware);

// 3. Inject header before proxy
function injectUserHeader(req, res, next) {
	if (req.user && req.user.userId) {
		req.headers["x-user-id"] = req.user.userId;
	}
	next();
}
app.use(injectUserHeader);

// 4. Routing / proxying

// Route /users/* → user-service
app.use(
	"/users",
	createProxyMiddleware({
		target: USER_SERVICE_URL,
		changeOrigin: true,
		pathRewrite: {
			"^/users": "/users", // passthrough; adjust if needed
		},
		onProxyReq: (proxyReq) => {
			// Optionally log or modify headers
			proxyReq.setHeader("x-gateway", "api-gateway-demo");
		},
	})
);

// Route /orders/* → order-service
app.use(
	"/orders",
	createProxyMiddleware({
		target: ORDER_SERVICE_URL,
		changeOrigin: true,
		pathRewrite: {
			"^/orders": "/orders",
		},
		onProxyReq: (proxyReq) => {
			proxyReq.setHeader("x-gateway", "api-gateway-demo");
		},
	})
);

// Example path rewrite: /legacy/users/* → /users/*
app.use(
	"/legacy/users",
	createProxyMiddleware({
		target: USER_SERVICE_URL,
		changeOrigin: true,
		pathRewrite: {
			"^/legacy/users": "/users",
		},
	})
);

// Fallback
app.use((req, res) => {
	res.status(404).json({ error: "Not found in gateway" });
});

const PORT = 3000;
app.listen(PORT, () => {
	console.log(`API Gateway listening on http://localhost:${PORT}`);
});
