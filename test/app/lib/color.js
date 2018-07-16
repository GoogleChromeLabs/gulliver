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

const assert = require('chai').assert;
const color = require('../../../lib/color');

describe('color.js', () => {
  describe('contrastRatio', () => {
    it('Calculates correct ratio for #000000', () => {
      const ratio = color.contrastRatio('#000000');
      assert.equal(ratio, 21);
    });

    it('Calculates correct ratio for #000000 / #FFFFFF', () => {
      const ratio = color.contrastRatio('#000000', '#FFFFFF');
      assert.equal(ratio, 21);
    });

    it('Calculates correct ratio for #FFFFFF / #000000', () => {
      const ratio = color.contrastRatio('#FFFFFF', '#000000');
      assert.equal(ratio, 21);
    });

    it('Calculates correct ratio for #FFFFFF / #FFFFFF', () => {
      const ratio = color.contrastRatio('#FFFFFF', '#FFFFFF');
      assert.equal(ratio, 1);
    });
  });

  describe('bestContrastRatio', () => {
    it('Selects best contrast between #000000 and #FFFFFF agains #000000', () => {
      const bestContrast = color.bestContrastRatio('#000000', '#FFFFFF', '#000000');
      assert.equal(bestContrast, '#FFFFFF');
    });

    it('Selects best contrast between #000000 and #FFFFFF agains black', () => {
      const bestContrast = color.bestContrastRatio('#000000', '#FFFFFF', 'black');
      assert.equal(bestContrast, '#FFFFFF');
    });
  });

  describe('relativeLuminance', () => {
    it('Calculates correct luminance for #FFFFFF', () => {
      const luminance = color.relativeLuminance('#FFFFFF');
      assert.equal(luminance, 1);
    });

    it('Calculates correct luminance for #000000', () => {
      const luminance = color.relativeLuminance('#000000');
      assert.equal(luminance, 0);
    });

    it('Calculates correct luminance for "#000000 "', () => {
      const luminance = color.relativeLuminance('#000000 ');
      assert.equal(luminance, 0);
    });

    it('Calculates correct luminance for "black"', () => {
      const luminance = color.relativeLuminance('black');
      assert.equal(luminance, 0);
    });
  });
});
