import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../services/AuthService';
import { getStudyGroups } from '../services/DatabaseService';
import StudyGroupItem from '../components/StudyGroupItem';

const HomeScreen = ({ navigation }) => {
  const [studyGroups, setStudyGroups] = useState([]);
  const { logout, user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {  // Only fetch if user exists
      fetchStudyGroups();
    }
  }, [user]);  // Re-run when user changes
  const fetchStudyGroups = async () => {
    try {
      const groups = await getStudyGroups();
      setStudyGroups(groups);
    } catch (error) {
      console.error('Error fetching study groups:', error);
      setStudyGroups([]); // Set empty array on error
    }
  };
  const handleDeleteGroup = async (groupId) => {
    if (!user) return; // Guard clause for null user
    
    try {
      await deleteStudyGroup(groupId);
      fetchStudyGroups();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete group');
    }
  };
  const handleLogout = async () => {
    try {
      setStudyGroups([]); // Clear groups before logout
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
            currentUserId={user?.id} // Use optional chaining
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