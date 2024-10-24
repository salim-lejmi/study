import * as SQLite from 'expo-sqlite/legacy';

const DB_NAME = 'studygroups.db';
const DEBUG = true;  // Enable detailed logging

let database = null;
export const openDatabase = () => {
  if (database === null) {
    try {
      database = SQLite.openDatabase(DB_NAME);
      console.log('Database opened successfully');
    } catch (error) {
      console.error('Error opening database:', error);
      throw error;
    }
  }
  return database;
};

export const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    if (database !== null) {
      try {
        database._db.close();
        database = null;
        console.log('Database connection closed.');
        resolve();
      } catch (error) {
        console.error('Error closing database:', error);
        database = null;
        reject(error);
      }
    } else {
      resolve();
    }
  });
};

export const resetDatabaseConnection = async () => {
  await closeDatabase();
  return openDatabase();
};

export const initDatabase = () => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`
          ALTER TABLE notifications ADD COLUMN request_id INTEGER
          REFERENCES join_requests(id)
        `, [], 
        () => {
          logDebug('Added request_id column to notifications table');
        },
        (_, error) => {
          // Column might already exist, which is fine
          logDebug('Column request_id might already exist:', error);
        });
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient_id INTEGER NOT NULL,
            sender_id INTEGER,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            group_id INTEGER,
            status TEXT DEFAULT 'unread',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (recipient_id) REFERENCES users (id),
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (group_id) REFERENCES study_groups (id)
          )
        `);

        // Join requests table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS join_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES study_groups (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);
        // Enable foreign keys
        tx.executeSql('PRAGMA foreign_keys = ON;');

        // Check if the 'messages' table exists and adjust its columns
        tx.executeSql(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name='messages'",
          [],
          (_, { rows }) => {
            const tableExists = rows.length > 0;

            if (!tableExists) {
              // Create 'messages' table if it doesn't exist
              tx.executeSql(`
                CREATE TABLE IF NOT EXISTS messages (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  group_id INTEGER NOT NULL,
                  user_id INTEGER NOT NULL,
                  content TEXT NOT NULL,
                  message_type TEXT DEFAULT 'text',
                  image_url TEXT,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (group_id) REFERENCES study_groups (id),
                  FOREIGN KEY (user_id) REFERENCES users (id)
                )
              `);
            } else {
              // Check if 'message_type' and 'image_url' columns exist
              tx.executeSql("PRAGMA table_info(messages)", [], (_, { rows: columnInfo }) => {
                const hasMessageType = columnInfo._array.some(col => col.name === 'message_type');
                const hasImageUrl = columnInfo._array.some(col => col.name === 'image_url');

                if (!hasMessageType) {
                  tx.executeSql("ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text'");
                }

                if (!hasImageUrl) {
                  tx.executeSql("ALTER TABLE messages ADD COLUMN image_url TEXT");
                }
              });
            }
          }
        );

        // Check if 'description' and 'subjects_of_interest' columns exist in 'users' table
        tx.executeSql("PRAGMA table_info(users)", [], (_, { rows: columnInfo }) => {
          const hasDescription = columnInfo._array.some(col => col.name === 'description');
          const hasSubjectsOfInterest = columnInfo._array.some(col => col.name === 'subjects_of_interest');

          if (!hasDescription) {
            tx.executeSql("ALTER TABLE users ADD COLUMN description TEXT DEFAULT NULL");
          }

          if (!hasSubjectsOfInterest) {
            tx.executeSql("ALTER TABLE users ADD COLUMN subjects_of_interest TEXT DEFAULT NULL");
          }
        });

        // Create 'users' table if it doesn't exist
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            CONSTRAINT email_unique UNIQUE (email)
          )
        `);

        // Create 'study_groups' table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS study_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            subject TEXT,
            creator_id INTEGER,
            FOREIGN KEY (creator_id) REFERENCES users (id)
          )
        `);

        // Create 'group_members' table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS group_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER,
            user_id INTEGER,
            FOREIGN KEY (group_id) REFERENCES study_groups (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // Create 'availability' table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS availability (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER,
            day TEXT,
            start_time TEXT,
            end_time TEXT,
            FOREIGN KEY (group_id) REFERENCES study_groups (id)
          )
        `);
        tx.executeSql(
          "PRAGMA table_info(users)",
          [],
          (_, { rows: columnInfo }) => {
            const hasIsAdmin = columnInfo._array.some(col => col.name === 'is_admin');
            if (!hasIsAdmin) {
              tx.executeSql("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0");
            }
          }
        );

        // Create admin user if doesn't exist
        tx.executeSql(
          'SELECT * FROM users WHERE email = ?',
          ['admin@gmail.com'],
          (_, { rows }) => {
            if (rows.length === 0) {
              tx.executeSql(
                'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
                ['admin', 'admin@gmail.com', 'admin', 1]
              );
            }
          }
        );

      },
      (error) => {
        console.error('Error initializing database:', error);
        reject(error);
      },
      () => {
        console.log('Database initialized successfully!');
        resolve();
      }
    );
  });
};


