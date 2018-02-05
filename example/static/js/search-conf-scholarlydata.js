var search_conf = {
  "sparql_endpoint": "http://www.scholarlydata.org/sparql/",
  "prefixes": [
      {"prefix":"person","iri":"https://w3id.org/scholarlydata/person/"},
      {"prefix":"conf","iri":"https://w3id.org/scholarlydata/ontology/conference-ontology.owl#"},
      {"prefix":"rdfs","iri":"http://www.w3.org/2000/01/rdf-schema#"}
    ],

"rules":  [
    {
      "name":"doi",
      "category": "document",
      "regex":"(10.\\d{4,9}\/[-._;()/:A-Za-z0-9][^\\s]+)",
      "query": [
        "SELECT DISTINCT ?paper ?myvar ?short_iri ?title ?doi ?topic ?author ?author_name",
        "WHERE{",
              "?paper a conf:InProceedings;",
              "conf:doi ?doi .",
              "FILTER( regex(?doi, '[[VAR]]' ))",
              "BIND(REPLACE(STR(?paper), 'https://w3id.org/scholarlydata/inproceedings/', '', 'i') as ?short_iri) .",
              "optional {?paper conf:title ?title .}",
              "optional {",
                "?paper conf:hasAuthorList/conf:hasItem ?author .",
                "?author conf:hasContent ?person .",
                "?person conf:name ?author_name .",
              "}",
              "optional {?paper conf:doi ?doi .}",
              "optional {?paper conf:keyword ?kw .}",
              "optional {?paper conf:hasTopic ?topic .}",
        "}",
        "LIMIT 200"
      ]
    },
    {
      "name":"any_text",
      "category": "document",
      "regex":"[-'a-zA-Z ]+$",
      "query": [
        "SELECT DISTINCT ?paper ?myvar ?short_iri ?title ?doi ?topic ?author ?author_name",
        "WHERE{",
              "?paper a conf:InProceedings;",
                "conf:title ?myvar .",
              "FILTER( regex(?myvar, '[[VAR]]' ))",
              "BIND(REPLACE(STR(?paper), 'https://w3id.org/scholarlydata/inproceedings/', '', 'i') as ?short_iri) .",
              "optional {?paper conf:title ?title .}",
              "optional {",
                "?paper conf:hasAuthorList/conf:hasItem ?author .",
                "?author conf:hasContent ?person .",
                "?person conf:name ?author_name .",
              "}",
              "optional {?paper conf:doi ?doi .}",
              "optional {?paper conf:keyword ?kw .}",
              "optional {?paper conf:hasTopic ?topic .}",
        "}",
        "LIMIT 200"
      ]
    }
  ],
"categories": [
    {
      "name": "document",
      "fields": [
        {"value":"short_iri", "title": "Resource IRI","column_width":"20%","type": "text", "link":{"field":"paper","prefix":""}},
        {"value":"title", "title": "Work title","column_width":"35%","type": "text", "sort":{"value":true}, "filter":{"type_sort": "text", "min": 8, "sort": "value", "order": "desc"}},
        {"value":"author_name", "title": "Authors", "column_width":"30%","type": "int", "link":{"field":"author","prefix":""}},
        {"value":"doi", "title": "DOI","column_width":"15%","type": "text"}
      ],
      "group_by": {"keys":["short_iri"], "concats":["author_name"]}
    }
  ],


  "page_limit": [5,10,15,20,30,40,50],
  "on_abort": "/search",
  "def_adv_category": "document"
}
