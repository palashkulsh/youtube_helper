import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Dimensions, PanResponder, Animated } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { fetchVideoDetails } from '../api/youtube';
import { getWatchedTime, setWatchedTime } from '../storage/asyncStorage';
import OrientationLocker from 'react-native-orientation-locker';

const { width, height } = Dimensions.get('window');

const SingleVideoDetailsScreen = ({ route }) => {
    const { videoId } = route.params;
    const [videoDetails, setVideoDetails] = useState(null);
    const [watchedTime, setWatchedTime] = useState('');
    const [watchedDate, setWatchedDate] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [scale, setScale] = useState(new Animated.Value(1));

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

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (event, gestureState) => {
            const { dx, dy } = gestureState;
            const newScale = Math.max(0.1, scale._value - dy / 1000); // Adjust the sensitivity by changing the divisor
            setScale(newScale);
        },
    });

    if (!videoDetails) {
        return <Text>Loading...</Text>;
    }

    return (
        <View style={styles.container}>
            <View style={isFullScreen ? styles.fullScreenVideo : styles.video} {...panResponder.panHandlers}>
                <YoutubePlayer
                    ref={playerRef}
                    height={isFullScreen ? height : 200}
                    width={isFullScreen ? width : '100%'}
                    videoId={videoId}
                    play={true}
                    onChangeState={(event) => console.log(event)}
                    onFullScreenChange={handleFullScreenChange}
                    webViewProps={{
                        allowsFullscreenVideo: true,
                        allowsInlineMediaPlayback: true,
                        allowsFullscreenVideo: true,
                        scalesPageToFit: true,
                        bounces: false,
                        automaticallyAdjustContentInsets: false,
                        scrollEnabled: false,
                        showsHorizontalScrollIndicator: false,
                        showsVerticalScrollIndicator: false,
                        javaScriptEnabled: true,
                        domStorageEnabled: true,
                        useWebKit: true,
                        injectedJavaScript: `
                            (function() {
                                var meta = document.createElement('meta');
                                meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=1');
                                meta.setAttribute('name', 'viewport');
                                document.getElementsByTagName('head')[0].appendChild(meta);
                            })();
                        `,
                    }}
                    webViewStyle={{ transform: [{ scale: scale }] }}
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
