//Event listener to execute API call on click
//Track ids injected for testing if no value entered
document.getElementById('execute-query').addEventListener('click', function () {
    var type = document.getElementById('inputGroupSelect01').value
    var id = !document.getElementById('spotify-id').value ?
        '14KlyPJREBjS02AiIXCIqk%2C2LUGAmTUIgFyHPVWmFRzvw' :
        multiId(document.getElementById('spotify-id').value)
    if (id.includes(':')) {
        var ids = id.split(':')
        id = ids[0]
        uid = ids[1]
    } else {
        uid = userid
    }
    runQuery(buildUrl(type, id, uid), type)
})
//Build the API URL
function buildUrl(type, id, uid) {
    var url = 'https://api.spotify.com/v1/'
    switch (type) {
        case 'track':
            url += `tracks/${id}?market=${country}`
            break
        case 'features':
            url += `audio-features/${id}`
            break
        case 'tracks':
            url += `tracks?ids=${id}&market=${country}`
            break
        case 'artist':
            url += `artists/${id}?market=${country}`
            break
        case 'album':
            url += `albums/${id}?market=${country}`
            break
        case 'playlists':
            url += `users/${uid}/playlists?limit=50`
            break
        case 'playlistInfo':
            url += `users/${uid}/playlists/${id}`
            break
        case 'playlistTracks':
            url += `users/${uid}/playlists/${id}/tracks`
            break
        case 'libTracks':
            url += `me/tracks`
            break
        case 'libAlbums':
            url += `me/albums`
            break
        default:
            url += `tracks?ids=${id}&market=${country}`
            break
    }
    return url
}
//Replace commas with HTML code, remove white space
function multiId(input) {
    return input.replace(/ /g, '').replace(/,/g, '%2C')
}
//Hit Spotify API and return data object
function runQuery(url, type) {
    console.log(url)
    return fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
            },
        })
        .then(function (response) {
            return response.text()
        })
        .then(function (data) {
            var data_obj = JSON.parse(data)
            console.log(data_obj)
            parseObj(data_obj, type)
            return data_obj
        })
}

