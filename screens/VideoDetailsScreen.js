import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { fetchPlaylistDetails } from '../api/youtube';
import { getPersistedVideoData, getPersistedPlaylistById } from '../storage/asyncStorage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import CheckBox from '@react-native-community/checkbox';

const VideoDetailsScreen = ({ route }) => {
    const { playlistId, videoId } = route.params;
    console.log(route.params)
  const [videos, setVideos] = useState([]);
  const [showProgressPercentage, setShowProgressPercentage] = useState(false);
  const [showAggregatePercentage, setShowAggregatePercentage] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        if (playlistId) {
          const playlistDetails = await getPersistedPlaylistById(playlistId);
          const videosWithData = await Promise.all(
            playlistDetails.videos.map(async (video) => ({
              ...video,
              videoData: await getPersistedVideoData(video.id),
            }))
          );
          setVideos(videosWithData);
        } else if (videoId){
          navigation.navigate('SingleVideoDetails', { videoId });
        }
      };
      fetchData();
    }, [playlistId, videoId, navigation])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Menu>
          <MenuTrigger>
            <Text style={styles.menuIcon}>&#8942;</Text>
          </MenuTrigger>
          <MenuOptions>
            <MenuOption onSelect={() => setShowProgressPercentage(!showProgressPercentage)}>
              <View style={styles.menuItem}>
                <CheckBox
                  value={showProgressPercentage}
                    onValueChange={() => setShowProgressPercentage(!showProgressPercentage)}
                />
                <Text style={styles.menuItemText}>Show Progress Percentage</Text>
              </View>
            </MenuOption>
            <MenuOption onSelect={() => setShowAggregatePercentage(!showAggregatePercentage)}>
              <View style={styles.menuItem}>
                <CheckBox
                  value={showAggregatePercentage}
                    onValueChange={() => setShowAggregatePercentage(!showAggregatePercentage)}
                />
                <Text style={styles.menuItemText}>Show Aggregate Percentage</Text>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      ),
    });
  }, [navigation, showProgressPercentage, showAggregatePercentage]);
    
  const handleVideoPress = (videoId) => {
    navigation.navigate('SingleVideoDetails', { videoId });
  };

  const renderVideoItem = ({ item }) => {
      const { videoData } = item;
      console.log(videoData);
    const progress = videoData ? videoData.watchedTime / videoData.videoDuration : 0;
    const abandoned = videoData ? videoData.abandoned : false;

    return (
      <TouchableOpacity
        onPress={() => handleVideoPress(item.id)}
        style={[styles.videoCard, abandoned && styles.abandonedVideo]}
      >
        <Text style={styles.videoTitle}>{item.title}</Text>
        {!abandoned && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            {showProgressPercentage && (
              <Text style={styles.progressPercentage}>{`${Math.round(progress * 100)}%`}</Text>
            )}
          </View>
        )}
        {abandoned && <Text style={styles.abandonedText}>Abandoned</Text>}
      </TouchableOpacity>
    );
  };

    const calculateAggregatePercentage = () => {
	const nonAbandonedVideos = videos.filter((video) => !video.videoData?.abandoned);
	let percentageSum = 0;
	nonAbandonedVideos.forEach((video) => {
	    if(video.videoData) {
		percentageSum += ((video.videoData.watchedTime || 0) / (video.videoData.videoDuration ||  1 )) *100
	    }
	});
	return Number(percentageSum / nonAbandonedVideos.length).toFixed(0);
    };

  return (
    <View style={styles.container}>
      {showAggregatePercentage && (
        <Text style={styles.aggregatePercentage}>
          Aggregate Completion: {calculateAggregatePercentage()}%
        </Text>
      )}
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
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    marginLeft: 8,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'lightgray',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'green',
    borderRadius: 2,
  },
  progressPercentage: {
    marginLeft: 8,
    fontSize: 12,
  },
  abandonedText: {
    fontSize: 12,
    color: 'red',
  },
  aggregatePercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default VideoDetailsScreen;
