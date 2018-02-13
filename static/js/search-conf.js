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
      "name":"orcid",
      "label": "ORCID",
      "advanced": true,
      "freetext": true,
      "category": "author",
      "regex":"([0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9X]{4})",
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
              "?role pro:isHeldBy ?myra .",
              "?iri pro:isDocumentContextFor ?role .",
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
              /*"{",
                "?entry c4o:hasContent ?lit .",
                "?entry biro:references ?iri .",
              "}",
              "UNION",*/
                "{?iri dcterms:title  ?lit }",
              "UNION",
                "{?iri fabio:hasSubtitle ?lit}",
              ".",
              "}"
      ]
    }
  ],

"categories": [
    {
      "name": "document",
      "label": "Document",
      "macro_query": [
        "SELECT DISTINCT ?iri ?short_iri ?doi ?title ?year ?author ?author_lbl ?author_iri (COUNT(distinct ?cited) AS ?out_cits) (COUNT(distinct ?cited_by) AS ?in_cits)",
            "WHERE  {",
              "[[RULE]]",
              "OPTIONAL {",
                "?iri rdf:type ?type .",
                "BIND(REPLACE(STR(?iri), 'https://w3id.org/oc/corpus', '', 'i') as ?short_iri) .",
                "OPTIONAL {?iri dcterms:title  ?title .}",
                "OPTIONAL {?iri fabio:hasSubtitle  ?subtitle .}",
                "OPTIONAL {?iri fabio:hasPublicationYear ?year .}",
                "OPTIONAL {?iri cito:cites ?cited .}",
                "OPTIONAL {?cited_by cito:cites ?iri .}",
                "OPTIONAL {",
                 "?iri datacite:hasIdentifier [",
                  "datacite:usesIdentifierScheme datacite:doi ;",
               "literal:hasLiteralValue ?doi",
                   "]",
               "}",
            "",
               "OPTIONAL {",
                     "?iri pro:isDocumentContextFor [",
                         "pro:withRole pro:author ;",
                         "pro:isHeldBy ?author_iri",
                     "].",
                     "?author_iri foaf:familyName ?fname .",
                     "?author_iri foaf:givenName ?name .",
                     "BIND(CONCAT(STR(?name),' ', STR(?fname)) as ?author) .",
                     "BIND(CONCAT(STR(?fname),', ', STR(?name)) as ?author_lbl) .",
               "}",
              "}",
            "}GROUP BY ?iri ?short_iri ?doi ?title ?year ?score ?author ?author_lbl ?author_iri ",
            //"ORDER BY DESC(?score) ",
            "LIMIT 2000"
      ],
      "fields": [
        {"value":"short_iri", "title": "Corpus ID","column_width":"15%","type": "text", "sort":{"value": true}, "link":{"field":"iri","prefix":""}},
        {"value":"year", "title": "Year", "column_width":"13%","type": "int", "filter":{"type_sort": "int", "min": 8, "sort": "value", "order": "desc"}, "sort":{"value": true} },
        {"value":"title", "title": "Title","column_width":"30%","type": "text", "sort":{"value": true}, "link":{"field":"iri","prefix":""}},
        {"value":"author", "label":{"field":"author_lbl"}, "title": "Authors", "column_width":"32%","type": "text", "sort":{"value": true}, "filter":{"type_sort": "text", "min": 8, "sort": "label", "order": "asc"}, "link":{"field":"author_iri","prefix":""}},
        {"value":"in_cits", "title": "Cited by", "column_width":"10%","type": "int", "sort":{"value": true}}
        //{"value":"score", "title": "Score", "column_width":"8%","type": "int"}
      ],
      "group_by": {"keys":["iri"], "concats":["author"]}
    },

    {
      "name": "author",
      "label": "Author",
      "macro_query": [
        "SELECT ?author_iri ?short_iri ?orcid ?author (COUNT(?doc) AS ?num_docs) WHERE {",
            "[[RULE]]",
            "BIND(REPLACE(STR(?author_iri), 'https://w3id.org/oc/corpus', '', 'i') as ?short_iri) .",
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
        "}GROUP BY ?author_iri ?short_iri ?orcid ?author"
      ],
      "fields": [
        {"value":"short_iri", "title": "Corpus ID","column_width":"25%", "type": "text", "link":{"field":"author_iri","prefix":""}},
        {"value":"author", "title": "Author","column_width":"35%", "type": "text","filter":{"type_sort": "text", "min": 8, "sort": "value", "order": "desc"}, "sort": {"value": true, "default": {"order": "desc"}}},
        {"value":"orcid", "title": "ORCID","column_width":"25%", "type": "text", "link":{"field":"orcid","prefix":"https://orcid.org/"}},
        {"value":"num_docs", "title": "Works","column_width":"15%", "type": "int"}
      ]
    }
  ],

"page_limit": [5,10,15,20,30,40,50],
"def_results_limit": 1,
"on_abort": "/search",
"search_base_path": "search",
"advanced_search": true,
"progress_loader": true,
"def_adv_category": "document"
}

//heuristic functions
//you can define your own heuristic functions here
function lower_case(str){
  return str.toLowerCase();
}
function capitalize_1st_letter(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
}
