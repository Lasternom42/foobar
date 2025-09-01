// ========================================================================================
// 🔹 LEFT PANEL - PHASE 2 PURE DISPLAY LOGIC (Uses DataManager)
// ========================================================================================

'use strict';

var leftPanelConfig = {
    useAlbumArtist: false,
    part1Height: 200,
    part3Width: 120,
    part4Height: 150,
    textPadding: 15,
    itemSpacing: 5,
};

var leftPanelState = {
    initialized: false,
    
    // Layout bounds
    bounds: {
        part1: { x: 0, y: 0, w: 0, h: 0 },
        part2: { x: 0, y: 0, w: 0, h: 0 },
        part3: { x: 0, y: 0, w: 0, h: 0 },
        part4: { x: 0, y: 0, w: 0, h: 0 }
    },
    
    // Interaction
    clickAreas: {
        tracks: [],
        discs: [],
        albums: []
    },
    
    scrolls: {
        tracks: 0,
        albums: 0
    },
    
    mouseX: 0,
    mouseY: 0,
    
    // Image cache system
    imageCache: {},
    loadingImages: {}
};

// ========================================================================================
// 🔹 INITIALIZATION
// ========================================================================================

function initializeLeftPanel() {
    if (leftPanelState.initialized) return;
    
    calculateLeftPanelLayout();
    leftPanelState.initialized = true;
    
    console.log("✅ Left Panel Phase 2 Initialized - Pure Display Logic");
}

function calculateLeftPanelLayout() {
    if (!panelSizes || !panelSizes.leftPanel_W) {
        console.log("⚠️ Panel sizes not ready for left panel layout");
        return;
    }
    
    var totalW = panelSizes.leftPanel_W;
    var totalH = panelSizes.leftPanel_H;
    var baseX = panelSizes.leftPanel_X;
    var baseY = panelSizes.leftPanel_Y;
    
    leftPanelState.bounds.part1 = {
        x: baseX,
        y: baseY,
        w: totalW,
        h: leftPanelConfig.part1Height
    };
    
    leftPanelState.bounds.part4 = {
        x: baseX,
        y: baseY + totalH - leftPanelConfig.part4Height,
        w: totalW,
        h: leftPanelConfig.part4Height
    };
    
    var middleY = baseY + leftPanelConfig.part1Height;
    var middleH = totalH - leftPanelConfig.part1Height - leftPanelConfig.part4Height;
    
    leftPanelState.bounds.part2 = {
        x: baseX,
        y: middleY,
        w: totalW - leftPanelConfig.part3Width,
        h: middleH
    };
    
    leftPanelState.bounds.part3 = {
        x: baseX + totalW - leftPanelConfig.part3Width,
        y: middleY,
        w: leftPanelConfig.part3Width,
        h: middleH
    };
}

// ========================================================================================
// 🔹 PAINT FUNCTIONS (PURE DISPLAY - Gets data from DataManager)
// ========================================================================================

function paintLeftPanelContent(gr, panelSizes, uiFont, uiColors) {
    if (!leftPanelState.initialized) {
        initializeLeftPanel();
    }
    
    if (leftPanelState.bounds.part1.w !== panelSizes.leftPanel_W) {
        calculateLeftPanelLayout();
    }
    
    paintPart1_TrackInfo(gr, uiFont, uiColors);
    paintPart2_TrackList(gr, uiFont, uiColors);
    paintPart3_DiscDisplay(gr, uiFont, uiColors);
    paintPart4_Discography(gr, uiFont, uiColors);
}

