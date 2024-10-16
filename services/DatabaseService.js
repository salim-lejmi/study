import * as SQLite from 'expo-sqlite/legacy'; // Use legacy import

const DB_NAME = 'studygroups.db';

let database = null;

export const openDatabase = () => {
  if (database === null) {
    database = SQLite.openDatabase(DB_NAME);
  }
  return database;
};

export const closeDatabase = () => {
  if (database !== null) {
    database._db.close();
    database = null;
    console.log('Database connection closed.');
  }
};

export const initDatabase = () => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql('PRAGMA foreign_keys = ON;');
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT, 
            email TEXT UNIQUE, 
            password TEXT
          )
        `);
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