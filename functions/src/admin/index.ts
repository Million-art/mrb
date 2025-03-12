import * as functions from "firebase-functions";
import admin from '../firebase'; 
import * as nodemailer from "nodemailer";
import * as bcrypt from "bcrypt";
import cors from "cors";
import { Request, Response } from "express";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Load environment variables
const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailUser = process.env.EMAIL_USER;

// Validate SMTP config
if (!smtpHost || !smtpUser || !smtpPass || !emailUser) {
  throw new Error("SMTP configuration is missing in Firebase config.");
}

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: 587,
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

// Enable CORS
const corsHandler = cors({ origin: true });

// Define the type for the `data` parameter
interface ActivationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

// Cloud Function to send activation link
exports.sendActivationLink = functions.https.onRequest((req: Request, res: Response) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  // Handle actual request
  corsHandler(req, res, async () => {
    try {
      const data = req.body as ActivationData;

      // Destructure data fields
      const { firstName, lastName, email, phone, password } = data;

      // Validate required fields
      if (!firstName || !lastName || !email || !phone || !password) {
        res.status(400).json({ error: "All fields are required." });
        return;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Save user data to Firestore temporarily
      const pendingUserRef = admin.firestore().collection("pendingRegistrations").doc();
      await pendingUserRef.set({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Generate activation link
      const activationLink = `https://localhost:5173/activate?token=${pendingUserRef.id}`;

      // Send activation email
      const mailOptions = {
        from: `"Mrbeas" <${emailUser}>`,
        to: email,
        subject: "Activate Your Account",
        html: `
          <p>Hello ${firstName} ${lastName},</p>
          <p>Click the link below to activate your account:</p>
          <p><a href="${activationLink}" target="_blank">Activate Account</a></p>
        `,
      };

      await transporter.sendMail(mailOptions);

      // Set CORS headers for the actual response
      res.set("Access-Control-Allow-Origin", "*");
      res.status(200).json({ success: true, message: "Activation email sent successfully." });
    } catch (error) {
      console.error("Error sending activation email:", error);
      res.status(500).json({ error: "Failed to send activation email." });
    }
  });
});