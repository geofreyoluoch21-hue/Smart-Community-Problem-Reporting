document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       SETTINGS ELEMENTS
    ========================================== */

    const themeSetting =
        document.getElementById("themeSetting");

    const sidebarSetting =
        document.getElementById("sidebarSetting");

    const densitySetting =
        document.getElementById("densitySetting");

    const showStatsSetting =
        document.getElementById("showStatsSetting");

    const showRecentSetting =
        document.getElementById("showRecentSetting");

    const reportNotificationSetting =
        document.getElementById("reportNotificationSetting");

    const statusNotificationSetting =
        document.getElementById("statusNotificationSetting");

    const autoRefreshSetting =
        document.getElementById("autoRefreshSetting");

    const saveSettingsBtn =
        document.getElementById("saveSettingsBtn");

    const settingsMessage =
        document.getElementById("settingsMessage");

    const adminSidebar =
        document.getElementById("adminSidebar");

    const statsGrid =
        document.querySelector(".stats-grid");

    const recentReports =
        document.querySelector(".admin-dashboard-recent");


    /* =========================================
       DEFAULT SETTINGS
    ========================================== */

    const defaultSettings = {

        theme: "light",

        sidebar: "expanded",

        density: "comfortable",

        showStats: true,

        showRecent: true,

        reportNotifications: true,

        statusNotifications: true,

        autoRefresh: false

    };


    /* =========================================
       LOAD SAVED SETTINGS
    ========================================== */

    function loadSettings() {

        const savedSettings =
            localStorage.getItem(
                "smartCommunityAdminSettings"
            );


        if (!savedSettings) {

            return defaultSettings;

        }


        try {

            return {
                ...defaultSettings,
                ...JSON.parse(savedSettings)
            };

        } catch (error) {

            console.error(
                "Unable to load settings:",
                error
            );

            return defaultSettings;

        }

    }


    /* =========================================
       APPLY SETTINGS
    ========================================== */

    function applySettings(settings) {

        /* Theme */

        document.body.classList.remove(
            "admin-light-theme",
            "admin-dark-theme"
        );


        if (settings.theme === "dark") {

            document.body.classList.add(
                "admin-dark-theme"
            );

        } else {

            document.body.classList.add(
                "admin-light-theme"
            );

        }


        /* Sidebar */

        if (adminSidebar) {

            adminSidebar.classList.remove(
                "sidebar-collapsed"
            );


            if (
                settings.sidebar === "collapsed"
            ) {

                adminSidebar.classList.add(
                    "sidebar-collapsed"
                );

            }

        }


        /* Density */

        document.body.classList.remove(
            "admin-compact",
            "admin-comfortable"
        );


        if (
            settings.density === "compact"
        ) {

            document.body.classList.add(
                "admin-compact"
            );

        } else {

            document.body.classList.add(
                "admin-comfortable"
            );

        }


        /* Statistics */

        if (statsGrid) {

            statsGrid.style.display =
                settings.showStats
                    ? ""
                    : "none";

        }


        /* Recent Reports */

        if (recentReports) {

            recentReports.style.display =
                settings.showRecent
                    ? ""
                    : "none";

        }

    }


    /* =========================================
       PUT SETTINGS INTO CONTROLS
    ========================================== */

    function populateControls(settings) {

        if (themeSetting) {

            themeSetting.value =
                settings.theme;

        }


        if (sidebarSetting) {

            sidebarSetting.value =
                settings.sidebar;

        }


        if (densitySetting) {

            densitySetting.value =
                settings.density;

        }


        if (showStatsSetting) {

            showStatsSetting.checked =
                settings.showStats;

        }


        if (showRecentSetting) {

            showRecentSetting.checked =
                settings.showRecent;

        }


        if (reportNotificationSetting) {

            reportNotificationSetting.checked =
                settings.reportNotifications;

        }


        if (statusNotificationSetting) {

            statusNotificationSetting.checked =
                settings.statusNotifications;

        }


        if (autoRefreshSetting) {

            autoRefreshSetting.checked =
                settings.autoRefresh;

        }

    }


    /* =========================================
       GET SETTINGS FROM CONTROLS
    ========================================== */

    function getSettingsFromControls() {

        return {

            theme:
                themeSetting
                    ? themeSetting.value
                    : "light",

            sidebar:
                sidebarSetting
                    ? sidebarSetting.value
                    : "expanded",

            density:
                densitySetting
                    ? densitySetting.value
                    : "comfortable",

            showStats:
                showStatsSetting
                    ? showStatsSetting.checked
                    : true,

            showRecent:
                showRecentSetting
                    ? showRecentSetting.checked
                    : true,

            reportNotifications:
                reportNotificationSetting
                    ? reportNotificationSetting.checked
                    : true,

            statusNotifications:
                statusNotificationSetting
                    ? statusNotificationSetting.checked
                    : true,

            autoRefresh:
                autoRefreshSetting
                    ? autoRefreshSetting.checked
                    : false

        };

    }


    /* =========================================
       SAVE SETTINGS
    ========================================== */

    function saveSettings() {

        const settings =
            getSettingsFromControls();


        localStorage.setItem(
            "smartCommunityAdminSettings",
            JSON.stringify(settings)
        );


        applySettings(settings);


        if (settingsMessage) {

            settingsMessage.textContent =
                "✓ Settings saved successfully.";

            settingsMessage.classList.add(
                "success"
            );


            setTimeout(function () {

                settingsMessage.textContent = "";

                settingsMessage.classList.remove(
                    "success"
                );

            }, 3000);

        }

    }


    /* =========================================
       LIVE THEME PREVIEW
    ========================================== */

    if (themeSetting) {

        themeSetting.addEventListener(
            "change",
            function () {

                const settings =
                    getSettingsFromControls();

                applySettings(settings);

            }
        );

    }


    /* =========================================
       LIVE SIDEBAR PREVIEW
    ========================================== */

    if (sidebarSetting) {

        sidebarSetting.addEventListener(
            "change",
            function () {

                const settings =
                    getSettingsFromControls();

                applySettings(settings);

            }
        );

    }


    /* =========================================
       LIVE DENSITY PREVIEW
    ========================================== */

    if (densitySetting) {

        densitySetting.addEventListener(
            "change",
            function () {

                const settings =
                    getSettingsFromControls();

                applySettings(settings);

            }
        );

    }


    /* =========================================
       LIVE STATISTICS PREVIEW
    ========================================== */

    if (showStatsSetting) {

        showStatsSetting.addEventListener(
            "change",
            function () {

                const settings =
                    getSettingsFromControls();

                applySettings(settings);

            }
        );

    }


    /* =========================================
       LIVE RECENT REPORTS PREVIEW
    ========================================== */

    if (showRecentSetting) {

        showRecentSetting.addEventListener(
            "change",
            function () {

                const settings =
                    getSettingsFromControls();

                applySettings(settings);

            }
        );

    }


    /* =========================================
       SAVE BUTTON
    ========================================== */

    if (saveSettingsBtn) {

        saveSettingsBtn.addEventListener(
            "click",
            saveSettings
        );

    }


    /* =========================================
       INITIALIZE
    ========================================== */

    const settings =
        loadSettings();


    populateControls(settings);

    applySettings(settings);

});