// Update the GroupDetailsScreen.js import and icon section:

import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
  Dimensions
} from 'react-native';
import { AuthContext } from '../services/AuthService';
import { getGroupMembers, joinStudyGroup, getAvailability, checkMembership } from '../services/DatabaseService';
import AvailabilityPicker from '../components/AvailabilityPicker';
import GroupChat from '../components/GroupChat';

const { width } = Dimensions.get('window');

// Simple Message Icon Component
const MessageIcon = () => (
  <View style={styles.messageIconContainer}>
    <View style={styles.messageIconInner}>
      <View style={styles.messageIconDot} />
    </View>
  </View>
);
const CustomButton = ({ onPress, title, style }) => (
  <TouchableOpacity 
    style={[styles.customButton, style]} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.customButtonText}>{title}</Text>
  </TouchableOpacity>
);
const MemberCard = ({ name, userId, onPress }) => (
  <TouchableOpacity style={styles.memberCard} onPress={onPress}>
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
    </View>
    <Text style={styles.memberName}>{name}</Text>
  </TouchableOpacity>
);

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const { user } = useContext(AuthContext);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => setShowChat(true)}
        >
          <MessageIcon />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#ffffff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
      },
    });
  }, [navigation]);

  useEffect(() => {
    fetchGroupDetails();
    checkUserMembership();
  }, []);
  const checkUserMembership = async () => {
    try {
      const membershipStatus = await checkMembership(groupId, user.id);
      setIsMember(membershipStatus);
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

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
        Alert.alert('Already a Member', 'You are already part of this study group');
        return;
      }
      await joinStudyGroup(groupId, user.id);
      Alert.alert('Welcome!', 'You have successfully joined the group');
      fetchGroupDetails();
    } catch (error) {
      Alert.alert('Error', 'Unable to join the group. Please try again.');
    }
  };

  const renderMember = ({ item }) => (
    <MemberCard 
      name={item.name}
      userId={item.id}
      onPress={() => navigation.navigate('Profile', { userId: item.id })}
    />
  );
  
  const handleAvailabilityUpdate = (newAvailability) => {
    setAvailability(newAvailability);
  };

 

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <View style={styles.container}>
        <GroupChat
          groupId={groupId}
          currentUser={user}
          visible={showChat}
          onClose={() => setShowChat(false)}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item) => item.id.toString()}
            horizontal={false}
            numColumns={2}
            columnWrapperStyle={styles.memberRow}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <AvailabilityPicker 
    groupId={groupId} 
    availability={availability} 
    onAvailabilityUpdate={handleAvailabilityUpdate}
    isMember={isMember}  // Add this prop
  />
        </View>

        <CustomButton 
          title="Join Study Group" 
          onPress={handleJoinGroup}
          style={styles.joinButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  memberRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  memberCard: {
    width: (width - 48) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  customButton: {
    backgroundColor: '#6200ee',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 3,
  },
  customButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  joinButton: {
    marginTop: 'auto',
    marginBottom: 16,
  },
  headerButton: {
    marginRight: 16,
  },
  messageIconContainer: {
    padding: 8,
  },
  messageIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIconDot: {
    width: 6,
    height: 6,
    backgroundColor: '#6200ee',
    borderRadius: 3,
  },
});



export default GroupDetailsScreen;