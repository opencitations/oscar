var search_conf = {
"sparql_endpoint": "http://localhost:8080/sparql",
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
      "label": "Citing DOI",
      "advanced": true,
      "freetext": false,
      "heuristics": [[lower_case]],
      "category": "citation",
      "regex":"(10.\\d{4,9}\/[-._;()/:A-Za-z0-9][^\\s]+)",
      "query": [
            "{",
            "?iri cito:hasCitingEntity '[[VAR]]' .",
            "}"
      ]
    },
    {
      "name":"citeddoi",
      "label": "Cited DOI",
      "advanced": true,
      "freetext": false,
      "heuristics": [[lower_case]],
      "category": "citation",
      "regex":"(10.\\d{4,9}\/[-._;()/:A-Za-z0-9][^\\s]+)",
      "query": [
            "{",
            "?iri cito:hasCitedEntity '[[VAR]]' .",
            "}"
      ]
    },
    {
      "name":"oci",
      "label": "OCI Identifier",
      "advanced": true,
      "freetext": false,
      "category": "citation",
      "regex":"",
      "query": [
            "{",
            "?iri cito:Citation '[[VAR]]' .",
            "}"
      ]
    },
  ],

"categories": [
    {
      "name": "citation",
      "label": "Citation",
      "macro_query": [
        "SELECT DISTINCT ?iri ?oci ?citing_doi ?cited_doi ?creationdate ?timespan",
            "WHERE  {",
              "[[RULE]]",
              "OPTIONAL {",
                "?iri cito:hasCitingEntity ?citing_doi .",
                "?iri cito:hasCitedEntity ?cited_doi .",
                "?iri cito:hasCitationCreationDate ?creationdate .",
                "?iri cito:hasCitationTimeSpan ?timespan .",
              "}",
            "}",
            //"ORDER BY DESC(?score) ",
            //"LIMIT 2000"
      ],
      "fields": [
      ]
    },
  ],

"page_limit": [5,10,15,20,30,40,50],
"def_results_limit": 1,
"search_base_path": "search",
"advanced_search": true,
"def_adv_category": "document",

"progress_loader":{
          "visible": true,
          "title":"Searching the OpenCitations Corpus ...",
          "subtitle":"Be patient - this search might take several seconds!",
          "abort":{"title":"Abort Search","href_link":"/search"}
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
