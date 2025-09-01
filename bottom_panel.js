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
    seekbarWidthPercent: 70,
    volumeWidthPercent: 30,
    componentHeight: 30,
    
    // Spacing and margins
    marginLeft: 40,
    marginRight: 40,
    componentSpacing: 45,
    
    // Visual settings
    trackHeight: 15,
    trackVerticalOffset: 8,
    
    // Text positioning
    timeTextVerticalOffset: -25,
    volumeTextVerticalOffset: 15,
    timeTextHeight: 30,
    volumeTextHeight: 30
};

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
    
    gr.FillSolidRect(panelSizes.botPanel_X, panelSizes.botPanel_Y, panelSizes.botPanel_W, panelSizes.botPanel_H, uiColors.background_B);
    
    if (!bottomPanel_State.seekbar || !bottomPanel_State.volumebar) {
        bottomPanel_createComponents();
    }
    
    bottomPanel_paintSeekbar(gr, uiFont, uiColors);
    bottomPanel_paintVolumeBar(gr, uiFont, uiColors);
}

function bottomPanel_paintSeekbar(gr, uiFont, uiColors) {
    if (!bottomPanel_State.seekbar) return;
    
    var trackLength = fb.PlaybackLength;
    var currentTime = fb.PlaybackTime;
    var seekbar = bottomPanel_State.seekbar;
    
    var trackColor = uiColors.primaryColor;
    gr.FillSolidRect(seekbar.x, seekbar.y + bottomPanel_Config.trackVerticalOffset, seekbar.w, bottomPanel_Config.trackHeight, trackColor);
    
    if (fb.IsPlaying && trackLength > 0) {
        var progressWidth = seekbar.pos();
        if (progressWidth > 0) {
            gr.FillSolidRect(seekbar.x, seekbar.y + bottomPanel_Config.trackVerticalOffset, progressWidth, bottomPanel_Config.trackHeight, uiColors.accent);
        }
        
        var currentTimeStr = utils.FormatDuration(currentTime);
        var totalTimeStr = utils.FormatDuration(trackLength);
        
        gr.GdiDrawText(currentTimeStr, uiFont.seekbar_dur, uiColors.primaryText, 
                       seekbar.x, seekbar.y + bottomPanel_Config.timeTextVerticalOffset, 100, bottomPanel_Config.timeTextHeight, DT_LEFT | DT_VCENTER);
        
        gr.GdiDrawText(totalTimeStr, uiFont.seekbar_dur, uiColors.primaryText, 
                       seekbar.x + seekbar.w - 100, seekbar.y + bottomPanel_Config.timeTextVerticalOffset, 100, bottomPanel_Config.timeTextHeight, DT_RIGHT | DT_VCENTER);
    } else {
        gr.GdiDrawText("--:--", uiFont.seekbar_dur, uiColors.secondaryText, 
                       seekbar.x, seekbar.y + bottomPanel_Config.timeTextVerticalOffset, 100, bottomPanel_Config.timeTextHeight, DT_LEFT | DT_VCENTER);
        gr.GdiDrawText("--:--", uiFont.seekbar_dur, uiColors.secondaryText, 
                       seekbar.x + seekbar.w - 100, seekbar.y + bottomPanel_Config.timeTextVerticalOffset, 100, bottomPanel_Config.timeTextHeight, DT_RIGHT | DT_VCENTER);
    }
}

function bottomPanel_paintVolumeBar(gr, uiFont, uiColors) {
    if (!bottomPanel_State.volumebar) return;
    
    var volumebar = bottomPanel_State.volumebar;
    var trackColor = uiColors.primaryColor;
    gr.FillSolidRect(volumebar.x, volumebar.y + bottomPanel_Config.trackVerticalOffset, volumebar.w, bottomPanel_Config.trackHeight, trackColor);
    
    var volumePos = volumebar.pos();
    if (volumePos > 0 && volumePos <= volumebar.w) {
        gr.FillSolidRect(volumebar.x, volumebar.y + bottomPanel_Config.trackVerticalOffset, volumePos, bottomPanel_Config.trackHeight, uiColors.highlight);
    }
    
    gr.GdiDrawText("VOL", uiFont.seekbar_dur, uiColors.primaryText, 
                   volumebar.x, volumebar.y + bottomPanel_Config.timeTextVerticalOffset, 50, bottomPanel_Config.timeTextHeight, DT_CENTER | DT_VCENTER);
    
    var currentVolume = fb.Volume;
    var volumeStr = currentVolume <= -100 ? "-∞ dB" : currentVolume.toFixed(1) + " dB";
    
    gr.GdiDrawText(volumeStr, uiFont.seekbar_dur, uiColors.secondaryText, 
                   volumebar.x, volumebar.y + bottomPanel_Config.volumeTextVerticalOffset, volumebar.w, bottomPanel_Config.volumeTextHeight, DT_CENTER | DT_VCENTER);
}

