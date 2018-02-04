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
      "category": "document",
      "regex":"(10.\\d{4,9}\/[-._;()/:A-Za-z0-9][^\\s]+)",
      "query": [
        "select ?work ?short_iri ?title ?venueLabel (STR(YEAR (?alldate)) as ?date) ?volume ?author ?authorname ?issue ?pages ?license ?doi ?url ?type where {",
            "?work wdt:P356 '[[VAR]]' .",
            "?work wdt:P31 wd:Q13442814.",
            "optional { ?work wdt:P1476 ?title .}",
            "optional {",
              "?work wdt:P50 ?author .",
              "?author rdfs:label ?authorname .",
              "FILTER (langMatches( lang(?authorname), 'EN' ) )",
            "}",
            "BIND(REPLACE(STR(?work), 'http://www.wikidata.org/', '', 'i') as ?short_iri) .",
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
      ]
    },
    {
      "name":"orcid",
      "category": "author",
      "regex":"([0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9X]{4})",
      "query": [
        "SELECT DISTINCT ?author ?short_iri ?authorLabel ?countryLabel ?occupationLabel WHERE {",
          "?author wdt:P496 '[[VAR]]'.",
          "BIND(REPLACE(STR(?author), 'http://www.wikidata.org/', '', 'i') AS ?short_iri)",
          "OPTIONAL {?author wdt:P27 ?country.}",
          "OPTIONAL { ?author wdt:P106 ?occupation.}",
          "SERVICE wikibase:label { bd:serviceParam wikibase:language 'en'. }",
        "}",
        "LIMIT 500"
      ]
    },
    {
      "name":"free_txt",
      "category": "document",
      "regex":"[-'a-zA-Z ]+$",
      "query": [
        "select ?work ?short_iri ?title ?venueLabel  (STR(YEAR (?alldate)) as ?date) ?volume ?author ?authorname ?issue ?pages ?license ?doi ?url ?type where {",
          "?work rdfs:label ?lbl1 .",
          "?work wdt:P31 wd:Q13442814.",
          "FILTER (langMatches( lang(?lbl1), 'EN' ) )",
          "FILTER( regex(?lbl1, '[[VAR]]' ))",
          "?work wdt:P31 wd:Q13442814.",
          "optional { ?work wdt:P1476 ?title .}",
          "optional {",
              "?work wdt:P50 ?author .",
              "?author rdfs:label ?authorname .",
              "FILTER (langMatches( lang(?authorname), 'EN' ) )",
          "}",
          "BIND(REPLACE(STR(?work), 'http://www.wikidata.org/', '', 'i') as ?short_iri) .",
          "optional { ?work wdt:P1433 ?venue . }",
          "optional { ?work wdt:P577 ?alldate . }",
          "optional { ?work wdt:P478 ?volume . }",
          "optional { ?work wdt:P433 ?issue . }",
          "optional { ?work wdt:P304 ?pages . }",
          "optional { ?work wdt:P275 ?license_ .}",
          "optional { ?work wdt:P356 ?doi . }",
          "optional { ?work wdt:P953 ?url . }",
            "}",
            "LIMIT 200"
      ]
    }
  ],

"categories": [
    {
      "name": "document",
      "fields": [
        {"value":"short_iri", "title": "Resource IRI","column_width":"15%","type": "text", "link":{"field":"work","prefix":""}},
        {"value":"title", "title": "Work title","column_width":"35%","type": "text", "sort":{"value": true}, "filter":{"type_sort": "text", "min": 8, "sort": "value", "order": "desc"}},
        {"value":"authorname", "title": "Authors", "column_width":"30%","type": "int", "link":{"field":"author","prefix":""}},
        {"value":"date", "title": "Date", "column_width":"20%","type": "text", "sort":{"value": true, "default": {"order": "desc"}} }
      ],
      "group_by": {"keys":["work"], "concats":["authorname"]}
    },
    {
      "name": "author",
      "fields": [
        {"value":"short_iri", "title": "Resource IRI","column_width":"20%","type": "text", "link":{"field":"author","prefix":""}},
        {"value":"authorLabel", "title": "Full Name","column_width":"30%","type": "text", "filter":{"type_sort": "text", "min": 8, "sort": "value", "order": "desc"}, "sort":{"value": true}},
        {"value":"countryLabel", "title": "Country","column_width":"25%","type": "text"},
        {"value":"occupationLabel", "title": "Occupation","column_width":"25%","type": "text"}
      ]
    }
  ],


"page_limit": [5,10,15,20,30,40,50]

}
