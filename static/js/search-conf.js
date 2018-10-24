var search_conf = {
//"sparql_endpoint": "http://localhost:8080/sparql",
"sparql_endpoint": "https://w3id.org/oc/sparql",
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
    {"prefix":"oco","iri":"https://w3id.org/oc/ontology/"},
    {"prefix":"rdf","iri":"http://www.w3.org/1999/02/22-rdf-syntax-ns#"},
    {"prefix":"prism","iri":"http://prismstandard.org/namespaces/basic/2.0/"}
  ],

"rules":  [
    {
      "name":"doi",
      "label": "DOI",
      "advanced": true,
      "freetext": true,
      "heuristics": [[lower_case]],
      "category": "document",
      "regex":"(10.\\d{4,9}\/[-._;()/:A-Za-z0-9][^\\s]+)",
      "query": [
            "{",
            //"?lit bds:search ?doi_txt .  ?lit bds:matchAllTerms 'true' .  ?lit bds:relevance ?score .  ?lit bds:maxRank '1' .",
            "?iri datacite:hasIdentifier/literal:hasLiteralValue '[[VAR]]' .",
            "}"
      ]
    },
    {
      "name":"br_resource",
      "label": "Bibiographic resource Id (br/)",
      "freetext": true,
      "category": "document",
      "regex":"(br\/\\d{1,})",
      "query": [
            "{",
            "BIND(<https://w3id.org/oc/corpus/[[VAR]]> as ?iri) . ",
            "}"
      ]
    },
    {
      "name":"doc_cites_list",
      "label": "List of documents cited by Bibiographic resource IRI",
      "category": "document",
      "regex": "(https:\/\/w3id\\.org\/oc\/corpus\/br\/\\d{1,})",
      "query": [
            "{",
            "<[[VAR]]> cito:cites ?iri .",
            "}"
      ]
    },
    {
      "name":"doc_cites_me_list",
      "label": "List of documents who have cited the Bibiographic resource IRI",
      "category": "document",
      "regex": "(https:\/\/w3id\\.org\/oc\/corpus\/br\/\\d{1,})",
      "query": [
            "{",
            "?iri cito:cites <[[VAR]]> .",
            "}"
      ]
    },
    {
      "name":"orcid",
      "label": "ORCID",
      "advanced": true,
      "freetext": true,
      "category": "author",
      "regex":"([\\S]{4}-[\\S]{4}-[\\S]{4}-[\\S]{4})",
      "query": [
              "{",
              //"?lit bds:search ?orcid_txt . ?lit bds:matchAllTerms 'true' . ?lit bds:relevance ?score . ?lit bds:maxRank '1' .",
              "?author_iri datacite:hasIdentifier/literal:hasLiteralValue '[[VAR]]' .",
              "}"
      ]
    },
    {
      "name":"author_lname",
      "label": "Author last name",
      "advanced": true,
      "heuristics": [[lower_case,capitalize_1st_letter]],
      "category": "author",
      "regex":"[-'a-zA-Z ]+$",
      "query": [
              "{",
              "?author_iri foaf:familyName '[[VAR]]' .",
              "}"
      ]
    },
    {
      "name":"author_fname",
      "label": "Author first name",
      "advanced": true,
      "heuristics": [[lower_case,capitalize_1st_letter]],
      "category": "author",
      "regex":"[-'a-zA-Z ]+$",
      "query": [
              "{",
              "?author_iri foaf:givenName '[[VAR]]' .",
              "}"
      ]
    },
    {
      "name":"author_works",
      "label": "Author resource link (https://w3id.or/...)",
      "category": "document",
      "regex": "(https:\/\/w3id\\.org\/oc\/corpus\/ra\/\\d{1,})",
      "query": [
          "{",
          "?a_role_iri pro:isHeldBy <[[VAR]]> .",
          "?iri pro:isDocumentContextFor ?a_role_iri .",
          "}"
      ]
    },
    {
      "name":"ra_resource",
      "label": "Author resource Id (ra/)",
      "freetext": true,
      "category": "author",
      "regex":"(ra\/\\d{1,})",
      "query": [
            "{",
            "BIND(<https://w3id.org/oc/corpus/[[VAR]]> as ?author_iri) .",
            "}"
      ]
    },
    {
      "name":"author_text",
      "label": "Author last name",
      "advanced": true,
      "freetext": true,
      "category": "document",
      "regex":"[-'a-zA-Z ]+$",
      "query": [
              "{",
              "?lit_au bds:search '[[VAR]]' .",
              "?lit_au bds:matchAllTerms 'true' .",
              "?lit_au bds:relevance ?score_au .",
              "?lit_au bds:minRelevance '0.2' .",
              "?lit_au bds:maxRank '300' .",

              "?myra foaf:familyName ?lit_au .",
              "?q_role pro:isHeldBy ?myra .",
              "?iri pro:isDocumentContextFor ?q_role .",
              "}"
      ]
    },
    {
      "name":"any_text",
      "label": "Title, Subtitle, Keywords",
      "advanced": true,
      "freetext": true,
      "category": "document",
      "regex":"[-'a-zA-Z ]+$",
      "query": [
              "{",
              "?lit bds:search '[[VAR]]' .",
              "?lit bds:matchAllTerms 'true' .",
              "?lit bds:relevance ?score .",
              "?lit bds:minRelevance '0.2' .",
              "?lit bds:maxRank '300' .",
                "{?iri dcterms:title  ?lit }",
              "UNION",
                "{?iri fabio:hasSubtitle ?lit}",
              "}"
      ]
    }
  ],

