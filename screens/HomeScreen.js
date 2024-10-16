import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../services/AuthService';
import { getStudyGroups } from '../services/DatabaseService';
import StudyGroupItem from '../components/StudyGroupItem';

const HomeScreen = ({ navigation }) => {
  const [studyGroups, setStudyGroups] = useState([]);
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    fetchStudyGroups();
  }, []);

  const fetchStudyGroups = async () => {
    try {
      const groups = await getStudyGroups();
      setStudyGroups(groups);
    } catch (error) {
      console.error('erreur:', error);
    }
  };

  const handleCreateGroup = () => {
    navigation.navigate('Creer Groupe');
  };

  const handleGroupPress = (group) => {
    navigation.navigate('GroupDetails', { groupId: group.id });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={studyGroups}
        renderItem={({ item }) => (
          <StudyGroupItem group={item} onPress={() => handleGroupPress(item)} />
        )}
        keyExtractor={(item) => item.id.toString()}
      />
      <Button title="Creer nouveau groupe" onPress={handleCreateGroup} />
      <Button title="Logout" onPress={logout} />
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