function paintPart1_TrackInfo(gr, uiFont, uiColors) {
    var bounds = leftPanelState.bounds.part1;
    
    gr.FillSolidRect(bounds.x, bounds.y, bounds.w, bounds.h, uiColors.background_left);
    
    // PHASE 2: Get data from DataManager
    var trackInfo = DataManager.getTrackInfo();
    if (!trackInfo) {
        gr.GdiDrawText(
            "No Track Selected", 
            uiFont.default, 
            uiColors.secondaryText,
            bounds.x + leftPanelConfig.textPadding, 
            bounds.y + leftPanelConfig.textPadding,
            bounds.w - (leftPanelConfig.textPadding * 2), 
            bounds.h - (leftPanelConfig.textPadding * 2),
            DT_CENTER | DT_VCENTER
        );
        return;
    }
    
    try {
        var trackNumber = '';
        if (trackInfo.trackNumber > 0) {
            trackNumber = trackInfo.trackNumber + '. ';
        }
        
        var yPos = bounds.y + leftPanelConfig.textPadding;
        var lineHeight = 25;
        var textX = bounds.x + leftPanelConfig.textPadding;
        var textW = bounds.w - (leftPanelConfig.textPadding * 2);
        
        // Artist
        gr.GdiDrawText(trackInfo.artist, uiFont.large, uiColors.primaryText,
                      textX, yPos, textW, lineHeight, DT_LEFT | DT_VCENTER);
        yPos += lineHeight + 5;
        
        // Track title with number
        gr.GdiDrawText(trackNumber + trackInfo.title, uiFont.bold, uiColors.primaryText,
                      textX, yPos, textW, lineHeight, DT_LEFT | DT_VCENTER);
        yPos += lineHeight + 5;
        
        // Album
        gr.GdiDrawText(trackInfo.album, uiFont.default, uiColors.secondaryText,
                      textX, yPos, textW, lineHeight, DT_LEFT | DT_VCENTER);
        
        // Mode indicator (show if in selected mode)
        if (DataManager.mode === 'selected') {
            gr.GdiDrawText("📌 SELECTED", uiFont.small, uiColors.accent,
                          textX, bounds.y + bounds.h - 25, textW, 20, DT_RIGHT | DT_VCENTER);
        }
        
    } catch (e) {
        console.log("❌ Error painting Part 1:", e.message);
    }
}

function paintPart2_TrackList(gr, uiFont, uiColors) {
    var bounds = leftPanelState.bounds.part2;
    
    gr.FillSolidRect(bounds.x, bounds.y, bounds.w, bounds.h, uiColors.background);
    
    // PHASE 2: Get data from DataManager
    var tracks = DataManager.getDiscTracks();
    if (!tracks || tracks.length === 0) return;
    
    var itemHeight = 22;
    var maxVisible = Math.floor(bounds.h / itemHeight);
    var scroll = Math.min(leftPanelState.scrolls.tracks || 0, Math.max(0, tracks.length - maxVisible));
    var visibleTracks = tracks.slice(scroll, scroll + maxVisible);
    
    leftPanelState.clickAreas.tracks = [];
    
    var currentTrack = DataManager.getCurrentTrack();
    
    // IMPROVED: Use lodash for cleaner iteration
    _.forEach(visibleTracks, function(track, index) {
        var y = bounds.y + (index * itemHeight);
        
        var isSelected = currentTrack && currentTrack.Path === track.metadb.Path;
        var isPlaying = fb.IsPlaying && fb.GetNowPlaying() && fb.GetNowPlaying().Path === track.metadb.Path;
        
        if (isSelected) {
            gr.FillSolidRect(bounds.x, y, bounds.w, itemHeight, uiColors.highlight);
        }
        
        var trackText = track.trackNumber + '. ' + track.title;
        var textColor = isPlaying ? uiColors.accent : uiColors.primaryText;
        
        gr.GdiDrawText(trackText, uiFont.default, textColor,
                      bounds.x + 10, y, bounds.w - 20, itemHeight, DT_LEFT | DT_VCENTER);
        
        leftPanelState.clickAreas.tracks.push({
            x: bounds.x,
            y: y,
            w: bounds.w,
            h: itemHeight,
            track: track
        });
    });
}

function paintPart3_DiscDisplay(gr, uiFont, uiColors) {
    var bounds = leftPanelState.bounds.part3;
    
    gr.FillSolidRect(bounds.x, bounds.y, bounds.w, bounds.h, uiColors.background);
    
    // PHASE 2: Get data from DataManager
    var discs = DataManager.getDiscList();
    if (!discs || discs.length === 0) return;
    
    var discSize = 80;
    var labelHeight = 20;
    var itemHeight = discSize + labelHeight + 10;
    var maxVisible = Math.floor(bounds.h / itemHeight);
    
    leftPanelState.clickAreas.discs = [];
    
    // IMPROVED: Use lodash for cleaner iteration
    _.forEach(discs.slice(0, maxVisible), function(disc, i) {
        var itemY = bounds.y + 10 + (i * itemHeight);
        var startX = bounds.x + Math.floor((bounds.w - discSize) / 2);
        
        var isSelected = disc.discNumber === DataManager.selectedDiscNumber;
        
        if (isSelected) {
            gr.FillSolidRect(startX - 5, itemY - 5, discSize + 10, itemHeight, uiColors.highlight);
        }
        
        // Get album art for disc
        var discImage = getDiscImage(disc);
        
        if (discImage) {
            // IMPROVED: Use helpers.js _drawImage for better image rendering
            _drawImage(gr, discImage, startX, itemY, discSize, discSize, image.crop, uiColors.primaryText, 255);
        } else {
            gr.FillSolidRect(startX, itemY, discSize, discSize, uiColors.primary);
            gr.DrawRect(startX, itemY, discSize - 1, discSize - 1, 1, uiColors.primaryText);
        }
        
        var labelY = itemY + discSize + 5;
        var labelText = "CD " + disc.discNumber;
        
        gr.GdiDrawText(labelText, uiFont.default, uiColors.primaryText,
                       startX, labelY, discSize, labelHeight, DT_CENTER | DT_VCENTER);
        
        leftPanelState.clickAreas.discs.push({
            x: startX - 5,
            y: itemY - 5,
            w: discSize + 10,
            h: itemHeight,
            disc: disc
        });
    });
}

