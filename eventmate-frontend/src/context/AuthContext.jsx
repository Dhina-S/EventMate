import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

/**
 * Decodes a JWT and returns true if it is expired (or malformed).
 */
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds; Date.now() is in milliseconds
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // Treat malformed tokens as expired
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.token && !isTokenExpired(parsedUser.token)) {
        return parsedUser;
      } else {
        localStorage.removeItem('user');
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  // ✅ UPDATED LOGIN FUNCTION
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data; // Includes token, name, email, role

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Return success AND the user data so we can check the role immediately
      return { success: true, user: userData }; 

    } catch (error) {
      console.error("Login Failed:", error);
      if (!error.response) {
        return { success: false, message: "Network Error: unable to reach backend" };
      }
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Login failed";
      return { success: false, message };
    }
  };

  const register = async (name, email, password, phone, role) => {
    try {
      await api.post('/auth/register', { name, email, password, phoneNumber: phone, role });
      return { success: true };
    } catch (error) {
      console.error("Registration Failed:", error);
      return { success: false, message: error.response?.data || "Registration failed" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Optional: Redirect to login handled by protected routes
  };

  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);