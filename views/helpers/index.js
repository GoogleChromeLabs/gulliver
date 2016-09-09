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
const moment = require('moment');

exports.contrastColor = function(hexcolor) {
  if (!hexcolor) {
    return 'white';
  }

  if (hexcolor[0] === '#') {
    hexcolor = hexcolor.substr(1, hexcolor.length);
  }
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
};

exports.firstLetter = function(text) {
  return (text ? text[0] : '').toUpperCase();
};

exports.moment = function(date) {
  return moment(date).fromNow();
};

exports.prettyJson = function(object) {
  return JSON.stringify(object, null, 4);
};

exports.registerHelpers = function(hbs) {
  hbs.registerHelper('firstLetter', exports.firstLetter);
  hbs.registerHelper('contrastColor', exports.contrastColor);
  hbs.registerHelper('moment', exports.moment);
  hbs.registerHelper('prettyJson', exports.prettyJson);
};