var next, tracks, playlists, playlistTracks, libTracks, currentPlaylist = [], currentTrackIndex = -1
//Parse data object into handlebars template
function parseObj(obj, type) {
    var placeholderHeader = document.getElementById('resultsHeader')
    var placeholder = document.getElementById('results')
    var source, template

    switch (type) {
        case 'track':
            source = $('#track-template').html()
            template = Handlebars.compile(source)
            placeholder.innerHTML = template({
                name: obj.name,
                duration_ms: obj.duration_ms,
                artist: obj.artists[0].name,
                album: obj.album.name,
                id: obj.id,
                popularity: obj.popularity,
                img: obj.album.images[2].url,
            })
            placeholderHeader.innerHTML = ''
            tracks = null
            playlists = null
            playlistTracks = null
            libTracks = null
            break
        case 'features':
            source = $('#features-template').html()
            template = Handlebars.compile(source)
            placeholder.innerHTML = template({
                acousticness: obj.acousticness,
                danceability: obj.danceability,
                duration_ms: obj.duration_ms,
                energy: obj.energy,
                instrumentalness: obj.instrumentalness,
                key: obj.key,
                liveness: obj.liveness,
                loudness: obj.loudness,
                mode: obj.mode,
                speechiness: obj.speechiness,
                tempo: obj.tempo,
                time_signature: obj.time_signature,
                valence: obj.valence,
            })
            placeholderHeader.innerHTML = ''
            tracks = null
            playlists = null
            playlistTracks = null
            libTracks = null
            break
        case 'tracks':
            console.log(obj.tracks)
            if (!tracks) {
                tracks = obj.tracks
            } else {
                for (i = 0; i < obj.tracks.length; i++) {
                    if (!checkDupe(obj.tracks[i].id)) {
                        tracks.push(obj.tracks[i])
                    }
                }
            }
            console.log(tracks)
            source = $('#tracks-template').html()
            template = Handlebars.compile(source)
            placeholder.innerHTML = template({
                objects: tracks,
            })
            placeholderHeader.innerHTML = ''
            playlists = null
            playlistTracks = null
            libTracks = null
            if (obj.next) {
                runQuery(obj.next, type)
            }
            break
        case 'artist':
            source = $('#artist-template').html()
            template = Handlebars.compile(source)
            placeholder.innerHTML = template({
                name: obj.name,
                genres: obj.genres,
                popularity: obj.popularity,
                id: obj.id,
            })
            placeholderHeader.innerHTML = ''
            tracks = null
            playlists = null
            playlistTracks = null
            libTracks = null
            break
        case 'album':
            source = $('#album-template').html()
            template = Handlebars.compile(source)
            placeholder.innerHTML = template({
                name: obj.name,
            })
            placeholderHeader.innerHTML = ''
            tracks = null
            playlists = null
            playlistTracks = null
            libTracks = null
            break
        case 'playlists':
            source = $('#playlists-template').html()
            template = Handlebars.compile(source)
            placeholder.innerHTML = template({
                objects: obj.items,
            })
            placeholderHeader.innerHTML = ''
            tracks = null
            playlistTracks = null
            libTracks = null
            break
        case 'playlistInfo':
            source = $('#playlistInfo-template').html()
            template = Handlebars.compile(source)
            placeholderHeader.innerHTML = template({
                name: obj.name,
                description: obj.description === '' ? 'NA' : obj.description,
                owner: obj.owner.id,
                tracks: obj.tracks.total,
            })
            tracks = null
            playlists = null
            playlistTracks = null
            libTracks = null
            //runQuery(buildUrl('playlistTracks', obj.id), 'playlistTracks');
        case 'playlistTracks':
            if (!playlistTracks) {
                playlistTracks = obj.tracks.items
                next = obj.tracks.next
            } else {
                for (i = 0; i < obj.items.length; i++) {
                    playlistTracks.push(obj.items[i])
                }
                next = obj.next
            }
            source = $('#playlistTracks-template').html()
            template = Handlebars.compile(source)
            placeholder.innerHTML = template({
                objects: playlistTracks,
            })
            tracks = null
            playlists = null
            libTracks = null
            if (next) {
                runQuery(next, 'playlistTracks')
            }
            break
        case 'libTracks':
            if (!libTracks) {
                libTracks = obj.items
            } else {
                for (i = 0; i < obj.items.length; i++) {
                    libTracks.push(obj.items[i])
                }
            }
            source = $('#libTracks-template').html()
            template = Handlebars.compile(source)
            placeholder.innerHTML = template({
                objects: libTracks,
            })
            placeholderHeader.innerHTML = ''
            tracks = null
            playlists = null
            playlistTracks = null
            if (obj.next) {
                runQuery(obj.next, type)
            }
            break
        default:
            //set to tracks for testing
            source = $('#tracks-template').html()
            template = Handlebars.compile(source)
            placeholder.innerHTML = template({
                objects: tracks,
            })
            placeholderHeader.innerHTML = ''
            playlists = null
            playlistTracks = null
            libTracks = null
            break
    }
}
//0Zt18U2PgV39wE4xTaXj2f
var checkDupe = (val) => {
    for (i = 0; i < tracks.length; i++) {
        if (val === tracks[i].id) {
            return true
        }
    }
    return false
}
//Helper to convert milliseconds to mm:ss format
Handlebars.registerHelper('time', function (millis) {
    var minutes = Math.floor(millis / 60000)
    var seconds = ((millis % 60000) / 1000).toFixed(0)
    return new Handlebars.SafeString(
        minutes + ':' + (seconds < 10 ? '0' : '') + seconds
    )
})
//Attached to buttons to grab spotify id
var lookUpId = (val) => {
    document.getElementById('spotify-id').value = val.value
}

var playById = (val) => {
    document.getElementById('player').src =
        'https://open.spotify.com/embed?uri=spotify:track:' + val.value
}

var getPage = (val) => {}

// Spotify Web Playback SDK functions
function initializePlayer() {
    if (!window.Spotify) {
        console.error('Spotify SDK not loaded');
        return;
    }

    player = new Spotify.Player({
        name: 'Metadatum Obscura Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize:', message);
    });

    player.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate:', message);
    });

    player.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account:', message);
    });

    player.addListener('playback_error', ({ message }) => {
        console.error('Failed to perform playback:', message);
    });

    // Playback status updates
    player.addListener('player_state_changed', state => {
        if (!state) {
            // When state is null, playback has ended
            resetAllPlayButtons();
            return;
        }
        
        updatePlayerUI(state);
        console.log('Player state changed:', state);
        
        // Update play buttons based on current track
        if (state.track_window.current_track) {
            const currentTrackId = state.track_window.current_track.id;
            if (state.paused) {
                resetAllPlayButtons();
            } else {
                updatePlayButtons(currentTrackId);
            }
        }
    });

    // Ready
    player.addListener('ready', ({ device_id: id }) => {
        console.log('Ready with Device ID', id);
        device_id = id;
        document.getElementById('device-status').textContent = `Connected to device: ${id}`;
        document.getElementById('player-controls').style.display = 'block';
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id: id }) => {
        console.log('Device ID has gone offline', id);
        document.getElementById('device-status').textContent = 'Device offline';
    });

    // Connect to the player
    player.connect().then(success => {
        if (success) {
            console.log('Successfully connected to Spotify!');
        }
    });
}

