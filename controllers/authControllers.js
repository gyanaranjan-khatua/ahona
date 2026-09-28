const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/db");


// ======================================================
// ADMIN LOGIN
// ======================================================

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Find user
        const [users] = await pool.execute(
            "SELECT * FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        // User doesn't exist
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const user = users[0];

        // Check admin
        if (!user.is_admin) {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                is_admin: user.is_admin,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        // Send response
        return res.status(200).json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                is_admin: user.is_admin,
            },
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


module.exports = {
    login,
};