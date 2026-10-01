document.addEventListener("DOMContentLoaded", async function () {

    /* =========================================================
       ELEMENTS
    ========================================================== */

    const totalReports =
        document.getElementById("totalReports");

    const submittedReports =
        document.getElementById("submittedReports");

    const underReviewReports =
        document.getElementById("underReviewReports");

    const inProgressReports =
        document.getElementById("inProgressReports");

    const resolvedReports =
        document.getElementById("resolvedReports");

    const rejectedReports =
        document.getElementById("rejectedReports");

    const adminReports =
        document.getElementById("adminReports");

    const searchReports =
        document.getElementById("searchReports");

    const statusFilter =
        document.getElementById("statusFilter");

    const clearFilters =
        document.getElementById("clearFilters");


    /* =========================================================
       GLOBAL DATA
    ========================================================== */

    let allReports = [];
let allResidents = [];

let allOrganizations = [];
let allAssignments = [];
let assignmentMap = {};

let adminMap = null;
let mapMarkers = [];


    /* =========================================================
       ESCAPE HTML
    ========================================================== */

    function escapeHTML(value) {

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


    /* =========================================================
       FORMAT DATE
    ========================================================== */

    function formatDate(dateValue) {

        if (!dateValue) {
            return "N/A";
        }

        const date = new Date(dateValue);

        if (isNaN(date.getTime())) {
            return "N/A";
        }

        return date.toLocaleString();
    }


    /* =========================================================
       GET LOGGED-IN USER
    ========================================================== */

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        window.location.href = "login.html";

        return;
    }


    /* =========================================================
       CHECK ADMIN ROLE
    ========================================================== */

    const {
        data: adminProfile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("id, full_name, phone, role")
        .eq("id", user.id)
        .single();


    if (
        profileError ||
        !adminProfile ||
        adminProfile.role !== "admin"
    ) {

        alert("Administrator access required.");

        window.location.href = "dashboard.html";

        return;
    }
    /* =========================================================
   LOAD ORGANIZATIONS
========================================================= */

async function loadOrganizations() {

    const {
        data: organizations,
        error
    } = await supabaseClient
        .from("organizations")
        .select("*")
        .order("name", {
            ascending: true
        });

    if (error) {

        console.error(
            "Organizations loading error:",
            error
        );

        allOrganizations = [];
        return;
    }

    allOrganizations = organizations || [];
}


/* =========================================================
   LOAD REPORT ASSIGNMENTS
========================================================= */

async function loadAssignments() {

    const {
        data: assignments,
        error
    } = await supabaseClient
        .from("report_assignments")
        .select("*")
        .order("assigned_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "Assignments loading error:",
            error
        );

        allAssignments = [];
        assignmentMap = {};

        return;
    }

    allAssignments = assignments || [];

    assignmentMap = {};

    /*
     * Newest assignment comes first.
     * Therefore the first assignment for each
     * report is treated as the current assignment.
     */

    allAssignments.forEach(assignment => {

        if (
            assignment.report_id &&
            !assignmentMap[assignment.report_id]
        ) {

            assignmentMap[assignment.report_id] =
                assignment;
        }

    });
}


    /* =========================================================
       LOAD REPORTS
    ========================================================== */

    async function loadReports() {

        if (adminReports) {
            adminReports.innerHTML = `
                <div class="admin-loading">
                    Loading reports...
                </div>
            `;
        }


        const {
            data: reports,
            error
        } = await supabaseClient
            .from("reports")
            .select("*")
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "Reports loading error:",
                error
            );

            if (adminReports) {
                adminReports.innerHTML = `
                    <div class="admin-empty">
                        Unable to load reports.
                        <br>
                        ${escapeHTML(error.message)}
                    </div>
                `;
            }

            return;
        }


        allReports = reports || [];


        /* =====================================================
           LOAD PROFILE INFORMATION FOR REPORTS
        ====================================================== */

        const userIds = [
            ...new Set(
                allReports
                    .map(report => report.user_id)
                    .filter(Boolean)
            )
        ];


        let profileMap = {};


        if (userIds.length > 0) {

            const {
                data: profiles,
                error: profilesError
            } = await supabaseClient
                .from("profiles")
                .select(
                    "id, full_name, phone, role, created_at"
                )
                .in("id", userIds);


            if (!profilesError && profiles) {

                profiles.forEach(profile => {

                    profileMap[profile.id] =
                        profile;

                });

            } else if (profilesError) {

                console.error(
                    "Profile loading error:",
                    profilesError
                );
            }
        }


        allReports = allReports.map(report => {

            return {
                ...report,
                profile:
                    profileMap[report.user_id] || null
            };

        });


        updateStatistics();

        renderReports();

        initializeMap();
    }


    /* =========================================================
       STATISTICS
    ========================================================== */

    function updateStatistics() {

        const reports =
            allReports || [];


        function countStatus(status) {

            return reports.filter(
                report =>
                    report.status === status
            ).length;

        }


        if (totalReports) {
            totalReports.textContent =
                reports.length;
        }


        if (submittedReports) {
            submittedReports.textContent =
                countStatus("Submitted");
        }


        if (underReviewReports) {
            underReviewReports.textContent =
                countStatus("Under Review");
        }


        if (inProgressReports) {
            inProgressReports.textContent =
                countStatus("In Progress");
        }


        if (resolvedReports) {
            resolvedReports.textContent =
                countStatus("Resolved");
        }


        if (rejectedReports) {
            rejectedReports.textContent =
                countStatus("Rejected");
        }
    }


    /* =========================================================
       REPORT STATUS CLASS
    ========================================================== */

    function statusClass(status) {

        if (!status) {
            return "";
        }

        return status
            .toLowerCase()
            .replace(/\s+/g, "-");
    }


    /* =========================================================
       RENDER REPORTS
    ========================================================== */

    function renderReports() {

        if (!adminReports) {
            return;
        }


        const searchTerm =
            searchReports
                ? searchReports.value
                    .trim()
                    .toLowerCase()
                : "";


        const selectedStatus =
            statusFilter
                ? statusFilter.value
                : "";


        const filteredReports =
            allReports.filter(report => {

                const residentName =
                    report.profile?.full_name || "";

                const residentPhone =
                    report.profile?.phone || "";


                const searchText = [

                    report.title,
                    report.description,
                    report.category,
                    report.location,
                    report.status,
                    residentName,
                    residentPhone

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    searchText.includes(searchTerm);


                const matchesStatus =
                    !selectedStatus ||
                    report.status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            });


        if (filteredReports.length === 0) {

            adminReports.innerHTML = `
                <div class="admin-empty">
                    No reports found.
                </div>
            `;

            return;
        }


        adminReports.innerHTML =
            filteredReports
                .map(report =>
                    createReportCard(report)
                )
                .join("");


        attachReportEvents();
    }


    /* =========================================================
       CREATE REPORT CARD
    ========================================================== */

    function createReportCard(report) {

        const profile =
            report.profile || {};


        const residentName =
            profile.full_name ||
            "Unknown Resident";


        const residentPhone =
            profile.phone ||
            "Not provided";


        const status =
            report.status ||
            "Submitted";


        const imageHTML =
            report.image_url
                ? `
                    <img
                        src="${escapeHTML(report.image_url)}"
                        alt="Report image"
                        class="report-image"
                    >
                `
                : `
                    <div class="report-image-placeholder">
                        📷
                        <span>No image</span>
                    </div>
                `;


        return `
            <article
                class="report-card"
                data-report-id="${report.id}"
            >

                <div class="report-header">

                    <div>

                        <h3>
                            ${escapeHTML(
                                report.title ||
                                "Untitled Report"
                            )}
                        </h3>

                        <span
                            class="status ${statusClass(status)}"
                        >
                            ${escapeHTML(status)}
                        </span>

                    </div>

                </div>


                <div class="report-details">

                    <p>
                        <strong>Resident:</strong>
                        ${escapeHTML(residentName)}
                    </p>

                    <p>
                        <strong>Phone:</strong>
                        ${escapeHTML(residentPhone)}
                    </p>

                    <p>
                        <strong>Category:</strong>
                        ${escapeHTML(
                            report.category ||
                            "N/A"
                        )}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${escapeHTML(
                            report.location ||
                            "N/A"
                        )}
                    </p>

                    <p>
                        <strong>Submitted:</strong>
                        ${formatDate(
                            report.created_at
                        )}
                    </p>

                </div>


                <div class="report-description">

                    <strong>Description</strong>

                    <p>
                        ${escapeHTML(
                            report.description ||
                            "No description provided."
                        )}
                    </p>

                </div>


                ${imageHTML}


                <div class="admin-edit-area">

                    <h4>Edit Report</h4>


                    <label>
                        Title
                    </label>

                    <input
                        type="text"
                        class="edit-title"
                        value="${escapeHTML(
                            report.title || ""
                        )}"
                    >


                    <label>
                        Category
                    </label>

                    <select class="edit-category">

                        ${categoryOptions(
                            report.category
                        )}

                    </select>


                    <label>
                        Location
                    </label>

                    <input
                        type="text"
                        class="edit-location"
                        value="${escapeHTML(
                            report.location || ""
                        )}"
                    >


                    <label>
                        Status
                    </label>

                    <select class="edit-status">

                        <option
                            value="Submitted"
                            ${status === "Submitted"
                                ? "selected"
                                : ""}
                        >
                            Submitted
                        </option>

                        <option
                            value="Under Review"
                            ${status === "Under Review"
                                ? "selected"
                                : ""}
                        >
                            Under Review
                        </option>

                        <option
                            value="In Progress"
                            ${status === "In Progress"
                                ? "selected"
                                : ""}
                        >
                            In Progress
                        </option>

                        <option
                            value="Resolved"
                            ${status === "Resolved"
                                ? "selected"
                                : ""}
                        >
                            Resolved
                        </option>

                        <option
                            value="Rejected"
                            ${status === "Rejected"
                                ? "selected"
                                : ""}
                        >
                            Rejected
                        </option>

                    </select>


                    <label>
                        Description
                    </label>

                    <textarea
                        class="edit-description"
                        rows="4"
                    >${escapeHTML(
                        report.description || ""
                    )}</textarea>


                    <div class="admin-buttons">

                        <button
                            type="button"
                            class="admin-save-btn"
                            data-id="${report.id}"
                        >
                            Save Changes
                        </button>

                        <button
                            type="button"
                            class="admin-delete-btn"
                            data-id="${report.id}"
                        >
                            Delete Report
                        </button>

                    </div>
                    <div class="report-assignment-area">

    <h4>Assign Responsible Organization</h4>

    ${
        assignmentMap[report.id]
            ? `
                <div class="current-assignment">

                    <p>
                        <strong>Currently Assigned:</strong>
                        ${escapeHTML(
                            getOrganizationName(
                                assignmentMap[report.id].organization_id
                            )
                        )}
                    </p>

                    <p>
                        <strong>Assignment Status:</strong>
                        ${escapeHTML(
                            assignmentMap[report.id].status ||
                            "Assigned"
                        )}
                    </p>

                    <p>
                        <strong>Assigned:</strong>
                        ${formatDate(
                            assignmentMap[report.id].assigned_at
                        )}
                    </p>

                </div>
            `
            : `
                <p class="no-assignment">
                    No organization assigned yet.
                </p>
            `
    }

    <label>
        Responsible Organization
    </label>

    <select
        class="organization-select"
        data-id="${report.id}"
    >
      ${organizationOptions(
    assignmentMap[report.id]
        ? assignmentMap[report.id].organization_id
        : "",
    report.category,
    report.county
)}
    </select>

    <button
        type="button"
        class="assign-organization-btn"
        data-id="${report.id}"
    >
        ${
            assignmentMap[report.id]
                ? "🔄 Reassign Organization"
                : "📌 Assign Organization"
        }
    </button>

</div>

                </div>


                <div class="report-additional-info">

                    <strong>
                        Additional Information
                    </strong>

                    <p>
                        Created:
                        ${formatDate(
                            report.created_at
                        )}
                    </p>

                    <p>
                        Updated:
                        ${formatDate(
                            report.updated_at
                        )}
                    </p>

                    <p>
                        Latitude:
                        ${escapeHTML(
                            report.latitude ??
                            "N/A"
                        )}
                    </p>

                    <p>
                        Longitude:
                        ${escapeHTML(
                            report.longitude ??
                            "N/A"
                        )}
                    </p>

                </div>

            </article>
        `;

    }


    /* =========================================================
       CATEGORY OPTIONS
    ========================================================== */

    function categoryOptions(selectedCategory) {

        const categories = [

            "Roads",
            "Street Lighting",
            "Waste Management",
            "Water",
            "Drainage",
            "Security",
            "Environment",
            "Other"

        ];


        return categories
            .map(category => {

                return `
                    <option
                        value="${escapeHTML(category)}"
                        ${selectedCategory === category
                            ? "selected"
                            : ""}
                    >
                        ${escapeHTML(category)}
                    </option>
                `;

            })
            .join("");

    }
   /* =========================================================
   ORGANIZATION OPTIONS
========================================================= */

function organizationOptions(
    selectedOrganizationId,
    reportCategory,
    reportCounty
) {

    const activeOrganizations =
        allOrganizations.filter(
            organization =>
                organization.status === "Active"
        );


    if (!activeOrganizations.length) {

        return `
            <option value="">
                No active organizations available
            </option>
        `;
    }


    /*
     * Match organizations to the report category.
     *
     * Example:
     * Roads report → KURA / KeRRA
     * Security report → National Police Service
     * Electricity report → Kenya Power
     */

    const matchingOrganizations =
    activeOrganizations.filter(
        organization => {

            const typeMatches =
                organization.type &&
                organization.type.toLowerCase() ===
                String(reportCategory || "").toLowerCase();

            const countyMatches =
                organization.counties &&
                (
                    organization.counties
                        .toLowerCase()
                        .includes(
                            String(reportCounty || "").toLowerCase()
                        )
                    ||
                    organization.counties
                        .toLowerCase()
                        .includes("all 47 counties")
                );

            return typeMatches && countyMatches;
        }
    );


    /*
     * If matching organizations exist,
     * show only those organizations.
     *
     * If none exist yet, show all active organizations
     * so the admin can still manually assign one.
     */

    const otherOrganizations =
    activeOrganizations.filter(
        organization =>
            !matchingOrganizations.some(
                matching =>
                    String(matching.id) ===
                    String(organization.id)
            )
    );


const organizationsToShow = [
    ...matchingOrganizations,
    ...otherOrganizations
];

    return `
        <option value="">
            Select organization...
        </option>

        ${organizationsToShow
            .map(organization => {

                const selected =
                    String(
                        selectedOrganizationId || ""
                    ) ===
                    String(organization.id)
                        ? "selected"
                        : "";

                return `
                    <option
                        value="${escapeHTML(
                            organization.id
                        )}"
                        ${selected}
                    >
                        ${escapeHTML(
                            organization.name
                        )}
                        ${
                            organization.type
                                ? ` — ${escapeHTML(
                                    organization.type
                                  )}`
                                : ""
                        }
                    </option>
                `;

            })
            .join("")}
    `;
}

