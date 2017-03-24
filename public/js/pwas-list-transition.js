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

/* eslint-env browser */

const url = new URL(window.location);
const pageId = url.searchParams.get('sort') || 'score';

// update active tab
const element = document.getElementById(pageId);
if (element) {
  console.log('updating active class ' + pageId + ' ' + element.className);
  element.className += ' activetab';
}

// show loader
const items = document.getElementsByClassName('items');
for (let item of items) {
  item.innerHTML = '';
  item.style.height = '50vh';
  new window.Loader(item, 'dark-primary-background').show();
  item.classList.add('fadeIn');
}

