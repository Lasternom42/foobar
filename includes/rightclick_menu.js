// ========================================================================================
// 🔹 RIGHT-CLICK MENU SYSTEM (rightclick_menu.js)
// ========================================================================================

'use strict';

// ========================================================================================
// 🔹 MENU CREATION SYSTEM
// ========================================================================================

/**
 * Creates and shows a panel configuration menu
 * @param {object} config - Panel configuration object
 * @param {number} x - X position for menu
 * @param {number} y - Y position for menu
 * @param {function} changeCallback - Callback for configuration changes
 * @returns {number} - Menu result ID
 */
function createPanelConfigMenu(config, x, y, changeCallback) {
    var menu = window.CreatePopupMenu();
    
    // Add clickable title that shows Spider Monkey panel context menu
    menu.AppendMenuItem(MF_STRING, 1, "Panel");
    menu.AppendMenuSeparator();
    
    // Create submenus based on config type
    var albumArtMenu = createAlbumArtSubmenu(config);
    var textDisplayMenu = createTextDisplaySubmenu(config);
    var interactionMenu = createInteractionSubmenu(config);
    
    // Add submenus to main menu
    albumArtMenu.AppendTo(menu, MF_STRING, "Album Art");
    textDisplayMenu.AppendTo(menu, MF_STRING, "Text Display");
    interactionMenu.AppendTo(menu, MF_STRING, "Interaction");
    
    // Show menu and handle result
    var result = menu.TrackPopupMenu(x, y);
    return handleMenuResult(result, config, changeCallback);
}

// ========================================================================================
// 🔹 SUBMENU CREATION FUNCTIONS
// ========================================================================================

function createAlbumArtSubmenu(config) {
    var menu = window.CreatePopupMenu();
    
    // Art Source submenu
    var artSourceMenu = window.CreatePopupMenu();
    artSourceMenu.AppendMenuItem(MF_STRING, 1100, "Folder First");
    artSourceMenu.AppendMenuItem(MF_STRING, 1101, "Embedded First");
    artSourceMenu.CheckMenuRadioItem(1100, 1101, config.artSource === 0 ? 1100 : 1101);
    artSourceMenu.AppendTo(menu, MF_STRING, "Art Source");
    
    // Display Mode submenu
    var displayModeMenu = window.CreatePopupMenu();
    displayModeMenu.AppendMenuItem(MF_STRING, 1110, "Fit");
    displayModeMenu.AppendMenuItem(MF_STRING, 1111, "Fill");
    displayModeMenu.AppendMenuItem(MF_STRING, 1112, "Stretch");
    displayModeMenu.AppendMenuItem(MF_STRING, 1113, "Center");
    var checkedMode = 1110 + config.scaleMode;
    displayModeMenu.CheckMenuRadioItem(1110, 1113, checkedMode);
    displayModeMenu.AppendTo(menu, MF_STRING, "Display Mode");
    
    menu.AppendMenuSeparator();
    
    // Actions
    menu.AppendMenuItem(MF_STRING, 1120, "Refresh Album Art");
    menu.AppendMenuItem(MF_STRING, 1121, "Clear Art Cache");
    
    return menu;
}

