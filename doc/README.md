## The Rules:
The search execution is based on the fact that the input should belong to a specific rule which will handle it. So the system need to find this specific rule from a list and apply its policies. In order to do this you need to define a **rules** key inside the configuration file, which will have an array of several rule entries as value. Here we show an example:
```js
"rules":  [
    {<RULE-ENTRY>},
    {<RULE-ENTRY>},
    ...
]
```
Each rule entry have several internal keys which defines it (attributes), here we list all the possible keys. 

### Name:
A representative name for the rule. This value does not have any effect on the execution.

**How:** assign a string value to the **name** key.

**Example:** a rule for the DOI detection:
```js
"rules":  [
    {
        "name":"doi",
        ...
    }
    ...
]
```

### Results category:
Each rule will retrieve results that should be classified in categories. This will enable the system to view the information needed according to the category the current category it belongs to. Next on this documentation we will describe how a category should be defined. 

**How:** assign a string value to the **category** key.

**Example:** a rule which retrieves results as a document category:
```js
"rules":  [
    {
        "name":"doi",
        "category": "document",
        ...
    }
    ...
]
```

### Rule-entry detection:
In order to retrieve the correct information for a specific textual searching input you need to know the search intent: what kind of information I am looking for. A search operation refers to a category C if its textual format matches a specific regular expression. 

**How:** each different rule entry can specify this by assigning a regular expression value to the **regex** key

**Example:** a rule definition for the document category:
```js
"rules":  [
    {
        "name":"doi",
        "category": "document",
        "regex":"10.\\d{4,9}\/[-._;()/:A-Za-z0-9]+$",
        ...
    }
    ...
]
```

### The SPARQL query:
For each different rule you should define the sparql query to execute on the triple store. 

**How:** assign to the **query** key the query textual body, the value is represented as an array of strings, an array is used in order to make the configuration file easier to visually comprehend and modify. 

**Example:** a query definition for the rule "doi":
```js
"rules":  [
    {
        "name":"doi",
        "category": "document",
        "regex":"10.\\d{4,9}\/[-._;()/:A-Za-z0-9]+$",
        "query": [
        "SELECT DISTINCT ?doc ?short_iri ?doi ?title ?year ?author ?author_iri (COUNT(distinct ?cited) AS ?out_cits)        (COUNT(distinct ?cited_by) AS ?in_cits) where {",
            "?lit bds:search <VAR> . ?lit bds:matchAllTerms 'true' . ?lit bds:relevance ?score . ?lit bds:maxRank '1' .",
            "?iri datacite:hasIdentifier/literal:hasLiteralValue ?lit .",
            "BIND(?lit AS ?doi).",
            "BIND(REPLACE(STR(?iri), 'https://w3id.org/oc/corpus', '', 'i') as ?short_iri) .",
            "BIND(?iri as ?doc) .",
            "OPTIONAL {?iri dcterms:title ?title .}",
            "OPTIONAL {?iri fabio:hasSubtitle ?subtitle .}",
            "OPTIONAL {?iri fabio:hasPublicationYear ?year .}",
            "OPTIONAL {?iri cito:cites ?cited .}",
            "OPTIONAL {?cited_by cito:cites ?iri .}",
            "",
             "OPTIONAL {",
                    "?iri pro:isDocumentContextFor [",
                        "pro:withRole pro:author ;",
                        "pro:isHeldBy ?author_iri",
                    "].",
                    "?author_iri foaf:familyName ?fname .",
                    "?author_iri foaf:givenName ?name .",
                    "BIND(CONCAT(STR(?name),' ', STR(?fname)) as ?author) .",
             "}",
          "} GROUP BY ?doc ?short_iri ?doi ?title ?year ?author ?author_iri"
      ]
    }
    ...
]
```


