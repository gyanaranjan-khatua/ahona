const bcrypt = require("bcryptjs");
const { pool } = require("./config/db");

const createAdmin = async () => {
    try {

        const name = "Ahona Admin";
        const email = "admin@akhona.com";
        const password = "Admin@12345";

        const hashedPassword = await bcrypt.hash(password, 10);

        const [existingUsers] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {

            console.log("Admin already exists.");

            process.exit(0);
        }

        await pool.execute(
            `INSERT INTO users
            (name, email, password, is_admin)
            VALUES (?, ?, ?, ?)`,
            [
                name,
                email,
                hashedPassword,
                true
            ]
        );

        console.log("Admin created successfully.");
        console.log("Email:", email);
        console.log("Password:", password);

        process.exit(0);

    } catch (error) {

        console.error("Error creating admin:");
        console.error(error);

        process.exit(1);
    }
};

createAdmin();