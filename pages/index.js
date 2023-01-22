import React, { useEffect, useState } from "react";
import firebaseApp from "../firebase/clientApp";
import { useCollection } from "react-firebase-hooks/firestore";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";

const db = getFirestore(firebaseApp);

const setupLink = () => {
  const client_id = "d81bd20d4a5b49b1afedacc81eed3a32";
  const redirect_uri = "http://192.168.0.157:3000/";

  const state = (Math.random() + 1).toString(36).substring(7);

  if (typeof window !== "undefined") {
    localStorage.setItem("stateKey", state);
  }

  const scope = "user-read-private user-read-email playlist-modify-private";

  let url = "https://accounts.spotify.com/authorize";
  url += "?response_type=token";
  url += "&client_id=" + encodeURIComponent(client_id);
  url += "&scope=" + encodeURIComponent(scope);
  url += "&redirect_uri=" + encodeURIComponent(redirect_uri);
  url += "&state=" + encodeURIComponent(state);

  return url;
};

const getReturnedParams = () => {
  const hash = window.location.hash.substring(1);

  const result = hash.split("&").reduce(function (res, item) {
    var parts = item.split("=");
    res[parts[0]] = parts[1];
    return res;
  }, {});

  return result;
};

export default function IndexPage() {
  const [configUrl, setConfigUrl] = useState(() => setupLink());
  const [token, setToken] = useState(() => "");
  const [user, setUser] = useState(() => "");
  const [playlists, setPlaylists] = useState(() => []);
  const [selectedPlaylist, setSelectedPlaylist] = useState(() => {});
  const [songs, setSongs] = useState(() => []);
  const [password, setPassword] = useState(() => "");
  const [userId, setUserId] = useState(() => "");
  const [playlistUrl, setPlaylistUrl] = useState(() => null);
  const [playlistName, setPlaylistName] = useState(() => null);

  const [fbUsers, fbUsersLoading, fbUsersError] = useCollection(
    query(collection(db, "users"), where("groupPass", "==", password)),
    {}
  );

  useEffect(() => {
    if (window.location.hash && token === "") {
      const urlParams = getReturnedParams();
      setDoc(doc(db, "users", urlParams.access_token), {
        user_id: urlParams.access_token,
        playlist: [],
        groupPass: "",
        timestamp: new Timestamp(Math.round(Date.now() / 1000 + 86400), 0),
      });
      setToken(urlParams.access_token);
      fetch("https://api.spotify.com/v1/me/playlists", {
        headers: {
          Authorization: "Bearer " + urlParams.access_token,
        },
      })
        .then((r) => r.json())
        .then((data) => {
          console.log(data);
          setUserId(data.href.split("/")[5]);
          setPlaylists(data.items);
        });
    }
  });

  const handleUserChange = (e) => {
    setUser(e);
  };

  const handlePlaylistChange = (p) => {
    setSelectedPlaylist(p);
    fetch(p.tracks.href, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        setSongs(data.items);
        updateDoc(doc(db, "users", token), {
          playlist: data.items.map((s) => s.track.uri),
          groupPass: password,
        });
      });
  };

  const handleHostPassword = () => {
    setPassword(document.getElementById("passwordInput").value);
    updateDoc(doc(db, "users", token), {
      groupPass: document.getElementById("passwordInput").value,
    });
  };

  const generatePlaylist = () => {
    console.log(fbUsers.docs);
    const urlParams = getReturnedParams();
    let playlist = [];
    while (playlist.length < 10) {
      const randomUser =
        fbUsers.docs[Math.floor(Math.random() * fbUsers.docs.length)];

      const randomSong =
        randomUser?.data().playlist[
          Math.floor(Math.random() * randomUser.data().playlist.length)
        ];
      if (randomSong && !playlist.includes(randomSong)) {
        playlist.push(randomSong);
      }
    }
    fetch("https://api.spotify.com/v1/users/" + userId + "/playlists", {
      headers: {
        Authorization: "Bearer " + urlParams.access_token,
      },
      method: "POST",
      body: JSON.stringify({
        name:
          playlistName?.length ||
          `Bump List ${new Date().toISOString().slice(0, 10)}`,
        description: "Enjoy these tunes in this moment with these people",
        public: false,
      }),
    }).then((r) => {
      r.json().then((data) => {
        console.log(data);
        setPlaylistUrl(data.external_urls.spotify);
        fetch(
          "https://api.spotify.com/v1/playlists/" +
            data.id +
            "/tracks?uris=" +
            playlist.join(","),
          {
            headers: {
              Authorization: "Bearer " + urlParams.access_token,
            },
            method: "POST",
          }
        );
      });
    });
  };

  return (
    <div className="main">
      <h1>Bump</h1>
      <div class="sub-header">
        <p>DEMOCRATIC PLAYLIST GENERATOR</p>
        <p class="version-display">v0.0.2</p>
      </div>

      {token === "" ? (
        <a href={configUrl}>Login</a>
      ) : (
        <div>
          <input
            type="radio"
            id="user_type_host"
            name="user_type"
            onClick={() => handleUserChange("host")}
          />
          <label for="user_type_host">Host</label> <br />
          <input
            type="radio"
            id="user_type_guest"
            name="user_type"
            onClick={() => handleUserChange("guest")}
          />
          <label for="user_type_guest">Guest</label>
          <br />
          {user === "host" && (
            <div>
              <input
                type="text"
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Playlist Name"
                value={playlistName}
              />{" "}
              <button onClick={generatePlaylist}>Generate Playlist</button>
            </div>
          )}
          {playlistUrl && <a href={playlistUrl}>Open playlist</a>}
          <br />
          <input type="text" id="passwordInput" placeholder="password" />{" "}
          <button onClick={() => handleHostPassword()}>Set password</button>
          <br />
          <br />
          {playlists.map((n) => {
            return (
              <>
                <input
                  type="radio"
                  id={n.id}
                  key={n.id}
                  name="playlist"
                  onClick={() => handlePlaylistChange(n)}
                />
                <label htmlFor={n.id}>{n.name}</label>
                <br />
              </>
            );
          })}
          <br />
          <br />
          {/* {!fbSongsLoading && */}
          {/*   fbSongs && */}
          {/*   fbSongs.docs.map((doc) => console.log(doc.data()))} */}
        </div>
      )}
    </div>
  );
}
