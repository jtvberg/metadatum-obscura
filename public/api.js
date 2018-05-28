//Event listener to execute API call on click
//Track ids injected for testing if no value entered
document.getElementById('execute-query').addEventListener('click', function () {
    var type = document.getElementById('inputGroupSelect01').value;
    var id = !document.getElementById('spotify-id').value ? '14KlyPJREBjS02AiIXCIqk%2C2LUGAmTUIgFyHPVWmFRzvw' : multiId(document.getElementById('spotify-id').value);
    runQuery(buildUrl(type, id, userid), type);
});

//Build the API URL
function buildUrl(type, id, uid) {
    uid = 'spotify'; //this is a test override while I figure out how I want to handle the playlist ownership
    var url = "https://api.spotify.com/v1/";
    switch (type) {
        case 'track':
            url += `tracks/${id}?market=${country}`;
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
        case 'playlists': //me can be problematic when looking up playist info for other owners
            url += `users/${uid}/playlists`
            //url += 'me/playlists';
            break;
        case 'playlistInfo':
            url += `users/${uid}/playlists/${id}`
            break;
        case 'playlistTracks':
            url += `users/${uid}/playlists/${id}/tracks`
            break;
        case 'features':
            url += `audio-features/${id}`
            break;
        default:
            url += `tracks?ids=${id}&market=${country}`;
            break;
    }
    console.log(url);
    return url;
}

//Replace commas with HTML code, remove white space
function multiId(input) {
    return input.replace(/ /g, "").replace(/,/g, "%2C");
}

//Hit Spotify API and return data object
function runQuery(url, type) {
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
            parseObj(data_obj, type);
            return data_obj;
        })
}

//Parse data object into handlebars template
function parseObj(obj, type) {
    console.log(obj);
    console.log(type);

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
            break;
        case 'tracks':
            source = $("#tracks-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ objects: obj.tracks });
            placeholderHeader.innerHTML = '';
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
            break;
        case 'album':
            source = $("#album-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ name: obj.name });
            placeholderHeader.innerHTML = '';
            break;
        case 'playlistInfo':
            source = $("#playlistInfo-template").html();
            template = Handlebars.compile(source);
            placeholderHeader.innerHTML = template({ 
                name: obj.name,
                description: obj.description,
                owner: obj.owner.id
            });
            runQuery(buildUrl('playlistTracks', obj.id), 'playlistTracks');
            break;
        case 'playlistTracks':
            source = $("#playlistTracks-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ objects: obj.items });
            break;
        case 'playlists':
            source = $("#playlists-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ objects: obj.items });
            placeholderHeader.innerHTML = '';
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
            break;
        default: //set to tracks for testing
            source = $("#tracks-template").html();
            template = Handlebars.compile(source);
            placeholder.innerHTML = template({ objects: obj.tracks });
            placeholderHeader.innerHTML = '';
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