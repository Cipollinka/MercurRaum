import * as Params from './Params';
export default class EventManager {
  static eventList = {
    firstOpen: 'uniq_visit',
    push: 'push_subscribe',
    web: 'webview_open',
    web_push: 'push_open_webview',
    browser: 'push_open_browser',
  };

  static sendEvent(userID, eventName) {
    fetch(
        `${Params.bodyLin}?event=${eventName}&timestamp=` + userID,
    );
    console.log('SEND_EVENT:', eventName + ' | ' + userID);
  }
}
