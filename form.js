// match csv fields to form fields
var fields = {
    'surgery_bin': 'Surgery Type',
    'approach': 'Approach',
    'pre_surg_stat': 'Opioid Status',
    'hx_mh': 'History of Mental Health Diagnosis'  
}

function fill_form(csv){
    var $worksheet_input = $('#worksheet_input');

    var field_options = {};
    // loop through all fields (keys)
    for(var i = 0, imax = Object.keys(fields).length; i < imax; i++){
        // get field name
        var field = Object.keys(fields)[i];
        // instantiate empty array for field
        field_options[field] = []
        for(var j = 0, jmax = csv.length; j < jmax; j++){
            value = csv[j][field];
            // make sure value is not already in array (prevent duplicates)
            if(value && field_options[field].indexOf(value) < 0){
                field_options[field].push(value);
            }
        }
    }

    for(var field in field_options) {
        var options = field_options[field]
        var $input_container = $('<div>');
        
        var $container_label = $('<h2>').text(fields[field]);
        $input_container.append($container_label);
        
        // create input based on number of options
        if(options.length > 5){ // select
            var $input = $('<select>').attr('name', field);
            for(var i in options){
                $input.append($('<option>').html(options[i]));
            }
            
            $input_container.append($input);
            
        } else{ // radio      
            for(var i in options){
                var $input = $('<input>');
                $input.attr({
                    type: 'radio', 
                    name: field,
                    value: options[i],
                    required: true
                });
                
                var $label = $('<label>').text(options[i]);
                
                $label.prepend($input);
                $input_container.append($label);
            }
        }
        
        $worksheet_input.append($input_container);
    }
    
    // create submit button
    $worksheet_input.append('<input type="submit" value="Submit">');
    
    // submit event
    $worksheet_input.submit(function(evt){
        evt.preventDefault();
        var $worksheet = $('#worksheet');
        
        var form_obj = jsonify_form($worksheet_input);
        var cur_csv_obj = match_to_csv(form_obj, csv);
        
        if(cur_csv_obj){
            $worksheet.text(JSON.stringify(cur_csv_obj));
            create_calendar(cur_csv_obj);
        } else{
            $worksheet.text('Not found');
        }
    });
}

// turn form into json object
function jsonify_form(form){
    var obj = {};
    
    //loop through serialized array
    $.each(form.serializeArray(), function(_, kv){
        if(obj.hasOwnProperty(kv.name)){
            obj[kv.name] = $.makeArray(obj[kv.name]);
            obj[kv.name].push(kv.value);
        } else{
            obj[kv.name] = kv.value;
        }
    });
    
    return obj;
}

// match current form item to item in csv
function match_to_csv(form, csv){
    for(var i = 0, imax = csv.length; i < imax; i++){
        var is_match = true;
        var row = csv[i];
        
        // loop through form values
        for(var key in form){
            value = form[key];
            
            // if all form values do not match all equivalent row values in csv
            if(value != row[key]){
                is_match = false;
            }
        }
        
        // all match
        if(is_match){
            return row;
        }
    }
    
    return false;
}

function create_calendar(selection){ 
    // calendar sizing
    var width = 960,
        height = 136,
        cellSize = 17;

    // create svg
    var svg = d3.select('#worksheet')
        .selectAll("svg")
        .data([1]) // number of calendar items (years)
        .enter().append("svg")
            .attr("width", width)
            .attr("height", height)
        .append("g")
            .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")")
        
    var rect = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#ccc")
        .selectAll("rect")
        .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
        .enter().append("rect")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", function(d) { return d3.timeWeek.count(d3.timeYear(d), d) * cellSize; })
            .attr("y", function(d) { return d.getDay() * cellSize; })
            .datum(d3.timeFormat("%Y-%m-%d"));

    svg.selectAll("rect")
        .attr("fill", function(d, i, n){
            if(i <= selection.median_taken){
                return 'green';
            } else if(i <= selection.q3_taken){
                return 'yellow';
            } else{
                return 'red';
            }
        })
}

// on document load
$(function(){
    d3.csv('https://raw.githubusercontent.com/whitstd/opioid-worksheet/master/aggregate_opioid.csv', function(data){
        convert = ['n', 'median_taken', 'q1_taken', 'q3_taken', 'perc_pain_int', 'perc_refill'];
        for(var i = 0, imax = convert.length; i < imax; i++){
            data[convert[i]] = +data[convert[i]];
        }
        return data; //promise
    }).then(function(csv){
        fill_form(csv);
    })
})
