var search_conf = {
"sparql_endpoint": "https://test.opencitations.net/meta/sparql",
"prefixes": [
    {"prefix":"cito","iri":"http://purl.org/spar/cito/"},
    {"prefix":"literal","iri":"http://www.essepuntato.it/2010/06/literalreification/"},
    {"prefix":"biro","iri":"http://purl.org/spar/biro/"},
    {"prefix":"fabio","iri":"http://purl.org/spar/fabio/"},
    {"prefix":"rdf","iri":"http://www.w3.org/1999/02/22-rdf-syntax-ns#"},
    {"prefix":"datacite","iri":"http://purl.org/spar/datacite/"}
  ],

"rules":  [
    /*{
      "name":"citedomid",
      "label": "Citations of a bibliographic resource (OMID)",
      "placeholder": "e.g. br/0612058700",
      "advanced": true,
      "freetext": true,
      "category": "citation",
      "regex":"(.+)",
      "query": [`
            {
              SERVICE <https://opencitations.net/index/sparql> {
                    BIND(<https://w3id.org/oc/meta/[[VAR]]> as ?cited) .
                    ?oci cito:hasCitedEntity ?cited .
                    ?oci cito:hasCitingEntity ?citing .
              }
            }`
      ]
    },*/
    {
      "name":"citingdoi",
      "label": "References of a bibliographic resource (DOI, PMID, OMID)",
      "placeholder": "e.g. 10.1016/J.WEBSEM.2012.08.001 | 37844613 | br/0612058700",
      "advanced": true,
      "freetext": false,
      "heuristics": [['lower_case']],
      "category": "citation",
      "regex":"(.+)",
      "query": [`
            {
                ?identifier literal:hasLiteralValue "[[VAR]]" .
                ?citing datacite:hasIdentifier ?identifier .
                SERVICE <https://opencitations.net/index/sparql> {
                      ?oci a cito:Citation .
                      ?oci cito:hasCitingEntity ?citing .
                      ?oci cito:hasCitedEntity ?cited .
                }
            }`
      ]
    },
    {
      "name":"citeddoi",
      "label": "Citations of a bibliographic resource (DOI, PMID, OMID)",
      "placeholder": "e.g. 10.1016/J.WEBSEM.2012.08.001 | 37844613 | br/0612058700",
      "advanced": true,
      "freetext": true,
      "heuristics": [['lower_case']],
      "category": "citation",
      "regex":"(.+)",
      "query": [`
            {
                ?identifier literal:hasLiteralValue "[[VAR]]" .
                ?cited datacite:hasIdentifier ?identifier .
                SERVICE <https://opencitations.net/index/sparql> {
                      ?oci a cito:Citation .
                      ?oci cito:hasCitedEntity ?cited .
                      ?oci cito:hasCitingEntity ?citing .
                }
            }`
      ]
    },
    {
      "name":"oci",
      "label": "Data of a specific citation (OCI)",
      "placeholder": "OCI e.g: 0200101...-0200101...",
      "advanced": true,
      "freetext": false,
      "category": "citation",
      "regex":"(\\d{1,}-\\d{1,})",
      "query": [`
        {
          SERVICE <https://opencitations.net/index/sparql> {
                BIND(<https://w3id.org/oc/index/ci/[[VAR]]> as ?oci) .
                ?oci cito:hasCitingEntity ?citing .
                ?oci cito:hasCitedEntity ?cited .
          }
        }
        `
      ]
    }
  ],

"categories": [
    {
      "name": "citation",
      "label": "Citation",
      "macro_query": [
        `
            SELECT ?oci ?citing ?cited
            WHERE  {
              [[RULE]]
            }
            `
      ],
      "fields": [
        {"iskey": true, "value":"oci", "title": "Id","column_width":"15%", "type": "text", "link":{"field":"oci","oci":""}},
        {"value":"ext_data.citing_ref.reference", "title": "Citing entity", "column_width":"40%", "type": "text"},
        {"value":"ext_data.cited_ref.reference", "title": "Cited entity", "column_width":"40%", "type": "text"}
      ],
      "ext_data": {
        "citing_ref": {"name": "meta_call_to_get_ref", "param": {"fields":["citing"]}, "async": true},
        "cited_ref": {"name": "meta_call_to_get_ref", "param": {"fields":["cited"]}, "async": true}
      },
      "extra_elems":[
        {"elem_type": "a","elem_value": "Back to search" ,"elem_class": "btn btn-primary left" ,"elem_innerhtml": "Show the search interface", "others": {"href": "/index/search"}}
      ]
    }
  ],

  "page_limit": [5,10,15,20,30,40,50],
  "def_results_limit": 1,
  "search_base_path": "search",
  "advanced_search": true,
  "def_adv_category": "citation",
  "adv_btn_title": "Search in the OpenCitations Indexes",

  "progress_loader":{
            "visible": true,
            "spinner": true,
            "title":"Searching in the OpenCitations Indexes ...",
            "subtitle":"Be patient - this search might take several seconds!",
            "abort":{"title":"Abort Search","href_link":"/index/search"}
          },

   "timeout":{
            "value": 9000,
            "link": "/index/search"
          }

  }

