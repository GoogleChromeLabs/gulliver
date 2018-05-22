/**
 * Copyright 2015-2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
const DEFAULT_LIGHT = '#ffffff';
const DEFAULT_DARK = '#000000';

const escapeHtml = require('escape-html');
const moment = require('moment');
const {bestContrastRatio} = require('../../lib/color');
const assetHashing = require('../../lib/asset-hashing').asset;

function contrastColor(hexcolor) {
  if (!hexcolor) {
    return DEFAULT_DARK;
  }

  if (!hexcolor.match(/#[A-Fa-f0-9]{1,8}/)) {
    return DEFAULT_DARK;
  }

  return bestContrastRatio(DEFAULT_DARK, DEFAULT_LIGHT, hexcolor);
}

exports.contrastColor = contrastColor;

exports.firstLetter = function(text) {
  return (text ? text[0] : '').toUpperCase();
};

exports.moment = function(date) {
  return moment(date).fromNow();
};

exports.themeFragment = function(pwa) {
  return 't=' + encodeURIComponent(pwa.displayName) +
    '&bg=' + encodeURIComponent(pwa.backgroundColor) +
    '&c=' + encodeURIComponent(contrastColor(pwa.backgroundColor));
};

/*
  Light-weight helper function to generate
  highlighted JSON strings
*/
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  /* eslint-disable */
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
  /* eslint-enable */
    match => {
      let cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
}

exports.prettyJson = function(object) {
  return JSON.stringify(object, null, 4);
};

exports.highlightedJson = function(object) {
  return syntaxHighlight(JSON.stringify(object, null, 2));
};

exports.getReportCategoryTableRow = function(reportCategory) {
  return '<tr>' +
    '<th scope="col">' + escapeHtml(reportCategory.name) + '</th>' +
    '<th scope="col">' + Math.round(reportCategory.score) + '</th>' +
    '</tr>';
};

exports.getAuditTableRow = function(audit) {
  return '<tr>' +
    '<td>' + escapeHtml(audit.result.description) + '</td>' +
    '<td>' + audit.result.score + '</td>' +
    '</tr>';
};

exports.truncate = function(str, len) {
  if (str.length > len && str.length > 0) {
    let newStr = str + ' ';
    newStr = str.substr(0, len);
    newStr = str.substr(0, newStr.lastIndexOf(' '));
    newStr = (newStr.length > 0) ? newStr : str.substr(0, len);
    return newStr + '...';
  }
  return str;
};

exports.equals = function(p1, p2) {
  return p1 === p2;
};

exports.registerHelpers = function(hbs) {
  hbs.registerHelper('firstLetter', exports.firstLetter);
  hbs.registerHelper('contrastColor', exports.contrastColor);
  hbs.registerHelper('themeFragment', exports.themeFragment);
  hbs.registerHelper('moment', exports.moment);
  hbs.registerHelper('prettyJson', exports.prettyJson);
  hbs.registerHelper('highlightedJson', exports.highlightedJson);
  hbs.registerHelper('getReportCategoryTableRow', exports.getReportCategoryTableRow);
  hbs.registerHelper('getAuditTableRow', exports.getAuditTableRow);
  hbs.registerHelper('asset', assetPath => assetHashing.encode(assetPath));
  hbs.registerHelper('truncate', exports.truncate);
  hbs.registerHelper('equals', exports.equals);
};
