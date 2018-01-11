### Name:
A representative name for the rule. This value does not have any effect on the execution. 
**How:** Assign a string value to the **name** key.
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
**How:** Assign a string value to the **category** key.
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
**How:** Each different rule entry can specify this by assigning a regular expression value to the **regex** key
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
