import { post } from "axios";

export default async () => {
  try {
    await post("http://localhost:8000/api/auth/register", {
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
