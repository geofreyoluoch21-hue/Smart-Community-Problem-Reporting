// ============================================
// ADMIN DASHBOARD
// ============================================

let allReports = [];
let adminMap;
let reportMarkers = [];


// ============================================
// INITIALIZE ADMIN MAP
// ============================================

function initializeAdminMap() {

    const mapElement =
        document.getElementById("adminMap");

    if (!mapElement || typeof L === "undefined") {
        return;
    }

    adminMap = L.map("adminMap").setView(
        [-1.286389, 36.817223],
        12
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(adminMap);

    setTimeout(function () {

        adminMap.invalidateSize();

    }, 100);
}


// ============================================
// DISPLAY REPORT MARKERS
// ============================================

function displayReportMarkers(reports) {

    if (!adminMap) {
        return;
    }

    // Remove existing markers

    reportMarkers.forEach(function (marker) {

        adminMap.removeLayer(marker);

    });

    reportMarkers = [];


    const bounds =
        L.latLngBounds([]);


    let markerCount = 0;


    reports.forEach(function (report) {

        const latitude =
            parseFloat(report.latitude);

        const longitude =
            parseFloat(report.longitude);


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            return;
        }


        const marker =
            L.marker([
                latitude,
                longitude
            ]).addTo(adminMap);


        const residentName =
            report.profiles?.full_name ||
            "Unknown resident";


        const popupContent = `

            <div style="min-width:220px;">

                <h3 style="margin-bottom:8px;">
                    ${escapeHtml(report.title)}
                </h3>

                <p>
                    <strong>Category:</strong>
                    ${escapeHtml(report.category)}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${escapeHtml(report.status)}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${escapeHtml(report.location)}
                </p>

                <p>
                    <strong>Resident:</strong>
                    ${escapeHtml(residentName)}
                </p>

            </div>

        `;


        marker.bindPopup(popupContent);


        reportMarkers.push(marker);


        bounds.extend([
            latitude,
            longitude
        ]);


        markerCount++;

    });


    if (markerCount > 0) {

        adminMap.fitBounds(
            bounds,
            {
                padding: [30, 30]
            }
        );

    }

    else {

        adminMap.setView(
            [-1.286389, 36.817223],
            12
        );

    }
}


// ============================================
// HTML ESCAPE
// ============================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================
// LOAD ADMIN DASHBOARD
// ============================================

