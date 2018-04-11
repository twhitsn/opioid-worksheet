// form fields to fill
var fillFields = ['surgery_bin', 'approach']

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
    
    for(var f = 0, fmax = fillFields.length; f < fmax; f++){
        field = fillFields[f];
        options = [];
    
        // get values from csv
        for(var i = 0, imax = csv.length; i < imax; i++){
            value = csv[i][field];
            // make sure value is not already in array (prevent duplicates)
            if(value && options.indexOf(value) < 0){
                options.push(value);
            }
        }
        
        // put values in select
        for(var i = 0, imax = options.length; i < imax; i++){
            $('#' + field + '_select').append($('<option>').html(options[i]));
        }
    }
    
    // prescription selection
    for(var drug in prescriptions){
        $('#prescriptionDrug').append($('<option>').val(drug).html(drug));
    }      
    
    
    // submit event
    $('#updateBtn').click(function(evt){
        evt.preventDefault();
        
        var formObj = jsonifyForm($worksheetInput);
        var selection = matchToCsv(formObj, csv);
        
        
        
        if(selection){
            updateText(selection);
            updateImages(selection);
            
            //add prescription info
            selection['prescriptionDrug'] = $('#prescriptionDrug').find(":selected").text();
            selection['prescriptionAmount'] = $('#prescriptionAmount').val();
            
            createCalendar(selection);
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
            if(Object.keys(row).indexOf(key) > 0 && value != row[key]){
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
    
    console.log(selection);

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
