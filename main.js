// ========================================================================================
// MAIN.JS -
// ========================================================================================

// External libs
include(fb.ComponentPath + 'LM\\code\\includes\\lodash.min.js');
include(fb.ComponentPath + 'LM\\code\\includes\\helpers.js');

// Data / utils
include(fb.ComponentPath + 'LM\\code\\includes\\rightclick_menu.js');
include(fb.ComponentPath + 'LM\\code\\includes\\albumart.js');
include(fb.ComponentPath + 'LM\\code\\includes\\data_manager.js');

// Panels
include(fb.ComponentPath + 'LM\\code\\scripts\\top_panel.js');   // <— top panel
include(fb.ComponentPath + 'LM\\code\\scripts\\left_panel.js');
include(fb.ComponentPath + 'LM\\code\\scripts\\middle_panel.js');
include(fb.ComponentPath + 'LM\\code\\scripts\\bottom_panel.js');

console.log('✅ includes:                                    READY');

// ========================================================================================
// IMPROVED TITLEFORMAT MANAGER
// ========================================================================================



// ========================================================================================
// MAIN APP WITH DATA MANAGER INTEGRATION
// ========================================================================================

var MainApp = {
    initialized: false,
    panelSizes: {}, uiColors: {}, uiFont: {},

    init: function () {
        if (this.initialized) return;
        try {
            //TitleFormatManager.init();
            DataManager.init();
            console.log('✅ DataManager:                          READY');

            this.setupColors();
            this.setupFonts();
            this.calculateLayout();

            // 🔸 make globals visible to panel modules BEFORE initializing them
            panelSizes = this.panelSizes;
            uiColors   = this.uiColors;
            uiFont     = this.uiFont;

            // Initialize panels
            if (typeof initializeLeftPanel === 'function')   initializeLeftPanel(this.panelSizes);
            if (typeof initializeBottomPanel === 'function') initializeBottomPanel(this.panelSizes);
            if (typeof initializeTopPanel === 'function')    initializeTopPanel(this.panelSizes);

            this.initialized = true;
            console.log('✅ Main App - Initialized = READY ');
        } catch (e) {
            console.log('❌ Main App init error:', e.message);
        }
    },

    setupColors: function () {
        this.uiColors = {
            background: _RGB(45, 45, 45),
            background_left: _RGB(35, 35, 35),
            background_middle: _RGB(40, 40, 40),
            background_top: _RGB(30, 30, 30),
            background_bottom: _RGB(30, 30, 30),
            primaryText: _RGB(220, 220, 220),
            secondaryText: _RGB(160, 160, 160),
            highlight: _RGB(75, 110, 175),
            primary: _RGB(100, 149, 237),
            accent: _RGB(255, 165, 0)
        };
        console.log(' uiColors:                                         Ready');
    },

    setupFonts: function () {
        this.uiFont = {
            default: gdi.Font('Segoe UI', 12, 0),
            bold:    gdi.Font('Segoe UI', 12, 1),
            large:   gdi.Font('Segoe UI', 14, 0),
            small:   gdi.Font('Segoe UI', 10, 0),
            seekbar_dur: gdi.Font('Segoe UI', 12, 0)
        };
        console.log(' uiFont:                                            Ready');
    },

    calculateLayout: function () {
        var totalWidth = window.Width;
        var totalHeight = window.Height;
        var TOP_H = 150;
        var BOT_H = 150;

        this.panelSizes = {
            // TOP
            topPanel_X: 0,
            topPanel_Y: 0,
            topPanel_W: totalWidth,
            topPanel_H: TOP_H,
            topPanel_center_X: Math.floor(totalWidth / 2),
            topPanel_center_Y: Math.floor(TOP_H / 2),

            // LEFT / MIDDLE / RIGHT
            leftPanel_X: 0,
            leftPanel_Y: TOP_H,
            leftPanel_W: Math.floor(totalWidth * 0.3),
            leftPanel_H: totalHeight - TOP_H - BOT_H,

            midPanel_X: Math.floor(totalWidth * 0.3),
            midPanel_Y: TOP_H,
            midPanel_W: Math.floor(totalWidth * 0.4),
            midPanel_H: totalHeight - TOP_H - BOT_H,

            rightPanel_X: Math.floor(totalWidth * 0.7),
            rightPanel_Y: TOP_H,
            rightPanel_W: totalWidth - Math.floor(totalWidth * 0.7),
            rightPanel_H: totalHeight - TOP_H - BOT_H,

            // BOTTOM
            botPanel_X: 0,
            botPanel_Y: totalHeight - BOT_H,
            botPanel_W: totalWidth,
            botPanel_H: BOT_H
        };

        
        console.log(' panelSizes:                                     Ready');
    }
};

// Legacy globals (compat)
var currentPlayingTrack = null;
var currentSelectedTrack = null;
var panelSizes = {};
var uiColors = {};
var uiFont = {};

// ========================================================================================
// EVENT HANDLERS
// ========================================================================================

function on_paint(gr) {
    if (!MainApp.initialized) MainApp.init();

    // Keep globals in sync
    panelSizes = MainApp.panelSizes;
    uiColors   = MainApp.uiColors;
    uiFont     = MainApp.uiFont;

    try {
        if (typeof paintTopPanelContent === 'function')    paintTopPanelContent(gr, panelSizes, uiFont, uiColors);
        if (typeof paintLeftPanelContent === 'function')   paintLeftPanelContent(gr, panelSizes, uiFont, uiColors);
        if (typeof paintMiddlePanelContent === 'function') paintMiddlePanelContent(gr, panelSizes, uiFont, uiColors);
        if (typeof paintBottomPanelContent === 'function') paintBottomPanelContent(gr, panelSizes, uiFont, uiColors);
    } catch (e) {
        console.log('❌ Paint error:', e.message);
    }
}

