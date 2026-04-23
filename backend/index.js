const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

/* ================== MongoDB Connect ================== */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* ================== Schemas ================== */

// Student Schema
const studentSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});

const Student = mongoose.model("Student", studentSchema);

// Grievance Schema
const grievanceSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: {
        type: String,
        enum: ["Academic", "Hostel", "Transport", "Other"]
    },
    date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ["Pending", "Resolved"],
        default: "Pending"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }
});

const Grievance = mongoose.model("Grievance", grievanceSchema);

/* ================== Middleware ================== */

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: "Invalid token" });
    }
};

/* ================== Auth APIs ================== */

// Register
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new Student({
            name,
            email,
            password: hashedPassword
        });

        await user.save();
        res.json({ message: "User Registered" });

    } catch (err) {
        res.status(400).json({ error: "User already exists" });
    }
});

// Login
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await Student.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({ token });
});

/* ================== Grievance APIs ================== */

// Create grievance
app.post("/api/grievances", authMiddleware, async (req, res) => {
    const grievance = new Grievance({
        ...req.body,
        userId: req.user.id
    });

    await grievance.save();
    res.json(grievance);
});

// Get all grievances
app.get("/api/grievances", authMiddleware, async (req, res) => {
    const data = await Grievance.find({ userId: req.user.id });
    res.json(data);
});

// Get by ID
app.get("/api/grievances/:id", authMiddleware, async (req, res) => {
    const data = await Grievance.findById(req.params.id);
    res.json(data);
});

// Update
app.put("/api/grievances/:id", authMiddleware, async (req, res) => {
    const updated = await Grievance.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(updated);
});

// Delete
app.delete("/api/grievances/:id", authMiddleware, async (req, res) => {
    await Grievance.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// Search
app.get("/api/grievances/search", authMiddleware, async (req, res) => {
    const { title } = req.query;

    const result = await Grievance.find({
        title: { $regex: title, $options: "i" },
        userId: req.user.id
    });

    res.json(result);
});

/* ================== Server ================== */

app.get("/", (req, res) => {
    res.send("Grievance System Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});