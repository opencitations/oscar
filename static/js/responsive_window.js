

var responsive_window = (function () {
		var active = null;
		var pages = null;

		function init(session_active,session_pages){
			var decoded_pages = String(_decode(session_pages));
			var arr_pages = decoded_pages.replace(/'/g, '');
			arr_pages = JSON.parse(JSON.stringify(arr_pages.slice(1, -1)));
			arr_pages = arr_pages.split(", ");

			pages = arr_pages;
			active = session_active;

			function _decode(str) {
				return str.replace(/&#(\d+);/g, function(match, dec) {
					return String.fromCharCode(dec);
				});
			}
		}

		function width_changed() {

			var header_container = document.getElementById("menu_nav");

			var windowsize = self.jQuery(window).width();
			console.log(windowsize);

			if (windowsize < 1130) {
				console.log("small window");
				header_container.innerHTML = _small_nav_menu().outerHTML;
			}else {
				console.log("large window");
				header_container.innerHTML = _build_large_nav_menu().outerHTML;
			}
		}

		function _build_large_nav_menu(){

			var ul_elem = document.createElement("ul");
			ul_elem.className = "nav masthead-nav";

			for (var i = 0; i < pages.length; i++) {
				var my_page = pages[i];
				ul_elem.appendChild(_build_page_elem(active,my_page));
			}

			return ul_elem;
		}

		function _small_nav_menu(){

			var dd_div = document.createElement("div");
			dd_div.className = "dropdown";

			var menu_btn = document.createElement("button");
			menu_btn.className = "dropbtn";
			menu_btn.innerHTML = "&#9776;";
			dd_div.appendChild(menu_btn);

			var dd_content = document.createElement("div");
			dd_content.className = "dropdown-content";

			for (var i = 0; i < pages.length; i++) {
				var my_page = pages[i];
				dd_content.appendChild(_build_page_elem(active,my_page));
			}
			dd_div.appendChild(dd_content);

			return dd_div;
		}

		function _title(str) {
		  if (str.length) {
		    return str[0].toUpperCase() + str.slice(1).toLowerCase();
		  } else {
		    return '';
		  }
		}

		function _build_page_elem(active, my_page){

			var li_elem = document.createElement("li");
			if (my_page == active){
				li_elem.className = "active";
			}

			var str_title = "";
			if(my_page == "/"){
				str_title = "Home";
			}else {
				str_title = _title(my_page);
			}

			a_elem = document.createElement("a");
			a_elem.href = my_page;
			a_elem.innerHTML = str_title;

			li_elem.appendChild(a_elem);
			return li_elem;
		}

return {
	width_changed: width_changed,
	init: init
}
})();
