import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Button, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  TextInput 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { setAvailability, checkAvailabilityExists, getAvailability,deleteAvailability } from '../services/DatabaseService';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AvailabilityPicker = ({ groupId, availability, onAvailabilityUpdate, isMember = false, currentUserId, isGroupCreator }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [location, setLocation] = useState('');

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const checkTimeOverlap = (newStart, newEnd, existingSlots) => {
    const newStartMinutes = timeToMinutes(formatTime(newStart));
    const newEndMinutes = timeToMinutes(formatTime(newEnd));

    return existingSlots.some(slot => {
      if (slot.day !== selectedDay) return false;

      const slotStartMinutes = timeToMinutes(slot.start_time);
      const slotEndMinutes = timeToMinutes(slot.end_time);

      return (
        (newStartMinutes >= slotStartMinutes && newStartMinutes < slotEndMinutes) ||
        (newEndMinutes > slotStartMinutes && newEndMinutes <= slotEndMinutes) ||
        (newStartMinutes <= slotStartMinutes && newEndMinutes >= slotEndMinutes)
      );
    });
  };

  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleStartTimeChange = (event, selectedDate) => {
    if (!isMember) {
      Alert.alert('Access Denied', 'Only group members can set availability');
      return;
    }
    
    setShowStartPicker(false);
    if (selectedDate) {
      setStartTime(selectedDate);
      if (selectedDate >= endTime) {
        const newEndTime = new Date(selectedDate);
        newEndTime.setHours(selectedDate.getHours() + 1);
        setEndTime(newEndTime);
      }
    }
  };

  const handleEndTimeChange = (event, selectedDate) => {
    if (!isMember) {
      Alert.alert('Access Denied', 'Only group members can set availability');
      return;
    }

    setShowEndPicker(false);
    if (selectedDate) {
      if (selectedDate <= startTime) {
        Alert.alert('Error', 'End time must be after start time');
        return;
      }
      setEndTime(selectedDate);
    }
  };

  const handleSetAvailability = async () => {
    if (!isMember) {
      Alert.alert('Access Denied', 'Only group members can set availability');
      return;
    }

    if (!selectedDay) {
      Alert.alert('Error', 'Please select a day');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    try {
      if (checkTimeOverlap(startTime, endTime, availability)) {
        Alert.alert('Error', 'This time slot overlaps with an existing availability');
        return;
      }

      await setAvailability(groupId, selectedDay, formattedStartTime, formattedEndTime, location, currentUserId);
      const newAvailability = await getAvailability(groupId);
      onAvailabilityUpdate(newAvailability);
      setLocation('');
      Alert.alert('Success', 'Availability set successfully');
    } catch (error) {
      console.error('Error setting availability:', error);
      Alert.alert('Error', 'Failed to set availability');
    }
  };
  const handleDeleteAvailability = async (availabilityId, slotUserId) => {
    // Check if user is allowed to delete
    if (currentUserId !== slotUserId && !isGroupCreator) {
      Alert.alert('Access Denied', 'You can only delete your own availability slots');
      return;
    }

    Alert.alert(
      'Delete Availability',
      'Are you sure you want to delete this availability slot?',
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
              await deleteAvailability(availabilityId);
              const newAvailability = await getAvailability(groupId);
              onAvailabilityUpdate(newAvailability);
            } catch (error) {
              console.error('Error deleting availability:', error);
              Alert.alert('Error', 'Failed to delete availability');
            }
          }
        }
      ]
    );
  };

  const renderAvailabilitySlot = (slot, index) => (
    <View key={index} style={styles.availabilitySlot}>
      <Text style={styles.availabilityText}>
        {slot.day}: {slot.start_time} - {slot.end_time} @ {slot.location}
      </Text>
      {(currentUserId === slot.user_id || isGroupCreator) && (
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteAvailability(slot.id, slot.user_id)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const handleDaySelect = (day) => {
    if (!isMember) {
      Alert.alert('Access Denied', 'Only group members can set availability');
      return;
    }
    setSelectedDay(day);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Day:</Text>
      <View style={styles.daysContainer}>
        {days.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              selectedDay === day && styles.selectedDayButton
            ]}
            onPress={() => handleDaySelect(day)}
          >
            <Text style={[
              styles.dayButtonText,
              selectedDay === day && styles.selectedDayButtonText
            ]}>
              {day.substring(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedDay && (
        <View style={styles.timeContainer}>
          <View style={styles.timeSelection}>
            <Text>Start Time:</Text>
            <Button
              title={formatTime(startTime)}
              onPress={() => isMember ? setShowStartPicker(true) : Alert.alert('Access Denied', 'Only group members can set availability')}
            />
          </View>

          <View style={styles.timeSelection}>
            <Text>End Time:</Text>
            <Button
              title={formatTime(endTime)}
              onPress={() => isMember ? setShowEndPicker(true) : Alert.alert('Access Denied', 'Only group members can set availability')}
            />
          </View>

          <View style={styles.locationContainer}>
            <Text>Location:</Text>
            <TextInput
              style={styles.locationInput}
              placeholder="Enter location"
              value={location}
              onChangeText={setLocation}
              editable={isMember}
            />
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleStartTimeChange}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleEndTimeChange}
            />
          )}

          <Button 
            title="Set Availability" 
            onPress={handleSetAvailability}
          />
        </View>
      )}

<Text style={styles.sectionTitle}>Current Availability:</Text>
      {availability.map((slot, index) => (
        <Text key={index} style={styles.availabilityText}>
          {slot.day}: {slot.start_time} - {slot.end_time} @ {slot.location}
        </Text>
      ))}
      <Text style={styles.sectionTitle}>Current Availability:</Text>
      {availability.map((slot, index) => renderAvailabilitySlot(slot, index))}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayButton: {
    padding: 8,
    marginVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '13%',
  },
  selectedDayButton: {
    backgroundColor: '#007AFF',
  },
  dayButtonText: {
    textAlign: 'center',
    fontSize: 12,
  },
  selectedDayButtonText: {
    color: 'white',
  },
  timeContainer: {
    marginVertical: 16,
  },
  timeSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  availabilityText: {
    fontSize: 14,
    marginVertical: 4,
  },
  locationContainer: {
    marginVertical: 8,
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  availabilitySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  availabilityText: {
    fontSize: 14,
    flex: 1,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },

});

export default AvailabilityPicker;