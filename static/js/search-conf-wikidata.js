var search_conf = {
//"sparql_endpoint": "https://query.wikidata.org/bigdata/namespace/wdq/sparql",
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
      "regex":"10.\\d{4,9}\/[-._;()/:A-Za-z0-9]+$",
      "query": [
        "select ?work ?title ?venueLabel ?date ?volume ?issue ?pages ?license ?doi ?url ?type where {",
            "BIND('[[VAR]]' as ?doi_txt) .",
            "?work wdt:P356 ?doi_txt .",
            "?work wdt:P1476 ?title .",
            "optional { ?work wdt:P31 ?type . }",
            "optional { ?work wdt:P1433 ?venue . }",
            "optional { ?work wdt:P577 ?date . }",
            "optional { ?work wdt:P478 ?volume . }",
            "optional { ?work wdt:P433 ?issue . }",
            "optional { ?work wdt:P304 ?pages . }",
            "optional { ?work wdt:P275 ?license_ .",
                        "?license_ rdfs:label ?license .",
                        "filter(lang(?license) = 'en') }",
            "optional { ?work wdt:P356 ?doi . }",
            "optional { ?work wdt:P953 ?url . }",
            "service wikibase:label {",
              "bd:serviceParam wikibase:language 'en,da,no,sv,de,fr,es,ru,jp,ru,zh' . }",
          "}"
      ]
    },
    {
      "name":"orcid",
      "category": "author",
      "regex":"[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9X]{4}$",
      "query": [
        "select ?author ?lblname ?lblfname ?lblcountry where {",
           "?author wdt:P496 '0000-0003-0530-4305' .",
           "optional{",
             "?author wdt:P734 ?fname .",
             "?fname wdt:P1705 ?lblfname .",
          "}",
          "optional{",
             "?author wdt:P735 ?name .",
             "?name wdt:P1705 ?lblname .",
          "}",
          "optional{",
              "?author wdt:P27 ?country .",
              "?country wdt:P1705 ?lblcountry .",
          "}",
          "service wikibase:label {",
                      "bd:serviceParam wikibase:language 'en,da,no,sv,de,fr,es,ru,jp,ru,zh' . }",
        "}"
      ]
    }
  ],

"categories": [
    {
      "name": "document",
      "fields": [
        {"value":"work", "title": "URL","column_width":"15%","type": "text"},
        {"value":"title", "title": "Work title","column_width":"35%","type": "text", "filter":{"type_sort": "text", "min": 8, "sort": "value", "order": "desc"}},
        {"value":"date", "title": "Date", "column_width":"20%","type": "text", "sort":{"value": true, "default": {"order": "desc"}} },
        {"value":"volume", "title": "Volume","column_width":"10%","type": "int", "sort":{"value": true}},
        {"value":"issue", "title": "Issue", "column_width":"10%","type": "int", "sort":{"value": true}},
        {"value":"pages", "title": "Pages","column_width":"10%","type": "int"}
      ]
    },
    {
      "name": "author",
      "fields": [
        {"value":"author", "title": "URL","column_width":"15%","type": "text"},
        {"value":"lblname", "title": "Name","column_width":"30%","type": "text", "filter":{"type_sort": "text", "min": 8, "sort": "value", "order": "desc"}, "sort":{"value": true}},
        {"value":"lblfname", "title": "Family name","column_width":"30%","type": "text"},
        {"value":"lblcountry", "title": "Country","column_width":"25%","type": "text"}
      ]
    }
  ],


"page_limit": [5,10,15,20,30,40,50]

}
