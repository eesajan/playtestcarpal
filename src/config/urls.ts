import dotenv from "dotenv";

dotenv.config();

export const BASE_URL = process.env.CARPAL_BASE_URL ?? "https://qa.carpal.com";

export const ENDPOINTS = {
  login: "/login",
  dashboard: "/bu/dashboard",
  createVehicle: "/bu/vehicles/create",
  createCase: "/bu/cases/create",
} as const;
