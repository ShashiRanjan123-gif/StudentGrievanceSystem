import axios from "axios";

const API = axios.create({
  baseURL: "https://studentgrievancesystem.onrender.com"
});

export default API;