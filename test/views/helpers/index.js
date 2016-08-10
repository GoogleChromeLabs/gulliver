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

var assert = require('assert');
var helpers = require('../../../views/helpers');

describe('views.helpers', () => {
  describe('#contrastColor', () => {
    it('should return "white" when the value is not present', () => {
      assert.equal('white', helpers.contrastColor(null));
      assert.equal('white', helpers.contrastColor(''));
    });

    it('should return "black" when value is "#FFFFFFF"', () => {
      assert.equal('black', helpers.contrastColor('FFFFFF'));
      assert.equal('black', helpers.contrastColor('#FFFFFF'));
    });

    it('should return "white" when value is "#000000"', () => {
      assert.equal('white', helpers.contrastColor('000000'));
      assert.equal('white', helpers.contrastColor('#000000'));
    });
  });

  describe('#firstLetter', () => {
    it('should return an empty string when value is not present', () => {
      assert.equal('', helpers.firstLetter(null));
    });

    it('should return "G" for "Gulliver"', () => {
      assert.equal('G', helpers.firstLetter('Gulliver'));
    });

    it('should return "G" for "gulliver"', () => {
      assert.equal('G', helpers.firstLetter('gulliver'));
    });
  });
});
