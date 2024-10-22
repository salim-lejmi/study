import React, { useState, useContext } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../services/AuthService';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useContext(AuthContext);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setIsSubmitting(false);
  };

  const handleRegister = async () => {
    if (isSubmitting) return;
  
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
  
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      Alert.alert('Success', 'Registration successful', [
        { 
          text: 'OK', 
          onPress: () => {
            resetForm();
            navigation.navigate('Login'); // Changed to navigate to Login instead of Home
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Registration Failed', error.message, [
        {
          text: 'OK',
          onPress: () => setIsSubmitting(false)
        }
      ]);
    }
  };
  

  const handleBackToLogin = () => {
    resetForm();
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, isSubmitting && styles.disabled]}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        editable={!isSubmitting}
      />
      <TextInput
        style={[styles.input, isSubmitting && styles.disabled]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isSubmitting}
      />
      <TextInput
        style={[styles.input, isSubmitting && styles.disabled]}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isSubmitting}
      />
      <Button 
        title={isSubmitting ? "Registering..." : "Register"}
        onPress={handleRegister}
        disabled={isSubmitting}
      />
      <Button
        title="Back to Login"
        onPress={handleBackToLogin}
        disabled={isSubmitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  disabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
});

export default RegisterScreen;