"categories": [
    {
      "name": "document",
      "label": "Document",
      "macro_query": [
        //"SELECT DISTINCT ?iri ?doi ?short_iri ?short_iri_id ?browser_iri ?title ?subtitle ?year ?type ?short_type ?label ?author ?author_browser_iri (COUNT(distinct ?cites) AS ?out_cits) (COUNT(distinct ?cited_by) AS ?in_cits) where{",
          "  SELECT DISTINCT ?iri ?doi ?short_iri ?short_iri_id ?browser_iri ?title ?subtitle ?year ?type ?short_type ?label ?author ?author_browser_iri (COUNT(distinct ?cites) AS ?out_cits) (COUNT(distinct ?cited_by) AS ?in_cits) (count(?next) as ?tot)",
          "  Where{",
          "      [[RULE]]",
          //"      OPTIONAL {",
          "          {",
          "             ?iri rdf:type ?type .",
          "        	    OPTIONAL {?iri cito:cites ?cites .}",
          "      	 	    OPTIONAL {?cited_by cito:cites ?iri .}",
          "             BIND(REPLACE(STR(?iri), 'https://w3id.org/oc/corpus/', '', 'i') as ?short_iri) .",
          "        	    BIND(REPLACE(STR(?iri), 'https://w3id.org/oc/corpus/br/', '', 'i') as ?short_iri_id) .",
          "             BIND(REPLACE(STR(?iri), '/corpus/', '/browser/', 'i') as ?browser_iri) .",
          "			        OPTIONAL {?iri dcterms:title ?title .}",
          "			        BIND(REPLACE(STR(?type), 'http://purl.org/spar/fabio/', '', 'i') as ?short_type) .",
          "			        OPTIONAL {?iri fabio:hasSubtitle ?subtitle .}",
          "			        OPTIONAL {?iri prism:publicationDate ?year .}",
          "             OPTIONAL {",
          "                      ?iri datacite:hasIdentifier [",
          "                      datacite:usesIdentifierScheme datacite:doi ;",
          "                      literal:hasLiteralValue ?doi",
          "                      ]",
          "               }",
          "          }",
          "          {",
          "              ?iri rdfs:label ?label .",
          "               OPTIONAL {",
          "                          ?iri pro:isDocumentContextFor ?role .",
          "                          ?role pro:withRole pro:author ; pro:isHeldBy [",
          "                              foaf:familyName ?f_name ;",
          "                              foaf:givenName ?g_name",
          "                          ] .",
          "                          ?role pro:isHeldBy ?author_iri .",
          "                          OPTIONAL { ",
          "                              ?role oco:hasNext* ?next . ",
          "                          }",
          "                          BIND(REPLACE(STR(?author_iri), '/corpus/', '/browser/', 'i') as ?author_browser_iri) .",
          "                          BIND(CONCAT(?g_name,' ',?f_name) as ?author) .			",
          "              }",
          "          }",
          //"      }",
          "  } GROUP BY ?iri ?doi ?short_iri ?short_iri_id ?browser_iri ?title ?subtitle ?year ?type ?short_type ?label ?author ?author_browser_iri ORDER BY DESC(?tot)",
          "",
          //"} GROUP BY ?iri ?doi ?short_iri ?short_iri_id ?browser_iri ?title ?subtitle ?year ?type ?short_type ?label ?author ?author_browser_iri"
      ],
      "fields": [
        {"iskey": true, "value":"short_iri", "label":{"field":"short_iri_id"}, "title": "Corpus ID","column_width":"15%","type": "text", "sort":{"value": "short_iri.label", "type":"int"}, "link":{"field":"browser_iri","prefix":""}},
        {"value":"year", "title": "Year", "column_width":"8%","type": "int", "filter":{"type_sort": "int", "min": 10000, "sort": "value", "order": "desc"}, "sort":{"value": "year", "type":"int"} },
        {"value":"title", "title": "Title","column_width":"30%","type": "text", "sort":{"value": "title", "type":"text"}, "link":{"field":"browser_iri","prefix":""}},
        {"value":"author", "label":{"field":"author_lbl"}, "title": "Authors", "column_width":"32%","type": "text", "sort":{"value": "author", "type":"text"}, "filter":{"type_sort": "text", "min": 10000, "sort": "label", "order": "asc"}, "link":{"field":"author_browser_iri","prefix":""}},
        {"value":"in_cits", "title": "Cited by", "column_width":"10%","type": "int", "sort":{"value": "in_cits", "type":"int"}}
        //{"value":"score", "title": "Score", "column_width":"8%","type": "int"}
        //,{"value": "ext_data.crossref4doi.message.publisher", "title": "Publisher", "column_width":"13%", "type": "text", "sort":{"value": true}, "filter":{"type_sort": "text", "min": 150, "sort": "label", "order": "asc"}, "link":{"field":"browser_iri","prefix":""}}
      ],
      "group_by": {"keys":["iri"], "concats":["author"]},
      "ext_data": {
        "crossref4doi": {"name": call_crossref, "param": {"fields":["doi"]}, "async": true}
      },
    },

    {
      "name": "author",
      "label": "Author",
      "macro_query": [
        "SELECT ?author_iri ?author_browser_iri ?short_iri ?short_iri_id ?orcid ?author (COUNT(?doc) AS ?num_docs) WHERE {",
            "[[RULE]]",
            "BIND(REPLACE(STR(?author_iri), 'https://w3id.org/oc/corpus/', '', 'i') as ?short_iri) .",
            "BIND(REPLACE(STR(?author_iri), 'https://w3id.org/oc/corpus/ra/', '', 'i') as ?short_iri_id) .",
            "BIND(REPLACE(STR(?author_iri), '/corpus/', '/browser/', 'i') as ?author_browser_iri) .",
            "OPTIONAL {?author_iri datacite:hasIdentifier[",
                      "datacite:usesIdentifierScheme datacite:orcid ;",
             			    "literal:hasLiteralValue ?orcid].}",
            "?author_iri rdfs:label ?label .",
            "OPTIONAL {",
                    "?author_iri foaf:familyName ?fname .",
                    "?author_iri foaf:givenName ?name .",
                    "BIND(CONCAT(STR(?name),' ', STR(?fname)) as ?author) .",
             "}",
             "",
             "OPTIONAL {",
                  "?role pro:isHeldBy ?author_iri .",
                  "?role pro:isHeldBy ?author_iri .",
                  "?doc pro:isDocumentContextFor ?role.",
             "}",
        "}GROUP BY ?author_iri ?author_browser_iri ?short_iri ?short_iri_id ?orcid ?author"
      ],
      "fields": [
        {"value":"short_iri", "title": "Corpus ID", "label":{"field":"short_iri_id"}, "column_width":"25%", "type": "text", "sort":{"value": "short_iri.label", "type":"int"}, "link":{"field":"author_browser_iri","prefix":""}},
        {"value":"author", "title": "Author","column_width":"35%", "type": "text","filter":{"type_sort": "text", "min": 10000, "sort": "value", "order": "desc"}, "sort": {"value": "author", "type":"text", "default": {"order": "desc"}}},
        {"value":"orcid", "title": "ORCID","column_width":"25%", "type": "text", "link":{"field":"orcid","prefix":"https://orcid.org/"}},
        {"value":"num_docs", "title": "Works","column_width":"15%", "type": "int"}
      ]
    }
  ],

"page_limit": [5,10,15,20,30,40,50],
"page_limit_def": 10,
"def_results_limit": 1,
"search_base_path": "search",
"advanced_search": true,
"def_adv_category": "document",
"adv_btn_title": "Search the OCC Corpus",

"progress_loader":{
          "visible": true,
          "spinner": true,
          "title":"Searching the OpenCitations Corpus ...",
          "subtitle":"Be patient - this search might take several seconds!",
          "abort":{"title":"Abort Search","href_link":"/search"}
        },
"timeout":{
  "value": 90000,
  "link": "/search"
}

};
//heuristic functions
//you can define your own heuristic functions here
function lower_case(str){
  return str.toLowerCase();
}
function capitalize_1st_letter(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
}

//"FUNC" {"name": call_crossref, "param":{"fields":[],"vlaues":[]}}
function call_crossref(str_doi, index, async_bool, callbk_func, key_full_name, data_field ){
  var call_crossref_api = "https://api.crossref.org/works/";

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
              func_param.push(index, key_full_name, res_obj, data_field, async_bool);
              Reflect.apply(callbk_func,undefined,func_param);
          }
     });
  }
}
