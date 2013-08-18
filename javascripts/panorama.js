
var map, panorama, drawer,
  svservice = new google.maps.StreetViewService(),
  center_point = new google.maps.LatLng(40.67292191350895, -73.94703559259034),
  start_point = new google.maps.LatLng(40.673817,-73.947336);

var default_polyline = new google.maps.Polyline({
  path: [
    new google.maps.LatLng(40.67331498650256, -73.9474081993103),
    new google.maps.LatLng(40.67412869719397, -73.9473009109497)
  ]
});

var PanoramaMaker = {};
PanoramaMaker.size = [600,600]; // "300x600";
PanoramaMaker.fov = 90;
PanoramaMaker.num_points = 20;

$(document).ready(function() {
  var mapOptions = {
    center: center_point,
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

  drawer = new google.maps.drawing.DrawingManager({
    drawingControlOptions: {
      drawingModes: [
        google.maps.drawing.OverlayType.POLYLINE
      ]
    }
  });
  drawer.setMap(map);

  google.maps.event.addListener(drawer, 'polylinecomplete', function(polyline) {
    // var radius = polyline.getRadius();
    PanoramaMaker.active_polyline = polyline;
    PanoramaMaker.path = polyline.getPath();
    console.log(PanoramaMaker.path);
  });

  // google.maps.event.addListener(panorama, 'pano_changed', function() {
  //   console.log("pano_changed", panorama.getPano());
  //   var pano = panorama.getPano();
  //   svservice.getPanoramaById(pano, function(d,s) {
  //     console.log(s, d.location, d.location.latLng.toUrlValue());
  //   });
  // });

  default_polyline.setMap(map);
  PanoramaMaker.active_polyline = default_polyline;
  PanoramaMaker.path = default_polyline.getPath();
});

function getStreetviewPointsAlongLine(path) {
  var unique_points = [];
  var latlng_hashes = {};
  var retval = new jQuery.Deferred();
  var deferreds = [];

  _.each(getPointsAlongLine(PanoramaMaker.path), function(p) {
    panorama.setPosition(p);
    var dfrd = new jQuery.Deferred();
    deferreds.push(dfrd);

    svservice.getPanoramaByLocation(panorama.getPosition(), 5, function(d,s) {
      if (s === "OK") {
        console.log("position_changed", s, d.location, d.location.latLng.toUrlValue());

        var position = d.location.latLng;
        var puv = position.toUrlValue();
        if (!latlng_hashes[puv]) {
          panorama.setPosition(position);
          var heading = panorama.getPhotographerPov().heading - 90;

          unique_points.push({
            position: position,
            heading: heading
          });
          latlng_hashes[puv] = true;
        }
      } else {
        console.log(arguments);
      }
      dfrd.resolve();
    });
  });
  jQuery.when.apply(this, deferreds).then(function() {
    retval.resolve(unique_points);
  });

  return retval;
}

function getPointsAlongLine(path, num_points) {
  if (!num_points) num_points = PanoramaMaker.num_points;
  var points = [];
  for (var i=0; i< num_points; i++) {
    points.push(google.maps.geometry.spherical.interpolate(path.getAt(0), path.getAt(1), i/num_points));
  }
  return points;
  // var path_arr = path.getArray();
  // for (var i=1; i>path_arr.length; i++) {
  //   google.maps.geometry.spherical.interpolate(path.getAt(i-1), path.getAt(i), 0.5);  
  // }
}
function getImageForPoint(latlng, right) {
  if (!right) {
    right = false;
  } else {
    right = true;
  }

  panorama.setPosition(latlng);
  var heading;
  if (right === true) {
    heading = panorama.getPhotographerPov().heading + 90;
  } else {
    heading = panorama.getPhotographerPov().heading - 90;
  }

  panorama.setPov({
    heading: heading,
    pitch: 0
  });

  // var pano = panorama.getPano();
  // console.log(latlng.toUrlValue(), pano);
  // svservice.getPanoramaById(pano, function(d,s) {
    //   console.log(s, d.location, d.location.latLng.toUrlValue());
  // });
  
  return {
    position: panorama.getPosition(),
    heading: heading
  };
}

function generateStreetviewImageUrl(location) {
  var size = PanoramaMaker.size.join("x");
  var fov = PanoramaMaker.fov;
  return "http://maps.googleapis.com/maps/api/streetview?sensor=false&size="+size+"&fov="+fov+"&location="+location.position.toUrlValue()+"&heading="+location.heading;
}

//interpolated_path = getPointsAlongLine(PanoramaMaker.path)
//image_locations = _.map(interpolated_path, function(p) { return getImageForPoint(p); })
function renderStreetviewImages(image_locations) {
  $("#pano").html("");
  $("#pano").css({"display":"block", "width": ((10+PanoramaMaker.size[0])*image_locations.length)+"px"});
  for (var i=0; i<image_locations.length; i++) {
    var image_url = generateStreetviewImageUrl(image_locations[i]);
    $("#pano").append(
        $("<img>").attr("src",image_url)
      );
  }
}
// renderStreetviewImages(_.map(getPointsAlongLine(PanoramaMaker.path), function(p) { return getImageForPoint(p); }))

function rerenderAll() {
  // renderStreetviewImages(_.map(getPointsAlongLine(PanoramaMaker.path), function(p) { return getImageForPoint(p); }));
  getStreetviewPointsAlongLine().done(function(unique_points){
    renderStreetviewImages(unique_points);
  });
}

function hideStreetviewImages() {
  $("#pano").hide();
}