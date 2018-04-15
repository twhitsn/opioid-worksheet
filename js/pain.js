var pain = (function(){
    var _div = null;
    var _maxPain = 50;
    
    function init(){
        _div = d3.select('#pain');
        
        var length = 5;
        var color = d3.scaleLinear()
            .domain([0, length /2, length])
            .range(['#81C784', '#FFF176', '#E57373']);

        // add faces
        for (var i = 0; i < length; i++) {
            _div.append('img')
                .attr('src', 'images/PainFaces_V02-' + ('0' + (i + 1) * 2).slice(-2) + '.png')
                .attr('style', 'background-color: ' + color(i))
        }
        
        // add arrow
        $('#pain').append('<i id="arrow"></i>');
    }
    
    function moveArrow(perc_pain_int){
        $('#arrow').css('margin-left', $('#pain').width() * (perc_pain_int / _maxPain) + 'px');
    }
    
    return{
        init: init,
        moveArrow: moveArrow
    }
})();
