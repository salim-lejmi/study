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
import { getGroupMembers, joinStudyGroup, getAvailability, checkMembership, createJoinRequest, removeGroupMember, getGroupCreator } from '../services/DatabaseService';
import AvailabilityPicker from '../components/AvailabilityPicker';
import GroupChat from '../components/GroupChat';

const { width } = Dimensions.get('window');

// Keep existing MessageIcon and CustomButton components...
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

const MemberCard = ({ name, userId, isCreator, onPress, onKick }) => (
  <View style={styles.memberCard}>
    <TouchableOpacity style={styles.memberInfo} onPress={onPress}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
      </View>
      <Text style={styles.memberName}>{name}</Text>
    </TouchableOpacity>
    {isCreator && (
      <TouchableOpacity 
        style={styles.kickButton}
        onPress={onKick}
      >
        <Text style={styles.kickButtonText}>×</Text>
      </TouchableOpacity>
    )}
  </View>
);

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const { user } = useContext(AuthContext);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

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
    checkIfCreator();
  }, []);

  const checkIfCreator = async () => {
    try {
      const creatorId = await getGroupCreator(groupId);
      setIsCreator(creatorId === user.id);
    } catch (error) {
      console.error('Error checking creator status:', error);
    }
  };

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
      const creatorId = await getGroupCreator(groupId);
    setIsCreator(creatorId === user.id);

    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const handleJoinGroup = async () => {
    try {
      console.log('Starting join group process...', { groupId, user: user });
      
      if (!groupId || !user?.id) {
        throw new Error('Missing groupId or userId');
      }
      
      const isMember = await checkMembership(groupId, user.id);
      console.log('Membership check result:', isMember);
      
      if (isMember) {
        Alert.alert('Already a Member', 'You are already part of this study group');
        return;
      }
      
      console.log('Creating join request...');
      const result = await createJoinRequest(groupId, user.id);
      console.log('Join request created:', result);
      
      Alert.alert(
        'Request Sent', 
        'Your request to join the group has been sent successfully.'
      );
    } catch (error) {
      console.error('Join request error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      Alert.alert(
        'Error', 
        'Unable to send join request: ' + error.message
      );
    }
  };
    

  const handleKickMember = async (memberId) => {
    if (!isCreator) return;
    
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the group?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGroupMember(groupId, memberId);
              // Refresh member list
              fetchGroupDetails();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member from group');
            }
          }
        }
      ]
    );
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
            isMember={isMember}
          />
        </View>

        {!isMember && (
          <CustomButton 
            title="Join Study Group" 
            onPress={handleJoinGroup}
            style={styles.joinButton}
          />
        )}
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
    elevation: 2,
    position: 'relative',
  },
  memberInfo: {
    alignItems: 'center',
  },
  kickButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  kickButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
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