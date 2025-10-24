import { getCookie, deleteCookie, setCookie } from "cookies-next";
import { api, getApiBase } from "../lib/api";
import React, { useState, useEffect, useContext, createContext } from "react";

type AdminAuthType = {
  admin: null | Admin;
  login?: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message: string;
  }>;
  logout?: () => void;
};

const initialAdminAuth: AdminAuthType = {
  admin: null,
};

const adminAuthContext = createContext<AdminAuthType>(initialAdminAuth);

type Admin = {
  id: number;
  email: string;
  name: string;
  role: string;
  token: string;
};

export function ProvideAdminAuth({ children }: { children: React.ReactNode }) {
  const auth = useProvideAdminAuth();
  return <adminAuthContext.Provider value={auth}>{children}</adminAuthContext.Provider>;
}

export const useAdminAuth = () => {
  return useContext(adminAuthContext);
};

function useProvideAdminAuth() {
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    const initialAuth = getCookie("admin");
    console.log('[AdminAuth] Loading admin from cookie:', initialAuth);
    if (initialAuth) {
      try {
        const initAdmin = JSON.parse(initialAuth as string);
        console.log('[AdminAuth] Admin loaded:', initAdmin);
        setAdmin(initAdmin);
      } catch (e) {
        console.error('[AdminAuth] Failed to parse admin cookie:', e);
      }
    } else {
      console.log('[AdminAuth] No admin cookie found');
    }
  }, []);

  useEffect(() => {
    if (admin) {
      console.log('[AdminAuth] Saving admin to cookie:', admin);
      setCookie("admin", JSON.stringify(admin), { path: "/" });
    } else {
      console.log('[AdminAuth] Admin is null, not saving cookie');
    }
  }, [admin]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post(`/api/v1/admin/auth/login`, {
        email,
        password,
      });
      const loginResponse = response.data;
      const admin: Admin = {
        id: +loginResponse.data.id,
        email,
        name: loginResponse.data.name,
        role: loginResponse.data.role,
        token: loginResponse.token,
      };
      setAdmin(admin);
      return {
        success: true,
        message: "login_successful",
      };
    } catch (err) {
      return {
        success: false,
        message: "incorrect",
      };
    }
  };

  const logout = () => {
    setAdmin(null);
    deleteCookie("admin", { path: "/" });
  };

  return {
    admin,
    login,
    logout,
  };
}
