const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: { type: String, required: true, select: false }
  },
  { timestamps: true }
);

studentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  // Avoid hashing a password that is already bcrypt-hashed.
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return;

  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model("Student", studentSchema);
