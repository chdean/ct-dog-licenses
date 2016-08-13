var width, height;
var margin = 50;

updateDimensions(window.innerWidth, window.innerHeight);

// map and legend
var svg = d3.select("#chart").append("svg")
.attr("width", width)
.attr("height", height);

// tooltip
var div = d3.select("#chart").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

var radius = d3.scaleSqrt()
  .domain([3.792, 2316])
  .range([0, 120]);

d3.json("build/connecticut.geojson", function(error, ct) {
  if (error) return console.error(error);

  var path = d3.geoPath()
    .projection(d3.geoTransverseMercator()
        .rotate([73.0877, 0])
        .fitExtent([[0, 20],
                    [width - margin, height - margin]],
                    ct));

  svg.append("path")
    .datum(ct)
    .attr("class", "land")
    .attr("d", path);

  d3.json("build/licenses.geojson", function(error, circles) {
    if (error) return console.error(error);

    svg.selectAll(".city")
      .data(circles.features)
      .enter().append("path")
        .attr("class", "city")
        .attr("d", path.pointRadius(2));

    svg.selectAll(".symbol")
      .data(circles.features.sort(function(a, b) {
        return b.properties.LICENSESPERTHOUSAND2014
          - a.properties.LICENSESPERTHOUSAND2014;
      }))
      .enter().append("path")
        .attr("class", "symbol")
        .attr("d", path.pointRadius(function(d) {
          return radius(d.properties.LICENSESPERTHOUSAND2014);
        }))
        .on("mouseover", function(d) {
          div.transition()
            .duration(100)
            .style("opacity", .9);
          div
            .html(d.properties.NAME + ": " + 
                Math.round(d.properties.LICENSESPERTHOUSAND2014))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY -28) + "px");
        })
        .on("mouseout", function(d) {
          div.transition()
            .duration(200)
            .style("opacity", 0);
        });

  });
});

var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width - 150) + "," + (height - 50) + ")")
  .selectAll("g")
    .data([100, 500, 1000])
  .enter().append("g");

legend.append("text")
  .text("New Licenses per Thousand People")
  .attr("id", "legend-title")
  .attr("dy", "1.6em");

legend.append("circle")
  .attr("cy", function(d) { return -radius(d); })
  .attr("r", radius);

legend.append("text")
  .attr("y", function(d) { return -2 * radius(d); })
  .attr("dy", "1.3em")
  .text(d3.format(".1s"));

legend.append("text")
  .attr("y", 25)
  .attr("dy", "2em")
  .attr("class", "source")
  .text("Sources: US Census and the State of Connecticut");

      
function updateDimensions(winWidth, winHeight) {
    width = winWidth * .9;
    height = winHeight * .78;
}

