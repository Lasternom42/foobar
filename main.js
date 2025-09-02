// ========================================================================================
// 🎯 MAIN.JS - 
// ========================================================================================

// External libs
include(fb.ComponentPath + 'LM\\code\\includes\\lodash.min.js');
include(fb.ComponentPath + 'LM\\code\\includes\\helpers.js');

// Data / utils
include(fb.ComponentPath + 'LM\\code\\includes\\rightclick_menu.js');
include(fb.ComponentPath + 'LM\\code\\includes\\albumart.js');
include(fb.ComponentPath + 'LM\\code\\includes\\data_manager.js');



// Panels
include(fb.ComponentPath + 'LM\\code\\scripts\\top_panel.js');    // <— top panel
include(fb.ComponentPath + 'LM\\code\\scripts\\left_panel.js');
include(fb.ComponentPath + 'LM\\code\\scripts\\middle_panel.js');
include(fb.ComponentPath + 'LM\\code\\scripts\\bottom_panel.js');

console.log("✅ includes:                                    READY");       

// ========================================================================================
// 🔹 IMPROVED TITLEFORMAT MANAGER
// ========================================================================================


var TitleFormatManager = {
    formats: {
        artist: null,
        albumartist: null,
        title: null,
        album: null,
        date: null,
        tracknumber: null,
        discnumber: null,
        totaltracks: null,
        length: null,
        playback_time: null,
        rating: null,
        genre: null
    },
    
    current: {
        artist: 'Unknown Artist',
        albumartist: 'Unknown Artist', 
        title: 'Untitled',
        album: 'Unknown Album',
        date: '',
        year: '',
        tracknumber: '',
        discnumber: '1',
        totaltracks: '',
        length: '0:00',
        playback_time: '0:00',
        rating: '',
        genre: '',
        path: ''
    },
    
    initialized: false,
    
    init: function() {
        if (this.initialized) return;
        
        try {
            this.formats.artist = fb.TitleFormat('%artist%');
            this.formats.albumartist = fb.TitleFormat('%albumartist%');
            this.formats.title = fb.TitleFormat('%title%');
            this.formats.album = fb.TitleFormat('%album%');
            this.formats.date = fb.TitleFormat('%date%');
            this.formats.tracknumber = fb.TitleFormat('%tracknumber%');
            this.formats.discnumber = fb.TitleFormat('%discnumber%');
            this.formats.totaltracks = fb.TitleFormat('%totaltracks%');
            this.formats.length = fb.TitleFormat('%length%');
            this.formats.playback_time = fb.TitleFormat('%playback_time%');
            this.formats.rating = fb.TitleFormat('%rating%');
            this.formats.genre = fb.TitleFormat('%genre%');
            
            this.initialized = true;
            //console.log("✅ TitleFormat Manager Initialized");
        } catch (e) {
            console.log("❌ TitleFormat Manager init error:", e.message);
        }
    },
    
    getInfo: function(metadb) {
        if (!this.initialized) this.init();
        
        if (!metadb) {
            return this.getEmptyInfo();
        }
        
        try {
            return {
                artist: this.formats.artist.EvalWithMetadb(metadb) || 'Unknown Artist',
                albumartist: this.formats.albumartist.EvalWithMetadb(metadb) || 'Unknown Artist',
                title: this.formats.title.EvalWithMetadb(metadb) || 'Untitled',
                album: this.formats.album.EvalWithMetadb(metadb) || 'Unknown Album',
                date: this.formats.date.EvalWithMetadb(metadb) || '',
                year: this.formats.date.EvalWithMetadb(metadb) || '',
                tracknumber: this.formats.tracknumber.EvalWithMetadb(metadb) || '',
                discnumber: this.formats.discnumber.EvalWithMetadb(metadb) || '1',
                totaltracks: this.formats.totaltracks.EvalWithMetadb(metadb) || '',
                length: this.formats.length.EvalWithMetadb(metadb) || '0:00',
                rating: this.formats.rating.EvalWithMetadb(metadb) || '',
                genre: this.formats.genre.EvalWithMetadb(metadb) || '',
                path: metadb.Path || ''
            };
        } catch (e) {
            console.log("❌ Error getting metadb info:", e.message);
            return this.getEmptyInfo();
        }
    },
    
    getEmptyInfo: function() {
        return {
            artist: 'Unknown Artist',
            albumartist: 'Unknown Artist',
            title: 'Untitled',
            album: 'Unknown Album',
            date: '',
            year: '',
            tracknumber: '',
            discnumber: '1',
            totaltracks: '',
            length: '0:00',
            rating: '',
            genre: '',
            path: ''
        };
    },
    
    updateCurrent: function(metadb) {
        var info = this.getInfo(metadb);
        for (var key in info) {
            if (info.hasOwnProperty(key)) {
                this.current[key] = info[key];
            }
        }
        
        try {
            this.current.playback_time = this.formats.playback_time.Eval() || '0:00';
        } catch (e) {
            this.current.playback_time = '0:00';
        }
    },
    
    clearCurrent: function() {
        var empty = this.getEmptyInfo();
        for (var key in empty) {
            if (empty.hasOwnProperty(key)) {
                this.current[key] = empty[key];
            }
        }
        this.current.playback_time = '0:00';
    }
};

