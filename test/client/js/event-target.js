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

/* global describe it before afterEach */
'use strict';
import EventTarget from '../../../public/js/event-target';
const assert = require('assert');
const simpleMock = require('simple-mock');

describe('js.event-target', () => {
  let eventTarget;
  const callbackA = simpleMock.spy(() => {});

  before(() => {
    eventTarget = new EventTarget();
  });

  afterEach(() => {
    simpleMock.restore();
    callbackA.reset();
  });

  it('Fires the correct callback', done => {
    eventTarget.addEventListener('event-a', callbackA);
    eventTarget.dispatchEvent({type: 'event-a'});
    setTimeout(() => {
      assert.equal(callbackA.callCount, 1);
      done();
    }, 10);
  });

  it('Does not invoke a removed callback', done => {
    eventTarget.addEventListener('event-a', callbackA);
    eventTarget.removeEventListener('event-a', callbackA);
    eventTarget.dispatchEvent({type: 'event-a'});
    setTimeout(() => {
      assert.equal(callbackA.callCount, 0);
      done();
    }, 10);
  });
});
