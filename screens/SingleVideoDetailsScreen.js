import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Dimensions, Animated } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { fetchVideoDetails } from '../api/youtube';
import { getWatchedTime, setWatchedTime } from '../storage/asyncStorage';
import { State } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const SingleVideoDetailsScreen = ({ route }) => {
    const { videoId } = route.params;
    const [videoDetails, setVideoDetails] = useState(null);
    const [watchedTime, setWatchedTime] = useState('');
    const [watchedDate, setWatchedDate] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [contentScale, setContentScale] = useState(1);

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

    const handleFullScreenChange = (fullscreen) => {
        setIsFullScreen(fullscreen);
    };

    if (!videoDetails) {
        return <Text>Loading...</Text>;
    }
    
    return (
        <View style={styles.container}>
            <View style={[styles.videoContainer, isFullScreen && styles.fullScreenContainer]}>
               <YoutubePlayer
                    height={isFullScreen ? width : 200}
                    width={isFullScreen ? height : '100%'}
                    videoId={videoId}
                    play={true}
                    onChangeState={(event) => console.log(event)}
                    onFullScreenChange={handleFullScreenChange}
		   allowWebViewZoom={true}
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
                    <Button title="Full Screen" onPress={() => handleFullScreenChange(true)} />
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
