var search_conf = {
"sparql_endpoint": "https://w3id.org/oc/index/sparql",
"prefixes": [
    {"prefix":"cito","iri":"http://purl.org/spar/cito/"},
    {"prefix":"dcterms","iri":"http://purl.org/dc/terms/"},
    {"prefix":"datacite","iri":"http://purl.org/spar/datacite/"},
    {"prefix":"literal","iri":"http://www.essepuntato.it/2010/06/literalreification/"},
    {"prefix":"biro","iri":"http://purl.org/spar/biro/"},
    {"prefix":"frbr","iri":"http://purl.org/vocab/frbr/core#"},
    {"prefix":"c4o","iri":"http://purl.org/spar/c4o/"},
    {"prefix":"bds","iri":"http://www.bigdata.com/rdf/search#"},
    {"prefix":"fabio","iri":"http://purl.org/spar/fabio/"},
    {"prefix":"pro","iri":"http://purl.org/spar/pro/"},
    {"prefix":"rdf","iri":"http://www.w3.org/1999/02/22-rdf-syntax-ns#"}
  ],

"rules":  [
    {
      "name":"citingdoi",
      "label": "References of a specific document",
      "placeholder": "DOI e.g. 10.1016/J.WEBSEM.2012.08.001",
      "advanced": true,
      "freetext": false,
      "heuristics": [[encodeURIStr]],
      "category": "citation",
      "regex":"(10.\\d{4,9}\/[-._;()/:A-Za-z0-9][^\\s]+)",
      "query": [
            "{",
            "?iri cito:hasCitingEntity <http://dx.doi.org/[[VAR]]> .",
            "}"
      ]
    },
    {
      "name":"citeddoi",
      "label": "Citations of a specific document",
      "placeholder": "DOI e.g. 10.1016/J.WEBSEM.2012.08.001",
      "advanced": true,
      "freetext": false,
      "heuristics": [[encodeURIStr]],
      "category": "citation",
      "regex":"(10.\\d{4,9}\/[-._;()/:A-Za-z0-9][^\\s]+)",
      "query": [
            "{",
            "?iri cito:hasCitedEntity <http://dx.doi.org/[[VAR]]> .",
            "}"
      ]
    },
    {
      "name":"oci",
      "label": "Having a specific resource ID",
      "placeholder": "OCI e.g: 0200101...-0200101...",
      "advanced": true,
      "freetext": false,
      "category": "citation",
      "regex":"(\\d{1,}-\\d{1,})",
      "query": [`
        {
          VALUES ?iri { <https://w3id.org/oc/index/coci/ci/[[VAR]]> <https://w3id.org/oc/index/croci/ci/[[VAR]]> }
        }
        `
      ]
    },
    {
      "name":"cits_stats",
      "advanced": false,
      "freetext": false,
      "category": "br_stats",
      "regex":"(10.\\d{4,9}\/[-._;()/:A-Za-z0-9][^\\s]+)",
      "query": [
            "{",
            "BIND(<http://dx.doi.org/[[VAR]]> as ?doi_iri) .",
            "}"
      ]
    }
  ],

"categories": [
    {
      "name": "citation",
      "label": "Citation",
      "macro_query": [
        `
            SELECT DISTINCT ?iri ?short_iri ?citing_doi ?citing_doi_iri ?cited_doi ?cited_doi_iri ?creationdate ?timespan
                        WHERE  {
                        [[RULE]]
                        hint:Prior hint:runFirst true .

                        #Consider citing/cited DOI a must field
                        BIND(STRAFTER(STR(?iri), '/ci/') as ?short_iri) .
                        ?iri cito:hasCitingEntity ?citing_doi_iri .
                        BIND(REPLACE(STR(?citing_doi_iri), 'http://dx.doi.org/', '', 'i') as ?citing_doi) .
                        ?iri cito:hasCitedEntity ?cited_doi_iri .
                        BIND(REPLACE(STR(?cited_doi_iri), 'http://dx.doi.org/', '', 'i') as ?cited_doi) .

                        #we consider as optional only the creation date and the timespan of the citation
                        OPTIONAL {
                            ?iri cito:hasCitationCreationDate ?creationdate .
                            ?iri cito:hasCitationTimeSpan ?timespan .
                          }
            }
            `
      ],
      "fields": [
        {"iskey": true, "value":"short_iri", "value_map": [], "limit_length": 20, "title": "Index IRI","column_width":"10%", "type": "text", "sort":{"value": "short_iri", "type":"text"}, "link":{"field":"iri","prefix":""}},
        {"value":"citing_doi", "value_map": [decodeURIStr],"title": "Citing DOI", "column_width":"12%", "type": "text", "sort":{"value": "citing_doi", "type":"text"}, "link":{"field":"citing_doi_iri","prefix":""}},
        {"value": "ext_data.citing_doi_citation.reference", "title": "Citing reference", "column_width":"19%", "type": "text"},
        {"value":"cited_doi", "value_map": [decodeURIStr], "title": "Cited DOI", "column_width":"12%", "type": "text", "sort":{"value": "cited_doi", "type":"text"}, "link":{"field":"cited_doi_iri","prefix":""}},
        {"value": "ext_data.cited_doi_citation.reference", "title": "Cited reference", "column_width":"19%", "type": "text"},
        {"value":"creationdate", "title": "Creation", "column_width":"8%", "type": "text", "sort":{"value": "creationdate", "type":"text"},"filter":{"type_sort": "int", "min": 10000, "sort": "sum", "order": "desc"}},
        {"value":"timespan", "value_map":[timespan_in_days], "title": "Timespan (days)", "column_width":"13%", "type": "text", "sort":{"value": "timespan", "type":"int"}, "filter":{"type_sort": "int", "min": 10000, "sort": "value", "order": "desc"}}
      ],
      "ext_data": {
        //"citing_doi_citation": {"name": call_crossref, "param": {"fields":["citing_doi"]}, "async": true},
        "citing_doi_citation": {"name": call_crossref_4citation, "param": {"fields":["citing_doi"]}, "async": true},
        "cited_doi_citation": {"name": call_crossref_4citation, "param": {"fields":["cited_doi"]}, "async": true}
      },
      "extra_elems":[
        {"elem_type": "a","elem_value": "Back to search" ,"elem_class": "btn btn-primary left" ,"elem_innerhtml": "Back to search", "others": {"href": "/index/search"}},
        {"elem_type": "br","elem_value": "" ,"elem_class": "" ,"elem_innerhtml": ""},
        {"elem_type": "br","elem_value": "" ,"elem_class": "" ,"elem_innerhtml": ""},
      ]
    },
    {
      "name": "br_stats",
      "interface": false,
      "in_adv_menu": false,
      "macro_query": [`
        SELECT ?doi_iri ?date ?type ?count
            WHERE  {
          			  {
                          Select ?doi_iri ?date ?type (COUNT (DISTINCT ?ci_in) as ?count){
                        			  [[RULE]]
                        			  hint:Prior hint:runFirst true .
                                ?doi_iri ^cito:hasCitedEntity ?ci_in .
                                ?ci_in cito:hasCitationCreationDate ?creation_date_in .
                        			  BIND(SUBSTR(str(?creation_date_in), 0, 4) as ?date) .
                        			  values ?type { "cits_in" }
                          		  #BIND(YEAR(?creation_date_in) as ?creation_date_in_year)
                          }GROUP BY ?doi_iri ?date ?type
          			  }
          			  UNION
          			  {
                          Select ?doi_iri ?date ?type (COUNT (DISTINCT ?ci_out) as ?count){
                        			  [[RULE]]
                        			  hint:Prior hint:runFirst true .
                                ?doi_iri ^cito:hasCitedEntity ?ci_out .
                                ?ci_out cito:hasCitationCreationDate ?creation_date_out .
                        			  BIND(SUBSTR(str(?creation_date_out), 0, 4) as ?date) .
                  				      values ?type { "cits_out" }
                        			  #BIND(YEAR(?creation_date_out) as ?creation_date_out_year)
                          }GROUP BY ?doi_iri ?date ?type
          			  }
          }ORDER BY ?date
        `
      ],
      "fields": [
        {"iskey": true, "value":"doi_iri", "value_map": [], "limit_length": 20, "title": "INDEX IRI","column_width":"10%", "type": "text"},
        {"value":"date", "value_map": [], "limit_length": 20, "title": "INDEX IRI","column_width":"10%", "type": "int"},
        {"value":"type", "value_map": [], "limit_length": 20, "title": "INDEX IRI","column_width":"10%", "type": "text"},
        {"value":"count", "value_map": [], "limit_length": 20, "title": "INDEX IRI","column_width":"10%", "type": "int"}
      ]
    }
  ],

  "page_limit": [5,10,15,20,30,40,50],
  "def_results_limit": 1,
  "search_base_path": "search",
  "advanced_search": true,
  "def_adv_category": "citation",
  "adv_btn_title": "Search in the OpenCitations Indexes",

  "progress_loader":{
            "visible": true,
            "spinner": true,
            "title":"Searching in the OpenCitations Indexes ...",
            "subtitle":"Be patient - this search might take several seconds!",
            "abort":{"title":"Abort Search","href_link":"search"}
          }
  }

