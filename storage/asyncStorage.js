// storage/asyncStorage.js

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getWatchedTime = async (videoId) => {
  try {
    const watchedTime = await AsyncStorage.getItem(`watchedTime_${videoId}`);
    return watchedTime ? JSON.parse(watchedTime) : null;
  } catch (error) {
    console.error('Error retrieving watched time:', error);
    return null;
  }
};

export const saveWatchedTime = async (videoId, watchedTime, watchedDate, videoDuration) => {
  try {
    await AsyncStorage.setItem(
      `watchedTime_${videoId}`,
	JSON.stringify({ time: watchedTime, date: watchedDate, videoDuration  })
    );
  } catch (error) {
    console.error('Error storing watched time:', error);
  }
};

export const getWatchedStatus = async (videoId) => {
  try {
    const watchedStatus = await AsyncStorage.getItem(`watchedStatus_${videoId}`);
    return watchedStatus ? JSON.parse(watchedStatus) : false;
  } catch (error) {
    console.error('Error retrieving watched status:', error);
    return false;
  }
};

export const saveWatchedStatus = async (videoId, watched) => {
  try {
    await AsyncStorage.setItem(`watchedStatus_${videoId}`, JSON.stringify(watched));
  } catch (error) {
    console.error('Error storing watched status:', error);
  }
};
