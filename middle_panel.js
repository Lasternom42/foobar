// ========================================================================================
// 🔹 INTERACTION HANDLERS
// ========================================================================================// ========================================================================================
// 🔹 MIDDLE PANEL - SIMPLIFIED WORKING VERSION
// ========================================================================================

'use strict';

// ========================================================================================
// 🔹 CONFIGURATION
// ========================================================================================

var middlePanel_Config = {
    // Album art settings
    artSource: 0,           // 0=folder first, 1=embedded first
    scaleMode: 0,           // 0=fit, 1=fill, 2=stretch, 3=center
    noArtPath: 'LM\\skin\\no_album_art.png',
    
    // Text overlay settings
    showTrackInfo: true,    // Show text when no art
    showAlbumInfo: false,   // Show overlay on art
    fontSize: 16,
    overlayPosition: 0,     // 0=bottom, 1=top, 2=center
    overlayOpacity: 0.8,
    showArtist: true,
    showAlbum: true,
    showYear: true,
    showTrackNumber: false,
    
    // Interaction
    clickAction: 2,         // 0=folder, 1=properties, 2=none
    wheelAction: 0          // 0=volume, 1=seek, 2=none
};

// ========================================================================================
// 🔹 STATE VARIABLES
// ========================================================================================

var middlePanel_State = {
    initialized: false,
    mouseX: 0,
    mouseY: 0,
    clickArea: { x: 0, y: 0, w: 0, h: 0 },
    currentArt: null,
    lastTrackPath: null
};

// ========================================================================================
// 🔹 MAIN PAINTING FUNCTION
// ========================================================================================

function paintMiddlePanelContent(gr, panelSizes, uiFont, uiColors) {
    if (!panelSizes || !gr) return;
    
    // Initialize middle panel with simplified albumart.js
    middlePanel_initialize();
    
    var bounds = {
        x: panelSizes.midPanel_X,
        y: panelSizes.midPanel_Y,
        w: panelSizes.midPanel_W,
        h: panelSizes.midPanel_H
    };
    
    // Store click area
    middlePanel_State.clickArea = bounds;
    
    // Clear background
    gr.FillSolidRect(bounds.x, bounds.y, bounds.w, bounds.h, uiColors.background);
    
    // Get current track info from DataManager
    var trackInfo = null;
    if (typeof DataManager !== 'undefined' && DataManager.getTrackInfo) {
        trackInfo = DataManager.getTrackInfo();
    }
    
    if (trackInfo && trackInfo.metadb) {
        drawWithTrack(gr, bounds, trackInfo, uiFont, uiColors);
    } else {
        drawNoTrack(gr, bounds, uiFont, uiColors);
    }
    
    // Draw border
    gr.DrawRect(bounds.x, bounds.y, bounds.w - 1, bounds.h - 1, 1, uiColors.border);
}

function drawWithTrack(gr, bounds, trackInfo, uiFont, uiColors) {
    // Try to get album art
    var art = getArtForTrack(trackInfo);
    
    if (art) {
        drawArt(gr, bounds, art, trackInfo, uiFont, uiColors);
    } else {
        drawNoArt(gr, bounds, trackInfo, uiFont, uiColors);
    }
}

function getArtForTrack(trackInfo) {
    if (!trackInfo || !trackInfo.metadb) return null;
    
    try {
        var art = null;
        
        if (middlePanel_Config.artSource === 0) {
            // Folder first, then emb  edded
            art = utils.GetAlbumArtV2(trackInfo.metadb, 0);
            if (!art) art = utils.GetAlbumArtV2(trackInfo.metadb, 1);
        } else {
            // Embedded first, then folder
            art = utils.GetAlbumArtV2(trackInfo.metadb, 1);
            if (!art) art = utils.GetAlbumArtV2(trackInfo.metadb, 0);
        }
        
        return art;
    } catch (e) {
        return null;
    }
}

