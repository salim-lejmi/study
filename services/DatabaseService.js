import * as SQLite from 'expo-sqlite/legacy';

const DB_NAME = 'studygroups.db';

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

