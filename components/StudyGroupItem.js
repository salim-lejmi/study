import React from 'react';
import { TouchableOpacity, Text, StyleSheet ,View} from 'react-native';

const StudyGroupItem = ({ group, onPress, onDelete, currentUserId }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{group.name}</Text>
        {currentUserId && group.creator_id === currentUserId && ( // Add null check
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => onDelete(group.id)}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.subject}>{group.subject}</Text>
      <Text style={styles.creator}>Created by: {group.creator_name}</Text>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subject: {
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 4,
  },
  deleteText: {
    color: 'white',
    fontSize: 12,
  },
  creator: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});


export default StudyGroupItem;