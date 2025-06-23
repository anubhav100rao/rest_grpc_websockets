// gateway.js
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";
const USER_SERVICE_URL = "http://localhost:3001";
const ORDER_SERVICE_URL = "http://localhost:3002";

// JSON parsing (not strictly needed for GET)
app.use(express.json());

// Rate limit
app.use(
	rateLimit({
		windowMs: 60 * 1000,
		max: 5,
		handler: (_, res) =>
			res.status(429).json({ error: "Too many requests" }),
	})
);

// Logging
app.use((req, res, next) => {
	console.log(`[Gateway] ${req.method} ${req.path}`);
	next();
});

// Auth
app.use((req, res, next) => {
	const auth = req.headers.authorization;
	if (!auth || !auth.startsWith("Bearer ")) {
		return res
			.status(401)
			.json({ error: "Missing or invalid Authorization header" });
	}
	const token = auth.split(" ")[1];
	try {
		req.user = jwt.verify(token, JWT_SECRET);
		next();
	} catch {
		return res.status(401).json({ error: "Invalid token" });
	}
});

// Proxy helper
function makeProxy(target) {
	return createProxyMiddleware({
		target,
		changeOrigin: true,
		pathRewrite: (path, req) => path,
		onProxyReq: (proxyReq, req) => {
			proxyReq.setHeader("x-gateway", "api-gateway-demo");
			if (req.user && req.user.userId) {
				proxyReq.setHeader("x-user-id", req.user.userId);
			}
		},
		onError: (err, req, res) => {
			console.error("[Gateway] proxy error:", err);
			res.status(502).json({ error: "Bad gateway" });
		},
	});
}

// Routes
app.use("/users", makeProxy(USER_SERVICE_URL));
app.use("/orders", makeProxy(ORDER_SERVICE_URL));
// optional legacy rewrite
app.use(
	"/legacy/users",
	createProxyMiddleware({
		target: USER_SERVICE_URL,
		changeOrigin: true,
		pathRewrite: { "^/legacy/users": "/users" },
		onProxyReq: (proxyReq, req) => {
			proxyReq.setHeader("x-gateway", "api-gateway-demo");
			if (req.user && req.user.userId) {
				proxyReq.setHeader("x-user-id", req.user.userId);
			}
		},
		onError: (err, req, res) => {
			console.error("[Gateway] legacy/users proxy error:", err);
			res.status(502).json({ error: "Bad gateway on legacy/users" });
		},
	})
);

// Health check
app.get("/health", (_, res) => res.json({ status: "gateway up" }));

// JSON 404 fallback
app.use((req, res) => {
	res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

app.listen(3000, () => console.log("API Gateway on http://localhost:3000"));
