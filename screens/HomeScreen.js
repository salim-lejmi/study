import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, Button, StyleSheet, Alert, Modal, TouchableOpacity,SafeAreaView , Text } from 'react-native';
import { AuthContext } from '../services/AuthService';
import { getStudyGroups, getUniqueSubjects, deleteStudyGroup } from '../services/DatabaseService';
import StudyGroupItem from '../components/StudyGroupItem';
import NotificationButton from '../components/NotificationButton';
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = ({ navigation }) => {
  const [studyGroups, setStudyGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const { logout, user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchStudyGroups();
      fetchSubjects();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        fetchStudyGroups();
        fetchSubjects();
      }
    });

    return unsubscribe;
  }, [navigation, user]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <NotificationButton
            onPress={() => navigation.navigate('Notifications')}
            userId={user?.id}
          />
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.profileIcon}>
              <Text style={styles.profileIconText}>{user?.name?.[0]?.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, user]);
  
    
  const fetchSubjects = async () => {
    try {
      const availableSubjects = await getUniqueSubjects();
      setSubjects(availableSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    }
  };


  const fetchStudyGroups = async () => {
    try {
      const groups = await getStudyGroups(selectedSubjects.length > 0 ? selectedSubjects : null);
      setStudyGroups(groups);
    } catch (error) {
      console.error('Error fetching study groups:', error);
      setStudyGroups([]);
    }
  };
  const toggleSubjectSelection = (subject) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      } else {
        return [...prev, subject];
      }
    });
  };

  const applyFilters = async () => {
    await fetchStudyGroups();
    // Don't close the modal when applying filters
  };

  const clearFilters = () => {
    setSelectedSubjects([]);
    fetchStudyGroups();
  };

  const closeFilterModal = () => {
    setIsFilterModalVisible(false);
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


  const FilterModal = () => (
    <Modal
      visible={isFilterModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={closeFilterModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter by Subjects</Text>
          <View style={styles.subjectList}>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.subjectItem,
                  selectedSubjects.includes(subject) && styles.selectedSubject
                ]}
                onPress={() => toggleSubjectSelection(subject)}
              >
                <Text style={[
                  styles.subjectText,
                  selectedSubjects.includes(subject) && styles.selectedSubjectText
                ]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.button} onPress={clearFilters}>
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={applyFilters}>
              <Text style={styles.buttonText}>Apply</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={closeFilterModal}
          >
            <Text style={styles.closeButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );




  return (
    <View style={styles.container}>
      {/* Header with Filter Button */}
      <View style={styles.header}>
        <Button 
          title={`Filter${selectedSubjects.length > 0 ? ` (${selectedSubjects.length})` : ''}`}
          onPress={() => setIsFilterModalVisible(true)}
        />
      </View>
  
      {/* Study Groups List */}
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
  
      {/* Admin Buttons (only for admin users) */}
      {user?.is_admin && (
        <View style={styles.adminButtonsContainer}>
          <TouchableOpacity
            style={[styles.adminButton, { marginRight: 10 }]}
            onPress={() => navigation.navigate('UserList')}
          >
            <Text style={styles.adminButtonText}>User List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.adminButtonText}>Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}
  
      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.stylishButton} 
          onPress={handleCreateGroup}
        >
          <Text style={styles.stylishButtonText}>Create New Group</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.stylishButton} 
          onPress={handleLogout}
        >
          <Text style={styles.stylishButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
  
      {/* Filter Modal */}
      <FilterModal />
    </View>
  );
  
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 10,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
    },
    stylishButton: {
      flex: 1,
      backgroundColor: '#6200ee',
      paddingVertical: 15,
      marginHorizontal: 5,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,  // For Android shadow effect
    },
    stylishButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
    },
    adminButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      padding: 10,
      marginBottom: 10,
    },
    adminButton: {
      backgroundColor: '#6200ee',
      padding: 10,
      borderRadius: 5,
      flex: 1,
    },
    adminButtonText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: 'bold',
    },
  });
  
export default HomeScreen;