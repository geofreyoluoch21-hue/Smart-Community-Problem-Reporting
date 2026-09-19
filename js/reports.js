// ============================================
// MY REPORTS
// ============================================

const reportsContainer =
    document.getElementById("reportsContainer");


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
// STATUS CLASS
// ============================================

function getStatusClass(status) {

    switch (status) {

        case "Submitted":
            return "status-submitted";

        case "Under Review":
            return "status-review";

        case "In Progress":
            return "status-progress";

        case "Resolved":
            return "status-resolved";

        case "Rejected":
            return "status-rejected";

        default:
            return "status-submitted";
    }
}


// ============================================
// LOAD USER REPORTS
// ============================================

async function loadMyReports() {

    try {

        // CHECK LOGIN

        const {
            data: { user },
            error: userError
        } = await supabaseClient
            .auth
            .getUser();


        if (userError || !user) {

            window.location.href = "login.html";

            return;
        }


        // LOAD REPORTS

        const {
            data: reports,
            error: reportsError
        } = await supabaseClient
            .from("reports")
            .select("*")
            .eq("user_id", user.id)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (reportsError) {
            throw reportsError;
        }


        // NO REPORTS

        if (!reports || reports.length === 0) {

            reportsContainer.innerHTML = `

                <div class="empty-state">

                    <h2>
                        No Reports Yet
                    </h2>

                    <p>
                        You have not submitted
                        any community problem reports.
                    </p>

                    <a
                        href="report.html"
                        class="report-link-button"
                    >
                        Report a Problem
                    </a>

                </div>

            `;

            return;
        }


        // CLEAR CONTAINER

        reportsContainer.innerHTML = "";


        // DISPLAY EACH REPORT

        reports.forEach(function (report) {

            const card =
                document.createElement("div");

            card.className =
                "report-card";


            // STATUS

            const status =
                report.status || "Submitted";

            const statusClass =
                getStatusClass(status);


            // DATES

            const createdDate =
                report.created_at
                    ? new Date(
                        report.created_at
                    ).toLocaleString()
                    : "Unknown";


            const updatedDate =
                report.updated_at
                    ? new Date(
                        report.updated_at
                    ).toLocaleString()
                    : "Not updated";


            // PHOTO

            let photoHtml = "";


            if (report.image_url) {

                photoHtml = `

                    <div>

                        <p>
                            <strong>
                                Uploaded Photo:
                            </strong>
                        </p>

                        <img
                            src="${escapeHtml(report.image_url)}"
                            alt="Report photo"
                            class="report-photo"
                        >

                    </div>

                `;
            }


            // COORDINATES

            let coordinatesHtml = "";


            if (
                report.latitude !== null &&
                report.longitude !== null
            ) {

                coordinatesHtml = `

                    <p class="coordinates">

                        <strong>
                            Coordinates:
                        </strong>

                        ${escapeHtml(report.latitude)},
                        ${escapeHtml(report.longitude)}

                    </p>

                `;

            } else {

                coordinatesHtml = `

                    <p class="coordinates">

                        <strong>
                            Coordinates:
                        </strong>

                        Not provided

                    </p>

                `;
            }


            // REPORT CARD HTML

            card.innerHTML = `

                <div class="report-header">

                    <h2>
                        ${escapeHtml(report.title)}
                    </h2>

                    <span
                        class="status-badge ${statusClass}"
                    >
                        ${escapeHtml(status)}
                    </span>

                </div>


                <div class="report-details">

                    <p>

                        <strong>
                            Description:
                        </strong>

                        <br>

                        ${escapeHtml(report.description)}

                    </p>


                    <p>

                        <strong>
                            Category:
                        </strong>

                        ${escapeHtml(report.category)}

                    </p>


                    <p>

                        <strong>
                            Location:
                        </strong>

                        ${escapeHtml(report.location)}

                    </p>


                    <p>

                        <strong>
                            Date Submitted:
                        </strong>

                        ${escapeHtml(createdDate)}

                    </p>


                    <p>

                        <strong>
                            Last Updated:
                        </strong>

                        ${escapeHtml(updatedDate)}

                    </p>


                    ${coordinatesHtml}

                </div>


                ${photoHtml}

            `;


            reportsContainer.appendChild(card);

        });

    }

    catch (error) {

        console.error(error);


        reportsContainer.innerHTML = `

            <div class="empty-state">

                <h2>
                    Unable to Load Reports
                </h2>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>

        `;

    }
}


// ============================================
// START
// ============================================

loadMyReports();