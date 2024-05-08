import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { getPersistedVideoData, persistVideoData } from '../storage/asyncStorage';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import CheckBox from '@react-native-community/checkbox';
import { useToast } from "react-native-toast-notifications";

const { width, height } = Dimensions.get('window');

const SingleVideoDetailsScreen = ({ route }) => {
    const { videoId } = route.params;
    const [videoData, setVideoData] = useState({
        watchedTime: 0,
        watchedDate: '',
        videoDuration: 0,
        abandoned: false,
    });
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const playerRef = useRef();
    
    const navigation = useNavigation();
    const toast = useToast();

    console.log('outside videoData',videoData);
    
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerButtonsContainer}>
                    <Button
                        onPress={handleSyncTime}
                        title="Sync"
                        color="#007AFF"
                    />		
                    <Button
                        onPress={() => handleFullScreenChange(!isFullScreen)}
                        title="Full Scr."
                        color="#007AFF"
                    />
                </View>
            ),
        });
    }, [isFullScreen]);

    useEffect(() => {
        const fetchData = async () => {
            const persistedData = await getPersistedVideoData(videoId);
            setVideoData(prevData => ({
                ...prevData,
                ...persistedData,
            }));
        };	
        fetchData();
    }, [videoId]);

    const handleDataChange = (field, value) => {
	console.log("changing field",field, value)
        setVideoData(prevData => ({
            ...prevData,
            [field]: value,
        }));
    };

    const handleWatchedSubmit = async () => {
	console.log("watched submit fired",videoData)
	await persistVideoData(videoId, videoData);
	toast.show('Saved Successfully', {
            duration: 2000,
            placement: 'bottom',
            animationType: 'slide-in',
	});
    };
    
    const handleFullScreenChange = (fullscreen) => {
        setIsFullScreen(fullscreen);
    };

    const handleSyncTime = async () => {
	const currentTime = await playerRef.current?.getCurrentTime();
	setVideoData(prevData => {
            const updatedData = {
		...prevData,
		watchedTime: currentTime,
            };
            persistVideoData(videoId, updatedData);
            return updatedData;
	});
	toast.show('Time Synced Successfully', {
            duration: 2000,
            placement: 'bottom',
            animationType: 'slide-in',
	});
    };
    
    const handlePlayerStateChange = (state) => {
        setIsPlaying(state === 'playing');
    };

    const playerReady = async () => {
	console.log('player ready fired');
        const duration = await playerRef.current?.getDuration();
        handleDataChange('videoDuration', duration);
        await playerRef.current?.seekTo(videoData.watchedTime);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.videoContainer, isFullScreen && styles.fullScreenContainer]}>
                <YoutubePlayer
                    height={isFullScreen ? width : 200}
                    width={isFullScreen ? height : '100%'}
                    videoId={videoId}
                    ref={playerRef}
                    play={true}
                    onChangeState={handlePlayerStateChange}
                    onFullScreenChange={handleFullScreenChange}
                    allowWebViewZoom={true}
                    onReady={playerReady}
                    onError={console.log}
                    start={videoData.watchedTime}
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
                    <Text style={styles.label}>Watched Time:</Text>
                    <Text style={styles.value}>
                        {Math.floor(videoData.watchedTime / 60)} m. {Math.ceil(videoData.watchedTime) - (Math.floor(videoData.watchedTime / 60) * 60)} s
                    </Text>

                    <Text style={styles.label}>Watched Date:</Text>
                    <TextInput
                        style={styles.input}
                        value={videoData.watchedDate}
                        onChangeText={(value) => handleDataChange('watchedDate', value)}
                        placeholder="Enter watched date"
                        placeholderTextColor="#999"
                    />

                    <View style={styles.checkboxContainer}>
                        <Text style={styles.label}>Abandoned:</Text>
                        <CheckBox
                            disabled={false}
                            value={videoData.abandoned}
                            onValueChange={(value) => handleDataChange('abandoned', value)}
                            tintColors={{ true: '#007AFF', false: '#999' }}
                        />
                    </View>

                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={videoData.videoDuration}
                        value={videoData.watchedTime}
                        onValueChange={(value) => handleDataChange('watchedTime', value)}
                        minimumTrackTintColor="#007AFF"
                        maximumTrackTintColor="#CCC"
                        thumbTintColor="#007AFF"
                    />

                    <Button
                        title="Submit"
                        onPress={handleWatchedSubmit}
                        color="#007AFF"
                        style={styles.button}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    videoContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    fullScreenContainer: {
        width: height * 1,
        height: width * 1,
        transform: [{ rotate: '90deg' }, { translateX: (height - width) / 2.5 }, { translateY: (height - width) / 2.5 }],
    },
    videoDetails: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
        marginBottom: 15,
    },
    input: {
        height: 40,
        borderColor: '#CCC',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    slider: {
        marginBottom: 20,
    },
    button: {
        marginTop: 10,
    },
    headerButtonsContainer: {
	flexDirection: 'row',
	alignItems: 'center',
	marginRight: 10,
    },    
});

export default SingleVideoDetailsScreen;
