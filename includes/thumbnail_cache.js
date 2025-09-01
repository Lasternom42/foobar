'use strict';

// ========================================================================================
// 🔹 THUMBNAIL CACHE SYSTEM - STANDALONE MODULE
// ========================================================================================

// Global thumbnail cache object
var ThumbnailCache = {
    initialized: false,
    cachePath: '',
    memoryCache: {}, // In-memory cache for frequently used thumbnails
    maxMemoryItems: 50,
    
    // Configuration
    config: {
        defaultSizes: {
            disc: 64,
            album: 128,
            large: 256
        },
        cacheSubfolder: 'LM\\cache\\thumbnails\\',
        enableFileCache: true,
        enableMemoryCache: true
    }
};

// ========================================================================================
// 🔹 INITIALIZATION
// ========================================================================================

function initializeThumbnailCache() {
    if (ThumbnailCache.initialized) {
        console.log("⚠️ Thumbnail cache already initialized");
        return true;
    }
    
    try {
        // Set up cache directory in LM structure
        ThumbnailCache.cachePath = fb.ComponentPath + ThumbnailCache.config.cacheSubfolder;
        
        // Create directory structure if it doesn't exist
        var lmPath = fb.ComponentPath + 'LM\\';
        var cachePath = fb.ComponentPath + 'LM\\cache\\';
        
        if (!fso.FolderExists(lmPath)) {
            fso.CreateFolder(lmPath);
        }
        if (!fso.FolderExists(cachePath)) {
            fso.CreateFolder(cachePath);
        }
        if (!fso.FolderExists(ThumbnailCache.cachePath)) {
            fso.CreateFolder(ThumbnailCache.cachePath);
        }
        
        console.log("📁 Created thumbnail cache directory:", ThumbnailCache.cachePath);
        
        ThumbnailCache.initialized = true;
        console.log("✅ Thumbnail cache initialized:", ThumbnailCache.cachePath);
        
        return true;
        
    } catch (e) {
        console.log("❌ Failed to initialize thumbnail cache:", e.message);
        ThumbnailCache.initialized = false;
        return false;
    }
}

// ========================================================================================
// 🔹 CORE THUMBNAIL FUNCTIONS
// ========================================================================================

/**
 * Get or create a thumbnail for the given track
 * @param {Object} metadb - foobar2000 metadb object
 * @param {number} size - thumbnail size (64, 128, etc.)
 * @param {string} type - thumbnail type ('disc', 'album', 'large')
 * @returns {Object|null} - GDI image object or null
 */
function getThumbnail(metadb, size, type) {
    // Auto-initialize if needed
    if (!ThumbnailCache.initialized) {
        if (!initializeThumbnailCache()) {
            console.log("❌ Thumbnail cache not available");
            return null;
        }
    }
    
    if (!metadb) {
        console.log("❌ No metadb provided to getThumbnail");
        return null;
    }
    
    // Use default size if not specified
    if (!size) {
        size = ThumbnailCache.config.defaultSizes[type] || ThumbnailCache.config.defaultSizes.album;
    }
    
    try {
        // Generate cache key
        var artist = fb.TitleFormat('%artist%').EvalWithMetadb(metadb) || 'Unknown';
        var album = fb.TitleFormat('%album%').EvalWithMetadb(metadb) || 'Unknown';
        var cacheKey = sanitizeForFilename(artist) + '_' + sanitizeForFilename(album) + '_' + size;
        var cacheFile = ThumbnailCache.cachePath + cacheKey + '.png';
        
        // Check memory cache first (if enabled)
        if (ThumbnailCache.config.enableMemoryCache && ThumbnailCache.memoryCache[cacheKey]) {
            console.log("💾 Found thumbnail in memory cache:", cacheKey);
            return ThumbnailCache.memoryCache[cacheKey];
        }
        
        // Check file cache (if enabled)
        if (ThumbnailCache.config.enableFileCache && fso.FileExists(cacheFile)) {
            try {
                var cachedImage = gdi.Image(cacheFile);
                if (cachedImage) {
                    console.log("📁 Found thumbnail in file cache:", cacheKey);
                    // Add to memory cache
                    addToMemoryCache(cacheKey, cachedImage);
                    return cachedImage;
                }
            } catch (e) {
                // Cache file is corrupted, delete it
                console.log("🗑️ Corrupted cache file, deleting:", cacheFile);
                try {
                    fso.DeleteFile(cacheFile);
                } catch (e2) {}
            }
        }
        
        // Create new thumbnail
        console.log("🎨 Creating new thumbnail:", cacheKey);
        var thumbnail = createThumbnail(metadb, size, cacheFile);
        if (thumbnail) {
            addToMemoryCache(cacheKey, thumbnail);
            return thumbnail;
        }
        
    } catch (e) {
        console.log("❌ Error getting thumbnail:", e.message);
    }
    
    return null;
}

