import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Dimensions, Animated } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { getPersistedVideoData, persistVideoData } from '../storage/asyncStorage';
import { State } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { WakeLockInterface, useWakeLock } from "react-native-android-wake-lock";
import CheckBox from '@react-native-community/checkbox';
import { useToast } from "react-native-toast-notifications";

const { width, height } = Dimensions.get('window');

const SingleVideoDetailsScreen = ({ route }) => {
    const { videoId } = route.params;
    const [watchedTime, setWatchedTime] = useState('');
    const [watchedDate, setWatchedDate] = useState('');
    const [videoData, setVideoData] = useState({});
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [contentScale, setContentScale] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const playerRef = useRef();
    const [abandoned, setAbandoned] = useState(false)
    
    const navigation = useNavigation();
    const toast = useToast();
    
    console.log(abandoned);
    
    // Inside your component
    useEffect(() => {
	navigation.setOptions({
	    headerRight: () => (
		<Button
		    onPress={() => handleFullScreenChange(!isFullScreen)}
		    title="Full Screen"
		/>
	    ),
	});
    }, [isFullScreen]);    

    useEffect(() => {
        const fetchData = async () => {
	    let videoData = await getPersistedVideoData(videoId);
	    setVideoData(videoData || {});
	    if(!videoData)
		return;
	    console.log('***',videoData);
	    let persistedWatchedTime = Number(videoData.watchedTime) || 0;
            setWatchedTime(persistedWatchedTime);
	    setWatchedDate(videoData.watchedDate || '');
	    setAbandoned(videoData.abandoned ? true: false);
        };
        fetchData();
    }, [videoId]);

    const handleWatchedSubmit = async () => {
	let dataToBeSaved = {
	    videoId,
	    watchedTime,
	    watchedDate,
	    videoDuration,
	    abandoned
	}
        await persistVideoData(videoId, dataToBeSaved);
	toast.show('Saved Successfully', {
	    duration: 2000,
	    placement: 'bottom',
	    animationType: 'slide-in',
	})
    };

    const handleFullScreenChange = (fullscreen) => {
        setIsFullScreen(fullscreen);
    };

    const handelePlayerStateChange = (state) => {
	console.log(state);
	if (state === 'playing') {
	    // Handle end of video
	    setIsPlaying(true);	    
	} else if (state === 'paused') {
	    // Handle start of video
	    setIsPlaying(false);
	}
    };

    const playerReady = async () => {
	console.log('Player Ready');
	playerRef.current?.getDuration().then(            getDuration => console.log({getDuration})          );
        await playerRef.current?.getDuration().then(getDuration => setVideoDuration(getDuration));
	await playerRef.current?.seekTo(watchedTime);
    }
    
    return (
        <View style={styles.container}>
            <View style={[styles.videoContainer, isFullScreen && styles.fullScreenContainer]}>
               <YoutubePlayer
                    height={isFullScreen ? width : 200}
                    width={isFullScreen ? height : '100%'}
                   videoId={videoId}
		   ref={playerRef}
                    play={true}
                    onChangeState={handelePlayerStateChange}
                    onFullScreenChange={handleFullScreenChange}
		   allowWebViewZoom={true}
		   onReady={playerReady}
		   onError={console.log}
		   start={watchedTime}
		   initialPlayerParams={{
		       preventFullScreen: true		       
		   }}
		   webViewProps={{
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
                   }}
               />
            </View>
            {!isFullScreen && (
                <View style={styles.videoDetails}>
                    <Text>Watched Time: {Math.floor(watchedTime/60)} m. {Math.ceil(watchedTime)-(Math.floor(watchedTime/60)*60)} s</Text>
                    <Text>Watched Date: {watchedDate}</Text>
                    <TextInput
                        value={watchedDate}
                        onChangeText={setWatchedDate}
                        placeholder="Enter watched date"
                    />
		    <Text> Abandoned: {abandoned ? 'Yes' : 'No'}</Text>
		    <CheckBox
			disabled={false}
			value={abandoned}
			onValueChange={(newValue) => setAbandoned(newValue)}
		    />
		    <Slider
			style={{ width: '100%', height: 40 }}
			minimumValue={0}
			maximumValue={videoDuration} // Assuming videoDetails contains duration of the video
			value={watchedTime}
			onValueChange={setWatchedTime}
			minimumTrackTintColor="#FFFFFF"
			maximumTrackTintColor="#000000"
		    />		    
                    <Button title="Submit" onPress={handleWatchedSubmit} />
		    
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    videoContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    fullScreenContainer: {
        width: height*1,
        height: width*1,
        transform: [{ rotate: '90deg' }, { translateX: (height - width) / 2.5  }, { translateY: (height - width) / 2.5 }],
    },
    videoDetails: {

    },
});

export default SingleVideoDetailsScreen;