/* =========================================================
   GET ORGANIZATION NAME
========================================================= */

function getOrganizationName(organizationId) {

    const organization =
        allOrganizations.find(
            item =>
                String(item.id) ===
                String(organizationId)
        );

    return organization
        ? organization.name
        : "Unknown organization";
}


/* =========================================================
   ASSIGN REPORT TO ORGANIZATION
========================================================= */

async function assignReportToOrganization(
    reportId,
    organizationId,
    button
) {

    if (!organizationId) {

        alert(
            "Please select an organization first."
        );

        return;
    }

    const organization =
        allOrganizations.find(
            item =>
                String(item.id) ===
                String(organizationId)
        );

    if (!organization) {

        alert(
            "The selected organization is no longer available."
        );

        return;
    }

    const existingAssignment =
        assignmentMap[reportId];

    button.disabled = true;

    button.textContent =
        existingAssignment
            ? "Reassigning..."
            : "Assigning...";

    try {

        let error = null;

        /* =================================================
           REASSIGN EXISTING REPORT
        ================================================== */

        if (existingAssignment) {

            const result =
                await supabaseClient
                    .from("report_assignments")
                    .update({

                        organization_id:
                            Number(organizationId),

                        assigned_by:
                            user.id,

                        assigned_at:
                            new Date().toISOString(),

                        status:
                            "Assigned",

                        notes:
                            null,

                        updated_at:
                            new Date().toISOString()

                    })
                    .eq(
                        "id",
                        existingAssignment.id
                    );

            error = result.error;

        }

        /* =================================================
           FIRST-TIME ASSIGNMENT
        ================================================== */

        else {

            const result =
                await supabaseClient
                    .from("report_assignments")
                    .insert({

                        report_id:
                            Number(reportId),

                        organization_id:
                            Number(organizationId),

                        assigned_by:
                            user.id,

                        status:
                            "Assigned"

                    });

            error = result.error;
        }


        /* =================================================
           HANDLE ERROR
        ================================================== */

        if (error) {

            console.error(
                "Assignment error:",
                error
            );

            alert(
                "Unable to assign organization: " +
                error.message
            );

            return;
        }


        /* =================================================
           SUCCESS
        ================================================== */

        alert(
            existingAssignment
                ? "Report reassigned successfully."
                : "Report assigned successfully."
        );


        await loadAssignments();

        renderReports();


    } catch (error) {

        console.error(
            "Unexpected assignment error:",
            error
        );

        alert(
            "Unable to assign organization. Please try again."
        );

    } finally {

        button.disabled = false;

    }
}


    /* =========================================================
       REPORT EVENTS
    ========================================================== */

    function attachReportEvents() {
        const assignmentButtons =
    document.querySelectorAll(
        ".assign-organization-btn"
    );


assignmentButtons.forEach(button => {

    button.addEventListener(
        "click",
        async function () {

            const reportId =
                this.dataset.id;

            const card =
                document.querySelector(
                    `.report-card[data-report-id="${reportId}"]`
                );

            if (!card) {
                return;
            }

            const organizationSelect =
                card.querySelector(
                    ".organization-select"
                );

            if (!organizationSelect) {
                return;
            }

            await assignReportToOrganization(
                reportId,
                organizationSelect.value,
                this
            );

        }
    );

});

        const saveButtons =
            document.querySelectorAll(
                ".admin-save-btn"
            );


        const deleteButtons =
            document.querySelectorAll(
                ".admin-delete-btn"
            );


        saveButtons.forEach(button => {

            button.addEventListener(
                "click",
                async function () {

                    const reportId =
                        this.dataset.id;


                    const card =
                        document.querySelector(
                            `.report-card[data-report-id="${reportId}"]`
                        );


                    if (!card) {
                        return;
                    }


                    const title =
                        card.querySelector(
                            ".edit-title"
                        ).value.trim();


                    const category =
                        card.querySelector(
                            ".edit-category"
                        ).value;


                    const location =
                        card.querySelector(
                            ".edit-location"
                        ).value.trim();


                    const status =
                        card.querySelector(
                            ".edit-status"
                        ).value;


                    const description =
                        card.querySelector(
                            ".edit-description"
                        ).value.trim();


                    if (
                        !title ||
                        !location ||
                        !description
                    ) {

                        alert(
                            "Please complete all required fields."
                        );

                        return;
                    }


                    this.disabled = true;

                    this.textContent =
                        "Saving...";


                    const {
                        error
                    } = await supabaseClient
                        .from("reports")
                        .update({

                            title,
                            category,
                            location,
                            status,
                            description,
                            updated_at:
                                new Date().toISOString()

                        })
                        .eq(
                            "id",
                            reportId
                        );


                    if (error) {

                        console.error(
                            "Update error:",
                            error
                        );


                        alert(
                            "Unable to update report: " +
                            error.message
                        );


                        this.disabled = false;

                        this.textContent =
                            "Save Changes";

                        return;
                    }


                    alert(
                        "Report updated successfully."
                    );


                    await loadReports();

                    await loadResidents();

                }
            );

        });


        deleteButtons.forEach(button => {

            button.addEventListener(
                "click",
                async function () {

                    const reportId =
                        this.dataset.id;


                    const confirmed =
                        confirm(
                            "Are you sure you want to delete this report?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    this.disabled = true;

                    this.textContent =
                        "Deleting...";


                    const {
                        error
                    } = await supabaseClient
                        .from("reports")
                        .delete()
                        .eq(
                            "id",
                            reportId
                        );


                    if (error) {

                        console.error(
                            "Delete error:",
                            error
                        );


                        alert(
                            "Unable to delete report: " +
                            error.message
                        );


                        this.disabled = false;

                        this.textContent =
                            "Delete Report";

                        return;
                    }


                    alert(
                        "Report deleted successfully."
                    );


                    await loadReports();

                    await loadResidents();

                }
            );

        });

    }


    /* =========================================================
       INITIALIZE MAP
    ========================================================== */

    function initializeMap() {

        if (
            typeof L === "undefined"
        ) {
            return;
        }


        const mapElement =
            document.getElementById(
                "adminMap"
            );


        if (!mapElement) {
            return;
        }


        if (adminMap) {

            adminMap.remove();

            adminMap = null;

        }


        adminMap =
            L.map("adminMap")
                .setView(
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


        mapMarkers = [];


        allReports.forEach(report => {

            if (
                report.latitude === null ||
                report.longitude === null ||
                report.latitude === undefined ||
                report.longitude === undefined
            ) {
                return;
            }


            const marker =
                L.marker([
                    Number(report.latitude),
                    Number(report.longitude)
                ]).addTo(adminMap);


            marker.bindPopup(`
                <strong>
                    ${escapeHTML(
                        report.title ||
                        "Community Report"
                    )}
                </strong>
                <br>
                ${escapeHTML(
                    report.location ||
                    "Unknown location"
                )}
                <br>
                <strong>Status:</strong>
                ${escapeHTML(
                    report.status ||
                    "Submitted"
                )}
            `);


            mapMarkers.push(marker);

        });


        if (mapMarkers.length > 0) {

            const group =
                L.featureGroup(
                    mapMarkers
                );


            try {

                adminMap.fitBounds(
                    group.getBounds().pad(0.15)
                );

            } catch (error) {

                console.warn(
                    "Unable to fit map bounds:",
                    error
                );

            }

        }

    }


    /* =========================================================
       LOAD RESIDENTS
    ========================================================== */

    async function loadResidents() {

        const residentsSection =
            document.getElementById(
                "residentsSection"
            );


        if (!residentsSection) {
            return;
        }


        const placeholder =
            residentsSection.querySelector(
                ".feature-placeholder"
            );


        if (placeholder) {

            placeholder.innerHTML = `
                <div class="admin-loading">
                    Loading residents...
                </div>
            `;

        }


        const {
            data: profiles,
            error
        } = await supabaseClient
            .from("profiles")
            .select(
                "id, full_name, phone, role, created_at"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Residents loading error:",
                error
            );


            if (placeholder) {

                placeholder.innerHTML = `
                    <div class="admin-empty">
                        Unable to load residents.
                        <br><br>
                        ${escapeHTML(
                            error.message
                        )}
                    </div>
                `;

            }

            return;
        }


        allResidents =
            profiles || [];


        renderResidents();

    }


    /* =========================================================
       RENDER RESIDENTS
    ========================================================== */

    function renderResidents() {

        const residentsSection =
            document.getElementById(
                "residentsSection"
            );


        if (!residentsSection) {
            return;
        }


        const residents =
            allResidents.filter(
                profile =>
                    profile.role !== "admin"
            );


        const reportCounts = {};


        allReports.forEach(report => {

            if (!report.user_id) {
                return;
            }


            if (!reportCounts[report.user_id]) {

                reportCounts[report.user_id] =
                    0;

            }


            reportCounts[report.user_id]++;

        });


        const totalResidents =
            residents.length;


        const totalResidentReports =
            residents.reduce(
                (total, resident) =>
                    total +
                    (
                        reportCounts[resident.id] ||
                        0
                    ),
                0
            );


        residentsSection.innerHTML = `

            <div class="admin-page-heading">

                <div>

                    <h1>Residents</h1>

                    <p>
                        View registered residents and
                        their community participation.
                    </p>

                </div>

            </div>


            <div class="resident-summary-grid">

                <div class="resident-summary-card">

                    <div class="resident-summary-icon">
                        👥
                    </div>

                    <div>

                        <span>
                            Total Residents
                        </span>

                        <strong>
                            ${totalResidents}
                        </strong>

                    </div>

                </div>


                <div class="resident-summary-card">

                    <div class="resident-summary-icon">
                        📋
                    </div>

                    <div>

                        <span>
                            Resident Reports
                        </span>

                        <strong>
                            ${totalResidentReports}
                        </strong>

                    </div>

                </div>


                <div class="resident-summary-card">

                    <div class="resident-summary-icon">
                        🟢
                    </div>

                    <div>

                        <span>
                            Registered Users
                        </span>

                        <strong>
                            ${totalResidents}
                        </strong>

                    </div>

                </div>

            </div>


            <div class="residents-toolbar">

                <div class="search-box">

                    <span class="search-icon">
                        🔎
                    </span>

                    <input
                        type="text"
                        id="searchResidents"
                        placeholder="Search residents..."
                    >

                </div>

            </div>


            <div
                id="residentsList"
                class="residents-list"
            ></div>

        `;


        renderResidentCards();


        const searchResidents =
            document.getElementById(
                "searchResidents"
            );


        if (searchResidents) {

            searchResidents.addEventListener(
                "input",
                renderResidentCards
            );

        }

    }


    /* =========================================================
       RENDER RESIDENT CARDS
    ========================================================== */

    function renderResidentCards() {

        const residentsList =
            document.getElementById(
                "residentsList"
            );


        if (!residentsList) {
            return;
        }


        const searchInput =
            document.getElementById(
                "searchResidents"
            );


        const searchTerm =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";


        const reportCounts = {};


        allReports.forEach(report => {

            if (!report.user_id) {
                return;
            }


            reportCounts[report.user_id] =
                (
                    reportCounts[report.user_id] ||
                    0
                ) + 1;

        });


        const filteredResidents =
            allResidents
                .filter(
                    resident =>
                        resident.role !== "admin"
                )
                .filter(resident => {

                    const searchableText = [

                        resident.full_name,
                        resident.phone,
                        resident.role

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return (
                        !searchTerm ||
                        searchableText.includes(
                            searchTerm
                        )
                    );

                });


        if (
            filteredResidents.length === 0
        ) {

            residentsList.innerHTML = `
                <div class="admin-empty">
                    No residents found.
                </div>
            `;

            return;
        }


        residentsList.innerHTML =
            filteredResidents
                .map(resident => {

                    const reportCount =
                        reportCounts[
                            resident.id
                        ] || 0;


                    const initials =
                        getInitials(
                            resident.full_name
                        );


                    return `

                        <div class="resident-card">

                            <div class="resident-avatar">
                                ${escapeHTML(
                                    initials
                                )}
                            </div>


                            <div class="resident-info">

                                <h3>
                                    ${escapeHTML(
                                        resident.full_name ||
                                        "Unnamed Resident"
                                    )}
                                </h3>

                                <p>
                                    📱
                                    ${escapeHTML(
                                        resident.phone ||
                                        "Phone not provided"
                                    )}
                                </p>

                                <p>
                                    👤 Resident
                                </p>

                            </div>


                            <div class="resident-stat">

                                <strong>
                                    ${reportCount}
                                </strong>

                                <span>
                                    Report${reportCount === 1
                                        ? ""
                                        : "s"}
                                </span>

                            </div>


                            <div class="resident-date">

                                <span>
                                    Registered
                                </span>

                                <strong>
                                    ${formatDate(
                                        resident.created_at
                                    )}
                                </strong>

                            </div>

                        </div>

                    `;

                })
                .join("");

    }


    /* =========================================================
       INITIALS
    ========================================================== */

    function getInitials(name) {

        if (!name) {
            return "?";
        }


        const words =
            name
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (words.length === 1) {

            return words[0]
                .substring(0, 2)
                .toUpperCase();

        }


        return (
            words[0][0] +
            words[words.length - 1][0]
        ).toUpperCase();

    }


    /* =========================================================
       SEARCH REPORTS
    ========================================================== */

    if (searchReports) {

        searchReports.addEventListener(
            "input",
            renderReports
        );

    }


    /* =========================================================
       STATUS FILTER
    ========================================================== */

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderReports
        );

    }


    /* =========================================================
       CLEAR FILTERS
    ========================================================== */

    if (clearFilters) {

        clearFilters.addEventListener(
            "click",
            function () {

                if (searchReports) {
                    searchReports.value = "";
                }


                if (statusFilter) {
                    statusFilter.value = "";
                }


                renderReports();

            }
        );

    }


    /* =========================================================
       INITIAL LOAD
    ========================================================== */
