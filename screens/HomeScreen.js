import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, Button, StyleSheet, Alert, Modal, TouchableOpacity, Text } from 'react-native';
import { AuthContext } from '../services/AuthService';
import { getStudyGroups, getUniqueSubjects, deleteStudyGroup } from '../services/DatabaseService';
import StudyGroupItem from '../components/StudyGroupItem';
import NotificationButton from '../components/NotificationButton';

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
    setIsFilterModalVisible(false);
  };
  const clearFilters = () => {
    setSelectedSubjects([]);
    setIsFilterModalVisible(false);
    fetchStudyGroups();
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
      onRequestClose={() => setIsFilterModalVisible(false)}
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
            onPress={() => setIsFilterModalVisible(false)}
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
      {user?.is_admin ? (
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
      ) : null}
  
      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <Button title="Create New Group" onPress={handleCreateGroup} />
        <Button title="Logout" onPress={handleLogout} />
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  subjectList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  subjectItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  selectedSubject: {
    backgroundColor: '#007AFF',
  },
  subjectText: {
    color: '#333',
  },
  selectedSubjectText: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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