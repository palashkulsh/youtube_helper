import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button } from 'react-native';
import { fetchPlaylistDetails } from '../api/youtube';
import { getWatchedStatus, setWatchedStatus } from '../storage/asyncStorage';

const VideoDetailsScreen = ({ route, navigation }) => {
  const { playlistId, videoId } = route.params;
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (playlistId) {
        const playlistDetails = await fetchPlaylistDetails(playlistId);
        const videosWithWatchedStatus = await Promise.all(
          playlistDetails.videos.map(async (video) => ({
            ...video,
            watched: await getWatchedStatus(video.id),
          }))
        );
        setVideos(videosWithWatchedStatus);
      } else {
        navigation.navigate('SingleVideoDetails', { videoId });
      }
    };
    fetchData();
  }, [playlistId, videoId, navigation]);

  const handleVideoPress = (videoId) => {
    navigation.navigate('SingleVideoDetails', { videoId });
  };

  const handleWatchedToggle = async (videoId) => {
    const currentWatchedStatus = await getWatchedStatus(videoId);
    await setWatchedStatus(videoId, !currentWatchedStatus);
    setVideos(
      videos.map((video) =>
        video.id === videoId ? { ...video, watched: !currentWatchedStatus } : video
      )
    );
  };

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleVideoPress(item.id)}>
      <Text>{item.title}</Text>
      <Text>Watched: {item.watched ? 'Yes' : 'No'}</Text>
      <Button
        title={item.watched ? 'Mark as Unwatched' : 'Mark as Watched'}
        onPress={() => handleWatchedToggle(item.id)}
      />
    </TouchableOpacity>
  );

  return (
    <View>
      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

export default VideoDetailsScreen;
