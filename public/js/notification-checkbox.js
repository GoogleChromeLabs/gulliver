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

export default class NotificationCheckbox {
  constructor(messaging, checkbox, topic) {
    if (!checkbox) {
      console.error('checkbox parameter cannot be null');
      return;
    }
    this.messaging = messaging;
    this.checkbox = checkbox;
    this.topic = topic;
    this._setupEventListener();

    // Initilize checkbox state.
    this.messaging.isNotificationBlocked()
      .then(blocked => {
        if (blocked) {
          checkbox.disabled = true;
          return;
        }

        this.messaging.isSubscribed(topic)
          .then(subscribed => {
            checkbox.checked = subscribed;
          });
      });
  }

  _setupEventListener() {
    this.checkbox.addEventListener('change', e => {
      if (e.target.checked) {
        this.messaging.subscribe(this.topic)
          .catch(e => {
            console.error('Error subscribing to topic: ', e);
            this.checkbox.checked = false;
            if (e.blocked) {
              this.checkbox.disabled = true;
            }
          });
        return;
      }
      this.messaging.unsubscribe(this.topic)
        .catch(err => {
          console.error('Error unsubscribing from topic: ', err);
          if (err.blocked) {
            this.checkbox.disabled = true;
            this.checkbox.checked = false;
            return;
          }
          this.checkbox.checked = true;
          return;
        });
    });
  }
}
