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
    clickAction: 0,         // 0=folder, 1=properties, 2=none
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
            // Folder first, then embedded
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
    console.log("✅ Middle Panel initialized with simplified AlbumArt.js");
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
    
    if (result === 1) return false; // Show Spider Monkey panel menu
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
// 🔹 MENU SYSTEM (EXISTING WORKING CODE)
// ========================================================================================

function createAlbumArtSubmenu() {
    var menu = window.CreatePopupMenu();
    
    var artSourceMenu = window.CreatePopupMenu();
    artSourceMenu.AppendMenuItem(MF_STRING, 1100, "Folder First");
    artSourceMenu.AppendMenuItem(MF_STRING, 1101, "Embedded First");
    artSourceMenu.CheckMenuRadioItem(1100, 1101, middlePanel_Config.artSource === 0 ? 1100 : 1101);
    artSourceMenu.AppendTo(menu, MF_STRING, "Art Source");
    
    var displayModeMenu = window.CreatePopupMenu();
    displayModeMenu.AppendMenuItem(MF_STRING, 1110, "Fit");
    displayModeMenu.AppendMenuItem(MF_STRING, 1111, "Fill");
    displayModeMenu.AppendMenuItem(MF_STRING, 1112, "Stretch");
    displayModeMenu.AppendMenuItem(MF_STRING, 1113, "Center");
    var checkedMode = 1110 + middlePanel_Config.scaleMode;
    displayModeMenu.CheckMenuRadioItem(1110, 1113, checkedMode);
    displayModeMenu.AppendTo(menu, MF_STRING, "Display Mode");
    
    menu.AppendMenuSeparator();
    menu.AppendMenuItem(MF_STRING, 1120, "Refresh Album Art");
    menu.AppendMenuItem(MF_STRING, 1121, "Clear Art Cache");
    
    return menu;
}

function createTextDisplaySubmenu() {
    var menu = window.CreatePopupMenu();
    
    var overlayMenu = window.CreatePopupMenu();
    overlayMenu.AppendMenuItem(MF_STRING, 1200, "Show Track Info (when no art)");
    overlayMenu.AppendMenuItem(MF_STRING, 1201, "Show Album Info Overlay");
    overlayMenu.CheckMenuItem(1200, middlePanel_Config.showTrackInfo);
    overlayMenu.CheckMenuItem(1201, middlePanel_Config.showAlbumInfo);
    overlayMenu.AppendTo(menu, MF_STRING, "Overlay Settings");
    
    var fontSizeMenu = window.CreatePopupMenu();
    fontSizeMenu.AppendMenuItem(MF_STRING, 1210, "Small (12)");
    fontSizeMenu.AppendMenuItem(MF_STRING, 1211, "Medium (16)");
    fontSizeMenu.AppendMenuItem(MF_STRING, 1212, "Large (20)");
    fontSizeMenu.AppendMenuItem(MF_STRING, 1213, "Extra Large (24)");
    var checkedFont = 1210;
    switch(middlePanel_Config.fontSize) {
        case 12: checkedFont = 1210; break;
        case 16: checkedFont = 1211; break;
        case 20: checkedFont = 1212; break;
        case 24: checkedFont = 1213; break;
    }
    fontSizeMenu.CheckMenuRadioItem(1210, 1213, checkedFont);
    fontSizeMenu.AppendTo(menu, MF_STRING, "Font Size");
    
    var positionMenu = window.CreatePopupMenu();
    positionMenu.AppendMenuItem(MF_STRING, 1220, "Bottom");
    positionMenu.AppendMenuItem(MF_STRING, 1221, "Top");
    positionMenu.AppendMenuItem(MF_STRING, 1222, "Center");
    var checkedPosition = 1220 + middlePanel_Config.overlayPosition;
    positionMenu.CheckMenuRadioItem(1220, 1222, checkedPosition);
    positionMenu.AppendTo(menu, MF_STRING, "Overlay Position");
    
    var contentMenu = window.CreatePopupMenu();
    contentMenu.AppendMenuItem(MF_STRING, 1230, "Show Artist");
    contentMenu.AppendMenuItem(MF_STRING, 1231, "Show Album");
    contentMenu.AppendMenuItem(MF_STRING, 1232, "Show Year");
    contentMenu.AppendMenuItem(MF_STRING, 1233, "Show Track Number");
    contentMenu.CheckMenuItem(1230, middlePanel_Config.showArtist);
    contentMenu.CheckMenuItem(1231, middlePanel_Config.showAlbum);
    contentMenu.CheckMenuItem(1232, middlePanel_Config.showYear);
    contentMenu.CheckMenuItem(1233, middlePanel_Config.showTrackNumber);
    contentMenu.AppendTo(menu, MF_STRING, "Content Options");
    
    return menu;
}