console.log(search_conf);


var heuristics = (function () {

      //heuristic functions
      //you can define your own heuristic functions here
      function lower_case(str){
        return str.toLowerCase();
      }
      function capitalize_1st_letter(str){
        return str.charAt(0).toUpperCase() + str.slice(1);
      }
      function ci_label(str) {
        var a = str.split("/index/");
        return a[a.length - 1];
      }
      function map_source(str) {
        return str.toUpperCase().replace("/","");
      }
      function decodeURIStr(str) {
        return decodeURIComponent(str);
      }
      function encodeURIStr(str) {
        var dec_str = decodeURIStr(str);
        return encodeURIComponent(dec_str).replace(/[!'()*]/g, function (c) {
          return '%' + c.charCodeAt(0).toString(16);
        });
      }
      function encodeDOIURL(str) {
        var dec_str = decodeURIStr(str);
        var parts = dec_str.split('/');
        var decoded_doi = parts[0] + "/" + encodeURIComponent(parts[1]).replace(/[!'()*]/g, function (c) {
          return '%' + c.charCodeAt(0).toString(16);
        });
        return decoded_doi;
      }

      function timespan_translate(str) {
        var new_str = "";
        var years = 0;
        var months = 0;
        var days = 0;

        let reg = /(\d{1,})Y/g;
        let match;
        while (match = reg.exec(str)) {
          if (match.length >= 2) {
            years = match[1] ;
            new_str = new_str + years +" Years "
          }
        }

        reg = /(\d{1,})M/g;
        while (match = reg.exec(str)) {
          if (match.length >= 2) {
            months = match[1] ;
            new_str = new_str + months +" Months "
          }
        }

        reg = /(\d{1,})D/g;
        while (match = reg.exec(str)) {
          if (match.length >= 2) {
            days = match[1] ;
            new_str = new_str + days +" Days "
          }
        }

        return new_str;
      }
      function creation_year(str) {
        return str.substring(0, 4);
      }
      function _timespan_parts(str) {
        var new_str = "";
        var years = 0;
        var months = 0;
        var days = 0;

        let reg = /(\d{1,})Y/g;
        let match;
        while (match = reg.exec(str)) {
          if (match.length >= 2) {
            years = parseInt(match[1]) ;
          }
        }

        reg = /(\d{1,})M/g;
        while (match = reg.exec(str)) {
          if (match.length >= 2) {
            months = parseInt(match[1]) ;
          }
        }

        reg = /(\d{1,})D/g;
        while (match = reg.exec(str)) {
          if (match.length >= 2) {
            days = parseInt(match[1]) ;
          }
        }

        return {"years":years,"months":months,"days":days};

      }
      function timespan_in_days(str) {
        var tparts = _timespan_parts(str);
        return String(tparts.years * 365 + tparts.months * 30 + tparts.days);
      }
      function timespan_in_months(str) {
        var tparts = _timespan_parts(str);
        return String(tparts.years * 12 + tparts.months);
      }
      function short_version(str, max_chars = 20) {
        var new_str = "";
        for (var i = 0; i < max_chars; i++) {
          if (str[i] != undefined) {
            new_str = new_str + str[i];
          }else {
            break;
          }
        }
        return new_str+"...";
      }

      function get_omid(str_id) {

        var id_pref = "";
        // is DOI
        if ( /^10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/.test(str_id)  ) {
          id_pref = "doi:";
        }
        // is PMID
        else if ( /^\d{1,}/.test(str_id) ) {
          id_pref = "pmid:";
        }
        // is OMID
        else if ( /^br\/\d{1,}/.test(str_id) ) {
          id_pref = "omid:";
        }
        // is other ID
        else {
          id_pref = "";
        }
        var meta_api_url = 'https://opencitations.net/meta/api/v1/metadata/';
        meta_api_url = meta_api_url + id_pref + str_id;

        fetch(meta_api_url)
          .then(response => {
            if (response.status === 200) {
                var meta_data = response.json();
                const regex = /omid:([^\s]+)/;
                const match = meta_data["id"].match(regex);
                if (match) {
                  return match[1].replace("omid:","");
                }
            } else {
                return "";
            }
          })
          .catch(error => {
            return "";
          });

        return "";
      }
      return {
        lower_case: lower_case,
        capitalize_1st_letter: capitalize_1st_letter,
        ci_label: ci_label,
        map_source: map_source,
        decodeURIStr: decodeURIStr,
        encodeURIStr: encodeURIStr,
        encodeDOIURL: encodeDOIURL,
        short_version: short_version,
        creation_year: creation_year,
        timespan_in_days: timespan_in_days,
        timespan_in_months: timespan_in_months,
        timespan_translate: timespan_translate,
        get_omid: get_omid
       }
})();

