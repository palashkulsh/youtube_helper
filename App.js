import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainScreen from './screens/MainScreen';
import VideoDetailsScreen from './screens/VideoDetailsScreen';
import SingleVideoDetailsScreen from './screens/SingleVideoDetailsScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="VideoDetails" component={VideoDetailsScreen} />
        <Stack.Screen name="SingleVideoDetails" component={SingleVideoDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