function createInteractionSubmenu() {
    var menu = window.CreatePopupMenu();
    
    var clickMenu = window.CreatePopupMenu();
    clickMenu.AppendMenuItem(MF_STRING, 1300, "Open Folder");
    clickMenu.AppendMenuItem(MF_STRING, 1301, "Properties");
    clickMenu.AppendMenuItem(MF_STRING, 1302, "None");
    var checkedClick = 1300 + middlePanel_Config.clickAction;
    clickMenu.CheckMenuRadioItem(1300, 1302, checkedClick);
    clickMenu.AppendTo(menu, MF_STRING, "Click Action");
    
    var wheelMenu = window.CreatePopupMenu();
    wheelMenu.AppendMenuItem(MF_STRING, 1310, "Volume");
    wheelMenu.AppendMenuItem(MF_STRING, 1311, "Seek");
    wheelMenu.AppendMenuItem(MF_STRING, 1312, "None");
    var checkedWheel = 1310 + middlePanel_Config.wheelAction;
    wheelMenu.CheckMenuRadioItem(1310, 1312, checkedWheel);
    wheelMenu.AppendTo(menu, MF_STRING, "Mouse Wheel Action");
    
    return menu;
}

function middlePanel_handleMenuResult(result) {
    if (result === 0) return false;
    
    try {
        if (result === 1) {
            return false; // Show Spider Monkey panel menu
        }
        
        if (result >= 1100 && result <= 1101) {
            middlePanel_Config.artSource = result - 1100;
            middlePanel_refresh();
            return true;
        }
        
        if (result >= 1110 && result <= 1113) {
            middlePanel_Config.scaleMode = result - 1110;
            middlePanel_repaint();
            return true;
        }
        
        if (result === 1120) {
            middlePanel_refresh();
            return true;
        }
        if (result === 1121) {
            middlePanel_clearCache();
            return true;
        }
        
        if (result >= 1200 && result <= 1201) {
            switch(result) {
                case 1200: middlePanel_Config.showTrackInfo = !middlePanel_Config.showTrackInfo; break;
                case 1201: middlePanel_Config.showAlbumInfo = !middlePanel_Config.showAlbumInfo; break;
            }
            middlePanel_repaint();
            return true;
        }
        
        if (result >= 1210 && result <= 1213) {
            var fontSizes = [12, 16, 20, 24];
            middlePanel_Config.fontSize = fontSizes[result - 1210];
            middlePanel_repaint();
            return true;
        }
        
        if (result >= 1220 && result <= 1222) {
            middlePanel_Config.overlayPosition = result - 1220;
            middlePanel_repaint();
            return true;
        }
        
        if (result >= 1230 && result <= 1233) {
            switch(result) {
                case 1230: middlePanel_Config.showArtist = !middlePanel_Config.showArtist; break;
                case 1231: middlePanel_Config.showAlbum = !middlePanel_Config.showAlbum; break;
                case 1232: middlePanel_Config.showYear = !middlePanel_Config.showYear; break;
                case 1233: middlePanel_Config.showTrackNumber = !middlePanel_Config.showTrackNumber; break;
            }
            middlePanel_repaint();
            return true;
        }
        
        if (result >= 1300 && result <= 1302) {
            middlePanel_Config.clickAction = result - 1300;
            return true;
        }
        
        if (result >= 1310 && result <= 1312) {
            middlePanel_Config.wheelAction = result - 1310;
            return true;
        }
        
    } catch (e) {
        console.log("❌ Error handling menu result:", e.message);
    }
    
    return false;
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

console.log("✅ Middle Panel Ready - Basic Working Version");