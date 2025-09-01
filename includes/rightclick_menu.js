// ========================================================================================
// 🖱️ RIGHT-CLICK MENU - YOUR EXISTING CODE WITH TINY LODASH IMPROVEMENTS  
// ========================================================================================

'use strict';

// Your existing helper functions with minimal lodash enhancements:

function createMenuItem(id, text, type, options) {
    var defaults = {
        id: id,
        text: text,
        type: type || 'action',
        checked: false,
        disabled: false,
        indent: false
    };
    
    // TINY IMPROVEMENT: Better lodash assign fallback
    return _.assign ? _.assign(defaults, options || {}) : 
           Object.assign ? Object.assign(defaults, options || {}) :
           (function() {
               var result = {};
               for (var key in defaults) result[key] = defaults[key];
               for (var key in (options || {})) result[key] = options[key];
               return result;
           })();
}

function createMenuSection(name, subsections) {
    return {
        name: name,
        // TINY IMPROVEMENT: Use lodash validation
        subsections: _.isArray ? (_.isArray(subsections) ? subsections : []) : subsections || []
    };
}

function createMenuSubsection(name, items) {
    return {
        name: name,
        // TINY IMPROVEMENT: Use lodash validation  
        items: _.isArray ? (_.isArray(items) ? items : []) : items || []
    };
}

function createMenuSeparator() {
    return { separator: true };
}

function createRadioGroup(groupName, options) {
    // TINY IMPROVEMENT: Your existing lodash pattern, just cleaner fallback
    if (_.map) {
        return _.map(options, function(option) {
            return createMenuItem(option.id, option.text, 'radio', {
                group: groupName,
                checked: option.checked || false
            });
        });
    } else {
        var result = [];
        for (var i = 0; i < options.length; i++) {
            var option = options[i];
            result.push(createMenuItem(option.id, option.text, 'radio', {
                group: groupName,
                checked: option.checked || false
            }));
        }
        return result;
    }
}

// Your existing functions with your existing lodash patterns (unchanged):

function middlePanel_handleMenuResult(result) {
    if (result === 0) return false;
    
    var actions = _.assign(
        // Playback actions
        {
            100: function() { fb.PlayOrPause(); },
            101: function() { fb.Stop(); },
            102: function() { fb.Next(); },
            103: function() { fb.Prev(); },
            110: function() { return middlePanel_executeAction(0); },
            111: function() { return middlePanel_executeAction(1); }
        },
        
        // Art source actions
        _.fromPairs(_.map([
            [1100, 0], [1101, 1]
        ], function(pair) {
            return [pair[0], function() { 
                middlePanel_Config.artSource = pair[1]; 
                middlePanel_refresh(); 
            }];
        })),
        
        // Scale mode actions  
        _.fromPairs(_.map([
            [1110, 0], [1111, 1], [1112, 2], [1113, 3]
        ], function(pair) {
            return [pair[0], function() { 
                middlePanel_Config.scaleMode = pair[1]; 
                middlePanel_repaint(); 
            }];
        })),
        
        // Action buttons
        {
            1120: function() { middlePanel_refresh(); },
            1121: function() { middlePanel_clearCache(); }
        },
        
        // Text display toggles
        _.fromPairs(_.map([
            [1200, 'showTrackInfo'], [1201, 'showAlbumInfo'],
            [1230, 'showArtist'], [1231, 'showAlbum'], 
            [1232, 'showYear'], [1233, 'showTrackNumber']
        ], function(pair) {
            return [pair[0], function() {
                middlePanel_Config[pair[1]] = !middlePanel_Config[pair[1]];
                middlePanel_repaint();
            }];
        })),
        
        // Font size actions
        _.fromPairs(_.map([
            [1210, 12], [1211, 16], [1212, 20], [1213, 24]
        ], function(pair) {
            return [pair[0], function() {
                middlePanel_Config.fontSize = pair[1];
                middlePanel_repaint();
            }];
        })),
        
        // Position actions
        _.fromPairs(_.map([
            [1220, 0], [1221, 1], [1222, 2]
        ], function(pair) {
            return [pair[0], function() {
                middlePanel_Config.overlayPosition = pair[1];
                middlePanel_repaint();
            }];
        })),
        
        // Click action
        _.fromPairs(_.map([
            [1300, 0], [1301, 1], [1302, 2]
        ], function(pair) {
            return [pair[0], function() {
                middlePanel_Config.clickAction = pair[1];
            }];
        })),
        
        // Wheel action
        _.fromPairs(_.map([
            [1310, 0], [1311, 1], [1312, 2]
        ], function(pair) {
            return [pair[0], function() {
                middlePanel_Config.wheelAction = pair[1];
            }];
        }))
    );
    
    if (actions[result]) {
        return actions[result]() || true;
    }
    
    return false;
}

