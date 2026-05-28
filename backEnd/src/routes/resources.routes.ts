import express from "express";
import { ResourcesController } from "../controllers/resources.controller.js";

const router = express.Router();
const controller = new ResourcesController();

// New structured endpoints (matching sidebar categories)
router.get("/", (req, res) => controller.getAllResources(req, res));
router.get("/health-wellness", (req, res) => controller.getHealthWellness(req, res));
router.get("/general", (req, res) => controller.getGeneralResources(req, res));

// Legacy endpoints
router.get("/ucalgary", (req, res) => controller.getUCalgaryResources(req, res));
router.get("/ahs", (req, res) => controller.getAHSResources(req, res));
router.get("/su", (req, res) => controller.getSUResources(req, res));

export default router;