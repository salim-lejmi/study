import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, Button, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../services/AuthService';
import { getStudyGroups, deleteStudyGroup } from '../services/DatabaseService';
import StudyGroupItem from '../components/StudyGroupItem';

const HomeScreen = ({ navigation }) => {
  const [studyGroups, setStudyGroups] = useState([]);
  const { logout, user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchStudyGroups();
    }
  }, [user]);

  // Add navigation focus listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        fetchStudyGroups();
      }
    });

    return unsubscribe;
  }, [navigation, user]);

  const fetchStudyGroups = async () => {
    try {
      const groups = await getStudyGroups();
      setStudyGroups(groups);
    } catch (error) {
      console.error('Error fetching study groups:', error);
      setStudyGroups([]);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!user) return;

    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudyGroup(groupId);
              await fetchStudyGroups();
              Alert.alert('Success', 'Group deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete group');
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      setStudyGroups([]);
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleGroupPress = (group) => {
    navigation.navigate('GroupDetails', { groupId: group.id });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={studyGroups}
        renderItem={({ item }) => (
          <StudyGroupItem 
            group={item} 
            onPress={() => handleGroupPress(item)}
            onDelete={handleDeleteGroup}
            currentUserId={user?.id}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
      />
      <Button title="Create New Group" onPress={handleCreateGroup} />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default HomeScreen;