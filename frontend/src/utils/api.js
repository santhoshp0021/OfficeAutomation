import axios from "axios";

export const apiFetch = (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : undefined,
    "Content-Type": options.headers?.["Content-Type"] || "application/json",
  };
  return fetch(url, { ...options, headers });
};

export const apiAxios = () => {
  const token = localStorage.getItem("token");
  console.log(token);
  return axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      "Content-Type": "application/json",
    },
  });
};