function createTextDisplaySubmenu(config) {
    var menu = window.CreatePopupMenu();
    
    // Overlay Settings submenu
    var overlayMenu = window.CreatePopupMenu();
    overlayMenu.AppendMenuItem(MF_STRING, 1200, "Show Track Info (when no art)");
    overlayMenu.AppendMenuItem(MF_STRING, 1201, "Show Album Info Overlay");
    overlayMenu.CheckMenuItem(1200, config.showTrackInfo);
    overlayMenu.CheckMenuItem(1201, config.showAlbumInfo);
    overlayMenu.AppendTo(menu, MF_STRING, "Overlay Settings");
    
    // Font Size submenu
    var fontSizeMenu = window.CreatePopupMenu();
    fontSizeMenu.AppendMenuItem(MF_STRING, 1210, "Small (12)");
    fontSizeMenu.AppendMenuItem(MF_STRING, 1211, "Medium (16)");
    fontSizeMenu.AppendMenuItem(MF_STRING, 1212, "Large (20)");
    fontSizeMenu.AppendMenuItem(MF_STRING, 1213, "Extra Large (24)");
    var checkedFont = 1210;
    switch(config.fontSize) {
        case 12: checkedFont = 1210; break;
        case 16: checkedFont = 1211; break;
        case 20: checkedFont = 1212; break;
        case 24: checkedFont = 1213; break;
    }
    fontSizeMenu.CheckMenuRadioItem(1210, 1213, checkedFont);
    fontSizeMenu.AppendTo(menu, MF_STRING, "Font Size");
    
    // Overlay Position submenu
    var positionMenu = window.CreatePopupMenu();
    positionMenu.AppendMenuItem(MF_STRING, 1220, "Bottom");
    positionMenu.AppendMenuItem(MF_STRING, 1221, "Top");
    positionMenu.AppendMenuItem(MF_STRING, 1222, "Center");
    var checkedPosition = 1220 + config.overlayPosition;
    positionMenu.CheckMenuRadioItem(1220, 1222, checkedPosition);
    positionMenu.AppendTo(menu, MF_STRING, "Overlay Position");
    
    // Content Options submenu
    var contentMenu = window.CreatePopupMenu();
    contentMenu.AppendMenuItem(MF_STRING, 1230, "Show Artist");
    contentMenu.AppendMenuItem(MF_STRING, 1231, "Show Album");
    contentMenu.AppendMenuItem(MF_STRING, 1232, "Show Year");
    contentMenu.AppendMenuItem(MF_STRING, 1233, "Show Track Number");
    contentMenu.CheckMenuItem(1230, config.showArtist);
    contentMenu.CheckMenuItem(1231, config.showAlbum);
    contentMenu.CheckMenuItem(1232, config.showYear);
    contentMenu.CheckMenuItem(1233, config.showTrackNumber);
    contentMenu.AppendTo(menu, MF_STRING, "Content Options");
    
    return menu;
}

function createInteractionSubmenu(config) {
    var menu = window.CreatePopupMenu();
    
    // Click Action submenu
    var clickMenu = window.CreatePopupMenu();
    clickMenu.AppendMenuItem(MF_STRING, 1300, "Open Folder");
    clickMenu.AppendMenuItem(MF_STRING, 1301, "Properties");
    clickMenu.AppendMenuItem(MF_STRING, 1302, "None");
    var checkedClick = 1300 + config.clickAction;
    clickMenu.CheckMenuRadioItem(1300, 1302, checkedClick);
    clickMenu.AppendTo(menu, MF_STRING, "Click Action");
    
    // Mouse Wheel Action submenu
    var wheelMenu = window.CreatePopupMenu();
    wheelMenu.AppendMenuItem(MF_STRING, 1310, "Volume");
    wheelMenu.AppendMenuItem(MF_STRING, 1311, "Seek");
    wheelMenu.AppendMenuItem(MF_STRING, 1312, "None");
    var checkedWheel = 1310 + config.wheelAction;
    wheelMenu.CheckMenuRadioItem(1310, 1312, checkedWheel);
    wheelMenu.AppendTo(menu, MF_STRING, "Mouse Wheel Action");
    
    return menu;
}

// ========================================================================================
// 🔹 MENU RESULT HANDLER
// ========================================================================================

