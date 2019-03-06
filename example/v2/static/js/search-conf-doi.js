var search_conf = {
  "sparql_endpoint": "https://w3id.org/oc/index/coci/sparql",
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
  ],

"categories": [
  {
      "name": "citation",
      "label": "Citation",
      "macro_query": [
        "SELECT DISTINCT ?iri ?short_iri ?shorter_coci ?citing_doi ?citing_doi_iri ?cited_doi ?cited_doi_iri ?creationdate ?timespan",
            "WHERE  {",
              "[[RULE]]",
              "OPTIONAL {",
                "BIND(REPLACE(STR(?iri), 'https://w3id.org/oc/index/coci/ci/', '', 'i') as ?short_iri) .",
                //"BIND(CONCAT(SUBSTR(STR(?short_iri), 0, 20), '...') as ?shorter_coci) .",
                "?iri cito:hasCitingEntity ?citing_doi_iri .",
                "BIND(REPLACE(STR(?citing_doi_iri), 'http://dx.doi.org/', '', 'i') as ?citing_doi) .",
                "?iri cito:hasCitedEntity ?cited_doi_iri .",
                "BIND(REPLACE(STR(?cited_doi_iri), 'http://dx.doi.org/', '', 'i') as ?cited_doi) .",
                "?iri cito:hasCitationCreationDate ?creationdate .",
                "?iri cito:hasCitationTimeSpan ?timespan .",
              "}",
            "}",
            //"ORDER BY DESC(?score) ",
            //"LIMIT 2000"
      ],
      "fields": [
        {"iskey": true, "value":"short_iri", "value_map": [], "limit_length": 20, "title": "COCI IRI","column_width":"10%", "type": "text", "sort":{"value": "short_iri", "type":"text"}, "link":{"field":"iri","prefix":""}},
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
        {"elem_type": "a","elem_value": "Back to search" ,"elem_class": "btn btn-primary left" ,"elem_innerhtml": "Back to search", "others": {"href": "/index/coci/search"}},
        {"elem_type": "br","elem_value": "" ,"elem_class": "" ,"elem_innerhtml": ""},
        {"elem_type": "br","elem_value": "" ,"elem_class": "" ,"elem_innerhtml": ""},
      ]
    },
    {
      "name": "author",
      "label": "Author",
      "macro_query": [
        `
        SELECT DISTINCT ?author ?short_iri ?short_iri_id ?genderLabel ?dateLabel ?employerLabel ?educationLabel ?orcid ?authorLabel ?countryLabel ?occupationLabel (COUNT(distinct ?a_work) AS ?works) WHERE {
            ?work wdt:P31 wd:Q13442814;
                wdt:P50 ?author .

            #Filters
            [[RULE]]

            #Fields
            BIND(REPLACE(STR(?author), 'http://www.wikidata.org/', '', 'i') as ?short_iri) .
            BIND(REPLACE(STR(?short_iri), 'entity/Q', '', 'i') as ?short_iri_id) .

            OPTIONAL {
              ?a_work wdt:P31 wd:Q13442814;
                  wdt:P50 ?author .
            }
            OPTIONAL {?author wdt:P27 ?country.}
            OPTIONAL {?author wdt:P496 ?orcid.}
            OPTIONAL {?author wdt:P21 ?gender.}
            OPTIONAL {?author wdt:P569 ?date_dt.}
            BIND(CONCAT(STR(DAY(?date_dt)), "/", STR(MONTH(?date_dt)), "/", STR(YEAR(?date_dt))) as ?date ) .
            OPTIONAL {?author wdt:P108 ?employer.}
            OPTIONAL {?author wdt:P69 ?education}
            OPTIONAL {?author wdt:P106 ?occupation.}
            SERVICE wikibase:label { bd:serviceParam wikibase:language 'en'. }
        }
        GROUP BY ?author ?short_iri ?short_iri_id ?genderLabel ?dateLabel ?employerLabel ?educationLabel ?orcid ?authorLabel ?countryLabel ?occupationLabel
        LIMIT 500
        `
      ],
      "fields": [
        {
          "value":"short_iri", "title": "Q-ID","column_width":"20%","type": "text",
          "link":{"field":"author","prefix":""}
        },
        {
          "value":"authorLabel", "title": "Full Name","column_width":"30%","type": "text",
          "sort":{"value": "authorLabel", "type":"text"},
          "link":{"field":"short_iri_id","prefix":"https://opencitations.github.io/lucinda/example/wikidata/browser.html?browse=Q"}
        },
        {
          "value":"countryLabel", "title": "Country","column_width":"25%","type": "text",
          "sort":{"value": "countryLabel", "type":"text"},
          "filter":{"type_sort": "text", "min": 10000, "sort": "value", "order": "desc"}
        },
        {
          "value":"occupationLabel", "title": "Occupation","column_width":"25%","type": "text",
          "sort":{"value": "occupationLabel", "type":"text"},
          "filter":{"type_sort": "text", "min": 10000, "sort": "value", "order": "desc"}
        },
        {
          "value":"works", "title": "Works","column_width":"25%","type": "text",
          "sort":{"value": "works", "type":"int"}
        }
      ],
      "group_by": {"keys":["author"], "concats":["occupationLabel"]},
      "extra_elems":[
        {"elem_type": "a","elem_value": "Back to search" ,"elem_class": "btn btn-primary left" ,"elem_innerhtml": "Back to search", "others": {"href": "wikidata.html"}},
        {"elem_type": "br","elem_value": "" ,"elem_class": "" ,"elem_innerhtml": ""},
        {"elem_type": "br","elem_value": "" ,"elem_class": "" ,"elem_innerhtml": ""},
      ]
    }
  ],

  "page_limit": [5,10,15,20,30,40,50],
  "page_limit_def": 10,
  "def_results_limit": 1,
  "search_base_path": "wikidata.html",
  "advanced_search": true,
  "def_adv_category": "document",
  "adv_btn_title": "Search the Wikidata Corpus",

  "progress_loader":{
            "visible": true,
            "spinner": true,
            "title":"Searching the Wikidata corpus ...",
            "subtitle":"Be patient - this search might take several seconds!",
            "abort":{"title":"Abort Search","href_link":"wikidata.html"}
          },
  "timeout":{
    "time": 120,
    "link": "/search"
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