// ========================================================================================
// 🔹 MAIN APP WITH DATA MANAGER INTEGRATION
// ========================================================================================

var MainApp = {
    initialized: false,
    
    // UI State
    panelSizes: {},
    uiColors: {},
    uiFont: {},
    
    init: function() {
        if (this.initialized) return;
        
        try {
            TitleFormatManager.init();
            
            
            DataManager.init();
            console.log("✅ DataManager:                          READY");
            this.setupColors();
            this.setupFonts();
            this.calculateLayout();
            
            // Initialize panels
            if (typeof initializeLeftPanel === 'function') {
                initializeLeftPanel(this.panelSizes);
            }
            
            if (typeof initializeBottomPanel === 'function') {
                initializeBottomPanel(this.panelSizes);
            }
            
            if (typeof initializeTopPanel === 'function') {
                initializeTopPanel(this.panelSizes);   
            }
            
            
            this.initialized = true;
            console.log("✅ Main App - Initialized = READY ");
        } catch (e) {
            console.log("❌ Main App init error:", e.message);
        }
    },
    
    setupColors: function() {
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
        console.log("    uiColors:                                      Ready");
    },
    
    setupFonts: function() {
        this.uiFont = {
            default: gdi.Font('Segoe UI', 12, 0),
            bold: gdi.Font('Segoe UI', 12, 1),
            large: gdi.Font('Segoe UI', 14, 0),
            small: gdi.Font('Segoe UI', 10, 0),
            seekbar_dur: gdi.Font('Segoe UI', 12, 0) 
        };
        console.log("    uiFont:                                         Ready");
    },
    
    calculateLayout: function() {
    var totalWidth  = window.Width;
    var totalHeight = window.Height;

    var TOP_H = 150;      // top panel height
    var BOT_H = 150;      // bottom panel height (existing)

    this.panelSizes = {
        // TOP
        topPanel_X: 0,
        topPanel_Y: 0,
        topPanel_W: totalWidth,
        topPanel_H: TOP_H,
        topPanel_center_X: Math.floor(totalWidth / 2),
        topPanel_center_Y: Math.floor(TOP_H / 2),

        // LEFT / MIDDLE / RIGHT share the center band
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
         console.log('layout centers:', MainApp.panelSizes.topPanel_center_X, MainApp.panelSizes.topPanel_center_Y);
    console.log("    panelSizes:                                  Ready");
    }
    
};

// Legacy global variables (for compatibility)
var currentPlayingTrack = null;
var currentSelectedTrack = null;
var panelSizes = {};
var uiColors = {};
var uiFont = {};

// ========================================================================================
// 🔹 EVENT HANDLERS WITH DATA MANAGER INTEGRATION
// ========================================================================================

function on_paint(gr) {
    if (!MainApp.initialized) {
        MainApp.init();
    }
    // Update legacy globals (for compatibility)
    panelSizes = MainApp.panelSizes;
    uiColors = MainApp.uiColors;
    uiFont = MainApp.uiFont;
    
    try {
        // Paint all panels
        if (typeof paintTopPanelContent === 'function') {
            paintTopPanelContent(gr, panelSizes, uiFont, uiColors);   // <-- ADD
        }

        if (typeof paintLeftPanelContent === 'function') {
            paintLeftPanelContent(gr, panelSizes, uiFont, uiColors);
        }
        
        if (typeof paintMiddlePanelContent === 'function') {
            paintMiddlePanelContent(gr, panelSizes, uiFont, uiColors);
        }
        
        if (typeof paintBottomPanelContent === 'function') {
            paintBottomPanelContent(gr, panelSizes, uiFont, uiColors);
        }
        
    } catch (e) {
        console.log("❌ Paint error:", e.message);
    }
}

function on_size() {
    if (MainApp.initialized) {
        MainApp.calculateLayout();
        
        if (typeof updateTopPanelLayout === 'function') {
            updateTopPanelLayout(MainApp.panelSizes);   
        }

        if (typeof updateLeftPanelLayout === 'function') {
            updateLeftPanelLayout(MainApp.panelSizes);
        }
        
        if (typeof updateBottomPanelComponents === 'function') {
            updateBottomPanelComponents(MainApp.panelSizes);
        }
    }
}

function on_playback_new_track(metadb) {
    
    DataManager.onTrackChange(metadb);
    
    // Update TitleFormatManager for legacy compatibility
    if (metadb) {
        TitleFormatManager.updateCurrent(metadb);
    } else {
        TitleFormatManager.clearCurrent();
    }
    
    // Update legacy globals
    currentPlayingTrack = metadb;
    currentSelectedTrack = DataManager.getCurrentTrack();
    
    window.Repaint();
}

function on_playback_stop() {
    if (typeof updatePlayPauseButton === 'function') {
        updatePlayPauseButton();
    }
    if (typeof bottomPanel_on_playback_stop === 'function') {
        bottomPanel_on_playback_stop();
    }
}

function on_playback_pause() {
    if (typeof updatePlayPauseButton === 'function') {
        updatePlayPauseButton();
    }
}

function on_playback_starting() {
    if (typeof updatePlayPauseButton === 'function') {
        updatePlayPauseButton();
    }
}

function on_playback_seek() {
    if (typeof bottomPanel_on_playback_seek === 'function') {
        bottomPanel_on_playback_seek();
    }
}

function on_volume_change() {
    if (typeof bottomPanel_on_volume_change === 'function') {
        bottomPanel_on_volume_change();
    }
}

// ========================================================================================
// 🔹 MOUSE HANDLERS
// ========================================================================================

function on_mouse_move(x, y) {
    // Update mouse position for panels
    if (typeof topPanel_on_mouse_move === 'function') {
        topPanel_on_mouse_move(x, y);        // <-- ADD
    }

    if (typeof leftPanelState !== 'undefined' && leftPanelState) {
        leftPanelState.mouseX = x;
        leftPanelState.mouseY = y;
    }
    
        if (typeof middlePanel_on_mouse_move === 'function') {
        middlePanel_on_mouse_move(x, y);
    }
    
    if (typeof bottomPanel_on_mouse_move === 'function') {
        bottomPanel_on_mouse_move(x, y);
    }
}

function on_mouse_lbtn_down(x, y) {
    if (typeof bottomPanel_on_mouse_lbtn_down === 'function') {
        if (bottomPanel_on_mouse_lbtn_down(x, y)) return;
    }
}

function on_mouse_lbtn_up(x, y) {
    if (typeof topPanel_on_mouse_lbtn_up === 'function') {
        if (topPanel_on_mouse_lbtn_up(x, y)) return;   // <-- ADD
    }

    // Try middle panel first
    if (typeof middlePanel_on_mouse_lbtn_up === 'function') {
        if (middlePanel_on_mouse_lbtn_up(x, y)) return;
    }
    
    // Try bottom panel
    if (typeof bottomPanel_on_mouse_lbtn_up === 'function') {
        if (bottomPanel_on_mouse_lbtn_up(x, y)) return;
    }
    
    // Then left panel
    if (typeof leftPanel_onMouseClick === 'function') {
        leftPanel_onMouseClick(x, y);
    }
}

function on_mouse_lbtn_dblclk(x, y) {
    // Try middle panel first
    if (typeof middlePanel_on_mouse_lbtn_dblclk === 'function') {
        if (middlePanel_on_mouse_lbtn_dblclk(x, y)) return;
    }
}

function on_mouse_rbtn_up(x, y) {
    if (typeof topPanel_onRightClick === 'function') {
        if (topPanel_onRightClick(x, y)) return;   
    }

    // Try middle panel first
    if (typeof middlePanel_on_mouse_rbtn_up === 'function') {
        if (middlePanel_on_mouse_rbtn_up(x, y)) return;
    }
    
    // Try bottom panel
    if (typeof bottomPanel_on_mouse_rbtn_up === 'function') {
        if (bottomPanel_on_mouse_rbtn_up(x, y)) return;
    }
    
    // Default right-click menu
    if (typeof showRightClickMenu === 'function') {
        showRightClickMenu(x, y);
    }
}

function on_mouse_wheel(x, y, delta) {
    // Try middle panel first
    if (typeof middlePanel_on_mouse_wheel === 'function') {
        if (middlePanel_on_mouse_wheel(delta)) return;
    }
    
    // Handle left panel wheel
    if (typeof leftPanel_onMouseWheel === 'function') {
        if (leftPanel_onMouseWheel(x, y, delta)) return;
    }
    
    // Handle bottom panel wheel
    if (typeof bottomPanel_on_mouse_wheel === 'function') {
        bottomPanel_on_mouse_wheel(delta);
    }
}

function on_mouse_leave() {
    if (typeof topPanel_on_mouse_leave === 'function') {
        topPanel_on_mouse_leave();
    }
}

// ========================================================================================
// 🔹 DATA MANAGER INTEGRATION HELPERS
// ========================================================================================

// Add a "snap back" function for UI buttons
function snapToPlayingTrack() {
    DataManager.snapToPlaying();
    window.Repaint();
    console.log("🎯 Snapped back to playing track");
}

// Helper to check current mode
function getCurrentMode() {
    return DataManager.mode;
}

// Helper to get current track info
function getCurrentTrackInfo() {
    return DataManager.getTrackInfo();
}

// ========================================================================================
// 🔹 INITIALIZATION
// ========================================================================================

// Initialize when script loads
MainApp.init();

console.log("✅ Main module - ready");
