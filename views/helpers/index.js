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

const moment = require('moment');
const parseColor = require('parse-color');

function contrastColor(hexcolor) {
  if (!hexcolor) {
    return DEFAULT_LIGHT;
  }

  // Assume that a 6 digit string is a color.
  if (hexcolor.length === 6 && hexcolor[0] !== '#') {
    hexcolor = '#' + hexcolor;
  }

  const parsedColor = parseColor(hexcolor);
  const r = parsedColor.rgb[0];
  const g = parsedColor.rgb[1];
  const b = parsedColor.rgb[2];

  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? DEFAULT_DARK : DEFAULT_LIGHT;
}

exports.contrastColor = contrastColor;

exports.firstLetter = function(text) {
  return (text ? text[0] : '').toUpperCase();
};

exports.moment = function(date) {
  return moment(date).fromNow();
};

exports.themeFragment = function(pwa) {
  return 't=' + encodeURIComponent(pwa.name) +
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

exports.getAggregationTableRow = function(aggregation) {
  return '<tr>' +
    '<td>' + aggregation.name + '</td>' +
    '<td>' + aggregation.overall + '</td>' +
    '</tr>';
};

exports.getAuditTableRow = function(audit) {
  return '<tr>' +
    '<td>' + audit.description + '</td>' +
    '<td>' + audit.score + '</td>' +
    '</tr>';
};

exports.registerHelpers = function(hbs) {
  hbs.registerHelper('firstLetter', exports.firstLetter);
  hbs.registerHelper('contrastColor', exports.contrastColor);
  hbs.registerHelper('themeFragment', exports.themeFragment);
  hbs.registerHelper('moment', exports.moment);
  hbs.registerHelper('prettyJson', exports.prettyJson);
  hbs.registerHelper('highlightedJson', exports.highlightedJson);
  hbs.registerHelper('getAggregationTableRow', exports.getAggregationTableRow);
  hbs.registerHelper('getAuditTableRow', exports.getAuditTableRow);
};
