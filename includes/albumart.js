// ========================================================================================
// 🔹 SIMPLIFIED ALBUM ART SYSTEM (NO CACHING)
// ========================================================================================

'use strict';

// ========================================================================================
// 🔹 ALBUM ART HELPER FUNCTIONS
// ========================================================================================

var AlbumArtHelper = {
    // Configuration
    config: {
        folderImages: ['folder.jpg', 'folder.png', 'cover.jpg', 'cover.png', 'front.jpg', 'front.png'],
        fallbackImages: {
            album: 'LM\\skin\\no_album_art.png',
            cd: 'LM\\skin\\CD_empty.png'
        }
    },
    
    // Get folder art
    getFolderArt: function(metadb) {
        if (!metadb) return null;
        
        try {
            var folder = metadb.Path.substring(0, metadb.Path.lastIndexOf('\\') + 1);
            
            for (var i = 0; i < this.config.folderImages.length; i++) {
                var imgPath = folder + this.config.folderImages[i];
                if (fso.FileExists(imgPath)) {
                    var img = gdi.Image(imgPath);
                    if (img) return img;
                }
            }
        } catch (e) {}
        return null;
    },
    
    // Get embedded art
    getEmbeddedArt: function(metadb, artId) {
        if (!metadb) return null;
        
        try {
            return utils.GetAlbumArtV2(metadb, artId || 0);
        } catch (e) {
            return null;
        }
    },
    
    // Get fallback image
    getFallbackImage: function(type) {
        try {
            var imagePath = fb.ComponentPath + this.config.fallbackImages[type || 'album'];
            return gdi.Image(imagePath);
        } catch (e) {
            return null;
        }
    }
};

// ========================================================================================
// 🔹 ENHANCED _albumart CLASS (NO CACHING)
// ========================================================================================

