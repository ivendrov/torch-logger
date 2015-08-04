function init() {
    console.log("Loading page");

    var model_select = d3.select("#model_select").select("[name=model]");

    d3.json("static/index.json", function (data) {

        update_select(model_select, data);



        // get URL GET params
        var queryDict = {};

        location.search.substr(1).split("&").forEach(function(item) {
            var split = item.split("=");
            var name = split[0];
            var value = split[1];
            if (name == "model") {
                if (!queryDict.hasOwnProperty("model")) {
                    queryDict["model"] = []
                }
                queryDict["model"].push(value);
            }
            else
                queryDict[name] = value
        });
        if (queryDict.hasOwnProperty("model")){
            console.log("Loading page with form");

            var options = model_select.node().options;
            for (var i =0; i < options.length; i++) {
                var option = options[i];
                if (queryDict["model"].indexOf(option.value) >= 0) {
                    option.selected = true;
                    console.log("Selected model " + option.value)
                }
            }
            loadModels(queryDict["model"], displayModels);
        }

    });
}

/**
 * Populates the given form selector with the given string options
 */
function update_select(formSelector, options){
    options.sort();

    formSelector.selectAll("*").remove();
    formSelector
        .selectAll("option")
        .data(options)
        .enter()
        .append("option")
        .attr("name", function(d){
        return d;
        })
        .text(function(d){
            return d;
        });
}

/**
 * Loads the given models into memory
 * @param modelnames model names
 * @param callback function to call with resulting array of json logs
 */
function loadModels(modelnames, callback){
    var models = [];

    modelnames.forEach(function(modelname){
        d3.json('static/' + modelname + '.json', function(data){
            models.push(data);
            if (models.length == modelnames.length)
                callback(models)
        });
    });
}





/**
 *
 * @param models array of logs for each model
 */
function displayModels(models){
    console.log("Displaying ");


    // generate random colors for each method
    var colors = [];
    for (var i = 0; i < models.length; i++){
        colors.push(d3.rgb('#'+Math.random().toString(16).substr(-6)).darker(1));
    }

    // display hyperparams
    d3.select("#hyperparams").selectAll("div").remove();
    var hyperDivs = d3.select("#hyperparams").selectAll("div")
        .data(models)
        .enter()
        .append("div")
        .style("color", function(d, i){
            return colors[i];
        });
    hyperDivs
        .append("h2")
        .append("b")
        .text(function(d){
            return d.name;
        });
    hyperDivs
        .append("pre")
        .text(function(d){
            return JSON.stringify(d.hyperparams, null, 2);
        });


    // get a list of all the data streams
    var data_streams = [];
    models.forEach(function(model){
        for (var data in model.data){
            if (data_streams.indexOf(data) < 0){
                data_streams.push(data);
            }
        }
    });

    // get minimal and maximal values for each data stream
    var x_maximum = Number.NEGATIVE_INFINITY;
    var y_minima = new Array(data_streams.length);
    var y_maxima = new Array(data_streams.length);
    for (var i = 0; i < data_streams.length; i++){
        y_minima[i] = Number.POSITIVE_INFINITY;
        y_maxima[i] = Number.NEGATIVE_INFINITY;
        var data_stream = data_streams[i];
        for (var j = 0; j < models.length; j++){
            if (models[j].data.hasOwnProperty(data_stream)){
                models[j].data[data_stream].forEach(function(p){
                    x_maximum = Math.max(x_maximum, p.x);
                    y_maxima[i] = Math.max(y_maxima[i], p.y);
                    y_minima[i] = Math.min(y_minima[i], p.y);
                });
            }
        }
    }


    var charts_main = d3.select("#charts");

    // add new charts if need be
    var new_divs = charts_main.selectAll("div")
        .data(data_streams)
        .enter()
        .append("div");
    // add headers to new charts
    new_divs
        .append("h1")
        .text(function(d){ return d; });

    // add svgs to new charts

    var margin = {top: 20, right: 30, bottom: 50, left: 60}; // Mike's margin convention

    var w = 1000 - margin.left - margin.right,
        h = 500 - margin.top - margin.bottom;

    new_divs
        .append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("width", w)
        .attr("height", h)
        .attr("class", "chart");

    // compute chart scales
    var xScales = [];
    var yScales = [];
    for (var i = 0; i < data_streams.length; i++) {
        xScales.push(d3.scale.linear()
            .domain([0, x_maximum])
            .range([0, w]));

        var yScale = d3.scale.log();
        if (y_minima[i] <= 0 || y_maxima[i] / y_minima[i] < 10 ){
            yScale = d3.scale.linear();
        }
        yScales.push(yScale
            .domain([y_minima[i], y_maxima[i]])
            .range([h, 0]));
    }


    // Add all needed curves to all charts
    d3.selectAll(".chart")
        .selectAll(".curve")
        .data(models)
        .enter()
        .append("path")
        .attr("class", "curve")
        .style("stroke", function(d, i) {
            return colors[i]
        });

    /**
     * @param datastream index of appropriate data stream
     * @returns a function which, given an array of points, returns the SVG path string, adjusted to the chart's scale
     */
    function path_string(datastream) {
        return d3.svg.line()
            .x(function (d) {
                return xScales[datastream](d.x)
            })
            .y(function (d) {
                return yScales[datastream](d.y)
            })
    }

    // Populate the doubly-nested selection of curves
    var curves = d3.selectAll(".chart").selectAll(".curve");
    curves
        .attr("d", function(d, model_index, data_index){
            console.log(data_index);
            console.log(model_index);
            return path_string(data_index)(d.data[data_streams[data_index]]);
        });

    // x label
    d3.selectAll(".chart")
        .append("text")
        .attr("text-anchor", "center")
        .attr("x", w/2)
        .attr("y", h + 40)
        .text(models[0].xLabel);

    // y label
    d3.selectAll(".chart")
        .append("text")
        .attr("text-anchor", "center")
        .attr("x", -h/2)
        .attr("y", -60)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(function(d) { return d; });




    // draw axes
    d3.selectAll(".chart")
        .append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + h + ")")
        .each(function(d, i) {
            d3.svg.axis()
                .scale(xScales[i])
                .orient("bottom")
                .tickSize(-h, 0, 0)
                .ticks(10)
            (d3.select(this));
        });

    d3.selectAll(".chart")
        .append("g")
        .attr("class", "axis")
        .each(function(d, i){
             d3.svg.axis()
                .scale(yScales[i])
                .orient("left")
                .ticks(10)
             (d3.select(this));
        });
    
}