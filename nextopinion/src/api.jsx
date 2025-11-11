import axios from "axios";
const API = axios.create({
  baseURL: "http://localhost:5000/api", // adjust if backend URL differs
});
export default API;
