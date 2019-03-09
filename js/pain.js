'use strict';

class Pain {
    constructor(){
        this.maxPain = 50;
        this.div = d3.select('#pain');

        let length = 5;
        let color = d3.scaleLinear()
            .domain([0, length /2, length])
            .range(['#81C784', '#FFF176', '#E57373']);

        // add faces
        for(let i = 0; i < length; i++) {
            this.div.append('img')
                .attr('src', 'images/PainFaces_V02-' + ('0' + (i + 1) * 2).slice(-2) + '.png')
                .attr('style', 'background-color: ' + color(i))
        }

        // add arrow
        $('#pain').append('<i id="arrow"></i>');
    }

    moveArrow(perc_pain_int){
        $('#arrow').css('margin-left', $('#pain').width() * (perc_pain_int / this.maxPain) + 'px');
    }
}
