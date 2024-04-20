import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainScreen from './screens/MainScreen';
import VideoDetailsScreen from './screens/VideoDetailsScreen';
import SingleVideoDetailsScreen from './screens/SingleVideoDetailsScreen';
import { ToastProvider } from 'react-native-toast-notifications'
import { MenuProvider } from 'react-native-popup-menu';

const Stack = createStackNavigator();

const App = () => {
    return (	
	<ToastProvider>
	    <MenuProvider>	    
		<NavigationContainer>
		    <Stack.Navigator>
			<Stack.Screen name="Main" component={MainScreen} />
			<Stack.Screen name="VideoDetails" component={VideoDetailsScreen} />
			<Stack.Screen name="SingleVideoDetails" component={SingleVideoDetailsScreen} />
		    </Stack.Navigator>
		</NavigationContainer>
	    </MenuProvider>
	</ToastProvider>	
	
    );
};

export default App;