// Simple compatibility functions:
function createPanelMenu(menuConfig, x, y) {
    var menu = window.CreatePopupMenu();
    return menu.TrackPopupMenu(x, y);
}

function middlePanel_repaint() {
    window.Repaint();
}

// ========================================================================================
// 🔹 EXISTING MAIN MENU FUNCTION (Enhanced lodash usage only)
// ========================================================================================

function createMiddlePanelMenu(config, x, y, callbacks) {
    try {
        var menu = window.CreatePopupMenu();
        
        // Get track info from DataManager if available
        var trackInfo = (typeof DataManager !== 'undefined') ? DataManager.getTrackInfo() : null;
        
        // Add playback section if we have a track
        if (trackInfo && fb.IsPlaying) {
            // ENHANCED: Use lodash for playback actions
            var playbackActions = [
                { id: 100, text: 'Play/Pause' },
                { id: 101, text: 'Stop', disabled: !fb.IsPlaying },
                { id: 102, text: 'Next' },
                { id: 103, text: 'Previous' }
            ];
            
            _.forEach(playbackActions, function(action) {
                var flags = action.disabled ? (MF_STRING | MF_GRAYED) : MF_STRING;
                menu.AppendMenuItem(flags, action.id, action.text);
            });
            
            menu.AppendMenuSeparator();
            menu.AppendMenuItem(MF_STRING, 110, 'Open Folder');
            menu.AppendMenuItem(MF_STRING, 111, 'Properties');
            menu.AppendMenuSeparator();
        }
        
        // Add existing submenu systems
        var albumArtSubmenu = createAlbumArtSubmenu();
        albumArtSubmenu.AppendTo(menu, MF_STRING, "Album Art");
        
        var textDisplaySubmenu = createTextDisplaySubmenu();
        textDisplaySubmenu.AppendTo(menu, MF_STRING, "Text Display");
        
        var interactionSubmenu = createInteractionSubmenu();
        interactionSubmenu.AppendTo(menu, MF_STRING, "Interaction");
        
        var result = menu.TrackPopupMenu(x, y);
        return middlePanel_handleMenuResult(result, callbacks);
        
    } catch (e) {
        console.log("❌ Error creating middle panel menu:", e.message);
        return false;
    }
}

// ========================================================================================
// 🔹 EXISTING RESULT HANDLER (Enhanced lodash usage only) 
// ========================================================================================

