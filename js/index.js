'use strict';

// on document load
$(function(){
    const form = new Form();

    d3.csv('https://raw.githubusercontent.com/whitstd/opioid-worksheet/master/aggregate_opioid.csv', function(data){
        let convert = ['n', 'median_taken', 'q1_taken', 'q3_taken', 'perc_pain_int', 'perc_refill'];
        for(let i = 0, imax = convert.length; i < imax; i++){
            data[convert[i]] = +data[convert[i]];
        }
        return data; //promise
    }).then(function(csv){
        document.getElementById('prescriptionStartDate').valueAsDate = new Date(); // default start date today
        form.fill(csv);
    })
});