/**
 * Create a thumbnail from original album art
 * @param {Object} metadb - foobar2000 metadb object
 * @param {number} size - target size
 * @param {string} saveToFile - file path to save to (optional)
 * @returns {Object|null} - GDI image object or null
 */
function createThumbnail(metadb, size, saveToFile) {
    try {
        // Get original album art
        var originalImage = utils.GetAlbumArtV2(metadb, 0);
        if (!originalImage) {
            console.log("❌ No album art found for thumbnail creation");
            return null;
        }
        
        // Create thumbnail by resizing
        var thumbnail = originalImage.Resize(size, size);
        
        if (thumbnail && saveToFile && ThumbnailCache.config.enableFileCache) {
            // Save thumbnail to cache file
            try {
                thumbnail.SaveAs(saveToFile, 'image/png');
                console.log("💾 Saved thumbnail:", saveToFile);
            } catch (saveError) {
                console.log("❌ Failed to save thumbnail:", saveError.message);
            }
        }
        
        return thumbnail;
        
    } catch (e) {
        console.log("❌ Error creating thumbnail:", e.message);
        return null;
    }
}

/**
 * Get thumbnail with automatic sizing based on type
 * @param {Object} metadb - foobar2000 metadb object
 * @param {string} type - 'disc', 'album', or 'large'
 * @returns {Object|null} - GDI image object or null
 */
function getThumbnailByType(metadb, type) {
    var size = ThumbnailCache.config.defaultSizes[type] || ThumbnailCache.config.defaultSizes.album;
    return getThumbnail(metadb, size, type);
}

// ========================================================================================
// 🔹 UTILITY FUNCTIONS
// ========================================================================================

/**
 * Make text safe for use as filename
 * @param {string} text - input text
 * @returns {string} - sanitized filename
 */