export const getAllUsers = () => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT id, name, email FROM users WHERE is_admin = 0`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

// Delete user and all their related data
export const deleteUser = (userId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      // Delete user's messages
      tx.executeSql('DELETE FROM messages WHERE user_id = ?', [userId]);
      
      // Delete user's group memberships
      tx.executeSql('DELETE FROM group_members WHERE user_id = ?', [userId]);
      
      // Delete groups created by user
      tx.executeSql('DELETE FROM study_groups WHERE creator_id = ?', [userId]);
      
      // Finally delete the user
      tx.executeSql(
        'DELETE FROM users WHERE id = ?',
        [userId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// Get dashboard statistics
export const getDashboardStats = () => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      const stats = {};
      
      // Get total users count
      tx.executeSql(
        'SELECT COUNT(*) as count FROM users WHERE is_admin = 0',
        [],
        (_, { rows }) => {
          stats.totalUsers = rows.item(0).count;
        }
      );
      
      // Get total groups count
      tx.executeSql(
        'SELECT COUNT(*) as count FROM study_groups',
        [],
        (_, { rows }) => {
          stats.totalGroups = rows.item(0).count;
        }
      );
      
      // Get total messages count
      tx.executeSql(
        'SELECT COUNT(*) as count FROM messages',
        [],
        (_, { rows }) => {
          stats.totalMessages = rows.item(0).count;
        }
      );
      
      // Get subjects distribution
      tx.executeSql(
        'SELECT subject, COUNT(*) as count FROM study_groups GROUP BY subject',
        [],
        (_, { rows }) => {
          stats.subjectDistribution = rows._array;
        }
      );
      
      // Get most active groups
      tx.executeSql(
        `SELECT study_groups.name, COUNT(messages.id) as message_count 
         FROM study_groups 
         LEFT JOIN messages ON study_groups.id = messages.group_id 
         GROUP BY study_groups.id 
         ORDER BY message_count DESC 
         LIMIT 5`,
        [],
        (_, { rows }) => {
          stats.mostActiveGroups = rows._array;
          resolve(stats);
        }
      );
    });
  });
};

// Helper function to check if email exists
export const checkEmailExists = async (email) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    try {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT COUNT(*) as count FROM users WHERE email = ?',
          [email],
          (_, { rows }) => {
            resolve(rows.item(0).count > 0);
          },
          (_, error) => {
            console.error('Error checking email:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('Transaction error checking email:', error);
      reject(error);
    }
  });
};

export const getStudyGroups = (subjects = null) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      let query = `
        SELECT study_groups.*, users.name as creator_name 
        FROM study_groups 
        JOIN users ON study_groups.creator_id = users.id
      `;
      
      const params = [];
      if (subjects && subjects.length > 0) {
        query += ' WHERE subject IN (' + subjects.map(() => '?').join(',') + ')';
        params.push(...subjects);
      }

      tx.executeSql(
        query,
        params,
        (_, { rows }) => {
          resolve(rows._array);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};


export const deleteStudyGroup = (groupId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM study_groups WHERE id = ?',
        [groupId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};


export const createStudyGroup = (name, subject, creatorId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO study_groups (name, subject, creator_id) VALUES (?, ?, ?)',
        [name, subject, creatorId],
        (_, { insertId }) => {
          // Automatically add creator to group_members
          tx.executeSql(
            'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
            [insertId, creatorId],
            () => resolve(insertId),
            (_, error) => reject(error)
          );
        },
        (_, error) => reject(error)
      );
    });
  });
};
export const checkMembership = (groupId, userId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND user_id = ?',
        [groupId, userId],
        (_, { rows }) => resolve(rows.item(0).count > 0),
        (_, error) => reject(error)
      );
    });
  });
};

export const checkAvailabilityExists = (groupId, day, startTime, endTime) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT COUNT(*) as count FROM availability WHERE group_id = ? AND day = ? AND start_time = ? AND end_time = ?',
        [groupId, day, startTime, endTime],
        (_, { rows }) => resolve(rows.item(0).count > 0),
        (_, error) => reject(error)
      );
    });
  });
};


export const joinStudyGroup = (groupId, userId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
        [groupId, userId],
        (_, { insertId }) => resolve(insertId),
        (_, error) => reject(error)
      );
    });
  });
};

export const getGroupMembers = (groupId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT users.* 
         FROM users 
         INNER JOIN group_members 
         ON users.id = group_members.user_id 
         WHERE group_members.group_id = ?`,
        [groupId],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

