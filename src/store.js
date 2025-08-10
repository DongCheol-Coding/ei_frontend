import { configureStore } from "@reduxjs/toolkit";
import auth from "./services/auth/authSlice";

export const store = configureStore({ reducer: { auth } });
