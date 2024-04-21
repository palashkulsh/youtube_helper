// api/youtube.js
import axios from 'axios';

const PLAYLIST_API_URL = 'https://ytparse.trickypalash.workers.dev/playlist/';
const VIDEO_API_URL = 'https://ytparse.trickypalash.workers.dev/video/';

const extractVideoId = (url) => {
    const videoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const match = url.match(videoIdRegex);
    return match ? match[1] : null;
};

const extractPlaylistId = (url) => {
    const playlistIdRegex = /(?:youtube\.com\/(?:playlist\?|.*[?&]list=))([\w-]+)/i;
    const match = url.match(playlistIdRegex);
    return match ? match[1] : null;
};

export const fetchPlaylistDetails = async (playlistId) => {
    try {
	if (!playlistId) {
	    throw new Error('Invalid YouTube playlist URL');
	}
	
	const response = await axios.get(`${PLAYLIST_API_URL}${playlistId}`);
	console.log(response)
	const playlistData = response.data;
	console.log(playlistData);
	return {
	    id: playlistData.id,
	    title: playlistData.title,
	    channelName: playlistData.channelName,
	    videos: playlistData.videos.map((video) => ({
		id: video.videoId,
		title: video.title,
		channelName: video.channelName,
		playlistTitle: video.playlistTitle,
		lengthSeconds: video.lengthSeconds,
	    })),
	};
	console.log(playlistData);
    } catch (error) {
	console.error('Error fetching playlist details:', error);
	throw error;
    }
};

export const fetchVideoDetails = async (videoId) => {
    try {

	if (!videoId) {
	    throw new Error('Invalid YouTube video URL');
	}

	const response = await axios.get(`${VIDEO_API_URL}${videoId}`);
	const videoData = response.data;

	return {
	    id: videoData.id,
	    title: videoData.title,
	    description: videoData.description,
	    thumbnailUrl: videoData.thumbnailUrl,
	    channelName: videoData.channelName,
	};
    } catch (error) {
	console.error('Error fetching video details:', error);
	throw error;
    }
};
