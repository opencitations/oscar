
//GLOBALS
var oscar_tags = document.getElementsByClassName("__oscar__");
var oscar_doms = [];

//Get OSCAR parameters from the HTML tag
for (var i = 0; i < oscar_tags.length; i++) {
	var oscar_container = oscar_tags[i];

	var data_type = 'advanced';
	if(oscar_container.getAttribute('data-type') != undefined){ data_type = oscar_container.getAttribute('data-type')}

	var data_view = ['rows_per_page','sort_results','export_results'];
	if(oscar_container.getAttribute('data-view') != undefined){
		data_view = oscar_container.getAttribute('data-view');
		data_view = data_view.split(" ");
	}

	var data_filter = ['limit_results','filter_fields'];
	if(oscar_container.getAttribute('data-filter') != undefined){
		data_filter = oscar_container.getAttribute('data-filter');
		data_filter = data_filter.split(" ");
	}

	oscar_doms.push(
		{
			'container': oscar_container,
			'data-type': data_type,
			'data-view': data_view,
			'data-filter': data_filter
		}
	);
}

//Build all the inner elements
for (var i = 0; i < oscar_doms.length; i++) {

	var str_html_inner = '<div id="search_extra" class="search-extra"></div>';
	//OSCAR view section
	if (oscar_doms[i]["data-view"].length != 0) {
		str_html_inner = str_html_inner + '<div id="search_header" class="search-header">';
		for (var j = 0; j < data_view.length; j++) {
			str_html_inner = str_html_inner + '<div id='+data_view[j]+'></div>';
		}
		str_html_inner = str_html_inner + '</div>';
	}
	str_html_inner = str_html_inner + '<div id="search_body" class="search-body">';

	//OSCAR filter section
	if (oscar_doms[i]["data-filter"].length != 0) {
		str_html_inner = str_html_inner + '<div id="search_filters" class="search-filters">';
		for (var j = 0; j < data_filter.length; j++) {
			switch (data_filter[j]) {
				case 'limit_results':
						str_html_inner = str_html_inner + '<div id='+data_filter[j]+'></div><div id="filter_btns"></div>';
					break;
				case 'filter_fields':
							str_html_inner = str_html_inner + '<div id="filter_values_list"></div>';
					break;
				default:
						str_html_inner = str_html_inner + '<div id='+data_filter[j]+'></div>';
			}

		}
		str_html_inner = str_html_inner + '</div>';
	}

	//always put the table of results
	str_html_inner = str_html_inner + '<div id="search_results" class="search-results"></div></div>';

	//put it inside the page
	oscar_doms[i]['container'].innerHTML = '<div id="search" class="search">'+ str_html_inner + '</div>';
}