await loadOrganizations();
await loadAssignments();
await loadReports();
await loadResidents();
  


    /* =========================================================
       MAKE FUNCTIONS AVAILABLE
    ========================================================== */

    window.adminData = {

        getReports: function () {
            return allReports;
        },

        getResidents: function () {
            return allResidents;
        },

        refreshReports: loadReports,

        refreshResidents: loadResidents

    };

});
// Admin logout
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error("Logout error:", error);
            alert("Logout failed. Please try again.");
            return;
        }

        window.location.href = "login.html";
    });
}
// ======================================================
//// ======================================================
/// ======================================================
// ORGANIZATION FINDER
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const findOrganizationBtn =
        document.getElementById(
            "findOrganizationBtn"
        );

    if (!findOrganizationBtn) {
        return;
    }

    findOrganizationBtn.addEventListener(
        "click",
        async () => {

            const organizationType =
                document.getElementById(
                    "organizationType"
                )?.value;

            const county =
                document.getElementById(
                    "organizationCounty"
                )?.value;

            const message =
                document.getElementById(
                    "organizationMessage"
                );

            /* =================================================
               VALIDATION
            ================================================== */

            if (!organizationType) {

                if (message) {
                    message.textContent =
                        "Please select an organization type first.";

                    message.style.color =
                        "#dc2626";
                }

                return;
            }

            if (!county) {

                if (message) {
                    message.textContent =
                        "Please select a county first.";

                    message.style.color =
                        "#dc2626";
                }

                return;
            }

            /* =================================================
               START SEARCH
            ================================================== */

            findOrganizationBtn.disabled =
                true;

            findOrganizationBtn.textContent =
                "🔎 Finding organization...";

            if (message) {

                message.textContent =
                    `Finding ${organizationType} organization for ${county}...`;

                message.style.color =
                    "#2563eb";
            }

            try {

                /* =================================================
                   CALL SUPABASE EDGE FUNCTION
                ================================================== */

                const {
                    data,
                    error
                } =
                    await supabaseClient.functions.invoke(
                        "find-organization",
                        {
                            body: {
                                organizationType:
                                    organizationType,

                                county:
                                    county
                            }
                        }
                    );

                /* =================================================
                   HANDLE FUNCTION ERROR
                ================================================== */

                if (error) {

                    console.error(
                        "Organization function error:",
                        error
                    );

                    throw error;
                }

                console.log(
                    "Organization finder response:",
                    data
                );

                /* =================================================
                   NO ORGANIZATION FOUND
                ================================================== */

                if (
                    !data ||
                    data.found !== true ||
                    !data.organization
                ) {

                    if (message) {

                        message.innerHTML = `
                            <strong>
                                No organization found.
                            </strong>
                            <br><br>

                            We do not currently have a
                            trusted organization listed for
                            <strong>
                                ${escapeOrganizationFinderHTML(
                                    organizationType
                                )}
                            </strong>
                            in
                            <strong>
                                ${escapeOrganizationFinderHTML(
                                    county
                                )}
                            </strong>.
                            <br><br>

                            You can enter the organization
                            details manually.
                        `;

                        message.style.color =
                            "#9a6700";
                    }

                    return;
                }

                /* =================================================
                   ORGANIZATION FOUND
                ================================================== */

                const organization =
                    data.organization;

                console.log(
                    "Organization found:",
                    organization
                );

                /* =================================================
                   AUTO-FILL ORGANIZATION NAME
                ================================================== */

                const nameField =
                    document.getElementById(
                        "organizationName"
                    );

                if (nameField) {
                    nameField.value =
                        organization.name || "";
                }

                /* =================================================
                   AUTO-FILL DEPARTMENT
                ================================================== */

                const departmentField =
                    document.getElementById(
                        "organizationDepartment"
                    );

                if (departmentField) {
                    departmentField.value =
                        organization.department || "";
                }

                /* =================================================
                   AUTO-FILL PHONE
                ================================================== */

                const phoneField =
                    document.getElementById(
                        "organizationPhone"
                    );

                if (phoneField) {
                    phoneField.value =
                        organization.phone || "";
                }

                /* =================================================
                   AUTO-FILL EMAIL
                ================================================== */

                const emailField =
                    document.getElementById(
                        "organizationEmail"
                    );

                if (emailField) {
                    emailField.value =
                        organization.email || "";
                }

                /* =================================================
                   AUTO-FILL WEBSITE
                ================================================== */

                const websiteField =
                    document.getElementById(
                        "organizationWebsite"
                    );

                if (websiteField) {
                    websiteField.value =
                        organization.website || "";
                }

                /* =================================================
                   AUTO-FILL SOCIAL HANDLE
                ================================================== */

                const socialField =
                    document.getElementById(
                        "organizationSocial"
                    );

                if (socialField) {
                    socialField.value =
                        organization.social_handle || "";
                }

                /* =================================================
                   AUTO-FILL SERVICE AREA
                ================================================== */

                const serviceAreaField =
                    document.getElementById(
                        "organizationServiceArea"
                    );

                if (serviceAreaField) {
                    serviceAreaField.value =
                        organization.service_area || "";
                }

                /* =================================================
                   AUTO-FILL COUNTIES
                ================================================== */

                const countiesField =
                    document.getElementById(
                        "organizationCounties"
                    );

                if (countiesField) {
                    countiesField.value =
                        organization.counties || "";
                }

                /* =================================================
                   AUTO-FILL ADDRESS
                ================================================== */

                const addressField =
                    document.getElementById(
                        "organizationAddress"
                    );

                if (addressField) {
                    addressField.value =
                        organization.address || "";
                }

                /* =================================================
                   AUTO-FILL SERVICES
                ================================================== */

                const servicesField =
                    document.getElementById(
                        "organizationServices"
                    );

                if (servicesField) {
                    servicesField.value =
                        organization.services || "";
                }

                /* =================================================
                   AUTO-FILL NOTES
                ================================================== */

                const notesField =
                    document.getElementById(
                        "organizationNotes"
                    );

                if (notesField) {
                    notesField.value =
                        organization.notes || "";
                }

                /* =================================================
                   KEEP ORGANIZATION TYPE SELECTED
                ================================================== */

                const typeField =
                    document.getElementById(
                        "organizationType"
                    );

                if (typeField) {
                    typeField.value =
                        organization.type ||
                        organizationType;
                }

                /* =================================================
                   SET STATUS TO ACTIVE
                ================================================== */

                const statusField =
                    document.getElementById(
                        "organizationStatus"
                    );

                if (statusField) {
                    statusField.value =
                        "Active";
                }

                /* =================================================
                   SUCCESS MESSAGE
                ================================================== */

                if (message) {

                    message.innerHTML = `
                        <strong>
                            ✓ Organization found successfully!
                        </strong>

                        <br><br>

                        <strong>
                            ${escapeOrganizationFinderHTML(
                                organization.name
                            )}
                        </strong>

                        <br><br>

                        The organization details have been
                        automatically filled into the form.

                        <br><br>

                        <strong>
                            Please review the information
                            before saving.
                        </strong>
                    `;

                    message.style.color =
                        "#166534";
                }

                /* =================================================
                   SCROLL TO ORGANIZATION NAME
                ================================================== */

                if (nameField) {

                    nameField.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }

            } catch (error) {

                console.error(
                    "Organization lookup failed:",
                    error
                );

                if (message) {

                    message.innerHTML = `
                        <strong>
                            Organization lookup failed.
                        </strong>

                        <br><br>

                        ${escapeOrganizationFinderHTML(
                            error.message ||
                            "Unknown error"
                        )}
                    `;

                    message.style.color =
                        "#dc2626";
                }

            } finally {

                /* =================================================
                   RESTORE BUTTON
                ================================================== */

                findOrganizationBtn.disabled =
                    false;

                findOrganizationBtn.textContent =
                    "🔎 Find Organization";
            }
        }
    );
});


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeOrganizationFinderHTML(
    value
) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}