import React from 'react';
import { Image, View} from 'react-native';
import { SkypeIndicator } from 'react-native-indicators';

const styleView = {
  flex: 1,
  width: '100%',
  height: '100%',
  backgroundColor: '#000000',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
};
const styleImage = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  opacity: 0.5,
};

export default function LoadingAppManager() {

  return (
    <View style={styleView}>
      <Image style={styleImage} source={require('../assets/images/loader2.png')} />
      <SkypeIndicator color={'white'}/>
    </View>
  );
}
