# OSCAR
### a general [S]earch [A]pplication for [R]df data specially designed for [O]pen [C]itations  
#### - [OSCAR paper for SAVE-SD2018](https://essepuntato.github.io/papers/oscar-savesd2018.html)  

A user friendly search platform applicable for any triplestore endpoint.  
This idea came out with regard to the [OpenCitations](http://opencitations.net/) project, which contains an open repository of scholarly citation data in RDF format, we would like to make accesible for any user to search and explore. The current version of the tool is integrated inside the OpenCitations web interface.  
[opencitations.net/search](http://opencitations.net/search)

One of the main characteristics of OSCAR is its adaptability to work with any other RDF triplestore. It is possible to configure OSCAR to work with a particular endpoint by configuring a particular JSON document, which specifies how the SPARQL queries are sent to that endpoint, and how the returned query results should be visualized, according to the predefined tabular view that OSCAR provides. In this repository we have a brief [documentation/guidelines](OSCAR/doc/README.md) explaining the configure operations. Currently we have tested OSCAR with three different projects: [OpenCitations](http://opencitations.net/), [ScholarlyData](http://www.scholarlydata.org/), [Wikidata](http://wikidata.org/). For each one of these projects we have its corresponding example directory and .html main entry:
* OpenCitations: [search.html](search.html)
* Wikidata: [wikidata.html](example/wikidata.html)
* ScholarlyData: [scholarlydata.html](example/scholarlydata.html)