function sanitizeForFilename(text) {
    if (!text) return 'unknown';
    
    return text
        .replace(/[\/\\|:*?"<>]/g, '_')  // Replace invalid chars
        .replace(/\s+/g, '_')           // Replace spaces
        .replace(/[^\w\-_]/g, '')       // Keep only alphanumeric, dash, underscore
        .substring(0, 50)               // Limit length
        .toLowerCase();
}

/**
 * Add image to memory cache with size limit
 * @param {string} key - cache key
 * @param {Object} image - GDI image object
 */
function addToMemoryCache(key, image) {
    if (!ThumbnailCache.config.enableMemoryCache || !image) return;
    
    // Remove oldest items if cache is full
    var keys = Object.keys(ThumbnailCache.memoryCache);
    if (keys.length >= ThumbnailCache.maxMemoryItems) {
        // Remove first item (oldest)
        delete ThumbnailCache.memoryCache[keys[0]];
        console.log("🗑️ Removed oldest item from memory cache");
    }
    
    ThumbnailCache.memoryCache[key] = image;
}

// ========================================================================================
// 🔹 CACHE MANAGEMENT
// ========================================================================================

/**
 * Clear memory cache
 */
function clearThumbnailMemoryCache() {
    ThumbnailCache.memoryCache = {};
    console.log("🗑️ Cleared thumbnail memory cache");
}

/**
 * Clear file cache
 */
function clearThumbnailFileCache() {
    if (!ThumbnailCache.initialized) return;
    
    try {
        var folder = fso.GetFolder(ThumbnailCache.cachePath);
        var files = new Enumerator(folder.Files);
        var deletedCount = 0;
        
        for (; !files.atEnd(); files.moveNext()) {
            try {
                files.item().Delete();
                deletedCount++;
            } catch (e) {
                console.log("❌ Failed to delete cache file:", e.message);
            }
        }
        
        console.log("🗑️ Cleared", deletedCount, "files from thumbnail file cache");
    } catch (e) {
        console.log("❌ Error clearing file cache:", e.message);
    }
}

/**
 * Clear both memory and file cache
 */
function clearAllThumbnailCache() {
    clearThumbnailMemoryCache();
    clearThumbnailFileCache();
}

/**
 * Get cache statistics
 * @returns {Object} - cache stats
 */
function getThumbnailCacheStats() {
    var stats = {
        initialized: ThumbnailCache.initialized,
        memoryItems: Object.keys(ThumbnailCache.memoryCache).length,
        maxMemoryItems: ThumbnailCache.maxMemoryItems,
        cachePath: ThumbnailCache.cachePath,
        fileItems: 0
    };
    
    // Count files in cache directory
    if (ThumbnailCache.initialized) {
        try {
            var folder = fso.GetFolder(ThumbnailCache.cachePath);
            var files = new Enumerator(folder.Files);
            
            for (; !files.atEnd(); files.moveNext()) {
                stats.fileItems++;
            }
        } catch (e) {
            console.log("❌ Error counting cache files:", e.message);
        }
    }
    
    return stats;
}

// ========================================================================================
// 🔹 BATCH OPERATIONS
// ========================================================================================

/**
 * Create thumbnails for all albums by the current artist
 * @param {Object} currentTrack - metadb object for reference track
 * @param {number} maxAlbums - maximum albums to process (default: 20)
 */
function createThumbnailsForCurrentArtist(currentTrack, maxAlbums) {
    if (!ThumbnailCache.initialized) {
        console.log("❌ Thumbnail cache not initialized");
        return;
    }
    
    if (!currentTrack) {
        console.log("❌ No current track for thumbnail creation");
        return;
    }
    
    maxAlbums = maxAlbums || 20; // Default limit
    
    try {
        // Get current artist
        var artist = fb.TitleFormat('%artist%').EvalWithMetadb(currentTrack) || '';
        if (!artist || artist.trim() === '') {
            console.log("❌ No artist found for thumbnail creation");
            return;
        }
        
        console.log("🎨 Creating thumbnails for artist:", artist);
        
        // Find all albums by this artist
        var query = '%artist% IS ' + artist;
        var allItems = fb.GetLibraryItems();
        var trackList = fb.GetQueryItems(allItems, query);
        
        if (!trackList || trackList.Count === 0) {
            console.log("❌ No tracks found for artist:", artist);
            return;
        }
        
        // Group tracks by album to find unique albums
        var albumMap = {};
        var processedCount = 0;
        
        for (var i = 0; i < trackList.Count; i++) {
            var metadb = trackList[i];
            if (metadb) {
                var albumName = fb.TitleFormat('%album%').EvalWithMetadb(metadb) || 'Unknown Album';
                
                if (!albumMap[albumName]) {
                    albumMap[albumName] = metadb; // Store one track per album
                }
            }
        }
        
        // Create thumbnails for each unique album
        var albumCount = 0;
        for (var albumName in albumMap) {
            if (albumMap.hasOwnProperty(albumName)) {
                albumCount++;
                var sampleTrack = albumMap[albumName];
                
                // Create both disc and album size thumbnails
                createThumbnailsForTrack(sampleTrack, albumName);
                processedCount++;
                
                // Limit processing to avoid UI freezing
                if (processedCount >= maxAlbums) {
                    console.log("⚠️ Processed " + maxAlbums + " albums, stopping to avoid UI freeze");
                    break;
                }
            }
        }
        
        console.log("✅ Created thumbnails for", processedCount, "albums by", artist);
        
    } catch (e) {
        console.log("❌ Error creating thumbnails for artist:", e.message);
    }
}

/**
 * Create thumbnails for a specific track (multiple sizes)
 * @param {Object} metadb - metadb object
 * @param {string} albumName - album name (optional)
 */
function createThumbnailsForTrack(metadb, albumName) {
    if (!metadb) return;
    
    try {
        // Check if we already have thumbnails
        var artist = fb.TitleFormat('%artist%').EvalWithMetadb(metadb) || 'Unknown';
        var album = albumName || fb.TitleFormat('%album%').EvalWithMetadb(metadb) || 'Unknown';
        
        var cacheKey64 = sanitizeForFilename(artist) + '_' + sanitizeForFilename(album) + '_64';
        var cacheKey128 = sanitizeForFilename(artist) + '_' + sanitizeForFilename(album) + '_128';
        
        var cacheFile64 = ThumbnailCache.cachePath + cacheKey64 + '.png';
        var cacheFile128 = ThumbnailCache.cachePath + cacheKey128 + '.png';
        
        var needsCreation = false;
        
        // Check if files already exist
        if (!fso.FileExists(cacheFile64)) {
            needsCreation = true;
        }
        if (!fso.FileExists(cacheFile128)) {
            needsCreation = true;
        }
        
        if (!needsCreation) {
            // Thumbnails already exist
            return;
        }
        
        // Get original album art
        var originalImage = utils.GetAlbumArtV2(metadb, 0);
        if (!originalImage) {
            // No album art available
            return;
        }
        
        // Create 64px thumbnail (for discs)
        if (!fso.FileExists(cacheFile64)) {
            try {
                var thumbnail64 = originalImage.Resize(64, 64);
                if (thumbnail64) {
                    thumbnail64.SaveAs(cacheFile64, 'image/png');
                    console.log("💾 Created 64px thumbnail:", albumName);
                }
            } catch (e) {
                console.log("❌ Failed to create 64px thumbnail:", e.message);
            }
        }
        
        // Create 128px thumbnail (for albums)
        if (!fso.FileExists(cacheFile128)) {
            try {
                var thumbnail128 = originalImage.Resize(128, 128);
                if (thumbnail128) {
                    thumbnail128.SaveAs(cacheFile128, 'image/png');
                    console.log("💾 Created 128px thumbnail:", albumName);
                }
            } catch (e) {
                console.log("❌ Failed to create 128px thumbnail:", e.message);
            }
        }
        
    } catch (e) {
        console.log("❌ Error creating thumbnails for track:", e.message);
    }
}

/**
 * Batch create thumbnails for random albums (background processing)
 * @param {number} maxAlbums - maximum albums to process (default: 10)
 */
function batchCreateThumbnails(maxAlbums) {
    if (!ThumbnailCache.initialized) {
        if (!initializeThumbnailCache()) {
            return;
        }
    }
    
    maxAlbums = maxAlbums || 10; // Default to 10 albums
    
    try {
        console.log("🎨 Starting batch thumbnail creation for", maxAlbums, "albums");
        
        var allItems = fb.GetLibraryItems();
        if (!allItems || allItems.Count === 0) {
            return;
        }
        
        // Sample random tracks to find albums
        var processedAlbums = {};
        var createdCount = 0;
        var maxAttempts = Math.min(allItems.Count, maxAlbums * 10); // Don't check too many
        
        for (var i = 0; i < maxAttempts && createdCount < maxAlbums; i++) {
            var randomIndex = Math.floor(Math.random() * allItems.Count);
            var metadb = allItems[randomIndex];
            
            if (metadb) {
                var albumName = fb.TitleFormat('%album%').EvalWithMetadb(metadb) || 'Unknown Album';
                var artist = fb.TitleFormat('%artist%').EvalWithMetadb(metadb) || 'Unknown Artist';
                var albumKey = artist + ' - ' + albumName;
                
                if (!processedAlbums[albumKey]) {
                    processedAlbums[albumKey] = true;
                    
                    // Check if thumbnails already exist
                    var cacheKey = sanitizeForFilename(artist) + '_' + sanitizeForFilename(albumName) + '_128';
                    var cacheFile = ThumbnailCache.cachePath + cacheKey + '.png';
                    
                    if (!fso.FileExists(cacheFile)) {
                        createThumbnailsForTrack(metadb, albumName);
                        createdCount++;
                    }
                }
            }
        }
        
        console.log("✅ Batch created thumbnails for", createdCount, "new albums");
        
    } catch (e) {
        console.log("❌ Error in batch thumbnail creation:", e.message);
    }
}

// ========================================================================================
// 🔹 CONFIGURATION
// ========================================================================================

/**
 * Configure thumbnail cache settings
 * @param {Object} config - configuration object
 */
function configureThumbnailCache(config) {
    if (config.defaultSizes) {
        ThumbnailCache.config.defaultSizes = Object.assign(ThumbnailCache.config.defaultSizes, config.defaultSizes);
    }
    if (config.maxMemoryItems !== undefined) {
        ThumbnailCache.maxMemoryItems = config.maxMemoryItems;
    }
    if (config.enableFileCache !== undefined) {
        ThumbnailCache.config.enableFileCache = config.enableFileCache;
    }
    if (config.enableMemoryCache !== undefined) {
        ThumbnailCache.config.enableMemoryCache = config.enableMemoryCache;
    }
    
    console.log("🔧 Thumbnail cache configuration updated");
}

console.log("✅ Thumbnail Cache Module Ready");