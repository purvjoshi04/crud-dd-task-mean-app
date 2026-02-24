require("dotenv").config();

const url = process.env.MONGODB_URL;

if (!url) {
  console.error("MONGODB_URL is NOT set inside the container");
  process.exit(1);
}

// Mask credentials in logs
const safeUrl = url.replace(/\/\/.*@/, "//****:****@");
console.log("Using Mongo URL:", safeUrl);

module.exports = {
  url,
};