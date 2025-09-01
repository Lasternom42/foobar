'use strict';

// ========================================================================================
// 🔹 TOP PANEL - CLEAN VERSION WITHOUT SYNTAX ERRORS
// ========================================================================================

// ========================================================================================
// 🔹 CONFIGURATION
// ========================================================================================

var topPanel_Config = {
    showButtons: true,
    buttonSize: 40,
    buttonSpacing: 10,
    showLabels: false,
    labelOffset: 45,
    
    buttonDefinitions: [
        { 
            id: 'shuffle', 
            img: 'bt_shuffle.png', 
            tooltip: 'Shuffle',
            action: function() { fb.RunMainMenuCommand('Playback/Random'); }
        },
        { 
            id: 'previous', 
            img: 'bt_prev.png', 
            tooltip: 'Previous Track',
            action: function() { fb.Prev(); }
        },
        { 
            id: 'play', 
            img: 'bt_play.png', 
            tooltip: 'Play/Pause',
            action: function() { topPanel_togglePlayPause(); }
        },
        { 
            id: 'next', 
            img: 'bt_next.png', 
            tooltip: 'Next Track',
            action: function() { fb.Next(); }
        },
        { 
            id: 'repeat', 
            img: 'bt_repeat.png', 
            tooltip: 'Repeat',
            action: function() { fb.RunMainMenuCommand('Playback/Repeat'); }
        }
    ],
    skinPath: 'LM\\skin\\'
};

// ========================================================================================
// 🔹 STATE VARIABLES
// ========================================================================================

var topPanel_State = {
    initialized: false,
    buttons: null,
    lastButtonState: null,
    mouseX: 0,
    mouseY: 0
};

// ========================================================================================
// 🔹 INITIALIZATION
// ========================================================================================

function topPanel_init() {
    if (topPanel_State.initialized) return;
    
    topPanel_createButtons();
    topPanel_State.initialized = true;
}

function topPanel_createButtons() {
    if (!panelSizes || !panelSizes.topPanel_center_X) return;
    
    topPanel_State.buttons = new _buttons();
    topPanel_State.buttons.buttons = {};
    
    var totalButtons = topPanel_Config.buttonDefinitions.length;
    var totalWidth = (totalButtons * topPanel_Config.buttonSize) + ((totalButtons - 1) * topPanel_Config.buttonSpacing);
    var startX = panelSizes.topPanel_center_X - (totalWidth / 2);
    var buttonY = panelSizes.topPanel_center_Y - (topPanel_Config.buttonSize / 2);
    var currentX = startX;
    
    for (var i = 0; i < topPanel_Config.buttonDefinitions.length; i++) {
        var btn = topPanel_Config.buttonDefinitions[i];
        var imgPath = fb.ComponentPath + topPanel_Config.skinPath;
        var img = null;
        
        if (btn.id === 'play') {
            img = topPanel_getPlayPauseImage();
        } else {
            img = _img(imgPath + btn.img);
        }
        
        if (img) {
            topPanel_State.buttons.buttons[btn.id] = new _button(
                currentX, buttonY, 
                topPanel_Config.buttonSize, topPanel_Config.buttonSize,
                { normal: img },
                btn.action,
                btn.tooltip
            );
        }
        
        currentX += topPanel_Config.buttonSize + topPanel_Config.buttonSpacing;
    }
}

// ========================================================================================
// 🔹 BUTTON HELPER FUNCTIONS
// ========================================================================================

function topPanel_getPlayPauseImage() {
    var imgPath = fb.ComponentPath + topPanel_Config.skinPath;
    var isPlaying = fb.IsPlaying && !fb.IsPaused;
    var imgName = isPlaying ? "bt_pause.png" : "bt_play.png";
    return _img(imgPath + imgName);
}

function topPanel_togglePlayPause() {
    fb.PlayOrPause();
    topPanel_updatePlayPauseButton();
}

function topPanel_updatePlayPauseButton() {
    if (!topPanel_State.buttons || !topPanel_State.buttons.buttons || !topPanel_State.buttons.buttons.play) {
        return;
    }
    
    var btn = topPanel_State.buttons.buttons.play;
    btn.img_normal = topPanel_getPlayPauseImage();
    btn.img = btn.img_normal;
    window.RepaintRect(btn.x, btn.y, btn.w, btn.h);
}