function drawArt(gr, bounds, art, trackInfo, uiFont, uiColors) {
    // Calculate art bounds based on scale mode
    var artBounds = calculateImageBounds(bounds, art);
    
    // Draw the image
    gr.DrawImage(art, artBounds.x, artBounds.y, artBounds.w, artBounds.h, 
                 0, 0, art.Width, art.Height);
    
    // Draw overlay if enabled
    if (middlePanel_Config.showAlbumInfo) {
        drawOverlay(gr, bounds, trackInfo, uiFont, uiColors);
    }
}

function drawNoArt(gr, bounds, trackInfo, uiFont, uiColors) {
    // Try to draw no-art placeholder
    var noArt = loadNoArtImage();
    if (noArt) {
        var artBounds = calculateImageBounds(bounds, noArt);
        gr.DrawImage(noArt, artBounds.x, artBounds.y, artBounds.w, artBounds.h,
                     0, 0, noArt.Width, noArt.Height, 0, 128); // Semi-transparent
    }
    
    // Draw track info if enabled
    if (middlePanel_Config.showTrackInfo) {
        drawTrackText(gr, bounds, trackInfo, uiFont, uiColors);
    }
}

function drawNoTrack(gr, bounds, uiFont, uiColors) {
    var text = "No track playing";
    var textW = _textWidth(text, uiFont);
    var x = bounds.x + (bounds.w - textW) / 2;
    var y = bounds.y + bounds.h / 2 - 10;
    
    gr.GdiDrawText(text, uiFont, uiColors.text, x, y, textW, 20, DT_LEFT | DT_TOP);
}

function drawOverlay(gr, bounds, trackInfo, uiFont, uiColors) {
    var text = buildTrackText(trackInfo);
    if (!text) return;
    
    var font = gdi.Font(uiFont.Name, middlePanel_Config.fontSize, 0);
    var textW = _textWidth(text, font);
    var textH = middlePanel_Config.fontSize + 4;
    
    // Calculate overlay position
    var overlayX = bounds.x + 10;
    var overlayY = bounds.y + 10;
    
    switch (middlePanel_Config.overlayPosition) {
        case 0: // Bottom
            overlayY = bounds.y + bounds.h - textH - 15;
            break;
        case 1: // Top
            overlayY = bounds.y + 10;
            break;
        case 2: // Center
            overlayX = bounds.x + (bounds.w - textW) / 2;
            overlayY = bounds.y + (bounds.h - textH) / 2;
            break;
    }
    
    // Draw background
    var bgColor = _RGBA(0, 0, 0, Math.floor(255 * middlePanel_Config.overlayOpacity));
    gr.FillSolidRect(overlayX - 5, overlayY - 2, textW + 10, textH + 4, bgColor);
    
    // Draw text
    gr.GdiDrawText(text, font, _RGB(255, 255, 255), overlayX, overlayY, textW, textH, DT_LEFT | DT_TOP);
}

function drawTrackText(gr, bounds, trackInfo, uiFont, uiColors) {
    var text = buildTrackText(trackInfo);
    if (!text) return;
    
    var font = gdi.Font(uiFont.Name, middlePanel_Config.fontSize, 0);
    var textW = _textWidth(text, font);
    var textH = middlePanel_Config.fontSize + 4;
    
    var x = bounds.x + (bounds.w - textW) / 2;
    var y = bounds.y + (bounds.h - textH) / 2;
    
    gr.GdiDrawText(text, font, uiColors.text, x, y, textW, textH, DT_LEFT | DT_TOP);
}

function middlePanel_repaint() {
    window.Repaint();
}

// ========================================================================================
// 🔹 TRACK CHANGE HANDLERS (Simplified - No Cache)
// ========================================================================================

function middlePanel_on_playback_new_track() {
    // Reset art state when track changes
    middlePanel_State.currentArt = null;
    middlePanel_State.lastTrackPath = null;
    
    console.log("🎵 New track - resetting art state");
    window.Repaint();
}

