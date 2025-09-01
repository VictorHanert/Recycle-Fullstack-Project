import { useEffect, useState } from "react";
import api from "./api/client";

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/").then((res) => setMsg(res.data.message));
  }, []);

  return (
    <div className="p-4 text-xl font-bold">
      React + FastAPI Fullstack Starter 🚀
      <p className="mt-2 text-green-600">{msg}</p>
    </div>
  );
}

export default App;
