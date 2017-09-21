/**
 * Copyright 2015-2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-env browser */

import 'whatwg-fetch/fetch'; // Imports `fetch` polyfill
import firebase from 'firebase/app';
import 'firebase/messaging';

const SUBSCRIBE_ENDPOINT = '/api/notifications/subscribe';
const UNSUBSCRIBE_ENDPOINT = '/api/notifications/unsubscribe';
const TOPICS_ENDPOINT = '/api/notifications/topics';

const ERROR_PERMISSION_BLOCKED = 'messaging/permission-blocked';
const ERROR_NOTIFICATIONS_BLOCKED = 'messaging/notifications-blocked';
// const ERROR_PERMISSION_DEFAULT = 'messaging/permission-default';

export default class Messaging {
  constructor(messagingSenderId) {
    const config = {
      messagingSenderId: messagingSenderId
    };
    firebase.initializeApp(config);
  }

  /**
   * Fetches from url, adding token to the request body
   * as a JSON
   *
   * @param url - the url to fetch from
   * @param token - the token to be sent to the server
   */
  _postWithToken(url, token) {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({token: token})
    });
  }

  _checkBlockedNotification(err) {
    return err.code === ERROR_PERMISSION_BLOCKED ||
            err.code === ERROR_NOTIFICATIONS_BLOCKED;
  }
  /**
   * Enables Notifications to a topic.
   * Will ask user permission, if needed and then subscribe
   * to a topic on the server.
   *
   * @param topic - The topic to subscribe to
   * @returns a Promise
   */
  subscribe(topic) {
    console.log('Subscribing to: ' + topic);
    const messaging = firebase.messaging();
    return messaging.requestPermission()
      .then(() => {
        return messaging.getToken();
      })
      .then(token => {
        console.log(token);
        const url = SUBSCRIBE_ENDPOINT + '/' + topic;
        return this._postWithToken(url, token);
      })
      .catch(err => {
        if (this._checkBlockedNotification(err)) {
          err.blocked = true;
        }
        return Promise.reject(err);
      });
  }

  /**
   * Disables Notifications from a topic.
   *
   * @param topic - The topic to unsubscribe from.
   * @returns Promise
   */
  unsubscribe(topic) {
    console.log('Unsubscribing from: ' + topic);
    const messaging = firebase.messaging();
    return messaging.getToken()
      .then(token => {
        const url = UNSUBSCRIBE_ENDPOINT + '/' + topic;
        return this._postWithToken(url, token);
      }).catch(err => {
        if (this._checkBlockedNotification(err)) {
          err.blocked = true;
        }
        return Promise.reject(err);
      });
  }

  /**
   * Gets all topics user has subscribed for
   *
   * @returns Promise<Array<String>>
   */
  getSubscriptions() {
    const messaging = firebase.messaging();
    return messaging.getToken()
      .then(token => {
        if (!token) {
          return Promise.resolve([]);
        }
        const url = TOPICS_ENDPOINT + '?token=' + token;
        return fetch(url, {headers: {Accept: 'application/json'}})
          .then(response => {
            if (response.status !== 200) {
              return [];
            }
            return response.json()
              .then(json => {
                return json.subscriptions;
              });
          });
      })
      .catch(err => {
        console.error('Error fetching subscriptions: ', err);
        return Promise.resolve([]);
      });
  }

  /**
   * Checks if user is subscribed to a topic.
   * @param topic - The topic to check for subscriptions.
   * @returns Promise<Boolean> - true if subscribed, false if not.
   */
  isSubscribed(topic) {
    return this.getSubscriptions()
      .then(subscriptions => {
        return subscriptions.indexOf(topic) >= 0;
      });
  }

  isNotificationBlocked() {
    const messaging = firebase.messaging();
    return messaging.getToken()
      .then(_ => {
        return false;
      })
      .catch(err => {
        if (err.code === ERROR_NOTIFICATIONS_BLOCKED) {
          return true;
        }
        return Promise.reject(err);
      });
  }
}
