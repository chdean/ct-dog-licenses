var width, height;
var margin = 100;

updateDimensions(window.innerWidth);

var svg = d3.select("#chart").append("svg")
.attr("width", width)
.attr("height", height);

var radius = d3.scaleSqrt()
  .domain([3.792, 2316])
  .range([0, 150]);

d3.json("build/connecticut.geojson", function(error, ct) {
  if (error) return console.error(error);

  var path = d3.geoPath()
    .projection(d3.geoTransverseMercator()
        .rotate([74 + 30 / 60, -38 - 50 / 60])
        .fitExtent([[margin / 2, margin / 2], 
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
        }));
   
  });
});

var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width * .9) + "," + (height * .9) + ")")
  .selectAll("g")
    .data([100, 500, 1000])
  .enter().append("g");

legend.append("circle")
  .attr("cy", function(d) { return -radius(d); })
  .attr("r", radius);

legend.append("text")
  .attr("y", function(d) { return -2 * radius(d); })
  .attr("dy", "1.3em")
  .text(d3.format(".1s"));

legend.append("text")
  .text("Licenses / Thousand People")
  .attr("y", -3)
  .attr("dy", "1.6em");

function updateDimensions(winWidth) {
  if (winWidth > 800) {
    width = winWidth * .9;
    height = winWidth * .4;
  } else {
    width = winWidth;
    height = winWidth;
  }

}

