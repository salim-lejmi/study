import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDatabase, resetDatabaseConnection, checkEmailExists } from './DatabaseService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      await resetDatabaseConnection(); // Ensure clean database state
      const db = openDatabase();

      return new Promise((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql(
            'SELECT * FROM users WHERE email = ? AND password = ?',
            [email, password],
            (_, { rows }) => {
              if (rows.length > 0) {
                const user = rows.item(0);
                setUser(user);
                AsyncStorage.setItem('user', JSON.stringify(user));
                resolve(user);
              } else {
                reject(new Error('Invalid credentials'));
              }
            },
            (_, error) => {
              console.error('Login query error:', error);
              reject(new Error('Database error during login'));
            }
          );
        }, (error) => {
          console.error('Login transaction error:', error);
          reject(new Error('Database error during login'));
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    if (!name || !email || !password) {
      throw new Error('All fields are required');
    }

    try {
      await resetDatabaseConnection(); // Ensure clean database state
      const emailExists = await checkEmailExists(email);
      
      if (emailExists) {
        throw new Error('Email already registered');
      }

      const db = openDatabase();
      
      return new Promise((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, password],
            (_, { insertId }) => {
              const newUser = { id: insertId, name, email };
              setUser(newUser);
              AsyncStorage.setItem('user', JSON.stringify(newUser));
              resolve(newUser);
            },
            (_, error) => {
              console.error('Registration query error:', error);
              reject(new Error('Error creating account'));
            }
          );
        }, (error) => {
          console.error('Registration transaction error:', error);
          reject(new Error('Error creating account'));
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      await resetDatabaseConnection(); // Clean up database connection on logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};