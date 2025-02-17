import React, {useRef, useState} from 'react';
import {
  Linking,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  View,
  Image,
  Alert,
} from 'react-native';
import WebView from 'react-native-webview';
import {Link} from "@react-navigation/native";

export default function AppManagerChild({navigation, route}) {
  const linkRefresh = route.params.data;
  const userAgent = route.params.userAgent;
  const webViewRef = useRef(null);

  const [isTwoClick, setTwoClick] = useState(false);

  const redirectDomens = ['https://ninecasino.life/#deposit'];

  const openInBrowser = [
    'mailto:',
    'itms-appss://',
    'conexus://',
    'bmoolbb://',
    'cibcbanking://',
    'bncmobile://',
    'rbcmobile://',
    'scotiabank://',
    'pcfbanking://',
    'tdct://',
    'nl.abnamro.deeplink.psd2.consent://',
    'nl-snsbank-sign://',
    'nl-asnbank-sign://',
    'triodosmobilebanking',
    // 'wise',
    // 'skrill',
  ];

  function backHandlerButton() {
    if (isTwoClick) {
      navigation.goBack();
      return;
    }
    setTwoClick(true);
    webViewRef.current.goBack();
    setTimeout(() => {
      setTwoClick(false);
    }, 1000);
  }

  const checkLinkInArray = (link, array) => {
    for (let i = 0; i < array.length; i++) {
      if (link.includes(array[i])) {
        return true;
      }
    }
    return false;
  };

  const openURLInBrowser = async url => {
    await Linking.openURL(url);
  };

  const socialLinks = [
      'https://m.facebook.com/',
      'https://www.facebook.com/',
      'https://www.instagram.com/',
      'https://twitter.com/',
      'https://www.whatsapp.com/',
      'https://t.me/',
      'https://x.com/',
      'fb://',
  ];
  console.log(linkRefresh);
    if (checkLinkInArray(linkRefresh, socialLinks)) {
        Linking.openURL(linkRefresh);
        navigation.goBack();
    }

  const onShouldStartLoadWithRequest = event => {
    if (checkLinkInArray(event.url, openInBrowser)) {
      try {
        openURLInBrowser(event.url);
      } catch (error) {
        Alert.alert(
          'Ooops',
          "It seems you don't have the bank app installed, wait for a redirect to the payment page",
        );
      }
      return false;
    }

    if (checkLinkInArray(event.mainDocumentURL, redirectDomens)) {
      navigation.navigate('main');
      return false;
    }
    return true;
  };

  return (
    <View style={{flex: 1}}>
      <SafeAreaView style={{flex: 1, backgroundColor: 'black'}}>
        <StatusBar barStyle={'light-content'} />
        <WebView
          originWhitelist={[
            '*',
            'http://*',
            'https://*',
            'intent://*',
            'tel:*',
            'mailto:*',
            'itms-appss://*',
            'https://m.facebook.com/*',
            'https://www.facebook.com/*',
            'https://www.instagram.com/*',
            'https://twitter.com/*',
            'https://x.com/*',
            'https://www.whatsapp.com/*',
            'https://t.me/*',
            'fb://*',
          ]}
          source={{uri: linkRefresh}}
          textZoom={100}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          allowsBackForwardNavigationGestures={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          onError={syntEvent => {
            const {nativeEvent} = syntEvent;
            const {code} = nativeEvent;
            if (code === -1101) {
              navigation.goBack();
            }
            if (code === -1002) {
              Alert.alert(
                'Ooops',
                "It seems you don't have the bank app installed, wait for a redirect to the payment page",
              );
              navigation.goBack();
            }
          }}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          allowFileAccess={true}
          showsVerticalScrollIndicator={false}
          javaScriptCanOpenWindowsAutomatically={true}
          style={{flex: 1}}
          ref={webViewRef}
          userAgent={
            userAgent
          }
        />
      </SafeAreaView>
      <TouchableOpacity
        style={{
          width: 30,
          height: 30,
          position: 'absolute',
          bottom: 0,
          left: 25,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={() => {
          backHandlerButton();
        }}>
        <Image
          source={require('./assets/images/_back.png')}
          style={{width: 20, height: 20, resizeMode: 'contain'}}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          width: 30,
          height: 30,
          position: 'absolute',
          bottom: 5,
          right: 25,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 5,
        }}
        onPress={() => {
          webViewRef.current.reload();
        }}>
        <Image
          source={require('./assets/images/_reload.png')}
          style={{width: '90%', height: '90%', resizeMode: 'contain'}}
        />
      </TouchableOpacity>
    </View>
  );
}
