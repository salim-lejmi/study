import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const StudyGroupItem = ({ group, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.name}>{group.name}</Text>
      <Text style={styles.subject}>{group.subject}</Text>
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
});

export default StudyGroupItem;