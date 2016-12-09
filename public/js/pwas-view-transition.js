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

function updateColors() {
  const url = new URL(window.location);
  const params = new URLSearchParams(url.hash.substring(1));

  const background = decodeURIComponent(params.get('bg')) || 'white';
  const color = decodeURIComponent(params.get('c')) || 'black';
  const title = decodeURIComponent(params.get('t')) || '';

  // set title
  const linkElement = document.getElementById('pwa-name');
  linkElement.innerHTML = title;
  linkElement.color = color;

  // update logo
  const pwaLogo = document.getElementById('pwa-logo-container');
  pwaLogo.innerHTML = '';
  pwaLogo.style.position = 'relative';
  new window.Loader(pwaLogo, color).show();

  // update color theme
  const pwaDetails = document.getElementById('pwa');
  pwaDetails.style['background-color'] = background;

  const pwaName = document.getElementById('pwa-name');
  pwaName.style.color = color;

  pwaDetails.classList.add('fadeIn');
}

updateColors();
