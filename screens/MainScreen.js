// MainScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity } from 'react-native';
import { fetchVideoDetails, fetchPlaylistDetails } from '../api/youtube';

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

const MainScreen = ({ navigation }) => {
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [videoId, setVideoId] = useState('');
    const [playlistId, setPlaylistId] = useState('');

    const handleSubmit = async () => {
	setVideoId(extractVideoId(url));
	setPlaylistId(extractPlaylistId(url));
	
	console.log(videoId,playlistId)
	if (videoId) {
	    const videoDetails = await fetchVideoDetails(videoId);
	    console.log(videoDetails);
	    setTitle(videoDetails.title);
	} else if (playlistId) {
	    const playlistDetails = await fetchPlaylistDetails(playlistId);
	    setTitle(playlistDetails.title);
	}
    };

    const handleTitlePress = () => {
	navigation.navigate('VideoDetails', { videoId, playlistId });
    };

    return (
	<View>
	    <TextInput
		value={url}
		onChangeText={setUrl}
		placeholder="Enter YouTube URL"
	    />
	    <Button title="Submit" onPress={handleSubmit} />
	    {title ? (
		<TouchableOpacity onPress={handleTitlePress}>
		    <Text>{title}</Text>
		</TouchableOpacity>
	    ) : null}
	</View>
    );
};

export default MainScreen;
