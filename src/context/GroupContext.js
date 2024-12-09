import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const GroupContext = createContext();
const port = 5003;

export const GroupProvider = ({ children, username }) => {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch user's groups
  const fetchGroups = async () => {
    if (!username) {
      console.warn('No username provided for fetching groups.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:${port}/groups/${username}`);
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new group
  const createGroup = async (groupName, members) => {
    try {
      const response = await axios.post(`http://localhost:${port}/create-group`, {
        groupName,
        members,
      });
      setGroups(prevGroups => [...prevGroups, response.data]);
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  // Ensure groups are fetched only when necessary (initial mount or username changes)
  useEffect(() => {
    if (username) {
      fetchGroups();
    }
  }, [username]);

  return (
    <GroupContext.Provider value={{ groups, fetchGroups, isLoading, createGroup }}>
      {children}
    </GroupContext.Provider>
  );
};

// Custom hook to use GroupContext in other components
export const useGroup = () => {
  return useContext(GroupContext);
};
