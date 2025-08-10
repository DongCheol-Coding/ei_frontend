import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login as loginApi } from "../user/userApi";
import { tokenStorage } from "../../lib/tokenStorage";

const initialToken = tokenStorage.get();

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await loginApi({ email, password }); 
      return data.accessToken;
    } catch (e) {
      return rejectWithValue(e.message || "로그인 실패");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: !!initialToken,
    accessToken: initialToken,
    status: "idle",
    error: null,
  },
  reducers: {
    logout(state) {
      state.isAuthenticated = false;
      state.accessToken = null;
      tokenStorage.clear();
    },
  },
  extraReducers: (b) => {
    b.addCase(loginThunk.pending, (s) => {
      s.status = "loading"; s.error = null;
    });
    b.addCase(loginThunk.fulfilled, (s, a) => {
      s.status = "succeeded";
      s.accessToken = a.payload;
      s.isAuthenticated = true;
      tokenStorage.set(a.payload);
    });
    b.addCase(loginThunk.rejected, (s, a) => {
      s.status = "failed"; s.error = a.payload;
    });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
