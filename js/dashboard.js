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

        // Get user's reports
        const {
            data: reports,
            error: reportsError
        } = await supabaseClient
            .from("reports")
            .select("status")
            .eq("user_id", user.id);

        if (reportsError) {
            throw reportsError;
        }

        const userReports = reports || [];

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

    } catch (error) {

        console.error("Dashboard error:", error);

        userEmail.textContent =
            "Error loading account: " + error.message;
    }
}


// ============================================
// LOGOUT
// ============================================

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {

    logoutButton.addEventListener("click", async function () {

        logoutButton.disabled = true;
        logoutButton.textContent = "Logging out...";

        const { error } = await supabaseClient.auth.signOut();

        if (error) {

            console.error(error);

            const message =
                document.getElementById("dashboardMessage");

            message.textContent =
                "Logout failed: " + error.message;

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