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
import Loader from '../loader';

export class FadeInOutTransitionStrategy {
  transitionIn(container) {
    console.log('Transition In');
    container.classList.remove('transition');
  }

  transitionOut(container) {
    console.log('Transition Out');
    container.classList.add('transition');
  }
}

export class LoaderTransitionStrategy {
  constructor(window) {
    this._window = window;
    const loaderDiv = window.document.querySelector('.page-loader');
    this._loader = new Loader(loaderDiv);
  }

  transitionIn(container) {
    console.log('Transition In');
    container.classList.remove('transition');
    this._loader.hide();
  }

  transitionOut(container) {
    console.log('Transition Out');
    container.classList.add('transition');
    this._loader.show();
  }
}