function middlePanel_handleMenuResult(result, callbacks) {
    if (result === 0) return false;
    
    try {
        // ENHANCED: Use lodash for cleaner action mapping (existing functionality preserved)
        var actions = _.assign(
            // Playback actions (existing)
            {
                100: function() { fb.PlayOrPause(); },
                101: function() { fb.Stop(); },
                102: function() { fb.Next(); },
                103: function() { fb.Prev(); },
                110: function() { return middlePanel_executeAction(0); },
                111: function() { return middlePanel_executeAction(1); }
            },
            
            // Art source actions (enhanced with lodash)
            _.fromPairs(_.map([
                [1100, 0], [1101, 1]
            ], function(pair) {
                return [pair[0], function() { 
                    middlePanel_Config.artSource = pair[1]; 
                    if (callbacks && callbacks.refresh) callbacks.refresh();
                }];
            })),
            
            // Scale mode actions (enhanced with lodash)
            _.fromPairs(_.map([
                [1110, 0], [1111, 1], [1112, 2], [1113, 3]
            ], function(pair) {
                return [pair[0], function() { 
                    middlePanel_Config.scaleMode = pair[1]; 
                    if (callbacks && callbacks.repaint) callbacks.repaint();
                }];
            })),
            
            // Action buttons (existing)
            {
                1120: function() { 
                    if (callbacks && callbacks.refresh) callbacks.refresh();
                },
                1121: function() { 
                    if (callbacks && callbacks.clearCache) callbacks.clearCache();
                }
            },
            
            // Text display toggles (enhanced with lodash)
            _.fromPairs(_.map([
                [1200, 'showTrackInfo'], [1201, 'showAlbumInfo'],
                [1230, 'showArtist'], [1231, 'showAlbum'], 
                [1232, 'showYear'], [1233, 'showTrackNumber']
            ], function(pair) {
                return [pair[0], function() {
                    middlePanel_Config[pair[1]] = !middlePanel_Config[pair[1]];
                    if (callbacks && callbacks.repaint) callbacks.repaint();
                }];
            })),
            
            // Font size actions (enhanced with lodash)
            _.fromPairs(_.map([
                [1210, 12], [1211, 16], [1212, 20], [1213, 24]
            ], function(pair) {
                return [pair[0], function() {
                    middlePanel_Config.fontSize = pair[1];
                    if (callbacks && callbacks.repaint) callbacks.repaint();
                }];
            })),
            
            // Position actions (enhanced with lodash)
            _.fromPairs(_.map([
                [1220, 0], [1221, 1], [1222, 2]
            ], function(pair) {
                return [pair[0], function() {
                    middlePanel_Config.overlayPosition = pair[1];
                    if (callbacks && callbacks.repaint) callbacks.repaint();
                }];
            })),
            
            // Click action (enhanced with lodash)
            _.fromPairs(_.map([
                [1300, 0], [1301, 1], [1302, 2]
            ], function(pair) {
                return [pair[0], function() {
                    middlePanel_Config.clickAction = pair[1];
                    if (callbacks && callbacks.configChanged) callbacks.configChanged();
                }];
            })),
            
            // Wheel action (enhanced with lodash)
            _.fromPairs(_.map([
                [1310, 0], [1311, 1], [1312, 2]
            ], function(pair) {
                return [pair[0], function() {
                    middlePanel_Config.wheelAction = pair[1];
                    if (callbacks && callbacks.configChanged) callbacks.configChanged();
                }];
            }))
        );
        
        if (actions[result]) {
            return actions[result]() || true;
        }
        
        return false;
        
    } catch (e) {
        console.log("❌ Error handling menu result:", e.message);
        return false;
    }
}

// ========================================================================================
// 🔹 EXISTING COMPATIBILITY FUNCTIONS (unchanged)
// ========================================================================================

/**
 * Simple panel menu creator for backward compatibility
 */
function createPanelMenu(menuConfig, x, y) {
    var menu = window.CreatePopupMenu();
    
    // Simple flat menu creation (existing functionality)
    if (menuConfig && menuConfig.sections) {
        _.forEach(menuConfig.sections, function(section, index) {
            if (index > 0) {
                menu.AppendMenuSeparator();
            }
            
            if (section.items) {
                _.forEach(section.items, function(item) {
                    if (item.separator) {
                        menu.AppendMenuSeparator();
                    } else {
                        var flags = item.disabled ? (MF_STRING | MF_GRAYED) : MF_STRING;
                        menu.AppendMenuItem(flags, item.id, item.text);
                        
                        if (item.type === 'checkbox' && item.checked) {
                            menu.CheckMenuItem(item.id, true);
                        }
                    }
                });
            }
        });
    }
    
    return menu.TrackPopupMenu(x, y);
}

/**
 * Simple repaint function (unchanged)
 */
function middlePanel_repaint() {
    window.Repaint();
}

console.log("✅ Right-Click Menu System Ready (Enhanced lodash usage)");