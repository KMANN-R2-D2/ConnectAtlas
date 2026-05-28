import { Request, Response } from "express";
import { UCalgaryService } from "../services/ucalgary.service.js";
import { AHSService } from "../services/ahs.service.js";
import { StudentUnionService } from "../services/studentUnion.service.js";

const ucalgaryService = new UCalgaryService();
const ahsService = new AHSService();
const suService = new StudentUnionService();

export class ResourcesController {

  /**
   * GET /api/resources
   * Returns all resources structured by the two sidebar categories:
   *   1. healthAndWellness  — UCalgary wellness + SU wellness + AHS (at bottom)
   *   2. generalResources   — UCalgary non-health + SU non-health
   */
  async getAllResources(_req: Request, res: Response) {
    try {
      const ucalgaryWellness = ucalgaryService.getWellnessResourcesStatic();
      const ucalgaryGeneral = ucalgaryService.getGeneralResourcesStatic();
      const suWellness = suService.getWellnessResources();
      const suGeneral = suService.getGeneralResources();

      res.json({
        healthAndWellness: {
          ucalgary: {
            mentalHealth: ucalgaryWellness.mentalHealth,
            medicalClinic: ucalgaryWellness.medicalClinic,
            sexualViolenceSupport: ucalgaryWellness.sexualViolenceSupport,
            campusSecurity: ucalgaryWellness.campusSecurity,
          },
          studentUnion: suWellness,
          // AHS is at the bottom of this section per spec
          ahs: ucalgaryWellness.ahs,
        },
        generalResources: {
          ucalgary: ucalgaryGeneral,
          studentUnion: suGeneral,
        },
      });
    } catch (error) {
      console.error("Error fetching all resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  }

  /**
   * GET /api/resources/health-wellness
   * Returns Health & Wellness section only (for sidebar panel)
   */
  getHealthWellness(_req: Request, res: Response) {
    try {
      const ucalgaryWellness = ucalgaryService.getWellnessResourcesStatic();
      const suWellness = suService.getWellnessResources();

      res.json({
        ucalgary: {
          mentalHealth: ucalgaryWellness.mentalHealth,
          medicalClinic: ucalgaryWellness.medicalClinic,
          sexualViolenceSupport: ucalgaryWellness.sexualViolenceSupport,
          campusSecurity: ucalgaryWellness.campusSecurity,
        },
        studentUnion: suWellness,
        ahs: ucalgaryWellness.ahs, // AHS at bottom
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health & wellness resources" });
    }
  }

  /**
   * GET /api/resources/general
   * Returns General Resources section only (for sidebar panel)
   */
  getGeneralResources(_req: Request, res: Response) {
    try {
      const ucalgaryGeneral = ucalgaryService.getGeneralResourcesStatic();
      const suGeneral = suService.getGeneralResources();

      res.json({
        ucalgary: ucalgaryGeneral,
        studentUnion: suGeneral,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch general resources" });
    }
  }

  // ─── Legacy endpoints (kept for backward-compat) ──────────────────────────

  async getUCalgaryResources(_req: Request, res: Response) {
    try {
      const wellness = ucalgaryService.getWellnessResourcesStatic();
      const general = ucalgaryService.getGeneralResourcesStatic();
      res.json({ wellness, general });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch UCalgary resources" });
    }
  }

  getAHSResources(_req: Request, res: Response) {
    try {
      res.json(ahsService.getResources());
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AHS resources" });
    }
  }

  getSUResources(_req: Request, res: Response) {
    try {
      res.json({
        wellness: suService.getWellnessResources(),
        general: suService.getGeneralResources(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SU resources" });
    }
  }
}