function paintPart4_Discography(gr, uiFont, uiColors) {
    var bounds = leftPanelState.bounds.part4;
    
    gr.FillSolidRect(bounds.x, bounds.y, bounds.w, bounds.h, uiColors.background);
    
    // PHASE 2: Get data from DataManager
    var albums = DataManager.getArtistAlbums();
    if (!albums || albums.length === 0) return;
    
    var albumW = 80;
    var albumH = 80;
    var spacing = 10;
    var itemW = albumW + spacing;
    var maxVisible = Math.floor((bounds.w - leftPanelConfig.textPadding * 2) / itemW);
    
    var scroll = Math.min(leftPanelState.scrolls.albums || 0, Math.max(0, albums.length - maxVisible));
    var visibleAlbums = albums.slice(scroll, scroll + maxVisible);
    
    leftPanelState.clickAreas.albums = [];
    
    var currentTrackInfo = DataManager.getTrackInfo();
    
    // IMPROVED: Use lodash for cleaner iteration
    _.forEach(visibleAlbums, function(album, i) {
        var x = bounds.x + leftPanelConfig.textPadding + (i * itemW);
        var y = bounds.y + leftPanelConfig.textPadding;
        
        var isSelected = currentTrackInfo && album.album === currentTrackInfo.album;
        
        if (isSelected) {
            gr.FillSolidRect(x - 5, y - 5, albumW + 10, albumH + 40, uiColors.highlight);
        }
        
        var img = getAlbumImage(album);
        if (img) {
            // IMPROVED: Use helpers.js _drawImage for better image rendering
            _drawImage(gr, img, x, y, albumW, albumH, image.crop, null, 255);
        } else {
            gr.FillSolidRect(x, y, albumW, albumH, uiColors.primary);
            gr.DrawRect(x, y, albumW - 1, albumH - 1, 1, uiColors.primaryText);
        }
        
        // Album text
        var albumText = album.album;
        if (typeof _lineWrap === 'function') {
            var wrappedText = _lineWrap(albumText, uiFont.small, albumW);
            albumText = wrappedText.length > 0 ? wrappedText[0] : albumText;
        }
        
        gr.GdiDrawText(albumText, uiFont.small, uiColors.primaryText,
                      x, y + albumH + 5, albumW, 20, DT_CENTER | DT_TOP);
        
        leftPanelState.clickAreas.albums.push({
            x: x - 5,
            y: y - 5,
            w: albumW + 10,
            h: albumH + 40,
            album: album
        });
    });
}

// ========================================================================================
// 🔹 INTERACTION FUNCTIONS (SIMPLIFIED - Uses DataManager)
// ========================================================================================

function leftPanel_onMouseClick(x, y) {
    // Check track clicks
    var clickedTrack = _.find(leftPanelState.clickAreas.tracks, function(area) {
        return x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h;
    });
    
    if (clickedTrack) {
        // PHASE 2: Use DataManager to select track
        DataManager.selectTrack(clickedTrack.track.metadb);
        window.Repaint();
        return;
    }
    
    // Check disc clicks
    var clickedDisc = _.find(leftPanelState.clickAreas.discs, function(area) {
        return x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h;
    });
    
    if (clickedDisc) {
        // PHASE 2: Use DataManager to select disc
        DataManager.onDiscSelected(clickedDisc.disc.discNumber);
        window.Repaint();
        return;
    }
    
    // Check album clicks
    var clickedAlbum = _.find(leftPanelState.clickAreas.albums, function(area) {
        return x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h;
    });
    
    if (clickedAlbum) {
        // PHASE 2: Use DataManager to select album
        DataManager.onAlbumSelected(clickedAlbum.album);
        window.Repaint();
        return;
    }
}

