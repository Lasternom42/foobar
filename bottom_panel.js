'use strict';

// Load seekbar and volume modules
include(fb.ComponentPath + 'LM\\code\\includes\\seekbar.js');
include(fb.ComponentPath + 'LM\\code\\includes\\volume.js');

// ========================================================================================
// 🔹 BOTTOM PANEL - CLEANED TO MATCH TOP/MIDDLE STRUCTURE
// ========================================================================================

// ========================================================================================
// 🔹 CONFIGURATION
// ========================================================================================

var bottomPanel_Config = {
    // Component sizing
    seekbarWidthPercent: 80,          // <-- single source of truth
    volumeWidthPercent: 20,           // keep in sync with seekbarWidthPercent
    componentHeight: 50,

    // Spacing and margins
    marginLeft: 40,
    marginRight: 40,
    componentSpacing: 45,

    // Visual settings
    trackHeight: 15,                  // fallback height if thickness is not set
    trackVerticalOffset: 8,           // (only used if your paint still reads it)

    // Text positioning
    timeTextVerticalOffset: -5,
    volumeTextVerticalOffset: 35,
    timeTextHeight: 30,
    volumeTextHeight: 30,

    // Thickness (these override trackHeight in paint)
    seekbarThickness: 15,
    volumeThickness: 15,

    // Labels
    showTimeLabels: true
};

//var bottomPanel_Config = bottomPanel_Config || {};
//if (typeof bottomPanel_Config.seekbarThickness    === 'undefined') bottomPanel_Config.seekbarThickness    = 15;
//if (typeof bottomPanel_Config.volumeThickness     === 'undefined') bottomPanel_Config.volumeThickness     = 15;
//if (typeof bottomPanel_Config.showTimeLabels      === 'undefined') bottomPanel_Config.showTimeLabels      = true;
//if (typeof bottomPanel_Config.seekbarWidthPercent === 'undefined') bottomPanel_Config.seekbarWidthPercent = 80;

// ========================================================================================
// 🔹 STATE VARIABLES
// ========================================================================================

var bottomPanel_State = {
    initialized: false,
    seekbar: null,
    volumebar: null
};

// ========================================================================================
// 🔹 INITIALIZATION
// ========================================================================================

function bottomPanel_init() {
    if (bottomPanel_State.initialized) return;
    
    bottomPanel_createComponents();
    bottomPanel_State.initialized = true;
	console.log("    Bottom Panel:                             Initialized");
}

function bottomPanel_createComponents() {
    if (!panelSizes || !panelSizes.botPanel_W) return;
    
    var availableWidth = panelSizes.botPanel_W - bottomPanel_Config.marginLeft - bottomPanel_Config.marginRight - bottomPanel_Config.componentSpacing;
    var seekbarWidth = Math.floor(availableWidth * (bottomPanel_Config.seekbarWidthPercent / 100));
    var volumeWidth = Math.floor(availableWidth * (bottomPanel_Config.volumeWidthPercent / 100));
    var componentY = panelSizes.botPanel_Y + Math.floor((panelSizes.botPanel_H - bottomPanel_Config.componentHeight) / 2);
    var seekbarX = panelSizes.botPanel_X + bottomPanel_Config.marginLeft;
    var volumeX = seekbarX + seekbarWidth + bottomPanel_Config.componentSpacing;
    
    bottomPanel_State.seekbar = new _seekbar(seekbarX, componentY, seekbarWidth, bottomPanel_Config.componentHeight);
    bottomPanel_State.volumebar = new _volumebar(volumeX, componentY, volumeWidth, bottomPanel_Config.componentHeight);
}

// ========================================================================================
// 🔹 PAINT FUNCTIONS
// ========================================================================================

function bottomPanel_paint(gr, panelSizes, uiFont, uiColors) {
    if (!bottomPanel_State.initialized) bottomPanel_init();
    
    gr.FillSolidRect(panelSizes.botPanel_X, panelSizes.botPanel_Y, panelSizes.botPanel_W, panelSizes.botPanel_H, uiColors.background_bottom);
    
    if (!bottomPanel_State.seekbar || !bottomPanel_State.volumebar) {
        bottomPanel_createComponents();
    }
    
    bottomPanel_paintSeekbar(gr, uiFont, uiColors);
    bottomPanel_paintVolumeBar(gr, uiFont, uiColors);
}