//heuristic functions
//you can define your own heuristic functions here
function lower_case(str){
  return str.toLowerCase();
}
function capitalize_1st_letter(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function decodeURIStr(str) {
  return decodeURIComponent(str);
}
function encodeURIStr(str) {
  return encodeURIComponent(str);
}
function timespan_translate(str) {
  var new_str = "";
  var years = 0;
  var months = 0;
  var days = 0;

  let reg = /(\d{1,})Y/g;
  let match;
  while (match = reg.exec(str)) {
    if (match.length >= 2) {
      years = match[1] ;
      new_str = new_str + years +" Years "
    }
  }

  reg = /(\d{1,})M/g;
  while (match = reg.exec(str)) {
    if (match.length >= 2) {
      months = match[1] ;
      new_str = new_str + months +" Months "
    }
  }

  reg = /(\d{1,})D/g;
  while (match = reg.exec(str)) {
    if (match.length >= 2) {
      days = match[1] ;
      new_str = new_str + days +" Days "
    }
  }

  return new_str;
}
function timespan_in_days(str) {
  var new_str = "";
  var years = 0;
  var months = 0;
  var days = 0;

  let reg = /(\d{1,})Y/g;
  let match;
  while (match = reg.exec(str)) {
    if (match.length >= 2) {
      years = parseInt(match[1]) ;
    }
  }

  reg = /(\d{1,})M/g;
  while (match = reg.exec(str)) {
    if (match.length >= 2) {
      months = parseInt(match[1]) ;
    }
  }

  reg = /(\d{1,})D/g;
  while (match = reg.exec(str)) {
    if (match.length >= 2) {
      days = parseInt(match[1]) ;
    }
  }

  return String(years * 365 + months * 30 + days);
}
function short_version(str, max_chars = 20) {
  var new_str = "";
  for (var i = 0; i < max_chars; i++) {
    if (str[i] != undefined) {
      new_str = new_str + str[i];
    }else {
      break;
    }
  }
  return new_str+"...";
}
function call_crossref(conf_params, index, async_bool, callbk_func, key_full_name, data_field, func_name ){
  var call_crossref_api = "https://api.crossref.org/works/";

  var str_doi = conf_params[0];
  if (str_doi != undefined) {
    var call_url =  call_crossref_api+ encodeURIComponent(str_doi);
    //var result_data = "...";
    $.ajax({
          dataType: "json",
          url: call_url,
          type: 'GET',
          async: async_bool,
          success: function( res_obj ) {
              var func_param = [];
              func_param.push(index, key_full_name, data_field, async_bool, func_name, conf_params, res_obj);
              Reflect.apply(callbk_func,undefined,func_param);
          }
     });
  }
}
//https://citation.crosscite.org/format?doi=10.1145%2F2783446.2783605&style=apa&lang=en-US
function call_crossref_4citation(conf_params, index, async_bool, callbk_func, key_full_name, data_field, func_name ){
  var call_crossref_api = "https://citation.crosscite.org/format?doi=";
  var suffix = "&style=apa&lang=en-US";

  var str_doi = conf_params[0];

  if (str_doi != undefined) {
    var call_url =  call_crossref_api+str_doi+suffix;
    //var result_data = "...";
    $.ajax({
          url: call_url,
          type: 'GET',
          async: async_bool,
          success: function( res ) {
              var res_obj = {"reference": res};
              var func_param = [];
              func_param.push(index, key_full_name, data_field, async_bool, func_name, conf_params, res_obj);
              Reflect.apply(callbk_func,undefined,func_param);
          }
     });
  }
}