// Play a specific track
function playTrack(trackId, playlistContext = null) {
    if (!device_id) {
        alert('Player not ready. Please wait for connection to Spotify.');
        return;
    }

    // Set up playlist context for next/previous functionality
    if (playlistContext) {
        currentPlaylist = playlistContext;
        currentTrackIndex = currentPlaylist.findIndex(track => {
            // Handle different data structures
            const id = track.id || (track.track && track.track.id);
            return id === trackId;
        });
    } else {
        // Try to find the track in existing data
        if (tracks) {
            currentPlaylist = tracks;
            currentTrackIndex = tracks.findIndex(track => track.id === trackId);
        } else if (playlistTracks) {
            currentPlaylist = playlistTracks;
            currentTrackIndex = playlistTracks.findIndex(item => item.track.id === trackId);
        } else if (libTracks) {
            currentPlaylist = libTracks;
            currentTrackIndex = libTracks.findIndex(item => item.track.id === trackId);
        }
    }

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            uris: [`spotify:track:${trackId}`]
        })
    }).then(response => {
        if (response.ok) {
            console.log('Track started playing');
            updatePlayButtons(trackId);
        } else {
            console.error('Failed to play track:', response.status);
            response.text().then(text => console.error('Error details:', text));
        }
    }).catch(error => {
        console.error('Error playing track:', error);
    });
}

// Toggle play/pause
function togglePlayback() {
    player.togglePlay().then(() => {
        console.log('Toggled playback');
    });
}

// Previous track
function previousTrack() {
    if (currentPlaylist.length === 0 || currentTrackIndex <= 0) {
        console.log('No previous track available');
        return;
    }
    
    currentTrackIndex--;
    const prevTrack = currentPlaylist[currentTrackIndex];
    const trackId = prevTrack.id || (prevTrack.track && prevTrack.track.id);
    
    if (trackId) {
        playTrack(trackId, currentPlaylist);
    }
}

// Next track
function nextTrack() {
    if (currentPlaylist.length === 0 || currentTrackIndex >= currentPlaylist.length - 1) {
        console.log('No next track available');
        return;
    }
    
    currentTrackIndex++;
    const nextTrack = currentPlaylist[currentTrackIndex];
    const trackId = nextTrack.id || (nextTrack.track && nextTrack.track.id);
    
    if (trackId) {
        playTrack(trackId, currentPlaylist);
    }
}

// Update player UI
function updatePlayerUI(state) {
    if (!state || !state.track_window || !state.track_window.current_track) {
        // Clear the current track info when no track is playing
        document.getElementById('current-track-info').innerHTML = '<small class="text-muted">No track playing</small>';
        
        // Update play/pause button to play state
        const playPauseBtn = document.getElementById('play-pause-btn');
        const icon = playPauseBtn.querySelector('i');
        icon.className = 'fa fa-play';
        return;
    }

    const track = state.track_window.current_track;
    const isPlaying = !state.paused;
    
    // Update current track info
    document.getElementById('current-track-info').innerHTML = `
        <strong>${track.name}</strong><br>
        <small>${track.artists.map(artist => artist.name).join(', ')} • ${track.album.name}</small>
    `;
    
    // Update play/pause button
    const playPauseBtn = document.getElementById('play-pause-btn');
    const icon = playPauseBtn.querySelector('i');
    if (isPlaying) {
        icon.className = 'fa fa-pause';
    } else {
        icon.className = 'fa fa-play';
    }
    
    // Update next/previous button states
    updateNavigationButtons();
}

// Reset all play buttons to play state
function resetAllPlayButtons() {
    document.querySelectorAll('[id^="play-btn-"]').forEach(btn => {
        btn.innerHTML = '<i class="fa fa-play"></i>';
        btn.className = 'btn btn-success';
    });
}

// Update play button states
function updatePlayButtons(currentTrackId) {
    // Reset all play buttons first
    resetAllPlayButtons();
    
    // Update current playing button
    const currentBtn = document.getElementById(`play-btn-${currentTrackId}`);
    if (currentBtn) {
        currentBtn.innerHTML = '<i class="fa fa-pause"></i>';
        currentBtn.className = 'btn btn-warning';
    }
}

// Update next/previous button states based on current position
function updateNavigationButtons() {
    const prevBtn = document.querySelector('button[onclick="previousTrack()"]');
    const nextBtn = document.querySelector('button[onclick="nextTrack()"]');
    
    if (prevBtn) {
        prevBtn.disabled = (currentPlaylist.length === 0 || currentTrackIndex <= 0);
    }
    
    if (nextBtn) {
        nextBtn.disabled = (currentPlaylist.length === 0 || currentTrackIndex >= currentPlaylist.length - 1);
    }
}

window.onSpotifyWebPlaybackSDKReady = () => {};