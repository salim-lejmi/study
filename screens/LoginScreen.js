// LoginScreen.js
import React, { useState, useContext } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Image, Text, TouchableOpacity } from 'react-native';
import { AuthContext } from '../services/AuthService';
import theme from '../components/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/eduspace.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Login" onPress={handleLogin} />
        
        <TouchableOpacity 
          style={styles.linkContainer}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.linkText}>
            You are not registered yet? Click here
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20, // Reduced from 40
    marginBottom: 20, // Reduced from 40
  },
  logo: {
    width: 150, // Reduced from 200
    height: 75,  // Reduced from 100
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Changed from center to start from top after logo
    paddingTop: 20,
  },
  input: {
    height: 45,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10, // Reduced from 12
    paddingHorizontal: 12,
    borderRadius: 5,
    fontSize: 14, // Added specific font size
  },
  disabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  linkContainer: {
    marginTop: 15, // Reduced from 20
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14, // Reduced from 16
  },
});


export default LoginScreen;