// ========================================================================================
// 🔹 MENU SYSTEM
// ========================================================================================

function bottomPanel_showMenu(x, y) {
    var menu = {
        title: 'Bottom Panel',
        sections: [
            {
                name: 'Layout Settings',
                subsections: [
                    {
                        name: 'Component Width',
                        items: [
                            createMenuItem(3100, 'Seekbar 60% / Volume 40%', 'radio', { group: 'layout', checked: bottomPanel_Config.seekbarWidthPercent === 60 }),
                            createMenuItem(3101, 'Seekbar 70% / Volume 30%', 'radio', { group: 'layout', checked: bottomPanel_Config.seekbarWidthPercent === 70 }),
                            createMenuItem(3102, 'Seekbar 80% / Volume 20%', 'radio', { group: 'layout', checked: bottomPanel_Config.seekbarWidthPercent === 80 })
                        ]
                    },
                    {
                        name: 'Component Height',
                        items: [
                            createMenuItem(3110, 'Small (25px)', 'radio', { group: 'height', checked: bottomPanel_Config.componentHeight === 25 }),
                            createMenuItem(3111, 'Medium (30px)', 'radio', { group: 'height', checked: bottomPanel_Config.componentHeight === 30 }),
                            createMenuItem(3112, 'Large (35px)', 'radio', { group: 'height', checked: bottomPanel_Config.componentHeight === 35 }),
                            createMenuItem(3113, 'Extra Large (40px)', 'radio', { group: 'height', checked: bottomPanel_Config.componentHeight === 40 })
                        ]
                    },
                    {
                        name: 'Spacing',
                        items: [
                            createMenuItem(3120, 'Tight (30px)', 'radio', { group: 'spacing', checked: bottomPanel_Config.componentSpacing === 30 }),
                            createMenuItem(3121, 'Normal (45px)', 'radio', { group: 'spacing', checked: bottomPanel_Config.componentSpacing === 45 }),
                            createMenuItem(3122, 'Wide (60px)', 'radio', { group: 'spacing', checked: bottomPanel_Config.componentSpacing === 60 })
                        ]
                    }
                ]
            }
        ]
    };
    
    var result = createPanelMenu(menu, x, y);
    if (result > 0) bottomPanel_handleMenuResult(result);
}

function bottomPanel_handleMenuResult(id) {
    if (id === 0) return;
    
    switch (id) {
        case 3100: bottomPanel_Config.seekbarWidthPercent = 60; bottomPanel_Config.volumeWidthPercent = 40; bottomPanel_createComponents(); bottomPanel_repaint(); break;
        case 3101: bottomPanel_Config.seekbarWidthPercent = 70; bottomPanel_Config.volumeWidthPercent = 30; bottomPanel_createComponents(); bottomPanel_repaint(); break;
        case 3102: bottomPanel_Config.seekbarWidthPercent = 80; bottomPanel_Config.volumeWidthPercent = 20; bottomPanel_createComponents(); bottomPanel_repaint(); break;
        
        case 3110: bottomPanel_Config.componentHeight = 25; bottomPanel_createComponents(); bottomPanel_repaint(); break;
        case 3111: bottomPanel_Config.componentHeight = 30; bottomPanel_createComponents(); bottomPanel_repaint(); break;
        case 3112: bottomPanel_Config.componentHeight = 35; bottomPanel_createComponents(); bottomPanel_repaint(); break;
        case 3113: bottomPanel_Config.componentHeight = 40; bottomPanel_createComponents(); bottomPanel_repaint(); break;
        
        case 3120: bottomPanel_Config.componentSpacing = 30; bottomPanel_createComponents(); bottomPanel_repaint(); break;
        case 3121: bottomPanel_Config.componentSpacing = 45; bottomPanel_createComponents(); bottomPanel_repaint(); break;
        case 3122: bottomPanel_Config.componentSpacing = 60; bottomPanel_createComponents(); bottomPanel_repaint(); break;
    }
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
    if (bottomPanel_isInBounds(x, y)) {
        bottomPanel_showMenu(x, y);
        return true;
    }
    return false;
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

console.log("✅ Bottom Panel Module Ready");