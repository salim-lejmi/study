import React, { useState, useContext } from 'react';
import { View, TextInput, Button, StyleSheet, Alert,Image,TouchableOpacity,Text } from 'react-native';
import { AuthContext } from '../services/AuthService';
import theme from '../components/theme';

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
      resetForm();
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
      setIsSubmitting(false);
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
        
        <TouchableOpacity 
          style={styles.linkContainer}
          onPress={() => {
            resetForm();
            navigation.navigate('Login');
          }}
          disabled={isSubmitting}
        >
          <Text style={styles.linkText}>
            You are already a user? Click here
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
    marginTop: 20, 
    marginBottom: 20,
  },
  logo: {
    width: 150, 
    height: 75,  
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  input: {
    height: 45,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10, 
    paddingHorizontal: 12,
    borderRadius: 5,
    fontSize: 14, 
  },
  disabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  linkContainer: {
    marginTop: 15, 
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14, 
  },
});


export default RegisterScreen;