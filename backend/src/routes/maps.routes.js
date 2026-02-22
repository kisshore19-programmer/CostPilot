import express from "express";
import { mockRoute } from "../engine/maps/mockMaps.js";

export const mapsRouter = express.Router();

mapsRouter.post("/", (req, res) => {
  const { origin, destination } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({ error: "origin and destination required" });
  }

  const result = mockRoute(origin, destination);

  res.json(result);
});