function on_size() {
    if (MainApp.initialized) {
        MainApp.calculateLayout();

        // 🔸 sync globals before telling panels to update layout
        panelSizes = MainApp.panelSizes;
        uiColors   = MainApp.uiColors;
        uiFont     = MainApp.uiFont;

        if (typeof updateTopPanelLayout === 'function')    updateTopPanelLayout(MainApp.panelSizes);
        if (typeof updateLeftPanelLayout === 'function')   updateLeftPanelLayout(MainApp.panelSizes);
        if (typeof updateBottomPanelComponents === 'function') updateBottomPanelComponents(MainApp.panelSizes);
    }
}

function on_playback_new_track(metadb) {
    DataManager.onTrackChange(metadb);
    if (metadb) DataManager.updateCurrent(metadb);
    else        DataManager.clearCurrent();

    currentPlayingTrack = metadb;
    currentSelectedTrack = DataManager.getCurrentTrack();
    window.Repaint();
}

function on_playback_stop() {
    if (typeof updatePlayPauseButton === 'function') updatePlayPauseButton();
    if (typeof bottomPanel_on_playback_stop === 'function') bottomPanel_on_playback_stop();
}
function on_playback_order_changed(new_order_index) {
    if (typeof topPanel_on_playback_order_changed === 'function')
        topPanel_on_playback_order_changed(new_order_index);
}
function on_playback_pause() {
    if (typeof updatePlayPauseButton === 'function') updatePlayPauseButton();
}
function on_playback_starting() {
    if (typeof updatePlayPauseButton === 'function') updatePlayPauseButton();
}
function on_playback_seek() {
    if (typeof bottomPanel_on_playback_seek === 'function') bottomPanel_on_playback_seek();
}
function on_volume_change() {
    if (typeof bottomPanel_on_volume_change === 'function') bottomPanel_on_volume_change();
}

// MOUSE
function on_mouse_move(x, y) {
    if (typeof topPanel_on_mouse_move === 'function') topPanel_on_mouse_move(x, y);
    if (typeof leftPanelState !== 'undefined' && leftPanelState) { leftPanelState.mouseX = x; leftPanelState.mouseY = y; }
    if (typeof middlePanel_on_mouse_move === 'function') middlePanel_on_mouse_move(x, y);
    if (typeof bottomPanel_on_mouse_move === 'function') bottomPanel_on_mouse_move(x, y);
}
function on_mouse_lbtn_down(x, y) {
    if (typeof bottomPanel_on_mouse_lbtn_down === 'function') { if (bottomPanel_on_mouse_lbtn_down(x, y)) return; }
}
function on_mouse_lbtn_up(x, y) {
    if (typeof topPanel_on_mouse_lbtn_up === 'function') { if (topPanel_on_mouse_lbtn_up(x, y)) return; }
    if (typeof middlePanel_on_mouse_lbtn_up === 'function') { if (middlePanel_on_mouse_lbtn_up(x, y)) return; }
    if (typeof bottomPanel_on_mouse_lbtn_up === 'function') { if (bottomPanel_on_mouse_lbtn_up(x, y)) return; }
    if (typeof leftPanel_onMouseClick === 'function') leftPanel_onMouseClick(x, y);
}
function on_mouse_lbtn_dblclk(x, y) {
    if (typeof middlePanel_on_mouse_lbtn_dblclk === 'function') { if (middlePanel_on_mouse_lbtn_dblclk(x, y)) return; }
}
function on_mouse_rbtn_up(x, y) {
    if (typeof topPanel_onRightClick === 'function') { if (topPanel_onRightClick(x, y)) return; }
    if (typeof middlePanel_on_mouse_rbtn_up === 'function') { if (middlePanel_on_mouse_rbtn_up(x, y)) return; }
    if (typeof bottomPanel_on_mouse_rbtn_up === 'function') { if (bottomPanel_on_mouse_rbtn_up(x, y)) return; }
    if (typeof showRightClickMenu === 'function') { showRightClickMenu(x, y); }
}
function on_mouse_wheel(x, y, delta) {
    if (typeof middlePanel_on_mouse_wheel === 'function') { if (middlePanel_on_mouse_wheel(delta)) return; }
    if (typeof leftPanel_onMouseWheel === 'function') { if (leftPanel_onMouseWheel(x, y, delta)) return; }
    if (typeof bottomPanel_on_mouse_wheel === 'function') { bottomPanel_on_mouse_wheel(delta); }
}
function on_mouse_leave() {
    if (typeof topPanel_on_mouse_leave === 'function') topPanel_on_mouse_leave();
}

// ========================================================================================
// DATA MANAGER INTEGRATION HELPERS
// ========================================================================================

function snapToPlayingTrack() { DataManager.snapToPlaying(); window.Repaint(); console.log(' Snapped back to playing track'); }
function getCurrentMode()     { return DataManager.mode; }
function getCurrentTrackInfo(){ return DataManager.getTrackInfo(); }

// ========================================================================================
// INITIALIZATION
// ========================================================================================

MainApp.init();
console.log('✅ Main module - ready');
