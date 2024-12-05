var data;
var select;

select = d3.select('#xScaleSelect').node();
var metric = select.options[select.selectedIndex].value;
select = d3.select('#yScaleSelect').node();
var country = select.options[select.selectedIndex].value;

function onXScaleChanged() {
    select = d3.select('#xScaleSelect').node();
    metric = select.options[select.selectedIndex].value;
    updateChart();
}

function onYScaleChanged() {
    select = d3.select('#yScaleSelect').node();
    country = select.options[select.selectedIndex].value;
    updateChart();
}

var svg = d3.select('svg');
var padding = {t: 30, r: 30, b: 40, l: 120};
var chartWidth = +svg.attr('width') - padding.l - padding.r;
var chartHeight = +svg.attr('height') - padding.t - padding.b;
var chartG = svg.append('g')
    .attr('transform', 'translate(' + [padding.l, padding.t] + ')');

d3.csv('CMSC471 Dataset - Filtered.csv').then(function(dataset) {

    var headerMapping = {
        'GDP growth (annual %)': 'GDP Growth (annual %)',
        'health expenditure  % of GDP': 'Health Expenditure % of GDP',
        'education expenditure % of GDP': 'Education Expenditure % of GDP',
        'unemployment (%)': 'Unemployment (%)',
        '% of seats held by women in national parliaments': '% of Seats Held by Women in National Parliaments',
        'Military Spending as % of GDP': 'Military Spending as % of GDP'
    };

    data = dataset.filter(function(d) {
        return d['indicator'] !== 'source' &&
               d['indicator'] !== 'URL' &&
               d['indicator'] !== 'notes' &&
               d['indicator'] !== 'data year';
    });

    data = data.map(function(row) {
        var newRow = {};
        for (var key in row) {
            newRow[headerMapping[key.replace(/[\r\n]+/g, ' ')] || key] = row[key];
        }
        return newRow;
    });

    updateChart();
});

function updateChart() {
    var filteredData = data.map(function(d) { 
        return { country: d['indicator'], value: parseFloat(d[metric]) }; 
    });
    filteredData = filteredData.filter(function(d) { return !isNaN(d.value); });

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
        .attr('y', function(d) { return yScale(d.country); }) // y position to match scale
        .attr('height', yScale.bandwidth()) // height matches scale 
        .attr('fill', function(d) { return d.country === country ? 'steelblue' : 'lightgrey'; });

    chartG.select('.zero-line').remove();
    chartG.append('line')
        .attr('class', 'zero-line')
        .attr('x1', xScale(0))
        .attr('x2', xScale(0))
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', 'black');
}
