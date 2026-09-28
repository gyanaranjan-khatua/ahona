const { pool } = require("../config/db");
const cloudinary = require("../config/cloudinary");
const uploadToCloudinary = require("../utils/uploadToCloudinary");



const getServices = async (req, res) => {
    try {
        const { type } = req.query;

        let sql = `
            SELECT
                id,
                name,
                description,
                price,
                image_url,
                image_public_id,
                service_type,
                created_at,
                updated_at
            FROM services
        `;

        const params = [];

        if (type) {
            sql += " WHERE service_type = ?";
            params.push(type);
        }

        sql += " ORDER BY created_at DESC";

        const [services] = await pool.execute(sql, params);

        const servicesWithImages = services.map((service) => ({
            ...service,
            image_url: service.image_url || null,
            image_public_id: service.image_public_id || null,
        }));

        res.json({
            success: true,
            data: servicesWithImages,
        });

    } catch (error) {
        console.error("Get services error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch services",
        });
    }
};



const getService = async (req, res) => {

    try {

        const { id } = req.params;


        const [services] = await pool.execute(
            "SELECT * FROM services WHERE id = ?",
            [id]
        );


        if (services.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Service not found",

            });
        }


        const service = services[0];


      service.image_url = service.image_url || null;


        res.json({

            success: true,

            data: service,

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Failed to fetch service",

        });
    }
};



const createService = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            service_type,
        } = req.body;

        if (!name || price === undefined || !service_type) {
            return res.status(400).json({
                success: false,
                message: "Name, price and service type are required",
            });
        }

        if (
            service_type !== "main" &&
            service_type !== "additional"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid service type",
            });
        }

        let imageUrl = null;
        let imagePublicId = null;

        // Upload image to Cloudinary
        if (req.file) {
            const result = await uploadToCloudinary(
                req.file.buffer
            );

            imageUrl = result.secure_url;
            imagePublicId = result.public_id;
        }

        const [result] = await pool.execute(
            `INSERT INTO services
            (
                name,
                description,
                price,
                image_url,
                image_public_id,
                service_type
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                price,
                imageUrl,
                imagePublicId,
                service_type,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: {
                id: result.insertId,
                name,
                description: description || null,
                price,
                image_url: imageUrl,
                image_public_id: imagePublicId,
                service_type,
            },
        });

    } catch (error) {
        console.error("Create service error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create service",
        });
    }
};



const updateService = async (req, res) => {

    try {

        const { id } = req.params;


        const [existingServices] = await pool.execute(

            "SELECT * FROM services WHERE id = ?",

            [id]

        );


        if (existingServices.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Service not found",

            });
        }


        const existingService =
            existingServices[0];


        const {
            name,
            description,
            price,
            service_type
        } = req.body;


        if (
            service_type &&
            service_type !== "main" &&
            service_type !== "additional"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Service type must be main or additional",

            });
        }

let imageUrl = existingService.image_url;
let imagePublicId = existingService.image_public_id;


  if (req.file) {
    if (existingService.image_public_id) {
        await cloudinary.uploader.destroy(
            existingService.image_public_id
        );
    }

    const result = await uploadToCloudinary(
        req.file.buffer
    );

    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
}
await pool.execute(
    `UPDATE services
     SET
        name = ?,
        description = ?,
        price = ?,
        image_url = ?,
        image_public_id = ?,
        service_type = ?
     WHERE id = ?`,
    [
        name ?? existingService.name,
        description ?? existingService.description,
        price ?? existingService.price,
        imageUrl,
        imagePublicId,
        service_type ?? existingService.service_type,
        id,
    ]
);

        const [updatedService] =
        await pool.execute(
    `UPDATE services
     SET
        name = ?,
        description = ?,
        price = ?,
        image_url = ?,
        image_public_id = ?,
        service_type = ?
     WHERE id = ?`,
    [
        name,
        description,
        price,
        imageUrl,
        imagePublicId,
        service_type,
        id,
    ]
);


        res.json({

            success: true,

            message:
                "Service updated successfully",

            data: updatedService[0],

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Failed to update service",

        });
    }
};



const deleteService = async (req, res) => {

    try {

        const { id } = req.params;


        const [services] = await pool.execute(

            "SELECT * FROM services WHERE id = ?",

            [id]

        );


        if (services.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Service not found",

            });
        }


        const service = services[0];


        if (service.image) {

            const imagePath = path.join(

                __dirname,

                "../uploads/services",

                service.image

            );


            if (fs.existsSync(imagePath)) {

                fs.unlinkSync(imagePath);

            }

        }


        await pool.execute(

            "DELETE FROM services WHERE id = ?",

            [id]

        );


        res.json({

            success: true,

            message:
                "Service deleted successfully",

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Failed to delete service",

        });
    }
};



module.exports = {

    getServices,

    getService,

    createService,

    updateService,

    deleteService,

};