function leftPanel_onMouseWheel(x, y, delta) {
    leftPanelState.mouseX = x;
    leftPanelState.mouseY = y;
    
    // Part 2: Track scrolling
    var bounds = leftPanelState.bounds.part2;
    if (x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h) {
        var tracks = DataManager.getDiscTracks();
        var itemHeight = 22;
        var maxVisible = Math.floor(bounds.h / itemHeight);
        
        if (tracks.length > maxVisible) {
            var scrollAmount = 2;
            var maxScroll = Math.max(0, tracks.length - maxVisible);
            
            if (!leftPanelState.scrolls.tracks) leftPanelState.scrolls.tracks = 0;
            
            if (delta > 0) {
                leftPanelState.scrolls.tracks = Math.max(0, leftPanelState.scrolls.tracks - scrollAmount);
            } else {
                leftPanelState.scrolls.tracks = Math.min(maxScroll, leftPanelState.scrolls.tracks + scrollAmount);
            }
            
            window.Repaint();
        }
        return true;
    }
    
    // Part 4: Album scrolling
    bounds = leftPanelState.bounds.part4;
    if (x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h) {
        var albums = DataManager.getArtistAlbums();
        var albumWidth = 80;
        var albumSpacing = 10;
        var totalItemWidth = albumWidth + albumSpacing;
        var maxVisible = Math.floor((bounds.w - leftPanelConfig.textPadding * 2) / totalItemWidth);
        
        if (albums.length > maxVisible) {
            var scrollAmount = 2;
            var maxScroll = Math.max(0, albums.length - maxVisible);
            
            if (!leftPanelState.scrolls.albums) leftPanelState.scrolls.albums = 0;
            
            if (delta > 0) {
                leftPanelState.scrolls.albums = Math.max(0, leftPanelState.scrolls.albums - scrollAmount);
            } else {
                leftPanelState.scrolls.albums = Math.min(maxScroll, leftPanelState.scrolls.albums + scrollAmount);
            }
            
            window.Repaint();
        }
        return true;
    }
    
    return false;
}

// ========================================================================================
// 🔹 IMAGE HELPERS (Using existing albumart.js)
// ========================================================================================

function getDiscImage(disc) {
    if (!disc.tracks || disc.tracks.length === 0) return null;
    
    var metadb = disc.tracks[0].metadb;
    var cacheKey = 'disc_' + disc.discNumber + '_' + metadb.Path;
    
    if (leftPanelState.imageCache[cacheKey]) {
        return leftPanelState.imageCache[cacheKey];
    }
    
    if (leftPanelState.loadingImages[cacheKey]) {
        return null;
    }
    
    leftPanelState.loadingImages[cacheKey] = true;
    
    if (typeof getAlbumArtAsync === 'function') {
        getAlbumArtAsync(metadb, 80, function(artImage) {
            leftPanelState.imageCache[cacheKey] = artImage;
            delete leftPanelState.loadingImages[cacheKey];
            window.Repaint();
        }, 'cd');
    }
    
    return null;
}

function getAlbumImage(album) {
    if (!album.sampleTrack) return null;
    
    var metadb = album.sampleTrack;
    var cacheKey = 'album_' + album.album + '_' + metadb.Path;
    
    if (leftPanelState.imageCache[cacheKey]) {
        return leftPanelState.imageCache[cacheKey];
    }
    
    if (leftPanelState.loadingImages[cacheKey]) {
        return null;
    }
    
    leftPanelState.loadingImages[cacheKey] = true;
    
    if (typeof getAlbumArtAsync === 'function') {
        getAlbumArtAsync(metadb, 128, function(artImage) {
            leftPanelState.imageCache[cacheKey] = artImage;
            delete leftPanelState.loadingImages[cacheKey];
            window.Repaint();
        }, 'album');
    }
    
    return null;
}

// ========================================================================================
// 🔹 UTILITY FUNCTIONS
// ========================================================================================

function updateLeftPanelLayout() {
    if (leftPanelState.initialized) {
        calculateLeftPanelLayout();
    }
}

function clearLeftPanelImageCache() {
    leftPanelState.imageCache = {};
    leftPanelState.loadingImages = {};
    console.log("🗑️ Cleared left panel image cache");
}

console.log("✅ Left Panel Phase 2 Ready - Pure Display Logic using DataManager");