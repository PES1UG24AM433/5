const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ["staff", "manager"],
      default: "staff"
    }
  },
  { timestamps: true }
);

staffSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  // Avoid hashing a password that is already bcrypt-hashed.
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return;

  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model("Staff", staffSchema);
