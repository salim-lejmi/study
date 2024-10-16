import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../services/AuthService';
import { getGroupMembers, joinStudyGroup, getAvailability } from '../services/DatabaseService';
import AvailabilityPicker from '../components/AvailabilityPicker';

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [availability, setAvailability] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchGroupDetails();
  }, []);

  const fetchGroupDetails = async () => {
    try {
      const groupMembers = await getGroupMembers(groupId);
      setMembers(groupMembers);
      const groupAvailability = await getAvailability(groupId);
      setAvailability(groupAvailability);
    } catch (error) {
      console.error('erreur:', error);
    }
  };

  const handleJoinGroup = async () => {
    try {
      await joinStudyGroup(groupId, user.id);
      Alert.alert('Success', 'vous aves joindrez le groupe');
      fetchGroupDetails();
    } catch (error) {
      Alert.alert('Error', 'erreur');
    }
  };

  const renderMember = ({ item }) => (
    <Text style={styles.memberItem}>{item.name}</Text>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Members:</Text>
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id.toString()}
      />
      <Button title="Joindre groupe" onPress={handleJoinGroup} />
      <Text style={styles.title}>Group Availability:</Text>
      <AvailabilityPicker groupId={groupId} availability={availability} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  memberItem: {
    fontSize: 16,
    marginBottom: 4,
  },
});

export default GroupDetailsScreen;