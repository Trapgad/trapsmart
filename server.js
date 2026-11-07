const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "data.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const starterProducts = [
  { id: 1, name: "Wireless Noise-Cancelling Headphones", category: "Electronics", price: 420, oldPrice: 520, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800", seller: "TechHub Ghana", rating: 4.8, stock: 24, wholesaleMin: 5, description: "Comfortable wireless headphones with rich sound and long battery life.", featured: true },
  { id: 2, name: "Classic Everyday Sneakers", category: "Fashion", price: 280, oldPrice: 350, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", seller: "Streetwear House", rating: 4.7, stock: 40, wholesaleMin: 6, description: "Versatile everyday sneakers with a clean, modern look.", featured: true },
  { id: 3, name: "Minimalist Wrist Watch", category: "Accessories", price: 195, oldPrice: 240, image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800", seller: "Time & Style", rating: 4.6, stock: 18, wholesaleMin: 4, description: "A minimalist watch for everyday outfits and special occasions.", featured: true },
  { id: 4, name: "Skincare Essentials Set", category: "Beauty", price: 165, oldPrice: 210, image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800", seller: "Glow Store", rating: 4.9, stock: 32, wholesaleMin: 3, description: "A simple skincare set for a refreshing daily routine.", featured: true },
  { id: 5, name: "Modern Lounge Chair", category: "Home", price: 890, oldPrice: 0, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800", seller: "HomeSpace", rating: 4.5, stock: 8, wholesaleMin: 2, description: "A comfortable accent chair for contemporary living spaces.", featured: false },
  { id: 6, name: "Smart Fitness Band", category: "Electronics", price: 230, oldPrice: 280, image: "https://images.unsplash.com/photo-1557935728-e6d1eaabe558?w=800", seller: "TechHub Ghana", rating: 4.4, stock: 27, wholesaleMin: 5, description: "Track everyday activity, workouts and notifications.", featured: false },
  { id: 7, name: "Travel Backpack", category: "Fashion", price: 310, oldPrice: 0, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800", seller: "Streetwear House", rating: 4.7, stock: 16, wholesaleMin: 4, description: "A practical backpack with room for daily essentials.", featured: false },
  { id: 8, name: "Ceramic Tableware Set", category: "Home", price: 260, oldPrice: 300, image: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=800", seller: "HomeSpace", rating: 4.6, stock: 12, wholesaleMin: 3, description: "A stylish ceramic set for dining and entertaining.", featured: false }
];

function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { products: starterProducts, orders: [], messages: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return { products: starterProducts, orders: [], messages: [] }; }
}
let db = loadDb();
function saveDb() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "TRAP MARKET API" }));
app.get("/api/products", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const category = String(req.query.category || "All");
  const products = db.products.filter(p =>
    (category === "All" || p.category === category) &&
    (!q || `${p.name} ${p.category} ${p.seller}`.toLowerCase().includes(q))
  );
  res.json(products);
});

app.post("/api/products", (req, res) => {
  const { name, category, price, image, seller, description, stock, wholesaleMin } = req.body;
  if (!name || !category || !Number.isFinite(Number(price)) || Number(price) <= 0) {
    return res.status(400).json({ error: "Enter a product name, category and valid price." });
  }
  const product = {
    id: Date.now(), name: String(name).trim(), category, price: Number(price),
    oldPrice: 0, image: image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    seller: seller || "New TRAP MARKET Seller", rating: 5, stock: Math.max(0, Number(stock) || 0),
    wholesaleMin: Math.max(1, Number(wholesaleMin) || 1), description: description || "", featured: false
  };
  db.products.unshift(product);
  saveDb();
  res.status(201).json(product);
});

app.post("/api/orders", (req, res) => {
  const { customer, phone, address, items, paymentMethod } = req.body;
  if (!customer || !phone || !address || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Please provide your contact details, delivery address and cart items." });
  }
  let total = 0;
  const orderItems = [];
  for (const item of items) {
    const product = db.products.find(p => p.id === Number(item.id));
    const quantity = Math.max(1, Number(item.quantity) || 1);
    if (!product || product.stock < quantity) {
      return res.status(400).json({ error: `Not enough stock for ${product ? product.name : "one of your items"}.` });
    }
    total += product.price * quantity;
    orderItems.push({ id: product.id, name: product.name, price: product.price, quantity });
  }
  orderItems.forEach(item => {
    const product = db.products.find(p => p.id === item.id);
    product.stock -= item.quantity;
  });
  const order = {
    id: "TM-" + Date.now(), customer, phone, address, items: orderItems,
    total, currency: "GHS", paymentMethod: paymentMethod || "Pay on delivery",
    status: "Received", createdAt: new Date().toISOString()
  };
  db.orders.unshift(order);
  saveDb();
  res.status(201).json(order);
});

app.get("/api/orders", (_req, res) => res.json(db.orders));
app.post("/api/messages", (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: "Name and message are required." });
  db.messages.unshift({ id: Date.now(), name, email: email || "", message, createdAt: new Date().toISOString() });
  saveDb();
  res.status(201).json({ ok: true });
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`TRAP MARKET running at http://localhost:${PORT}`));
