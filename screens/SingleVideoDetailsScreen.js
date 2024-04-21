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
    const [watchedTime, setWatchedTime] = useState('');
    const [watchedDate, setWatchedDate] = useState('');
    const [videoData, setVideoData] = useState({});
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const playerRef = useRef();
    const [abandoned, setAbandoned] = useState(false);
    
    const navigation = useNavigation();
    const toast = useToast();

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Button
                    onPress={() => handleFullScreenChange(!isFullScreen)}
                    title="Full Screen"
                    color="#007AFF"
                />
            ),
        });
    }, [isFullScreen]);

    useEffect(() => {
        const fetchData = async () => {
            let videoData = await getPersistedVideoData(videoId);
            setVideoData(videoData || {});
            if (!videoData) return;
            let persistedWatchedTime = Number(videoData.watchedTime) || 0;
            setWatchedTime(persistedWatchedTime);
            setWatchedDate(videoData.watchedDate || '');
            setAbandoned(videoData.abandoned ? true : false);
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
        };
        await persistVideoData(videoId, dataToBeSaved);
        toast.show('Saved Successfully', {
            duration: 2000,
            placement: 'bottom',
            animationType: 'slide-in',
        });
    };

    const handleFullScreenChange = (fullscreen) => {
        setIsFullScreen(fullscreen);
    };

    const handlePlayerStateChange = (state) => {
        if (state === 'playing') {
            setIsPlaying(true);
        } else if (state === 'paused') {
            setIsPlaying(false);
        }
    };

    const playerReady = async () => {
        await playerRef.current?.getDuration().then(getDuration => setVideoDuration(getDuration));
        await playerRef.current?.seekTo(watchedTime);
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
                    <Text style={styles.label}>Watched Time:</Text>
                    <Text style={styles.value}>{Math.floor(watchedTime / 60)} m. {Math.ceil(watchedTime) - (Math.floor(watchedTime / 60) * 60)} s</Text>

                    <Text style={styles.label}>Watched Date:</Text>
                    <TextInput
                        style={styles.input}
                        value={watchedDate}
                        onChangeText={setWatchedDate}
                        placeholder="Enter watched date"
                        placeholderTextColor="#999"
                    />

                    <View style={styles.checkboxContainer}>
                        <Text style={styles.label}>Abandoned:</Text>
                        <CheckBox
                            disabled={false}
                            value={abandoned}
                            onValueChange={(newValue) => setAbandoned(newValue)}
                            tintColors={{ true: '#007AFF', false: '#999' }}
                        />
                    </View>

                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={videoDuration}
                        value={watchedTime}
                        onValueChange={setWatchedTime}
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
});

export default SingleVideoDetailsScreen;