function handleMenuResult(result, config, changeCallback) {
    if (result === 0) return false;
    
    try {
        // Handle "Panel" menu item - show Spider Monkey panel menu
        if (result === 1) {
            return false; // Let Spider Monkey show its context menu
        }
        
        var configChanged = false;
        var repaintNeeded = false;
        var refreshNeeded = false;
        
        // Art source actions (1100-1101)
        if (result >= 1100 && result <= 1101) {
            config.artSource = result - 1100;
            configChanged = true;
            refreshNeeded = true;
        }
        
        // Scale mode actions (1110-1113)
        else if (result >= 1110 && result <= 1113) {
            config.scaleMode = result - 1110;
            configChanged = true;
            repaintNeeded = true;
        }
        
        // Action buttons (1120-1121)
        else if (result === 1120) {
            // Refresh Album Art
            if (changeCallback) changeCallback('refresh', null);
            return true;
        }
        else if (result === 1121) {
            // Clear Art Cache
            if (changeCallback) changeCallback('clearCache', null);
            return true;
        }
        
        // Text display toggles (1200-1201)
        else if (result >= 1200 && result <= 1201) {
            switch(result) {
                case 1200: 
                    config.showTrackInfo = !config.showTrackInfo; 
                    break;
                case 1201: 
                    config.showAlbumInfo = !config.showAlbumInfo; 
                    break;
            }
            configChanged = true;
            repaintNeeded = true;
        }
        
        // Font size actions (1210-1213)
        else if (result >= 1210 && result <= 1213) {
            var fontSizes = [12, 16, 20, 24];
            config.fontSize = fontSizes[result - 1210];
            configChanged = true;
            repaintNeeded = true;
        }
        
        // Position actions (1220-1222)
        else if (result >= 1220 && result <= 1222) {
            config.overlayPosition = result - 1220;
            configChanged = true;
            repaintNeeded = true;
        }
        
        // Content options (1230-1233)
        else if (result >= 1230 && result <= 1233) {
            switch(result) {
                case 1230: config.showArtist = !config.showArtist; break;
                case 1231: config.showAlbum = !config.showAlbum; break;
                case 1232: config.showYear = !config.showYear; break;
                case 1233: config.showTrackNumber = !config.showTrackNumber; break;
            }
            configChanged = true;
            repaintNeeded = true;
        }
        
        // Click action (1300-1302)
        else if (result >= 1300 && result <= 1302) {
            config.clickAction = result - 1300;
            configChanged = true;
        }
        
        // Wheel action (1310-1312)
        else if (result >= 1310 && result <= 1312) {
            config.wheelAction = result - 1310;
            configChanged = true;
        }
        
        // Handle callbacks
        if (changeCallback) {
            if (refreshNeeded) {
                changeCallback('refresh', null);
            } else if (repaintNeeded) {
                changeCallback('repaint', null);
            } else if (configChanged) {
                changeCallback('configChanged', null);
            }
        }
        
        return configChanged || repaintNeeded || refreshNeeded;
        
    } catch (e) {
        console.log("❌ Error handling menu result:", e.message);
        return false;
    }
}

// ========================================================================================
// 🔹 SPECIALIZED MENU FUNCTIONS
// ========================================================================================

/**
 * Create a menu specifically for middle panel (album art panel)
 */
function createMiddlePanelMenu(config, x, y, callbacks) {
    return createPanelConfigMenu(config, x, y, function(action, value) {
        switch(action) {
            case 'refresh':
                if (callbacks && callbacks.refresh) callbacks.refresh();
                break;
            case 'clearCache':
                if (callbacks && callbacks.clearCache) callbacks.clearCache();
                break;
            case 'repaint':
                if (callbacks && callbacks.repaint) callbacks.repaint();
                break;
            case 'configChanged':
                if (callbacks && callbacks.configChanged) callbacks.configChanged();
                break;
        }
    });
}


