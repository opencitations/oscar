# The Configuration file: 

## 3) The Rules:
The search execution is based on the fact that the input should belong to a specific rule which handles it. So the system need to find this specific rule from a list and apply its policies. In order to do this you need to define a **rules** key inside the configuration file, which will contain an array of several rule entries.
```js
"rules":  
[
    {<RULE-ENTRY>},
    {<RULE-ENTRY>},
    ...
]
```
Each entry is an object containing several attributes/keys (optional and primary). 

### Name:
A representative name for the rule. This value is also the identifier of the rule.
**How:** assign a string value to the **name** key.  
**Example:** 
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
Each rule will retrieve results classified in categories. This will enable the system to view the information needed according to the category the rule belongs to.
**How:** assign a string value to the **category** key, which matches the exact name of the category.  
**Example:** 
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
In order to find the corrisponding rule for textual-query, the textual-query input need to match a particular regular expression.  
**How:** assign a string value representing a regular expression to the **regex** key  
**Example:** 
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

## The Categories:
Each one of the rules previously defined should specify a category, the category of the rule determine which results need to be extracted from the query and the polices that should be applied on them. In order to do this, a **categories** key inside the configuration file must be included, which will have an array of several category entries as value. Here we show an example:
```js
"categories":  [
    {<CATEGORY-ENTRY>},
    {<CATEGORY-ENTRY>},
    ...
]
```
Each category entry have several internal keys which defines it (attributes), here we list all the possible keys. 

### Name:
A representative name for the category. This value is mentioned in rule-entries that aim in generating results belonging to this specific category.  
**How:** assign a string value to the **name** key.  
**Example:** a document category:
```js
"categories":  [
    {
        "name":"document",
        ...
    }
    ...
]
```

### The results columns:
For each category you can specify the columns that you want to visualize in the table of results. In this case the columns are a subset of fields extracted from the sparql query selections.  
**How:** define a **fields** key inside ur category, which will have an array of several field entries as value.  
**Example:** the fields of the document category
```js
"categories":  [
    {
        "name":"document",
        "fields": [
            {<FIELD-ENTRY>},
            {<FIELD-ENTRY>},
            ...
        ],
        ...
    }
    ...
]
```
Each field entry have several internal keys which defines it (attributes), here we list all the possible keys. 

#### The Value:  
The field I want from the query. This value should exactly match the variable name inside the query.  
**How:** assign a string value to the **value** key.

#### The column title:  
The header name of the column. This enable users to define an alternative title for the field selected.  
**How:** assign a string value to the **title** key.

#### The column width:  
Specifies the column width. Note that the sum of column widths for all the field entries should be 100%.  
**How:** assign a percentage value to the **column_width** key.

#### Column values type:  
Specify the type of column values. For instance 'text' or 'int'.  
**How:** assign a string value to the **type** key.

#### Sort the column:  
In case you want the interface enable the sorting of this column (desc and asc).  
**How:** define a **sort** key, which will have as value a new object, with attributes: **value:true** and in case you want to let this field be the default value to sort the table according a **"default": {"order": YOUR-DEFAULT-ORDER}** key need to be placed inside the sort obj.

#### Filtering options:  
In case you want the interface enable the filtering operations on this column.
**How:** define a **filter** key, which will have as value a new object, with internal attributes that define how its values should be listed: **type\_sort** indicate the type of the value i am using to sort the list (e.g: int or text), **min** will contain the number of elements to visualize per page, **sort** specify the value i am using to sort the elements (two possible alternatives: 'value' or 'sum'), **order** the order of the elements (two possible values: "desc" or "asc").

#### Associate a link to the values in the column:  
You can associate a link to the values in a specific column of the results retrieved, by specifying the column which contains the link values. Note that the column of links is also contained in the results obtained. A link object can contain these attributes: **field**: the column of the links (from the query results), **prefixx**: in case you want to add a fixed text before the link, you should specify its value here.



**Example:** a field entry contaning all the options described above
```js
"categories":  [
    {
        "name":"document",
        "fields": [
            {"value":"author", "title": "Authors", "column_width":"32%","type": "text", "sort":{"value": true, "default": {"order": "desc"}}, "filter":{"type_sort": "int", "min": 8, "sort": "sum", "order": "desc"}, "link":{"field":"author_iri","prefix":""}},
            ...
        ],
        ...
    }
    ...
]
```

### Group by the category results:
In case we want to group by the results obtained from the sparql query.  
**How:** define a **group\_by** key inside ur category, which will have an object as values, the object parameters are: **keys** an array of fields that will represent the keys on which the table will be grouped on, **concats** an array of fields you wish to concatenate.  
**Example:** the group by policies of the document category  
```js
"categories":  [
    {
        "name":"document",
        "group_by": {"keys":["doc"], "concats":["author"]},
        ...
    }
    ...
]
```
