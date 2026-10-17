require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("./models/User");

async function createAdmin() {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in your .env file!");
    }

    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB Atlas...");

    const name = "Ali Sher";
    const email = "alisher4u23@gmail.com"; 
    const plainPassword = "alisher$520#123"; 

    // Delete existing user with this email to avoid duplicates
    await Admin.deleteOne({ email });

    // Save to database including role: "admin"
    // Note: Your schema has a pre-save hook that hashes the password automatically, 
    // but passing a pre-hashed or plain password works. Let's pass plain password 
    // so the schema's pre-save hook handles it properly!
    const newAdmin = new Admin({
      name: name,
      email: email,
      password: plainPassword,
      role: "admin", // Explicitly set role to admin
    });

    await newAdmin.save();
    console.log("Admin user successfully created with admin role in MongoDB Atlas!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();