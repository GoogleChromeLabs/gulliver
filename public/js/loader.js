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

const FADE_OUT_ANIMATION_LENGTH = 500;

/**
 * A CSS only loader showing three dots.
 */
class Loader {

  /**
   * Create a new loader.
   *
   * @param container {HTMLElement} the element containing the loader
   * @param style {String} optional hex color or css class for styling the loader
   */
  constructor(container, style) {
    this.style = style || '';
    this.container = container;
  }

  /**
   * addLoader adds a CSS loader to the given element.
   *
   * @param container {HTMLElement} the element containing the loader.
   */
  show() {
    const loader = document.createElement('div');
    loader.style['align-items'] = 'center';
    loader.classList.add('loader');
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.classList.add('loader-dot');
      if (this.style.startsWith('#')) {
        dot.style['background-color'] = this.style;
      } else {
        dot.classList.add(this.style);
      }
      loader.appendChild(dot);
    }
    this.container.appendChild(loader);
  }

  /**
   * removeLoader removes a CSS loader from the given element.
   *
   * @param container {HTMLElement} the element containing the loader.
   */
  hide() {
    const loaders = this.container.getElementsByClassName('loader');
    for (let loader of loaders) {
      loader.classList.add('fadeOut');
      window.requestIdleCallback(() => loader.remove(), FADE_OUT_ANIMATION_LENGTH);
    }
  }

}

// HACK: attach loader class to window object so that chart.js (which is not
// managed by rollup) can use the loader.
window.Loader = Loader;
export default Loader;
