const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");


const {
    createEnquiry,
    getAllEnquiries,
    getEnquiry,
    deleteEnquiry,
} = require("../controllers/enquiryControllers");


// Public
router.post("/", createEnquiry);


// Admin
router.get(
    "/",
    authMiddleware,
    getAllEnquiries
);


router.get(
    "/:id",
    authMiddleware,
    getEnquiry
);


router.delete(
    "/:id",
    authMiddleware,
    deleteEnquiry
);


module.exports = router;