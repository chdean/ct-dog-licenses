var width, height;
var margin = 200;

updateDimensions(window.innerWidth);

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
  .range([0, width / 7]);

d3.json("build/connecticut.geojson", function(error, ct) {
  if (error) return console.error(error);

  var path = d3.geoPath()
    .projection(d3.geoTransverseMercator()
        .rotate([73.0877, 0])
        .fitExtent([[margin / 2, 0], 
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
    .attr("transform", "translate(" + (width * .5) + "," + (height * .75) + ")")
  .selectAll("g")
    .data([100, 500, 1000])
  .enter().append("g");

legend.append("text")
  .text("New Licenses per Thousand People")
  .attr("dy", "1.6em");

legend.append("circle")
  .attr("cy", function(d) { return -radius(d); })
  .attr("r", radius);

legend.append("text")
  .attr("y", function(d) { return -2 * radius(d); })
  .attr("dy", "1.3em")
  .text(d3.format(".1s"));

function updateDimensions(winWidth) {
    width = winWidth * .9;
    height = winWidth * .75;
}

