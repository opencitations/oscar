The browser layout contains 3 containers: header, details, metrics. 
You can specify the interface contents inside the configuration file **browser-conf.js**. For each different category: document and author, we have the following code scheme:
js
"document": {
        ...
        "contents": {
          "header": [ ... ],
          "details": [ ... ],
          "metrics": [ ... ]
        }
  },
  
  "author": {
        ...
        "contents": {
          "header": [ ... ],
          "details": [ ... ],
          "metrics": [ ... ]
        }
  }


Inside each different container you can add a number of entries, therefore each container key will have an array of values. 
The interface will list the values vertically following the order of the entries. Each entry is a JSON object {} and can contain this key-value pares:
* **fields** : an array of elements to add, in case is a query result value you need to specify the column name used in the query,
otherwise in case you want to add a textual content not related to the query, insert the value FREE-TEXT
* **values** : the order of the values must follow the fields order, the elements are visualized following this order. In case the corresponding index in fields is a FREE-TEXT value, 
you can write any textual content, in case the values should be extracted from the query results, leave an empty value.
* **classes** : you can define different .css classes for each field.
* **tag** : the type of cell we are adding, the supported values are *td* or *th*.  
An entry example and its representation will look like this:
```js
{
  "fields": ["FREE-TEXT","num_docs","FREE-TEXT"], 
  "values": ["Author of ",""," documents"], 
  "classes": ["metric-entry","imp-value","metric-entry"],  
  "tag":"td"
}
```
<img src="images/example-entry.png" style="display: inline-block; height: 90px; width: 250px;"/>

