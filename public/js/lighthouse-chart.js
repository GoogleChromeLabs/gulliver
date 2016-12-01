/* global google */
/* eslint-env browser */

/**
 * Use to make the API request to get the Lighthouse chart data for a PWA.
 */
const CHART_ELEMENT_ID = 'chart';
const CHART_BASE_URL = '/api/lighthouse/graph/';

function drawChart() {
  const chartDiv = document.getElementById(CHART_ELEMENT_ID);
  const pwaId = chartDiv.getAttribute('pwa');
  if (pwaId) {
    fetch(CHART_BASE_URL + pwaId)
      .then(response => response.json())
      .then(jsonData => {
        // Create our data table out of JSON data loaded from server.
        const data = new google.visualization.DataTable(jsonData);
        const chart = new google.visualization.AnnotationChart(
          document.getElementById(CHART_ELEMENT_ID));
        const options = {
          height: 242,
          displayAnnotations: false,
          displayRangeSelector: false,
          legendPosition: 'newRow',
          thickness: 2,
          min: 0,
          max: 100
        };
        chart.draw(data, options);
      })
      .catch(err => {
        console.error('There was an error drawing the chart!', err);
      });
  }
}

if (document.getElementById(CHART_ELEMENT_ID)) {
  google.charts.load('current', {packages: ['annotationchart']});
  google.charts.setOnLoadCallback(drawChart);
}
