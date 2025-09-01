import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login as loginApi } from "../api/userApi";
import { api } from "../api/basicApi";

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/auth/me");
      return res.data?.data; // { id, email, name, roles }
    } catch (e) {
      return rejectWithValue(e?.response?.data ?? null);
    }
  }
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      await loginApi({ email, password }); // 쿠키 세팅 완료
      const me = await dispatch(fetchMe()).unwrap(); // 사용자 정보 취득
      return me;
    } catch (e) {
      return rejectWithValue(e.message || "로그인 실패");
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await api.post("/api/auth/logout"); // 서버가 쿠키 제거
});

const slice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    hydrated: false, // /me 1회 확인 완료 여부
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setHydrated(state, action) {
      state.hydrated = action.payload ?? true;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMe.fulfilled, (s, a) => {
      s.user = a.payload;
      s.isAuthenticated = !!a.payload;
      s.hydrated = true;
    });
    b.addCase(fetchMe.rejected, (s) => {
      s.user = null;
      s.isAuthenticated = false;
      s.hydrated = true;
    });
    b.addCase(logout.fulfilled, (s) => {
      s.user = null;
      s.isAuthenticated = false;
    });
  },
});

export const { setUser, setHydrated, clearUser } = slice.actions;

export const selectUser = (s) => s.auth.user;
export const selectIsAuth = (s) => s.auth.isAuthenticated;
export const selectHydrated = (s) => s.auth.hydrated;

export default slice.reducer;
