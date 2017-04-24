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

export default class EventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, callback) {
    let typeListeners = this.listeners.get(type);
    if (!typeListeners) {
      typeListeners = new Set();
      this.listeners.set(type, typeListeners);
    }
    typeListeners.add(callback);
  }

  removeEventListener(type, callback) {
    const typeListeners = this.listeners.get(type);
    if (!typeListeners) {
      return;
    }
    typeListeners.delete(callback);
  }

  dispatchEvent(event) {
    if (!event.type) {
      return;
    }

    const typeListeners = this.listeners.get(event.type);
    if (!typeListeners) {
      return;
    }

    typeListeners.forEach(callback => callback(event));
  }
}
