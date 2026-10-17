
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

async function promoteAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    const email = process.argv[2]?.trim().toLowerCase();

    if (!email) {
      throw new Error(
        "Provide the registered email: npm run admin:promote -- your@email.com"
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error(
        "No account found for this email. Register the account first."
      );
    }

    if (user.role === "admin") {
      console.log(`${user.email} is already an administrator.`);
      return;
    }

    user.role = "admin";
    await user.save();

    console.log("Administrator role assigned successfully.");
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
  } catch (error) {
    console.error("Admin promotion failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

promoteAdmin();
