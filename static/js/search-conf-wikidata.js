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
      "name":"countries_and_capitals",
      "category": "country",
      "regex":"AllCapitals$",
      "query": [
        "SELECT DISTINCT ?country ?countryLabel ?capital ?capitalLabel",
        "WHERE",
        "{",
          "?country wdt:P31 wd:Q3624078 .",
          "FILTER NOT EXISTS {?country wdt:P31 wd:Q3024240}",
          "FILTER NOT EXISTS {?country wdt:P31 wd:Q28171280}",
          "OPTIONAL { ?country wdt:P36 ?capital } .",
        "",
          "SERVICE wikibase:label { bd:serviceParam wikibase:language 'en' }",
        "}",
        "ORDER BY ?countryLabel"
      ]
    }
  ],

"categories": [
    {
      "name": "country",
      "fields": [
        {"value":"country", "title": "Country URL","column_width":"15%","type": "text"},
        {"value":"countryLabel", "title": "Country", "column_width":"35%","type": "text", "filter":{"type_sort": "text", "min": 8, "sort": "value", "order": "desc"}, "sort":{"value": true, "default": {"order": "desc"}} },
        {"value":"capital", "title": "Capital URL","column_width":"15%","type": "text", "sort":{"value": true}},
        {"value":"capitalLabel", "title": "Capital", "column_width":"35%","type": "text", "sort":{"value": true}, "link":{"field":"capital","prefix":""}, "filter":{"type_sort": "text", "min": 8, "sort": "value", "order": "desc"}}
      ]
    },
  ],


"page_limit": [5,10,15,20,30,40,50]

}
