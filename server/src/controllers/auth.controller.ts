import { Request, Response } from "express";
// import { auth } from "../services/firebase.service.js";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // Handle login via Firebase Client SDK normally, 
    // but here we might bridge some server-side session if needed.
    res.json({ message: "Login successful", token: "mock-jwt-token" });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    // Logic to create user in Firebase and initial organization
    res.status(201).json({ message: "User registered" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
