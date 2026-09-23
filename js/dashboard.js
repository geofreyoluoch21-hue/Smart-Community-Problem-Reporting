// ============================================
// RESIDENT DASHBOARD
// ============================================

async function loadDashboard() {

    const userEmail = document.getElementById("userEmail");

    try {

        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            window.location.href = "login.html";
            return;
        }

        // Display logged-in email
        userEmail.textContent = "Logged in as: " + user.email;


        // ============================================
        // GET USER'S REPORTS
        // ============================================

        const {
            data: reports,
            error: reportsError
        } = await supabaseClient
            .from("reports")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (reportsError) {
            throw reportsError;
        }

        const userReports = reports || [];


        // ============================================
        // DASHBOARD STATISTICS
        // ============================================

        // Total Reports
        document.getElementById("totalReports").textContent =
            userReports.length;

        // Submitted
        document.getElementById("submittedReports").textContent =
            userReports.filter(function (report) {
                return report.status === "Submitted";
            }).length;

        // Under Review
        document.getElementById("underReviewReports").textContent =
            userReports.filter(function (report) {
                return report.status === "Under Review";
            }).length;

        // In Progress
        document.getElementById("inProgressReports").textContent =
            userReports.filter(function (report) {
                return report.status === "In Progress";
            }).length;

        // Resolved
        document.getElementById("resolvedReports").textContent =
            userReports.filter(function (report) {
                return report.status === "Resolved";
            }).length;

        // Rejected
        document.getElementById("rejectedReports").textContent =
            userReports.filter(function (report) {
                return report.status === "Rejected";
            }).length;


        // ============================================
        // RECENT REPORTS
        // ============================================

        displayRecentReports(userReports);

    } catch (error) {

        console.error("Dashboard error:", error);

        userEmail.textContent =
            "Error loading account: " + error.message;
    }
}


// ============================================
// DISPLAY RECENT REPORTS
// ============================================

function displayRecentReports(reports) {

    const recentReportsContainer =
        document.getElementById("recentReports");

    // If the HTML section doesn't exist yet
    if (!recentReportsContainer) {
        return;
    }

    // No reports
    if (!reports || reports.length === 0) {

        recentReportsContainer.innerHTML = `
            <div class="recent-empty">
                <div class="recent-empty-icon">📋</div>
                <h3>No Reports Yet</h3>
                <p>You haven't submitted any community reports yet.</p>
                <a href="report.html" class="dashboard-action-btn">
                    Report a Problem
                </a>
            </div>
        `;

        return;
    }


    // Show only the 5 most recent reports
    const recentReports = reports.slice(0, 5);

    recentReportsContainer.innerHTML = recentReports.map(function (report) {

        const reportDate = report.created_at
            ? new Date(report.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            })
            : "Date unavailable";

        const status = report.status || "Submitted";

        const statusClass = status
            .toLowerCase()
            .replace(/\s+/g, "-");

        return `
            <div class="recent-report-card">

                <div class="recent-report-main">

                    <div class="recent-report-icon">
                        📍
                    </div>

                    <div class="recent-report-info">

                        <h3>
                            ${escapeHtml(report.title || "Untitled Report")}
                        </h3>

                        <p class="recent-report-category">
                            ${escapeHtml(report.category || "Other")}
                        </p>

                        <p class="recent-report-location">
                            📍 ${escapeHtml(report.location || "Location not provided")}
                        </p>

                    </div>

                </div>

                <div class="recent-report-meta">

                    <span class="recent-report-status status-${statusClass}">
                        ${escapeHtml(status)}
                    </span>

                    <span class="recent-report-date">
                        ${reportDate}
                    </span>

                </div>

            </div>
        `;

    }).join("");
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


// ============================================
// LOGOUT
// ============================================

const logoutButton =
    document.getElementById("logoutButton");

if (logoutButton) {

    logoutButton.addEventListener("click", async function () {

        logoutButton.disabled = true;
        logoutButton.textContent = "Logging out...";

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {

            console.error(error);

            const message =
                document.getElementById("dashboardMessage");

            if (message) {

                message.textContent =
                    "Logout failed: " + error.message;
            }

            logoutButton.disabled = false;
            logoutButton.textContent = "Logout";

            return;
        }

        window.location.href = "login.html";
    });
}


// ============================================
// START DASHBOARD
// ============================================

loadDashboard();