var callbackfunctions = (function () {

    function call_crossref(conf_params, index, async_bool, callbk_func, key_full_name, data_field, func_name ){
      var call_crossref_api = "https://api.crossref.org/works/";

      var str_doi = conf_params[0];
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
                  func_param.push(index, key_full_name, data_field, async_bool, func_name, conf_params, res_obj);
                  Reflect.apply(callbk_func,undefined,func_param);
              }
         });
      }
    }
    //https://citation.crosscite.org/format?doi=10.1145%2F2783446.2783605&style=apa&lang=en-US
    function ext_call_to_get_ref(conf_params, index, async_bool, callbk_func, key_full_name, data_field, func_name ){
      var call_crossref_api = "https://citation.crosscite.org/format?doi=";
      var suffix = "&style=apa&lang=en-US";

      var str_doi = conf_params[0];

      if (str_doi != undefined) {
        var call_url =  call_crossref_api+str_doi+suffix;
        //var result_data = "...";
        $.ajax({
              url: call_url,
              type: 'GET',
              async: async_bool,
              success: function( res ) {
                  var res_obj = {"reference": res};
                  var func_param = [];
                  func_param.push(index, key_full_name, data_field, async_bool, func_name, conf_params, res_obj);
                  Reflect.apply(callbk_func,undefined,func_param);
              }
         });
      }
    }

    function meta_call_to_get_ref(conf_params, index, async_bool, callbk_func, key_full_name, data_field, func_name ){

      var call_meta = "https://test.opencitations.net/meta/api/v1/metadata/";
      // takes an omid url, e.g. "https://w3id.org/oc/meta/br/0610200888"
      var str_id = conf_params[0];
      var link_id = str_id;

      if (str_id != undefined) {
        //var call_id = "doi:"+str_id;
        //if (/^\d{1,}$/.test(str_id)) {
        //  call_id = "pmid:"+str_id;
        //}
        var call_id = "omid:"+str_id.split("meta/")[1];
        console.log(call_id);
        $.ajax({
              url: call_meta + call_id,
              type: 'GET',
              async: async_bool,
              success: function( call_res ) {

                  if (call_res.length > 0) {
                    // meta is supposed to return 1 entity only
                    res = call_res[0];
                    var entity_ref = "";
                    var entity_ref_val = "";
                    if (res != undefined){
                      if ("title" in res) {
                        if (res["title"] != "") {
                          entity_ref_val += res["title"];
                          entity_ref += "<p><i><strong><a href='"+link_id+"'>"+res["title"]+"</a></strong></i></p><br/>";
                        }
                      }
                      if ("venue" in res) {
                        if (res["venue"] != "") {
                          entity_ref_val += " ;; ";
                          str_venues = "";
                          l_venues = res["venue"].split(";");
                          for (var i = 0; i < l_venues.length; i++) {
                            var a_venue = l_venues[i];
                            var omid_matches = a_venue.match(/omid:br\/\d{1,}/);
                            if (omid_matches) {
                              entity_ref_val += a_venue + " ; ";
                              a_venue = "<a href='https://w3id.org/oc/meta/"+omid_matches[0].split("omid:")[1]+"'>" + a_venue + "</a>";
                            }
                            str_venues += a_venue + "; ";
                          }
                          entity_ref += "<p><strong>Venue: </strong><i>"+str_venues+"</i></p>";
                        }
                      }
                      if ("pub_date" in res) {
                        if (res["pub_date"] != "") {
                          entity_ref_val += " ;; ";
                          entity_ref_val += res["pub_date"];
                          entity_ref += "<p><strong>Publication date: </strong><i>"+res["pub_date"]+"</i></p>";
                        }
                      }
                      if ("author" in res) {
                        if (res["author"] != "") {
                            entity_ref_val += " ;; ";
                            str_authors = "";
                            l_authors = res["author"].split(";");
                            for (var i = 0; i < l_authors.length; i++) {
                              var an_author = l_authors[i];
                              var omid_matches = an_author.match(/omid:ra\/\d{1,}/);
                              if (omid_matches) {
                                entity_ref_val += an_author + "; ";
                                an_author = "<a href='https://w3id.org/oc/meta/"+omid_matches[0].split("omid:")[1]+"'>" + an_author + "</a>";
                              }
                              str_authors += an_author + "; ";
                            }
                            entity_ref += "<p><strong>Author(s): </strong><i>"+str_authors+"</i></p>";
                        }
                      }

                      if ("id" in res) {
                        if (res["id"] != "") {
                          var supported_ids = {
                            "doi": "https://www.doi.org/",
                            "pmid": "https://pubmed.ncbi.nlm.nih.gov/",
                          };
                          var l_ids = res["id"].split(" ");
                          var html_ids = [];
                          for (var i = 0; i < l_ids.length; i++) {
                            for (var s_id in supported_ids) {
                              if (l_ids[i].startsWith(s_id)) {
                                id_val = l_ids[i].replace(s_id+":","");
                                html_ids.push(s_id.toUpperCase()+": <a href='"+supported_ids[s_id]+id_val+"'>"+id_val+"</a>");
                              }
                            }
                          }
                          entity_ref += "<br/><p>"+html_ids.join("<br>")+"</p>";
                        }
                      }

                    }
                    var res_obj = {"reference": entity_ref};
                    var func_param = [];
                    func_param.push(index, key_full_name, data_field, async_bool, func_name, conf_params, res_obj);
                    Reflect.apply(callbk_func,undefined,func_param);
                  }
              },
              error: function (error)
              {
                  //var res_obj = {"reference_html": "<a href='"+link_id+"'>"+str_id +"</a><br/><br/>", "reference_value": ""};
                  var res_obj = {"reference": "<a href='"+link_id+"'>"+str_id +"</a><br/><br/>"};
                  var func_param = [];
                  func_param.push(index, key_full_name, data_field, async_bool, func_name, conf_params, res_obj);
                  Reflect.apply(callbk_func,undefined,func_param);
              }
         });
      }
    }


  return {
    call_crossref: call_crossref,
    ext_call_to_get_ref: ext_call_to_get_ref,
    meta_call_to_get_ref: meta_call_to_get_ref
   }
  })();
