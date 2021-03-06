// visit-sequence.js
// Dimensions of sunburst.
// var width = 750 * 100;
// var height = 600 * 100;
// var radius = Math.min(width, height) / 2;

var width = 750;
var height = 600 ;
var radius = Math.min(width, height) / 2;


// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: 120, h: 40, s: 3, t: 10
};

// Mapping of step names to colors.

var type_color = {
  "root" : "#089ec7",
  "room" : "#6ab975",
  "rack" : "#1ac9be",
  "row" : "#008c62",
  "host" : "#5687d1",
  "osd" : "#7b615c",
  "ipservice" : "#de783b"
};

var osd_color = {
  "up": "#0000AA",
  "down": "#AA0000",
};


// Total size of all segments; we set this later, after loading the data.
var totalSize = 0; 

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var partition = d3.partition()
    .size([2 * Math.PI, radius * radius]);

var arc = d3.arc()
    .startAngle(function(d) { return d.x0; })
    .endAngle(function(d) { return d.x1; })
    .innerRadius(function(d) { return Math.sqrt(d.y0); })
    .outerRadius(function(d) { return Math.sqrt(d.y1); });

// Use d3.text and d3.csvParseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays.

// "visit-sequences.csv"
// url = "https://raw.githubusercontent.com/timelyportfolio/sunburstR/master/inst/examples/visit-sequences.csv"
// d3.text(url, function(text) {
//   var csv = d3.csvParseRows(text);
//   var json = buildHierarchy(csv);
//   createVisualization(json);
// });

// url = "https://raw.githubusercontent.com/GindaChen/cs739-osdvisual/master/data/product/kelly.product.json"
// url = "https://raw.githubusercontent.com/GindaChen/cs739-osdvisual/master/data/product/beesly.product.json"
// url = "https://raw.githubus ercontent.com/GindaChen/cs739-osdvisual/master/data/product/erin.product.json"
url = "https://raw.githubusercontent.com/GindaChen/cs739-osdvisual/master/data/product/jim.product.json"
d3.json(url, function(text){
  createVisualization(text);
});



panelItem = [];

function click(d){
  console.log(d.children);


  
}

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {

  // Basic setup of page elements.
  initializeBreadcrumbTrail();
  drawLegend();
  d3.select("#togglelegend").on("click", toggleLegend);

  // Show legend at the beginning
  toggleLegend();

  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:circle")
      .attr("r", radius)
      .style("opacity", 0);

  var root = d3.hierarchy(json)
      .sum(function(d) { return d.osd_counts; })
      .sort(function(a, b) { return b.value - a.value; });
    
  // TODO: Optional Filter - link it into panel
  var nodes = partition(root).descendants();
    // 1. Filter that filters out the healthy nodes
      // .filter(function(d) {
      //     return d.data.osd_health != d.data.osd_counts;
      // });

  var path = vis.data([json]).selectAll("path")
      .data(nodes)
      .enter().append("svg:path")
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("opacity", 1)
      .on("mouseover", mouseover)
      .on("click", click);

  // TODO: Color for each piece
  path.style("fill", function(d) { 
        var a = d.data;
        var osd_counts = a.osd_counts;
        var osd_health = a.osd_health;
        if (isNaN(osd_counts) || isNaN(osd_health)) { return null; }

        // TODO: too ugly
        // 1. Show the averaged health percentage of each node
        // var fraction = (osd_health/osd_counts);
        // var r = String(200 * (1 - fraction));
        // var g = String(200 * fraction);
        // var b = String(0);
        // c = "rgb" + "(" + r + "," + g + "," + b + ")";

        // 2. Show whether under this level there are node down
        var fraction = (osd_health == osd_counts) ? 1 : 0;
        var r = String(200 * (1 - fraction));
        var g = String(200 * fraction);
        var b = String(0);
        c = "rgb" + "(" + r + "," + g + "," + b + ")";

        return c;
  });

  // Add the mouseleave handler to the bounding circle.
  d3.select("#container").on("mouseleave", mouseleave);

  // Get total size of the tree = value of root node from partition.
  totalSize = path.datum().value;
  
 };

