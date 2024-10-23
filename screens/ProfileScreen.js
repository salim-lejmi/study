import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { AuthContext } from '../services/AuthService';
import { getUserProfile, updateUserProfile } from '../services/DatabaseService';

const ProfileScreen = ({ route, navigation }) => {
  const { user: currentUser } = useContext(AuthContext);
  const userId = route.params?.userId || currentUser.id;
  const isOwnProfile = userId === currentUser.id;
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    description: '',
    subjects_of_interest: '',
    joined_groups: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedSubjects, setEditedSubjects] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const userProfile = await getUserProfile(userId);
      setProfile(userProfile);
      setEditedDescription(userProfile.description || '');
      setEditedSubjects(userProfile.subjects_of_interest || '');
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    }
  };

  const handleSave = async () => {
    try {
      await updateUserProfile(userId, editedDescription, editedSubjects);
      setIsEditing(false);
      fetchProfile();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{profile.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>
  
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            multiline
            value={editedDescription}
            onChangeText={setEditedDescription}
            placeholder="Add a description..."
          />
        ) : (
          <Text style={styles.content}>
            {profile.description || 'No description added yet'}
          </Text>
        )}
      </View>
  
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subjects of Interest</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            multiline
            value={editedSubjects}
            onChangeText={setEditedSubjects}
            placeholder="Add subjects you're interested in..."
          />
        ) : (
          <Text style={styles.content}>
            {profile.subjects_of_interest || 'No subjects added yet'}
          </Text>
        )}
      </View>
  
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Joined Groups</Text>
        {profile.joined_groups.length > 0 ? (
          profile.joined_groups.map((group, index) => (
            <Text key={index} style={styles.groupItem}>{group}</Text>
          ))
        ) : (
          <Text style={styles.content}>No groups joined yet</Text>
        )}
      </View>
  
      {isOwnProfile && (
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
  
      {currentUser?.is_admin && !isOwnProfile && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => {
              Alert.alert(
                'Delete User',
                'Are you sure you want to delete this user? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await deleteUser(userId);
                        navigation.goBack();
                        Alert.alert('Success', 'User deleted successfully');
                      } catch (error) {
                        Alert.alert('Error', 'Failed to delete user');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.buttonText}>Delete User</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  content: {
    fontSize: 16,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupItem: {
    fontSize: 16,
    color: '#444',
    paddingVertical: 5,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  
});

export default ProfileScreen;