function createTopPanelMenu(config, x, y) {
    try {
        var menu = window.CreatePopupMenu();

        // Display Options
        var displaySub = window.CreatePopupMenu();
        displaySub.AppendMenuItem(MF_STRING, 2100, 'Show Buttons');
        if (config.showButtons) displaySub.CheckMenuItem(2100, true);
        displaySub.AppendMenuItem(MF_STRING, 2101, 'Show Button Labels');
        if (config.showLabels) displaySub.CheckMenuItem(2101, true);
        displaySub.AppendTo(menu, MF_STRING, 'Display Options');

        // Button Size
        var sizeSub = window.CreatePopupMenu();
        var sizeOpts = [
            { id: 2110, text: 'Small (30px)',  val: 30 },
            { id: 2111, text: 'Medium (40px)', val: 40 },
            { id: 2112, text: 'Large (50px)',  val: 50 },
            { id: 2113, text: 'Extra Large (60px)', val: 60 }
        ];
        for (var i = 0; i < sizeOpts.length; i++) {
            sizeSub.AppendMenuItem(MF_STRING, sizeOpts[i].id, sizeOpts[i].text);
            if (config.buttonSize === sizeOpts[i].val) sizeSub.CheckMenuItem(sizeOpts[i].id, true);
        }
        sizeSub.AppendTo(menu, MF_STRING, 'Button Size');

        // Button Spacing
        var spacingSub = window.CreatePopupMenu();
        var spaceOpts = [
            { id: 2120, text: 'Tight (5px)',   val: 5  },
            { id: 2121, text: 'Normal (10px)', val: 10 },
            { id: 2122, text: 'Wide (15px)',   val: 15 },
            { id: 2123, text: 'Extra Wide (20px)', val: 20 }
        ];
        for (var j = 0; j < spaceOpts.length; j++) {
            spacingSub.AppendMenuItem(MF_STRING, spaceOpts[j].id, spaceOpts[j].text);
            if (config.buttonSpacing === spaceOpts[j].val) spacingSub.CheckMenuItem(spaceOpts[j].id, true);
        }
        spacingSub.AppendTo(menu, MF_STRING, 'Button Spacing');

        // Show menu and delegate the result to the top-panel handler (same flow as middle panel)
        var result = menu.TrackPopupMenu(x, y);
        if (typeof topPanel_handleMenuResult === 'function') {
            return topPanel_handleMenuResult(result);
        }
        return result !== 0;
    } catch (e) {
        console.log('❌ TopPanel menu error:', e.message || e);
        return false;
    }
}



/**
 * Simple menu creator for other panels that might need basic menus
 */
function createSimpleMenu(title, items, x, y) {
    var menu = window.CreatePopupMenu();
    
    if (title) {
        menu.AppendMenuItem(MF_STRING, 1, title);
        menu.AppendMenuSeparator();
    }
    
    var id = 100; // Start IDs at 100 to avoid conflicts
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.separator) {
            menu.AppendMenuSeparator();
        } else {
            var flags = item.disabled ? MF_GRAYED : MF_STRING;
            menu.AppendMenuItem(flags, id, item.text);
            item.id = id; // Store ID for result handling
            id++;
        }
    }
    
    var result = menu.TrackPopupMenu(x, y);
    
    // Handle title click
    if (result === 1) {
        return false; // Show Spider Monkey panel menu
    }
    
    // Find selected item
    for (var i = 0; i < items.length; i++) {
        if (items[i].id === result && items[i].action) {
            items[i].action();
            return true;
        }
    }
    
    return false;
}

// ========================================================================================
// 🔹 UTILITY FUNCTIONS
// ========================================================================================

/**
 * Check if a menu item should be checked based on config
 */
function isMenuItemChecked(config, property, value) {
    if (typeof value === 'boolean') {
        return config[property] === value;
    } else {
        return config[property] === value;
    }
}

/**
 * Toggle a boolean config property
 */
function toggleConfigProperty(config, property) {
    config[property] = !config[property];
    return config[property];
}

/**
 * Set a config property to a specific value
 */
function setConfigProperty(config, property, value) {
    config[property] = value;
    return true;
}

console.log("    Right-Click Menu Module Ready");
