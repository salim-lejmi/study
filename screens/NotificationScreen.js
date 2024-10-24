import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { AuthContext } from '../services/AuthService';
import {
  getNotifications,
  handleJoinRequest,
  markNotificationsAsRead
} from '../services/DatabaseService';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchNotifications();
    if (user) {
      markNotificationsAsRead(user.id);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const notifs = await getNotifications(user.id);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleJoinResponse = async (notification, isAccepted) => {
    try {
      // Need to get the join_request_id from the notification
      if (!notification.request_id) {
        throw new Error('Join request ID not found in notification');
      }
      
      const content = isAccepted
        ? 'Your request to join the group has been accepted'
        : 'Your request to join the group has been denied';
      
      await handleJoinRequest(notification.request_id, isAccepted, content);
      await fetchNotifications();
      
      Alert.alert(
        'Success',
        `Join request ${isAccepted ? 'accepted' : 'denied'} successfully`
      );
    } catch (error) {
      console.error('Error handling join request:', error);
      Alert.alert('Error', 'Failed to process join request');
    }
  };

  const renderNotification = ({ item }) => {
    const isJoinRequest = item.type === 'join_request';
    
    return (
      <View style={styles.notificationCard}>
        <Text style={styles.notificationText}>
          {item.sender_name} {item.content} {item.group_name}
        </Text>
        <Text style={styles.timeText}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        
        {isJoinRequest && item.status === 'unread' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleJoinResponse(item, true)}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleJoinResponse(item, false)}
            >
              <Text style={styles.buttonText}>Deny</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {notifications.length === 0 ? (
        <Text style={styles.emptyText}>No notifications</Text>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    color: '#666',
  },
});

export default NotificationScreen;
