var form = (function(){
    // prescriptions with mme conversion
    var _prescriptions = {
        'codeine': 0.15,
        'hydrocodone': 1,
        'hydromorphone': 4,
        'morphine': 1,
        'oxycodone': 1.5,
        'oxymorphone': 3
    };
    
    var _defaultPatient = 'Patient X';
    
    var _$worksheetInput = null;
    var _csv = null
    
    function init(){
        _$worksheetInput = $('#worksheetInput');
    }
    
    function _checkURL(){
        var url = document.URL;
        
        if(url.includes('?')){
            var paramString = url.split('?')[1];
            var params = {};
            paramString = paramString.split('&');
            
            for(var i = 0, imax = paramString.length; i < imax; i++){
                var kv = paramString[i].split('=');
                params[kv[0]] = unescape(kv[1]);
            }
            
            _populateForm(params);
        }
    }
    
    function _populateForm(params){
        for(key in params){
            var $elem = _$worksheetInput.find(':input[name="' + key +'"]')
            
            if(key != 'patientName'){
                $elem.val([params[key]]);
            } else{
                $elem.val(_defaultPatient);
            }
            
            if($elem[0].nodeName == 'SELECT'){
                $elem.change();
            }
        }
        
        $('#patientName').val(_defaultPatient);
        $('#updateBtn').click();
    }

    function fill(csv){
        _csv = csv;
        
        // fill surgery select
        var options = [];
        
        for(var i = 0, imax = csv.length; i < imax; i++){
            var value = _csv[i]['surgery_bin'];
            // make sure value is not already in array (prevent duplicates)
            if(value && options.indexOf(value) < 0){
                options.push(value);
            }
        }
        
        // put values in select
        _populateSelect('surgery_bin_select', options);        
        
        // fill prescription select
        for(var drug in _prescriptions){
            $('#prescriptionDrug').append($('<option>').val(drug).html(drug));
        }
        
        _addEvents();
        _checkURL();
    }
    
    function _addEvents(){
        // surgery select event, update approaches
        $('#surgery_bin_select').change(function(){
            var surgery = $(this).find(":selected").text();
            var approaches = [];
            
            for(var i = 0, imax = _csv.length; i < imax; i++){
                var row = _csv[i];
                var approach = row['approach'];
                
                if(row['surgery_bin'] == surgery && approaches.indexOf(approach) < 0){
                    approaches.push(approach);
                }
            }
            
            _populateSelect('approachSelect', approaches, true);
        });
    
        $('#updateBtn').click(function(evt){
            var formObj = _jsonify(_$worksheetInput);
            var csvMatch = _matchToCsv(formObj);
            
            if(csvMatch){
                var selection = _mergeObjects(csvMatch, formObj);
                
                console.log(selection);
            
                _updateText(selection);
                pain.moveArrow(selection.perc_pain_int);
                calendar.drawAll(selection, _prescriptions);
            }
        });
        
        $('#clearBtn').click(function(evt){
            _$worksheetInput.trigger('reset');
            _clearText();
            $('#painImg').removeAttr('src');
            $('#calendar').empty();
            $('#approachSelect').empty();
            document.getElementById('prescriptionStartDate').valueAsDate = new Date();
        });
        
        $('#printBtn').click(function(evt){
            window.print();
        });
        
        $('#copyPermalink').click(function(evt){
            var url = window.location.origin + window.location.pathname + '?'; 
            var params = _jsonify(_$worksheetInput);
            
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

    function _populateSelect(id, options, empty = false){
        // populate selection element with options
        var $select = $('#' + id);
        
        if(empty){ $select.empty(); }
        
        for(var i = 0, imax = options.length; i < imax; i++){
            $select.append($('<option>').html(options[i]));
        }
    }
    
    function _updateText(selection){
        /* Updates text in elements with "updateText" class
        the next class in the class will be the field the text is updated with
        
        example:
        
            <span class="updateText perc_refill"></span>
        
        will update with perc_refill field.
        */
        $('.updateText').each(function(i, item){
            var $item = $(item);
            var field = $item[0].classList[1]
            var formValue = selection[field];
            
            if(field == 'prescriptionStartDate'){
                var dateParts = formValue.split('-');
                formValue = new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2]);
                formValue = new Date(formValue).toDateString();
            }
            
            formValue = isNaN(formValue) ? formValue : Math.round(formValue);
            $item.text(formValue);
        });
    }
    
    function _clearText(){
        $('.updateText').each(function(i, item){
            $item.text('');
        });
    }

    // turn form into json object
    function _jsonify(form){
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
    function _mergeObjects(obj1, obj2){
        var newObj = {}
        
        Object.keys(obj1).forEach(function(key){ newObj[key] = obj1[key]; });
        Object.keys(obj2).forEach(function(key){ newObj[key] = obj2[key]; });
        
        return newObj;
    }

    // match current form item to item in csv
    function _matchToCsv(form){
        for(var i = 0, imax = _csv.length; i < imax; i++){
            var isMatch = true;
            var row = _csv[i];
            
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
    
    return {
        init: init,
        fill: fill
    }
})();


