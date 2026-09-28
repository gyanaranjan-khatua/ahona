const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const upload =
    require("../middleware/uploadMiddleware");

const {
    getServices,
    getService,
    createService,
    updateService,
    deleteService,
} = require("../controllers/serviceController");


router.get("/", getServices);

router.get("/:id", getService);


router.post(
    "/",
    authMiddleware,
    upload.single("image"),
    createService
);


router.put(
    "/:id",
    authMiddleware,
    upload.single("image"),
    updateService
);


router.delete(
    "/:id",
    authMiddleware,
    deleteService
);


module.exports = router;