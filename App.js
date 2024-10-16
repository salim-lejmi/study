import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './services/AuthService';
import { initDatabase, closeDatabase } from './services/DatabaseService';

export default function App() {
  useEffect(() => {
    initDatabase()
      .then(() => console.log('Database initialized'))
      .catch((error) => console.error('Database initialization error:', error));

    return () => {
      closeDatabase();
    };
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
