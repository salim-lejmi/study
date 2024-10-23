// Update the GroupDetailsScreen.js import and icon section:

import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { AuthContext } from '../services/AuthService';
import { getGroupMembers, joinStudyGroup, getAvailability, checkMembership } from '../services/DatabaseService';
import AvailabilityPicker from '../components/AvailabilityPicker';
import GroupChat from '../components/GroupChat';

// Simple Message Icon Component
const MessageIcon = () => (
  <View style={styles.messageIconContainer}>
    <View style={styles.messageCircle}>
      <View style={styles.messageCircleDot} />
    </View>
  </View>
);

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={styles.messageIcon} 
          onPress={() => setShowChat(true)}
        >
          <MessageIcon />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

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
      console.error('Error fetching group details:', error);
    }
  };

  const handleJoinGroup = async () => {
    try {
      const isMember = await checkMembership(groupId, user.id);
      if (isMember) {
        Alert.alert('Info', 'You are already a member of this group');
        return;
      }
      await joinStudyGroup(groupId, user.id);
      Alert.alert('Success', 'You have joined the group');
      fetchGroupDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to join the group');
    }
  };

  const handleAvailabilityUpdate = (newAvailability) => {
    setAvailability(newAvailability);
  };

  const renderMember = ({ item }) => (
    <Text style={styles.memberItem}>{item.name}</Text>
  );

  return (
    <View style={styles.container}>
      <GroupChat
        groupId={groupId}
        currentUser={user}
        visible={showChat}
        onClose={() => setShowChat(false)}
      />
      
      <Text style={styles.title}>Group Members:</Text>
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id.toString()}
      />
      <Button title="Join Group" onPress={handleJoinGroup} />
      <Text style={styles.title}>Group Availability:</Text>
      <AvailabilityPicker 
        groupId={groupId} 
        availability={availability} 
        onAvailabilityUpdate={handleAvailabilityUpdate}
      />
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
  messageIcon: {
    marginRight: 16,
    padding: 8,
  },
  messageIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageCircleDot: {
    width: 4,
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});

export default GroupDetailsScreen;