var calendar = (function(){
    var _days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    var _colors = [
        '#424242', // gray
        '#81C784', // green
        '#FFF176', // yellow
        '#E57373' // red
    ];
    
    var _calWidth = '6in';
    
    // gap between days (inches)
    var _cellGap = 0.1,
        _calGap = 0.25;

    var _cellsPerRow = 7,
        _cellsPerCol = 4,
        _numCells = 56;

    // calendar sizing
    var _cellSize = 0.25;
    
    var _calendar = null;
    
    function init(){
        _calendar = d3.select('#calendar');
    }
    
    function drawAll(selection, prescriptions){
        var mmePerDay = prescriptions[selection.prescriptionDrug] * selection.prescriptionAmount;
        var offsetDays = new Date($('#prescriptionStartDate').val()).getDay();
        
        _clear(); // clear old svg
        
        var svg = _calendar.append('svg')
            .attr('width', _calWidth); //FIXME; arbitrary

        _drawOne(0, svg, selection, mmePerDay, offsetDays);
    }
    
    function _clear(){
        _calendar.selectAll('svg').remove();
    }
    
    function _drawOne(calIndex, svg, selection, mmePerDay, offsetDays){
        var startX = calIndex ? _calGap + _cellSize * _cellsPerRow + _cellGap * _cellsPerRow : 0;
        var drawing = svg.append('g')

        drawing.selectAll('text')
            .data(function(d){ return Array.apply(null, {length: 7}).map(Number.call, Number); }) // create array from start - finish for calendar
            .enter().append('text')
                .attr('stroke', 'black')
                .attr('x', function(d){ return String(startX + (d % _cellsPerRow) * _cellSize + ((d % _cellsPerRow) * _cellGap) + _cellSize / 2) + 'in'; })
                .attr('y', function(d){ return '.25in'; })
                .attr('text-anchor', 'middle')
                .text(function(d){
                    return _days[d];
                });
                
        drawing.selectAll('rect')
            .data(function(d){ return Array.apply(null, {length: _numCells / 2}).map(Number.call, Number); }) // create array from start - finish for calendar
            .enter().append('rect')
                .attr('width', _cellSize + 'in')
                .attr('height', _cellSize + 'in')
                .attr('x', function(d){ return String(startX + (d % _cellsPerRow) * _cellSize + ((d % _cellsPerRow) * _cellGap)) + 'in'; })
                .attr('y', function(d){ return String((Math.floor(d / _cellsPerRow) + 1) * _cellSize + (Math.floor(d / _cellsPerRow) * _cellGap) + _cellGap) + 'in'; });
                
        svg.attr('height', 180); //FIXME: arbitrary, fix

        _calendar.selectAll('rect')
            .attr('stroke', _colors[0])
            .attr('fill', function(d, i, n){
            
                i = i - offsetDays;
                
                var curMme = i * mmePerDay;
                
                if(i < 0){
                    return _colors[0];
                }else if(curMme < selection.median_taken){
                    return _colors[1];
                } else if(curMme < selection.q3_taken){
                    return _colors[2];
                } else{
                    return _colors[3];
                }
            });
    }
    
    return {
        init: init,
        drawAll: drawAll
    };
})();