// ========================================================================================
// 🔹 PAINT FUNCTIONS
// ========================================================================================

function topPanel_paint(gr, panelSizes, uiFont, uiColors) {
    if (!topPanel_State.initialized) topPanel_init();
    
    gr.FillSolidRect(panelSizes.topPanel_X, panelSizes.topPanel_Y, 
                     panelSizes.topPanel_W, panelSizes.topPanel_H, 
                     uiColors.background_top);
    
    if (topPanel_Config.showButtons) {
        topPanel_paintButtons(gr, uiFont, uiColors);
    }
}

function topPanel_paintButtons(gr, uiFont, uiColors) {
    if (!topPanel_State.buttons || !topPanel_State.buttons.buttons) return;
    
    topPanel_State.buttons.paint(gr);
    
    if (topPanel_Config.showLabels) {
        topPanel_paintButtonLabels(gr, uiFont, uiColors);
    }
}

function topPanel_paintButtonLabels(gr, uiFont, uiColors) {
    for (var i = 0; i < topPanel_Config.buttonDefinitions.length; i++) {
        var btnConfig = topPanel_Config.buttonDefinitions[i];
        var btn = topPanel_State.buttons.buttons[btnConfig.id];
        
        if (btn) {
            var labelY = btn.y + topPanel_Config.labelOffset;
            gr.GdiDrawText(
                btnConfig.tooltip, uiFont.default, uiColors.secondaryText,
                btn.x, labelY, btn.w, 20,
                DT_CENTER | DT_VCENTER
            );
        }
    }
}

// ========================================================================================
// 🔹 MENU SYSTEM
// ========================================================================================

function topPanel_showMenu(x, y) {
    var menu = {
        title: 'Top Panel',
        sections: [
            {
                name: 'Button Settings',
                subsections: [
                    {
                        name: 'Display Options',
                        items: [
                            createMenuItem(2100, 'Show Buttons', 'checkbox', { checked: topPanel_Config.showButtons }),
                            createMenuItem(2101, 'Show Button Labels', 'checkbox', { checked: topPanel_Config.showLabels })
                        ]
                    },
                    {
                        name: 'Button Size',
                        items: [
                            createMenuItem(2110, 'Small (30px)', 'radio', { group: 'buttonsize', checked: topPanel_Config.buttonSize === 30 }),
                            createMenuItem(2111, 'Medium (40px)', 'radio', { group: 'buttonsize', checked: topPanel_Config.buttonSize === 40 }),
                            createMenuItem(2112, 'Large (50px)', 'radio', { group: 'buttonsize', checked: topPanel_Config.buttonSize === 50 }),
                            createMenuItem(2113, 'Extra Large (60px)', 'radio', { group: 'buttonsize', checked: topPanel_Config.buttonSize === 60 })
                        ]
                    },
                    {
                        name: 'Button Spacing',
                        items: [
                            createMenuItem(2120, 'Tight (5px)', 'radio', { group: 'buttonspacing', checked: topPanel_Config.buttonSpacing === 5 }),
                            createMenuItem(2121, 'Normal (10px)', 'radio', { group: 'buttonspacing', checked: topPanel_Config.buttonSpacing === 10 }),
                            createMenuItem(2122, 'Wide (15px)', 'radio', { group: 'buttonspacing', checked: topPanel_Config.buttonSpacing === 15 }),
                            createMenuItem(2123, 'Extra Wide (20px)', 'radio', { group: 'buttonspacing', checked: topPanel_Config.buttonSpacing === 20 })
                        ]
                    }
                ]
            }
        ]
    };
    
    var result = createPanelMenu(menu, x, y);
    if (result > 0) topPanel_handleMenuResult(result);
}