var search = (function () {

		var search_conf_json = {};
		var cat_conf = {};
		var sparql_results;
		var sparql_query_add;
		var ext_data_calls_cache = {};
		//var cache_data = {};
		var async_call;
		var table_conf ={
				data_key: null,
				data: null,
				category: "",
				filters : {"limit":null, "arr_entries":[], "fields":[], "data":null},
				view: {"data": null, "page": 0, "page_limit": null, "fields_filter_index":{}, "sort": {"field":null, "order":null, "type":null}}
		}

		function init_oscar_obj(){
			return {
					'search_conf_json' : {},
					'cat_conf' : {},
					'sparql_results' : null,
					'sparql_query_add' : null,
					'ext_data_calls_cache' : {},
					'async_call': null,
					'table_conf' : {
							'data_key' : null,
							'data': null,
							'category': "",
							'filters' : {"limit":null, "arr_entries":[], "fields":[], "data":null},
							'view': {"data": null, "page": 0, "page_limit": null, "fields_filter_index":{}, "sort": {"field":null, "order":null, "type":null}}
					}
			}
		}

		function reload_oscar_obj(obj){
			search_conf_json = obj['search_conf_json'];
			cat_conf = obj['cat_conf'];
			sparql_results = obj['sparql_results'];
			sparql_query_add = obj['sparql_query_add'];
			ext_data_calls_cache = obj['ext_data_calls_cache'];
			async_call = obj['async_call'];
			table_conf = obj['table_conf'];
		}


		/* get the rules that matches my query_text*/
		function _get_rules(query_text) {
			var arr_rules = [];
			for (i = 0; i < search_conf_json["rules"].length; i++) {
				var rule_obj = search_conf_json["rules"][i];
				if (!util.is_undefined_key(rule_obj,"freetext")){
					if (rule_obj["freetext"]==true) {
						var re = new RegExp(rule_obj["regex"]);
						console.log(query_text, re);
						if (query_text.match(re)) {
							console.log("Match with rule number"+String(i));
							//return search_conf_json["rules"][i];
							arr_rules.push(rule_obj);
						}
					}
				}
			}
			return arr_rules;
		}

		/*get rule entry with given name*/
		function _get_rule_by_name(name){
			for (i = 0; i < search_conf_json["rules"].length; i++) {
				if (search_conf_json["rules"][i]['name'] == name) {
					return search_conf_json["rules"][i];
				}
			}
			return -1;
		}

		/*build a string with all the prefixes in a turtle format*/
		function _build_turtle_prefixes(){
			var turtle_prefixes = "";
			for (var i = 0; i < search_conf_json.prefixes.length; i++) {
				var pref_elem = search_conf_json.prefixes[i];
				turtle_prefixes = turtle_prefixes+" "+"PREFIX "+pref_elem["prefix"]+":<"+pref_elem["iri"]+"> ";
			}
			return turtle_prefixes;
		}

		/*build a string representing the sparql query in a turtle format*/
		function _build_turtle_query(arr_query){
			var turtle_prefixes = "";
			for (var i = 0; i < arr_query.length; i++) {
				turtle_prefixes = turtle_prefixes +" "+ arr_query[i];
			}
			return turtle_prefixes;
		}

		/*decode uri path and retieve advanced search variables*/
 		function _decode_uri_query_components(querytext){

				var qtext = decodeURIComponent(querytext.replace(/\+/g, '%20')+'');
				var parser = new DOMParser;
				var dom = parser.parseFromString('<!doctype html><body>' + qtext,'text/html');
				qtext = dom.body.textContent;

				var res = {"values": [],"rules": [],"bcs": []};
				var item;

				//decode all values
				let reg = /text=(.+?)(?=&rule|$)/g;
				let match;
				while (match = reg.exec(qtext)) {
					res.values.push(match[1]);
				}

				//decode all rules
				reg = /rule=(.+?)(?=&bc|$)/g;
				while (match = reg.exec(qtext)) {
					res.rules.push(match[1]);
				}

				//decode all boolean connectors
				reg = /bc_\d{1,}=(and|or|and_not)/g;
				while (match = reg.exec(qtext)) {
					res.bcs.push(match[1]);
				}

				return res;
		}

		/*build the SPARQL query by replacing all the variables*/
		function _build_sparql_query(rule, qtext){

			if (rule != undefined) {
				var re = new RegExp(rule.regex,'i');
				var val_qtext = qtext.match(re)[0];

				cat_conf = search_conf_json.categories[util.index_in_arrjsons(search_conf_json.categories,["name"],[rule.category])];

				var rule_query = _build_turtle_query(rule.query);
				var res_heuristics = _apply_heuristics(rule,val_qtext);
				if (res_heuristics != -1) {
					res_heuristics.values.unshift(val_qtext);
					res_heuristics.rules.unshift(rule);
					rule_query = _connect_rules(res_heuristics.values, res_heuristics.rules, res_heuristics.connectors, true);
				}else {
					rule_query = rule_query.replace(/\[\[VAR\]\]/g, val_qtext);
				}

				//build the sparql query in turtle format
				sparql_query = _build_turtle_prefixes() + _build_turtle_query(cat_conf["macro_query"]);
				sparql_query = sparql_query.replace(/\[\[RULE\]\]/g, rule_query);

				return sparql_query;
			}
			return -1;
		}
		/*To do an advanced call i need  N textual inputs for N rules with N-1 logic connectors*/
		function build_adv_sparql_query(qtext_arr, rule_names, lconnectors){

			//console.log(qtext_arr);
			//console.log(rule_names);
			//console.log(lconnectors);

			if (rule_names.length > 0) {

				var query_label = qtext_arr[0];
				for (var i = 0; i < lconnectors.length; i++) {
					query_label = query_label+"  ["+lconnectors[i]+"]  "+qtext_arr[i+1];
				}

				var rules = [];
				for (var i = 0; i < rule_names.length; i++) {
					rules.push(_get_rule_by_name(rule_names[i]));
				}

				/*match values inside qtext_arr with the corresponding rule regex*/
				for (var i = 0; i < rules.length; i++) {
					var re = new RegExp(rules[i].regex,'i');
					var qtext_match = qtext_arr[i].match(re);
					if (qtext_match != null) {
						qtext_arr[i] = qtext_arr[i].match(re)[0];

					}else {
						continue;
					}
				}


				//define category from the first rule
				//var category = _get_rule_by_name(rule_names[0]).category;
				//cat_conf = search_conf_json.categories[util.index_in_arrjsons(search_conf_json.categories,["name"],[category])];

				var composed_query = _build_turtle_prefixes() + _build_turtle_query(cat_conf["macro_query"]);
				var query_allrules = _connect_rules(qtext_arr, rules, lconnectors);

				var sparql_query = composed_query.replace(/\[\[RULE\]\]/g, query_allrules);
				//console.log(sparql_query);
				//console.log(sparql_query);
				return sparql_query;
			}
		}
		/*Takes an array-of-values, an array of rules objects, an array of boolean connectors
		and retrieves a textual sparql format with the rules all connected
		in case you are calling this function to build the heuristics, flag_heuristics need to be set true*/
		function _connect_rules(qtext_arr, rules, lconnectors, flag_heuristics = false) {
			var new_arr_qrules = [];
			for (var i = 0; i < rules.length; i++) {

				var rule = rules[i];
				var rule_query = rule.query;

				//if i am connecting heuristics rule do iterate deep
				if (! flag_heuristics) {
					//check heuristics
					var res_heuristics = _apply_heuristics(rule,qtext_arr[i]);
					if (res_heuristics != -1) {
						//push original value and rule
						res_heuristics.values.unshift(qtext_arr[i]);
						res_heuristics.rules.unshift(rules[i]);
						rule_query = _connect_rules(res_heuristics.values, res_heuristics.rules, res_heuristics.connectors, true);
						new_arr_qrules.push(rule_query);

					}else {
						new_arr_qrules.push(__replace_query_var(qtext_arr[i], rule_query));
					}
				}else {
					new_arr_qrules.push(__replace_query_var(qtext_arr[i], rule_query));
				}
			}

			var arr_step1 = __connect_and(new_arr_qrules, lconnectors);
			lconnectors = util.remove_val_in_arr(lconnectors, "and");
			var arr_step2 = __connect_or(arr_step1, lconnectors);

			var res_query = "";
			for (var i = 0; i < arr_step2.length; i++) {
				res_query = res_query + " " + arr_step2[i];
			}

			return res_query;

			//AND AND_NOT
			function __connect_and(arrq, connectors) {
				var new_arr_qrules = arrq;
				var lconnectors = connectors;
				var arr_step1 = [];
				if (new_arr_qrules.length > 0) {
					var entry = new_arr_qrules[0];
					var i = 0;
					while (i+1 < new_arr_qrules.length) {
						if (lconnectors[i] != undefined) {
							if (lconnectors[i] == "and") {
								entry = entry + " " + new_arr_qrules[i+1];
								i++;
								continue;
							}else {
								if (lconnectors[i] == "and_not") {
									entry = entry + " MINUS{" + new_arr_qrules[i+1] + "} ";
									i++;
									continue;
								}else {
									arr_step1.push(entry);
								}
							}
						}else {
							break;
						}
						i++;
						entry = new_arr_qrules[i];
					}
					//insert last entry created
					arr_step1.push(entry);
				}
				return arr_step1;
			}
			//OR
			function __connect_or(arrq, connectors) {
				var arr_step1 = arrq;
				var lconnectors = connectors;

				var arr_step2 = [];
				var i = 0;
				arr_step2.push("{"+arr_step1[0]+"}");
				for (var i = 0; i < lconnectors.length; i++) {
					if (lconnectors[i] == "or") {
						arr_step2.push("UNION");
						arr_step2.push("{"+arr_step1[i+1]+"}");
					}
				}
				return arr_step2;
			}

			function __replace_query_var(qtext, rule_query){
				var query_txt = _build_turtle_query(rule["query"]);
				if (qtext != null) {
					return query_txt.replace(/\[\[VAR\]\]/g, qtext);
				}else {
					return query_txt.replace(/\[\[VAR\]\]/g, "");
				}
			}
		}

		/*apply the heuristics of a 'rule' with a given textual input*/
		function _apply_heuristics(rule,val_qtext){
			//heuristics check
			if (!util.is_undefined_key(rule, "heuristics")) {
				if (rule.heuristics.length > 0) {

					//i have heuristics to apply
					var heuristic_vals_arr = [];
					for (var i = 0; i < rule.heuristics.length; i++) {
						var heuristic_arr_elem = rule.heuristics[i];
						var heuristic_val_text = val_qtext;
						for (var j = 0; j < heuristic_arr_elem.length; j++) {
							var heuristic_fun = heuristic_arr_elem[j];
							heuristic_val_text = Reflect.apply(heuristics[heuristic_fun],undefined,[heuristic_val_text]);
						}
						//in case the value originated from the heuristic is different than the original one
						if (heuristic_val_text != val_qtext) {
							heuristic_vals_arr.push(heuristic_val_text);
						}
					}

					//i have heuristics to apply
					var heuristic_rule_arr = [];
					var heuristic_bcs_arr = [];
					//populate arr of rules
					for (var i = 0; i < heuristic_vals_arr.length; i++) {
						heuristic_rule_arr.push(rule);
					}
					//populate arr of bcs
					for (var i = 0; i < heuristic_vals_arr.length; i++) {
						heuristic_bcs_arr.push("or");
					}
					return {"values":heuristic_vals_arr, "rules":heuristic_rule_arr, "connectors":heuristic_bcs_arr};
				}
			}
			return -1;
		}

		/*call the SPARQL end point through a GET*/
		function _call_ts(rule_category, rules, rule_index, sparql_query, query_text=null, query_label=null, callbk_fun=null){
			//use this url to contact the sparql_endpoint triple store
			var query_contact_tp = String(search_conf_json.sparql_endpoint)+"?query="+ encodeURIComponent(sparql_query) +"&format=json";

			//reset all doms
			htmldom.reset_html_structure();

			//put a loader div
			if (util.get_obj_key_val(search_conf_json,"progress_loader.visible") == true) {
				htmldom.loader(true,search_conf_json["progress_loader"],query_label);
			}

			//call the sparql end point and retrieve results in json format
			$.ajax({
						dataType: "json",
						url: query_contact_tp,
						type: 'GET',
						async: async_call,
						timeout: util.get_obj_key_val(search_conf_json,"timeout.value"),
						error: function(jqXHR, textStatus, errorThrown) {
        				if(textStatus==="timeout") {
									var redirect_text = util.get_obj_key_val(search_conf_json,"timeout.text");
									if (redirect_text != undefined) {
										if (callbk_fun != null) {

											Reflect.apply(callbk_fun,undefined,[
														callbk_query,
														JSON.parse(JSON.stringify(table_conf)),
														JSON.parse(JSON.stringify(cat_conf)),
														true]);

										 //_init_data({'results':{'bindings':[]}},callbk = callbk_fun, callbk_query = query_text, check_and_update = false);
									 }else {
									 	 	htmldom.loader(false, search_conf_json["progress_loader"], on_remove_text = redirect_text);
									 }
									}else {
										var redirect_link = util.get_obj_key_val(search_conf_json,"timeout.link");
										if (redirect_link != undefined) {
											window.location.replace(redirect_link);
										}
									}
        				}
    				},
						success: function( res_data ) {

								if (util.get_obj_key_val(search_conf_json,"interface") != false) {
									if (util.get_obj_key_val(search_conf_json,"progress_loader.visible") == true) {
										htmldom.loader(false, search_conf_json["progress_loader"]);
									}
								}

								if ((rule_index >= rules.length -1) || (res_data.results.bindings.length > 0)) {
									sparql_results = res_data;
									//I have only 1 rule
									cat_conf = rule_category;

									//in this case don't build the table directly
									if (callbk_fun != null) {
									 //look at the rule name
									 _init_data(res_data,callbk = callbk_fun, callbk_query = query_text, check_and_update = false);
								 }else {
								 	 build_table(res_data);
								 }

								}else {
										var sparql_query = _build_sparql_query(rules[rule_index+1], query_text);
										if(sparql_query != -1){
												var r_cat = search_conf_json.categories[util.index_in_arrjsons(search_conf_json.categories,["name"],[rules[rule_index+1].category])];
												_call_ts(r_cat, rules, rule_index + 1, sparql_query, query_text, query_text, callbk_fun);
										}else {
											//in this case we have no more rules
											window.location.replace(search_conf_json.timeout.link);
										}
								}
						}
			 });
			 return sparql_results;
		}

		function build_table(results_data, do_init = true){
			var res_data = JSON.parse(JSON.stringify(results_data));

			//reset all doms
			htmldom.reset_html_structure();

			if (do_init) {
				_init_data(res_data);
			}else {
				_init_data(res_data, callbk = null, callbk_query = null, check_and_update = true);
			}

			htmldom.build_extra_elems(cat_conf.extra_elems);
			_build_filter_sec();
			_limit_results();
			//_gen_data_checkboxes();
			htmldom.filter_checkboxes(table_conf);
			_build_header_sec();
			_sort_results();
			htmldom.update_res_table(table_conf,search_conf_json);
			return {
				"table_conf": JSON.parse(JSON.stringify(table_conf)),
				"cat_conf": JSON.parse(JSON.stringify(cat_conf)),
				"search_conf_json": JSON.parse(JSON.stringify(search_conf_json))
			};
		}

		function change_search_data(all_data, check_and_update = false){
			table_conf = JSON.parse(JSON.stringify(all_data.table_conf));
			cat_conf = JSON.parse(JSON.stringify(all_data.cat_conf));
			search_conf_json = JSON.parse(JSON.stringify(all_data.search_conf_json));

			//update in case we have external calls results now, the new table will be updated
			if (check_and_update) {
					_update_ext_data_in_table();
			}


			if (table_conf.data != null) {
				_exec_operation();
			}
		}

		function get_search_data(rule = null, native = false, config_mod = null) {
			var my_search_conf_json = JSON.parse(JSON.stringify(search_conf_json));

			if (native) {
				my_search_conf_json = JSON.parse(JSON.stringify(search_conf));
				//in case of functions copy them again
				my_search_conf_json = _scan_for_funcname(my_search_conf_json);
				if (config_mod != null) {
					my_search_conf_json = util.update_obj(my_search_conf_json, config_mod);
				}
			}

			return {
				"table_conf": JSON.parse(JSON.stringify(table_conf)),
				"cat_conf": JSON.parse(JSON.stringify(cat_conf)),
				"search_conf_json": my_search_conf_json
			};

			function _scan_for_funcname(my_search_conf_json) {
				for (var i = 0; i < my_search_conf_json['rules'].length; i++) {
					if ('heuristics' in my_search_conf_json['rules'][i]){
						my_search_conf_json['rules'][i]['heuristics'] = search_conf['rules'][i]['heuristics'];
					}
				}
				return my_search_conf_json;
			}
		}

		/*THE MAIN FUNCTION CALL
		call the sparql endpoint and do the query 'qtext'*/
		function do_sparql_query(qtext, alternative_conf = false , config_mod = null, async_bool= true, callbk_fun= null){

			var query_comp =  _decode_uri_query_components(qtext);
			console.log("This query is composed by:");
			console.log("The values: "+query_comp.values);
			console.log("The rules: "+query_comp.rules);
			console.log("The connectors: "+query_comp.bcs);

			//initialize and get the search_config_json
			if (!alternative_conf) {
				search_conf_json = search_conf;
			}

			//console.log("The search conf: ", JSON.parse(JSON.stringify(search_conf_json)));


			//sync or async
			async_call = async_bool;

			//modify config file
			//search_conf_json = util.update_obj(search_conf_json, config_mod);

			if (query_comp.values.length != 0) {
				if (query_comp.rules.length == 0) {
					//console.log("It's a freetext search!");
					//one text box
					var qtext = query_comp.values[0];
					console.log(qtext);
					var rules = _get_rules(qtext);
					console.log("This is not a composed/advanced search. It is a freetext search. The matching Rules are: ",rules);
					if(rules.length != 0){
						var sparql_query = _build_sparql_query(rules[0], qtext);
						console.log(sparql_query);
						var r_cat = search_conf_json.categories[util.index_in_arrjsons(search_conf_json.categories,["name"],[rules[0].category])];
						_call_ts(r_cat, rules, 0, sparql_query, qtext, qtext, callbk_fun);
					}else {}
				}else{
					//in this case the category of results will follow any of the rules
					var first_rule = search_conf_json.rules[util.index_in_arrjsons(search_conf_json.rules,["name"],[query_comp.rules[0]])];
					cat_conf = search_conf_json.categories[util.index_in_arrjsons(search_conf_json.categories,["name"],[first_rule.category])];

					//it's an advanced query
					var sparql_query = build_adv_sparql_query(
											query_comp.values,
											query_comp.rules,
											query_comp.bcs
										);

					var r_cat = search_conf_json.categories[util.index_in_arrjsons(search_conf_json.categories,["name"],[_get_rule_by_name(query_comp.rules[0]).category])];
					_call_ts(r_cat, [], 0, sparql_query, qtext, null, callbk_fun);
				}
			 }else {
					var val_adv = util.get_obj_key_val(search_conf_json,"advanced_search");
					if (val_adv == true) {
						//in case you want to build the advanced search interface
						switch_adv_category(search_conf_json.def_adv_category);
					}else{
						//in case you don't want the advanced search
						htmldom.main_entry(search_conf_json.search_base_path);
					}
			 }
		}

		/*update the table data (ext calls))*/
		function _update_ext_data_in_table() {
				table_conf.category = cat_conf.name;
				var category_conf_obj = cat_conf;
				var fields = category_conf_obj.fields;

				// check if there is ext_data columns also
				var ext_data_fields = [];
				for (var i = 0; i < fields.length; i++) {
					if (fields[i].value.startsWith("ext_data")) {
						var all_parts = fields[i].value.split(".");
						var data_field = "";
						var sep = ".";
						for (var j = 2; j < all_parts.length; j++) {
							if (j == all_parts.length-1) {
								sep = "";
							}
							data_field = data_field + all_parts[j] + sep;
						}
						ext_data_fields.push({
							"full_name": fields[i].value,
							"func_name": all_parts[1],
							"data_field": data_field
						});
					}
				}

				//console.log("CHECK AND UPDATE!!!");
				for (var i = 0; i < table_conf.data.results.bindings.length; i++) {

						for (var j = 0; j < ext_data_fields.length; j++) {
							var key_full_name = ext_data_fields[j]["full_name"];
							var key_func_name = ext_data_fields[j]["func_name"];
							var func_obj = category_conf_obj["ext_data"][key_func_name];
							if (func_obj != undefined) {
								var async_val = true;
								if (func_obj["async"] != undefined) {
										async_val = func_obj["async"];
								}

								table_conf.data.results.bindings[i][key_full_name] = {"value":"", "label":""};
								var ext_res = _exec_ext_data(
											key_func_name,
											func_obj,
											table_conf.data.results.bindings[i][table_conf.data_key].value,
											async_val,
											search.callbk_update_data_entry_val,
											key_full_name,
											func_obj.name,
											table_conf.data.results.bindings[i],
											ext_data_fields[j]["data_field"]
								);

							}
						}
				}
		}

		/*init all the local data*/
		function _init_data(json_data, callbk = null, callbk_query = null, check_and_update = false){
			table_conf.category = cat_conf.name;
			var category_conf_obj = cat_conf;


			//Adapt the resulting data
			// init uri values

			//TODOO function for oscar
			json_data.results.bindings = _init_val_map(json_data.results.bindings);
			json_data.results.bindings = _init_uris(json_data.results.bindings);
			json_data.results.bindings = _init_lbls(json_data.results.bindings);
			// order by the rows
			var order_by = category_conf_obj.order_by;
			if (order_by != undefined) {
					if ((order_by.keys != []) && (order_by.concats != [])) {
						json_data.results.bindings = util.order_by(json_data.results.bindings, order_by.keys, order_by.types, order = order_by.order);
					}
			}
			// group by the rows
			var group_by = category_conf_obj.group_by;
			if (group_by != undefined) {
				if ((group_by.keys != []) && (group_by.concats != [])) {
					json_data.results.bindings = util.group_by(json_data.results.bindings, group_by.keys, group_by.concats);
				}
			}

			//init the data
			table_conf.data = JSON.parse(JSON.stringify(json_data));
			//console.log(JSON.parse(JSON.stringify(json_data)));
			// keep only the fields I want
			var fields = category_conf_obj.fields;

			//assign the data key
			for (var i = 0; i < fields.length; i++) {
				if ("iskey" in fields[i]) {
					if (fields[i]["iskey"] == true) {
						table_conf.data_key = fields[i].value;
					}
				}
			}

			// check if there is ext_data columns also
			var ext_data_fields = [];
			for (var i = 0; i < fields.length; i++) {
				if (fields[i].value.startsWith("ext_data")) {
					var all_parts = fields[i].value.split(".");
					var data_field = "";
					var sep = ".";
					for (var j = 2; j < all_parts.length; j++) {
						if (j == all_parts.length-1) {
							sep = "";
						}
						data_field = data_field + all_parts[j] + sep;
					}
					ext_data_fields.push({
						"full_name": fields[i].value,
						"func_name": all_parts[1],
						"data_field": data_field
					});
				}
			}

			// the header first
			var new_header = [];
			for (var i = 0; i < table_conf.data.head.vars.length; i++) {
				//if the field not in my fields I will remove it
				if(util.index_in_arrjsons(fields,["value"],[table_conf.data.head.vars[i]]) != -1){
					new_header.push(table_conf.data.head.vars[i]);
				}
			}
			for (var i = 0; i < ext_data_fields.length; i++) {
				new_header.push(ext_data_fields[i]["full_name"]);
			}
			table_conf.data.head.vars = new_header;
			//console.log(table_conf.data.head.vars);

			// now the results
			for (var i = 0; i < table_conf.data.results.bindings.length; i++) {

				for (var j = 0; j < ext_data_fields.length; j++) {
					var key_full_name = ext_data_fields[j]["full_name"];
					var key_func_name = ext_data_fields[j]["func_name"];
					var func_obj = category_conf_obj["ext_data"][key_func_name];
					if (func_obj != undefined) {
						var async_val = true;
						if (func_obj["async"] != undefined) {
								async_val = func_obj["async"];
						}

						table_conf.data.results.bindings[i][key_full_name] = {"value":"", "label":""};
						var ext_res = _exec_ext_data(
									key_func_name,
									func_obj,
									table_conf.data.results.bindings[i][table_conf.data_key].value,
									async_val,
									search.callbk_update_data_entry_val,
									key_full_name,
									func_obj.name,
									table_conf.data.results.bindings[i],
									ext_data_fields[j]["data_field"]
						);

					}
				}
			}
			//console.log(table_conf.data.results.bindings);

			//set all the other table_conf fields
			//init all the filtered fields
			//-- filtered data
			table_conf.filters.data = JSON.parse(JSON.stringify(table_conf.data));

			//-- the filtered checked fields
			table_conf.filters.arr_entries = [];
			//init all the view fields
			table_conf.view.data = JSON.parse(JSON.stringify(table_conf.data));
			table_conf.view.page = 0;

			if (search_conf_json.page_limit != undefined) {
				if (search_conf_json.page_limit.length != 0) {
					table_conf.view.page_limit = search_conf_json.page_limit[0];
				}
			}

			table_conf.view.page_limit = 10;
			if (search_conf_json.page_limit_def != undefined) {
				table_conf.view.page_limit = search_conf_json.page_limit_def;
			}

			for (var i = 0; i < fields.length; i++) {
				if (fields[i].filter != undefined) {
							var my_obj = {"value": fields[i].value, "config": fields[i].filter,"dropdown_active": false};
							if (fields[i].title != undefined) {my_obj["title"] = fields[i].title;}
							table_conf.filters.fields.push(my_obj);
							table_conf.view.fields_filter_index[fields[i].value] = {"i_from": 0,"i_to": fields[i].filter.min};
				}
			}

			//-- init my default sort
			for (var i = 0; i < fields.length; i++) {

				if (! util.is_undefined_key(fields[i], "sort.default.order")) {
						table_conf.view.sort.field = fields[i].sort.value;
						table_conf.view.sort.order = fields[i].sort.default.order;
						table_conf.view.sort.type = fields[i].sort.type;
				}
			}

			if (callbk != null){
				Reflect.apply(callbk,undefined,[
							callbk_query,
							JSON.parse(JSON.stringify(table_conf)),
							JSON.parse(JSON.stringify(cat_conf)),
							table_conf.data.results.bindings.length == 0]
				);
				//return JSON.parse(JSON.stringify(table_conf.data.results.bindings));
			}
		}

		/*map the fields with their corresponding links*/
		function _init_uris(data){
			var new_data = data;
			for (var i = 0; i < new_data.length; i++) {
				var obj_elem = new_data[i];
				for (var key_field in obj_elem) {
					if (obj_elem.hasOwnProperty(key_field)) {
						var index_field = util.index_in_arrjsons(cat_conf.fields,["value"],[key_field]);
						if (index_field != -1) {
							var field_obj = cat_conf.fields[index_field];
							var my_uri = _get_uri(new_data[i], key_field, field_obj);
							if (my_uri != null) {
								new_data[i][key_field]["uri"] = my_uri;
							}
						}
					}
				}
			}
			return new_data;
		}
		function _get_uri(elem_obj, field, field_obj){
				var new_elem_obj = elem_obj;
				var uri = null;
				var link_obj = field_obj.link;
				if (link_obj != undefined) {
					if ((link_obj.field != null) && (link_obj.field != "")) {
						// I have field to link to
						if (elem_obj.hasOwnProperty(link_obj.field)) {
							uri = elem_obj[link_obj.field].value;
							if (link_obj.hasOwnProperty("prefix")) {
								uri = String(link_obj.prefix) + uri;
							}
							//new_elem_obj[field]["uri"] = uri;
						}
					}
				}
				return uri;
		}

		function _init_val_map(data) {
			var new_data = data;

			for (var i = 0; i < cat_conf.fields.length; i++) {
				var field_conf_obj = cat_conf.fields[i];
				if (!util.is_undefined_key(field_conf_obj,"value_map")) {
					//for all the data apply the mapping
					for (var j = 0; j < new_data.length; j++) {

						if (new_data[j].hasOwnProperty(field_conf_obj.value)) {
							var result = new_data[j][field_conf_obj.value].value;
							for (var k = 0; k < field_conf_obj["value_map"].length; k++) {
								var fname = field_conf_obj["value_map"][k];
								result = Reflect.apply(heuristics[fname],undefined,[result]);
							}
							new_data[j][field_conf_obj.value].value = result;
						}
					}
				}
			}

 			return new_data;
		}

		/*map the fields with their corresponding labels*/
 		function _init_lbls(data){
 			var new_data = data;
 			for (var i = 0; i < new_data.length; i++) {
 				var obj_elem = new_data[i];
 				for (var key_field in obj_elem) {
 					if (obj_elem.hasOwnProperty(key_field)) {
 						new_data[i] = _get_lbl(new_data[i], key_field);
 					}
 				}
 			}
 			return new_data;

 			function _get_lbl(elem_obj, field){
 				var new_elem_obj = elem_obj;

 				//lets look for the uri
 				var index_category = util.index_in_arrjsons(search_conf_json.categories,["name"],[table_conf.category]);
 				var index_field = util.index_in_arrjsons(search_conf_json.categories[index_category].fields, ["value"], [field]);
 				var label = null;
 				if (index_field != -1){
 					var field_obj = search_conf_json.categories[index_category].fields[index_field];
 					var label_obj = field_obj.label;

 					if (label_obj != undefined) {
 						if ((label_obj.field != null) && (label_obj.field != "")) {
 							// I have field to use as label
 							//console.log(JSON.parse(JSON.stringify(elem_obj)));
 							if (elem_obj.hasOwnProperty(label_obj.field)) {
 								label = elem_obj[label_obj.field].value;

 								new_elem_obj[field]["label"] = label;
 								return new_elem_obj;
 							}
 						}
 					}
 				}
 				new_elem_obj[field]["label"] = elem_obj[field].value;
 				return new_elem_obj;
 			}
 		}
		/*retrieve the externa data*/
		function _exec_ext_data(key_func_name, func_obj, index, async_bool, callbk_func, key_full_name, func_name, data, data_field){

					//my func params
					var func_param = [];
					var func_param_fields = func_obj['param']['fields'];
					var func_param_values = func_obj['param']['values'];

					var conf_params = [];
					/*for (var j = 0; j < func_param_fields.length; j++) {
						conf_params.push(undefined);
					}*/
					for (var j = 0; j < func_param_fields.length; j++) {
						var p_field = func_param_fields[j];
						if ( p_field == "FREE-TEXT"){
							conf_params.push(func_param_values[j]);
						}else {
							if (data.hasOwnProperty(p_field)) {
								conf_params.push(data[p_field].value);
							}
						}
					}

					var ext_key = _build_ext_key(key_func_name,conf_params);

					if (ext_key in ext_data_calls_cache) {
						//in case its already in cache
						func_param.push(index, key_full_name, data_field, async_bool, key_func_name, conf_params);

						if (ext_data_calls_cache[ext_key].value != null) {
							var res_obj = ext_data_calls_cache[ext_key].value;
							func_param.push(res_obj);
							Reflect.apply(callbk_func,undefined,func_param);
						}else {
							ext_data_calls_cache[ext_key].waiting_elems.push(func_param);
						}

					}else {
						ext_data_calls_cache[ext_key] = {"value":null,"waiting_elems":[]};
						func_param.push(conf_params);
						func_param.push(index, async_bool, callbk_func, key_full_name, data_field, key_func_name);
						//console.log(func_param);
						var res = Reflect.apply(callbackfunctions[func_name],undefined,func_param);
					}
		}

		function _build_ext_key(func_name, conf_params) {
			var ext_key = func_name+":";
			for (var i = 0; i < conf_params.length; i++) {
				if (i == conf_params.length - 1) {
					ext_key = ext_key + conf_params[i];
					break;
				}
				ext_key = ext_key + conf_params[i] + ",";
			}
			return ext_key;
		}

		function callbk_update_data_entry_val(index_entry, key_full_name, data_field, async_bool, func_name, conf_params, res_obj){

			//update dictionary
			var ext_key = _build_ext_key(func_name,conf_params);
			ext_data_calls_cache[ext_key].value = res_obj;

			_update_single_callbk(index_entry, key_full_name, data_field, async_bool, func_name, conf_params, res_obj);

			//call same function for all the waiting elems
			for (var i = 0; i < ext_data_calls_cache[ext_key].waiting_elems.length; i++) {
				var new_params = ext_data_calls_cache[ext_key].waiting_elems[i];
				_update_single_callbk(new_params[0], new_params[1], new_params[2], new_params[3], new_params[4], new_params[5], res_obj);
				//util.sleep(1000);

			}

			function _update_single_callbk(index_entry, key_full_name, data_field, async_bool, func_name, conf_params, res_obj){
				var new_val = util.get_obj_key_val(res_obj,data_field);
				if (new_val == -1) {
					new_val = "";
				}

				//util.index_in_arrjsons(search_conf_json.categories,"name",)

				var conf_fields = util.get_val_adv(search_conf_json,"categories.[[name,citation]].fields");
				var my_field_conf = conf_fields[util.index_in_arrjsons(
						conf_fields,
						["value"],
						[key_full_name]
					)];

				if (async_bool) {
					//init the data
					var obj = _update_all_data_entry_field(index_entry, key_full_name, new_val);
					//visualize it in current table page
					htmldom.update_tab_entry_field(table_conf.data_key, index_entry, key_full_name, my_field_conf, obj);

					//check if it should be a filter field
					if (util.index_in_arrjsons(table_conf.filters.fields, ["value"], [key_full_name]) != -1) {
						_gen_data_checkboxes();
					}

				}else {
					_update_data_type(table_conf.data.results.bindings,index_entry, key_full_name, new_val);
				}
			}

			//console.log(table_conf.data.results.bindings);
			function _update_all_data_entry_field(data_key_val, field, new_val) {
				var init_obj = {"value": new_val, "label": new_val};
				init_obj["uri"] = _update_uri(data_key_val,field);


				var obj = _update_data_type(table_conf.data.results.bindings,data_key_val, field, init_obj);
				_update_data_type(table_conf.filters.data.results.bindings,data_key_val, field, init_obj);
				_update_data_type(table_conf.view.data.results.bindings,data_key_val, field, init_obj);
				return obj;

				function _update_uri(data_key_val,field) {
					var field_index = util.index_in_arrjsons(cat_conf.fields,["value"],[field]);
					if( field_index != -1){
						var link_obj = cat_conf.fields[field_index].link;
						if (link_obj != undefined) {
							var original_data_index = util.index_in_arrjsons(sparql_results.results.bindings,[table_conf.data_key],[data_key_val]);
							return  _get_uri(sparql_results.results.bindings[original_data_index], field, cat_conf.fields[field_index]);
						}
					}
				}
			}
			function _update_data_type(dataset, data_key_val, field, new_obj) {
				for (var i = 0; i < dataset.length; i++) {
					if (! util.is_undefined_key(dataset[i],table_conf.data_key)) {
						if(dataset[i][table_conf.data_key].value == data_key_val){
							dataset[i][field] = JSON.parse(JSON.stringify(new_obj));
							return dataset[i];
						}
					}
				}
			}
		}

		function _build_header_sec(){

			//array of my fields
			var myfields = cat_conf.fields;


			//get the possible fields to use as sort options
			var arr_options = [];
			for (var i = 0; i < table_conf.view.data.head.vars.length; i++) {
				var index = util.index_in_arrjsons(myfields,["value"],[table_conf.data.head.vars[i]]);
				if (index != -1) {
					if(! util.is_undefined_key(myfields[index],"sort.value")){

							var inner_field = myfields[index].sort.value;
							var inner_field_type = myfields[index].sort.type;

							var str_html = myfields[index].value;
							if(myfields[index].title != undefined){str_html = myfields[index].title; }

							arr_options.push({"value": inner_field, "type": inner_field_type, "order": "asc", "text":str_html+" &#8593;" });
							arr_options.push({"value": inner_field, "type": inner_field_type, "order": "desc", "text":str_html+" &#8595;"});

							/*
							if(! util.is_undefined_key(myfields[index],"sort.default.order")){
							//if (myfields[index].sort.default.order != undefined) {
								table_conf.view.sort.field = myfields[index].sort.value;
								table_conf.view.sort.order = myfields[index].sort.default.order;
								table_conf.view.sort.type = myfields[index].sort.type;
							}
							*/
						}
				}
			}

			htmldom.sort_box(
					arr_options,
					table_conf.view.sort.field,
					table_conf.view.sort.order,
					table_conf.view.sort.type
				);

			//get the possible fields to use as page limit options
			arr_options = [];
			if(search_conf_json.page_limit != undefined){
				arr_options = search_conf_json.page_limit;
			}
			htmldom.page_limit(arr_options, table_conf.view.page_limit);

			htmldom.tot_results(table_conf.filters.data.results.bindings.length);

			htmldom.build_export_btn();
		}
		function _build_filter_sec(){

				if (htmldom.filter_btns() != -1){
					_gen_data_checkboxes();
					htmldom.filter_checkboxes(table_conf);
					htmldom.filter_history_tab();
				}
			_build_limit_res()
		}
		function _build_limit_res(){
			var data = table_conf.filters.data.results.bindings;
			//init limit results filter
			var max_val = data.length;
			var init_val = max_val;
			if(max_val > 20){
				init_val = Math.floor(max_val*search_conf_json.def_results_limit);
			}
			table_conf.filters.limit = init_val;
			var min_val = 0;

			return htmldom.limit_filter(init_val, max_val, min_val, max_val);
		}

		function _exec_operation(operation=null, params=null, type=null){
			var my_operation = operation;
			var my_params = params;
			switch (type) {
				case null:
					__filter();
					__sort();
					__update_interface();
					break;
				case "filter":
					__filter(operation, params);
					operation = null; params = null;
				case "sort":
					__sort(operation, params);
					operation = null; params = null;
					//after filter and sort results end -> update interface
					__update_interface(my_operation, my_params, type);
					break;
				case "extra":
					__extra(operation, params);
					operation = null; params = null;
			}

			function __update_interface(operation=null, params=null, type=null) {
					switch (type) {
						case null:
							htmldom.add_filentry_history();
							_gen_data_checkboxes();
							htmldom.filter_checkboxes(table_conf);
							table_conf.view.page = 0;
							_reset_filters_page();
							_build_header_sec();
							//break;
						case "filter":
							var checked_filters_arr = null;
							if (operation == "showonly_exclude") {
								checked_filters_arr = util.get_sub_arr(table_conf.filters.arr_entries,"checked",true);
								htmldom.add_filentry_history(checked_filters_arr , params.showonly, table_conf.filters.fields);
							}
							if (operation == "show_all") {
								htmldom.reset_filter_history_tab();
							}
							if (operation != "limit_res") {
								//_build_filter_sec();
								//htmldom.filter_btns();
								_build_limit_res();
							}
							_gen_data_checkboxes();
							htmldom.filter_checkboxes(table_conf);
							checked_filters_arr = util.get_sub_arr(table_conf.filters.arr_entries,"checked",true);
							htmldom.disable_filter_btns(checked_filters_arr.length == 0);
						case "sort":
							//reset pages: results and filters
							table_conf.view.page = 0;
							_reset_filters_page();
							break;
						case "extra":
							break;
					}
					htmldom.update_res_table(table_conf,search_conf_json);
			}
			function __filter(operation=null,params=null){
				switch (operation) {
					case null:
						//make all operations
						//table_conf.filters.data = JSON.parse(JSON.stringify(table_conf.data));
						//_build_filter_sec();
						//it's only on demand
						//_apply_checkboxes_filters(params.showonly);
						_limit_results();
						return true;

					case "show_all":
						//reset data and pages
						table_conf.filters.data = JSON.parse(JSON.stringify(table_conf.data));
						//_build_filter_sec();
						table_conf.view.data = JSON.parse(JSON.stringify(table_conf.filters.data));
						return true;

					case "showonly_exclude":
						//showonly = true, exclude = false
						_apply_checkboxes_filters(params.showonly);
						//_build_filter_sec();
						table_conf.view.data = JSON.parse(JSON.stringify(table_conf.filters.data));
						return true;

					case "limit_res":
						table_conf.filters.limit = params.value;
						table_conf.view.data = _limit_results();
						return true;
				}
			}
			function __sort(operation=null,params=null){
				switch (operation) {
					case null:
						//make all operations
					 	_sort_results();
						return true;
					case "sort_results":
						table_conf.view.sort.field = params.field;
						table_conf.view.sort.order = params.order;
						table_conf.view.sort.type = params.val_type;
						_sort_results();
						return true;
				}
			}
			function __extra(operation=null){
				switch (operation) {
					case null: break;
					case "export":
						_export_csv();
						break;
				}
			}
		}
		/*methods by the operations*/
		function _limit_results(){

			var fildata = JSON.parse(JSON.stringify(table_conf.filters.data));
			//var fildata = Object.assign({}, table_conf.filters.data);

			var i_to = table_conf.filters.limit;
			if (i_to > fildata.results.bindings.length) {
				i_to = fildata.results.bindings.length;
			}

			var arr_new_results = [];
			for (var i = 0; i < i_to; i++) {
				var data_obj = fildata.results.bindings[i];
				arr_new_results.push(data_obj);
			}
			fildata.results.bindings = arr_new_results;
			return fildata;
		}
		function _sort_results(){

			var field = table_conf.view.sort.field;
			var order = table_conf.view.sort.order;
			var val_type = table_conf.view.sort.type;

			//start always from the filtered data
			//table_conf.view.data.results.bindings = JSON.parse(JSON.stringify(table_conf.view.data.results.bindings));
			//_limit_results();
			if (field != 'none') {
					table_conf.view.data.results.bindings = _sort_tabdata(table_conf.view.data.results.bindings,field,order,val_type);
			}else {
				/*no sort operation is applied*/
				//_limit_results();
				table_conf.view.data.results.bindings = JSON.parse(JSON.stringify(table_conf.filters.data.results.bindings));
			}

			table_conf.view.page = 0;

			function _sort_tabdata(arr_obj,field,order,val_type){
				var field_val = ".value";

				if (field != null) {
					var field_parts = field.split(".");
					if (field_parts.length > 1) {
						field_val = "";
					}
				}

				var index_category = util.index_in_arrjsons(search_conf_json.categories,["name"],[table_conf.category]);

				if (! util.is_undefined_key(search_conf_json.categories[index_category],"group_by.concats")) {
						if (search_conf_json.categories[index_category]["group_by"].concats.indexOf(field) != -1) {
							field_val = ".concat-list";
						}
				}

				var new_arr_obj = util.sort_objarr_by_key(
							JSON.parse(JSON.stringify(arr_obj)),
							order,
							field+field_val,
							val_type
				);
				return new_arr_obj;
			}
		}
		function _reset_filters_page(){
			var fields = table_conf.filters.fields;
			for (var i = 0; i < fields.length; i++) {
				var obj = fields[i];
				table_conf.view.fields_filter_index[obj.value] = {"i_from": 0,"i_to": obj.config.min};
			}
		}
		function _apply_checkboxes_filters(flag){
			var new_data = JSON.parse(JSON.stringify(table_conf.filters.data));
			var arr_new_results = [];

			var list_data = JSON.parse(JSON.stringify(table_conf.view.data.results.bindings));
			//console.log(list_data);
			for (var i = 0; i < list_data.length; i++) {
				var data_obj = list_data[i];
				//console.log(data_obj);
				if(__check_if_respects_filters(data_obj) == flag){
					arr_new_results.push(data_obj);
				}
			}
			new_data.results.bindings = arr_new_results;
			table_conf.filters.data = JSON.parse(JSON.stringify(new_data));

			//table_conf.view.data = JSON.parse(JSON.stringify(new_data));

			function __check_if_respects_filters(data_obj){
				//retrieve the entries checked
				var arr_entries = util.get_sub_arr(table_conf.filters.arr_entries,"checked",true);
				var my_fields = [];
				var all_fields = [];

				for (var j = 0; j < arr_entries.length; j++) {
					if (data_obj.hasOwnProperty(arr_entries[j].field)) {

						var arr = [];
						if (data_obj[arr_entries[j].field].hasOwnProperty("concat-list")){
							arr = data_obj[arr_entries[j].field]["concat-list"];
						}
						else {arr.push(data_obj[arr_entries[j].field]);}

						//check if at least 1 in the list respects all the filter
						for (var k = 0; k < arr.length; k++) {
							var elem = arr[k];
							if (elem.value == arr_entries[j].value){
								if (my_fields.indexOf(arr_entries[j].field) == -1){
									my_fields.push(arr_entries[j].field);
									break;
								}
							}
						}
					}
					if (all_fields.indexOf(arr_entries[j].field) == -1){
						all_fields.push(arr_entries[j].field);
					}

				}
				//check if all fields are in the array of the fields filters I respect
				var filters_flag = true;
				for (var j = 0; j < all_fields.length; j++) {
					if(my_fields.indexOf(all_fields[j]) == -1){
						filters_flag = false;
					}
				}
				return filters_flag;
			}
		}
		function _gen_data_checkboxes(myfields = table_conf.filters.fields){

			//table_conf.filters.arr_entries = [];
			var new_arr_entries = [];
			// create the list of values I can filter
			for (var i = 0; i < myfields.length; i++) {

							var filter_field = myfields[i].value;

							//the data base
							var list_data = table_conf.view.data.results.bindings;

							//insert a check list for distinct values in the rows
							var j_to = list_data.length;
							var arr_check_values = [];
							for (var j = 0; j < j_to; j++) {
								var res_obj = list_data[j];

								if(res_obj.hasOwnProperty(filter_field)){
										var elem = res_obj[filter_field];
										var arr = [];
										if(elem.hasOwnProperty("concat-list")){arr = elem["concat-list"];}
										else {arr.push(elem);}

										for (var k = 0; k < arr.length; k++) {
											var new_val = arr[k].value;
											var new_label = arr[k].label;
											var index_in_arr = util.index_in_arrjsons(arr_check_values,["value"],[new_val]);
											if (index_in_arr == -1){
												//check it according to prev status
												var checked_bool = false;
												var index_in_arr_entries = util.index_in_arrjsons(table_conf.filters.arr_entries,["value"],[new_val]);
												if (index_in_arr_entries != -1) {
													if (table_conf.filters.arr_entries[index_in_arr_entries]['checked'] == true) {
													}
													checked_bool = table_conf.filters.arr_entries[index_in_arr_entries]['checked'];
												}

												arr_check_values.push({"field": filter_field,"value":new_val,"label":new_label ,"sum":1,"checked":checked_bool});
											}else{
												arr_check_values[index_in_arr]["sum"] = arr_check_values[index_in_arr]["sum"] + 1;
											}
										}
								}
							}

							//insert them all
							for (var j = 0; j < arr_check_values.length; j++) {
								new_arr_entries.push(arr_check_values[j]);
							}
			}

			//insert them all
			table_conf.filters.arr_entries = new_arr_entries;
		}
		function _export_csv(){
			var matrix = [];
			//console.log(table_conf.view.data.results.bindings);
			var tab_results = table_conf.view.data.results.bindings;

			var row_elem = [];
			if (tab_results.length > 0) {

				var index_cat = util.index_in_arrjsons(search_conf_json.categories, ["name"], [table_conf.category]);
				var my_cat = search_conf_json.categories[index_cat];

				var set_keys = [];
				for (var i = 0; i < my_cat.fields.length; i++) {
					row_elem.push(my_cat.fields[i].title);
					set_keys.push(my_cat.fields[i].value);
				}
				matrix.push(row_elem);

				for (var i = 0; i < tab_results.length; i++) {
					var row_elem = [];
					for (var j = 0; j < set_keys.length; j++) {
						row_elem.push(util.build_str(tab_results[i][set_keys[j]],"inline",false));
					}
					matrix.push(row_elem);
				}

				var encodedUri = util.encode_matrix_to_csv(matrix);
				htmldom.download_results(encodedUri);
			}
		}


		//functions to call from the html interface
		/*Operations on the data*/
		function update_res_limit(new_res_limit){
			_exec_operation(
				"limit_res",
				{"value": parseInt(new_res_limit)},
				"filter"
			);
		}
		function show_or_exclude(flag){
			_exec_operation(
				"showonly_exclude",
				{"showonly": flag},
				"filter"
			);
		}
		function show_all() {
			_exec_operation(
				"show_all",
				null,
				"filter"
			);
		}
		function check_sort_opt(option){
			//console.log(option.getAttribute("value"),option.getAttribute("order"),option.getAttribute("type"));
			_exec_operation(
				"sort_results",
				{
					"field": option.getAttribute("value"),
					"order": option.getAttribute("order"),
					"val_type": option.getAttribute("type"),
				},
				"sort"
			);
		}
		function export_results(){
			_exec_operation(
				"export",
				null,
				"extra"
			);
		}
		/*Interface operations on the data*/
		function checkbox_changed(c_box){
			var index = util.index_in_arrjsons(table_conf.filters.arr_entries,["field","value"],[c_box.getAttribute("field"),c_box.value]);
			if (index != -1) {
				table_conf.filters.arr_entries[index].checked = c_box.checked;
			}
			//enable/disable buttons
			var checked_filters_arr = util.get_sub_arr(table_conf.filters.arr_entries,"checked",true);
			htmldom.disable_filter_btns(checked_filters_arr.length == 0);
		}
		function next_page(){
			table_conf.view.page = table_conf.view.page + 1;
			htmldom.update_res_table(table_conf,search_conf_json);
		}
		function prev_page(){
			table_conf.view.page = table_conf.view.page - 1;
			htmldom.update_res_table(table_conf,search_conf_json);
		}
		function update_page_limit(new_page_limit){
			table_conf.view.page_limit = parseInt(new_page_limit);
			table_conf.view.page = 0;
			htmldom.update_res_table(table_conf,search_conf_json);
		}
		function select_page(page_num) {
			table_conf.view.page = page_num;
			htmldom.update_res_table(table_conf,search_conf_json);
		}
		function select_filter_field(field_value){
			var field_index = util.index_in_arrjsons(table_conf.filters.fields,["value"],[field_value]);
			if(field_index != -1){
				table_conf.filters.fields[field_index].dropdown_active = !table_conf.filters.fields[field_index].dropdown_active;
			}
			htmldom.filter_checkboxes(table_conf);
		}
		function next_filter_page(myfield){
			myfield = JSON.parse(myfield);
			table_conf.view.fields_filter_index[myfield.value].i_from += myfield.config.min;
			table_conf.view.fields_filter_index[myfield.value].i_to += myfield.config.min;
			htmldom.filter_checkboxes(table_conf);
		}
		function prev_filter_page(myfield){
			myfield = JSON.parse(myfield);
			table_conf.view.fields_filter_index[myfield.value].i_from -= myfield.config.min;
			table_conf.view.fields_filter_index[myfield.value].i_to -= myfield.config.min;
			htmldom.filter_checkboxes(table_conf);
		}
		function switch_adv_category(adv_category){
			htmldom.build_advanced_search(search_conf_json.categories, search_conf_json.rules, adv_category, search_conf_json.search_base_path, search_conf_json.adv_btn_title);
		}

		return {
				//filter operations
				update_res_limit: update_res_limit,
				show_or_exclude: show_or_exclude,
				checkbox_changed: checkbox_changed,
				show_all: show_all,

				//sort operation
				check_sort_opt: check_sort_opt,

				//extra operation
				export_results: export_results,

				//visual operations
				next_page: next_page,
				prev_page: prev_page,
				update_page_limit: update_page_limit,
				select_page: select_page,
				select_filter_field: select_filter_field,
				next_filter_page: next_filter_page,
				prev_filter_page: prev_filter_page,
				switch_adv_category: switch_adv_category,

				//main operations
				build_table: build_table,
				do_sparql_query: do_sparql_query,
				build_adv_sparql_query: build_adv_sparql_query,
				change_search_data: change_search_data,
				get_search_data: get_search_data,

				//others
				callbk_update_data_entry_val: callbk_update_data_entry_val
		 }
})();


