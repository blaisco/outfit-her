// Items per page in the search results
var ITEMS_PER_PAGE = 9;

var SORT_BY = {
  newest: '"goLiveDate":"DESC"',
  mostPopular: '"productPopularity":"DESC"',
  name: '"brandNameFacet":"ASC"',
  lowestPrice: '"price":"ASC"',
  highestPrice: '"price":"DESC"'
};

////////////////////////////////////////////////////////////////////////////////
// START JQUERY ONLOAD /////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

$(function(){

  // Load up equipment via url parameters
  var urlParams = $.getUrlVars();
  var equipment = new Object();
  $("#avatar").children(".slot").each(function() {
    //alert($(this).attr("id"));
    var divId = $(this).attr("id");
    if(urlParams[divId] != undefined) {
      equipment[urlParams[divId]] = divId;
    }
  });
  loadEquipment(equipment);
  
  // Load an intial listing (so it's not blank)
  loadListing(0, true);
  
  $('#search-button').click(function() {
    $('#search-form').submit();
  });
  
  $('#remove-all').click(function() {
    $("#avatar").children(".slot").each(function() {
      $(this).empty();
    });
    $("#cost").html("$0.00");
  });
  
  $("#welcome-window").dialog({ 
    autoOpen: false,
    modal: true,
    resizable: false,
    width: 500,
    height: 520,
    title: "Welcome to Outfit Her",
    buttons: [{
      text: "Let's go!",
      click: function() { $(this).dialog("close"); }
    }]
  });
  
  $("#link-window").dialog({ 
    autoOpen: false,
    modal: true,
    resizable: false,
    width: 300,
    height: 170,
    title: "Link",
    buttons: [{
      text: "Ok",
      click: function() { $(this).dialog("close"); }
    }]
  });

  $("#search-field").autocomplete({
    source: function(request, response) {
      $.ajax({
        url: "/z/AutoComplete",
        data: {
          term: request.term
        },
        success: function(data) {
          response($.map(data.results, function(item) {
            return {
              label: item,
            }
          }));
        }
      });
    },
    minLength: 3
  }).keydown(function(e) { 
  // Close autocomplete box when user presses Enter key to perform a search
    if (e.which == '13') 
    {
      $(this).autocomplete('close');
    }
  });
  
  $("#search-category").change(function() {
    $("#search-field").val("");
    loadListing(0, true);
  });
  
  $("#search-sort").change(function() {
    loadListing(0, true);
  });
  
  $("#search-form").submit(function() {
    loadListing(0, true);

    return false;
  });
  
  $(".listing-card").liveDraggable({ 
    stack: ".listing-card",
    /*distance: 20,*/ /* Breaks IE */
    opacity: 0.5,
    revert: false,
    helper: "clone",
    cursor: "pointer",
    cursorAt: { top: 0, left: 0 }
  });
  
  $(".equipment-card").liveDraggable({ 
    stack: ".equipment-card",
    /*distance: 20,*/ /* Breaks IE */
    //opacity: 0.35,
    revert: "invalid",
    helper: "original",
    cursor: "pointer",
    cursorAt: { top: 0, left: 0 }
  });
  
  $(".slot").droppable({
    tolerance: "pointer",
    accept: function(draggable) {
      return ($(this).attr("data-category").split(",").has(draggable.data("category")));
    },
    activeClass: "drop-highlight",
    hoverClass: "drop-hover",
    drop: function(event, ui) {
      // Don't add or remove if dragging from a slot onto the same slot
      if( $(this).attr("id") != ui.draggable.parent().attr("id") ) {
        if($(this).find(".equipment-card").data("price") != undefined) {
          //alert( "subtract: " + $(this).find(".equipment-card").data("price") );
          updateCost($(this).find(".equipment-card").data("price"), false);
        }
        if(ui.draggable.hasClass("listing-card")) {
          //alert( "add: " + ui.draggable.data("price") );
          updateCost(ui.draggable.data("price"), true);
        }
      }
      
      var equipment = $('<div class="equipment-card"></div>');
      // var image = $('<img class="thumbnail" src="' + ui.draggable.find(".thumbnail").attr("src") + '">');
      var image = ui.draggable.find(".thumbnail").clone();
      // Scale image down to size of slot
      image.width( $(this).width() );
      image.height( $(this).height() );
      equipment
        .data("styleId", ui.draggable.data("styleId"))
        .data("category", ui.draggable.data("category"))
        .data("price", ui.draggable.data("price"))
        .append(image);
      $(this).empty().append(equipment);
      
      // When dragging from one slot to another:
      //if(ui.helper.data("styleId") != undefined) {
      if(ui.helper.hasClass("equipment-card")) {
        ui.draggable.remove();
        // jQuery seems to have some trouble removing the highlight class with this
        $(".drop-highlight").removeClass("drop-highlight");
      }
    }
  });
  
  $('#search-container').droppable({
    tolerance: "pointer",
    accept: ".equipment-card",
    /*activeClass: "drop-highlight",
    hoverClass: "drop-hover",*/
    drop: function(ev, ui) {
        updateCost(ui.draggable.data("price"), false);
        ui.draggable.remove();
    }
  });
  
  $('#listings').delegate('.listing-card', 'click', function(event) {  
    loadTooltip(this, '#tooltip-left');
  });
  
  $('#avatar').delegate('.equipment-card', 'click', function(event) {
    loadTooltip(this, '#tooltip-right');
  });
  
  $("#link").click(function() {
    $("#url", "#link-window").val(buildLink());
    $("#link-window").dialog("open");
  });
  
  $("#url").focus(function(){
    // Select input field contents
    this.select();
  });
  /*
  $("#email").click(function() {
    $("#email-window").dialog("open");
  });
  */
  $("#welcome").click(function() {
    $("#welcome-window").dialog("open");
  });
  
  // Display welcome window on load
  $("#welcome-window").dialog("open");
});

