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
        
        // Create users table with email uniqueness constraint
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            CONSTRAINT email_unique UNIQUE (email)
          )
        `);

        // Other tables remain the same
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS study_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            subject TEXT,
            creator_id INTEGER,
            FOREIGN KEY (creator_id) REFERENCES users (id)
          )
        `);

        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS group_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER,
            user_id INTEGER,
            FOREIGN KEY (group_id) REFERENCES study_groups (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

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
        console.error('Error creating tables:', error);
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

export const getStudyGroups = () => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM study_groups',
        [],
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

export const createStudyGroup = (name, subject, creatorId) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO study_groups (name, subject, creator_id) VALUES (?, ?, ?)',
        [name, subject, creatorId],
        (_, { insertId }) => resolve(insertId),
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