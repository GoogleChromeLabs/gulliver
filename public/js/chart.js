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

/* global google */
/* eslint-env browser */
import Loader from './loader';

/**
 * Use to make the API request to get the Lighthouse chart data for a PWA.
 */
export default class Chart {

  constructor(config) {
    this.chartElement = config.chartElement;
    this.url = config.url;
    this.loader = new Loader(this.chartElement, 'dark-primary-background');
  }

  _loadChartsApi() {
    return new Promise((resolve, reject) => {
      const chartScript = document.getElementById('google-chart');
      if (chartScript) {
        if (window.google) {
          resolve(window.google);
        } else {
          chartScript.addEventListener('load', _ => resolve(window.google));
        }
      } else {
        const script = document.createElement('script');
        script.id = 'google-chart';
        script.defer = true;
        script.src = 'https://www.gstatic.com/charts/loader.js';
        script.onload = _ => resolve(window.google);
        script.onerror = reject;
        document.head.appendChild(script);
      }
    });
  }

  load() {
    this.loader.show();
    this._loadChartsApi().then(google => {
      google.charts.load('current', {packages: ['annotationchart']});
      google.charts.setOnLoadCallback(this.drawChart.bind(this));
    });
  }

  drawChart() {
    if (!this.url) {
      return;
    }
    const pagewith = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    fetch(this.url)
      .then(response => response.json())
      .then(jsonData => {
        // Create our data table out of JSON data loaded from server.
        const data = new google.visualization.DataTable(jsonData);
        const chart = new google.visualization.AnnotationChart(this.chartElement);
        const options = {
          height: 242,
          displayAnnotations: false,
          displayRangeSelector: false,
          displayZoomButtons: (pagewith > 420),
          legendPosition: 'newRow',
          thickness: 4,
          min: 0,
          max: 100
        };
        chart.draw(data, options);
        this.loader.hide();
      })
      .catch(err => {
        this.loader.hide();
        const missingChart = document.getElementById('chart-missing');
        missingChart.classList.add('fadeIn');
        console.error('There was an error drawing the chart!', err);
      });
  }
}