function middlePanel_on_metadb_changed() {
    // Reset art state when metadata changes
    middlePanel_State.currentArt = null;
    middlePanel_State.lastTrackPath = null;
    
    console.log("📝 Metadata changed - resetting art state");
    window.Repaint();
}

// ========================================================================================
// 🔹 INITIALIZATION (Enhanced for albumart.js)
// ========================================================================================

function middlePanel_initialize() {
    if (middlePanel_State.initialized) return;
    
    middlePanel_State.initialized = true;
    console.log("✅ Middle Panel - initialized.js");
}

// ========================================================================================
// 🔹 HELPER FUNCTIONS
// ========================================================================================

function buildTrackText(trackInfo) {
    var parts = [];
    
    if (middlePanel_Config.showArtist && trackInfo.artist) {
        parts.push(trackInfo.artist);
    }
    
    if (middlePanel_Config.showAlbum && trackInfo.album) {
        parts.push(trackInfo.album);
    }
    
    if (middlePanel_Config.showYear && trackInfo.year) {
        parts.push('(' + trackInfo.year + ')');
    }
    
    if (middlePanel_Config.showTrackNumber && trackInfo.trackNumber) {
        parts.push('#' + trackInfo.trackNumber);
    }
    
    return parts.join(' - ');
}

function calculateImageBounds(bounds, image) {
    if (!image) return bounds;
    
    var aspect = image.Width / image.Height;
    var boundsAspect = bounds.w / bounds.h;
    var result = { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h };
    
    switch (middlePanel_Config.scaleMode) {
        case 0: // Fit
            if (aspect > boundsAspect) {
                result.h = bounds.w / aspect;
                result.y = bounds.y + (bounds.h - result.h) / 2;
            } else {
                result.w = bounds.h * aspect;
                result.x = bounds.x + (bounds.w - result.w) / 2;
            }
            break;
        case 1: // Fill
            if (aspect > boundsAspect) {
                result.w = bounds.h * aspect;
                result.x = bounds.x + (bounds.w - result.w) / 2;
            } else {
                result.h = bounds.w / aspect;
                result.y = bounds.y + (bounds.h - result.h) / 2;
            }
            break;
        case 2: // Stretch - use full bounds
            break;
        case 3: // Center
            result.w = Math.min(bounds.w, image.Width);
            result.h = Math.min(bounds.h, image.Height);
            result.x = bounds.x + (bounds.w - result.w) / 2;
            result.y = bounds.y + (bounds.h - result.h) / 2;
            break;
    }
    
    return result;
}

// Fallback function for when albumart.js is not available
function loadNoArtImage() {
    try {
        if (middlePanel_Config.noArtPath && _isFile(middlePanel_Config.noArtPath)) {
            return gdi.Image(middlePanel_Config.noArtPath);
        }
    } catch (e) {}
    return null;
}

function middlePanel_initialize() {
    if (middlePanel_State.initialized) return;
    
    // Initialize AlbumArt cache system if available
    if (typeof AlbumArtCache !== 'undefined' && !AlbumArtCache.initialized) {
        AlbumArtCache.init();
        console.log("🎨 Initialized AlbumArt cache system for middle panel");
    }
    
    middlePanel_State.initialized = true;
    console.log("✅ Middle Panel initialized with AlbumArt.js integration");
}

function middlePanel_onMouseMove(x, y) {
    middlePanel_State.mouseX = x;
    middlePanel_State.mouseY = y;
}

function middlePanel_onLeftClick(x, y) {
    if (!middlePanel_isInBounds(x, y)) return false;
    return middlePanel_executeAction(middlePanel_Config.clickAction);
}

