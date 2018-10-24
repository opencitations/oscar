var search_conf = {
"sparql_endpoint": "https://query.wikidata.org/sparql",
"prefixes": [
    {"prefix":"wd","iri":"http://www.wikidata.org/entity/"},
    {"prefix":"wds","iri":"http://www.wikidata.org/entity/statement/"},
    {"prefix":"wdv","iri":"http://www.wikidata.org/value/"},
    {"prefix":"wdt","iri":"http://www.wikidata.org/prop/direct/"},
    {"prefix":"wikibase","iri":"http://wikiba.se/ontology#"},
    {"prefix":"p","iri":"http://www.wikidata.org/prop/"},
    {"prefix":"ps","iri":"http://www.wikidata.org/prop/statement/"},
    {"prefix":"pq","iri":"http://www.wikidata.org/prop/qualifier/"},
    {"prefix":"rdfs","iri":"http://www.w3.org/2000/01/rdf-schema#"},
    {"prefix":"bd","iri":"http://www.bigdata.com/rdf#"},
  ],
"rules":  [
    {
      "name":"doi",
      "label": "DOI",
      "advanced": true,
      "freetext": false,
      //"heuristics": [[lower_case]],
      "category": "document",
      "regex":"(10.\\d{4,9}\/[-._;()/:A-Za-z0-9][^\\s]+)",
      "query": [
        "{",
        "?work wdt:P356 '[[VAR]]' .",
        "}"
      ]
    },
    {
      "name":"keyword",
      "label": "Keywords",
      "advanced": true,
      "freetext": false,
      "category": "document",
      "regex":"[-'a-zA-Z ]+$",
      "query": [
        "{",
          "?work rdfs:label ?lbl1 .",
          "?work wdt:P31 wd:Q13442814.",
          "FILTER (langMatches( lang(?lbl1), 'EN' ) )",
          "FILTER( regex(?lbl1, '[[VAR]]' ))",
        "}"
      ]
    },
    {
      "name":"orcid",
      "label": "ORCID",
      "advanced": true,
      "freetext": false,
      "category": "author",
      "regex":"([\\S]{4}-[\\S]{4}-[\\S]{4}-[\\S]{4})",
      "query": [
          "{",
          "?author wdt:P31 wd:Q5.",
          "?author wdt:P496 '[[VAR]]'.",
          "}"
      ]
    },
    {
      "name":"lastname",
      "label": "Last name",
      "advanced": true,
      "freetext": false,
      "heuristics": [[lower_case,capitalize_1st_letter]],
      "category": "author",
      "regex":"[-'a-zA-Z ]+$",
      "query": [
          "{",
          "?object wdt:P31 wd:Q13442814",
          "; wdt:P50 ?author .",
          //"?author rdfs:label ?lbl1 .",
          //"FILTER (langMatches( lang(?lbl1), 'EN' ))",
          //"FILTER (regex(?lbl1, '[[VAR]]'))",
          "?author wdt:P734 ?famName .",
          "?famName rdfs:label '[[VAR]]'@en .",
          "}"
      ]
    },
    {
      "name":"firstname",
      "label": "First name",
      "advanced": true,
      "freetext": false,
      "heuristics": [[lower_case,capitalize_1st_letter]],
      "category": "author",
      "regex":"[-'a-zA-Z ]+$",
      "query": [
          "{",
          "?object wdt:P31 wd:Q13442814",
          "; wdt:P50 ?author .",
          //"?author rdfs:label ?lbl1 .",
          //"FILTER (langMatches( lang(?lbl1), 'EN' ))",
          //"FILTER (regex(?lbl1, '[[VAR]]'))",
          "?author wdt:P735 ?gName .",
          "?gName rdfs:label '[[VAR]]'@en .",
          "}"
      ]
    }
  ],

"categories": [
    {
      "name": "document",
      "label": "Scholarly article",
      "macro_query": [
        "select ?work ?short_iri ?short_iri_id ?title ?venueLabel (STR(YEAR (?alldate)) as ?date) ?volume ?author ?authorname ?issue ?pages ?license ?doi ?url ?type where {",
            "[[RULE]]",
            "?work wdt:P31 wd:Q13442814.",
            "optional { ?work wdt:P1476 ?title .}",
            "optional {",
              "?work wdt:P50 ?author .",
              "?author rdfs:label ?authorname .",
              "FILTER (langMatches( lang(?authorname), 'EN' ) )",
            "}",
            "BIND(REPLACE(STR(?work), 'http://www.wikidata.org/', '', 'i') as ?short_iri) .",
            "BIND(REPLACE(STR(?short_iri), 'entity/Q', '', 'i') as ?short_iri_id) .",
            "optional { ?work wdt:P1433 ?venue . }",
            "optional { ?work wdt:P577 ?alldate . }",
            "optional { ?work wdt:P478 ?volume . }",
            "optional { ?work wdt:P433 ?issue . }",
            "optional { ?work wdt:P304 ?pages . }",
            "optional { ?work wdt:P275 ?license_ .}",
            "optional { ?work wdt:P356 ?doi . }",
            "optional { ?work wdt:P953 ?url . }",
            "}",
            "LIMIT 500"
      ],
      "fields": [
        {
          "value":"short_iri", "title": "Q-ID","column_width":"15%","type": "text",
          "label":{"field":"short_iri_id"},
          "link":{"field":"work","prefix":""},
          "sort":{"value": "short_iri.label", "type":"int"}
        },
        {
          "value":"title", "title": "Work title","column_width":"35%","type": "text",
          "sort":{"value": "title", "type":"text"}
        },
        {
          "value":"authorname", "title": "Authors", "column_width":"38%","type": "int",
          "link":{"field":"author","prefix":""}
        },
        {
          "value":"date", "title": "Date", "column_width":"12%","type": "text",
          "sort":{"value": "date", "type":"int"},
          "filter":{"type_sort": "int", "min": 10000, "sort": "value", "order": "desc"}
        }
      ],
      "group_by": {"keys":["work"], "concats":["authorname"]},
      "extra_elems":[
        {"elem_type": "a","elem_value": "Back to search" ,"elem_class": "btn btn-primary left" ,"elem_innerhtml": "Back to search", "others": {"href": "wikidata.html"}},
        {"elem_type": "br","elem_value": "" ,"elem_class": "" ,"elem_innerhtml": ""},
        {"elem_type": "br","elem_value": "" ,"elem_class": "" ,"elem_innerhtml": ""},
      ]
    },
    {
      "name": "author",
      "label": "Author",
      "macro_query": [
        "SELECT DISTINCT ?author ?short_iri ?authorLabel ?countryLabel ?occupationLabel WHERE {",
          "[[RULE]]",
          "BIND(REPLACE(STR(?author), 'http://www.wikidata.org/', '', 'i') AS ?short_iri)",
          "OPTIONAL {?author wdt:P27 ?country.}",
          "OPTIONAL { ?author wdt:P106 ?occupation.}",
          "SERVICE wikibase:label { bd:serviceParam wikibase:language 'en'. }",
        "}",
        "LIMIT 500"
      ],
      "fields": [
        {
          "value":"short_iri", "title": "Q-ID","column_width":"20%","type": "text",
          "link":{"field":"author","prefix":""}
        },
        {
          "value":"authorLabel", "title": "Full Name","column_width":"30%","type": "text",
          "sort":{"value": "authorLabel", "type":"text"}
        },
        {
          "value":"countryLabel", "title": "Country","column_width":"25%","type": "text",
          "sort":{"value": "countryLabel", "type":"text"}
        },
        {
          "value":"occupationLabel", "title": "Occupation","column_width":"25%","type": "text",
          "sort":{"value": "occupationLabel", "type":"text"}
        }
      ],
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
    "time": 60,
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