'use strict';

class Form {
    constructor(){
        // prescriptions with mme conversion
        this.prescriptions = {
            'Codeine': 0.15,
            'Hydrocodone': 1,
            'Hydromorphone': 4,
            'Morphine': 1,
            'Oxycodone': 1.5,
            'Oxymorphone': 3
        };

        this.defaultPatient = 'Patient X';
        this.$worksheetInput = $('#worksheetInput');
        this.pain = new Pain();
        this.calendar = new Calendar();
    }

    checkURL(){
        const url = document.URL;

        if(url.includes('?')){
            let paramString = url.split('?')[1];
            let params = {};
            paramString = paramString.split('&');

            for(let i = 0, imax = paramString.length; i < imax; i++){
                let kv = paramString[i].split('=');
                params[kv[0]] = unescape(kv[1]);
            }

            this.populateForm(params);
        }
    }

    populateForm(params){
        for(let key in params){
            let $elem = this.$worksheetInput.find(':input[name="' + key +'"]')

            if(key != 'patientName'){
                $elem.val([params[key]]);
            } else{
                $elem.val(this.defaultPatient);
            }

            if($elem[0].nodeName == 'SELECT'){
                $elem.change();
            }
        }

        $('#patientName').val(this.defaultPatient);
        $('#updateBtn').click();
    }

    fill(csv){
        this.csv = csv;

        // fill surgery select
        let options = [];

        for(let i = 0, imax = csv.length; i < imax; i++){
            let value = this.csv[i]['surgery_bin'];
            // make sure value is not already in array (prevent duplicates)
            if(value && options.indexOf(value) < 0){
                options.push(value);
            }
        }

        // put values in select
        this.populateSelect('surgery_bin_select', options);

        // fill prescription select
        for(let drug in this.prescriptions){
            $('#prescriptionDrug').append($('<option>').val(drug).html(drug));
        }

        this.addEvents();
        this.checkURL();
    }

    addEvents(){
        // surgery select event, update approaches
        $('#surgery_bin_select').change((evt) => {
            let surgery = $(evt.target).find(':selected').text();
            let approaches = [];

            for(let i = 0, imax = this.csv.length; i < imax; i++){
                let row = this.csv[i];
                let approach = row['approach'];

                if(row['surgery_bin'] == surgery && approaches.indexOf(approach) < 0){
                    approaches.push(approach);
                }
            }

            this.populateSelect('approachSelect', approaches, true);
        });

        $('#updateBtn').click(() => {
            let formObj = this.jsonify(this.$worksheetInput);
            let csvMatch = this.matchToCsv(formObj);

            if(csvMatch){
                let selection = this.mergeObjects(csvMatch, formObj);

                console.log(selection);

                this.updateText(selection);
                this.pain.moveArrow(selection.perc_pain_int);
                this.calendar.drawAll(selection, this.prescriptions);
            }
        });

        $('#clearBtn').click(() => {
            this.$worksheetInput.trigger('reset');
            this.clearText();
            $('#painImg').removeAttr('src');
            $('#calendar').empty();
            $('#approachSelect').empty();
            document.getElementById('prescriptionStartDate').valueAsDate = new Date();
        });

        $('#printBtn').click(() => {
            window.print();
        });

        $('#copyPermalink').click(() => {
            let url = window.location.origin + window.location.pathname + '?';
            let params = this.jsonify(this.$worksheetInput);

            for(key in params){
                if(key != 'patientName'){
                    url += key + '=' + params[key] + '&';
                }
            }

            url = url.slice(0, -1) // remove trailing &
            $text = $('#permalinkText');
            $('#permalinkText').text(url)
            $text.show();
            $text[0].select();
            document.execCommand('copy');
            $text.hide();
        });
    }

    populateSelect(id, options, empty = false){
        // populate selection element with options
        let $select = $('#' + id);

        if(empty){ $select.empty(); }

        for(let i = 0, imax = options.length; i < imax; i++){
            $select.append($('<option>').html(options[i]));
        }
    }

    updateText(selection){
        /* Updates text in elements with "updateText" class
        the next class in the class will be the field the text is updated with

        example:

            <span class="updateText perc_refill"></span>

        will update with percthis.refill field.
        */
        $('.updateText').each(function(i, item){
            let $item = $(item);
            let field = $item[0].classList[1]
            let formValue = selection[field];

            if(field == 'prescriptionStartDate'){
                let dateParts = formValue.split('-');
                formValue = new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2]);
                formValue = new Date(formValue).toDateString();
            }

            formValue = isNaN(formValue) ? formValue : Math.round(formValue);
            $item.text(formValue);
        });

        $('.refill_bin').each(function(i, element){
            let perc_refill = selection['perc_refill'];
            let text = '';

            if(perc_refill < 10){
                text = 'A small minority of';
            } else if(perc_refill <= 20){
                text = 'A minority of';
            } else{
                text = 'Some';
            }

            $(element).text(text);
        });
    }

    clearText(){
        $('.updateText').each(function(i, item){
            $item.text('');
        });
    }

    // turn form into json object
    jsonify(form){
        let obj = {};

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
    mergeObjects(obj1, obj2){
        let newObj = {}

        Object.keys(obj1).forEach(function(key){ newObj[key] = obj1[key]; });
        Object.keys(obj2).forEach(function(key){ newObj[key] = obj2[key]; });

        return newObj;
    }

    // match current form item to item in csv
    matchToCsv(form){
        for(let i = 0, imax = this.csv.length; i < imax; i++){
            let isMatch = true;
            let row = this.csv[i];

            // loop through form values
            for(let key in form){
                let value = form[key];

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
}
