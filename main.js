var dataset = [];
var metric = 'GDP growth(annual %)';
var country = 'Argentina'; 
var year = 2015;
var playing = false;
var yearRange = [2015, 2018];
var intervalId = null;
var svg = d3.select('svg');
var padding = { t: 30, r: 30, b: 40, l: 120 };
var chartWidth = +svg.attr('width') - padding.l - padding.r;
var chartHeight = +svg.attr('height') - padding.t - padding.b;

var chartG = svg.append('g')
  .attr('transform', 'translate(' + [padding.l, padding.t] + ')');

var title = svg.append('text')
  .attr('class', 'title')
  .attr('x', (chartWidth + padding.l + padding.r) / 2) 
  .attr('y', padding.t / 2)
  .attr('text-anchor', 'middle')
  .text(`Year: ${year}`);

d3.csv("Filtered2.csv").then(function(data) {
  if (!data || data.length === 0) {
      console.error("No data loaded from CSV.");
      return;
  }
  console.log("Raw Data:", data);
  var cleanedHeaders = Object.keys(data[0]).map(key => key.replace(/[\n\r]+/g, '').trim());
  console.log("Cleaned Headers:", cleanedHeaders);
  data.forEach(function(row) {
      Object.keys(row).forEach(function(key) {
          var cleanedKey = key.replace(/[\n\r]+/g, '').trim();
          row[cleanedKey] = row[key];
      });
  });
  dataset = data;
  console.log("Normalized Dataset:", dataset);

  updateChart(dataset);

  d3.select('#playButton').on('click', startAnimation);
  d3.select('#stopButton').on('click', stopAnimation);
  d3.select('#yScaleSelect').on('change', function() {
      country = this.value; 
      console.log("New baseline country selected:", country);
      updateChart(dataset);
  });
  d3.select('#xScaleSelect').on('change', function() {
      metric = this.value;
      console.log("New metric selected:", metric);
      updateChart(dataset);
  });
});

function startAnimation() {
  if (playing) return;
  playing = true;
  intervalId = setInterval(function() {
      year++;
      if (year > yearRange[1]) {
          year = yearRange[0];
      }
      console.log("Current year:", year);
      updateChart(dataset);
  }, 1000);
}

function stopAnimation() {
  playing = false;
  clearInterval(intervalId);
}

function updateChart(dataset) {
  var columnName = `${metric} ${year}`;
  console.log("Looking for column:", columnName);
  var validColumns = Object.keys(dataset[0]);
  console.log("Valid columns:", validColumns);

  if (!validColumns.includes(columnName)) {
      console.error("Column not found:", columnName);
      console.error("Available Columns:", validColumns);
      return;
  }

  var selectedData = dataset.map(function(row) {
      var value = row[columnName];
      console.log(`Processing ${row['indicator']} with value:`, value);
      return {
          country: row['indicator'],
          value: value ? parseFloat(value) : NaN,
      };
  });

  console.log('Filtered data after selection:', selectedData);

  var filteredData = selectedData.filter(function(d) {
      return !isNaN(d.value);
  });

  if (filteredData.length === 0) {
      console.error('No valid data to plot.');
      return;
  }

  var xDomain = d3.extent(filteredData, function(d) { return d.value; });
  console.log("xDomain:", xDomain);

  var xScale = d3.scaleLinear()
      .domain([Math.min(0, xDomain[0]), Math.max(0, xDomain[1])])
      .range([0, chartWidth]);

  var yScale = d3.scaleBand()
      .domain(filteredData.map(function(d) { return d.country; }))
      .range([0, chartHeight])
      .padding(0.1);

  chartG.select('.x-axis').remove();
  chartG.append('g')
      .attr('class', 'x-axis')
      .attr('transform', 'translate(0,' + chartHeight + ')')
      .call(d3.axisBottom(xScale));

  chartG.select('.y-axis').remove();
  chartG.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale));

  var bars = chartG.selectAll('.bar')
      .data(filteredData, function(d) { return d.country; });

  bars.exit().remove();
  bars.enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(Math.min(0, d.value)))
      .attr('y', d => yScale(d.country))
      .attr('height', yScale.bandwidth())
      .merge(bars)
      .transition()
      .duration(750)
      .attr('x', d => xScale(Math.min(0, d.value)))
      .attr('width', d => Math.abs(xScale(d.value) - xScale(0)))
      .attr('fill', d => d.country === country ? 'steelblue' : 'lightgrey'); 

  title.text(`Year: ${year}`);
}
