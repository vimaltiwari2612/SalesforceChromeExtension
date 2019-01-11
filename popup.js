
var $jq = jQuery.noConflict();
$jq(document).ready(function()
{
  var tabUrl;

  // leverage for stripping out everything but the domain
  function url_domain(data) 
  {
    var a = document.createElement('a');
    a.href = data;
    return a.hostname;
  }

  function hasRespondedError(results){
	  // clear previous results
	   $jq('#query-results').html('');
	   if (results == null || results.error)
		{
			var tableHtml = '<table id="errorTable"><tr>';
			tableHtml += '<td colspan="2" align="center" style="font-size:medium">Search Failed.</td></tr><tr>';
			tableHtml += '<td> <b> Error </b> <br/>' + results.response.responseJSON[0].errorCode+'</td>';
			tableHtml += '<td> <b> Message </b> <br/>' + results.response.responseJSON[0].message+'</td></tr></table>';
			$jq('#errors').html(tableHtml);
			$jq('#errorTable').css({"font-family": "arial, sans-serif" , "border-collapse": "collapse","color":"white"});
			$jq('#errorTable td').css({"border": "1px solid #dddddd", "padding": "8px", "text-align": "left"});
			return true;
		}
		return false;
  }
	
  function buildSOQLResults(results)
  {
 
	if(hasRespondedError(results) == true) return ;
    else
    {
		$jq('#errors').html('');
      // build table header
      if (results.queryResults.records.length > 0)
      {
        // TODO - need to get the pretty labels
        var fields = Object.keys(results.queryResults.records[0]);
        // get rid of attributes, its not an actual field
        fields.splice(0, 1);

        // TODO - need to HTML escape the values
        var tableHtml = '<table id="soqlTable"><tr>';
        fields.forEach(function(field_name)
        {
          tableHtml += '<th>' + field_name + '</th>';
        });
        tableHtml += '</tr>';

        results.queryResults.records.forEach(function(record)
        {
          // TODO - need to more smartly show join fields (right now its an object)

          tableHtml += '<tr>';

          fields.forEach(function(field_name)
          {
            tableHtml += '<td>';
            if (field_name === 'Id' )
            {
              // TODO - clean this up
              // want to keep the "/" in order to build the URL
              var record_id = record['attributes']['url'].substring(record['attributes']['url'].lastIndexOf('/'));
              tableHtml += '<a href="' + tabUrl + record_id + '" target="_blank" style="color:greenyellow">' + record[field_name] + '</a>';
            }
            else
            {
              tableHtml += (record[field_name]!=null)?record[field_name]:"" ;
            }
            tableHtml + '</td>';
          });

          tableHtml += '</tr>';
        });
        tableHtml += '</table>';

        $jq('#query-results').html(tableHtml);
		$jq('#soqlTable').css({"font-family": "arial, sans-serif" , "border-collapse": "collapse","color":"white"});
		$jq('#soqlTable td, th').css({"border": "1px solid #dddddd", "padding": "8px", "text-align": "left"});
		
      }
    }
  }

	function buildObjectFieldTable(results){
		
		if(hasRespondedError(results) == true) return ;
		else
			{
				$jq('#errors').html('');
				var allowedCols = [{
									"name": "Label",
									"val": "label"
								},
								{
									"name": "API Name",
									"val": "name"
								},
								{
									"name": "Type",
									"val": "type"
								}
				];
			  // build table header
			  if (results.queryResults.fields.length > 0)
			  {
				  
				
				var fieldKeys = Object.keys(results.queryResults.fields);
				var tableHtml = '<table id="fieldTable" style="border:1px solid black;"><tr>';
				var headerVal = results.queryResults.fields[0];
				for(val in allowedCols){
					tableHtml += '<th  align="right">' + String(allowedCols[val].name).trim()+ '</th>';
				}
				tableHtml += '</tr>';
				fieldKeys.forEach(function(key)
				{
					tableHtml += '<tr>';
					var item = results.queryResults.fields[key];
					
					for(val in allowedCols){
						tableHtml += '<td  align="right">' + String(item[allowedCols[val].val]).trim() + '</td>';	
					}
					tableHtml += '</tr>';
				});
				
				tableHtml += '</table>';

				$jq('#query-results').html(tableHtml);
				$jq('#fieldTable').css({"font-family": "arial, sans-serif" , "border-collapse": "collapse","color":"white"});
				$jq('#fieldTable td, th').css({"border": "1px solid #dddddd", "padding": "8px", "text-align": "left"});
				
			  }
			}
	}
	

  function queryClient(queryString)
  {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
    {
		
      chrome.tabs.sendMessage(tabs[0].id, {name: $jq('.dropdown').find('input').val(), queryString: queryString}, function(response)
      {
       if(response === undefined){
		   setResponseForUndefined(response);
		   return;
	   }
		if(response.queryString == "forceObjectFields")
			buildObjectFieldTable(response);
		
		if(response.queryString == "forcequery")
			 buildSOQLResults(response);
      });
    });
  };

	function setResponseForUndefined(results){
		var tableHtml = '<table id="errorTable"><tr>';
			tableHtml += '<td colspan="2" align="center" style="font-size:medium">Connection Lost. Please refresh the active chrome tab.</td></tr></table>';
			$jq('#errors').html(tableHtml);
			$jq('#errorTable').css({"font-family": "arial, sans-serif" , "border-collapse": "collapse","color":"white"});
			$jq('#errorTable td').css({"border": "1px solid #dddddd", "padding": "8px", "text-align": "left"});
	}

  // build salesforce domain for hyperlinks later
  chrome.tabs.getSelected(null, function(tab)
  {
    tabUrl = 'https://' + url_domain(tab.url);
  });
  
   var jsonData = {
            data: [{
                "name": "SOQL",
                "val": "forcequery"
            },
			{
                "name": "Fields of an Object",
                "val": "forceObjectFields"
            }]
        };
		
        $jq.each(jsonData.data, function (key, value) {
            //$jq("#dropDownList").append($jq('<option></option>').val(value.val).html(value.name));
			$jq("#dropDownList").append($jq('<li id="'+value.val+'"></li>').html(value.name));
        });

      
$jq('#submit-query').click(function(event)
  {
	$jq('#errors').html('');
    var query = $jq('#query').val();
	var optionSelected = $jq('.dropdown').find('input').val();
	if(query == null || query.trim() == "" || optionSelected == null || optionSelected.trim() == "") {
		var tableHtml = '<table id="errorTable"><tr>';
		tableHtml += '<td colspan="2" align="center" style="font-size:medium">Please select an option & Enter search data!</td></tr></table>';
		$jq('#errors').html(tableHtml);
		$jq('#errorTable').css({"font-family": "arial, sans-serif" , "border-collapse": "collapse","color":"white"});
		$jq('#errorTable td').css({"border": "1px solid #dddddd", "padding": "8px", "text-align": "left"});
		return;
	  }
	  
    queryClient(query);   
  });

     /*Dropdown Menu*/
		$jq('.dropdown').click(function () {
				$jq('#errors').html('');
				$jq(this).attr('tabindex', 1).focus();
				$jq(this).toggleClass('active');
				$jq(this).find('.dropdown-menu').slideToggle(300);
			});
			$jq('.dropdown').focusout(function () {
				$jq(this).removeClass('active');
				$jq(this).find('.dropdown-menu').slideUp(300);
			});
			$jq('.dropdown .dropdown-menu li').click(function () {
				$jq(this).parents('.dropdown').find('span').text($jq(this).text());
				$jq(this).parents('.dropdown').find('input').attr('value', $jq(this).attr('id'));
			});
		/*End Dropdown Menu*/
 
});