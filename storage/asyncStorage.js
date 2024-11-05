// storage/asyncStorage.js

import AsyncStorage from '@react-native-async-storage/async-storage';

// function to export all the stored keys in exportable json format
// this json can be imported via import function

export const exportStorage = async () => {
    try {
	const keys = await AsyncStorage.getAllKeys();
	const values = await AsyncStorage.multiGet(keys);
	const exportable = keys.map((key, index) => ({ key, value: values[index][1] }));
	return exportable;
    } catch (error) {
	console.error('Error exporting storage:', error);
	return [];
    }
};

// we need to merge while importing
export const importStorage = async (data) => {
    try {
	// Create an array of key-value pairs from the imported data
	const pairs = data.map(({ key, value }) => [key, value]);
	console.log(pairs);
	// Clear the existing AsyncStorage
	await AsyncStorage.clear();
	// Store the imported key-value pairs in AsyncStorage
	await AsyncStorage.multiSet(pairs);
	console.log('Data imported successfully');
    } catch (error) {
	console.error('Error importing storage:', error);
    }
};

export const getPersistedVideoData = async (videoId) => {
    try {
	const watchedTime = await AsyncStorage.getItem(`watchedTime_${videoId}`);
	return watchedTime ? JSON.parse(watchedTime) : null;
    } catch (error) {
	console.error('Error retrieving watched time:', error);
	return null;
    }
};

export const persistVideoData = async (videoId, videoData) => {
    try {
	await AsyncStorage.setItem(
	    `watchedTime_${videoId}`,
	    JSON.stringify(videoData)
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

export const getPersistedPlaylists = async () => {
    try {
	const playlistsString = await AsyncStorage.getItem('playlists');
	return playlistsString ? JSON.parse(playlistsString) : [];
    } catch (error) {
	console.error('Error retrieving playlists:', error);
	return [];
    }
};

export const getPersistedPlaylistById = async (playlistId) => {
    try {
	const existingPlaylists = await getPersistedPlaylists();
	let foundPlaylist;
	// find playlistId in existingPlaylists
	existingPlaylists.forEach((playlist) => {
	    if(playlist.id === playlistId) {
		foundPlaylist = playlist;
	    }
	});
	console.log("playlist from storage",foundPlaylist);
	return foundPlaylist;
    } catch (error) {
	console.error('Error retrieving playlist:', error);
	return null;
    }
};

export const persistPlaylist = async (playlist) => {
    try {
	const existingPlaylists = await getPersistedPlaylists();
	if(existingPlaylists.find((p) => p.id === playlist.id)) {
	    return 'playlist_already_exists';
	}
	const updatedPlaylists = [...existingPlaylists, playlist];
	await AsyncStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
	return 'playlist_added';
    } catch (error) {
	console.error('Error storing playlist:', error);
	return 'error_storing_playlist';
    }
};

export const removePlaylist = async (playlistId) => {
    try {
	const existingPlaylists = await getPersistedPlaylists();
	const updatedPlaylists = existingPlaylists.filter((playlist) => playlist.id !== playlistId);
	await AsyncStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
	return 'playlist_removed';
    } catch (error) {
	console.error('Error removing playlist:', error);
	return 'error_removing_playlist';
    }
};

export const getPersistedVideos = async () => {
    try {
	const videosString = await AsyncStorage.getItem('videos');
	return videosString ? JSON.parse(videosString) : [];
    } catch (error) {
	console.error('Error retrieving videos:', error);
	return [];
    }
};

export const persistVideo = async (video) => {
    try {
	const existingVideos = await getPersistedVideos();
	if(existingVideos.find((v) => v.id === video.id)) {
	    return 'video_already_exists';
	}
        const updatedVideos = [...existingVideos, video];
	await AsyncStorage.setItem('videos', JSON.stringify(updatedVideos));
	return 'video_added';
    } catch (error) {
	console.error('Error storing video:', error);
	return 'error_storing_video';
    }
};

export const removeVideo = async (videoId) => {
    try {
	const existingVideos = await getPersistedVideos();
	const updatedVideos = existingVideos.filter((video) => video.id !== videoId);
	await AsyncStorage.setItem('videos', JSON.stringify(updatedVideos));
	return 'video_removed';
    } catch (error) {
	console.error('Error removing video:', error);
	return 'error_removing_video';
    }
};
