const axios = require("axios");

module.exports = async () => {
  try {
    await axios.post("http://localhost:8000/api/auth/register", {
      username: "test",
      email: "test@example.com",
      full_name: "Test User",
      password: "Password123!",
      confirmPassword: "Password123!",
    });
  } catch (err) {
    console.log("User already exists, continuing...");
  }
};
