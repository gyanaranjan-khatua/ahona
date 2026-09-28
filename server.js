const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { testDatabaseConnection } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");

const app = express();


// Middleware
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// Static uploaded images
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);


// API routes
app.use("/api/auth", authRoutes);

app.use("/api/services", serviceRoutes);

app.use("/api/enquiries", enquiryRoutes);


// Test API
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Ahona Services API is running",
    });
});


// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found",
    });
});


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {

    console.log(`Server running on http://localhost:${PORT}`);

    await testDatabaseConnection();
});