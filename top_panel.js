'use strict';

// ========================================================================================
// 🔹 TOP PANEL - CLEAN VERSION (kept to your structure) + minimal shims for menu helpers
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
    console.log('topPanel_init');
	if (topPanel_State.initialized) return;
    topPanel_createButtons();
    topPanel_State.initialized = true;
	console.log("    Top Panel - Initialized");
}

function topPanel_createButtons() {
    console.log('topPanel_createButtons);'); 
	
	if (!panelSizes || !panelSizes.topPanel_center_X) return;

    // reset container + our id map
    topPanel_State.buttons = new _buttons();
    topPanel_State.buttons.buttons = [];     // <-- must be an array
    topPanel_State.map = {};                 // <-- id -> button reference

    var totalButtons = topPanel_Config.buttonDefinitions.length;
    var totalWidth = (totalButtons * topPanel_Config.buttonSize) + ((totalButtons - 1) * topPanel_Config.buttonSpacing);
    var startX = panelSizes.topPanel_center_X - (totalWidth / 2);
    var buttonY = panelSizes.topPanel_center_Y - (topPanel_Config.buttonSize / 2);
    var currentX = startX;

    for (var i = 0; i < topPanel_Config.buttonDefinitions.length; i++) {
        var def = topPanel_Config.buttonDefinitions[i];
        var imgPath = fb.ComponentPath + topPanel_Config.skinPath;
        var img = (def.id === 'play') ? topPanel_getPlayPauseImage() : _img(imgPath + def.img);
        if (!img) { currentX += topPanel_Config.buttonSize + topPanel_Config.buttonSpacing; continue; }

        var btnObj = new _button(
            currentX, buttonY,
            topPanel_Config.buttonSize, topPanel_Config.buttonSize,
            { normal: img, hover: img, down: img },   // safe: use same img for all states
            def.action,
            def.tooltip
        );

        topPanel_State.buttons.buttons.push(btnObj);  // <-- add to container array (so .paint works)
        topPanel_State.map[def.id] = btnObj;          // <-- keep an id map for quick access (labels, play/pause)

        currentX += topPanel_Config.buttonSize + topPanel_Config.buttonSpacing;
    }

    // (optional) quick sanity log:
    // console.log('TopPanel buttons:', topPanel_State.buttons.buttons.length);
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
    var btn = topPanel_State.map && topPanel_State.map.play;
    if (!btn) return;
    btn.img_normal = topPanel_getPlayPauseImage();
    btn.img = btn.img_normal;
    window.RepaintRect(btn.x, btn.y, btn.w, btn.h);
}

// ========================================================================================
// 🔹 PAINT FUNCTIONS
// ========================================================================================

function topPanel_paint(gr, panelSizes, uiFont, uiColors) {
   
	console.log("✅ pain?");
   if (!topPanel_State.initialized) topPanel_init();
    
    gr.FillSolidRect(
        panelSizes.topPanel_X, panelSizes.topPanel_Y, 
        panelSizes.topPanel_W, panelSizes.topPanel_H, 
        (uiColors && (uiColors.background_top || uiColors.background)) || _RGB(35,35,35)
    );
    
    if (topPanel_Config.showButtons) {
        topPanel_paintButtons(gr, uiFont, uiColors);
    }
}

function topPanel_paintButtons(gr, uiFont, uiColors) {
    console.log("✅ painbutton?");
	
	if (!topPanel_State.buttons || !topPanel_State.buttons.buttons) return;
    topPanel_State.buttons.paint(gr);
    
    if (topPanel_Config.showLabels) {
        topPanel_paintButtonLabels(gr, uiFont, uiColors);
    }
}

function topPanel_paintButtonLabels(gr, uiFont, uiColors) {
    if (!topPanel_State.map) return;
    for (var i = 0; i < topPanel_Config.buttonDefinitions.length; i++) {
        var def = topPanel_Config.buttonDefinitions[i];
        var btn = topPanel_State.map[def.id];
        if (!btn) continue;
        var labelY = btn.y + topPanel_Config.labelOffset;
        gr.GdiDrawText(
            def.tooltip, uiFont.default, uiColors.secondaryText,
            btn.x, labelY, btn.w, 20,
            DT_CENTER | DT_VCENTER
        );
    }
}

// ========================================================================================
// 🔹 MENU SYSTEM
// ========================================================================================

function topPanel_showMenu(x, y) {
    if (!topPanel_isInBounds(x, y)) return false;
    if (typeof createTopPanelMenu === 'function') {
        return createTopPanelMenu(topPanel_Config, x, y);
    }
    return false;
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
        
        case 2120: topPanel_Config.buttonSpacing = 5;  topPanel_createButtons(); topPanel_repaint(); break;
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

console.log('    Top Panel Module:                      Ready');