async function loadAdminDashboard() {

    const adminEmail =
        document.getElementById("adminEmail");

    const adminReports =
        document.getElementById("adminReports");


    try {

        // ========================================
        // CHECK LOGGED-IN USER
        // ========================================

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


        // ========================================
        // CHECK ADMIN ROLE
        // ========================================

        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .select("id, full_name, phone, role")
                .eq("id", user.id)
                .single();


        if (profileError) {

            throw profileError;
        }


        if (!profile || profile.role !== "admin") {

            adminEmail.textContent =
                "Access denied. Administrator access required.";

            adminReports.innerHTML = `

                <div class="welcome-card">

                    <p>
                        You do not have administrator
                        permissions.
                    </p>

                </div>

            `;

            return;
        }


        adminEmail.textContent =
            "Logged in as: " +
            user.email;


        // ========================================
        // LOAD REPORTS
        // ========================================

        const {
            data: reports,
            error: reportsError
        } =
            await supabaseClient
                .from("reports")
                .select(`
                    *,
                    profiles (
                        full_name,
                        phone
                    )
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (reportsError) {

            throw reportsError;
        }


        allReports =
            reports || [];


        updateStatistics(
            allReports
        );


        displayReports(
            allReports
        );


        displayReportMarkers(
            allReports
        );

    }

    catch (error) {

        console.error(error);

        adminReports.innerHTML = `

            <div class="welcome-card">

                <p>
                    Error loading reports:
                    ${escapeHtml(error.message)}
                </p>

            </div>

        `;

    }
}


// ============================================
// UPDATE STATISTICS
// ============================================

function updateStatistics(reports) {

    document.getElementById("totalReports")
        .textContent =
        reports.length;


    document.getElementById("submittedReports")
        .textContent =
        reports.filter(function (report) {

            return report.status === "Submitted";

        }).length;


    document.getElementById("underReviewReports")
        .textContent =
        reports.filter(function (report) {

            return report.status === "Under Review";

        }).length;


    document.getElementById("inProgressReports")
        .textContent =
        reports.filter(function (report) {

            return report.status === "In Progress";

        }).length;


    document.getElementById("resolvedReports")
        .textContent =
        reports.filter(function (report) {

            return report.status === "Resolved";

        }).length;


    document.getElementById("rejectedReports")
        .textContent =
        reports.filter(function (report) {

            return report.status === "Rejected";

        }).length;
}


// ============================================
// DISPLAY REPORTS
// ============================================

function displayReports(reports) {

    const container =
        document.getElementById("adminReports");


    if (!reports.length) {

        container.innerHTML = `

            <div class="welcome-card">

                <p>
                    No reports found.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML = "";


    reports.forEach(function (report) {

        const card =
            document.createElement("div");


        card.className =
            "admin-report-card";


        const residentName =
            report.profiles?.full_name ||
            "Unknown resident";


        const residentPhone =
            report.profiles?.phone ||
            "Not provided";


        const createdDate =
            report.created_at
                ? new Date(
                    report.created_at
                ).toLocaleString()
                : "Unknown";


        let photoHtml = "";


        if (report.image_url) {

            photoHtml = `

                <p>
                    <strong>Photo:</strong>
                </p>

                <img
                    src="${escapeHtml(report.image_url)}"
                    alt="Report photo"
                    class="report-photo"
                >

            `;
        }


        card.innerHTML = `

            <h2>
                ${escapeHtml(report.title)}
            </h2>


            <p>
                <strong>Description:</strong><br>
                ${escapeHtml(report.description)}
            </p>


            <p>
                <strong>Category:</strong>
                ${escapeHtml(report.category)}
            </p>


            <p>
                <strong>Location:</strong>
                ${escapeHtml(report.location)}
            </p>


            <p>
                <strong>Resident:</strong>
                ${escapeHtml(residentName)}
            </p>


            <p>
                <strong>Phone:</strong>
                ${escapeHtml(residentPhone)}
            </p>


            <p>
                <strong>Date Submitted:</strong>
                ${escapeHtml(createdDate)}
            </p>


            ${
                report.latitude !== null &&
                report.longitude !== null
                ? `
                    <p>
                        <strong>Coordinates:</strong>
                        ${escapeHtml(report.latitude)},
                        ${escapeHtml(report.longitude)}
                    </p>
                `
                : `
                    <p>
                        <strong>Coordinates:</strong>
                        Not provided
                    </p>
                `
            }


            ${photoHtml}


            <label>

                <strong>
                    Update Status:
                </strong>


                <select
                    class="status-select"
                    data-report-id="${report.id}"
                >

                    <option
                        value="Submitted"
                        ${report.status === "Submitted" ? "selected" : ""}
                    >
                        Submitted
                    </option>


                    <option
                        value="Under Review"
                        ${report.status === "Under Review" ? "selected" : ""}
                    >
                        Under Review
                    </option>


                    <option
                        value="In Progress"
                        ${report.status === "In Progress" ? "selected" : ""}
                    >
                        In Progress
                    </option>


                    <option
                        value="Resolved"
                        ${report.status === "Resolved" ? "selected" : ""}
                    >
                        Resolved
                    </option>


                    <option
                        value="Rejected"
                        ${report.status === "Rejected" ? "selected" : ""}
                    >
                        Rejected
                    </option>

                </select>

            </label>


            <p
                class="status-message"
                id="statusMessage-${report.id}"
            ></p>

        `;


        container.appendChild(card);

    });


    // ========================================
    // STATUS CHANGE LISTENERS
    // ========================================

    document
        .querySelectorAll(".status-select")
        .forEach(function (select) {

            select.addEventListener(
                "change",
                function () {

                    const reportId =
                        this.dataset.reportId;

                    const newStatus =
                        this.value;


                    updateReportStatus(
                        reportId,
                        newStatus
                    );

                }
            );

        });
}


// ============================================
// UPDATE REPORT STATUS
// ============================================

async function updateReportStatus(
    reportId,
    newStatus
) {

    const message =
        document.getElementById(
            "statusMessage-" + reportId
        );


    if (message) {

        message.textContent =
            "Updating status...";

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("reports")
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq(
                    "id",
                    reportId
                );


        if (error) {

            throw error;
        }


        // Update local report data

        const report =
            allReports.find(function (item) {

                return String(item.id) ===
                    String(reportId);

            });


        if (report) {

            report.status =
                newStatus;

        }


        updateStatistics(
            allReports
        );


        applyFilters();


        if (message) {

            message.textContent =
                "Report status updated successfully.";

        }

    }

    catch (error) {

        console.error(error);

        if (message) {

            message.textContent =
                "Error: " +
                error.message;

        }

    }
}


// ============================================
// SEARCH AND FILTER
// ============================================

function applyFilters() {

    const searchInput =
        document.getElementById(
            "searchReports"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "";


    const filteredReports =
        allReports.filter(function (report) {

            const residentName =
                report.profiles?.full_name ||
                "";


            const residentPhone =
                report.profiles?.phone ||
                "";


            const searchableText = (

                (report.title || "") +
                " " +
                (report.description || "") +
                " " +
                (report.location || "") +
                " " +
                (report.category || "") +
                " " +
                residentName +
                " " +
                residentPhone

            ).toLowerCase();


            const matchesSearch =
                searchTerm === "" ||
                searchableText.includes(
                    searchTerm
                );


            const matchesStatus =
                selectedStatus === "" ||
                report.status === selectedStatus;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    displayReports(
        filteredReports
    );


    displayReportMarkers(
        filteredReports
    );
}


// ============================================
// CLEAR FILTERS
// ============================================

function clearFilters() {

    const searchInput =
        document.getElementById(
            "searchReports"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    if (searchInput) {

        searchInput.value = "";

    }


    if (statusFilter) {

        statusFilter.value = "";

    }


    displayReports(
        allReports
    );


    displayReportMarkers(
        allReports
    );
}


// ============================================
// EVENT LISTENERS
// ============================================

const searchInput =
    document.getElementById(
        "searchReports"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );

}


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        applyFilters
    );

}


const clearFiltersButton =
    document.getElementById(
        "clearFilters"
    );


if (clearFiltersButton) {

    clearFiltersButton.addEventListener(
        "click",
        clearFilters
    );

}


// ============================================
// START ADMIN DASHBOARD
// ============================================

initializeAdminMap();

loadAdminDashboard();
