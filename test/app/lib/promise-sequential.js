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

const promiseSequential = require('../../../lib/promise-sequential');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
const assert = require('chai').assert;

describe('lib.promise-sequential', () => {
  describe('#all', () => {
    it('executes all functions on the list', () => {
      const promiseFunctions = [
        _ => 1,
        result => result + 1,
        result => result + 2,
        result => result + 3
      ];
      return promiseSequential.all(promiseFunctions).should.be.fulfilled.then(result => {
        assert.equal(result, 7);
      });
    });
  });

  describe('#all', () => {
    it('executes all functions on the list without parameters', () => {
      function test(result) {
        result += 1;
        return result;
      }
      const promiseFunctions = [
        _ => (10),
        test,
        test,
        test,
        test
      ];
      return promiseSequential.all(promiseFunctions).should.be.fulfilled.then(result => {
        assert.equal(result, 14);
      });
    });
  });
});
