// ============================================
// COMMUNITY REPORT SYSTEM
// ============================================


// ============================================
// MAP SETUP
// ============================================

let map;
let marker;


// Default map position
// Nairobi, Kenya

const defaultLatitude = -1.286389;
const defaultLongitude = 36.817223;


// Create map

if (document.getElementById("map")) {

    map = L.map("map").setView(
        [defaultLatitude, defaultLongitude],
        13
    );


    // OpenStreetMap tiles

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    // ========================================
    // CLICK MAP TO SELECT LOCATION
    // ========================================

    map.on("click", function (event) {

        const latitude =
            event.latlng.lat;

        const longitude =
            event.latlng.lng;


        // Add or move marker

        if (marker) {

            marker.setLatLng([
                latitude,
                longitude
            ]);

        } else {

            marker = L.marker([
                latitude,
                longitude
            ]).addTo(map);

        }


        // Fill coordinate fields

        document.getElementById("latitude").value =
            latitude.toFixed(6);

        document.getElementById("longitude").value =
            longitude.toFixed(6);


        document.getElementById("locationMessage")
            .textContent =
            "Location selected on the map.";

    });

}



// ============================================
// CURRENT LOCATION BUTTON
// ============================================

const locationBtn =
    document.getElementById("locationBtn");

const locationMessage =
    document.getElementById("locationMessage");


if (locationBtn) {

    locationBtn.addEventListener(
        "click",
        function () {

            if (!navigator.geolocation) {

                locationMessage.textContent =
                    "Your browser does not support location services.";

                return;
            }


            locationMessage.textContent =
                "Getting your current location...";


            locationBtn.disabled = true;

            locationBtn.textContent =
                "📍 Getting Location...";


            navigator.geolocation.getCurrentPosition(

                function (position) {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;


                    // Fill coordinates

                    document.getElementById("latitude").value =
                        latitude.toFixed(6);

                    document.getElementById("longitude").value =
                        longitude.toFixed(6);


                    // Move map

                    if (map) {

                        map.setView(
                            [latitude, longitude],
                            16
                        );


                        // Add or move marker

                        if (marker) {

                            marker.setLatLng([
                                latitude,
                                longitude
                            ]);

                        } else {

                            marker = L.marker([
                                latitude,
                                longitude
                            ]).addTo(map);

                        }

                    }


                    locationMessage.textContent =
                        "Your current location has been captured.";


                    locationBtn.disabled = false;

                    locationBtn.textContent =
                        "📍 Location Captured";

                },


                function (error) {

                    console.error(
                        "Location error:",
                        error
                    );


                    locationBtn.disabled = false;

                    locationBtn.textContent =
                        "📍 Use My Current Location";


                    if (error.code === 1) {

                        locationMessage.textContent =
                            "Location permission was denied.";

                    }

                    else if (error.code === 2) {

                        locationMessage.textContent =
                            "Your location could not be determined.";

                    }

                    else if (error.code === 3) {

                        locationMessage.textContent =
                            "Location request timed out.";

                    }

                    else {

                        locationMessage.textContent =
                            "Unable to get your location.";

                    }

                },


                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }

            );

        }
    );

}



// ============================================
// SUBMIT REPORT
// ============================================

const reportForm =
    document.getElementById("reportForm");

const reportMessage =
    document.getElementById("reportMessage");


if (reportForm) {

    reportForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            reportMessage.textContent =
                "Submitting report...";


            try {

                // Get logged-in user

                const {
                    data: { user },
                    error: userError
                } =
                    await supabaseClient
                        .auth
                        .getUser();


                if (userError || !user) {

                    window.location.href =
                        "login.html";

                    return;
                }


                // Get form values

                const title =
                    document.getElementById("title")
                        .value.trim();


                const description =
                    document.getElementById("description")
                        .value.trim();


                const category =
                    document.getElementById("category")
                        .value;


                const location =
                    document.getElementById("location")
                        .value.trim();


                const latitudeValue =
                    document.getElementById("latitude")
                        .value;


                const longitudeValue =
                    document.getElementById("longitude")
                        .value;


                const latitude =
                    latitudeValue === ""
                        ? null
                        : Number(latitudeValue);


                const longitude =
                    longitudeValue === ""
                        ? null
                        : Number(longitudeValue);


                // ====================================
                // PHOTO UPLOAD
                // ====================================

                const imageFile =
                    document.getElementById("reportImage")
                        .files[0];


                let imageUrl = null;


                if (imageFile) {

                    reportMessage.textContent =
                        "Uploading photo...";


                    const fileExtension =
                        imageFile.name
                            .split(".")
                            .pop();


                    const fileName =
                        user.id +
                        "_" +
                        Date.now() +
                        "." +
                        fileExtension;


                    const filePath =
                        "reports/" +
                        fileName;


                    const {
                        error: uploadError
                    } =
                        await supabaseClient
                            .storage
                            .from("report-images")
                            .upload(
                                filePath,
                                imageFile
                            );


                    if (uploadError) {
                        throw uploadError;
                    }


                    const {
                        data: publicUrlData
                    } =
                        supabaseClient
                            .storage
                            .from("report-images")
                            .getPublicUrl(
                                filePath
                            );


                    imageUrl =
                        publicUrlData.publicUrl;

                }


                // ====================================
                // SAVE REPORT
                // ====================================

                reportMessage.textContent =
                    "Saving report...";


                const { error } =
                    await supabaseClient
                        .from("reports")
                        .insert([
                            {
                                user_id: user.id,
                                title: title,
                                description: description,
                                category: category,
                                location: location,
                                latitude: latitude,
                                longitude: longitude,
                                image_url: imageUrl
                            }
                        ]);


                if (error) {
                    throw error;
                }


                reportMessage.textContent =
                    "Report submitted successfully!";


                reportForm.reset();


                // Remove marker after submission

                if (marker) {

                    map.removeLayer(marker);

                    marker = null;

                }

            }

            catch (error) {

                console.error(error);

                reportMessage.textContent =
                    "Error: " +
                    error.message;

            }

        }
    );

}