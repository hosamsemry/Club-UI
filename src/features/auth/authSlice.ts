import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, UserRole } from '@/types';
import { clearTokens, getAccessToken, getRefreshToken, parseJwt, setAccessToken, setTokens } from '@/utils/auth';

function loadInitialState(): AuthState {
  const access = getAccessToken();
  const refresh = getRefreshToken();
  if (access && refresh) {
    const payload = parseJwt(access);
    return {
      access,
      refresh,
      role: (payload.role as UserRole) ?? null,
      email: payload.email ?? null,
      isAuthenticated: true,
    };
  }
  return { access: null, refresh: null, role: null, email: null, isAuthenticated: false };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    loginSuccess(state, action: PayloadAction<{ access: string; refresh: string }>) {
      const { access, refresh } = action.payload;
      setTokens(access, refresh);
      const payload = parseJwt(access);
      state.access = access;
      state.refresh = refresh;
      state.role = (payload.role as UserRole) ?? null;
      state.email = payload.email ?? null;
      state.isAuthenticated = true;
    },
    tokenUpdated(state, action: PayloadAction<{ access: string }>) {
      setAccessToken(action.payload.access);
      const payload = parseJwt(action.payload.access);
      state.access = action.payload.access;
      state.role = (payload.role as UserRole) ?? state.role;
      state.email = payload.email ?? state.email;
    },
    logout(state) {
      clearTokens();
      state.access = null;
      state.refresh = null;
      state.role = null;
      state.email = null;
      state.isAuthenticated = false;
    },
  },
});

export const { loginSuccess, tokenUpdated, logout } = authSlice.actions;
export default authSlice.reducer;
