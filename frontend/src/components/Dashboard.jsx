import { useState, useEffect } from "react";
import API from "../api";

const Dashboard = () => {
  const [grievances, setGrievances] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Academic");

  const token = localStorage.getItem("token");

  // Fetch Data
  const fetchData = async () => {
    const res = await API.get("/api/grievances", {
      headers: { Authorization: token }
    });
    setGrievances(res.data);
  };

  // Add Grievance
  const addGrievance = async () => {
    await API.post(
      "/api/grievances",
      { title, description, category },
      { headers: { Authorization: token } }
    );
    fetchData();
  };

  // Delete
  const deleteGrievance = async (id) => {
    await API.delete(`/api/grievances/${id}`, {
      headers: { Authorization: token }
    });
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ IMPORTANT: return function ke andar hona chahiye
  return (
    <div>
      <div className="card">
        <h2>Add Grievance</h2>

        <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Description" onChange={(e) => setDescription(e.target.value)} />

        <select onChange={(e) => setCategory(e.target.value)}>
          <option>Academic</option>
          <option>Hostel</option>
          <option>Transport</option>
          <option>Other</option>
        </select>

        <button onClick={addGrievance}>Submit</button>

        <button onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/";
        }}>
          Logout
        </button>
      </div>

      <div className="card">
        <h3>Your Grievances</h3>

        {grievances.map((g) => (
          <div className="grievance" key={g._id}>
            <h4>{g.title}</h4>
            <p>{g.description}</p>
            <p><b>{g.category}</b> | {g.status}</p>
            <button onClick={() => deleteGrievance(g._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;