////////////////////////////////////////////////////////////////////////////////
// END JQUERY ONLOAD ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Generate a link by checking all of the avatar's populated items
function buildLink() {
  var url = "http://";
  url += window.location.host + window.location.pathname;
  
  var amp = "?";
  $("#avatar").find(".equipment-card").each(function(index) {
    if($(this).data("styleId") != undefined) {
      url += amp + $(this).parent().attr("id") + "=" + $(this).data("styleId")
      if(amp == "?") { amp = "&"; }
    }
  });

  return url;
}

// Create the HTML for a tooltip when hovering over items
function buildTooltip(item) {
  var textToInsert = '<div class="product-tooltip">';
  textToInsert += '<div class="product-image-container">';
  textToInsert += '<img class="polaroid" src="/images/polaroid.png">';
  textToInsert += '<img class="product-image" height="240" src="' + item.styles[0].imageUrl  + '">';
  textToInsert += '</div>';
  textToInsert += '<span class="title">';
  textToInsert += '<span class="brand-name">' + item.brandName + '</span> ';
  textToInsert += '<span class="product-name">' + item.productName + '</span>';
  textToInsert += '</span>';
  textToInsert += '<span class="price">' + item.styles[0].price + '</span>';
  textToInsert += '<div class="clear">&nbsp;</div>';
  textToInsert += '<span class="color">';
  textToInsert += '<span class="color-label">Color: </span>';
  textToInsert += '<span class="color-value">' + item.styles[0].color + '</span>';
  textToInsert += '</span>';
  textToInsert += '<span class="link"><a target="_blank" href="' + item.styles[0].productUrl + '">View on Zappos &raquo;</a></span>';
  textToInsert += '<div class="clear">&nbsp;</div>';
  textToInsert += '</div>';
  return textToInsert;
}

// Perform an AJAX call to get the results of a search and populate the listings
function loadListing(page_index, createPagination) {
  var loading = '<img src="/images/ajax-loader.gif" alt="Loading...">';
  $("#loading").html(loading);
  //alert( SORT_BY[$('#search-sort').val()] );

  $.ajax({
    url: "/z/Search",
    data: {
      limit: ITEMS_PER_PAGE,
      term: $("#search-field").val(),
      filters: '{"gender":["womens"],"categoryFacet":["' + $("#search-category").val() + '"]}',
      sort: "{" + SORT_BY[$('#search-sort').val()] + "}",
      page: page_index+1
    },
    success: function( data ) {
      // Remove loading indicator
      $("#loading").empty();
      
      // Output number of items found
      if(createPagination == true) {
        if($("#search-field").val() == "") {
          $("#num-results").html(addCommas(data.totalResultCount) + " items in <b>" 
                + $("#search-category").val() + "</b>");
        } else {
          $("#num-results").html(addCommas(data.totalResultCount) + " results for <b>" 
                + $("#search-field").val() + "</b> in <b>" + $("#search-category").val() + "</b>");
        }
      }
    
      // Build out display of items
      var textToInsert;
      $("#listings").empty();
      var i = 0;
      $.map( data.results, function( item ) {
        textToInsert = '<li class="listing-card">';
        textToInsert += '<img  class="thumbnail" src="' + item.thumbnailImageUrl + '"></img>';
        textToInsert += '<div class="title"><a href="#">' + item.brandName + " " + item.productName + '</a></div>';
        textToInsert += '<div class="price">' + item.price + '</div>';
        textToInsert += '</li>';
        var listing = $(textToInsert);
        item.category = $("#search-category").val();
        listing.data("styleId", item.styleId);
        listing.data("price", item.price);
        listing.data("category", $("#search-category").val());
        $("#listings").append(listing);
        i++;
      });
      
      // Insert pagination links (when searching)
      var firstRun = true; // to prevent paginationCallback() from running twice on first call to loadListing()
      if(createPagination == true && data.totalResultCount > 0) {
        $("#pagination").pagination(data.totalResultCount, {
          num_edge_entries: 1,
          num_display_entries: 3,
          callback: paginationCallback,
          items_per_page: ITEMS_PER_PAGE,
          next_text: "&raquo;",
          prev_text: "&laquo;"
        });
      }
      
      function paginationCallback(page_index, jq) {
        if(!firstRun) { // This hack makes me feel dirty. But it works :(
          loadListing(page_index, false);
        }
        firstRun = false;
        return false;
      }
    }
  });
}

