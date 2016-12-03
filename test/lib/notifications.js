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

/* global describe it afterEach */

const dataFetcher = require('../../lib/data-fetcher');
const simpleMock = require('simple-mock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const assert = require('chai').assert;
chai.use(chaiAsPromised);
chai.should();
const notificationsLib = require('../../lib/notifications');

describe('lib.notifications', () => {
  describe('#list', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    it('Should reject if token is empty', () => {
      return notificationsLib.list().should.be.rejectedWith(Error);
    });

    it('Should reject if fetch fails', () => {
      simpleMock.mock(dataFetcher, 'firebaseFetch')
        .rejectWith(new Error());
      return notificationsLib.list('123').should.be.rejectedWith(Error);
    });

    it('Should return an ampty list of topics', () => {
      const emptyListResponse =
          JSON.parse('{"connectDate":"2016-12-02","application":"wp:http://localhost:3' +
          '000/#EE89C825-C62B-4683-9336-454325D121A9","authorizedEntity":"653391209629","connect' +
          'ionType":"WIFI","platform":"WEBPUSH"}');
      simpleMock.mock(dataFetcher, 'firebaseFetch')
        .resolveWith(emptyListResponse);
      return notificationsLib.list('123').should.be.fulfilled
        .then(topicList => {
          assert.equal(topicList.length, 0, 'Topic List is empty');
        });
    });

    it('Should return the correct list of topics', () => {
      const successTemplate = JSON.parse('{"connectDate":"2016-12-01","application":"wp:http://' +
      'localhost:3000/#6E162DF4-1899-418F-BC1C-F04A5A4E387B","authorizedEntity":"653391209629",' +
      '"rel":{"topics":{"test2":{"addDate":"2016-12-01"},"test":{"addDate":"2016-12-01"}}},"conn' +
      'ectionType":"WIFI","platform":"WEBPUSH"}');
      simpleMock.mock(dataFetcher, 'firebaseFetch')
        .resolveWith(successTemplate);
      return notificationsLib.list('123').should.be.fulfilled
        .then(topicList => {
          assert.equal(topicList.length, 2, 'Returns correct number of topics');
          assert(topicList.indexOf('test') >= 0, 'Contains "test" topic');
          assert(topicList.indexOf('test2') >= 0, 'Contains "test2" topic');
        });
    });
  });

  describe('#subscribe', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    it('Should reject if token is empty', () => {
      return notificationsLib.subscribe().should.be.rejectedWith(Error);
    });

    it('Should reject if topic is empty', () => {
      return notificationsLib.subscribe('123').should.be.rejectedWith(Error);
    });

    it('Should reject if datafetcher fails', () => {
      simpleMock.mock(dataFetcher, 'firebaseFetch')
        .rejectWith(new Error());
      return notificationsLib.subscribe('123', 'test').should.be.rejectedWith(Error);
    });

    it('Should resolve if datafetch succeeds', () => {
      simpleMock.mock(dataFetcher, 'firebaseFetch')
        .resolveWith(true);
      return notificationsLib.subscribe('123', 'test').should.be.fulfilled;
    });
  });

  describe('#unsubscribe', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    it('Should reject if token is empty', () => {
      return notificationsLib.unsubscribe().should.be.rejectedWith(Error);
    });

    it('Should reject if topic is empty', () => {
      return notificationsLib.unsubscribe('123').should.be.rejectedWith(Error);
    });

    it('Should reject if datafetcher fails', () => {
      simpleMock.mock(dataFetcher, 'firebaseFetch').rejectWith(new Error());
      return notificationsLib.unsubscribe('123', 'test').should.be.rejectedWith(Error);
    });

    it('Should resolve if datafetch succeeds', () => {
      simpleMock.mock(dataFetcher, 'firebaseFetch').resolveWith(true);
      return notificationsLib.unsubscribe('123', 'test').should.be.fulfilled;
    });
  });

  describe('#sendPush', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    it('Should reject if topic is empty', () => {
      return notificationsLib.sendPush(null, {title: 'Test'}).should.be.rejectedWith(Error);
    });

    it('Should reject if notification is empty', () => {
      return notificationsLib.sendPush('test').should.be.rejectedWith(Error);
    });

    it('Should reject if missing title', () => {
      return notificationsLib.sendPush('test', {}).should.be.rejectedWith(Error);
    });

    it('Should reject if datafetcher fails', () => {
      simpleMock.mock(dataFetcher, 'firebaseFetch').rejectWith(new Error());
      return notificationsLib.sendPush('test', {title: 'Test Title'}).should.be.rejectedWith(Error);
    });

    it('Should resolve if datafetcher succeeds', () => {
      simpleMock.mock(dataFetcher, 'firebaseFetch').resolveWith(true);
      return notificationsLib.sendPush('test', {title: 'Test Title'}).should.be.fullfilled;
    });
  });
});
