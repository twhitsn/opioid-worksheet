// form fields to fill
var fillFields = ['surgery_bin']

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
        var field = fillFields[f];
        var options = [];
    
        // get values from csv
        for(var i = 0, imax = csv.length; i < imax; i++){
            var value = csv[i][field];
            // make sure value is not already in array (prevent duplicates)
            if(value && options.indexOf(value) < 0){
                options.push(value);
            }
        }
        
        // put values in select
        populateSelect(field + '_select', options);
    }
    
    // prescription selection
    for(var drug in prescriptions){
        $('#prescriptionDrug').append($('<option>').val(drug).html(drug));
    }
    
    // surgery select
    $('#surgery_bin_select').change(function(){
        var surgery = $(this).find(":selected").text();
        var approaches = [];
        
        for(var i = 0, imax = csv.length; i < imax; i++){
            row = csv[i];
            approach = row['approach'];
            
            if(row['surgery_bin'] == surgery && approaches.indexOf(approach) < 0){
                approaches.push(approach);
            }
        }
        
        populateSelect('approachSelect', approaches, true);
    });
    
    // button clicks
    $('#updateBtn').click(function(evt){
        evt.preventDefault();
        
        var formObj = jsonifyForm($worksheetInput);
        var csvMatch = matchToCsv(formObj, csv);
        
        if(csvMatch){
            var selection = mergeObjects(csvMatch, formObj);
            
            console.log(selection);
        
            updateText(selection);
            updateImages(selection);
            
            calendar.drawAll(selection, prescriptions);
        }
    });
    
    $('#clearBtn').click(function(evt){
        $worksheetInput.trigger('reset');
        $('#refillPerc').text('');
        $('#painImg').removeAttr('src');
        $('#calendar').empty();
        $('#approachSelect').empty();
        document.getElementById('prescriptionStartDate').valueAsDate = new Date();
    });
    
    $('#printBtn').click(function(evt){
        evt.preventDefault();
        window.print()
    });
}

function populateSelect(id, options, empty = false){
    var $select = $('#' + id);
    
    if(empty){ $select.empty(); }
    
    for(var i = 0, imax = options.length; i < imax; i++){
        $select.append($('<option>').html(options[i]));
    }
}

function updateText(selection){
    var refillPerc = Math.round(selection.perc_refill);
    $('#refillPerc').text(refillPerc);
}

function updateImages(selection){
    var painImgBase = 'images/PainFaces_V02-';

    var painLevel = Math.round(selection.perc_pain_int / 10);
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
// must create new object or else a pointer will be returned
function mergeObjects(obj1, obj2){
    var newObj = {}
    
    Object.keys(obj1).forEach(function(key){ newObj[key] = obj1[key]; });
    Object.keys(obj2).forEach(function(key){ newObj[key] = obj2[key]; });
    
    return newObj;
}

// match current form item to item in csv
function matchToCsv(form, csv){
    for(var i = 0, imax = csv.length; i < imax; i++){
        var isMatch = true;
        var row = csv[i];
        
        // loop through form values
        for(var key in form){
            var value = form[key];
            
            // if all form values do not match all equivalent row values in csv
            if(Object.keys(row).indexOf(key) >= 0 && value != row[key]){
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

/*function createCalendar(selection){
    // colors from Google material design, weight 300
    var colors = [
        '#9E9E9E', // gray
        '#81C784', // green
        '#FFF176', // yellow
        '#E57373' // red
    ];
    
    // gap between days (inches)
    var cellGap = 0.1,
        calGap = 0.5;
    
    var mmePerDay = prescriptions[selection.prescriptionDrug] * selection.prescriptionAmount;

    var cellsPerRow = 7,
        cellsPerCol = 4,
        numCells = 56;

    // calendar sizing
    var cellSize = 0.25;
        
    // remove any previous elements
    d3.select('#calendar').selectAll('svg').remove();

    // create svg
    var svg = d3.select('#calendar')
        .selectAll('svg')
        .data([1]) // number of calendar items (years) FIXME: unnecessary
        .enter()
            .append('svg')
                .attr('width', '6in');
                //.attr('height', '3in');
    
    function drawCalendar(calIndex = 0){
        var days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
        var startX = calIndex ? calGap + cellSize * cellsPerRow + cellGap * cellsPerRow : 0;
        var drawing = svg.append('g');

        drawing.selectAll('text')
            .data(function(d){ return Array.apply(null, {length: 7}).map(Number.call, Number); }) // create array from start - finish for calendar
            .enter().append('text')
                .attr('stroke', colors[0])
                .attr('x', function(d){ return String(startX + (d % cellsPerRow) * cellSize + ((d % cellsPerRow) * cellGap) + cellSize / 2) + 'in'; })
                .attr('y', function(d){ return '.25in'; })
                .attr('text-anchor', 'middle')
                .text(function(d){
                    return days[d];
                });
                
        drawing.selectAll('rect')
            .data(function(d){ return Array.apply(null, {length: numCells / 2}).map(Number.call, Number); }) // create array from start - finish for calendar
            .enter().append('rect')
                .attr('width', cellSize + 'in')
                .attr('height', cellSize + 'in')
                .attr('x', function(d){ return String(startX + (d % cellsPerRow) * cellSize + ((d % cellsPerRow) * cellGap)) + 'in'; })
                .attr('y', function(d){ return String((Math.floor(d / cellsPerRow) + 1) * cellSize + (Math.floor(d / cellsPerRow) * cellGap) + cellGap) + 'in'; });
                
        svg.attr('height', 180); //FIXME: arbitrary, fix

        svg.selectAll('rect')
            .attr('stroke', colors[0])
            .attr('fill', function(d, i, n){
            
                i = i - offsetDays;
                
                var curMme = i * mmePerDay;
                
                if(i < 0){
                    return colors[0];
                }else if(curMme < selection.median_taken){
                    return colors[1];
                } else if(curMme < selection.q3_taken){
                    return colors[2];
                } else{
                    return colors[3];
                }
            });
    }
    
    var offsetDays = new Date($('#prescriptionStartDate').val()).getDay();
    
    drawCalendar(0);
    drawCalendar(1);
}*/

// on document load
$(function(){
    calendar.init();

    d3.csv('https://raw.githubusercontent.com/whitstd/opioid-worksheet/master/aggregate_opioid.csv', function(data){
        convert = ['n', 'median_taken', 'q1_taken', 'q3_taken', 'perc_pain_int', 'perc_refill'];
        for(var i = 0, imax = convert.length; i < imax; i++){
            data[convert[i]] = +data[convert[i]];
        }
        return data; //promise
    }).then(function(csv){
        document.getElementById('prescriptionStartDate').valueAsDate = new Date(); // default start date today
        fillForm(csv);
    })
})