// Fetch additional info on an item via AJAX and add item to avatar.
// equipment is an Object containing name/value pairs of styleId's to divId's
function loadEquipment(equipment) {
  if($.isEmptyObject(equipment)) {
    return false; // Nothing to add
  }
  
  // Build styleId string for Ajax call
  var equipmentStr = "[";
  for (var e in equipment) {
    equipmentStr += '"' + e + '",';
  }
  equipmentStr = equipmentStr.substring(0, equipmentStr.length-1);
  equipmentStr += "]";
  
  // styleId's seem to be more unique than equipmentId's, so we use styleId's
  $.ajax({
    url: "/z/Product",
    data: {
      styleId: equipmentStr,
      includes: '["styles","thumbnailImageUrl"]'
    },
    success: function(data) {
      $.map(data.product, function(item) {
        // Add items to avatar
        var styleId = item.styles[0].styleId;
        var divId = equipment[styleId];
        var div = $("#"+divId);
        
        var equipmentDiv = $('<div class="equipment-card"></div>');
        var image = $('<img class="thumbnail" src="' + item.styles[0].thumbnailImageUrl + '">');
        // Scale image down to size of slot
        image.width( div.width() );
        image.height( div.height() );
        equipmentDiv.data("styleId", styleId);
        equipmentDiv.data("price", item.styles[0].price);
        // alert(item.styles[0].price);
        updateCost(item.styles[0].price, true);
        equipmentDiv.data("product", item);
        // TODO: Fix me please. The below is a hack. I don't know which 
        // category the item is for, so I steal one so that the hovering works.
        equipmentDiv.data("category", $(div).attr("data-category").split(",")[0]);
        equipmentDiv.append(image);
        div.empty().append(equipmentDiv);
      });
    }
  });
}

// Run an AJAX call to get content for an item's tooltip
function loadTooltip(element, tooltipId) {
  // Don't load if it's an empty slot
  if($(element).data("styleId") == undefined) { return false; }

  $(element).qtip({
    overwrite: false, // Make sure another tooltip can't overwrite this one without it being explicitly destroyed
    content: '<img src="/images/ajax-loader.gif" alt="Loading...">',
    position: {
      target: $(tooltipId)
    },
    show: {
      ready: true, // Needed to make it show on first mouseover event
      solo: true,
      when: { event: 'click' },
      effect: { length: 0 }
    },
    hide: {
      fixed: true, // Make it fixed so it can be hovered over
      delay: 1000,
      when: { event: 'unfocus' },
      effect: { length: 0 }
    },
    style: {
      name: 'light',
      border: 0,
      width: 460,
      height: 640
    },
    api: {
      beforeShow: function() {
        //alert( $(element).data("listing").productName );
        if($(element).data("product") != undefined) {
          this.updateContent(buildTooltip($(element).data("product")));
        } else {
          var api = this;
          $.ajax({
            url: '/z/Product',
            data: {
              styleId: $(element).data("styleId"),
              includes: '["styles","thumbnailImageUrl"]'
            },
            success: function(data) {
              $.map(data.product, function(item) {
                api.updateContent(buildTooltip(item));
              });
            },
            error: function() { return false; }
          });
        }
      }
    }
  });
}

// Update the cost of the outfit with a price (e.g. $124.46)
function updateCost(price, add) {
  var cost = parseFloat($("#cost").html().slice(1).replace(/\,/g,''));
  if(add == true) {
    cost += parseFloat(price.slice(1).replace(/\,/g,''));
  } else {
    cost -= parseFloat(price.slice(1).replace(/\,/g,''));
  }
  $("#cost").empty().html("$" + addCommas(cost.toFixed(2)));
}

////////////////////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Format a number with commas, e.g. "1,234"
// From: http://www.mredkj.com/javascript/nfbasic.html
function addCommas(nStr)
{
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

// Creates a new function that combines live() and draggable(): liveDraggable()
// Hat tip: http://stackoverflow.com/questions/1805210/jquery-drag-and-drop-using-live-events
(function ($) {
   jQuery.fn.liveDraggable = function (opts) {
      this.live("mouseover", function() {
         if (!$(this).data("init")) {
            $(this).data("init", true).draggable(opts);
         }
      });
   };
})(jQuery);

// Use 'has' to determine if an array has a specific value; array.has(value)
// From: http://snook.ca/archives/javascript/testing_for_a_v
Array.prototype.has=function(v) {
  for (i=0; i<this.length; i++) {
    if (this[i]==v) return true;
  }
  return false;
}

// Function to return all (or specific) url parameters
// var allVars = $.getUrlVars();
// var byName = $.getUrlVar('name');
// Thx: http://jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html
$.extend({
  getUrlVars: function(){
    var vars = [], hash, end;
    if(window.location.href.indexOf('#') > 0) {
      end = window.location.href.indexOf('#');
    } else {
      end = window.location.href.length;
    }
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1, end).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});
