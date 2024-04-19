import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Dimensions, PanResponder, Animated } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { fetchVideoDetails } from '../api/youtube';
import { getWatchedTime, setWatchedTime } from '../storage/asyncStorage';
import OrientationLocker from 'react-native-orientation-locker';
import { State } from 'react-native-gesture-handler'; // Import State from react-native-gesture-handler

const { width, height } = Dimensions.get('window');

const SingleVideoDetailsScreen = ({ route }) => {
    const { videoId } = route.params;
    const [videoDetails, setVideoDetails] = useState(null);
    const [watchedTime, setWatchedTime] = useState('');
    const [watchedDate, setWatchedDate] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [scale, setScale] = useState(new Animated.Value(1));
    const [contentScale, setContentScale] = useState(1);
    
    const playerRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            const details = await fetchVideoDetails(videoId);
            setVideoDetails(details);
            setWatchedTime(await getWatchedTime(videoId));
        };
        fetchData();
    }, [videoId]);

    const handleWatchedSubmit = async () => {
        await setWatchedTime(videoId, watchedTime, watchedDate);
    };

    const handleFullScreenChange = (isFullScreen) => {
        setIsFullScreen(isFullScreen);
        if (isFullScreen) {
            OrientationLocker.lockToLandscape();
        } else {
            OrientationLocker.lockToPortrait();
        }
    };

    const handlePinchGesture = Animated.event(
        [{ nativeEvent: { scale: scale } }],
        { useNativeDriver: true }
    );

    const preventSeeking = (event, gestureState) => {
        // Prevent seeking by consuming the gesture if the scale factor changes significantly
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
            event.stopPropagation();
        }
    };

    if (!videoDetails) {
        return <Text>Loading...</Text>;
    }

    return (
        <View style={styles.container}>
            <View style={isFullScreen ? styles.fullScreenVideo : styles.video}>
                <YoutubePlayer
                    ref={playerRef}
                    height={isFullScreen ? height*contentScale : 200}
                    width={isFullScreen ? width*contentScale : '100%'}
                    videoId={videoId}
                    play={true}
		    allowWebViewZoom={true}
                    onChangeState={(event) => console.log(event)}
                    onFullScreenChange={handleFullScreenChange}
		    contentScale= {contentScale}
		    webViewProps={{
			//userAgent:'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36'
		    }}
                />
            </View>
            {!isFullScreen && (
                <View style={styles.videoDetails}>
                    <Text>Watched Time: {watchedTime}</Text>
                    <Text>Watched Date: {watchedDate}</Text>
                    <TextInput
                        value={watchedTime}
                        onChangeText={setWatchedTime}
                        placeholder="Enter watched time"
                    />
                    <TextInput
                        value={watchedDate}
                        onChangeText={setWatchedDate}
                        placeholder="Enter watched date"
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
    video: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    fullScreenVideo: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoDetails: {
        padding: 16,
    },
});

export default SingleVideoDetailsScreen;
