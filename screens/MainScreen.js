// MainScreen.js
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { fetchVideoDetails, fetchPlaylistDetails } from '../api/youtube';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { getPersistedVideoData, persistVideoData, getWatchedStatus, saveWatchedStatus, getPersistedPlaylists, persistPlaylist, removePlaylist, removeVideo } from '../storage/asyncStorage';
import {  useNavigation } from '@react-navigation/native';

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

const PlaylistRoute = ({navigation}) => {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      const persistedPlaylists = await getPersistedPlaylists();
      setPlaylists(persistedPlaylists);
    };

    fetchPlaylists();
  }, []);

  const calculatePlaylistProgress = (videos) => {
    let totalDuration = 0;
    let watchedDuration = 0;

    videos.forEach((video) => {
      totalDuration += parseInt(video.lengthSeconds);
      const watchedTime = getPersistedVideoData(video.videoId);
      if (watchedTime) {
        watchedDuration += watchedTime.watchedSeconds;
      }
    });

    return (watchedDuration / totalDuration) * 100;
  };

  const handleDeletePlaylist = async (playlistId) => {
    await removePlaylist(playlistId);
    setPlaylists(playlists.filter((playlist) => playlist.id !== playlistId));
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
            <View style={[styles.progressFill, { width: `${calculatePlaylistProgress(playlist.videos)}%` }]} />
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePlaylist(playlist.id)}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const VideosRoute = ({navigation}) => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const persistedVideos = await getPersistedVideos();
      setVideos(persistedVideos);
    };

    fetchVideos();
  }, []);

  const calculateVideoProgress = (videoId) => {
    const watchedTime = getPersistedVideoData(videoId);
    if (watchedTime) {
      return (watchedTime.watchedSeconds / watchedTime.totalSeconds) * 100;
    }
    return 0;
  };

  const handleDeleteVideo = async (videoId) => {
    await removeVideo(videoId);
    setVideos(videos.filter((video) => video.id !== videoId));
  };

  return (
    <ScrollView style={styles.container}>
      {videos.map((video) => (
        <TouchableOpacity key={video.id} style={styles.videoCard} onPress={() => navigation.navigate('VideoDetails', { videoId: video.id })}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.channelName}>{video.channelName}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${calculateVideoProgress(video.id)}%` }]} />
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

  const renderScene = SceneMap({
      playlist: () => <PlaylistRoute navigation={navigation}/>,
    videos: VideosRoute,
  });

  const handleSubmit = async () => {
    const videoId = extractVideoId(url);
    const playlistId = extractPlaylistId(url);

    if (videoId) {
      const videoDetails = await fetchVideoDetails(videoId);
      await persistVideo(videoDetails);
    } else if (playlistId) {
      const playlistDetails = await fetchPlaylistDetails(playlistId);
      await persistPlaylist(playlistDetails);
    }

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
});

export default MainScreen;