// TODO: Ugly Code
function dataToString(item){
  data = item.data;
  if (data.type == "osd") {
    // TODO: This is an ugly, ugly, ugly code.
    return  "crush_weight: " + String(data.crush_weight) + "\n" +
  "depth: " + String(data.depth) + "\n" +
  "device_class: " + String(data.device_class) + "\n" +
  "exists: " + String(data.exists) + "\n" +
  "primary_affinity: " + String(data.primary_affinity) + "\n" +
  "reweight: " + String(data.reweight) + "\n" +
  "status: " + String(data.status) + "\n";

  }
  return "id: " + String(data.id)   + "\n" + 
       "type: " + String(data.type) + "\n";
}


// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {
  var percentageString = dataToString(d.data);
  
  // TODO: Adjust size of sentence
  fontSize = d.data.name.length > 10 ? "1.8em": "2.5em";

  d3.select("#DeviceName")
      .text(d.data.name)
      .style("text-align", "center")
      .style("font-size", fontSize);
      
  d3.select("#percentage")
      .text(percentageString)
      .style("font-size", "10px");

  d3.select("#explanation")
      .style("visibility", "");

  var sequenceArray = d.ancestors().reverse();
  sequenceArray.shift(); // remove root node from the array
  updateBreadcrumbs(sequenceArray, percentageString);

  // Fade all the segments.
  d3.selectAll("path")
      .style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  vis.selectAll("path")
      .filter(function(node) {
        return (sequenceArray.indexOf(node) >= 0);
  })
  .style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

  // Hide the breadcrumb trail
  d3.select("#trail")
      .style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("path")
      .transition()
      .duration(10)
      .style("opacity", 1)
      .on("end", function() {
              d3.select(this).on("mouseover", mouseover);
            });

  d3.select("#explanation")
      .style("visibility", "hidden");
}

function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3.select("#sequence").append("svg:svg")
      .attr("width", width)
      .attr("height", 50)
      .attr("id", "trail");
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
} 

// Update the breadcrumb trail to show the current sequence and percentage.
// TODO: Change name `percentage` etc.
function updateBreadcrumbs(nodeArray, percentageString) {


  // console.log(nodeArray);
  // Data join; key function combines name and depth (= position in sequence).
  var trail = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { 
        return d.data.name + d.depth; 
      });

  // Remove exiting nodes.
  trail.exit().remove();

  // Add breadcrumb and label for entering nodes.
  var entering = trail.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { 
        return type_color[d.data.data.type]; 
      });

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px") // TODO: Adjust font size to fit in
      .text(function(d) { return d.data.name + " (" + d.data.type + ")"; });

  // Merge enter and update selections; set position for all nodes.
  entering.merge(trail).attr("transform", function(d, i) {
    // s = d.data.name + " (" + d.data.type + ")"
    // w = b.w + s.length;
    return "translate(" + i * (b.w + b.s) + ", 0)";
  });

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
      .style("visibility", "");

}

function drawLegend() {

  // Dimensions of legend item: width, height, spacing, radius of rounded rect.
  var li = {
    w: 75, h: 30, s: 3, r: 3
  };

  var legend = d3.select("#legend").append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(type_color).length * (li.h + li.s));

  var g = legend.selectAll("g")
      .data(d3.entries(type_color))
      .enter().append("svg:g")
      .attr("transform", function(d, i) {
          // s = d.data.name + " (" + d.data.type + ")"
          // w = b.w + s.length;
          return "translate(0," + i * (li.h + li.s) + ")";
       });

  g.append("svg:rect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w)
      .attr("height", li.h)
      .style("fill", function(d) { 
        return type_color[d.key]; 
      });
        

  g.append("svg:text")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.key; });
}

function toggleLegend() {
  var legend = d3.select("#legend");
  if (legend.style("visibility") == "hidden") {
    legend.style("visibility", "");
  } else {
    legend.style("visibility", "hidden");
  }
}
