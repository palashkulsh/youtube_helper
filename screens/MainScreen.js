// MainScreen.js
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Platform, PermissionsAndroid } from 'react-native';
import { fetchVideoDetails, fetchPlaylistDetails } from '../api/youtube';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { getPersistedVideoData, persistVideoData, getWatchedStatus, saveWatchedStatus, getPersistedPlaylists, persistPlaylist, removePlaylist, removeVideo, getPersistedVideos, persistVideo, exportStorage, importStorage } from '../storage/asyncStorage';
import {  useNavigation } from '@react-navigation/native';
import { useToast } from "react-native-toast-notifications";
import RNFS from 'react-native-fs';
import { request, PERMISSIONS } from 'react-native-permissions';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Share from 'react-native-share';

const extractVideoId = (url) => {
    const videoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const match = url.match(videoIdRegex);
    return match ? match[1] : null;
};

const extractPlaylistId = (url) => {
    const playlistIdRegex = /(?:youtube\.com\/(?:playlist\?|.*?[?&])list=|youtu\.be\/.*?[?&]list=)([^&]+)/i;
    const match = url.match(playlistIdRegex);
    return match ? match[1] : null;
};

const exportData = async (toast) => {
    try {
        const granted = await requestExternalStoragePermission();
        if (granted) {
            const appData = await exportStorage();
            const jsonData = JSON.stringify(appData, null, 2);
            const dirPath = `${RNFS.ExternalDirectoryPath}/MyApp`;
            const filePath = `${dirPath}/app_data.json`;
            await RNFS.mkdir(dirPath);
            await RNFS.writeFile(filePath, jsonData, 'utf8');
            console.log('Data exported successfully to:', filePath);
            // Perform any additional actions after successful export
	    toast.show("exported successfully",{
                duration: 2000,
                placement: 'bottom',
                animationType: 'slide-in',
            });
            const shareOptions = {
		title: 'App Data',
		failOnCancel: false,
		url: 'file://' + filePath,
		type: 'application/json',
            };

            await Share.open(shareOptions);	    
	} else {
            console.log('Storage permission denied');
            // Handle permission denied case
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        // Handle the error, show an error message, etc.
    }
};

const requestExternalStoragePermission = async () => {
    if (Platform.OS === 'android') {
        try {
            const permissions = [
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            ];
            const grantResults = await PermissionsAndroid.requestMultiple(permissions);
            const isGranted =
                grantResults[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                grantResults[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
                    PermissionsAndroid.RESULTS.GRANTED;
            return isGranted;
        } catch (error) {
            console.error('Error requesting external storage permissions:', error);
            return false;
        }
    } else {
        return true; // Permissions not required for iOS
    }
};


const importData = async (toast) => {
    try {
        const res = await DocumentPicker.pick({
            type: [DocumentPicker.types.allFiles],
        });
	console.log(res)
        if (res && res[0] && res[0].uri) {
            const filePath = res[0].uri;
            const jsonString = await RNFS.readFile(filePath, 'utf8');
            const jsonData = JSON.parse(jsonString);
	    console.log("json read,",jsonData);
	    await importStorage(jsonData);
            toast.show('Data imported successfully', {
                duration: 2000,
                placement: 'bottom',
                animationType: 'slide-in',
            });
        } else {
            console.log('File selection canceled or failed');
            // Handle the case when no file was selected or an error occurred
        }
    } catch (error) {
        console.error('Error importing data:', error);
    }
};

const PlaylistRoute = ({navigation, toast}) => {
    const [playlists, setPlaylists] = useState([]);

    useEffect(() => {
	navigation.setOptions({
            headerRight: () => (
		<View style={styles.headerButtonsContainer}>
                    <Button onPress={()=>{exportData(toast)}} title="Export" color="#007AFF" />
                    <Button onPress={()=>{importData(toast)}} title="Import" color="#007AFF" />
		</View>
            ),
	});
    }, []);    
    
    useEffect(() => {
	const fetchPlaylists = async () => {
	    const persistedPlaylists = await getPersistedPlaylists();

	    if (persistedPlaylists && persistedPlaylists.length) {
		const updatedPlaylists = await Promise.all(
		    persistedPlaylists.map(async (playlist) => {
			const progress = await calculatePlaylistProgress(playlist.videos);
			console.log('playlist progress', progress);
			return { ...playlist, progress };
		    })
		);

		console.log('playlist values', updatedPlaylists);
		setPlaylists(updatedPlaylists);
	    } else {
		setPlaylists([]);
	    }
	};

	fetchPlaylists();
    }, []);
    
    const calculatePlaylistProgress = async (videos) => {
	const videoDataPromises = videos.map(async (video) => {
	    const videoData = await getPersistedVideoData(video.id);
	    const lengthFromPlaylist = parseInt(video.lengthSeconds) || 0;
	    const videoLength = parseInt(videoData?.videoDuration) || lengthFromPlaylist;
	    const watchedTime = parseInt(videoData?.watchedTime) || 0;
	    return { videoLength, watchedTime };
	});

	const videoDataArray = await Promise.all(videoDataPromises);

	const totalDuration = videoDataArray.reduce((sum, data) => sum + data.videoLength, 0);
	const watchedDuration = videoDataArray.reduce((sum, data) => sum + data.watchedTime, 0);

	console.log(totalDuration, watchedDuration);
	if (watchedDuration && totalDuration) {
	    const progress = ((watchedDuration / totalDuration) * 100).toFixed(0);
	    return parseInt(progress);
	}

	return 0;
    };
    
    const handleDeletePlaylist = async (playlistId) => {
	let msg = await removePlaylist(playlistId);
	setPlaylists(playlists.filter((playlist) => playlist.id !== playlistId));
	toast.show(msg.replace(/_/g, ' '));
    };

    const handlePlaylistCardPress = (playlist) => {
	console.log(playlist);
	navigation.navigate('VideoDetails', { playlistId: playlist.id });
    };
    
    return (
	<ScrollView style={styles.container}>
	    {playlists.map((playlist) => (
		<TouchableOpacity key={playlist.id} style={styles.playlistCard}
				  onPress={() => handlePlaylistCardPress(playlist)}
		>
		    <Text style={styles.playlistTitle}>{playlist.title}</Text>
		    <Text style={styles.channelName}>{playlist.channelName}</Text>
		    <View style={styles.progressBar}>
			<View style={[styles.progressFill, { width: `${playlist.progress || 0}%` }]} />
		    </View>
		    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePlaylist(playlist.id)}>
			<Text style={styles.deleteButtonText}>Delete</Text>
		    </TouchableOpacity>
		</TouchableOpacity>
	    ))}
	</ScrollView>
    );
};

const VideosRoute = ({navigation, toast}) => {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
	const fetchVideos = async () => {
	    let  persistedVideos = await getPersistedVideos();	    
	    persistedVideos  = await Promise.all(persistedVideos.map(async (video) => {
		const progress = await calculateVideoProgress(video.id);
		return {...video, progress};
	    }))
	    setVideos(persistedVideos);
	};

	fetchVideos();
    }, []);

    const calculateVideoProgress = async (videoId) => {
	const videoData = await getPersistedVideoData(videoId);
	if (videoData && parseInt(videoData.watchedTime)  && parseInt(videoData.videoDuration)) {
	    return (videoData.watchedTime / videoData.videoDuration) * 100;
	}
	return 0;
    };

    const handleDeleteVideo = async (videoId) => {
	let msg = await removeVideo(videoId);	
	setVideos(videos.filter((video) => video.id !== videoId));
	toast.show(msg.replace(/_/g,' '));
    };

    return (
	<ScrollView style={styles.container}>
	    {videos.map((video) => (
		<TouchableOpacity key={video.id} style={styles.videoCard} onPress={() => navigation.navigate('SingleVideoDetails', { videoId: video.id })}>
		    <Text style={styles.videoTitle}>{video.title}</Text>
		    <Text style={styles.channelName}>{video.channelName}</Text>
		    <View style={styles.progressBar}>
			<View style={[styles.progressFill, { width: `${video.progress || 0}%` }]} />
		    </View>
		    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteVideo(video.id)}>
			<Text style={styles.deleteButtonText}>Delete</Text>
		    </TouchableOpacity>
		</TouchableOpacity>
	    ))}
	</ScrollView>
    );
};

