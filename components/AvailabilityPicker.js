import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { setAvailability,checkAvailabilityExists, getAvailability } from '../services/DatabaseService';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AvailabilityPicker = ({ groupId, availability }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const handleSetAvailability = async () => {
    if (selectedDay) {
      try {
        const exists = await checkAvailabilityExists(groupId, selectedDay, startTime, endTime);
        if (exists) {
          Alert.alert('Error', 'This time slot is already added');
          return;
        }
        await setAvailability(groupId, selectedDay, startTime, endTime);
        // Refresh availability data
        const newAvailability = await getAvailability(groupId);
        setAvailability(newAvailability);
      } catch (error) {
        console.error('Error setting availability:', error);
        Alert.alert('Error', 'Failed to set availability');
      }
    }
  };
  
  return (
    <View style={styles.container}>
      {days.map((day) => (
        <Button
          key={day}
          title={day}
          onPress={() => setSelectedDay(day)}
          color={selectedDay === day ? 'blue' : 'gray'}
        />
      ))}
      {selectedDay && (
        <View style={styles.timeContainer}>
          <Text>Start Time: {startTime}</Text>
          <Text>End Time: {endTime}</Text>
          <Button title="Set Availability" onPress={handleSetAvailability} />
        </View>
      )}
      <Text style={styles.title}>Current Availability:</Text>
      {availability.map((slot) => (
        <Text key={slot.id}>
          {slot.day}: {slot.start_time} - {slot.end_time}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  timeContainer: {
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
});

export default AvailabilityPicker;