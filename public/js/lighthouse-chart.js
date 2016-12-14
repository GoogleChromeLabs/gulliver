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

/**
 * Use to make the API request to get the Lighthouse chart data for a PWA.
 */
const CHART_BASE_URL = '/api/lighthouse/graph/';

class LighthouseChart {

  constructor() {
    this.chartElement = document.getElementById('chart');
    this.loader = new window.Loader(this.chartElement, 'dark-primary-background');
  }

  load() {
    this.loader.show();
    google.charts.load('current', {packages: ['annotationchart']});
    google.charts.setOnLoadCallback(this.drawChart.bind(this));
  }

  drawChart() {
    const pwaId = this.chartElement.getAttribute('pwa');
    if (!pwaId) {
      return;
    }
    const pagewith = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    fetch(CHART_BASE_URL + pwaId)
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

new LighthouseChart().load();
