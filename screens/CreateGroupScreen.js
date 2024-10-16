import React, { useState, useContext } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../services/AuthService';
import { createStudyGroup } from '../services/DatabaseService';

const CreateGroupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const { user } = useContext(AuthContext);

  const handleCreateGroup = async () => {
    try {
      await createStudyGroup(name, subject, user.id);
      Alert.alert('Success', 'Study group created successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create study group');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Group Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Subject"
        value={subject}
        onChangeText={setSubject}
      />
      <Button title="Create Group" onPress={handleCreateGroup} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});

export default CreateGroupScreen;