export const setAvailability = (groupId, day, startTime, endTime) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO availability (group_id, day, start_time, end_time) VALUES (?, ?, ?, ?)',
        [groupId, day, startTime, endTime],
        (_, { insertId }) => resolve(insertId),
        (_, error) => reject(error)
      );
    });
  });
};

export const getAvailability = (groupId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM availability WHERE group_id = ?',
        [groupId],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};
export const sendMessage = async (groupId, userId, content, messageType = 'text', imageUrl = null) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO messages (
          group_id, 
          user_id, 
          content, 
          message_type, 
          image_url
        ) VALUES (?, ?, ?, ?, ?)`,
        [groupId, userId, content, messageType, imageUrl],
        (_, { insertId }) => resolve(insertId),
        (_, error) => {
          console.error('SQL Error:', error);
          reject(error);
        }
      );
    });
  });
};


export const getMessages = (groupId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT messages.*, users.name as sender_name 
         FROM messages 
         JOIN users ON messages.user_id = users.id 
         WHERE group_id = ? 
         ORDER BY timestamp DESC`,
        [groupId],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};
export const getUniqueSubjects = () => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT DISTINCT subject FROM study_groups WHERE subject IS NOT NULL',
        [],
        (_, { rows }) => {
          resolve(rows._array.map(row => row.subject));
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const getUserProfile = (userId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT users.*, 
         GROUP_CONCAT(DISTINCT study_groups.name) as joined_groups
         FROM users 
         LEFT JOIN group_members ON users.id = group_members.user_id
         LEFT JOIN study_groups ON group_members.group_id = study_groups.id
         WHERE users.id = ?
         GROUP BY users.id`,
        [userId],
        (_, { rows }) => {
          if (rows.length > 0) {
            const profile = rows.item(0);
            profile.joined_groups = profile.joined_groups ? profile.joined_groups.split(',') : [];
            resolve(profile);
          } else {
            reject(new Error('User not found'));
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};
export const getGroupCreator = (groupId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT creator_id FROM study_groups WHERE id = ?',
        [groupId],
        (_, { rows }) => {
          if (rows.length > 0) {
            resolve(rows.item(0).creator_id);
          } else {
            resolve(null);
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const removeGroupMember = (groupId, userId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
        [groupId, userId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const updateUserProfile = (userId, description, subjectsOfInterest) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE users SET description = ?, subjects_of_interest = ? WHERE id = ?',
        [description, subjectsOfInterest, userId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getUnreadNotificationCount = (userId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND status = "unread"',
        [userId],
        (_, { rows }) => resolve(rows.item(0).count),
        (_, error) => reject(error)
      );
    });
  });
};


export const getNotifications = (userId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT 
          n.*,
          s.name as sender_name,
          sg.name as group_name,
          jr.id as request_id
         FROM notifications n
         LEFT JOIN users s ON n.sender_id = s.id
         LEFT JOIN study_groups sg ON n.group_id = sg.id
         LEFT JOIN join_requests jr ON n.request_id = jr.id
         WHERE n.recipient_id = ?
         ORDER BY n.created_at DESC`,
        [userId],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};


export const markNotificationsAsRead = (userId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE notifications SET status = "read" WHERE recipient_id = ? AND status = "unread"',
        [userId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const handleJoinRequest = (requestId, isAccepted, notificationContent) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM join_requests WHERE id = ?',
        [requestId],
        (_, { rows }) => {
          if (rows.length === 0) {
            reject(new Error('Request not found'));
            return;
          }
          
          const request = rows.item(0);
          const status = isAccepted ? 'accepted' : 'rejected';
          
          // Update request status
          tx.executeSql(
            'UPDATE join_requests SET status = ? WHERE id = ?',
            [status, requestId]
          );
          
          if (isAccepted) {
            // Add user to group if accepted
            tx.executeSql(
              'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
              [request.group_id, request.user_id]
            );
          }
          
          // Create notification for the requesting user
          tx.executeSql(
            `INSERT INTO notifications (
              recipient_id, type, content, group_id, status
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              request.user_id,
              'join_request_response',
              notificationContent,
              request.group_id,
              'unread'
            ],
            (_, { insertId }) => resolve(insertId),
            (_, error) => reject(error)
          );
        },
        (_, error) => reject(error)
      );
    });
  });
};
// Helper to check if request already exists
const checkExistingRequest = (tx, groupId, userId) => {
  return new Promise((resolve, reject) => {
    tx.executeSql(
      'SELECT * FROM join_requests WHERE group_id = ? AND user_id = ? AND status = "pending"',
      [groupId, userId],
      (_, { rows }) => {
        resolve(rows.length > 0);
      },
      (_, error) => {
        console.error('Error checking existing request:', error);
        reject(error);
      }
    );
  });
};

const logDebug = (message, data = '') => {
  if (DEBUG) {
    if (data) {
      console.log(`[DEBUG] ${message}:`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

export const createJoinRequest = async (groupId, userId) => {
  logDebug('Starting createJoinRequest', { groupId, userId });
  
  const db = openDatabase();
  if (!db) {
    console.error('Failed to open database');
    return Promise.reject(new Error('Database connection failed'));
  }

  return new Promise((resolve, reject) => {
    logDebug('Beginning database transaction');
    
    db.transaction(tx => {
      // Step 1: Verify the group exists and get creator info
      const checkGroupQuery = 'SELECT creator_id, name FROM study_groups WHERE id = ?';
      logDebug('Executing query', checkGroupQuery);
      
      tx.executeSql(
        checkGroupQuery,
        [groupId],
        (_, { rows }) => {
          logDebug('Group query results', rows);
          
          if (rows.length === 0) {
            const error = new Error(`Study group ${groupId} not found`);
            console.error(error);
            reject(error);
            return;
          }
          
          const creatorId = rows.item(0).creator_id;
          const groupName = rows.item(0).name;
          logDebug('Found group info', { creatorId, groupName });

          // Step 2: Check if user is already a member
          const checkMembershipQuery = 'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?';
          logDebug('Checking existing membership');
          
          tx.executeSql(
            checkMembershipQuery,
            [groupId, userId],
            (_, { rows: memberRows }) => {
              logDebug('Membership check results', memberRows);
              
              if (memberRows.length > 0) {
                const error = new Error('User is already a member of this group');
                console.error(error);
                reject(error);
                return;
              }

              // Step 3: Check for existing pending request
              const checkRequestQuery = 'SELECT * FROM join_requests WHERE group_id = ? AND user_id = ? AND status = "pending"';
              logDebug('Checking existing requests');
              
              tx.executeSql(
                checkRequestQuery,
                [groupId, userId],
                (_, { rows: requestRows }) => {
                  logDebug('Existing request check results', requestRows);
                  
                  if (requestRows.length > 0) {
                    const error = new Error('A pending request already exists');
                    console.error(error);
                    reject(error);
                    return;
                  }

                  // Step 4: Get user info for notification
                  const getUserQuery = 'SELECT name FROM users WHERE id = ?';
                  logDebug('Getting user info');
                  
                  tx.executeSql(
                    getUserQuery,
                    [userId],
                    (_, { rows: userRows }) => {
                      logDebug('User info results', userRows);
                      
                      if (userRows.length === 0) {
                        const error = new Error(`User ${userId} not found`);
                        console.error(error);
                        reject(error);
                        return;
                      }

                      const userName = userRows.item(0).name;
                      
                      // Step 5: Create the join request
                      const createRequestQuery = `
                      INSERT INTO join_requests (group_id, user_id, status, created_at) 
                      VALUES (?, ?, "pending", datetime('now'))
                    `;
                    
                    tx.executeSql(
                      createRequestQuery,
                      [groupId, userId],
                      (_, { insertId: requestId }) => {
                        logDebug('Join request created', { requestId });
              
                        const notificationContent = `${userName} wants to join ${groupName}`;
                        const createNotificationQuery = `
                          INSERT INTO notifications (
                            recipient_id, sender_id, type, content, group_id, status, created_at, request_id
                          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)
                        `;
                        
                        tx.executeSql(
                          createNotificationQuery,
                          [creatorId, userId, 'join_request', notificationContent, groupId, 'unread', requestId],
                          (_, { insertId: notificationId }) => {
                            logDebug('Notification created', { notificationId, requestId });
                            resolve({ requestId, notificationId });
                          },
                          (_, error) => {
                            console.error('Error creating notification:', error);
                            reject(new Error(`Failed to create notification: ${error.message}`));
                          }
                        );
                      },
                      (_, error) => {
                        console.error('Error creating join request:', error);
                        reject(new Error(`Failed to create join request: ${error.message}`));
                      }
                    );
                  });
                },
              
              
                    (_, error) => {
                      console.error('Error getting user info:', error);
                      reject(new Error(`Failed to get user info: ${error.message}`));
                    }
                  );
                },
                (_, error) => {
                  console.error('Error checking existing requests:', error);
                  reject(new Error(`Failed to check existing requests: ${error.message}`));
                }
              );
            },
            (_, error) => {
              console.error('Error checking membership:', error);
              reject(new Error(`Failed to check membership: ${error.message}`));
            }
          );
        },
        (_, error) => {
          console.error('Error checking group:', error);
          reject(new Error(`Failed to check group: ${error.message}`));
        }
      );
    },
    (error) => {
      console.error('Transaction failed:', error);
      reject(new Error(`Transaction failed: ${error.message}`));
    },
    () => {
      logDebug('Transaction completed successfully');
    });
  }

