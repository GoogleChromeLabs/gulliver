/**
 * copyright 2015-2016, google, inc.
 * licensed under the apache license, version 2.0 (the "license");
 * you may not use this file except in compliance with the license.
 * you may obtain a copy of the license at
 *
 *    http://www.apache.org/licenses/license-2.0
 *
 * unless required by applicable law or agreed to in writing, software
 * distributed under the license is distributed on an "as is" basis,
 * without warranties or conditions of any kind, either express or implied.
 * see the license for the specific language governing permissions and
 * limitations under the license.
 */

/* eslint-env browser */

/**
 * A CSS only loader showing three dots.
 */
class Loader {

  /**
   * Create a new loader.
   *
   * @param container {HTMLElement} the element containing the loader.
   */
  constructor(container) {
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
      setTimeout(() => loader.remove(), 500);
    }
  }
}

// HACK: attach loader class to window object so that chart.js (which is not
// managed by rollup) can use the loader.
window.Loader = Loader;
export default Loader;