function middlePanel_onRightClick(x, y) {
    if (!middlePanel_isInBounds(x, y)) return false;
    
    // Use the external rightclick_menu.js system
    if (typeof createMiddlePanelMenu === 'function') {
        return createMiddlePanelMenu(middlePanel_Config, x, y, {
            refresh: function() {
                middlePanel_refresh();
            },
            clearCache: function() {
                middlePanel_clearCache();
            },
            repaint: function() {
                middlePanel_repaint();
            },
            configChanged: function() {
                // Save config if needed
                console.log("🔧 Middle panel config changed");
                middlePanel_repaint();
            }
        });
    }
    
    // Fallback: show basic menu if rightclick_menu.js not available
    var menu = window.CreatePopupMenu();
    menu.AppendMenuItem(MF_STRING, 1, "Panel");
    menu.AppendMenuSeparator();
    menu.AppendMenuItem(MF_STRING, 100, "Refresh Album Art");
    menu.AppendMenuItem(MF_STRING, 101, "Clear Art Cache");
    
    var result = menu.TrackPopupMenu(x, y);
    
    if (result === 1) return false; // Spider Monkey shows its panel menu
    if (result === 100) { middlePanel_refresh(); return true; }
    if (result === 101) { middlePanel_clearCache(); return true; }
    
    return false;
}


function middlePanel_onWheel(delta) {
    switch (middlePanel_Config.wheelAction) {
        case 0: // Volume
            fb.Volume += (delta > 0 ? 2 : -2);
            return true;
        case 1: // Seek
            if (fb.IsPlaying && fb.PlaybackLength > 0) {
                var seekAmount = (delta > 0 ? 5 : -5);
                fb.PlaybackTime = Math.max(0, Math.min(fb.PlaybackLength, fb.PlaybackTime + seekAmount));
                return true;
            }
            return false;
        case 2: // None
        default:
            return false;
    }
}

function middlePanel_executeAction(actionId) {
    var trackInfo = (typeof DataManager !== 'undefined') ? DataManager.getTrackInfo() : null;
    if (!trackInfo) return false;
    
    try {
        switch (actionId) {
            case 0: // Open folder
                if (typeof _explorer === 'function') {
                    _explorer(trackInfo.path);
                } else {
                    WshShell.Run('explorer /select,"' + trackInfo.path + '"');
                }
                return true;
            case 1: // Properties
                if (trackInfo.metadb) {
                    fb.RunContextCommandWithMetadb("Properties", trackInfo.metadb);
                }
                return true;
            case 2: // None
            default:
                return false;
        }
    } catch (e) {
        console.log("❌ Error executing action:", e.message);
        return false;
    }
}

function middlePanel_isInBounds(x, y) {
    var area = middlePanel_State.clickArea;
    return x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h;
}

function middlePanel_refresh() {
    // Clear current art state
    middlePanel_State.currentArt = null;
    middlePanel_State.lastTrackPath = null;
    
    console.log("🔄 Refreshing middle panel...");
    window.Repaint();
}

function middlePanel_clearCache() {
    // Clear current art state (no cache to clear)
    middlePanel_State.currentArt = null;
    middlePanel_State.lastTrackPath = null;
    
    console.log("🗑️ Clearing middle panel state...");
    window.Repaint();
}


// ========================================================================================
// 🔹 EXPORTS FOR MAIN.JS
// ========================================================================================

function paintAlbumArt(gr, panelSizes, uiFont, uiColors) {
    paintMiddlePanelContent(gr, panelSizes, uiFont, uiColors);
}

function middlePanel_on_mouse_move(x, y) {
    middlePanel_onMouseMove(x, y);
}

function middlePanel_on_mouse_lbtn_up(x, y) {
    return middlePanel_onLeftClick(x, y);
}

function middlePanel_on_mouse_rbtn_up(x, y) {
    return middlePanel_onRightClick(x, y);
}

function middlePanel_on_mouse_wheel(delta) {
    return middlePanel_onWheel(delta);
}

function middlePanel_on_playback_new_track() {
    middlePanel_State.currentArt = null;
    middlePanel_State.lastTrackPath = null;
    window.Repaint();
}

function middlePanel_on_metadb_changed() {
    middlePanel_State.currentArt = null;
    middlePanel_State.lastTrackPath = null;
    window.Repaint();
}

console.log("    Middle Panel Module:                 Ready");
