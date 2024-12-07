var dataset = [];
var metric = 'GDP growth(annual %)';
var country = 'Argentina';
var year = 2015;
var playing = false;
var yearRange = [2015, 2018];
var intervalId = null; 

var svg = d3.select('svg'); 
var padding = { t: 30, r: 30, b: 40, l: 120 };  // Padding 

var chartWidth = +svg.attr('width') - padding.l - padding.r; 
var chartHeight = +svg.attr('height') - padding.t - padding.b;  

var chartG = svg.append('g')
    .attr('transform', 'translate(' + [padding.l, padding.t] + ')');

// Load
d3.csv("Filtered2.csv").then(function(data) {
    data.forEach(function(d) {
        Object.keys(d).forEach(function(key) {
            if (key.includes("GDP growth") || key.includes("Military Spending") || key.includes("education expenditure") || key.includes("health expenditure") || key.includes("% of seats") || key.includes("unemployment")) {
                let value = d[key];
                if (typeof value === 'string' && value.includes('%')) {
                    value = value.replace('%', '');
                    d[key] = +value / 100; 
                } 
                else if (!isNaN(value) && value !== '') {
                    d[key] = +value;
                }
            }
        });
    });

    dataset = data;

    updateChart(dataset);

   // play and stop buttons
    d3.select('#playButton').on('click', startAnimation);
    d3.select('#stopButton').on('click', stopAnimation);
});

// Play button function to start animation
function startAnimation() {
    if (playing) return;  // Prevent multiple clicks while already playing

    playing = true;
    intervalId = setInterval(function() {
        year++;
        if (year > yearRange[1]) {
            year = yearRange[0];
        }
        updateChart(dataset);
    }, 1000);  // Update every 1 second
}

// Stop button function to stop animation
function stopAnimation() {
    playing = false;
    clearInterval(intervalId);  // Stop the interval
}

// Update chart based on the selected metric, country, and year
function updateChart(dataset) {
    var columnName = metric + ' ' + year; 
    console.log('Column Name:', columnName);

    // Map over the dataset
    var selectedData = dataset.map(function (row) {
        var value = row[columnName];
        console.log(value); 
        return {
            country: row['indicator'],
            value: value
        };
    });

    console.log('Selected Data:', selectedData);

    var filteredData = selectedData.filter(function(d) {
        return !isNaN(d.value);
    });

    if (filteredData.length === 0) {
        console.log('No valid data to display!');
        return;
    }

    // Set up the scales and chart
    var xDomain = d3.extent(filteredData, function(d) { return d.value; });
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

    // Update
    var bars = chartG.selectAll('.bar')
        .data(filteredData, function(d) { return d.country; });

    bars.exit().remove();

    bars.enter().append('rect')
        .attr('class', 'bar')
        .attr('x', function(d) { return xScale(Math.min(0, d.value)); })
        .attr('y', function(d) { return yScale(d.country); })
        .attr('height', yScale.bandwidth())
        .merge(bars)
        .transition()
        .duration(750)
        .attr('x', function(d) { return xScale(Math.min(0, d.value)); })
        .attr('width', function(d) { return Math.abs(xScale(d.value) - xScale(0)); })
        .attr('y', function(d) { return yScale(d.country); })
        .attr('height', yScale.bandwidth())
        .attr('fill', function(d) { return d.country === country ? 'steelblue' : 'lightgrey'; });

    // Zero-line
    chartG.select('.zero-line').remove();
    chartG.append('line')
        .attr('class', 'zero-line')
        .attr('x1', xScale(0))
        .attr('x2', xScale(0))
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', 'black');
}
