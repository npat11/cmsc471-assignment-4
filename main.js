var dataset = [];
var metric = 'GDP Growth (annual %)';
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

var metricMap = {
    "GDP Growth (annual %)": "GDP growth(annual %)",
    "Health Expenditure % of GDP": "health expenditure % of GDP",
    "Education Expenditure % of GDP": "education expenditure % of GDP",
    "Unemployment (%)": "unemployment (%)",
    "% of Seats Held by Women in National Parliaments": "% of seats held by women in national parliaments",
    "Military Spending as % of GDP": "Military Spending as % of GDP"
};

d3.csv("Filtered2.csv").then(function(data) {
  if (!data || data.length === 0) {
      console.error("No data loaded from CSV.");
      return;
  }
  console.log("Raw Data:", data);

  const cleanedData = data.map(row => {
    const cleanedRow = {};
    Object.keys(row).forEach(key => {
      const cleanedKey = key.replace(/[\n\r]+/g, '').trim();
      cleanedRow[cleanedKey] = row[key];
    });
    return cleanedRow;
  });

  console.log("Cleaned Dataset Headers:", cleanedData[0]);

  dataset = cleanedData;

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
      console.log("Mapped column name:", metricMap[metric]);
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
  var mappedMetric = metricMap[metric];
  var columnName = `${mappedMetric} ${year}`;

  var validColumns = Object.keys(dataset[0]);
  if (!validColumns.includes(columnName)) {
    console.error("Column not found:", columnName);
    return;
  }

  var selectedData = dataset.map(function(row) {
      const value = row[columnName];
      return {
          country: row['indicator'],
          value: value ? parseFloat(value) : NaN,
      };
  });

  var filteredData = selectedData.filter(d => !isNaN(d.value));

  var xDomain = d3.extent(filteredData, d => d.value);
  var xScale = d3.scaleLinear()
    .domain([Math.min(0, xDomain[0]), Math.max(0, xDomain[1])])
    .range([0, chartWidth]);

  var yScale = d3.scaleBand()
    .domain(filteredData.map(d => d.country))
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
    .data(filteredData, d => d.country);

  bars.exit().remove();
  var barsEnter = bars.enter().append('rect')
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

  var labels = chartG.selectAll('.label')
    .data(filteredData, d => d.country);

  labels.exit().remove();
  labels.enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => xScale(d.value) + 5) 
    .attr('y', d => yScale(d.country) + yScale.bandwidth() / 2)
    .attr('dy', '.35em')
    .text(d => d.value.toFixed(1))
    .merge(labels)
    .transition()
    .duration(750)
    .attr('x', d => xScale(d.value) + 5)
    .attr('y', d => yScale(d.country) + yScale.bandwidth() / 2)
    .text(d => d.value.toFixed(1));

  title.text(`Year: ${year}`);
}
