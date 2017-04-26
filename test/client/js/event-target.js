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

/* global describe it */
'use strict';
import EventTarget from '../../../public/js/event-target';
const assert = require('assert');

describe('js.event-target', () => {
  describe('#addEventLister', () => {
    it('Add a single listener to a type', () => {
      const eventTarget = new EventTarget();
      const callback = () => {};
      eventTarget.addEventListener('type', callback);
      const eventListeners = eventTarget.getEventListeners('type');
      assert.notEqual(eventListeners, null);
      assert.equal(eventListeners.size, 1);
      assert.equal(eventListeners.has(callback), true);
    });

    it('Add a multiple listeners to same type', () => {
      const eventTarget = new EventTarget();
      const callbackA = () => {};
      const callbackB = () => {};
      eventTarget.addEventListener('type', callbackA);
      eventTarget.addEventListener('type', callbackB);

      const eventListeners = eventTarget.getEventListeners('type');
      assert.notEqual(eventListeners, null);
      assert.equal(eventListeners.size, 2);
      assert.equal(eventListeners.has(callbackA), true);
      assert.equal(eventListeners.has(callbackB), true);
    });

    it('Add same listener to multiple types', () => {
      const eventTarget = new EventTarget();
      const callback = () => {};
      eventTarget.addEventListener('type-1', callback);
      eventTarget.addEventListener('type-2', callback);
      const eventListeners1 = eventTarget.getEventListeners('type-1');
      assert.notEqual(eventListeners1, null);
      assert.equal(eventListeners1.size, 1);
      assert.equal(eventListeners1.has(callback), true);

      const eventListeners2 = eventTarget.getEventListeners('type-2');
      assert.notEqual(eventListeners2, null);
      assert.equal(eventListeners2.size, 1);
      assert.equal(eventListeners2.has(callback), true);
    });
  });

  describe('#removeEventLister', () => {
    it('Remove the only existing listener', () => {
      const callback = () => {};
      const eventTarget = new EventTarget();
      eventTarget.addEventListener('type', callback);
      const eventListeners = eventTarget.getEventListeners('type');
      eventTarget.removeEventListener('type', callback);
      assert.notEqual(eventListeners, null);
      assert.equal(eventListeners.size, 0);
    });

    it('Remove one of the listener from a type', () => {
      const eventTarget = new EventTarget();
      const callbackA = () => {};
      const callbackB = () => {};
      eventTarget.addEventListener('type', callbackA);
      eventTarget.addEventListener('type', callbackB);

      const eventListeners = eventTarget.getEventListeners('type');
      eventTarget.removeEventListener('type', callbackB);
      assert.notEqual(eventListeners, null);
      assert.equal(eventListeners.size, 1);
      assert.equal(eventListeners.has(callbackA), true);
      assert.equal(eventListeners.has(callbackB), false);
    });

    it('Remove callback from one of the types', () => {
      const eventTarget = new EventTarget();
      const callback = () => {};
      eventTarget.addEventListener('type-1', callback);
      eventTarget.addEventListener('type-2', callback);
      eventTarget.removeEventListener('type-2', callback);

      const eventListeners1 = eventTarget.getEventListeners('type-1');
      assert.notEqual(eventListeners1, null);
      assert.equal(eventListeners1.size, 1);
      assert.equal(eventListeners1.has(callback), true);

      const eventListeners2 = eventTarget.getEventListeners('type-2');
      assert.notEqual(eventListeners2, null);
      assert.equal(eventListeners2.size, 0);
      assert.equal(eventListeners2.has(callback), false);
    });
  });

  describe('#dispatchEvent', () => {
    // The below uses `function` instead of the arrow notation so that `this.timeout`
    // is available. More info here: https://mochajs.org/#arrow-functions
    it('Correctly dispatches the event', function(done) {
      const eventTarget = new EventTarget();
      const event = {
        type: 'test'
      };

      this.timeout(1000);
      eventTarget.addEventListener('test', e => {
        assert.equal(e, event);
        done();
      });
      eventTarget.dispatchEvent(event);
    });
  });
});
