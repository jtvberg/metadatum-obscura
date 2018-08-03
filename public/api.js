//Event listener to execute API call on click
//Track ids injected for testing if no value entered

document.getElementById('execute-query').addEventListener('click', function () {
    var type = document.getElementById('inputGroupSelect01').value;
    var id = !document.getElementById('spotify-id').value ? '14KlyPJREBjS02AiIXCIqk%2C2LUGAmTUIgFyHPVWmFRzvw' : multiId(document.getElementById('spotify-id').value);
    if(id.includes(":")) {
        var ids = id.split(":");
        id = ids[0];
        uid = ids[1];
    } else {
        uid = userid;
    }
    runQuery(buildUrl(type, id, uid), type);
});

//Build the API URL
function buildUrl(type, id, uid) {
    var url = "https://api.spotify.com/v1/";
    switch (type) {
        case 'track':
            url += `tracks/${id}?market=${country}`;
            break;
        case 'features':
            url += `audio-features/${id}`
            break;
        case 'tracks':
            url += `tracks?ids=${id}&market=${country}`;
            break;
        case 'artist':
            url += `artists/${id}?market=${country}`;
            break;
        case 'album':
            url += `albums/${id}?market=${country}`;
            break;
        case 'playlists':
            url += `users/${uid}/playlists`
            break;
        case 'playlistInfo':
            url += `users/${uid}/playlists/${id}`
            break;
        case 'playlistTracks':
            url += `users/${uid}/playlists/${id}/tracks`
            break;
        case 'libTracks':
            url += `me/tracks`
            break;
        case 'libAlbums':
            url += `me/albums`
            break;
        default:
            url += `tracks?ids=${id}&market=${country}`;
            break;
    }
    return url;
}

//Replace commas with HTML code, remove white space
function multiId(input) {
    return input.replace(/ /g, "").replace(/,/g, "%2C");
}

//Hit Spotify API and return data object
function runQuery(url, type) {
    console.log(url);
    return fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
        },
    })
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            var data_obj = JSON.parse(data);
            console.log(data_obj);
            parseObj(data_obj, type);
            return data_obj;
        })
}

var next, tracks, playlists, playlistTracks, libTracks;
//Parse data object into handlebars template
function parseObj(obj, type) {

    var placeholderHeader = document.getElementById('resultsHeader');
    var placeholder = document.getElementById('results');
    var source, template;
    
    switch (type) {
        case 'track':
            source = $("#track-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({
                name: obj.name,
                duration_ms: obj.duration_ms,
                artist: obj.artists[0].name,
                album: obj.album.name,
                id: obj.id,
                popularity: obj.popularity,
                img: obj.album.images[2].url
            });
            placeholderHeader.innerHTML = '';
            tracks = null;
            playlists = null;
            playlistTracks = null;
            libTracks = null;
            break;
        case 'features':
            source = $("#features-template").html();
            template = Handlebars.compile(source);
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
                valence: obj.valence
            });
            placeholderHeader.innerHTML = '';
            tracks = null;
            playlists = null;
            playlistTracks = null;
            libTracks = null;
            break
        case 'tracks':
            if(!tracks) {
                tracks = obj.tracks;
            } else {
                for (i = 0; i < obj.tracks.length; i++) { 
                    tracks.push(obj.tracks[i]);
                }
            }
            source = $("#tracks-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ objects: tracks });
            placeholderHeader.innerHTML = '';
            playlists = null;
            playlistTracks = null;
            libTracks = null;
            if (obj.next) {
                runQuery(obj.next, type);
            }
            break;
        case 'artist':
            source = $("#artist-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ 
                name: obj.name,
                genres: obj.genres,
                popularity: obj.popularity,
                id: obj.id
            });
            placeholderHeader.innerHTML = '';
            tracks = null;
            playlists = null;
            playlistTracks = null;
            libTracks = null;
            break;
        case 'album':
            source = $("#album-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ name: obj.name });
            placeholderHeader.innerHTML = '';
            tracks = null;
            playlists = null;
            playlistTracks = null;
            libTracks = null;
            break;
        case 'playlists':
            source = $("#playlists-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ objects: obj.items });
            placeholderHeader.innerHTML = '';
            tracks = null;
            playlistTracks = null;
            libTracks = null;
            break;
        case 'playlistInfo':
            source = $("#playlistInfo-template").html();
            template = Handlebars.compile(source);
            placeholderHeader.innerHTML = template({ 
                name: obj.name,
                description: obj.description === '' ? 'NA' : obj.description,
                owner: obj.owner.id,
                tracks: obj.tracks.total
            });
            tracks = null;
            playlists = null;
            playlistTracks = null;
            libTracks = null;
            //runQuery(buildUrl('playlistTracks', obj.id), 'playlistTracks');
        case 'playlistTracks':
            if(!playlistTracks) {
                playlistTracks = obj.tracks.items;
                next = obj.tracks.next;
            } else {
                for (i = 0; i < obj.items.length; i++) { 
                    playlistTracks.push(obj.items[i]);
                }
                next = obj.next;
            }
            source = $("#playlistTracks-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ objects: playlistTracks });
            tracks = null;
            playlists = null;
            libTracks = null;
            if (next) {
                runQuery(next, 'playlistTracks');
            }
            break;
        case 'libTracks':
            if(!libTracks) {
                libTracks = obj.items;
            } else {
                for (i = 0; i < obj.items.length; i++) { 
                    libTracks.push(obj.items[i]);
                }
            }
            source = $("#libTracks-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ objects: libTracks });
            placeholderHeader.innerHTML = '';
            tracks = null;
            playlists = null;
            playlistTracks = null;
            if (obj.next) {
                runQuery(obj.next, type);
            }
            break;
        default: //set to tracks for testing
;           source = $("#tracks-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ objects: tracks });
            placeholderHeader.innerHTML = '';
            playlists = null;
            playlistTracks = null;
            libTracks = null;
            break;
    }
}

//Helper to convert milliseconds to mm:ss format
Handlebars.registerHelper('time', function (millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return new Handlebars.SafeString(
        minutes + ":" + (seconds < 10 ? '0' : '') + seconds
    );
});

//Attached to buttons to grab spotify id
var lookUpId = (val) => {
    document.getElementById('spotify-id').value = val.value;
}

var playById = (val) => {
    document.getElementById('player').src = "https://open.spotify.com/embed?uri=spotify:track:"+val.value;
}

var getPage = (val) => {
    
}