import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { fetchPlaylistDetails } from '../api/youtube';
import { getPersistedVideoData } from '../storage/asyncStorage';
import { useFocusEffect } from '@react-navigation/native';

const VideoDetailsScreen = ({ route, navigation }) => {
  const { playlistId, videoId } = route.params;
  const [videos, setVideos] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        if (playlistId) {
          const playlistDetails = await fetchPlaylistDetails(playlistId);
          const videosWithData = await Promise.all(
            playlistDetails.videos.map(async (video) => ({
              ...video,
              videoData: await getPersistedVideoData(video.id),
            }))
          );
          setVideos(videosWithData);
        } else {
          navigation.navigate('SingleVideoDetails', { videoId });
        }
      };
      fetchData();
    }, [playlistId, videoId, navigation])
  );

  const handleVideoPress = (videoId) => {
    navigation.navigate('SingleVideoDetails', { videoId });
  };

  const renderVideoItem = ({ item }) => {
    const { videoData } = item;
    const progress = videoData ? videoData.watchedTime / videoData.videoDuration : 0;
    const abandoned = videoData ? videoData.abandoned : false;

    return (
      <TouchableOpacity
        onPress={() => handleVideoPress(item.id)}
        style={[styles.videoCard, abandoned && styles.abandonedVideo]}
      >
        <Text style={styles.videoTitle}>{item.title}</Text>
        {!abandoned && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}
        {abandoned && <Text style={styles.abandonedText}>Abandoned</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  videoCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  abandonedVideo: {
    opacity: 0.5,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'lightgray',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'green',
    borderRadius: 2,
  },
  abandonedText: {
    fontSize: 12,
    color: 'red',
  },
});

export default VideoDetailsScreen;