function bottomPanel_paintSeekbar(gr, uiFont, uiColors) {
    if (!bottomPanel_State.seekbar) return;

    var seekbar = bottomPanel_State.seekbar;
    var barH = bottomPanel_Config.seekbarThickness || bottomPanel_Config.trackHeight;
    // center the bar inside the component height
    var barY = seekbar.y + Math.floor((bottomPanel_Config.componentHeight - barH) / 2);

    var trackColor = uiColors.primaryColor || uiColors.primary || uiColors.highlight;

    // track
    gr.FillSolidRect(seekbar.x, barY, seekbar.w, barH, trackColor);

    if (fb.IsPlaying && fb.PlaybackLength > 0) {
        var progressWidth = seekbar.pos();
        if (progressWidth > 0) {
            gr.FillSolidRect(seekbar.x, barY, progressWidth, barH, uiColors.accent || uiColors.highlight);
        }

        if (bottomPanel_Config.showTimeLabels) {
            var currentTimeStr = utils.FormatDuration(fb.PlaybackTime);
            var totalTimeStr   = utils.FormatDuration(fb.PlaybackLength);
            gr.GdiDrawText(currentTimeStr, uiFont.seekbar_dur, uiColors.primaryText,
                           seekbar.x, seekbar.y  + bottomPanel_Config.timeTextVerticalOffset,
                           100, bottomPanel_Config.timeTextHeight, DT_LEFT | DT_VCENTER);
            gr.GdiDrawText(totalTimeStr, uiFont.seekbar_dur, uiColors.primaryText,
                           seekbar.x + seekbar.w - 100, seekbar.y + bottomPanel_Config.timeTextVerticalOffset,
                           100, bottomPanel_Config.timeTextHeight, DT_RIGHT | DT_VCENTER);
        }
    } else {
        if (bottomPanel_Config.showTimeLabels) {
            gr.GdiDrawText('--:--', uiFont.seekbar_dur, uiColors.secondaryText,
                           seekbar.x, seekbar.y + bottomPanel_Config.timeTextVerticalOffset,
                           100, bottomPanel_Config.timeTextHeight, DT_LEFT | DT_VCENTER);
            gr.GdiDrawText('--:--', uiFont.seekbar_dur, uiColors.secondaryText,
                           seekbar.x + seekbar.w - 100, seekbar.y + bottomPanel_Config.timeTextVerticalOffset,
                           100, bottomPanel_Config.timeTextHeight, DT_RIGHT | DT_VCENTER);
        }
    }
}

function bottomPanel_paintVolumeBar(gr, uiFont, uiColors) {
    if (!bottomPanel_State.volumebar) return;

    var volumebar = bottomPanel_State.volumebar;
    var barH = bottomPanel_Config.volumeThickness || bottomPanel_Config.trackHeight;
    var barY = volumebar.y + Math.floor((bottomPanel_Config.componentHeight - barH) / 2);

    var trackColor = uiColors.primaryColor || uiColors.primary || uiColors.highlight;

    // track
	//gr.FillSolidRect(volumebar.x, barY, volumebar.w, barH, uiColors.accent);
    gr.FillSolidRect(volumebar.x, barY, volumebar.w, barH, trackColor);

    // fill to current volume
    var volumePos = volumebar.pos();
    if (volumePos > 0 && volumePos <= volumebar.w) {
        gr.FillSolidRect(volumebar.x, barY, volumePos, barH, uiColors.highlight || uiColors.accent);
    }

   

    var dB = fb.Volume;
    var volumeStr = dB <= -100 ? '-∞ dB' : dB.toFixed(1) + ' dB';
    gr.GdiDrawText(volumeStr, uiFont.seekbar_dur, uiColors.secondaryText,
                   volumebar.x, volumebar.y + bottomPanel_Config.volumeTextVerticalOffset,
                   volumebar.w, bottomPanel_Config.volumeTextHeight, DT_CENTER | DT_VCENTER);
}

// ========================================================================================
// 🔹 MENU SYSTEM
// ========================================================================================

function bottomPanel_showMenu(x, y) {
    if (typeof bottomPanel_isInBounds === 'function' && !bottomPanel_isInBounds(x, y)) return false;
    if (typeof createBottomPanelMenu === 'function') {
        return createBottomPanelMenu(bottomPanel_Config, x, y);
    }
    return false;
}

function bottomPanel_handleMenuResult(id) {
    if (!id) return false;

    switch (id) {
        // Seekbar thickness
        case 3110: bottomPanel_Config.seekbarThickness = 5; break;
        case 3111: bottomPanel_Config.seekbarThickness = 10; break;
        case 3112: bottomPanel_Config.seekbarThickness = 15; break;

        // Time labels
        case 3101: bottomPanel_Config.showTimeLabels = !bottomPanel_Config.showTimeLabels; break;

        // Volume thickness
        case 3125: bottomPanel_Config.volumeThickness = 5; break;
        case 3126: bottomPanel_Config.volumeThickness = 10; break;
        case 3127: bottomPanel_Config.volumeThickness = 15; break;

        // Layout split (seekbar% / volume%)
        case 3130: bottomPanel_Config.seekbarWidthPercent = 90; bottomPanel_Config.volumeWidthPercent = 10; break;
		case 3131: bottomPanel_Config.seekbarWidthPercent = 80; bottomPanel_Config.volumeWidthPercent = 20; break;
		case 3132: bottomPanel_Config.seekbarWidthPercent = 70; bottomPanel_Config.volumeWidthPercent = 30; break;
		case 3133: bottomPanel_Config.seekbarWidthPercent = 60; bottomPanel_Config.volumeWidthPercent = 40; break;

        default:
            return false;
    }

    // Let your layout recalc/resync everything
    if (typeof updateBottomPanelComponents === 'function') {
        updateBottomPanelComponents(panelSizes);
    }

    // 🔸 Always force a repaint of the bottom band so changes show immediately
    if (panelSizes) {
        window.RepaintRect(panelSizes.botPanel_X, panelSizes.botPanel_Y, panelSizes.botPanel_W, panelSizes.botPanel_H);
    } else {
        window.Repaint();
    }
    return true;
}

