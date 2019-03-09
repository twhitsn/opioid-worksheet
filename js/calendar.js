'use strict';

class Calendar {
    constructor(){
        this.days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

        this.colors = [
            '#424242', // gray
            '#81C784', // green
            '#FFF176', // yellow
            '#E57373' // red
        ];

        this.calWidth = '6in';

        // gap between days (inches)
        this.cellGap = 0.1;
        this.calGap = 0.25;

        this.cellsPerRow = 7;
        this.cellsPerCol = 4;
        this.numCells = 56;

        // calendar sizing
        this.cellSize = 0.25;

        this.calendar = d3.select('#calendar');
    }

    drawAll(selection, prescriptions){
        const mmePerDay = prescriptions[selection.prescriptionDrug] * selection.prescriptionAmount * selection.prescriptionPerDay;
        const offsetDays = new Date($('#prescriptionStartDate').val()).getDay();

        this.clear(); // clear old svg

        const svg = this.calendar.append('svg')
            .attr('width', this.calWidth); //FIXME; arbitrary

        this.drawOne(0, svg, selection, mmePerDay, offsetDays);
    }

    clear(){
        this.calendar.selectAll('svg').remove();
    }

    drawOne(calIndex, svg, selection, mmePerDay, offsetDays){
        const startX = calIndex ? this.calGap + this.cellSize * this.cellsPerRow + this.cellGap * this.cellsPerRow : 0;
        const drawing = svg.append('g');

        drawing.selectAll('text')
            .data(function(d){ return Array.apply(null, {length: 7}).map(Number.call, Number); }) // create array from start - finish for calendar
            .enter().append('text')
                .attr('stroke', 'black')
                .attr('x', (d) => { return String(startX + (d % this.cellsPerRow) * this.cellSize + ((d % this.cellsPerRow) * this.cellGap) + this.cellSize / 2) + 'in'; })
                .attr('y', (d) => { return '.25in'; })
                .attr('text-anchor', 'middle')
                .text((d) => { return this.days[d];
             });

        drawing.selectAll('rect')
            .data((d) => { return Array.apply(null, {length: this.numCells / 2}).map(Number.call, Number); }) // create array from start - finish for calendar
            .enter().append('rect')
                .attr('width', this.cellSize + 'in')
                .attr('height', this.cellSize + 'in')
                .attr('x', (d) => { return String(startX + (d % this.cellsPerRow) * this.cellSize + ((d % this.cellsPerRow) * this.cellGap)) + 'in'; })
                .attr('y', (d) => { return String((Math.floor(d / this.cellsPerRow) + 1) * this.cellSize + (Math.floor(d / this.cellsPerRow) * this.cellGap) + this.cellGap) + 'in'; });

        svg.attr('height', 180); //FIXME: arbitrary

        this.calendar.selectAll('rect')
            .attr('stroke', (d, i, n) => {
                i = i - offsetDays;

                if(i < 0){
                    return 'transparent';
                } else{
                    return this.colors[0];
                }
            })
            .attr('fill', (d, i, n) => {
                i = i - offsetDays;
                var curMme = i * mmePerDay;

                if(i < 0){
                    return 'transparent';
                }else if(curMme < selection.median_taken){
                    return this.colors[1];
                } else if(curMme < selection.q3_taken){
                    return this.colors[2];
                } else{
                    return this.colors[3];
                }
            });

        // X marks the spot... for where the prescription ends
        const d = +selection.prescriptionTotalDays + offsetDays - 1;
        const x = (d % this.cellsPerRow) * this.cellSize + ((d % this.cellsPerRow) * this.cellGap);
        const y = (Math.floor(d / this.cellsPerRow) + 1) * this.cellSize + (Math.floor(d / this.cellsPerRow) * this.cellGap) + this.cellGap;

        drawing.append('svg:image')
            .attr('x', x + 'in')
            .attr('y', y + 'in')
            .attr('width', this.cellSize + 'in')
            .attr('height', this.cellSize + 'in')
            .attr('xlink:href', 'images/x.png')
    }
}
