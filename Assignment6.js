'use strict';


(function() {

  let data = "gapminder.csv";
  let svgContainer = ""; // keep SVG reference in global scope
  let map = "";
  let popChartContainer = "";
  const msm = {
    width: 1000,
    height: 800,
    marginAll: 50,
    marginLeft: 50,
}
const small_msm = {
    width: 500,
    height: 500,
    marginAll: 90,
    marginLeft: 20
}
  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('#chart')
      .append('svg')
      .attr('width', msm.width)
      .attr('height', msm.height);
    popChartContainer = d3.select("#popChart")
      .append('svg')
      .attr('width', msm.width)
      .attr('height', msm.height);
      // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    
    d3.csv(data)
        .then((data) => makeScatterPlot(data))
  }
  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    //data = csvData // assign data as global var
    data = csvData.filter((data) => {return data.fertility != "NA" && data.life_expectancy != "NA"})

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    map = drawAxes(axesLimits, "fertility", "life_expectancy", svgContainer, msm);

    // plot data as points and add tooltip functionality
    //plotData(thisData);
    
    let thisData = data.filter(function(d) {
        if (d['year'] == "1980" ){
            return data
        }
    })
    plotData(thisData)
    // draw title and axes labels
    makeLabels(svgContainer, msm,"Fertility vs Expectancy (1980)",'Fertility Rates','Life Expectancy');
  }

  // make title and axes labels
  function makeLabels(svgContainer, msm, title, x, y) {
    svgContainer.append('text')
      .attr('x', (msm.width - 2 * msm.marginAll) / 2 - 90)
      .attr('y', msm.marginAll / 2 + 10)
      .style('font-size', '14pt')
      .text(title);

    svgContainer.append('text')
      .attr('x', (msm.width - 2 * msm.marginLeft) / 2 - 30)
      .attr('y', msm.height - 15)
      .style('font-size', '10pt')
      .text(x);

    svgContainer.append('text')
    .attr('transform', 'translate( 15,' + (msm.height / 2 + 30) + ') rotate(-90)')
    .style('font-size', '10pt')
      .text(y);
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  

function plotData(thisData) {
    // get population data as array
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 50]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    let toolChart = div.append('svg')
        .attr('width', small_msm.width)
        .attr('height', small_msm.height)

    // append data to SVG and plot as points
    var dots = svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["population"]*2) )
        .attr('stroke', '#4286f4')
        .attr('stroke-width',1)
        .attr('fill', "white")
        // add tooltip functionality to points
        .on("mouseover", (d) => {
            toolChart.selectAll("*").remove()
          div.transition()
            .duration(200)
            .style("opacity", .9);
          plotPopulation(d.country, toolChart)
         div//.html(numberWithCommas("Fertility: "+d["fertility"]+"<br/>"+
        //   "Life Expectancy: " + d["life_expectancy"]+"<br/>"+
        //   "Population: " + d["population"]*1000000)+ 
        //   "<br/>" +"Year of Year: " + d.year+"<br/>" +
        //   "Country: " + d.country)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });
    
      svgContainer.selectAll("circle").data(thisData).exit().remove();
  }

  
function plotPopulation(country, toolChart) {
    let countryData = data.filter((row) => {return row.country == country})
    let population = countryData.map((row) => parseInt(row["population"]));
    let year = countryData.map((row) => parseInt(row["year"]));

    let axesLimits = findMinMax(year, population);
    let mapFunctions = drawAxes(axesLimits, "year", "population", toolChart, small_msm);
    toolChart.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
                    .x(function(d) { return mapFunctions.xScale(d.year) })
                    .y(function(d) { console.log(Math.round(d.population/1000000)+'M')
                        return mapFunctions.yScale(d.population) }))
    makeLabels(toolChart, small_msm, "Population Over Time For " + country, "Year", "Population");
}

  // draw the axes and ticks
  function drawAxes(limits, x, y, svgContainer, msm) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([0 + msm.marginAll, msm.width - msm.marginAll])

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
    .attr('transform', 'translate(0, ' + (msm.height - msm.marginAll) + ')')
    .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([0 + msm.marginAll, msm.height - msm.marginAll])

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) {// console.log(yValue(d))
        return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    //console.log(yScale)
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
    .attr('transform', 'translate(' + msm.marginAll + ', 0)')
    .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }
  
  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