// ========================================================================================
// 🔹 EVENT HANDLERS
// ========================================================================================

function bottomPanel_onMouseMove(x, y) {
    var handled = false;
    
    if (bottomPanel_State.seekbar && bottomPanel_State.seekbar.move(x, y)) {
        handled = true;
    }
    
    if (bottomPanel_State.volumebar && bottomPanel_State.volumebar.move(x, y)) {
        handled = true;
    }
    
    return handled;
}

function bottomPanel_onRightClick(x, y) {
    // If your file already has bottomPanel_on_mouse_rbtn_up calling this, keep both.
    return bottomPanel_showMenu(x, y);
}

function bottomPanel_onLeftDown(x, y) {
    var handled = false;
    
    if (bottomPanel_State.seekbar && bottomPanel_State.seekbar.lbtn_down(x, y)) {
        handled = true;
    }
    
    if (bottomPanel_State.volumebar && bottomPanel_State.volumebar.lbtn_down(x, y)) {
        handled = true;
    }
    
    return handled;
}

function bottomPanel_onLeftUp(x, y) {
    var handled = false;
    
    if (bottomPanel_State.seekbar && bottomPanel_State.seekbar.lbtn_up(x, y)) {
        handled = true;
    }
    
    if (bottomPanel_State.volumebar && bottomPanel_State.volumebar.lbtn_up(x, y)) {
        handled = true;
    }
    
    return handled;
}

function bottomPanel_onWheel(delta) {
    var handled = false;
    
    if (bottomPanel_State.seekbar && bottomPanel_State.seekbar.wheel(delta)) {
        handled = true;
    }
    
    if (bottomPanel_State.volumebar && bottomPanel_State.volumebar.wheel(delta)) {
        handled = true;
    }
    
    return handled;
}

function bottomPanel_onPlaybackSeek() {
    if (bottomPanel_State.seekbar) {
        bottomPanel_State.seekbar.playback_seek();
    }
}

function bottomPanel_onPlaybackStop() {
    if (bottomPanel_State.seekbar) {
        bottomPanel_State.seekbar.playback_stop();
    }
}

function bottomPanel_onVolumeChange() {
    if (bottomPanel_State.volumebar) {
        bottomPanel_State.volumebar.volume_change();
    }
}

// ========================================================================================
// 🔹 UTILITY FUNCTIONS
// ========================================================================================

function bottomPanel_isInBounds(x, y) {
    return panelSizes && 
           x >= panelSizes.botPanel_X && x <= panelSizes.botPanel_X + panelSizes.botPanel_W &&
           y >= panelSizes.botPanel_Y && y <= panelSizes.botPanel_Y + panelSizes.botPanel_H;
}

function bottomPanel_refresh() {
    bottomPanel_createComponents();
    bottomPanel_repaint();
}

function bottomPanel_repaint() {
    window.Repaint();
}

// ========================================================================================
// 🔹 EXPORTS (for main.js integration)
// ========================================================================================

function paintBottomPanelContent(gr, panelSizes, uiFont, uiColors) {
    bottomPanel_paint(gr, panelSizes, uiFont, uiColors);
}

function bottomPanel_on_mouse_move(x, y) {
    return bottomPanel_onMouseMove(x, y);
}

function bottomPanel_on_mouse_rbtn_up(x, y) {
    return bottomPanel_onRightClick(x, y);
}

function bottomPanel_on_mouse_lbtn_down(x, y) {
    return bottomPanel_onLeftDown(x, y);
}

function bottomPanel_on_mouse_lbtn_up(x, y) {
    return bottomPanel_onLeftUp(x, y);
}

function bottomPanel_on_mouse_wheel(delta) {
    return bottomPanel_onWheel(delta);
}

function bottomPanel_on_playback_seek() {
    bottomPanel_onPlaybackSeek();
}

function bottomPanel_on_playback_stop() {
    bottomPanel_onPlaybackStop();
}

function bottomPanel_on_volume_change() {
    bottomPanel_onVolumeChange();
}

function initializeBottomPanel(panelSizes) {
    bottomPanel_init();
}

function updateBottomPanelComponents(panelSizes) {
    if (bottomPanel_State.initialized && MainApp && MainApp.initialized) {
        bottomPanel_createComponents();
    }
}

console.log("    Bottom Panel Module:                Ready");