const MainScreen = ({ navigation }) => {
    const [url, setUrl] = useState('');
    const [index, setIndex] = useState(0);
    const [routes] = useState([
	{ key: 'playlist', title: 'Playlist' },
	{ key: 'videos', title: 'Videos' },
    ]);
    const toast = useToast();

    const renderScene = SceneMap({
	playlist: () => <PlaylistRoute navigation={navigation} toast={toast}/>,
	videos: () => <VideosRoute navigation={navigation} toast={toast}/>,
    });

    const handleSubmit = async () => {
	const videoId = extractVideoId(url);
	const playlistId = extractPlaylistId(url);
	let msg = '';
	if (playlistId) {
	    console.log("playlistId", playlistId);
	    try {
		const playlistDetails = await fetchPlaylistDetails(playlistId);
		msg = await persistPlaylist(playlistDetails);
	    } catch(error) {
		toast.show("Cannot fetch Playlist Details. please retry",{
		    duration: 2000,
		    placement: 'bottom',
		    animationType: 'slide-in',
		});
	    }
	} else if (videoId) {
	    console.log("videoId", videoId);
	    try {
		const videoDetails = await fetchVideoDetails(videoId);
		msg = await persistVideo(videoDetails);
	    } catch(error) {	
		toast.show("Cannot fetch Video Details. please retry",{
		    duration: 2000,
		    placement: 'bottom',
		    animationType: 'slide-in',
		});	    
	    }
	} 
	toast.show(msg.replace(/_/g,' '),{
	    duration: 2000,
	    placement: 'bottom',
	    animationType: 'slide-in',
	});
	setUrl('');
    };

    return (
	<View style={styles.container}>
	    <TextInput
		value={url}
		onChangeText={setUrl}
		placeholder="Enter YouTube URL"
		style={styles.input}
	    />
	    <Button title="Submit" onPress={handleSubmit} />
	    <TabView
		navigationState={{ index, routes }}
		renderScene={renderScene}
		onIndexChange={setIndex}
		initialLayout={{ width: Dimensions.get('window').width }}
		renderTabBar={(props) => (
		    <TabBar
			{...props}
			indicatorStyle={styles.tabIndicator}
			style={styles.tabBar}
			labelStyle={styles.tabLabel}
		    />
		)}
	    />
	</View>
    );
};

