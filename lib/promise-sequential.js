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

/** Execute a list of Promise return functions serially
 * @param {list} a list of promise returning functions to execute serially
 * @return {Promise<result>} the result of the last promise in the list
 *  Example:
 *    promiseSequential.all([
 *      _ => this.function1(result),
 *      result => this.function2(result),
 *      result => this.function3(result)
 *    ]);
 */
exports.all = function(list) {
  return list.reduce((promiseFn, fn) => {
    return promiseFn.then(fn);
  }, Promise.resolve());
};
