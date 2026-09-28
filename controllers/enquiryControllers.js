const { pool } = require("../config/db");


const createEnquiry = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            name,
            phone,
            email,
            address,
            service_ids,
            message
        } = req.body;

        // Validate
        if (
            !name ||
            !phone ||
            !email ||
            !address ||
            !Array.isArray(service_ids) ||
            service_ids.length === 0
        ) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Name, phone, email, address and at least one service are required",
            });
        }

        await connection.beginTransaction();

        // Check that selected services exist
        const placeholders =
            service_ids.map(() => "?").join(",");

        const [services] = await connection.execute(
            `SELECT id
             FROM services
             WHERE id IN (${placeholders})`,
            service_ids
        );

        if (services.length !== service_ids.length) {
            await connection.rollback();
            connection.release();

            return res.status(400).json({
                success: false,
                message: "One or more selected services are invalid",
            });
        }

        // Create enquiry
        const [enquiryResult] =
            await connection.execute(
                `INSERT INTO enquiries
                (
                    name,
                    phone,
                    email,
                    address,
                    message
                )
                VALUES (?, ?, ?, ?, ?)`,
                [
                    name,
                    phone,
                    email,
                    address,
                    message || null,
                ]
            );

        const enquiryId =
            enquiryResult.insertId;

        // Insert selected services
        for (const serviceId of service_ids) {

            await connection.execute(
                `INSERT INTO enquiry_services
                (
                    enquiry_id,
                    service_id
                )
                VALUES (?, ?)`,
                [
                    enquiryId,
                    serviceId,
                ]
            );
        }

        await connection.commit();

        connection.release();

        return res.status(201).json({
            success: true,
            message: "Enquiry submitted successfully",
            enquiry_id: enquiryId,
            service_ids,
        });

    } catch (error) {

        await connection.rollback();

        connection.release();

        console.error(
            "Create enquiry error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to submit enquiry",
        });
    }
};



const getAllEnquiries = async (req, res) => {
    try {
        const [enquiries] = await pool.execute(`
            SELECT
                e.id,
                e.name,
                e.phone,
                e.email,
                e.address,
                e.message,
                e.created_at,

                GROUP_CONCAT(
                    s.name
                    ORDER BY s.name
                    SEPARATOR ', '
                ) AS services

            FROM enquiries e

            LEFT JOIN enquiry_services es
                ON e.id = es.enquiry_id

            LEFT JOIN services s
                ON es.service_id = s.id

            GROUP BY
                e.id,
                e.name,
                e.phone,
                e.email,
                e.address,
                e.message,
                e.created_at

            ORDER BY e.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            data: enquiries,
        });

    } catch (error) {
        console.error("Get enquiries error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch enquiries",
        });
    }
};



const getEnquiry = async (req, res) => {

    try {

        const { id } = req.params;


        const [enquiries] = await pool.execute(

            `SELECT

                e.*,

                s.name AS service_name,
                s.price AS service_price,
                s.service_type

             FROM enquiries e

             INNER JOIN services s
                ON e.service_id = s.id

             WHERE e.id = ?`,

            [id]

        );


        if (enquiries.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Enquiry not found",

            });
        }


        res.json({

            success: true,

            data: enquiries[0],

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch enquiry",

        });
    }
};



const deleteEnquiry = async (req, res) => {

    try {

        const { id } = req.params;


        const [result] = await pool.execute(

            "DELETE FROM enquiries WHERE id = ?",

            [id]

        );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message: "Enquiry not found",

            });
        }


        res.json({

            success: true,

            message:
                "Enquiry deleted successfully",

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Failed to delete enquiry",

        });
    }
};



module.exports = {

    createEnquiry,

    getAllEnquiries,

    getEnquiry,

    deleteEnquiry,

};