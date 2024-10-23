// DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { getDashboardStats } from '../services/DatabaseService';

const DashboardScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>System Dashboard</Text>
      
      {/* Overview Cards */}
      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats?.totalUsers || 0}</Text>
          <Text style={styles.cardLabel}>Total Users</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats?.totalGroups || 0}</Text>
          <Text style={styles.cardLabel}>Study Groups</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats?.totalMessages || 0}</Text>
          <Text style={styles.cardLabel}>Messages</Text>
        </View>
      </View>

      {/* Subject Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subject Distribution</Text>
        {stats?.subjectDistribution?.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <Text style={styles.barLabel}>{item.subject}</Text>
            <View style={styles.barWrapper}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${(item.count / stats.totalGroups) * 100}%`,
                    backgroundColor: `hsl(${index * 40}, 70%, 50%)`
                  }
                ]} 
              />
              <Text style={styles.barValue}>{item.count}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Most Active Groups */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Active Groups</Text>
        {stats?.mostActiveGroups?.map((group, index) => (
          <View key={index} style={styles.groupItem}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.messageCount}>
              {group.message_count} messages
            </Text>
          </View>
        ))}
      </View>

      {/* Activity Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Overview</Text>
        <View style={styles.activityItem}>
          <Text style={styles.activityLabel}>Average Messages per Group:</Text>
          <Text style={styles.activityValue}>
            {stats?.totalGroups ? (stats.totalMessages / stats.totalGroups).toFixed(1) : 0}
          </Text>
        </View>
        <View style={styles.activityItem}>
          <Text style={styles.activityLabel}>Users per Group:</Text>
          <Text style={styles.activityValue}>
            {stats?.totalGroups ? (stats.totalUsers / stats.totalGroups).toFixed(1) : 0}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: Dimensions.get('window').width / 3.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  barContainer: {
    marginBottom: 15,
  },
  barLabel: {
    marginBottom: 5,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 25,
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  barValue: {
    marginLeft: 10,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupName: {
    fontSize: 16,
  },
  messageCount: {
    color: '#666',
    fontSize: 14,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityLabel: {
    fontSize: 14,
    color: '#333',
  },
  activityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  }
});

export default DashboardScreen;