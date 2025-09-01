// ========================================================================================
// 🧠 DATA MANAGER - CENTRAL DATA BRAIN (Phase 2)
// ========================================================================================

'use strict';

var DataManager = {
    // State management
    mode: 'playing', // 'playing' or 'selected'
    
    // Cached data (the "single source of truth")
    currentTrackInfo: null,
    albumTracks: [],
    artistAlbums: [],
    discList: [],
    
    // Track references  
    playingTrack: null,
    selectedTrack: null,
    
    // UI State
    selectedDiscNumber: 1,
    
    initialized: false,
    
    // ========================================================================================
    // 🔹 INITIALIZATION
    // ========================================================================================
    
    init: function() {
        if (this.initialized) return;
        
        console.log("🧠 Data Manager initializing...");
        this.initialized = true;
        
        // Start in playing mode
        this.setMode('playing');
        
        console.log("✅ Data Manager initialized");
    },
    
    // ========================================================================================
    // 🔹 MODE SWITCHING (Your 2-mode system)
    // ========================================================================================
    
    setMode: function(newMode) {
        if (newMode !== 'playing' && newMode !== 'selected') {
            console.log("❌ Invalid mode:", newMode);
            return;
        }
        
        this.mode = newMode;
        console.log("🎯 Mode switched to:", newMode);
        
        // Refresh data for new mode
        this.refreshAllData();
    },
    
    getCurrentTrack: function() {
        if (this.mode === 'selected' && this.selectedTrack) {
            return this.selectedTrack;
        }
        
        // Default to playing track
        return this.playingTrack || fb.GetNowPlaying();
    },
    
    // "Snap back" to playing track mode
    snapToPlaying: function() {
        this.setMode('playing');
        return this.getCurrentTrack();
    },
    
    // Select a specific track
    selectTrack: function(metadb) {
        if (!metadb) return;
        
        this.selectedTrack = metadb;
        this.setMode('selected');
        
        console.log("🎯 Track selected:", metadb.Path);
        return metadb;
    },
    
    // ========================================================================================
    // 🔹 SINGLE TRACK ANALYSIS (Your approach: analyze 1 track)
    // ========================================================================================
    
    analyzeCurrentTrack: function() {
        var track = this.getCurrentTrack();
        if (!track) {
            this.currentTrackInfo = null;
            return null;
        }
        
        try {
            var info = TitleFormatManager.getInfo(track);
            
            this.currentTrackInfo = {
                metadb: track,
                artist: leftPanelConfig.useAlbumArtist ? 
                       (info.albumartist || info.artist) : 
                       info.artist,
                album: info.album,
                title: info.title,
                year: info.year,
                trackNumber: parseInt(info.tracknumber) || 0,
                discNumber: parseInt(info.discnumber) || 1,
                rating: parseFloat(info.rating) || 0,
                length: info.length,
                genre: info.genre,
                path: info.path
            };
            
            console.log("🔍 Analyzed track:", this.currentTrackInfo.artist, "-", this.currentTrackInfo.title);
            return this.currentTrackInfo;
            
        } catch (e) {
            console.log("❌ Error analyzing track:", e.message);
            this.currentTrackInfo = null;
            return null;
        }
    },
    
    // ========================================================================================
    // 🔹 THE TWO MAIN QUERIES (Your approach: 2 queries total)
    // ========================================================================================
    
    // Query 1: Get all tracks in current album by current artist
    loadAlbumTracks: function() {
        if (!this.currentTrackInfo) {
            this.albumTracks = [];
            return [];
        }
        
        try {
            var artistField = leftPanelConfig.useAlbumArtist ? '%albumartist%' : '%artist%';
            var query = artistField + ' IS ' + _fbEscape(this.currentTrackInfo.artist) + 
                       ' AND %album% IS ' + _fbEscape(this.currentTrackInfo.album);
            
            var allItems = fb.GetLibraryItems();
            var trackList = fb.GetQueryItems(allItems, query);
            
            if (!trackList || trackList.Count === 0) {
                this.albumTracks = [];
                return [];
            }
            
            // Convert to track objects
            var tracks = [];
            for (var i = 0; i < trackList.Count; i++) {
                var metadb = trackList[i];
                if (metadb) {
                    var info = TitleFormatManager.getInfo(metadb);
                    tracks.push({
                        metadb: metadb,
                        title: info.title,
                        trackNumber: parseInt(info.tracknumber) || 0,
                        discNumber: parseInt(info.discnumber) || 1,
                        rating: parseFloat(info.rating) || 0,
                        length: info.length,
                        path: info.path
                    });
                }
            }
            
            // IMPROVED: Use lodash to sort tracks
            this.albumTracks = _.orderBy(tracks, ['discNumber', 'trackNumber']);
            
            console.log("💽 Loaded", this.albumTracks.length, "album tracks");
            return this.albumTracks;
            
        } catch (e) {
            console.log("❌ Error loading album tracks:", e.message);
            this.albumTracks = [];
            return [];
        }
    },
    
    // Query 2: Get all albums by current artist  
    loadArtistAlbums: function() {
        if (!this.currentTrackInfo) {
            this.artistAlbums = [];
            return [];
        }
        
        try {
            var artistField = leftPanelConfig.useAlbumArtist ? '%albumartist%' : '%artist%';
            var query = artistField + ' IS ' + _fbEscape(this.currentTrackInfo.artist);
            
            var allItems = fb.GetLibraryItems();
            var trackList = fb.GetQueryItems(allItems, query);
            
            if (!trackList || trackList.Count === 0) {
                this.artistAlbums = [];
                return [];
            }
            
            // Convert to album objects
            var tracks = [];
            for (var i = 0; i < trackList.Count; i++) {
                var metadb = trackList[i];
                if (metadb) {
                    var info = TitleFormatManager.getInfo(metadb);
                    var artist = leftPanelConfig.useAlbumArtist ? 
                                (info.albumartist || info.artist) : 
                                info.artist;
                    
                    if (info.album && info.album !== 'Unknown Album' && info.album !== '' && info.album !== '?') {
                        tracks.push({
                            album: info.album,
                            artist: artist,
                            year: info.year,
                            sampleTrack: metadb
                        });
                    }
                }
            }
            
            // IMPROVED: Use lodash for deduplication and sorting
            this.artistAlbums = _.orderBy(
                _.uniqBy(tracks, 'album'), 
                [function(album) { return parseInt(album.year) || 9999; }, 'album']
            );
            
            console.log("🎵 Loaded", this.artistAlbums.length, "artist albums");
            return this.artistAlbums;
            
        } catch (e) {
            console.log("❌ Error loading artist albums:", e.message);
            this.artistAlbums = [];
            return [];
        }
    },
    
    // ========================================================================================
    // 🔹 DERIVE PANEL DATA (Your approach: derive all views from 2 datasets)
    // ========================================================================================
    
    // Panel 1: Track info (just return analyzed track)
    getTrackInfo: function() {
        return this.currentTrackInfo;
    },
    
    // Panel 2: Tracks for selected disc
    getDiscTracks: function() {
        if (!this.albumTracks || this.albumTracks.length === 0) {
            return [];
        }
        
        // IMPROVED: Use lodash to filter by selected disc
        return _.filter(this.albumTracks, function(track) {
            return track.discNumber === DataManager.selectedDiscNumber;
        });
    },
    
    // Panel 3: Disc list (group album tracks by disc)  
    getDiscList: function() {
        if (!this.albumTracks || this.albumTracks.length === 0) {
            return [];
        }
        
        // IMPROVED: Use lodash to group by disc number
        var discGroups = _.groupBy(this.albumTracks, 'discNumber');
        
        // Convert to disc objects
        var discs = _.map(discGroups, function(tracks, discNumber) {
            return {
                discNumber: parseInt(discNumber),
                tracks: _.orderBy(tracks, ['trackNumber'])
            };
        });
        
        this.discList = _.orderBy(discs, ['discNumber']);
        return this.discList;
    },
    
    // Panel 4: Artist albums (just return loaded albums)
    getArtistAlbums: function() {
        return this.artistAlbums;
    },
    
    // ========================================================================================
    // 🔹 MAIN REFRESH FUNCTION (Your approach: analyze once, derive everything)
    // ========================================================================================
    
    refreshAllData: function() {
        console.log("🔄 Refreshing all data...");
        
        // Step 1: Analyze current track
        this.analyzeCurrentTrack();
        
        if (!this.currentTrackInfo) {
            console.log("⚠️ No track to analyze");
            this.albumTracks = [];
            this.artistAlbums = [];
            this.discList = [];
            return false;
        }
        
        // Step 2: Execute the 2 main queries
        this.loadAlbumTracks();
        this.loadArtistAlbums();
        
        // Step 3: Derive disc list (no extra query needed)
        this.getDiscList();
        
        console.log("✅ Data refresh complete");
        return true;
    },
    
    // ========================================================================================
    // 🔹 EVENT HANDLERS
    // ========================================================================================
    
    onTrackChange: function(metadb) {
        this.playingTrack = metadb;
        
        // If in playing mode, switch data to new track
        if (this.mode === 'playing') {
            this.refreshAllData();
        }
        
        console.log("🎵 Track changed, mode:", this.mode);
    },
    
    onAlbumSelected: function(album) {
        if (!album || !album.sampleTrack) return;
        
        // Find first track of selected album
        var firstTrack = this.findFirstTrackOfAlbum(album);
        if (firstTrack) {
            this.selectTrack(firstTrack);
        } else {
            this.selectTrack(album.sampleTrack);
        }
        
        // Reset disc selection
        this.selectedDiscNumber = 1;
    },
    
    onDiscSelected: function(discNumber) {
        this.selectedDiscNumber = discNumber;
        
        // Find first track of selected disc
        var discTracks = this.getDiscTracks();
        if (discTracks && discTracks.length > 0) {
            var firstTrack = _.minBy(discTracks, 'trackNumber');
            if (firstTrack) {
                this.selectTrack(firstTrack.metadb);
            }
        }
    },
    
    // ========================================================================================
    // 🔹 UTILITY FUNCTIONS
    // ========================================================================================
    
    findFirstTrackOfAlbum: function(album) {
        try {
            var artistField = leftPanelConfig.useAlbumArtist ? '%albumartist%' : '%artist%';
            var query = artistField + ' IS ' + _fbEscape(album.artist) + 
                       ' AND %album% IS ' + _fbEscape(album.album);
            
            var allItems = fb.GetLibraryItems();
            var trackList = fb.GetQueryItems(allItems, query);
            
            if (!trackList || trackList.Count === 0) return null;
            
            var tracks = [];
            for (var i = 0; i < trackList.Count; i++) {
                var metadb = trackList[i];
                if (metadb) {
                    var info = TitleFormatManager.getInfo(metadb);
                    tracks.push({
                        metadb: metadb,
                        discNumber: parseInt(info.discnumber) || 1,
                        trackNumber: parseInt(info.tracknumber) || 0
                    });
                }
            }
            
            // IMPROVED: Use lodash to find first track
            var firstTrack = _.minBy(tracks, function(track) {
                return (track.discNumber * 1000) + track.trackNumber;
            });
            
            return firstTrack ? firstTrack.metadb : null;
            
        } catch (e) {
            console.log("❌ Error finding first track:", e.message);
            return null;
        }
    }
};

console.log("✅ Data Manager Module Ready");