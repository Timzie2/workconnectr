const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");

router.post("/apply", applicationController.applyForJob);

router.get("/", applicationController.getApplications);

router.get("/worker/:worker_id", applicationController.getWorkerApplications);

router.put("/:id/status", applicationController.updateApplicationStatus);

module.exports = router;