const styles = StyleSheet.create({
    container: {
	flex: 1,
	padding: 16,
    },
    input: {
	height: 40,
	borderColor: 'gray',
	borderWidth: 1,
	marginBottom: 16,
	paddingHorizontal: 8,
    },
    tabIndicator: {
	backgroundColor: 'blue',
    },
    tabBar: {
	backgroundColor: 'white',
    },
    tabLabel: {
	color: 'black',
	fontWeight: 'bold',
    },
    playlistCard: {
	backgroundColor: 'white',
	borderRadius: 8,
	padding: 16,
	marginBottom: 16,
	elevation: 2,
    },
    videoCard: {
	backgroundColor: 'white',
	borderRadius: 8,
	padding: 16,
	marginBottom: 16,
	elevation: 2,
    },
    playlistTitle: {
	fontSize: 18,
	fontWeight: 'bold',
	marginBottom: 8,
    },
    videoTitle: {
	fontSize: 18,
	fontWeight: 'bold',
	marginBottom: 8,
    },
    channelName: {
	fontSize: 14,
	color: 'gray',
	marginBottom: 8,
    },
    progressBar: {
	height: 4,
	backgroundColor: 'lightgray',
	borderRadius: 2,
	marginBottom: 8,
    },
    progressFill: {
	height: '100%',
	backgroundColor: 'green',
	borderRadius: 2,
    },
    deleteButton: {
	backgroundColor: 'red',
	borderRadius: 4,
	paddingVertical: 8,
	paddingHorizontal: 12,
	alignItems: 'center',
    },
    deleteButtonText: {
	color: 'white',
	fontWeight: 'bold',
    },
    headerButtonsContainer: {
	flexDirection: 'row',
	alignItems: 'center',
	marginRight: 10,
    },    
});

export default MainScreen;