function topPanel_handleMenuResult(id) {
    if (id === 0) return;
    
    switch (id) {
        case 2100: topPanel_Config.showButtons = !topPanel_Config.showButtons; topPanel_repaint(); break;
        case 2101: topPanel_Config.showLabels = !topPanel_Config.showLabels; topPanel_repaint(); break;
        
        case 2110: topPanel_Config.buttonSize = 30; topPanel_createButtons(); topPanel_repaint(); break;
        case 2111: topPanel_Config.buttonSize = 40; topPanel_createButtons(); topPanel_repaint(); break;
        case 2112: topPanel_Config.buttonSize = 50; topPanel_createButtons(); topPanel_repaint(); break;
        case 2113: topPanel_Config.buttonSize = 60; topPanel_createButtons(); topPanel_repaint(); break;
        
        case 2120: topPanel_Config.buttonSpacing = 5; topPanel_createButtons(); topPanel_repaint(); break;
        case 2121: topPanel_Config.buttonSpacing = 10; topPanel_createButtons(); topPanel_repaint(); break;
        case 2122: topPanel_Config.buttonSpacing = 15; topPanel_createButtons(); topPanel_repaint(); break;
        case 2123: topPanel_Config.buttonSpacing = 20; topPanel_createButtons(); topPanel_repaint(); break;
    }
}

// ========================================================================================
// 🔹 EVENT HANDLERS
// ========================================================================================

function topPanel_onMouseMove(x, y) {
    topPanel_State.mouseX = x;
    topPanel_State.mouseY = y;
    
    if (topPanel_State.buttons) {
        return topPanel_State.buttons.move(x, y);
    }
    return false;
}

function topPanel_onRightClick(x, y) {
    if (topPanel_isInBounds(x, y)) {
        topPanel_showMenu(x, y);
        return true;
    }
    return false;
}

function topPanel_onLeftClick(x, y) {
    if (topPanel_isInBounds(x, y)) {
        if (topPanel_State.buttons && topPanel_Config.showButtons) {
            return topPanel_State.buttons.lbtn_up(x, y);
        }
    }
    return false;
}

function topPanel_onMouseLeave() {
    if (topPanel_State.buttons) {
        topPanel_State.buttons.leave();
    }
}

// ========================================================================================
// 🔹 UTILITY FUNCTIONS
// ========================================================================================

function topPanel_isInBounds(x, y) {
    return panelSizes && 
           x >= panelSizes.topPanel_X && x <= panelSizes.topPanel_X + panelSizes.topPanel_W &&
           y >= panelSizes.topPanel_Y && y <= panelSizes.topPanel_Y + panelSizes.topPanel_H;
}

function topPanel_refresh() {
    topPanel_createButtons();
    topPanel_repaint();
}

function topPanel_repaint() {
    window.Repaint();
}

// ========================================================================================
// 🔹 EXPORTS (for main.js integration)
// ========================================================================================

function paintTopPanelContent(gr, panelSizes, uiFont, uiColors) {
    topPanel_paint(gr, panelSizes, uiFont, uiColors);
}

function topPanel_on_mouse_move(x, y) {
    return topPanel_onMouseMove(x, y);
}

function topPanel_on_mouse_rbtn_up(x, y) {
    return topPanel_onRightClick(x, y);
}

function topPanel_on_mouse_lbtn_up(x, y) {
    return topPanel_onLeftClick(x, y);
}

function topPanel_on_mouse_leave() {
    topPanel_onMouseLeave();
}

function handleTopPanelMouseMove(x, y) {
    return topPanel_on_mouse_move(x, y);
}

function handleTopPanelMouseDown(x, y) {
    return topPanel_on_mouse_lbtn_up(x, y);
}

function handleTopPanelMouseLeave() {
    topPanel_on_mouse_leave();
}

function repositionButtons_top() {
    if (topPanel_State.initialized && MainApp && MainApp.initialized) {
        topPanel_createButtons();
    }
}

function createTopButtonsAfterLayout() {
    topPanel_init();
}

function initializeTopPanel() {
    topPanel_init();
}

function updateTopPanelLayout() {
    if (topPanel_State.initialized) {
        topPanel_createButtons();
    }
}

function updatePlayPauseButton() {
    topPanel_updatePlayPauseButton();
}

console.log("✅ Top Panel Module Ready");