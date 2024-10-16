import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDatabase } from './DatabaseService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

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
    try {
      const db = await openDatabase();
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
                reject('Invalid credentials');
              }
            },
            (_, error) => {
              reject(error);
            }
          );
        });
      });
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const db = await openDatabase();
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
              reject(error);
            }
          );
        });
      });
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};