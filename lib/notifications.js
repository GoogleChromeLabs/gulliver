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

'use strict';

const dataFetcher = require('../lib/data-fetcher');

exports.list = function(token) {
  if (!token) {
    return Promise.reject(new Error('Missing token'));
  }

  const url = 'https://iid.googleapis.com/iid/info/' + token + '?details=true';
  return dataFetcher.firebaseFetch(url)
    .then(userDetails => {
      if (!userDetails || !userDetails.rel || !userDetails.rel.topics) {
        return Promise.resolve([]);
      }
      return Object.keys(userDetails.rel.topics);
    });
};

exports.subscribe = function(token, topic) {
  if (!token) {
    return Promise.reject(new Error('Missing token'));
  }

  if (!topic) {
    return Promise.reject(new Error('Missing topic'));
  }

  const url = 'https://iid.googleapis.com/iid/v1:batchAdd';
  const payload = {
    to: '/topics/' + topic,
    registration_tokens: [token] // eslint-disable-line camelcase
  };
  return dataFetcher.firebaseFetch(url, payload);
};

exports.unsubscribe = function(token, topic) {
  if (!token) {
    return Promise.reject(new Error('Missing token'));
  }

  if (!topic) {
    return Promise.reject(new Error('Missing topic'));
  }

  const url = 'https://iid.googleapis.com/iid/v1:batchRemove';
  const payload = {
    to: '/topics/' + topic,
    registration_tokens: [token] // eslint-disable-line camelcase
  };
  return dataFetcher.firebaseFetch(url, payload);
};

exports.sendPush = function(topic, notification) {
  console.log(notification);
  if (!topic) {
    return Promise.reject(new Error('Missing topic'));
  }

  if (!notification) {
    return Promise.reject(new Error('Missing notification'));
  }

  // Require the notification to have a title, at minimum
  if (!notification.title) {
    return Promise.reject(new Error('Missing notification title'));
  }
  const url = 'https://fcm.googleapis.com/fcm/send';
  const payload = {
    to: '/topics/' + topic,
    notification: notification
  };
  return dataFetcher.firebaseFetch(url, payload);
};
