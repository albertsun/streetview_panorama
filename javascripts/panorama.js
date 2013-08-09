
var map, panorama, drawer,
  start_point = new google.maps.LatLng(40.673817,-73.947336);

$(document).ready(function() {
  var mapOptions = {
    center: start_point,
    zoom: 17,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  var panoramaOptions = {
    position: start_point,
    pov: {
      heading: 0,
      pitch: 0
    }
  };
  panorama = new google.maps.StreetViewPanorama(document.getElementById("streetview"), panoramaOptions);
  map.setStreetView(panorama);

  google.maps.event.addListener(panorama, 'pano_changed', function() {
    console.log("pano_changed", panorama.getPano(), arguments);

    panorama.setPov({
      heading: panorama.getPhotographerPov().heading - 90,
      pitch: 0
    });  
  });

  drawer = new google.maps.drawing.DrawingManager({
    drawingControlOptions: {
      drawingModes: [
        google.maps.drawing.OverlayType.POLYLINE
      ]
    }
  });
  drawer.setMap(map);

  google.maps.event.addListener(drawingManager, 'polylinecomplete', function(polyline) {
    // var radius = polyline.getRadius();
    var path = polyline.getPath();
    console.log(path);
  });
});
