![OSCAR](doc/oscar_logo.png)
### The OpenCitations RDF Search Application,
#### - [OSCAR paper for SAVE-SD2018](https://essepuntato.github.io/papers/oscar-savesd2018.html)

A  user friendly search platform applicable for any triplestore endpoint.  
This idea came out with regard to the [OpenCitations](http://opencitations.net/) project, which contains an open repository of scholarly citation data in RDF format, we would like to make accesible for any user to search and explore. The current version of the tool is integrated inside the OpenCitations web interface.  
[opencitations.net/search](http://opencitations.net/search)

One of the main characteristics of OSCAR is its adaptability to work with any other RDF triplestore. It is possible to configure OSCAR to work with a particular endpoint by configuring a particular JSON document, which specifies how the SPARQL queries are sent to that endpoint, and how the returned query results should be visualized, according to the predefined tabular view that OSCAR provides. In this repository we have a brief [documentation/guidelines](OSCAR/doc/README.md) explaining the configure operations. Currently we have tested OSCAR with three different projects: [OpenCitations](http://opencitations.net/), [ScholarlyData](http://www.scholarlydata.org/), [Wikidata](http://wikidata.org/). For each one of these projects we have its corresponding example directory and .html main entry:
* OpenCitations corpus: [example/v2/opencitations_corpus.html](https://opencitations.github.io/oscar/example/v2/opencitations_corpus.html)
* OpenCitations index:[example/v2/opencitations_index.html](https://opencitations.github.io/oscar/example/v2/opencitations_index.html)
* Wikidata: [example/v2/wikidata.html](https://opencitations.github.io/oscar/example/v2/wikidata.html)

# OSCAR Configuration

**0) OSCAR Needs bootstrap and jquery:** 

```<script src="path/to/jquery.min.js"></script>``` 
```<script src="path/to/bootstrap.min.js"></script>```
        
        
**1) Insert in your HTML page the following block:** 

```<div class="__oscar__" type="..." view_op="..." filter_op="..."></div>``` 
* **[[type]]**: *"advanced"/"free-text"*
e.g.  ```type="advanced"```
* **[[view_op]]**= Combine: *"rows_per_page"* | *"export_results"* | *"sort_results"*. 
e.g.  ```view_op="rows_per_page export_results"```
* **[[filter_op]]**= Combine: *"limit_results"* | *"filter_fields"*  
e.g.  ```filter_op="limit_results"```


**2) Include your configuration file and right after the 'search.js' script in your HTML page, like this:**

```<script type="text/javascript" src="path/to/your/conf.js"></script>```
```<script type="text/javascript" src="path/to/search.js""></script>```


**3) To run OSCAR call its main method:**

```search.do_sparql_query([[QUERY]])```
* **[[QUERY]]**: in case an empty string is given OSCAR will build its initial interface. The other option is giving a string corresponding a query as URL address. e.g. 
Free-text search: *"?text=10.1145%2F2362499.2362502"*
Advanced search: *"?text=10.1145%2F2362499.2362502&rule=citing_documents&bc=and&text=Journal+of+Documentation&rule=journal"*