var util = (function () {

	/*returns only the first 'numchar' chars of text with the suffix '...' */
	function cut_text(text,numchar) {
		var new_text = text;
		if(text.length > numchar){
			new_text = text.substring(0, numchar-3)+"...";
		}
		return new_text;
	}

	function sleep(milliseconds) {
	  var start = new Date().getTime();
	  for (var i = 0; i < 1e7; i++) {
	    if ((new Date().getTime() - start) > milliseconds){
	      break;
	    }
	  }
	}

	function get_val_adv(origin, path) {
		if (path == "") {return -1;}
		var arrpath = path.split(".");
		return deeper_arr(arrpath, 0, origin);
		function deeper_arr(arrpath, i, curobj) {

					if (i >= arrpath.length) {
						return curobj;
					}

					var key = arrpath[i];
					var reg = /\[\[(.+?)\]\]/g;
					if (match = reg.exec(key)) {
						//search for it
						 var inner_regex = match[1];
						 var innerreg = /(.+?),(.+)/g;
						 if (innermatch = innerreg.exec(inner_regex)) {
							 var innerfield = innermatch[1];
							 var innervalue = innermatch[2];
							 var innerindex = util.index_in_arrjsons(curobj,[innerfield],[innervalue]);
							 //util.printobj(obj);
							 if (innerindex != -1) {
								 key = innerindex;
							 }
						 }
					 }

						if (curobj[key] != undefined) {
							return deeper_arr(arrpath, i+1, curobj[key]);
						}else {
							return -1;
						}
			}
	}

	/*updates the original obj with new pairs of (key,value) given in an array*/
	function update_obj(original_obj, arr_new_vals) {
		if (arr_new_vals != null) {
			for (var i = 0; i < arr_new_vals.length; i++) {
				original_obj = _update_key(original_obj, arr_new_vals[i]["key"].split("."), arr_new_vals[i]["value"]);
			}
		}
		return original_obj;

		function _update_key(obj,arrkeys, value){
			var key = arrkeys[0];

			var reg = /\[\[(.+?)\]\]/g;
			if (match = reg.exec(key)) {
				//search for it
				 var inner_regex = match[1];
				 var innerreg = /(.+?),(.+)/g;
				 if (innermatch = innerreg.exec(inner_regex)) {
					 var innerfield = innermatch[1];
					 var innervalue = innermatch[2];
					 var innerindex = util.index_in_arrjsons(obj,[innerfield],[innervalue]);
					 //util.printobj(obj);
					 if (innerindex != -1) {
						 key = innerindex;
					 }
				 }
			}

			if (obj[key] == undefined){
				if (value != "REMOVE_ENTRY") {
					obj[key] = value;
				}
			}else {
				if (arrkeys.length == 1) {
					switch (value) {
						case "REMOVE_ENTRY":
							if(Array.isArray(obj)){
								obj.splice(key, 1);
							}else {
								delete obj[key];
							}
							break;
						default:
							obj[key] = value;
					}
				}else {
					_update_key(obj[key],arrkeys.splice(1, arrkeys.length),value);
				}
			}
			return obj;
		}
	}

	/*get the value of key in obj, key is a string that can deepin the obj */
	function get_obj_key_val(obj,key){
		if (!is_undefined_key(obj,key)) {
			return _obj_composed_key_val(obj,key);
		}else {
			return -1;
		}

		function _obj_composed_key_val(obj,key_str) {
			var arr_key = key_str.split(".");
			var inner_val = obj;
			for (var i = 0; i < arr_key.length; i++) {
				inner_val = inner_val[arr_key[i]];
			}
			return inner_val;
		}
	}

	function printobj(obj){
		console.log(JSON.parse(JSON.stringify(obj)));
	}

	//remove from arr a given value
	function remove_val_in_arr(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
	}

	/*creates an encoded string for .csv file generation*/
	function encode_matrix_to_csv(matrix) {
		let csvContent = "data:text/csv;charset=utf-8,";

		function withQuotes(elem){
			return '"'+elem+'"';
		}

		matrix.forEach(function(rowArray){
			 rowArray = rowArray.map(withQuotes);
		   let row = rowArray.join(",");
		   csvContent += row + "\r\n"; // add carriage return
		});
		return encodeURI(csvContent);
	}

	 /*returns true if key is not a key in object or object[key] has
	 * value undefined. If key is a dot-delimited string of key names,
	 * object and its sub-objects are checked recursively.*/
	function is_undefined_key(object, key) {
    var keyChain = Array.isArray(key) ? key : key.split('.'),
        objectHasKey = keyChain[0] in object,
        keyHasValue = typeof object[keyChain[0]] !== 'undefined';

    if (objectHasKey && keyHasValue) {
        if (keyChain.length > 1) {
            return is_undefined_key(object[keyChain[0]], keyChain.slice(1));
        }

        return false;
    }
    else {
        return true;
    }
	}

	/*order_by on the given keys Max 2 keys*/
	function order_by(arr_objs, keys, types, order='asc', fixed=null) {

		//console.log(keys, types, order, fixed);

		if ((keys.length == 0) || (types.length == 0)){
			return arr_objs;
		}

		var my_key = keys.splice(0, 1)[0];
		var my_type = types.splice(0, 1)[0];

		if (fixed == null) {
			var arr_ordered_bykey = util.sort_objarr_by_key(arr_objs,order,my_key+".value",my_type);
			return order_by(arr_ordered_bykey, keys, types, order= order, fixed = my_key);

		}else {

			var final_arr = [];

				for (var i = 0; i < arr_objs.length; i++) {
					var partial_arr = [];
					var fixed_item = arr_objs[i][fixed].value;
					while (true) {
						partial_arr.push(arr_objs[i]);
						i = i + 1;

						if (i >= arr_objs.length) {
							break;
						}
						if (arr_objs[i][fixed].value != fixed_item){
							//to riconsider it next time
							i = i - 1;
							break;
						}
					}
					//console.log(partial_arr);
					//order partial array
					final_arr = final_arr.concat(
								util.sort_objarr_by_key(
									partial_arr,
									order,
									my_key+".value",
									my_type
								)
					);
				}

			return order_by(final_arr, keys, types, order= order, fixed = my_key);
		}

	}

	/*group by the 'arr_objs' elements following the distinct 'keys' and by concatinating
	the fields in 'arr_fields_concat'*/
	function group_by(arr_objs, keys, arr_fields_concat){
		var new_arr = [];
		for (var i = 0; i < arr_objs.length; i++) {
			var values = collect_values(arr_objs[i], keys);
			var index = index_in_arrjsons(new_arr, keys, values);
			if (index == -1) {
				for (var j = 0; j < arr_fields_concat.length; j++) {
					var elem = arr_objs[i];
					if (arr_objs[i].hasOwnProperty(arr_fields_concat[j])) {
						elem[arr_fields_concat[j]] = {"concat-list": [elem[arr_fields_concat[j]]]};
					}
					new_arr.push(elem);
				}
			}else {
				for (var j = 0; j < arr_fields_concat.length; j++) {
					if (arr_objs[i].hasOwnProperty(arr_fields_concat[j])) {
						var elem = arr_objs[i][arr_fields_concat[j]];

						var index_concat_list = index_in_arrjsons(new_arr[index][arr_fields_concat[j]]["concat-list"], ["value"], [elem.value]);
						if(index_concat_list == -1){
							new_arr[index][arr_fields_concat[j]]["concat-list"].push(elem);
						}
					}
				}
			}
		}
		return new_arr;
	}

	/*Collect the values of all the 'keys' in obj in an array and returns it
	the order of the elements in the array follows the order of the keys*/
	function collect_values(obj,keys){
		var new_arr = [];
		for (var k in obj) {
			if ((obj.hasOwnProperty(k)) && (keys.indexOf(k) != -1)) {
				new_arr.push(obj[k].value);
			}
		}
		return new_arr;
	}

	/* returns a specific column 'field' from an array of objects
	having a specific value*/
	function get_sub_arr(arr_objs, field, value){
		var arr = [];
		for (var i = 0; i < arr_objs.length; i++) {
			if(arr_objs[i].hasOwnProperty(field)){
				if (arr_objs[i][field] == value) {
					arr.push(arr_objs[i]);
				}
			}
		}
		return arr;
	}

	/*get index of obj from 'arr_objs' where
	obj['key'] (or an array of multi keys) equals val
	(or an array of multi values), it returns -1 in
	case there is no object*/
	function index_in_arrjsons(arr_objs, keys, vals){

		for (var i = 0; i < arr_objs.length; i++) {
			var elem_obj = arr_objs[i];
			var flag = true;

			for (var j = 0; j < keys.length; j++) {
				if (elem_obj.hasOwnProperty(keys[j])) {

					if (elem_obj[keys[j]].hasOwnProperty("value")) {
						flag = flag && (elem_obj[keys[j]].value == vals[j]);
					}else{
						flag = flag && (elem_obj[keys[j]] == vals[j]);
					}
				}else {
					flag = false;
				}
			}

			if (flag) {
				return i;
			}
		}
		return -1;
	}

	/*sort 'array' of objects with respect to the field "key"
	with data type equal to 'val_type' in the order 'order'*/
	function sort_objarr_by_key(objarr, order, key, val_type) {

		var sorted_arr = [];
		var array_key = key.split('.');
		//in case the field name have dots
		array_key = handle_dots(array_key);

		for (var i = 0; i < objarr.length; i++) {
			var objval = _init_val(objarr[i], array_key, val_type);

			var insert_index = -1;
			for (var j = 0; j < sorted_arr.length; j++) {

				var objcompval = _init_val(sorted_arr[j], array_key, val_type);

				if (order == 'desc') {
					if (objcompval < objval) {
						insert_index = j;
						break;
					}
				}
				else {
					if (order == 'asc') {
						if (objcompval > objval) {
							insert_index = j;
							break;
						}
					}
				}
			}
			//if (insert_index == sorted_arr.length - 1) {
			if (insert_index == -1) {
				sorted_arr.push(objarr[i]);
			}else {
				sorted_arr.splice(insert_index, 0, objarr[i]);
			}
		}

		return sorted_arr;

		/*init the value for the sorting*/
		function _init_val(arr,array_key,val_type) {
			var val= null;
			if (arr.hasOwnProperty(array_key[0])) {
				val= arr[array_key[0]];
				if(array_key.length > 1){
					val = arr[array_key[0]][array_key[1]];
				}
			}else{
				switch (val_type) {
					case "text": val= ""; break;
					case "int": val= -1; break;
					default:
				}
			}
			if ( (val == "None") && (val_type = "int")){
				val = -1;
			}

			if (array_key[1] == "concat-list") {
				var str_concat = "";
				for (var i = 0; i < val.length; i++) {
					str_concat = str_concat + " " +val[i].value;
				}
				val = str_concat;
			}

			if (val_type == "text"){
				val = val.toLowerCase();
			}else{
					if (val_type == "date") {
							 var val = new Date(val);
					}else{
								if (val_type == "int") {
											var val = parseFloat(val);
								}
								else{
											var val = parseInt(val);
								}
					}
			}

			return val;
		}

	}

	/*handle dots in field name*/
	function handle_dots(array_key) {
		var new_arr = [];
		var field_name = ""; var sep= ".";
		for (var i = 0; i < array_key.length-1; i++) {
			if (i == array_key.length-2) {
				sep= "";
			}
			field_name= field_name + array_key[i]+sep;
		}
		if (field_name != "") {
			new_arr.push(field_name);
		}
		new_arr.push(array_key[array_key.length-1]);
		return new_arr;
	}

	/*sort int function*/
	function sort_int(a,b) {
		return a - b;
	}

	/*create and return an html string representing the value of obj
	in case it is a concatanation of values then the string styles
	follows the 'concat_style' pattern for its construction  */
	function build_str(obj,concat_style=null, include_link = true){
		if (obj != undefined) {
			if (obj.hasOwnProperty("concat-list")) {
				return __concat_vals(obj["concat-list"],concat_style,include_link);
			}else {
				return __get_val(obj,include_link);
			}
		}else {
			return "";
		}

		function __get_val(obj,include_link){
			if ((obj != null) && (obj != undefined)){
				//if (obj.value == "") {obj.value = "NONE";}
				var str_html = obj.value;
				if (include_link) {
					if (obj.hasOwnProperty("uri")) {
						str_html = "<a href='"+String(obj.uri)+"'>"+obj.value+"</a>";
					}
				}
				return str_html;
			}else {
				return "NONE";
			}
		}
		function __concat_vals(arr,concat_style,include_link){
			var str_html = "";
			var separator = ", ";

			if ((concat_style != null) && (concat_style != undefined)) {
				if (concat_style == "newline") {separator = "\n ";}
				if (concat_style == "inline") {separator = ", ";}
				if (concat_style == "first") {
					if (arr.length > 0) {arr = [arr[0]];}
				}
				if (concat_style == "last") {
					if (arr.length > 0) {arr = [arr[arr.length - 1]];}
				}
			}

			for (var i = 0; i < arr.length; i++) {
				var obj = arr[i];
				if (i == arr.length - 1) {separator = " ";}
				str_html = str_html + __get_val(obj,include_link) + separator;
			}
			return str_html;
		}
	}

	return {
		get_val_adv: get_val_adv,
		cut_text: cut_text,
		sleep: sleep,
		update_obj: update_obj,
		get_obj_key_val: get_obj_key_val,
		printobj: printobj,
		remove_val_in_arr: remove_val_in_arr,
		is_undefined_key: is_undefined_key,
		group_by: group_by,
		order_by: order_by,
		collect_values: collect_values,
		get_sub_arr: get_sub_arr,
		sort_objarr_by_key: sort_objarr_by_key,
		handle_dots: handle_dots,
		sort_int: sort_int,
		index_in_arrjsons: index_in_arrjsons,
		encode_matrix_to_csv: encode_matrix_to_csv,
		build_str: build_str
	 }
})();


