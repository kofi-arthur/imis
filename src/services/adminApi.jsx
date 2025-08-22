import Axios from "axios";
import { errorToast, successToast } from "../components/toast.jsx";

export const api = "http://localhost:3300";
// export const api = "http://192.168.203.54:3300";

export const axios = Axios.create({
  baseURL: api,
  withCredentials: true,
});

// Fetch all users for addition to system
export const fetchAllUsers = async () => {
  try {
    const response = await axios.get(`/user-access/fetchAllUsers`);
    const users = await response.data.users;
    return users;
  } catch (error) {
    console.log("error fetching users", error);
    return errorToast("An error occured. Please try again later");
  }
};
