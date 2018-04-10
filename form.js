// match csv fields to form fields
var fields = {
    'surgery_bin': 'Surgery Type',
    'approach': 'Approach',
    'pre_surg_stat': 'Opioid Status',
    'hx_mh': 'History of Mental Health Dx'  
};

// prescriptions with mme conversion
var prescriptions = {
    'codeine': 0.15,
    'hydrocodone': 1,
    'hydromorphone': 4,
    'morphine': 1,
    'oxycodone': 1.5,
    'oxymorphone': 3
};

function fillForm(csv){
    var $worksheetInput = $('#worksheetInput');

    var fieldOptions = {};
    // loop through all fields (keys)
    for(var i = 0, imax = Object.keys(fields).length; i < imax; i++){
        // get field name
        var field = Object.keys(fields)[i];
        // instantiate empty array for field
        fieldOptions[field] = [];
        for(var j = 0, jmax = csv.length; j < jmax; j++){
            value = csv[j][field];
            // make sure value is not already in array (prevent duplicates)
            if(value && fieldOptions[field].indexOf(value) < 0){
                fieldOptions[field].push(value);
            }
        }
    }

    for(var field in fieldOptions) {
        var options = fieldOptions[field]
        var $inputContainer = $('<div>');
        
        var $containerLabel = $('<h2>').text(fields[field]);
        $inputContainer.append($containerLabel);
        
        // create input based on number of options
        if(options.length > 5){ // select
            var $input = $('<select>').attr('name', field);
            for(var i in options){
                $input.append($('<option>').html(options[i]));
            }
            
            $inputContainer.append($input);
            
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
                $inputContainer.append($label);
            }
        }
        
        $worksheetInput.append($inputContainer);
    }
    
    // prescription selection
    
    var prescriptionHtml = '<div><h2>Prescription</h2>' + 
           '<select name="prescriptionDrug">';
    
    for(var drug in prescriptions){
        prescriptionHtml += '<option value="' + drug + '">' + drug + '</option>';
    }      
   
    prescriptionHtml += '</select>';
    prescriptionHtml += '<label><input type="text" name="prescriptionAmount" required> mg/day</label></div>';
    
    $('#prescriptionInput').append(prescriptionHtml);
    
    // submit event
    $('#updateBtn').click(function(evt){
        evt.preventDefault();
        
        var formObj = jsonifyForm($worksheetInput);
        var curCsvObj = matchToCsv(formObj, csv);
        
        updateText(curCsvObj)
        updateImages(curCsvObj);
        
        if(curCsvObj){
            curCsvObj = mergeObjects(curCsvObj, jsonifyForm($('#prescriptionInput')));
            console.log(JSON.stringify(curCsvObj));
            createCalendar(curCsvObj);
        }
    });
    
    $('#printBtn').click(function(evt){
        evt.preventDefault();
        window.print()
    });
}

function updateText(selection){
    refillPerc = Math.round(selection.perc_refill);
    $('#refillPerc').text(refillPerc);
}

function updateImages(selection){
    painImgBase = 'images/PainFaces-';

    painLevel = Math.round(selection.perc_pain_int / 10);
    painLevel = (painLevel == 0) ? 1 : painLevel
    painLevel = (painLevel == 10) ? String(painlevel) : '0' + String(painLevel);
    
    console.log(painLevel);
    
    $('#painImg').attr('src', painImgBase + painLevel + '.png');
}

// turn form into json object
function jsonifyForm(form){
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

// merge two objects
function mergeObjects(obj1, obj2) {
    Object.keys(obj2).forEach(function(key){ obj1[key] = obj2[key]; });
    return obj1;
}

// match current form item to item in csv
function matchToCsv(form, csv){
    for(var i = 0, imax = csv.length; i < imax; i++){
        var isMatch = true;
        var row = csv[i];
        
        // loop through form values
        for(var key in form){
            value = form[key];
            
            // if all form values do not match all equivalent row values in csv
            if(value != row[key]){
                isMatch = false;
            }
        }
        
        // all match
        if(isMatch){
            return row;
        }
    }
    
    return false;
}

function createCalendar(selection){
    // colors from Google material design, weight 300
    var colors = [
        '#81C784', //green
        '#FFF176', //yellow
        '#E57373' //red
    ];
    
    var minCells = 30
    
    var mmePerDay = prescriptions[selection.prescriptionDrug] * selection.prescriptionAmount;

    var cellsPerRow = 21,
        totalCells = Math.round(selection.q3_taken / mmePerDay);
        
    if(totalCells < minCells){
        totalCells = minCells;
    }

    var pageWidth = $('#page1').width();

    // calendar sizing
    var width = pageWidth,
        cellSize = pageWidth / cellsPerRow;
        
    // remove any previous elements
    d3.select('#calendar').selectAll('svg').remove();

    // create svg
    var svg = d3.select('#calendar')
        .selectAll('svg')
        .data([1]) // number of calendar items (years) FIXME: unnecessary
        .enter().append('svg')
            .attr('width', width)
            .attr('height', Math.ceil(totalCells / cellsPerRow) * cellSize);
        
    var rect = svg.append('g')
            .attr('fill', 'none')
            .attr('stroke', '#ccc')
        .selectAll('rect') //FIXME: unnecessary
        .data(function(d){ return Array.apply(null, {length: totalCells}).map(Number.call, Number); }) // array from 0 - length of total cells
        .enter().append('rect')
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('x', function(d){ return (d % cellsPerRow) * cellSize; })
            .attr('y', function(d){ return Math.floor(d / cellsPerRow) * cellSize; });

    svg.selectAll('rect')
        .attr('fill', function(d, i, n){
            var curMme = i * mmePerDay;
            
            if(curMme < selection.median_taken){
                return colors[0];
            } else if(curMme < selection.q3_taken){
                return colors[1];
            } else{
                return colors[2];
            }
        });
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
        fillForm(csv);
    })
})
