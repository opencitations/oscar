var search_conf = {

//the SPARQL endpoint address
"sparql_endpoint": "https://w3id.org/oc/sparql",
//the sparql prefixes, these will be used in all the SPARQL queries
"prefixes": [
    {"prefix":"cito","iri":"http://purl.org/spar/cito/"},
    {"prefix":"dcterms","iri":"http://purl.org/dc/terms/"},
    //... etc
  ],

//the set of rules handled
"rules":  [
    {
      //* the name and identifier of the rule
      "name":"doi",
      //* the category/type of the expected results (this points to the same name of the defined category)
      "category": "document",
      //* the input should respect this regular expression rule in order to be identified as suitable to this rule
      "regex":"(10.\\d{4,9}\/[-._;()/:A-Za-z0-9][^\\s]+)",
      //* the corresponding query to further insert into the category macro query
      "query": [`
            {
            ?iri datacite:hasIdentifier/literal:hasLiteralValue '[[VAR]]' .
            }`
      ],
      //the heuristics used to pre-process the given input before inserting it in the SPARQL query
      "heuristics": [[lower_case]],
      //If True this rule will be used in the advanced search option
      "advanced": true,
      // the label to use to describe this input in the advanced search
      "label": "With a specific DOI",
      //The textual placeholder of the input box in the advanced search
      "placeholder": "DOI e.g. 10.1016/J.WEBSEM.2012.08.001",
      //If True this rule will be used in the free-text search
      "freetext": true
    },
    // ... etc (other rules)
  ],

// the set of categories/results types handled
"categories": [
    {
      //* the name and identifier of the category
      "name": "document",
      //* the label to use to describe this category in the advanced search
      "label": "Document",
      //* the corresponding query to execute in case this is the selected category
      "macro_query": [
          `
          # insert all the fields you want to retrieve from the query
          # use ?iri as it is in the rules defined above
          SELECT DISTINCT ?iri
          Where{
                 #keep these two lines always
                 [[RULE]]
                 hint:Prior hint:runFirst true .
                 #write the rest of the query here
          `
        ],
        //Group results on a specific column (a post operation to apply on the SPARQL query results)
        "group_by": {"keys":["iri"], "concats":["author"]},
        //Other values returned as a result from external services (a post operation to apply on the SPARQL query results)
        "ext_data": {
          "crossref4doi": {"name": call_crossref, "param": {"fields":["doi"]}, "async": true}
        },

        //* the fields to insert into OSCAR's table
        "fields": [
          {
            //* the values in the column (e.g. the ?author field of the SPARQL query results)
            "value":"author",
            //* it's corresponding representation when used as label out of the results table
            "label":{"field":"author_lbl"},
            //* the title of the column
            "title": "Authors",
            //* the width of the column
            "column_width":"32%",
            //* the type of values of this column
            "type": "text",
            //Indicate whether to insert it as a possible field to sort the table according to
            "sort":{"value": "author", "type":"text"},
            //Indicate whether to insert it as a possible field to filter the table according to
            "filter":{"type_sort": "text", "min": 10000, "sort": "label", "order": "asc"},
            //Indicate whether to associate a corresponding href link to this value
            "link":{"field":"author_browser_iri","prefix":""}
          }
          // ... etc (other fields to add)
        ],
    },
    // ... etc (other categories)
  ],

//Presentation options of OSCAR
"page_limit": [5,10,15,20,30,40,50],
"page_limit_def": 10,
//the file name of the main page
"search_base_path": "search",
//If true an advanced search section will be integrated also
"advanced_search": true,
//the default category of the advanced search
"def_adv_category": "document",
//the button label of the advanced search
"adv_btn_title": "Search the OCC Corpus",
//the progress label to visualize when executing SPARQL on backround
"progress_loader":{
          "visible": true,
          "spinner": true,
          "title":"Searching the OpenCitations Corpus ...",
          "subtitle":"Be patient - this search might take several seconds!",
          "abort":{"title":"Abort Search","href_link":"/search"}
        },
//the searching timeout
"timeout":{
  "value": 90000,
  "link": "/search"
}

};
//heuristic functions
//you can define your own heuristic functions here
function lower_case(str){
  return str.toLowerCase();
}
//... etc

//A corrsponding function to call when getting external values
//"FUNC" {"name": call_crossref, "param":{"fields":[],"vlaues":[]}}
function call_crossref(str_doi, index, async_bool, callbk_func, key_full_name, data_field ){
  var call_crossref_api = "https://api.crossref.org/works/";

  if (str_doi != undefined) {
    var call_url =  call_crossref_api+ encodeURIComponent(str_doi);
    //var result_data = "...";
    $.ajax({
          dataType: "json",
          url: call_url,
          type: 'GET',
          async: async_bool,
          success: function( res_obj ) {
              var func_param = [];
              func_param.push(index, key_full_name, res_obj, data_field, async_bool);
              Reflect.apply(callbk_func,undefined,func_param);
          }
     });
  }
}
//... etc
