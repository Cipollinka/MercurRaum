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

import LoadingAppManager from './LoadingAppManager';

export default function AppManagerMain({navigation, route}) {
  const linkRefresh = route.params.data;
  const userAgent = route.params.userAgent + ' Safari/604.1';


  const webViewRef = useRef(null);

  const redirectDomens = [
    'https://spin.city/payment/success?identifier=',
    'https://jokabet.com/',
    'https://winspirit.app/?identifier=',
    'https://rocketplay.com/api/payments',
    'https://ninewin.com/',
  ];

  const domensForBlock = [
    'bitcoin',
    'litecoin',
    'dogecoin',
    'tether',
    'ethereum',
    'bitcoincash',
  ];

  const openInBrowser = [
    'mailto:',
    'itms-appss://',
    'fb://',
    'https://t.me/',
    'nl.abnamro.deeplink.psd2.consent://',
  ];

  const openURLInBrowser = async url => {
    await Linking.openURL(url);
    webViewRef.current.injectJavaScript(
        `window.location.replace('${linkRefresh}')`,
    );
  };

  const checkLinkInArray = (link, array) => {
    for (let i = 0; i < array.length; i++) {
      if (link.includes(array[i])) {
        return true;
      }
    }
    return false;
  };

  const [currentURL, setCurrentURL] = useState('');
  const checkURL = useRef('');

  function checkLockedURL(url) {
    setCurrentURL(url);
    setTimeout(() => {
      if (currentURL === 'about:blank') {
        webViewRef.current.injectJavaScript(
          `window.location.replace('${linkRefresh}')`,
        );
      }
    }, 2000);
  }

  const onShouldStartLoadWithRequest = event => {
    let currentUrl = event.url;
    console.log(currentUrl);
    try {
      if (event.url.includes('interac.express-connect.com') || event.url.includes('https://linx24.com/') || event.url.includes('https://bankieren.rabobank.nl/consent/jump-to/start?') || event.url.includes('api.payment-gateway.io/app/de/paymentPage')) {
        navigation.navigate('child', {data: event.url, userAgent: userAgent});
        webViewRef.current.injectJavaScript(
            `window.location.replace('${linkRefresh}')`,
        );
      }
    } catch (_) {}
    try {
      if (
        !(
          event.mainDocumentURL.includes('pay.skrill.com') ||
          event.mainDocumentURL.includes('app.corzapay.com') ||
          event.mainDocumentURL.includes(
            'https://checkout.payop.com/en/payment/invoice-preprocessing/',
          )
        )
      ) {
      } else {
        navigation.navigate('child', {data: event.mainDocumentURL, userAgent: userAgent});
      }
    } catch (error) {}

    if (checkLinkInArray(currentUrl, openInBrowser)) {
      webViewRef.current.stopLoading();
      openURLInBrowser(currentUrl);
    }

    if (checkLinkInArray(currentUrl, redirectDomens)) {
      webViewRef.current.injectJavaScript(
        `window.location.replace('${linkRefresh}')`,
      );
    }

    if (checkLinkInArray(currentUrl, domensForBlock)) {
      webViewRef.current.stopLoading();
      return false;
    }
    return true;
  };

  const stateChange = navState => {
    const currentUrl = navState.url;
    checkURL.current = currentUrl;
    checkLockedURL(currentUrl);
  };

  const [isDoubleClick, setDoubleClick] = useState(false);

  const isBackClick = () => {
    if (isDoubleClick) {
      webViewRef.current.injectJavaScript(
        `window.location.replace('${linkRefresh}')`,
      );
      return;
    }
    setDoubleClick(true);
    webViewRef.current.goBack();
    setTimeout(() => setDoubleClick(false), 400);
  };

  const [isInit, setInit] = React.useState(true);
  const [isLoadingPage, setLoadingPage] = useState(true);
  const [isInvisibleLoader, setInvisibleLoader] = useState(false);

  const finishLoading = () => {
    if (!isInit) {
      setInit(true);
    } else {
      setLoadingPage(false);
      setInvisibleLoader(true);
    }
  };

  const socialLinks = [
    'https://m.facebook.com/',
    'https://www.facebook.com/',
    'https://www.instagram.com/',
    'https://twitter.com/',
    'https://www.whatsapp.com/',
    'https://t.me/',
    'fb://',
    'https://x.com/',
  ]

  return (
    <>
      <View style={{flex: 1}}>
        <SafeAreaView style={{flex: 1, backgroundColor: 'black'}}>
          <StatusBar barStyle={'light-content'} />
          <WebView
            originWhitelist={[
              '*',
              'http://*',
              'https://*',
            ]}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onNavigationStateChange={stateChange}
            source={{uri: linkRefresh}}
            textZoom={100}
            allowsBackForwardNavigationGestures={true}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            onLoadStart={() => setLoadingPage(true)}
            onLoadEnd={() => finishLoading()}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            onError={syntEvent => {
              const {nativeEvent} = syntEvent;
              const {code} = nativeEvent;
              if (code === -1002) {
                Alert.alert(
                  'Ooops',
                  "It seems you don't have the bank app installed, wait for a redirect to the payment page",
                );
              }
            }}
            onOpenWindow={syntheticEvent => {
              const {nativeEvent} = syntheticEvent;
              const {targetUrl} = nativeEvent;
              // if (checkLinkInArray(targetUrl, socialLinks)) {
              //   console.log("ok")
              //   return false;
              // }
              if (targetUrl.includes('https://app.payment-gateway.io/static/loader.html')) {return;}

              if (targetUrl.includes('pay.funid.com')) {
                Linking.openURL(targetUrl);
                webViewRef.current.injectJavaScript(
                    `window.location.replace('${linkRefresh}')`,
                );
                return;
              }
              try {
                if (Linking.canOpenURL(targetUrl) || !checkLinkInArray(targetUrl, socialLinks)) {
                  navigation.navigate('child', {data: targetUrl, userAgent: userAgent});
                }
              } catch (error) {}
            }}
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
          onPress={isBackClick}>
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
            bottom: 0,
            right: 25,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 5,
          }}
          onPress={() => {
            webViewRef.current.reload();
            setLoadingPage(true);
          }}>
          <Image
            source={require('./assets/images/_reload.png')}
            style={{width: '90%', height: '90%', resizeMode: 'contain'}}
          />
        </TouchableOpacity>
      </View>
      {isLoadingPage && !isInvisibleLoader ? <LoadingAppManager /> : <></>}
    </>
  );
}