function _albumart (x, y, w, h) {
    // ========================================================================================
    // 🔹 EXISTING FUNCTIONALITY (UNCHANGED FOR BACKWARD COMPATIBILITY)
    // ========================================================================================
    
    this.paint = (gr) => {
        if (this.properties.cd.enabled) {
            if (this.properties.shadow.enabled) {
                _drawImage(gr, this.images.shadow, this.x, this.y, this.w, this.h);
            }
            _drawImage(gr, this.images.case, this.x, this.y, this.w, this.h);
            if (this.img) {
                const ratio = Math.min(this.w / this.images.case.Width, this.h / this.images.case.Height);
                const nw = 488 * ratio;
                const nh = 476 * ratio;
                const nx = this.x + Math.floor((this.w - (452 * ratio)) / 2);
                const ny = this.y + Math.floor((this.h - nh) / 2);
                _drawImage(gr, this.img, nx, ny, nw, nh, this.properties.aspect.value);
            }
            _drawImage(gr, this.images.semi, this.x, this.y, this.w, this.h);
            if (this.properties.gloss.enabled) {
                _drawImage(gr, this.images.gloss, this.x, this.y, this.w, this.h);
            }
        } else if (this.img) {
            _drawImage(gr, this.img, this.x, this.y, this.w, this.h, this.properties.aspect.value);
        }
    }
    
    this.metadb_changed = () => {
        this.img = null;
        this.tooltip = this.path = '';
        if (panel.metadb) {
            get_album_art(this);
        }
    }
    
    // ========================================================================================
    // 🔹 NEW SIMPLIFIED METHODS (NO CACHING)
    // ========================================================================================
    
    // Get art for any metadb with specific size and callback (simplified)
    this.getArtAsync = function(metadb, targetSize, callback, artType) {
        if (!metadb) {
            if (callback) callback(null);
            return;
        }
        
        var type = artType || 'album';
        var size = targetSize || 256;
        
        // Load async without caching
        setTimeout(function() {
            try {
                var artImage = null;
                
                if (type === 'cd') {
                    // For CD art, try embedded disc art first
                    artImage = AlbumArtHelper.getEmbeddedArt(metadb, 2); // Disc art
                    if (!artImage) {
                        artImage = AlbumArtHelper.getFolderArt(metadb);
                    }
                    if (!artImage) {
                        artImage = AlbumArtHelper.getFallbackImage('cd');
                    }
                } else {
                    // For album art, folder first
                    artImage = AlbumArtHelper.getFolderArt(metadb);
                    if (!artImage) {
                        artImage = AlbumArtHelper.getEmbeddedArt(metadb, 0);
                    }
                    if (!artImage) {
                        artImage = AlbumArtHelper.getFallbackImage('album');
                    }
                }
                
                if (artImage) {
                    // Resize if needed
                    if (size > 0 && (artImage.Width > size || artImage.Height > size)) {
                        artImage = artImage.Resize(size, size);
                    }
                    
                    // Callback with result (no caching)
                    if (callback) callback(artImage);
                } else {
                    if (callback) callback(null);
                }
            } catch (e) {
                console.log("❌ Error loading art async:", e.message);
                if (callback) callback(null);
            }
        }, 1); // Minimal delay to make it async
    }
    
    // Get multiple art sources with priority (simplified)
    this.getArtWithSources = function(metadb, sources, targetSize, callback) {
        var self = this;
        var sourceIndex = 0;
        
        function tryNextSource() {
            if (sourceIndex >= sources.length) {
                // No more sources, return fallback
                var fallback = AlbumArtHelper.getFallbackImage('album');
                if (callback) callback(fallback);
                return;
            }
            
            var source = sources[sourceIndex];
            sourceIndex++;
            
            self.getArtAsync(metadb, targetSize, function(result) {
                if (result) {
                    if (callback) callback(result);
                } else {
                    tryNextSource();
                }
            }, source);
        }
        
        tryNextSource();
    }
    
    // ========================================================================================
    // 🔹 EXISTING PROPERTIES (UNCHANGED)
    // ========================================================================================
    
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.mx = 0;
    this.my = 0;
    this.tooltip = '';
    this.img = null;
    this.path = null;
    this.hover = false;
    this.aspects = ['Crop (focus on centre)', 'Crop (focus on top)', 'Stretch', 'Centre'];
    this.ids = ['Front', 'Back', 'Disc', 'Icon', 'Artist'];
    this.images = {
        shadow : _img('cd\\shadow.png'),
        case : _img('cd\\case.png'),
        semi : _img('cd\\semi.png'),
        gloss : _img('cd\\gloss.png')
    };
    this.properties = {
        aspect : new _p('2K3.ARTREADER.ASPECT', image.crop),
        gloss : new _p('2K3.ARTREADER.GLOSS', false),
        cd : new _p('2K3.ARTREADER.CD', false),
        id : new _p('2K3.ARTREADER.ID', 0),
        shadow : new _p('2K3.ARTREADER.SHADOW', false)
    };
    
    // ========================================================================================
    // 🔹 EXISTING METHODS (UNCHANGED)
    // ========================================================================================
    
    this.trace = (x, y) => {
        return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
    }

    this.lbtn_up = (x, y) => {
        if (this.trace(x, y)) {
            panel.item_focus_change();
        }
    }

    this.rbtn_up = (x, y) => {
        panel.m = window.CreatePopupMenu();
        panel.m.AppendMenuItem(MF_STRING, 1000, 'Reload');
        panel.m.AppendMenuSeparator();
        panel.m.AppendMenuItem(MF_STRING, 1001, 'CD jewel case');
        panel.m.CheckMenuItem(1001, this.properties.cd.enabled);
        if (this.properties.cd.enabled) {
            panel.m.AppendMenuItem(MF_STRING, 1002, 'Gloss effect');
            panel.m.CheckMenuItem(1002, this.properties.gloss.enabled);
            panel.m.AppendMenuItem(MF_STRING, 1003, 'Shadow effect');
            panel.m.CheckMenuItem(1003, this.properties.shadow.enabled);
        }
        panel.m.AppendMenuSeparator();
        panel.m.AppendMenuItem(MF_STRING, 1010, 'Front');
        panel.m.AppendMenuItem(MF_STRING, 1011, 'Back');
        panel.m.AppendMenuItem(MF_STRING, 1012, 'Disc');
        panel.m.AppendMenuItem(MF_STRING, 1013, 'Icon');
        panel.m.AppendMenuItem(MF_STRING, 1014, 'Artist');
        panel.m.CheckMenuRadioItem(1010, 1014, this.properties.id.value + 1010);
        panel.m.AppendMenuSeparator();
        panel.m.AppendMenuItem(MF_STRING, 1020, this.aspects[0]);
        panel.m.AppendMenuItem(MF_STRING, 1021, this.aspects[1]);
        panel.m.AppendMenuItem(MF_STRING, 1022, this.aspects[2]);
        panel.m.AppendMenuItem(MF_STRING, 1023, this.aspects[3]);
        panel.m.CheckMenuRadioItem(1020, 1023, this.properties.aspect.value + 1020);
        panel.m.AppendMenuSeparator();
        panel.m.AppendMenuItem(_isFile(this.path) ? MF_STRING : MF_GRAYED, 1030, 'Open containing folder');
        panel.m.AppendMenuSeparator();
        panel.m.AppendMenuItem(panel.metadb ? MF_STRING : MF_GRAYED, 1040, 'Google image search');
        panel.m.AppendMenuSeparator();
    }
    
    this.rbtn_up_done = (idx) => {
        switch (idx) {
        case 1000:
            panel.item_focus_change();
            break;
        case 1001:
            this.properties.cd.toggle();
            window.Repaint();
            break;
        case 1002:
            this.properties.gloss.toggle();
            window.RepaintRect(this.x, this.y, this.w, this.h);
            break;
        case 1003:
            this.properties.shadow.toggle();
            window.RepaintRect(this.x, this.y, this.w, this.h);
            break;
        case 1010:
        case 1011:
        case 1012:
        case 1013:
        case 1014:
            this.properties.id.value = idx - 1010;
            panel.item_focus_change();
            break;
        case 1020:
        case 1021:
        case 1022:
        case 1023:
            this.properties.aspect.value = idx - 1020;
            window.RepaintRect(this.x, this.y, this.w, this.h);
            break;
        case 1030:
            _explorer(this.path);
            break;
        case 1040:
            _run('https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(panel.tf('%album artist%[ %album%]')));
            break;
        }
    }
    
    this.key_down = (k) => {
        switch (k) {
        case VK_LEFT:
        case VK_UP:
            this.wheel(1);
            return true;
        case VK_RIGHT:
        case VK_DOWN:
            this.wheel(-1);
            return true;
        default:
            return false;
        }
    }
    
    this.move = (x, y) => {
        if (this.trace(x, y)) {
            if (this.hover != true) {
                this.hover = true;
                _tt(this.tooltip);
            }
            return true;
        } else {
            if (this.hover != false) {
                this.hover = false;
                _tt('');
            }
            return false;
        }
    }

    this.wheel = (s) => {
        if (s == 1) {
            fb.Prev();
        } else {
            fb.Next();
        }
    }
}

// ========================================================================================
// 🔹 SIMPLIFIED get_album_art FUNCTION (NO CACHING)
// ========================================================================================

let get_album_art = async (obj) => {
    if (!panel.metadb) return;
    
    try {
        var loadedArt = null;
        var artPath = '';
        
        // Try folder art first
        loadedArt = AlbumArtHelper.getFolderArt(panel.metadb);
        if (loadedArt) {
            artPath = 'folder art';
        } else {
            // Try embedded art
            loadedArt = AlbumArtHelper.getEmbeddedArt(panel.metadb, obj.properties.id.value);
            artPath = 'embedded art';
        }
        
        // If no art found, use fallback
        if (!loadedArt) {
            loadedArt = AlbumArtHelper.getFallbackImage('album');
            artPath = 'fallback image';
        }
        
        if (loadedArt) {
            // Resize if needed
            var maxSize = Math.min(obj.w, obj.h);
            if (maxSize > 0 && (loadedArt.Width > maxSize || loadedArt.Height > maxSize)) {
                var resized = loadedArt.Resize(maxSize, maxSize);
                loadedArt = resized;
            }
            
            // Update object
            obj.img = loadedArt;
            obj.path = panel.metadb.Path;
            obj.tooltip = 'Loaded from: ' + artPath + '\nDimensions: ' + loadedArt.Width + 'x' + loadedArt.Height + 'px';
            
            window.Repaint();
        }
    } catch (e) {
        console.log("❌ Error loading album art:", e.message);
        
        // Fallback to original async method
        let result = await utils.GetAlbumArtAsyncV2(window.ID, panel.metadb, obj.properties.id.value);
        if (panel.metadb && result.image) {
            obj.img = result.image;
            obj.path = result.path;
            obj.tooltip = 'Original dimensions: ' + obj.img.Width + 'x' + obj.img.Height + 'px';
            if (_isFile(obj.path)) {
                obj.tooltip += '\nPath: ' + obj.path;
                if (panel.metadb.Path != obj.path) {
                    obj.tooltip += '\nSize: ' + utils.FormatFileSize(utils.FileTest(obj.path, 's'));
                }
            }
        }
        window.Repaint();
    }
}

// ========================================================================================
// 🔹 GLOBAL HELPER FUNCTIONS FOR OTHER PANELS (SIMPLIFIED)
// ========================================================================================

// Easy access function for other panels to get album art (no caching)
function getAlbumArtAsync(metadb, size, callback, type) {
    var tempArt = new _albumart(0, 0, 100, 100);
    tempArt.getArtAsync(metadb, size, callback, type || 'album');
}

// Batch pre-load art for multiple metadbs (no caching)
function preloadAlbumArt(metadbs, size, progressCallback) {
    var loaded = 0;
    var total = metadbs.length;
    
    function loadNext() {
        if (loaded >= total) {
            if (progressCallback) progressCallback(total, total, true);
            return;
        }
        
        var metadb = metadbs[loaded];
        loaded++;
        
        getAlbumArtAsync(metadb, size, function(result) {
            if (progressCallback) progressCallback(loaded, total, false);
            setTimeout(loadNext, 10); // Small delay to prevent UI freezing
        });
    }
    
    loadNext();
}

console.log("✅ Simplified AlbumArt System Ready (No Caching)");