var htmldom = (function () {

	var input_box_container = document.getElementsByClassName("form-control oc-purple");
	var results_container = document.getElementById("search_results");
	var header_container = document.getElementById("search_header");
	var sort_container = document.getElementById("sort_results");
	var export_container = document.getElementById("export_results");
	var rowsxpage_container = document.getElementById("rows_per_page");
	var limitres_container = document.getElementById("limit_results");
	var filter_btns_container = document.getElementById("filter_btns");
	var filter_values_container = document.getElementById("filter_values_list");
	var extra_container = document.getElementById("search_extra");

	var id_rows = 0;

	/*create the header of the results table*/
	function _table_res_header(cols,fields){

		var tr = document.createElement("tr");
		for (var i = 0; i < fields.length; i++) {
			f_obj = fields[i];
			var index = cols.indexOf(f_obj["value"]);
			if (index != -1) {
				var th = document.createElement("th");
				if (f_obj["column_width"] != undefined) {
					th.width = f_obj["column_width"];
				}
				th.innerHTML = f_obj["value"];
				if (f_obj["title"] != undefined) {
					th.innerHTML = f_obj["title"];
				}
				tr.appendChild(th);
			}
		}
		return tr;
	}
	/*create the body of the results table*/
	function _table_res_list(cols,fields,results_obj){
		tr = document.createElement("tr");

		for (var i = 0; i < fields.length; i++) {
				f_obj = fields[i];
				var index = cols.indexOf(f_obj["value"]);
				if (index != -1) {

					var tabCell = tr.insertCell(-1);
					tabCell.setAttribute("field", f_obj["value"]);
					var cell_inner = _cell_inner_str(results_obj, f_obj["value"], f_obj["value_text_len"]);

					tabCell.setAttribute("value", cell_inner.str_value);
					tabCell.innerHTML = cell_inner.str_html;
				}
		}
		return tr;
	}

	function _cell_inner_str(results_obj,cell_field, limit_length = undefined) {
		if (results_obj.hasOwnProperty(cell_field)) {
			var str_html = "";

			//check if field is concatenated through group_by
			var str_value = "";
			if (results_obj[cell_field].hasOwnProperty("concat-list")) {
				var arr = results_obj[cell_field]["concat-list"];
				var str_sep = ", ";
				for (var k = 0; k < arr.length; k++) {
					if (k == arr.length -1) {str_sep = " ";}
					str_value = str_value + arr[k].value + str_sep;

					var inner_value = arr[k].value;
					if (limit_length != undefined) {
						inner_value = util.cut_text(inner_value,limit_length);
					}

					if(arr[k].hasOwnProperty("uri")){
						str_html = str_html + "<a class='res-val-link' href='"+String(arr[k].uri)+"' target='_blank'>"+inner_value+"</a>";
					}else {
						str_html = str_html + String(inner_value);
					}
					str_html = String(str_html) + String(str_sep);
				}
			}
			else {
				str_value = results_obj[cell_field].value;

				var inner_value = str_value;
				if (limit_length != undefined) {
					inner_value = util.cut_text(str_value,limit_length);
				}

				if(results_obj[cell_field].hasOwnProperty("uri")){
					str_html = "<a class='res-val-link' href='"+String(results_obj[cell_field].uri)+"' target='_blank'>"+inner_value+"</a>";
				}else {
					str_html = inner_value;
				}
			}
		}else{
			str_html = "";
		}
		return {"str_html": str_html, "str_value": str_value};

		function short_version(str, max_chars = null) {
		  var new_str = "";
			if ((max_chars != null) && (max_chars != undefined)) {
				for (var i = 0; i < max_chars; i++) {
			    if (str[i] != undefined) {
			      new_str = new_str + str[i];
			    }else {
			      break;
			    }
			  }
			  return new_str+"...";
			}else {
				return str;
			}
		}
	}


	/*create the footer of the results table*/
	function _table_footer(no_results_flag, my_tr){
		var new_footer_tab = document.createElement("table");
		if (! no_results_flag){
			new_footer_tab.id = "tab_next_prev";
			new_footer_tab.className = "table tab-footer";
			tr = new_footer_tab.insertRow(-1);
			tr.innerHTML = my_tr.innerHTML;
		}else{
			new_footer_tab.id = "footer_tab";
			new_footer_tab.className = "table tab-footer noresults";
			tr = new_footer_tab.insertRow(-1);
			tr.innerHTML = my_tr;
		}
		return new_footer_tab;
	}
	/*creates the navigation buttons and index of the results table*/
	function _res_table_pages_nav(arr_values, mypage, tot_pages, tot_res, pages_lim){

		var str_html = _pages_nav(arr_values, mypage + 1, tot_pages);
		var new_btn = document.createElement("a");
		//Prev button
		if(mypage > 0){
			new_btn = __pages_prev_btn("javascript:search.prev_page()");
			str_html = "<spanfooter>"+String(new_btn.outerHTML)+"</spanfooter>" + "<spanfooter>"+str_html+"</spanfooter>";
		}
		//Next prev
		var remaining_results = tot_res - ((mypage + 1) * pages_lim);
		if(remaining_results > 0) {
			new_btn = __pages_next_btn("javascript:search.next_page()");
			str_html = "<spanfooter>"+str_html+"</spanfooter>" + "<spanfooter>"+String(new_btn.outerHTML)+"</spanfooter>";
		}
		var new_tr = document.createElement("tr");
		new_tr.innerHTML = str_html;
		return new_tr;

		function __pages_prev_btn(href){
			var new_btn = document.createElement("a");
			new_btn.className = "tab-nav-btn prev";
			new_btn.innerHTML = "&laquo; Previous";
			new_btn.href = String(href);
			return new_btn;
		}

		function __pages_next_btn(href){
			var new_btn = document.createElement("a");
			new_btn.className = "tab-nav-btn next";
			new_btn.innerHTML = "Next &raquo;";
			new_btn.href = String(href);
			return new_btn;
		}
	}
	/*create a checbox-field-value entry*/
	function _checkbox_value(myfield, check_value){
		var tr = document.createElement("tr");
		var tabCell = document.createElement("td");
		tabCell.innerHTML = "<div class='checkbox'><label><input type='checkbox' field="+
												myfield.value+" value='"+String(check_value.value)+
												"' onchange='search.checkbox_changed(this);'"+
												//"checked='"+check_value.checked+"' "+
												"id='"+String(myfield.value)+"-"+String(check_value.value)+"' "+
												">"+
												check_value.label+" ("+check_value.sum+
												")</label></div></div>";
		tr.appendChild(tabCell);
		return tr;
	}
	/*creates the field entry dropdown list activator in the filter section*/
	function _field_filter_dropdown(myfield, href_string, is_closed){
		var tr = document.createElement("tr");
		var tabCell = document.createElement("th");
		//tabCell.className = "dynamic_field";

		var title_val = myfield.value;
		if (myfield.title != undefined) {
			title_val = util.cut_text(myfield.title,12);
		}

		var href_string = "javascript:search.select_filter_field('"+String(myfield.value)+"');";
		if (!is_closed) {
			tabCell.innerHTML = "Select <a class='search-a' href="+href_string+">"+ title_val +"<arrow>&#8744;</arrow>"+"</a>";
		}else {
			tabCell.innerHTML = "Select <a class='search-a' href="+href_string+">"+ title_val +"<arrow>&#8743;</arrow>"+"</a>";
		}
		tr.appendChild(tabCell);
		return tr;
	}
	/*creates the navigation buttons for the filter-values*/
	function _filter_vals_pages_nav(i_from, i_to, tot, myfield) {
		var new_tr = document.createElement("tr");
		new_tr.id = "next_prev";
		var tabCell = new_tr.insertCell(-1);

		var str_html = "";
		if (tot - i_to > 0) {
			var str_href = "javascript:search.next_filter_page('"+JSON.stringify(myfield)+"')";
			str_html= "<ar><a class='arrow-nav right' href="+str_href+">&#8680;</a></ar>" + str_html;
		}
		if ((i_from+1)/myfield.config.min >= 1) {
			var str_href = "javascript:search.prev_filter_page('"+JSON.stringify(myfield)+"')";
			str_html= "<ar><a class='arrow-nav left' href="+str_href+">&#8678;</a></ar>" + str_html;
		}

		tabCell.innerHTML = str_html;
		return new_tr;
	}
	/*creates an advanced rule-entry, without the boolean connector box*/
	function _build_rule_entry(entryid, arr_rules, adv_cat_selected){
		var str_options = _build_rules_options(arr_rules, adv_cat_selected);

		var first_placeholder = "";
		for (var i = 0; i < arr_rules.length; i++) {
		  if (arr_rules[i].category == adv_cat_selected) {
				first_placeholder = arr_rules[i].placeholder;
				if (first_placeholder == undefined) {
					first_placeholder = "";
				}
				break;
		  }
		}

		var param0 = "adv_input_box_"+entryid;
		var param1 = "rules_selector_"+entryid;
		var onchange_rule = "javascript:htmldom.adv_placeholder('"+param0+"','"+param1+"')";

		var str_html= ""+
			"<div class='adv-search-entry'>"+
				"<div class='adv-search-input search-box'>"+
						"<input entryid="+entryid+" id='adv_input_box_"+entryid+"' class='form-control theme-color' placeholder='"+first_placeholder+"' type='text' name='text'>"+
				"</div>"+
				"<div class='adv-search-selector'>"+
					"<select type='text' name='rule' entryid="+entryid+" class='form-control input custom' onchange="+onchange_rule+" id='rules_selector_"+entryid+"'>"+
					str_options+
					"</select>"+
				"</div>"+
			"</div>"+
		"";
		return str_html;
	}
	function adv_placeholder(inputbox_id, select_id) {
		//console.log(inputbox_id);
		//console.log(select_id);

		var e = document.getElementById(select_id);
		var selected_opt_placeholder = e.options[e.selectedIndex].getAttribute("my_placeholder");
		//console.log(selected_opt_placeholder);

		document.getElementById(inputbox_id).setAttribute('placeholder',selected_opt_placeholder);
	}
	/*creates an options selector dom for the rule names*/
	function _build_rules_options(arr_rules, adv_cat_selected){
		var str_allopt = "";
		var str_selected = "selected";
		for (var i = 0; i < arr_rules.length; i++) {
				var str_option = "";
				if (arr_rules[i].category == adv_cat_selected){
					if (!util.is_undefined_key(arr_rules[i], "advanced")) {
						if (arr_rules[i].advanced == true) {
								var my_placeholder = arr_rules[i].placeholder;
								if (my_placeholder == undefined) { my_placeholder = "";}
								str_option = "<option "+str_selected+" value="+arr_rules[i].name+" my_placeholder='"+my_placeholder+"'>"+arr_rules[i].label+"</option>";
						}
					}
				}
				str_allopt = str_allopt + str_option;
				str_selected = "";
		}
		return str_allopt;
	}
	/*creates the pages navigator*/
	function _pages_nav(arr_values, mypage, tot_pages){
		var str_html = "";
		var str_start = "<ul class='nav pages-nav'>";
		if (arr_values[0] > 1) { str_start = str_start + "...";}

		var str_end = "</ul>";
		if (arr_values[arr_values.length - 1] < tot_pages) { str_end = "..."+ str_end;}
		for (var i = arr_values.length - 1; i >= 0; i--) {
			var elem_a = "<li><a class='pages-nav' href='javascript:search.select_page("+String(arr_values[i]-1)+");'>"+ String(arr_values[i])+" " +"</a></li>";
			if (arr_values[i] == mypage) {
				elem_a = "<li class='active'><a class='pages-nav' href='javascript:search.select_page("+String(arr_values[i]-1)+");'>"+ String(arr_values[i])+" " +"</a></li>";
			}
			str_html = elem_a +" "+ str_html;
		}
		str_html = str_start + str_html + str_end;
		return str_html;
	}

	/*creates the page-limit dom*/
	function page_limit(arr_options, page_limit){
		if (rowsxpage_container != null) {
			var options_html = "";
			for (var i = 0; i < arr_options.length; i++) {
				var str_option = "<option>"+String(arr_options[i])+"</option>";
				if (arr_options[i] == page_limit) {
					str_option = "<option selected='selected'>"+String(arr_options[i])+"</option>";
				}
				options_html= options_html + str_option;
			}

			var str_html =
			"<div class='rows-per-page'> Number of rows per page: "+"<select class='form-control input custom' onchange='search.update_page_limit(this.options[selectedIndex].text)'' id='sel1'> </div>"+
				options_html+"</select>";

			rowsxpage_container.innerHTML = str_html;
			return str_html;
		}else {
			return -1;
		}
	}

	function tot_results(tot_r) {
		if (rowsxpage_container != null) {
			const newDiv = document.createElement('div');
			newDiv.innerHTML = '<span id="tot_val">'+String(tot_r)+'</span> resources found';
			newDiv.className = 'tot-results';
			rowsxpage_container.appendChild(newDiv);
			return newDiv;
		}else {
			return -1;
		}
	}

	/*creates the sort-input-box dom*/
	function sort_box(arr_options,def_value, def_order, def_type){
		//var options_html = "<option disabled selected value></option>";
		if (sort_container != null) {
			var str_selected = "";
			var options_html = "";
			var default_field = false;

			for (var i = 0; i < arr_options.length; i++) {
				str_selected = "";
				if ((arr_options[i].value == def_value)
					&& (arr_options[i].order == def_order)
					&& (arr_options[i].type == def_type)) {
						str_selected = "selected='selected'";
						default_field = true;
				}
				var str_option = "<option "+str_selected+" value="+arr_options[i].value+" type="+arr_options[i].type+" order="+arr_options[i].order+">"+arr_options[i].text+"</option>";

				options_html= options_html + str_option;
			}

			str_selected = "";
			if (!default_field) {str_selected = "selected='selected'";}
			var str_option = "<option "+str_selected+" value='none' type='none' order='none'>"+"None"+"</option>";
			options_html= options_html + str_option;

			var str_html =
				"<div class='sort-results'>Sort: <select class='form-control input custom' onchange='search.check_sort_opt(this.options[selectedIndex])' id='sort_box_input'></div>"+
				options_html+"</select>";

			sort_container.innerHTML = str_html;
			return str_html;
		}else {
			return -1;
		}
	}

	/*creates the search main-entry (a big searching-box)*/
	function main_entry(search_base_path){
		var str_html = "<div class='search-entry'>"+
											"Search inside the <a href='/'><span class='theme-color'>Open</span><span class='oc-blue'>Citations</span></a> corpus"+
											"<form class='input-group search-box' action='"+search_base_path+"' method='get'>"+
											"<input type='text' class='form-control theme-color' placeholder='Search...' name='text'>"+
												"<div class='input-group-btn'>"+
												"<button class='btn btn-default theme-color' type='submit'><i class='glyphicon glyphicon-search'></i></button>"+
												"</div>"+
											"</form>"+
										 "</div>";

		header_container.innerHTML = str_html;
		return str_html;
	}

	function build_extra_elems(extra_elems){
		var str_html = "";
		if (extra_elems == undefined) {
			return -1;
		}
		for (var i = 0; i < extra_elems.length; i++) {

			var elem_type = extra_elems[i].elem_type;
			var elem_value = extra_elems[i].elem_value;
			var elem_class = extra_elems[i].elem_class;
			var elem_innerhtml = extra_elems[i].elem_innerhtml;

			if (elem_type != undefined) {
				var new_elem = document.createElement(elem_type);
				if (elem_value != undefined) {
					new_elem.setAttribute("value",elem_value);
				}
				if (elem_class != undefined) {
					new_elem.setAttribute("class",elem_class);
				}
				if (elem_innerhtml != undefined) {
					new_elem.innerHTML = elem_innerhtml;
				}
				if (extra_elems[i].others != undefined) {
					for (var keyfield in extra_elems[i].others) {
						new_elem.setAttribute(keyfield,extra_elems[i].others[keyfield]);
					}
				}
				str_html = str_html + new_elem.outerHTML;
			}
		}
		extra_container.innerHTML = str_html;
	}

	/*creates the advanced search interface*/
	function build_advanced_search(arr_categories, arr_rules, adv_cat_selected, search_base_path, adv_btn_title){

		var str_lis = __build_cat_menu(arr_categories, arr_rules, adv_cat_selected);
		var str_options = _build_rules_options(arr_rules, adv_cat_selected);

		var str_html =
						"<p>"+
						"<div class='adv-search'>"+
								"<div class='adv-search-nav'>"+
									"<ul class='nav pages-nav'>"+
									str_lis+
									"</ul>"+
								"</div>"+
								"<form action='"+search_base_path+"' method='get'>"+
									"<div class='adv-search-body'>"+
										_build_rule_entry(0, arr_rules, adv_cat_selected) +
										"<p><table id='adv_rules_tab' class='adv-rules-tab'></table></p>"+
									"</div>"+
									"<div class='adv-search-footer'>"+
										"<div class='input-group-btn'>"+
											"<button class='btn btn-default theme-color' id='advsearch_btn'> <span class='search-btn-text'>"+adv_btn_title+"</span><i class='glyphicon glyphicon-search large-icon'></i></button>"+
											"<button type='button' class='btn btn-default theme-color' id='add_rule_btn'> <span class='add-btn-text'> Add Rule </span><i class='glyphicon glyphicon-plus normal-icon'></i></button>"+
										"</div>"+
									"</div>"+
								"</form>"+
						"</div>"+
						"</p>";
		extra_container.innerHTML = str_html;
		document.getElementById("add_rule_btn").onclick = function(){htmldom.add_adv_rule(arr_rules, adv_cat_selected)};
		return str_html;

		function __build_cat_menu(arr_categories, arr_rules, adv_cat_selected, build_for_one_cat = false){
			var str_lis = "";
			if ((!build_for_one_cat) && (arr_categories.length <= 1)) {
				return str_lis;
			}
			for (var i = 0; i < arr_categories.length; i++) {
				if (arr_categories[i].in_adv_menu != undefined){
					if (arr_categories[i].in_adv_menu == false) {
						continue;
					}
				}
				var is_active = "";
				if (arr_categories[i].name == adv_cat_selected) {
					is_active = "active";
				}

				var str_href = "javascript:search.switch_adv_category('"+arr_categories[i].name+"')";
				str_lis = str_lis + "<li class='"+is_active+"'><a href="+str_href+">"+arr_categories[i].label+"</a></li>"
			}
			return str_lis;
		}
	}

	/*creates add inserts a new advanced rule*/
	function add_adv_rule(arr_rules, adv_cat_selected){
		var table = document.getElementById("adv_rules_tab");

		id_rows++;
		var str_html = ''+
			'<fieldset id="'+id_rows+'">'+
				'<div class="adv btn-group" data-toggle="buttons">'+
					'<label class="btn btn-secondary active">'+
					'<input name="bc_'+id_rows+'" value="and" type="radio" entryid="'+id_rows+'" class="btn btn-default" checked>And'+
					'</label>'+
					'<label class="btn btn-secondary" value="or">'+
					'<input name="bc_'+id_rows+'" value="or" type="radio" entryid="'+id_rows+'" class="btn btn-default">Or'+
					'</label>'+
					'<label class="btn btn-secondary" value="and_not">'+
					'<input name="bc_'+id_rows+'" value="and_not" type="radio" entryid="'+id_rows+'" class="btn btn-default">And Not'+
					'</label>'+
				'</div>'+
				'<div class="adv btn remove">'+
				'<button entryid="'+id_rows+'" class="btn btn-default theme-color" id="remove_rule_btn" onclick="htmldom.remove_adv_rule('+id_rows+')" class="remove-rule-btn">Remove <i class="glyphicon glyphicon-minus normal-icon"></i> </button>'+
				'</div>'+
			'</fieldset>'+
			_build_rule_entry(id_rows, arr_rules, adv_cat_selected)+
			'';
		var tr_rule = document.createElement("tr");
		var tabCell = document.createElement("td");
		tabCell.innerHTML = str_html;
		tr_rule.appendChild(tabCell);
		var tr = table.insertRow(-1);
		tr.innerHTML = tr_rule.outerHTML;
		tr.ruleid = id_rows;
	}

	/*removes an advanced rule from the table*/
	function remove_adv_rule(rule_id){
			var table = document.getElementById("adv_rules_tab");
			//remove my row and the next one
			for (var i = 0; i < table.rows.length; i++) {
				   //iterate through rows
					 if (table.rows[i].ruleid == rule_id) {
						 table.deleteRow(i);
						 break;
					 }
			}
	 }

	 /*creates the container of the buttons: All, Show-only, Exclude */
	function filter_btns(){
		if (filter_btns_container != null) {
			var str_html =
				"<div class='btn-group filters-btns' id='filters_btns' active='false' role='group'>"+
				"<button type='button' class='btn btn-primary' id='all' onclick='search.show_all();'>All</button>"+
				"<button type='button' class='btn btn-primary' id='show-only' onclick='search.show_or_exclude("+true+");' disabled>Show only</button>"+
				"<button type='button' class='btn btn-primary' id='exclude' onclick='search.show_or_exclude("+false+");' disabled>Exclude</button>"+
				"</div>"
				;
			filter_btns_container.innerHTML = str_html;
			return str_html;
		}else {
			return -1;
		}
	}

	/*creates a table containing the history of filters applied*/
	function filter_history_tab(){
		var new_tab = document.createElement('table');
		new_tab.setAttribute("id", 'filter_history_tab');
		new_tab.setAttribute("class", 'filter-history-tab');
		var new_p = document.createElement('p');
		new_p.innerHTML = new_tab.outerHTML;

		//var str_html = "<p><table id='filter_history_tab' class='filter-history-tab'></table></p>";
		var mydiv = document.getElementById('filters_btns');
		mydiv.after(new_p);
	}

	/*resets the table containing the history of filters applied */
	function reset_filter_history_tab(){
		var rows =  document.getElementById("filter_history_tab").rows;
		for (var i = rows.length - 1; i >= 0; i--) {
			document.getElementById("filter_history_tab").deleteRow(i);
		}
	}

	/*creates and adds an entry filter history to the table*/
	function add_filentry_history(arr_options=[], filter_type = "", filter_fields_arr = []){
		if (arr_options.length > 0) {
			var filter_history_tab = document.getElementById("filter_history_tab");

			var str_type = "Exclude";
			if (filter_type) {
				str_type = "Show only";
			}
			var str_html = (filter_history_tab.rows.length+1)+") "+ str_type + ": ";
			var str_span = " &#8259; ";
			for (var i = 0; i < arr_options.length; i++) {
				if (i == arr_options.length-1) {
					str_span = " ";
				}
				var str_field = arr_options[i].field;
				var filter_field_index = util.index_in_arrjsons(filter_fields_arr,["value"],[arr_options[i].field]);
				if (filter_field_index != -1) {
					str_field = filter_fields_arr[filter_field_index].title;
				}

				str_html = str_html +"<span class='theme-color'>"+arr_options[i].label+" ("+str_field+")" +"</span>"+str_span;
			}

			var tabCell = document.createElement("td");
			tabCell.innerHTML = str_html;
			var tr =  filter_history_tab.insertRow(-1);
			tr.appendChild(tabCell);
		}
	}

	/*creates the results limit filter*/
	function limit_filter(init_val, tot_res, slider_min, slider_max){
		if (limitres_container != null) {
			str_html =
			"<div class='limit-results'>"+
			"Limit to <myrange class='limit-results-value' id='lbl_range' for='final_text'> "+String(init_val)+"</myrange>/"+String(tot_res)+" results"+
			"</div>"+
			"<div class='slider-container'>"+
			"<input type='range' min="+String(slider_min)+" max="+String(slider_max)+" value="+String(init_val)+" class='slider' oninput='lbl_range.innerHTML=this.value; search.update_res_limit(this.value);' id='myRange'>"+
			"</div>"+
			"<div class='slider-footer'>"+
			"<div class='left'>&#60; Fewer</div><div class='right'>More &#62;</div>"+
			"</div>";

			//str_html = "<div class='tot-results'><span id='lbl_range'> "+String(init_val)+"</span> resources found"+"</div>";
			limitres_container.innerHTML = str_html;
			return str_html;
		}else {
			return -1;
		}
	}

	/*creates the values-filter section*/
	function filter_checkboxes(table_conf) {
		if (filter_values_container != null) {

			//array of tables
			var tab_arr = [];

			// build cells of fields to filter
			var myfields = table_conf.filters.fields;
			for (var i = 0; i < myfields.length; i++) {

						var divtab = __create_inner_tab_container(myfields[i].value)
						var table = divtab.firstChild;

						//insert the header
						var tr = table.insertRow(-1);
						var href_string = "javascript:search.select_filter_field('"+String(myfields[i].value)+"');";
						tr.innerHTML = _field_filter_dropdown(myfields[i], href_string, false).outerHTML;

						var arr_check_values = util.get_sub_arr(table_conf.filters.arr_entries,"field",myfields[i].value);
						//in case i don't have checkbox values i remove header
						if (arr_check_values.length == 0) {
							table.deleteRow(table.rows.length -1);
						}else
						{
							if (myfields[i].dropdown_active == true)
							{
									var inner_divtab = __create_inner_tab_container("filter_innervalues");

									arr_check_values = util.sort_objarr_by_key(arr_check_values, myfields[i].config.order, myfields[i].config.sort, myfields[i].config.type_sort);
									var j_from = table_conf.view.fields_filter_index[myfields[i].value].i_from;
									var j_to = table_conf.view.fields_filter_index[myfields[i].value].i_to;
									if (j_to > arr_check_values.length) { j_to = arr_check_values.length;}

									for (var j = j_from; j < j_to; j++) {
										//insert a checkbox entry
										tr = inner_divtab.firstChild.insertRow(-1);
										tr.innerHTML = _checkbox_value(myfields[i],arr_check_values[j]).outerHTML;
									}
									tr = inner_divtab.firstChild.insertRow(-1);
									tr.innerHTML = _filter_vals_pages_nav(j_from,j_to,arr_check_values.length,myfields[i]).outerHTML;

									tab_arr.push(divtab);
									tab_arr.push(inner_divtab);
							}else {
								//dropdown is closed
								var tr = table.rows[table.rows.length -1];
								tr.innerHTML = _field_filter_dropdown(myfields[i], href_string, true).outerHTML;

								tab_arr.push(divtab);
							}
					}
				}

				filter_values_container.innerHTML = "";
				for (var i = 0; i < tab_arr.length; i++) {
					filter_values_container.appendChild(tab_arr[i]);
				}
				//filter_values_container.appendChild(table);

				__update_checkboxes();

				//click and check the enabled checkboxes
				function __update_checkboxes() {

					var myfields = table_conf.filters.fields;
					for (var i = 0; i < myfields.length; i++) {
						if (myfields[i].dropdown_active == true){
							var arr_check_values = util.get_sub_arr(table_conf.filters.arr_entries,"field",myfields[i].value);
							var j_to = arr_check_values.length;
							for (var j = 0; j < j_to; j++) {
								var dom_id = arr_check_values[j].field+"-"+arr_check_values[j].value;
								if (arr_check_values[j].checked == true) {
									document.getElementById(dom_id).click();
								}
							}
						}
					}
				}
				function __create_inner_tab_container(class_val){
					// create dynamic table
					var table = document.createElement("table");
					table.className = "table filter-values-tab";

					var divtab = document.createElement("div");
					divtab.className = class_val;
					divtab.appendChild(table);
					return divtab;
				}
		}
	}

	/*creates the loader panel (while waiting for the results)*/
	function loader(build_bool, progress_loader, query_label=null, on_remove_text = null){
		if (header_container != null) {
			if (build_bool) {
				if (query_label != null) {
					retain_box_value(input_box_container,query_label);
				}

				var abort_obj = progress_loader.abort;
				var str_html_abort = "";
				if (abort_obj != undefined) {
  				str_html_abort = "<p><div id='abort_search' class='abort-search'><a href="+abort_obj.href_link+" class='allert-a'>"+abort_obj.title+"</a></div></p>";
				}

				var title_obj = progress_loader.title;
				var str_html_title = "";
				if (title_obj != undefined) {
					str_html_title = "<p><div id='search_loader' class='searchloader'>"+title_obj+"</div></p>";
				}

				var subtitle_obj = progress_loader.subtitle;
				var str_html_subtitle = "";
				if (subtitle_obj != undefined) {
					str_html_subtitle = "<p><div class='searchloader subtitle'>"+subtitle_obj+"</div></p>";
				}

				var spinner_obj = progress_loader.spinner;
				var str_html_spinner = "";
				if ((spinner_obj != undefined) && (spinner_obj == true)){
					str_html_spinner = "<p><div class='searchloader loader-spinner'></div></p>";
				}

				var str_html = str_html_title + str_html_subtitle + str_html_spinner + str_html_abort;
				parser = new DOMParser()
	  		//var dom = parser.parseFromString(str_html, "text/xml").firstChild;
				//header_container.appendChild(dom);
				extra_container.innerHTML = str_html;
			}else {
				//var element = document.getElementById("search_loader");
				//element.parentNode.removeChild(element);
				if (on_remove_text != null) {
					extra_container.innerHTML = on_remove_text;
				}
				extra_container.innerHTML = "";
			}
		}
	}

	/*updates the table of results*/
	function update_res_table(table_conf,search_conf_json){

		if (results_container != null) {

				var new_arr_tab = __build_page(table_conf);
				results_container.innerHTML = "";
				results_container.appendChild(new_arr_tab[0]);
				results_container.appendChild(new_arr_tab[1]);

				function __build_page(){
					// create new tables
					var new_tab_res = document.createElement("table");
					var new_footer_tab = document.createElement("table");

					new_tab_res.id = "tab_res";
					new_tab_res.className = "table results-tab";

					//create table header
					var col = table_conf.view.data["head"]["vars"];
					var tr = new_tab_res.insertRow(-1);
					var index_category = util.index_in_arrjsons(search_conf_json.categories,["name"],[table_conf.category]);
					var category_fields = search_conf_json.categories[index_category].fields;

					tr.innerHTML = _table_res_header(col, category_fields).outerHTML;

					//create tr of all the other results
					var results = table_conf.view.data["results"]["bindings"];
					if (results.length > 0) {
						var i_from = table_conf.view.page * table_conf.view.page_limit;
						var i_to = i_from + table_conf.view.page_limit;
						if (i_to > results.length){i_to = results.length;}

						for (var i = i_from; i < i_to; i++) {
								tr = new_tab_res.insertRow(-1);
								tr.innerHTML = _table_res_list(col,category_fields,results[i]).outerHTML;
						}

						//i will build the nav index for the pages
						new_footer_tab = _table_footer(false, __init_prev_next_btn());
					}else {
						//i have no results
						new_footer_tab = _table_footer(true, "No results were found");
					}

					return [new_tab_res,new_footer_tab];

					function __init_prev_next_btn(){
						var num_results = table_conf.view.data["results"]["bindings"].length;
						var tot_pages = Math.floor(num_results/table_conf.view.page_limit);
						if(num_results % table_conf.view.page_limit > 0){tot_pages = tot_pages + 1;}
						var arr_values = __init_page_nav(tot_pages);
						return _res_table_pages_nav(arr_values, table_conf.view.page, tot_pages, table_conf.view.data.results.bindings.length, table_conf.view.page_limit);
					}
					function __init_page_nav(tot_pages){

						var c_pages = 5;

						//get the number of previous c_pages before me
						var current_page = table_conf.view.page + 1;
						var all_arr_values = __prev_values(c_pages,current_page - 1);
						var min_index = all_arr_values[all_arr_values.length - 1];

						//get the number of next c_pages before me
						var remaining_values = (c_pages - all_arr_values.length) + c_pages;
						var index = current_page + 1;
						var res_obj = __next_values(remaining_values,index,tot_pages);
						all_arr_values = all_arr_values.concat(res_obj.arr);
						remaining_values = res_obj["remaining_values"];

						//get other pages numbers previous to me if I have not still reached a c_pages*2 num
						res_obj = __prev_values(remaining_values,min_index - 1);
						all_arr_values = all_arr_values.concat(res_obj);

						//push my page also
						all_arr_values.push(current_page);

						return all_arr_values.sort(util.sort_int);

						//returns an array of the indexes before me
						function __next_values(rm,i,tot_pages){
							var arr_values = [];
							var remaining_values = rm;
							var index = i;
							while ((remaining_values > 0) && (index <= tot_pages)) {
								arr_values.push(index);
								index = index + 1;
								remaining_values = remaining_values - 1;
							}
							return {"arr": arr_values, "remaining_values": remaining_values};
						}

						//returns an array of the indexes before me
						function __prev_values(rm,i){
							var arr_values = [];
							var remaining_values = rm;
							var index = i;
							while ((remaining_values > 0) && (index > 0)) {
								arr_values.push(index);
								index = index - 1;
								remaining_values = remaining_values - 1;
							}
							return arr_values;
						}
					}
				}
			}
	}

	function update_tab_entry_field(table_field_key, entry_data_key, entry_data_field, my_field_conf, obj_val){

		//console.log(entry_data_field);
		//console.log(obj_val);
		var tab_res = document.getElementById("tab_res");
		var tr_index = _get_index_of_tr(tab_res, table_field_key, entry_data_key);

		if(tr_index != -1){
			for (var j = 0; j < tab_res.rows[tr_index].cells.length; j++) {
				var mycell = tab_res.rows[tr_index].cells[j];
				if (mycell.getAttribute("field") == entry_data_field) {
					var cell_inner = _cell_inner_str(obj_val, entry_data_field, my_field_conf.value_text_len);
					mycell.setAttribute("value", cell_inner.str_value);
					mycell.innerHTML = cell_inner.str_html;
				}
			}
		}

		function _get_index_of_tr(tab_res, table_field_key, entry_data_key){
			for (var i = 0; i < tab_res.rows.length; i++) {
				for (var j = 0; j < tab_res.rows[i].cells.length; j++) {
					var mycell = tab_res.rows[i].cells[j];
					if (mycell.getAttribute("field") == table_field_key) {
						if (mycell.getAttribute("value") == entry_data_key) {
							return i;
						}
					}
				}
			}
			return -1;
		}

	}

	/*disable/enable the filter buttons: Show-only, Exclude */
	function disable_filter_btns(flag) {
		var show_only_btn = document.getElementById("show-only");
		var exclude_btn = document.getElementById("exclude");

		if (show_only_btn != null) {
			show_only_btn.disabled = flag;
		}
		if (exclude_btn != null) {
			exclude_btn.disabled = flag;
		}
	}

	/*keep the free searching text value inside the box*/
	function retain_box_value(input_container, txtval){
		for (var i = 0; i < input_container.length; i++) {
			//input_container[i].placeholder = txtval ;
			input_container[i].value = txtval ;
		}
	}

	/*creates the export button*/
	function build_export_btn(){
		if (export_container != null) {
			if (export_container.firstChild != null) {
				return 1;
			}
			var link = document.createElement("a");
			link.id = "export_a";
			link.className = "search-a export-results";
			link.innerHTML = "Export results";
			link.setAttribute("href", "javascript:search.export_results();");

			export_container.appendChild(link);
			return 1;
			//header_container.appendChild(link);
		}
	}

	/*set download href of the export button*/
	function download_results(csv_data){
		var export_a = document.getElementById("export_a");
		export_a.setAttribute("href", csv_data);
		export_a.setAttribute("download", "results.csv");
		export_a.click();
	}

	/*reset all divs*/
	function reset_html_structure() {
		if (results_container != null) {
			results_container.innerHTML = "";
		}
		if (rowsxpage_container != null) {
			rowsxpage_container.innerHTML = "";
		}
		if (sort_container != null) {
			sort_container.innerHTML = "";
		}
		if (export_container != null) {
			export_container.innerHTML = "";
		}
		if (limitres_container != null) {
			limitres_container.innerHTML = "";
		}
		if (filter_btns_container != null) {
			filter_btns_container.innerHTML = "";
		}
		if (filter_values_container != null) {
			filter_values_container.innerHTML = "";
		}
		if (extra_container != null) {
			extra_container.innerHTML = "";
		}

	}

	return {
		page_limit: page_limit,
		tot_results: tot_results,
		sort_box: sort_box,
		main_entry: main_entry,
		build_extra_elems: build_extra_elems,
		build_advanced_search: build_advanced_search,
		filter_btns: filter_btns,
		limit_filter: limit_filter,
		filter_checkboxes: filter_checkboxes,
		add_filentry_history: add_filentry_history,
		filter_history_tab: filter_history_tab,
		reset_filter_history_tab: reset_filter_history_tab,
		update_res_table: update_res_table,
		update_tab_entry_field: update_tab_entry_field,
		disable_filter_btns:disable_filter_btns,
		loader: loader,
		build_export_btn: build_export_btn,
		add_adv_rule: add_adv_rule,
		remove_adv_rule: remove_adv_rule,
		reset_html_structure:reset_html_structure,
		download_results: download_results,
		adv_placeholder: adv_placeholder
	}
})();
